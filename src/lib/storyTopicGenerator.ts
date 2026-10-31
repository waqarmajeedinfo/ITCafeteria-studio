/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Dynamic Topic-Accurate Story Package Generator
 * Generates unique, 10-scene Roman Urdu scripts, Flow prompts, and YouTube packages
 * strictly matching the exact topic, title, and category of the requested story.
 */

import type { GeneratedStory, StoryScene } from '../components/StoryPackageView';
import { applyCinematicDirecting } from './cinematicDirector';

export interface GenerateStoryParams {
  id?: string;
  title: string;
  category?: string;
  categoryId?: number;
  characterTag?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  sceneCount?: number;
  channelName?: string;
  presenter?: string;
}

/**
 * Splits title into two punchy lines for 9:16 thumbnail display.
 */
function splitHeadline(title: string): [string, string] {
  const clean = title.replace(/#\S+/g, '').replace(/@\S+/g, '').replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3) {
    return [words.join(' ').toUpperCase(), 'SECRET HACK'];
  }
  const mid = Math.ceil(words.length / 2);
  return [
    words.slice(0, mid).join(' ').toUpperCase(),
    words.slice(mid).join(' ').toUpperCase()
  ];
}

/**
 * Formats tag to standard format (e.g. '@WM25-2').
 */
function normalizeTag(tag?: string): string {
  if (!tag) return '@WM25-1';
  const clean = tag.trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
}

/**
 * Generates a complete, authentic 10-scene Roman Urdu story package tailored to the topic.
 */
export function generateTopicAccurateStoryPackage(params: GenerateStoryParams): GeneratedStory {
  const presenter = params.presenter || 'Waqar Majeed';
  const channelName = params.channelName || 'IT Cafeteria';
  const charTag = normalizeTag(params.characterTag || '@WM25-1');
  const rawTitle = params.title.trim();
  const titleClean = rawTitle.replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  const category = params.category || 'AI & Smart Technology';
  const dateLabel = params.scheduledDate
    ? `${params.scheduledDate} • ${params.scheduledTime || '6:00 PM PKT'}`
    : new Date().toLocaleDateString('en-GB');

  const [line1, line2] = splitHeadline(titleClean);

  const lowerTitle = titleClean.toLowerCase();
  const lowerCat = category.toLowerCase();

  // Topic classification
  const isGoogleSheets = lowerTitle.includes('sheet') || lowerTitle.includes('excel') || lowerTitle.includes('smart fill') || lowerTitle.includes('data');
  const isPromptHacks = lowerTitle.includes('prompt') || lowerTitle.includes('chatgpt') || lowerTitle.includes('shortcuts') && (lowerTitle.includes('ai') || lowerCat.includes('prompt'));
  const isChatbotWorkflow = lowerTitle.includes('chatbot') || lowerTitle.includes('workflow') || lowerTitle.includes('multi-agent') || lowerTitle.includes('power automate') || lowerCat.includes('chatbot');
  const isPCWindows = lowerTitle.includes('windows') || lowerTitle.includes('pc') || lowerTitle.includes('laptop') || lowerTitle.includes('ram') || lowerTitle.includes('c-drive') || lowerCat.includes('pc');
  const isWhatsApp = lowerTitle.includes('whatsapp') || lowerTitle.includes('mobile');
  const isYouTubeCourse = lowerTitle.includes('youtube') || lowerTitle.includes('yt automation') || lowerTitle.includes('chapter');

  let hook = '';
  let description = '';
  let tags: string[] = [];
  let hashtags: string[] = [];
  let tiktokCaption = '';
  let thumbnailHeadline = line1;
  let thumbnailSubBadge = line2;
  let rawBeats: { purpose: string; visual: string; dialogue: string }[] = [];

  if (isGoogleSheets) {
    hook = 'Excel ya Google Sheets mein ghanton ka manual data entry sirf 5 seconds mein automate karein!';
    description = `Google Sheets AI Smart Fill hack! Ghanton ka data formatting aur extraction ab chand seconds mein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['google sheets ai', 'smart fill', 'google sheets shortcut', 'excel tricks', 'it cafeteria', 'waqar majeed', 'data entry automation', 'urdu tech'];
    hashtags = ['#Shorts', '#GoogleSheets', '#AISmartFill', '#ITCafeteria', '#DataHacks', '#ExcelUrdu'];
    tiktokCaption = 'Google Sheets ka yeh AI Smart Fill hack aapka ghanton ka waqt bachaega! 📊⚡ #itcafeteria #googlesheets #techhacks';
    thumbnailHeadline = 'SHEETS AI SMART FILL';
    thumbnailSubBadge = 'GHANTON KA DATA SECONDS MEIN';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} stands before glowing dual monitors showing a chaotic spreadsheet with 1,000 messy unformatted rows.`,
        dialogue: 'Agar aap bhi Excel ya Google Sheets mein ghanton baith kar data separate aur copy-paste karte hain, to foran ruk jayein!'
      },
      {
        purpose: 'The Manual Frustration Exposed',
        visual: 'Split screen showing employee typing names one by one with red clock ticking furiously.',
        dialogue: 'Aksar log first name aur last name alag karne ke liye manual typing karte hain aur apna qeemti waqt zaya karte hain.'
      },
      {
        purpose: 'AI Smart Fill Reveal',
        visual: 'Camera zooms in onto Google Sheets top menu highlighting the built-in AI Smart Fill toggle in glowing cyan.',
        dialogue: 'Google Sheets ka naya built-in AI Smart Fill feature aapke pattern ko pehchan kar hazaron rows sirf do second mein fill karta hai.'
      },
      {
        purpose: 'Step 1: Pattern Definition',
        visual: 'Hands typing first sample format in Row 2 Column B, showing clean extracted first name and capitalized format.',
        dialogue: 'Pehle column B ke pehle cell mein desired output type karein, maslan sirf first name aur official email format.'
      },
      {
        purpose: 'Step 2: Instant Smart Fill Trigger',
        visual: 'Keyboard pressing Ctrl + E, instantly triggering AI Smart Fill with green sparks running down 500 rows.',
        dialogue: 'Ab agle cell par ja kar keyboard se Ctrl plus E dabayein ya Google Sheets ka automatic suggestion accept karein.'
      },
      {
        purpose: 'Proof & Visual Benchmark',
        visual: 'Full table zooming out: 1,000 rows perfectly calculated and formatted in 0.5 seconds with green tick badges.',
        dialogue: 'Yeh dekhein jadu! Baghair kisi complex formula ke poora 1000 rows ka data aik second ke andar bilkul accurate ready ho gaya.'
      },
      {
        purpose: 'Pro Formula Hack',
        visual: 'Demonstration of =ARRAYFORMULA and Gemini AI integration inside Google Sheets cell.',
        dialogue: 'Pro tip: Agar automated sheets chahiyein to ARRAYFORMULA use karein taake nayi aane wali entries bhi khud ba khud format hoti rahein.'
      },
      {
        purpose: 'Common Mistake Warning',
        visual: 'Red alert cross highlighting dangerous paid extensions that steal spreadsheet credentials.',
        dialogue: 'Khabardaar! Is kaam ke liye kisi third-party paid extension par paisa zaya mat karein, yeh Sheets mein 100% free built-in hai.'
      },
      {
        purpose: 'Value & Workflow Recap',
        visual: `${charTag} in cyber studio holding high-tech tablet displaying automated workflow dashboard.`,
        dialogue: 'Yeh chota sa shortcut office workers aur students ka har haftay 10 se 15 ghante ka waqt bacha sakta hai.'
      },
      {
        purpose: 'Channel Call To Action & Loop',
        visual: 'Animated IT Cafeteria YouTube subscribe bell pulsing with glowing blue neon border.',
        dialogue: 'Aise advanced Google Sheets aur AI shortcuts daily seekhne ke liye IT Cafeteria ko foran subscribe karein!'
      }
    ];
  } else if (isPromptHacks) {
    hook = 'ChatGPT ya Gemini se generic aur boring answers milte hain? Yeh 3 prompt hacks lagayein!';
    description = `AI Prompt Hacks & Shortcuts Masterclass! ChatGPT aur Gemini se 10X behtar aur accurate answers hasil karne ka secret tareeqa.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['prompt hacks', 'chatgpt prompt', 'gemini ai', 'prompt engineering', 'it cafeteria', 'waqar majeed', 'urdu ai masterclass'];
    hashtags = ['#Shorts', '#AIPrompts', '#PromptHacks', '#ITCafeteria', '#ChatGPT', '#GeminiAI'];
    tiktokCaption = 'AI prompts likhne ka yeh secret tareeqa 99% log nahi jante! 🤖🔥 #itcafeteria #chatgpt #prompthacks';
    thumbnailHeadline = 'AI PROMPT HACKS';
    thumbnailSubBadge = '10X BETTER AI RESULTS';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} standing in tech studio looking directly into camera with shocked expression as generic AI text burns away.`,
        dialogue: 'Kya aapko bhi ChatGPT aur Gemini se har martaba boring aur robotic jawab milte hain? Asal ghalti aapke prompt mein hai!'
      },
      {
        purpose: 'The Amateur Prompt Trap',
        visual: 'Chat window showing bad prompt "Write an article about AI" resulting in boring generic essay.',
        dialogue: 'Log direct ek line ka prompt type karte hain aur AI bina context ke generic kitabi batein shuru kar deta hai.'
      },
      {
        purpose: 'Hack 1: Role & Persona Priming',
        visual: 'Glowing cyber text showing "Act as a 15-year Senior Solutions Architect" entering the prompt bar.',
        dialogue: 'Secret number aik: Hamesha Role Priming karein. AI ko batayein ke woh ek world-class software engineer ya expert consultant ban kar soche.'
      },
      {
        purpose: 'Hack 2: Negative Prompt & Constraints',
        visual: 'Neon red filter showing banned buzzwords: "Delve", "Tapestry", "Crucial" crossed out.',
        dialogue: 'Secret number do: Negative constraints lagayein. Likhein ke boring buzzwords aur corporate slop bilkul use na kare aur direct facts de.'
      },
      {
        purpose: 'Hack 3: Few-Shot Output Formatting',
        visual: 'Interactive markdown table generating instantly with clear columns, bullet points, and code snippets.',
        dialogue: 'Secret number teen: Output format fix karein. AI ko kahein ke jawab sirf tabular format ya step-by-step checklist mein produce kare.'
      },
      {
        purpose: 'Before vs After Proof',
        visual: 'Split screen comparison: Left side generic essay vs Right side razor-sharp actionable engineering blueprint.',
        dialogue: 'Dono jawab ka farq dekhein! Right side par wahi AI ab corporate grade precision answer de raha hai jo direct production ready hai.'
      },
      {
        purpose: 'System Prompt Tokens',
        visual: 'Behind the scenes view of system parameters: temperature 0.3 and tone locked to direct conversational.',
        dialogue: 'Agar aap coding ya precise logic chahte hain to temperature 0.2 rakhein taake hallucination 100 fisad khatam ho sake.'
      },
      {
        purpose: 'Common Mistake to Avoid',
        visual: 'Warning badge on screen: "Do not overload single prompts with 10 conflicting questions".',
        dialogue: 'Aik hi prompt mein 10 mukhtalif sawal mat poochein, balkay step-by-step conversation tree bana kar AI ko guide karein.'
      },
      {
        purpose: 'Episodic Recap',
        visual: `${charTag} smiles at desk with three glowing cards summarizing Role, Constraints, and Output.`,
        dialogue: 'Yeh teen prompt rules save kar lein, aapka AI workflow hamesha ke liye 10 guna smart ho jayega.'
      },
      {
        purpose: 'Subscribe & Next Episode',
        visual: 'IT Cafeteria subscribe card with Masterclass Episode 4 teaser box in bottom corner.',
        dialogue: 'Agli episode mein hum multi-agent chaining seekhenge. Video ko save karein aur IT Cafeteria ko follow karein!'
      }
    ];
  } else if (isChatbotWorkflow) {
    hook = 'Customer support aur repetitive tasks ko 100% automate karein bina kisi coding ke!';
    description = `AI Chatbots & Automated Workflows Masterclass! Multi-agent architecture aur webhook automations step-by-step seekhein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['ai chatbot', 'workflow automation', 'multi agent ai', 'power automate', 'it cafeteria', 'waqar majeed', 'no code ai'];
    hashtags = ['#Shorts', '#AIChatbot', '#Workflows', '#ITCafeteria', '#Automation', '#NoCode'];
    tiktokCaption = 'Apna khud ka 24/7 autonomous AI support agent banayein 0 code ke sath! 🤖⚡ #itcafeteria #chatbot #ai';
    thumbnailHeadline = 'AI CHATBOT WORKFLOWS';
    thumbnailSubBadge = '100% NO-CODE AUTOMATION';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} stands next to animated floating flowchart nodes connecting WhatsApp, Gmail and Google Sheets.`,
        dialogue: 'Customer messages ka jawab dene ke liye kya aap abhi bhi 24 ghante phone par baithe rehte hain?'
      },
      {
        purpose: 'The Business Problem',
        visual: 'Smartphone screen overflowing with 250 unread inquiries and lost lead notifications.',
        dialogue: 'Aksar businesses sirf is liye customers kho dete hain kyunke unka reply time 15 minute se zyada hota hai.'
      },
      {
        purpose: 'Multi-Agent Bot Reveal',
        visual: 'Holographic node network activating with glowing green connections between customer query and instant response.',
        dialogue: 'Lekin aaj hum ek aesa free AI workflow banayein ge jo customer ka sawal samajh kar khud jawab aur booking karta hai.'
      },
      {
        purpose: 'Step 1: Webhook Trigger Setup',
        visual: 'Connecting incoming webhook node from contact form or WhatsApp business API.',
        dialogue: 'Pehla step: Incoming webhook trigger set karein jese hi user koi message bheje, hamara workflow foran activate ho jaye.'
      },
      {
        purpose: 'Step 2: AI Intent Classification',
        visual: 'AI agent node routing query: "Pricing", "Support", or "Booking" into 3 different colored logic branches.',
        dialogue: 'Doosra step: AI agent message ka maqsad classify karta hai ke user pricing maang raha hai ya appointment schedule kar raha hai.'
      },
      {
        purpose: 'Step 3: Automated Action & Database Write',
        visual: 'Data saving into Google Sheets while WhatsApp notification fires with tailored response in under 2 seconds.',
        dialogue: 'Teesra step: Customer ka data sheet mein save hota hai aur personalized reply 2 second mein deliver ho jata hai.'
      },
      {
        purpose: 'Live Real-Time Demo',
        visual: 'Side-by-side live demo: Test user sends WhatsApp text, bot responds with invoice PDF instantly.',
        dialogue: 'Live proof dekhein! Test message bhejte hi bot ne exact rate list aur direct meeting link foran send kar diya.'
      },
      {
        purpose: 'Security & Token Safeguard',
        visual: 'Rate limiter toggle and API secret encryption lock graphic glowing emerald on screen.',
        dialogue: 'Rate limiter zaroor lagayein taake koi bot spamming na kar sake aur aapka API balance hamesha mehfooz rahe.'
      },
      {
        purpose: 'Masterclass Value Summary',
        visual: `${charTag} standing at workstation showing completed automated workflow diagram with 100% uptime badge.`,
        dialogue: 'Yeh complete architecture setup karne ke baad aapka business auto-pilot mode par 24 ghante run hoga.'
      },
      {
        purpose: 'Call To Action & Resources',
        visual: 'IT Cafeteria subscribe button and downloadable workflow blueprint link in description card.',
        dialogue: 'Poora workflow blueprint description mein bilkul free hai. Aisi advanced tech ke liye IT Cafeteria ko follow karein!'
      }
    ];
  } else if (isPCWindows) {
    hook = 'Windows PC slow ho raha hai? Sirf yeh ek hidden setting on karein aur system 2X fast karein!';
    description = `Windows 11 aur PC speedup secrets! Bina kisi third party tool ke RAM aur storage optimize karein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['windows 11', 'pc speedup', 'c drive clean', 'storage sense', 'it cafeteria', 'waqar majeed', 'pc hacks urdu'];
    hashtags = ['#Shorts', '#Windows11', '#PCHacks', '#ITCafeteria', '#TechShorts', '#SpeedUpPC'];
    tiktokCaption = 'Windows PC ki speed 2X boost karne ka secret Windows built-in tareeqa! 💻⚡ #itcafeteria #windows11 #pchacks';
    thumbnailHeadline = 'WINDOWS 11 SECRET';
    thumbnailSubBadge = 'AUTO CLEAN & SPEEDUP';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} gestures toward a computer monitor showing heavy lag and spinning mouse cursor.`,
        dialogue: 'Aapka computer ya laptop achanak hang ho raha hai? Kisi third party cleaner app ko bilkul mat install karein!'
      },
      {
        purpose: 'Root Cause Breakdown',
        visual: 'Task manager opening with 100% disk usage and red warning bar across background services.',
        dialogue: 'Asal masla background update cache aur temporary log files hain jo silently hard drive par jam hoti rehti hain.'
      },
      {
        purpose: 'Windows Built-in Setting Reveal',
        visual: 'Keyboard pressing Windows + I, navigating straight to System > Storage settings.',
        dialogue: 'Windows key plus I dabayein aur System mein Storage par click karein. Yahan Windows ka built-in cleaner maujood hai.'
      },
      {
        purpose: 'Storage Sense Activation',
        visual: 'Toggling Storage Sense switch to ON and configuring automatic cleanup intervals.',
        dialogue: 'Storage Sense ko on karein aur cleanup frequency ko Every Week par set karein taake junk auto delete hota rahe.'
      },
      {
        purpose: 'Run Cleaner Now',
        visual: 'Clicking Run Storage Sense Now button, releasing 18GB of temporary cache in 3 seconds.',
        dialogue: 'Ab Run Storage Sense dabayein. Chand seconds ke andar 15 se 20 GB tak hidden junk baghair kisi error ke saaf!'
      },
      {
        purpose: 'Performance Proof',
        visual: 'Task Manager disk and CPU drop from 95% down to 3%, green checkmark appears.',
        dialogue: 'Nateeja dekhein! System load foran normal ho gaya aur applications bina kisi delay ke instant open ho rahi hain.'
      },
      {
        purpose: 'Startup Apps Audit',
        visual: 'Task Manager startup tab: Disabling Spotify and Steam auto-start on boot.',
        dialogue: 'Task Manager mein Startup Apps par ja kar faltu software disable karein taake PC boot time aadha reh jaye.'
      },
      {
        purpose: 'Safety Alert',
        visual: 'Warning graphic showing corrupted registry error caused by unsafe cleaners.',
        dialogue: 'Kabhi bhi unsafe registry cleaner mat use karein jo Windows files delete kar ke blue screen of death le aaye.'
      },
      {
        purpose: 'Summary & Value',
        visual: `${charTag} in sleek cyber workstation with smooth running monitors and clean desktop.`,
        dialogue: 'Yeh do minute ki setting aapke laptop ki life aur speed ko salon tak fresh aur tez rakhegi.'
      },
      {
        purpose: 'Closing & Subscribe',
        visual: 'IT Cafeteria subscribe button and YouTube channel bell animation.',
        dialogue: 'Daily Windows aur laptop shortcuts seekhne ke liye IT Cafeteria ko foran subscribe karein!'
      }
    ];
  } else {
    // Dynamic generation incorporating exact title and category
    hook = `Kya aap jante hain ke ${titleClean} aapka ghanton ka waqt bacha sakta hai?`;
    description = `${titleClean}! Complete step-by-step masterclass in Roman Urdu.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = [titleClean.toLowerCase(), category.toLowerCase(), 'it cafeteria', 'waqar majeed', 'tech tips urdu', 'ai shortcuts'];
    hashtags = ['#Shorts', '#ITCafeteria', '#PakistanTech', '#TechHacks'];
    tiktokCaption = `${titleClean} ka secret tarika! Dekhein aur try karein 🔥 #itcafeteria #shorts #techtips`;
    thumbnailHeadline = line1;
    thumbnailSubBadge = line2;

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} stands at cyber studio workstation, gestures urgently toward floating 3D headline: "${titleClean}".`,
        dialogue: `Kya aap jante hain ke ${titleClean} se aapka ghanton ka kaam sirf chand seconds mein ho sakta hai?`
      },
      {
        purpose: 'The Problem Exposed',
        visual: 'Monitor screen displaying slow traditional manual workflow with red delay icon.',
        dialogue: `Aksar creators aur professionals ${category} mein purana tareeqa use kar ke apna bohot sa qeemti waqt zaya karte hain.`
      },
      {
        purpose: 'Secret Feature Reveal',
        visual: `Camera swoops into dual screen setup highlighting the core mechanism for ${titleClean}.`,
        dialogue: `Lekin aaj IT Cafeteria par mein aapko iska ek official secret shortcut dikha raha hoon jo 100% free aur working hai.`
      },
      {
        purpose: 'Step 1: Configuration',
        visual: 'Tactile keyboard shortcut execution with cyan ripple lighting on workspace.',
        dialogue: `Pehla step: Apne system ya tool mein yeh hidden parameter open karein jese screen par highlight ho raha hai.`
      },
      {
        purpose: 'Step 2: Core Execution',
        visual: 'Real-time execution interface completing the operation with glowing progress bar.',
        dialogue: `Doosra step: Yeh specific setting apply karein aur execute dabayein. Background ka saara manual process automate ho jayega!`
      },
      {
        purpose: 'Live Verification Proof',
        visual: 'Before vs after visual comparison proving 10x faster result with green validation checkmarks.',
        dialogue: `Nateeja aapke samne hai! Jo kaam ghanton mein nahi hota tha ab sirf 5 seconds mein complete aur verified hai.`
      },
      {
        purpose: 'Pro Tip & Optimization',
        visual: 'Holographic callout widget displaying advanced recurring trigger or keyboard shortcut.',
        dialogue: `Pro tip: Is setting ko default par save kar lein taake aapko har bar manual setup na karna pare.`
      },
      {
        purpose: 'Mistake Avoidance',
        visual: 'Red caution box highlighting common error that breaks workflow consistency.',
        dialogue: `Dhyan rahe, is mein ghalti se extra parameters add na karein warna system output accurate nahi aayega.`
      },
      {
        purpose: 'Executive Summary',
        visual: `${charTag} framing the key takeaway cards in dynamic 3D space with confident smile.`,
        dialogue: `Yeh chota sa workflow hack aapke daily digital production ko bohot asaan aur tez bana dega.`
      },
      {
        purpose: 'Call to Action & Community',
        visual: 'IT Cafeteria subscribe button pulse with Waqar Majeed studio end-card.',
        dialogue: `Aise rozana high-value tech shortcuts seekhne ke liye IT Cafeteria ko follow karein aur doston se share karein!`
      }
    ];
  }

  // Construct scenes with cinematic directing
  const scenes: StoryScene[] = rawBeats.map((beat, idx) => {
    const sceneNum = idx + 1;
    const isCTA = sceneNum === rawBeats.length;
    const words = beat.dialogue.split(/\s+/).filter(Boolean).length;
    const rawScript = `${charTag} — anchor studio presentation.\nDialogue (Roman Urdu): "${beat.dialogue}"\nVisual details: ${beat.visual}`;
    const directedScript = applyCinematicDirecting(sceneNum, rawScript, undefined, beat.purpose);

    return {
      num: sceneNum,
      duration: '0-10s',
      purpose: beat.purpose,
      isCTA,
      words,
      visual: beat.visual,
      dialogue: beat.dialogue,
      script: directedScript
    };
  });

  return {
    title: rawTitle,
    hook,
    channelName,
    presenter,
    categoryName: category,
    playlist: category,
    characterTag: charTag,
    dateLabel,
    sceneCount: scenes.length,
    scenes,
    hashtags,
    description,
    tags,
    tiktokCaption,
    thumbnailHeadline,
    thumbnailSubBadge,
    thumbnailLine1: line1,
    thumbnailLine2: line2,
    thumbnailHologram: `a glowing cyan 3D hologram visualizing "${titleClean}" with floating UI panels and animated data stream nodes`,
    thumbnailPrompt: `Vertical 9:16 high-tech YouTube Shorts thumbnail cover. Deep cyber navy background #070a13. Bold 3D embossed yellow text "${thumbnailHeadline}". Neon cyan frame, ultra-sharp 8k render with glowing holographic data panels.`,
    seriesPlan: 'Daily Episode Sequence',
    memoryBlock: `MEM-${Date.now()}`,
    idea: {
      title: titleClean,
      hook,
      angle: 'High-Retention Practical Workflow',
      points: `Authentic Roman Urdu demonstration for ${titleClean}`
    },
    discussionNotes: `Tailored 10-scene sequence specifically crafted for ${titleClean}. Strictly 10s per scene, 22-25 words per dialogue.`,
    practicalSteps: [
      `1. Open tool or environment for ${titleClean}.`,
      `2. Execute step 1 shortcut as demonstrated in Scene 4.`,
      `3. Confirm verified output in Scene 6.`
    ],
    outsourcedLinks: [
      `https://www.youtube.com/@itcafeteria`,
      `https://github.com/waqarmajeedinfo`
    ],
    demoPrompt: isGoogleSheets
      ? `Extract first name and format official email from messy Column A data using Google Sheets AI Smart Fill (Ctrl + E).`
      : isPromptHacks
      ? `Act as an expert systems architect. Provide direct, non-fluff, tabular checklist of the architecture without filler text.`
      : isChatbotWorkflow
      ? `Create a multi-agent webhook router that classifies incoming inquiries into Support, Sales, or Booking with zero code.`
      : `Complete hands-on demonstration of ${titleClean} in Roman Urdu.`
  };
}

/**
 * Checks if a storyPackage is corrupted or mismatched against its parent record title.
 * For example: if title is "Google Sheets..." but scenes talk about "PC 2X fast" or "system slow",
 * or if scenes are empty, return TRUE (mismatched / needs self-healing).
 */
export function isStoryPackageMismatched(recordTitle: string, pkg?: GeneratedStory | null): boolean {
  if (!pkg) return true;
  if (!pkg.scenes || !Array.isArray(pkg.scenes) || pkg.scenes.length === 0) return true;

  const titleLower = (recordTitle || '').toLowerCase();
  const pkgTitleLower = (pkg.title || '').toLowerCase();
  const hookLower = (pkg.hook || '').toLowerCase();
  const scene1Dialogue = (pkg.scenes[0]?.dialogue || '').toLowerCase();

  // If the dialogue mentions "system slow" or "pc 2x fast" or "ccleaner" or "temporary files"
  // but the record is about Sheets, Prompt Hacks, Chatbots, YouTube, etc. -> MISMATCH!
  const hasPCContent =
    scene1Dialogue.includes('system slow') ||
    scene1Dialogue.includes('pc 2x fast') ||
    scene1Dialogue.includes('ccleaner') ||
    hookLower.includes('system slow') ||
    hookLower.includes('pc 2x fast');

  if (hasPCContent) {
    const isActuallyPCTopic =
      titleLower.includes('pc') ||
      titleLower.includes('windows') ||
      titleLower.includes('storage') ||
      titleLower.includes('laptop') ||
      titleLower.includes('c-drive') ||
      titleLower.includes('c drive');

    if (!isActuallyPCTopic) {
      return true; // Blatant mismatch! e.g. Google Sheets having PC cleanup dialogue
    }
  }

  // If record mentions Google Sheets or Excel, but scenes don't mention Sheets or Excel or Data
  if (titleLower.includes('sheet') || titleLower.includes('excel') || titleLower.includes('smart fill')) {
    const mentionsSheet =
      pkgTitleLower.includes('sheet') ||
      hookLower.includes('sheet') ||
      scene1Dialogue.includes('sheet') ||
      scene1Dialogue.includes('excel') ||
      scene1Dialogue.includes('data');
    if (!mentionsSheet) return true;
  }

  // If record mentions Prompt Hacks, but scenes don't mention Prompt or ChatGPT or AI
  if (titleLower.includes('prompt')) {
    const mentionsPrompt =
      pkgTitleLower.includes('prompt') ||
      hookLower.includes('prompt') ||
      scene1Dialogue.includes('prompt') ||
      scene1Dialogue.includes('chatgpt') ||
      scene1Dialogue.includes('ai');
    if (!mentionsPrompt) return true;
  }

  // If record mentions Chatbot, but scenes don't mention Bot or Chatbot or Workflow
  if (titleLower.includes('chatbot')) {
    const mentionsBot =
      pkgTitleLower.includes('chatbot') ||
      hookLower.includes('chatbot') ||
      scene1Dialogue.includes('chat') ||
      scene1Dialogue.includes('bot') ||
      scene1Dialogue.includes('workflow') ||
      scene1Dialogue.includes('automate');
    if (!mentionsBot) return true;
  }

  return false;
}
