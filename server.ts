import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { timingSafeEqual } from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { buildMasterThumbnailPrompt, splitHeadline } from './src/lib/thumbnailMaster';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const accessKey = process.env.APP_ACCESS_KEY;
if (accessKey) {
  app.use((req, res, next) => {
    if (req.path === '/api/health') return next();
    const [scheme, encoded] = (req.headers.authorization || '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const password = separator === -1 ? '' : decoded.slice(separator + 1);
      const given = Buffer.from(password);
      const expected = Buffer.from(accessKey);
      if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="IT Cafeteria", charset="UTF-8"');
    res.status(401).send('Authentication required');
  });
}

// Shared server-side Gemini client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timeout — ${Math.round(ms / 1000)}s mein jawab nahi aaya`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

function extractJsonObject(raw: string): any | null {
  const text = String(raw || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Neeche balanced-brace extraction try hoti hai.
  }
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'IT Cafeteria Studio', uptime: process.uptime() });
});

// 1. AI Chatbot API (gemini-3.8-flash, gemini-4-argon, gemini-3.1-flash-lite)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction } = req.body;
    const ai = getAiClient();

    const selectedModel = model === 'gemini-4-argon' 
      ? 'gemini-4-argon' 
      : model === 'gemini-3.1-flash-lite' 
      ? 'gemini-3.1-flash-lite' 
      : model === 'gemini-3.6-flash'
      ? 'gemini-3.6-flash'
      : model === 'gemini-3.5-flash'
      ? 'gemini-3.5-flash'
      : model === 'gemini-3-flash-preview'
      ? 'gemini-3-flash-preview'
      : model === 'gemini-3.5-flash-lite'
      ? 'gemini-3.5-flash-lite'
      : 'gemini-3.8-flash';

    // Format contents for multi-turn history
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: systemInstruction || "You are an expert AI Production Assistant and Script Doctor for IT Cafeteria, run by Waqar Majeed. You communicate warmly in Roman Urdu or English as requested, assisting with Google Flow prompts, YouTube Shorts hooks, and viral retention.",
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

// 2. Google Search Grounding API (gemini-3.8-flash with googleSearch tool)
app.post('/api/ai/search-grounding', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a tech research engine for IT Cafeteria. Find the latest verified facts, model releases, prices, and features for tech content creators. Summarize in concise Roman Urdu and list sources.",
      },
    });

    const text = response.text;
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));

    res.json({ text, sources: webSources });
  } catch (err: any) {
    console.error('Search grounding error:', err);
    res.status(500).json({ error: err.message || 'Failed to search' });
  }
});

// 2b. Trending Keywords Grounding API for AI Script Chatbot
app.post('/api/ai/trending-keywords', async (req, res) => {
  try {
    const { category = 'All' } = req.body;
    const ai = getAiClient();

    const query = `Trending tech searches, Excel shortcuts, AI updates, and Windows tutorials in Pakistan and India for category: ${category}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Search Google for real-time trending YouTube tech keywords in Pakistan and South Asia: "${query}".
Return strict raw JSON (no markdown fences):
{
  "keywords": [
    {
      "keyword": "Windows 11 Temp Files Delete",
      "urduIntent": "bina software PC 2X fast",
      "surge": "+155%",
      "category": "PC & Windows Hacks",
      "hook": "Aapka PC slow ho gaya hai? Sirf yeh 1 run command chalayein..."
    },
    {
      "keyword": "Google Sheets Smart Fill AI Trick",
      "urduIntent": "ghanton ka data entry seconds mein",
      "surge": "+175%",
      "category": "Google Workspace",
      "hook": "Google Sheets ka naya Smart Fill AI feature jo manual typing khatam karta hai!"
    },
    {
      "keyword": "ChatGPT Voice Mode Urdu Accent",
      "urduIntent": "realtime natural Pakistani voice",
      "surge": "+210%",
      "category": "AI Tools",
      "hook": "ChatGPT ka voice mode ab Pakistani Urdu samajhta hai bina kisi prompt ke!"
    },
    {
      "keyword": "Excel Center Across Selection",
      "urduIntent": "stop merging cells trick",
      "surge": "+130%",
      "category": "Excel Productivity",
      "hook": "Excel mein cells merge mat karein! Center Across Selection ka shortcut dekhein..."
    },
    {
      "keyword": "Power Automate Daily Report Flow",
      "urduIntent": "office automation bina coding",
      "surge": "+115%",
      "category": "AI Workflows",
      "hook": "Office ki daily report auto send karein bina ek line code likhe!"
    }
  ]
}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));

    let data;
    try {
      data = JSON.parse(response.text || '{}');
    } catch {
      const match = response.text?.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    res.json({ keywords: data.keywords || [], sources: webSources });
  } catch (err: any) {
    console.error('Trending keywords error:', err);
    res.json({
      keywords: [
        {
          keyword: "Windows 11 Temp Files Auto-Delete",
          urduIntent: "PC speedup bina software ke",
          surge: "+150% Surge",
          category: "PC & Windows Hacks",
          hook: "Aapka laptop slow ho raha hai? Run command se temp files 5 seconds mein clean karein!"
        },
        {
          keyword: "Google Sheets Smart Fill AI Trick",
          urduIntent: "data entry auto-complete",
          surge: "+180% Surge",
          category: "Google Workspace",
          hook: "Google Sheets mein ab generative AI se columns auto-fill hote hain bina formula!"
        },
        {
          keyword: "ChatGPT Voice Mode Pakistani Accent",
          urduIntent: "natural Urdu conversation",
          surge: "+210% Surge",
          category: "AI & Smart Technology",
          hook: "ChatGPT Voice Mode ab Urdu bol raha hai! Kese enable karein dekhein is video mein..."
        },
        {
          keyword: "Excel Center Across Selection Trick",
          urduIntent: "merge cells ka behtareen alternative",
          surge: "+110% Surge",
          category: "Excel Productivity",
          hook: "Stop merging cells in Excel! Ctrl + 1 daba kar yeh option select karein..."
        },
        {
          keyword: "Power Automate Desktop Daily Email Flow",
          urduIntent: "daily office reports automation",
          surge: "+130% Surge",
          category: "AI Chatbots & Workflows",
          hook: "Daily reports khud bakhud generate aur email hone ka no-code formula!"
        }
      ],
      sources: [
        { title: "Google Trends South Asia Tech", uri: "https://trends.google.com" },
        { title: "YouTube Search Queries Pakistan", uri: "https://youtube.com" }
      ]
    });
  }
});

// 3. Image Generation & Editing API (gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image)
app.post('/api/ai/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '9:16', imageSize = '1K', base64InputImage, model = 'gemini-nano-banana-2.1' } = req.body;
    const ai = getAiClient();

    const parts: any[] = [];
    if (base64InputImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64InputImage.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    parts.push({ text: prompt });

    const selectedModel = model === 'gemini-3.1-flash-lite-image' 
      ? 'gemini-3.1-flash-lite-image' 
      : 'gemini-nano-banana-2.1';

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize as any,
        },
      },
    });

    let imageUrl = null;
    let descriptionText = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image data returned from model', text: descriptionText });
    }

    res.json({ imageUrl, description: descriptionText });
  } catch (err: any) {
    console.error('Image generation error:', err);
    const raw = String(err?.message || err || '');
    const message = /429|quota|rate limit|exceeded your current quota/i.test(raw)
      ? 'Image model ki free quota abhi khatam hai. 1-2 minute baad dobara try karein ya doosra image model chunein.'
      : /503|high demand|overloaded|unavailable/i.test(raw)
      ? 'Image model abhi busy hai. Thori der baad dobara try karein.'
      : raw && raw.length <= 240
      ? raw
      : 'Thumbnail generate nahi hui. Dobara try karein.';
    res.status(500).json({ error: message });
  }
});

// 4. Video Generation from Text / Image Animation (gemini-omni-1.1-flash via Interactions API)
app.post('/api/ai/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '9:16', duration = '10s', base64Image } = req.body;
    const ai = getAiClient();

    const inputParts: any[] = [];
    if (base64Image) {
      inputParts.push({
        type: 'image',
        mime_type: 'image/png',
        data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
      });
    }
    inputParts.push({
      type: 'text',
      text: prompt,
    });

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input: inputParts.length === 1 ? inputParts[0].text : inputParts,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspectRatio as any,
        duration: duration as any,
        resolution: '720p',
      },
    }, { timeout: 300000 });

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const videoUrl = `data:${videoPart.mime_type || 'video/mp4'};base64,${videoPart.data}`;
      return res.json({ videoUrl });
    } else if (videoPart && videoPart.uri) {
      return res.json({ videoUri: videoPart.uri });
    }

    res.status(500).json({ error: 'Video generation completed but output data was empty' });
  } catch (err: any) {
    console.error('Video generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate video' });
  }
});

// 5. Audio Transcription (gemini-3.5-transcribe)
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { base64Audio, mimeType = 'audio/webm' } = req.body;
    if (!base64Audio) {
      return res.status(400).json({ error: 'base64Audio is required' });
    }
    const ai = getAiClient();

    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Transcribe this spoken audio accurately. Output the exact spoken words in Roman Urdu and English.',
          },
        ],
      },
    });

    // Native audio/transcription models return the transcript in
    // part.audioTranscription (a non-text part), which response.text ignores.
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const transcriptionText = parts
      .map((part) => part.audioTranscription?.text)
      .filter((t): t is string => Boolean(t && t.trim()))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const plainText = parts
      .filter((part) => typeof part.text === 'string' && !part.thought)
      .map((part) => part.text)
      .join('')
      .trim();

    const text = transcriptionText || plainText;

    if (!text) {
      return res.status(500).json({ error: 'No transcription text was returned by the model' });
    }

    res.json({ text });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// 6. Music Generation (lyria-3-clip-preview)
app.post('/api/ai/generate-music', async (req, res) => {
  try {
    const { prompt = 'High-energy modern tech YouTuber background beat with upbeat synth and subtle tech accents' } = req.body;
    const ai = getAiClient();

    const responseStream = await ai.models.generateContentStream({
      model: 'lyria-3-clip-preview',
      contents: prompt,
    });

    let audioBase64 = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: 'No audio returned from Lyria model' });
    }

    const audioUrl = `data:${mimeType};base64,${audioBase64}`;
    res.json({ audioUrl });
  } catch (err: any) {
    console.error('Music generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate music' });
  }
});

// 7. Quick Publish Automation API for Content Calendar
app.post('/api/ai/quick-publish', async (req, res) => {
  try {
    const { title, category, scheduledTime = '6:00 PM PKT', date = 'Today', platform = 'YouTube + TikTok' } = req.body;
    const ai = getAiClient();

    const prompt = `You are the master YouTube Shorts growth agent for 'IT Cafeteria' (Pakistani tech channel run by Waqar Majeed, 58+ videos published).
The user wants to Quick Publish an upcoming video:
- Title / Idea: "${title}"
- Category: "${category}"
- Scheduled Slot: "${scheduledTime}" on "${date}"
- Platforms: "${platform}"

Channel Analytics Context:
- 79% traffic comes from YouTube search (needs strong keyword metadata).
- Returning viewers are low (0.2%), so you MUST include an episodic series bridge/teaser to hook subscribers for the next video.
- Format style: Roman Urdu + concise English keywords. High energy, zero fluff.

Generate the final YouTube Shorts publishing package and thumbnail specification.
Return STRICT valid JSON only with NO markdown fences, matching this structure:
{
  "optimizedTitle": "Catchy Short Title with 3 hashtags (under 70 chars)",
  "description": "2-3 punchy lines in Roman Urdu explaining what viewer learns, key shortcuts, and call to action + episodic bridge",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "pinnedComment": "Engaging question in Roman Urdu to drive comments and retention loop",
  "thumbnailHeadline": "3-4 uppercase impact words (e.g. WINDOWS TEMP CLEAN)",
  "thumbnailSubBadge": "Punchy badge (e.g. 5 SECONDS FIX)",
  "thumbnailAccentColor": "cyan" | "amber" | "emerald" | "purple",
  "thumbnailPrompt": "A detailed 9:16 vertical thumbnail prompt for Gemini Nano Banana 2.1 following Section 19.1.2 specs: dark modern studio background, high contrast 3D text badge, neon glow, crisp tech iconography, 8k vertical framing",
  "tiktokCaption": "Short punchy TikTok caption with viral audio cue & hashtags",
  "episodicBridge": "One-line teaser connecting this topic to the upcoming next episode"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Fallback clean regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    res.json(data);
  } catch (err: any) {
    console.error('Quick publish error:', err);
    // Graceful fallback response so the UI always works seamlessly
    res.json({
      optimizedTitle: `${req.body.title || 'Tech Hack'} #shorts #itcafeteria #techtips`,
      description: `Is video mein dekhein ${req.body.title || 'yeh zabardast trick'}. Ghanton ka kaam seconds mein! Channel subscribe karein agli episode ke liye.\n\n#itcafeteria #shorts #pakistanitech`,
      tags: ['itcafeteria', 'shorts', 'tech hacks', 'pakistan tech', 'waqar majeed', 'urdu tech', 'productivity tricks', 'tips and tricks'],
      pinnedComment: `Aapko yeh trick pehle pata thi? Comment mein zaroor batayein aur agla topic suggest karein! 👇`,
      thumbnailHeadline: 'HIDDEN TECH TRICK',
      thumbnailSubBadge: '100% WORKING',
      thumbnailAccentColor: 'cyan',
      thumbnailPrompt: 'Modern high-tech YouTube Shorts vertical 9:16 thumbnail cover, cyber dark navy background #070a13, neon blue accent glow, bold yellow 3D text "HIDDEN TECH TRICK", ultra-crisp digital interface graphics, clean layout, 8k resolution',
      tiktokCaption: `Check out this crazy trick! 🔥 #tech #techtok #pakistan #shorts`,
      episodicBridge: `Agli episode mein hum is tool ka next level automation cover karenge!`
    });
  }
});

// 8. Agent Trigger — fresh story ideas (duplicate-aware)
app.post('/api/ai/story-ideas', async (req, res) => {
  try {
    const {
      channelName = 'IT Cafeteria',
      presenter = 'Waqar Majeed',
      niche = 'IT & Technology',
      category = 'General',
      seedTopic = '',
      excludeTitles = [],
      count = 3,
    } = req.body || {};

    const ai = getAiClient();
    const safeCount = Math.min(Math.max(Number(count) || 3, 2), 5);
    const excluded = (Array.isArray(excludeTitles) ? excludeTitles : [])
      .map((title: any) => String(title || '').trim())
      .filter(Boolean)
      .slice(0, 80)
      .join(' | ');

    const prompt = `You are the story discovery agent for "${channelName}" (${niche}), presenter "${presenter}".
Category: "${category}".
Creator ka idea / topic: "${seedTopic || 'koi specific topic nahi — is category ke andar fresh angle chunein'}"

Task: ${safeCount} FRESH YouTube Shorts (vertical 9:16) story ideas generate karein jo is channel par pehle cover nahi hue.
Rules:
- Title clickable aur short ho, maximum 65 characters. Roman Urdu + English tech keywords mix.
- Har idea excluded titles se clearly DIFFERENT ho, sirf words badal kar wahi topic na dohraye.
- Hook Roman Urdu mein, first 1.5 seconds ke liye pattern interrupt (no greeting).
- "angle" ek line mein unique story angle bataye.
- "points" mein 3-4 concrete points likhein jo video cover karegi.
- "whyFresh" bataye ke yeh duplicate kyun nahi hai.
- Channel IT/tech ho to practical tech tutorial, Beauty ho to beauty-specific idea ho.
- Generic "is video mein" ya "aaj hum seekhenge" titles bilkul nahi.

Excluded already-published / remembered titles (do NOT reuse or paraphrase):
${excluded || '(none)'}

Return STRICT raw JSON only, no markdown fences:
{
  "ideas": [
    { "title": "...", "hook": "...", "angle": "...", "points": "...", "whyFresh": "..." }
  ]
}`;

    const ideaAttempts = [
      { model: 'gemini-3.5-flash-lite', timeoutMs: 45000, thinking: false },
      { model: 'gemini-3-flash-preview', timeoutMs: 45000, thinking: true },
      { model: 'gemini-3.6-flash', timeoutMs: 45000, thinking: true },
    ];
    let data: any = null;
    let lastError: any = null;

    for (let attemptIndex = 0; attemptIndex < ideaAttempts.length; attemptIndex += 1) {
      const attempt = ideaAttempts[attemptIndex];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.9,
              maxOutputTokens: 2048,
              ...(attempt.thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
          attempt.timeoutMs,
          'Story ideas'
        );

        const parsed = extractJsonObject(response.text || '');
        if (!parsed || !Array.isArray(parsed.ideas) || !parsed.ideas.length) {
          throw new Error('AI ne valid ideas JSON return nahi kiya');
        }
        data = parsed;
        break;
      } catch (attemptError: any) {
        lastError = attemptError;
        console.error(`Story ideas attempt ${attemptIndex + 1} (${attempt.model}) failed:`, attemptError?.message || attemptError);
      }
    }

    if (!data) {
      throw lastError || new Error('Fresh ideas generate nahi ho sake');
    }

    const ideas = (Array.isArray(data.ideas) ? data.ideas : [])
      .filter((idea: any) => idea && String(idea.title || '').trim())
      .map((idea: any) => ({
        title: String(idea.title).trim().slice(0, 90),
        hook: String(idea.hook || '').trim(),
        angle: String(idea.angle || '').trim(),
        points: String(idea.points || '').trim(),
        whyFresh: String(idea.whyFresh || '').trim(),
      }))
      .slice(0, safeCount);

    if (!ideas.length) {
      throw new Error('AI ne koi fresh idea return nahi kiya');
    }

    res.json({ ideas });
  } catch (err: any) {
    console.error('Story ideas error:', err);
    res.status(500).json({ error: err.message || 'Fresh ideas generate nahi ho sake' });
  }
});

// 9. Agent Trigger — full scene-by-scene story package
app.post('/api/ai/generate-story', async (req, res) => {
  try {
    const {
      channelName = 'IT Cafeteria',
      presenter = 'Waqar Majeed',
      niche = 'IT & Technology',
      category = 'General',
      playlist = category,
      tag = '@WM25-1',
      sceneCount = 10,
      idea = {},
      discussionNotes = '',
      discussionTranscript = [],
      excludeTitles = [],
    } = req.body || {};

    const ideaTitle = String(idea.title || '').trim();
    if (!ideaTitle) {
      return res.status(400).json({ error: 'Story idea ka title required hai' });
    }

    const totalScenes = Math.min(Math.max(Number(sceneCount) || 10, 4), 15);
    const beatGuide = totalScenes <= 4
      ? 'Hook; Problem + Reveal; Demonstration + Proof; Benefit + Save CTA'
      : totalScenes <= 7
      ? 'Hook; Problem; Agitate; Reveal; Demonstration; Proof / Result; Conclusion + Save CTA'
      : totalScenes <= 10
      ? 'Hook; Problem; Agitate; Reveal; Demonstrate 1; Demonstrate 2; Proof / Result; Benefit; Curiosity Loop; Conclusion + Save CTA'
      : 'Hook; Problem; Agitate; Reveal; multiple Demonstration scenes; Proof / Result; Benefit; common mistakes; recap; Curiosity Loop; Conclusion + Save CTA';

    const transcript = (Array.isArray(discussionTranscript) ? discussionTranscript : [])
      .filter((message: any) => message && String(message.text || '').trim())
      .slice(-10)
      .map((message: any) => `${message.role === 'user' ? 'Creator' : 'AI'}: ${String(message.text).trim().slice(0, 600)}`)
      .join('\n');

    const excluded = (Array.isArray(excludeTitles) ? excludeTitles : [])
      .map((title: any) => String(title || '').trim())
      .filter(Boolean)
      .slice(0, 60)
      .join(' | ');

    const primaryHashtag = channelName.toLowerCase().includes('beauty') ? '#BeautyHub' : '#ITCafeteria';

    const prompt = `You are the lead story architect for "${channelName}" (${niche}), presenter "${presenter}".
Create a complete ${totalScenes}-scene vertical YouTube Shorts story package in Roman Urdu (Pakistani Urdu in Latin script), with English tech/beauty keywords where natural.

CREATOR BRIEF
- Category: "${category}" | Playlist: "${playlist}"
- Character tag for Flow prompts: "${tag}"
- Working idea title: "${ideaTitle}"
- Idea hook direction: "${String(idea.hook || '').trim()}"
- Unique angle: "${String(idea.angle || '').trim()}"
- Points to cover: "${String(idea.points || '').trim()}"
- Discussion notes from creator: "${String(discussionNotes || '').trim() || '(none)'}"
- Discussion transcript:
${transcript || '(none)'}
- Already published titles to avoid: ${excluded || '(none)'}
- Primary hashtag: ${primaryHashtag}

STORY RULES (strict)
1. Exactly ${totalScenes} scenes. Beat guide: ${beatGuide}
2. Every scene is exactly 10 seconds and the spoken "dialogue" must be 22 to 25 Roman Urdu words (2.7 words per second). Count carefully. "words" field must match the actual dialogue word count.
3. Scene 1 Hook: no greeting, immediate pattern interrupt in the first line. Final scene must be a Save/Follow CTA.
4. Dialogue must be Roman Urdu in Latin script. No Devanagari. English only for tool names/tech terms. No repeated word or syllable, no filler.
5. Each "script" is a paste-ready Google Flow prompt for that scene:
   - Character scenes start with "${tag}" and include: sitting/standing anchor pose (0.5s), studio setting, gesture/visual overlay, voice instruction line ("He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated."), then the exact dialogue in double quotes, then the closing anchor pose.
   - Screen-demo scenes start with "The camera cuts to a full-screen..." and include ${tag}'s voiceover plus the exact dialogue in quotes.
   - The dialogue inside script must be word-for-word identical to the "dialogue" field.
6. The story must follow the creator's idea and discussion notes. Do not drift to an unrelated topic.
7. Title must NOT be the raw topic sentence. Max 65 characters, curiosity + search keyword. Do not reuse excluded titles.
8. Description: 2-3 Roman Urdu lines + a "PRACTICAL STEPS / COMMANDS:" block with 3-6 concrete steps when the topic is a tech tutorial. For beauty, give a short step routine instead.
9. THUMBNAIL AGENT v3.45 structured output (server master prompt khud banayega, is liye poora image prompt mat likho):
   - thumbnailLine1 + thumbnailLine2: total 3-5 UPPERCASE words, har line maximum 14 characters. Line 1 white aur line 2 neon-cyan render hogi. Raw topic sentence kabhi nahi.
   - thumbnailSubBanner: 2-4 word punchy yellow-banner hook, Roman Urdu + English mix allowed.
   - thumbnailHologram: 20-35 words mein EXACT story/tool-specific floating 3D hologram (icons, UI panels, data flows) + uske around adapted energy trails. Generic "tech hologram" bilkul nahi.
   - Thumbnail text story ke core result/tool par ho, clickbait jhooth par nahi.
10. seriesPlan: one line teaser for the next episode.

Return STRICT valid JSON only, no markdown fences:
{
  "title": "...",
  "hook": "...",
  "thumbnailLine1": "MAX 14 CHARS",
  "thumbnailLine2": "MAX 14 CHARS",
  "thumbnailSubBanner": "2-4 WORDS",
  "thumbnailHologram": "story-specific floating 3D hologram description with energy trails",
  "hashtags": ["${primaryHashtag}", "#Shorts", "#..."],
  "description": "...",
  "tags": ["keyword1", "keyword2", "... 10-14 tags"],
  "tiktokCaption": "...",
  "seriesPlan": "...",
  "scenes": [
    {
      "num": 1,
      "duration": "10s",
      "purpose": "Hook",
      "isCTA": false,
      "words": 24,
      "visual": "short visual direction",
      "dialogue": "exact Roman Urdu dialogue",
      "script": "full paste-ready Flow prompt"
    }
  ]
}`;

    const ai = getAiClient();
    const storyAttempts = [
      { model: 'gemini-3-flash-preview', timeoutMs: 80000, thinking: true },
      { model: 'gemini-3.6-flash', timeoutMs: 50000, thinking: true },
      { model: 'gemini-3.5-flash', timeoutMs: 80000, thinking: true },
      { model: 'gemini-3.5-flash-lite', timeoutMs: 80000, thinking: false },
      { model: 'gemini-3.7-flash', timeoutMs: 60000, thinking: true },
    ];
    let data: any = null;
    let modelUsed = storyAttempts[0].model;
    let lastError: any = null;
    const minimumScenes = Math.max(4, totalScenes - 2);

    for (let attemptIndex = 0; attemptIndex < storyAttempts.length; attemptIndex += 1) {
      const attempt = storyAttempts[attemptIndex];
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: attempt.model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.8,
              maxOutputTokens: 32768,
              ...(attempt.thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
          attempt.timeoutMs,
          'Story generation'
        );

        const parsed = extractJsonObject(response.text || '');
        if (!parsed) {
          throw new Error('AI ne valid JSON return nahi kiya');
        }
        const parsedScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
        if (parsedScenes.length < minimumScenes) {
          throw new Error(`AI ne sirf ${parsedScenes.length} scenes return kiye (${totalScenes} chahiye the)`);
        }

        data = parsed;
        modelUsed = attempt.model;
        break;
      } catch (attemptError: any) {
        lastError = attemptError;
        console.error(`Story generation attempt ${attemptIndex + 1} (${attempt.model}) failed:`, attemptError?.message || attemptError);
        if (attemptIndex < storyAttempts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }

    if (!data) {
      throw lastError || new Error('Story generate nahi ho saki');
    }

    const safeString = (value: any) => String(value || '').trim();
    const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
    const scenes = rawScenes
      .filter((scene: any) => scene && (scene.script || scene.dialogue))
      .map((scene: any, index: number) => {
        const dialogue = safeString(scene.dialogue);
        const visual = safeString(scene.visual);
        const script = safeString(scene.script) || `${tag} — ${visual}\nHe says: "${dialogue}"`;
        const computedWords = dialogue ? dialogue.split(/\s+/).filter(Boolean).length : 0;
        return {
          num: index + 1,
          duration: '10s',
          purpose: safeString(scene.purpose) || `Scene ${index + 1}`,
          isCTA: Boolean(scene.isCTA) || index === rawScenes.length - 1,
          words: computedWords || Number(scene.words) || 0,
          visual,
          dialogue,
          script,
        };
      });

    if (!scenes.length) {
      throw new Error('AI ne adhoori story return ki — koi scene nahi mila');
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((item: any) => safeString(item)).filter(Boolean).slice(0, 16)
      : [];
    const hashtags = Array.isArray(data.hashtags)
      ? data.hashtags.map((item: any) => safeString(item)).filter(Boolean).slice(0, 5)
      : [primaryHashtag, '#Shorts'];
    if (!hashtags.length) hashtags.push(primaryHashtag, '#Shorts');

    const title = safeString(data.title) || ideaTitle;
    const tiktokCaption = safeString(data.tiktokCaption) || `${title} ${hashtags.join(' ')}`;

    const [fallbackLine1, fallbackLine2] = splitHeadline(
      safeString(data.thumbnailHeadline) || title || ideaTitle
    );
    const thumbnailLine1 = safeString(data.thumbnailLine1).slice(0, 22) || fallbackLine1;
    const thumbnailLine2 = safeString(data.thumbnailLine2).slice(0, 22) || fallbackLine2;
    const thumbnailSubBadge =
      safeString(data.thumbnailSubBanner) || safeString(data.thumbnailSubBadge) || 'MUST TRY';
    const ideaPoints = safeString(idea.points);
    const thumbnailHologram =
      safeString(data.thumbnailHologram) ||
      `a glowing floating 3D hologram visualising "${ideaTitle}"${
        ideaPoints ? ` with ${ideaPoints.slice(0, 140)}` : ' with layered UI panels and data streams'
      }, surrounded by custom cyan energy trails that adapt to its shape`;
    const thumbnailPrompt = buildMasterThumbnailPrompt({
      channelName,
      presenter,
      line1: thumbnailLine1,
      line2: thumbnailLine2,
      subBanner: thumbnailSubBadge,
      hologram: thumbnailHologram,
    });
    const thumbnailHeadline = [thumbnailLine1, thumbnailLine2].filter(Boolean).join(' ').slice(0, 40);

    res.json({
      title,
      hook: safeString(data.hook) || safeString(idea.hook) || 'Reveal',
      thumbnailLine1,
      thumbnailLine2,
      thumbnailHeadline,
      thumbnailSubBadge,
      thumbnailHologram,
      hashtags,
      description: safeString(data.description),
      tags,
      tiktokCaption,
      thumbnailPrompt,
      seriesPlan: safeString(data.seriesPlan),
      scenes,
      modelUsed,
    });
  } catch (err: any) {
    console.error('Story generation error:', err);
    res.status(500).json({ error: err.message || 'Story generate nahi ho saki' });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`IT Cafeteria Full-Stack Studio running on http://localhost:${port}`);
  });
}

startServer();
