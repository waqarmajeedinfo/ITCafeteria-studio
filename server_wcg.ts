import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import ffmpegStatic from 'ffmpeg-static';
import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_WCG_CARD_DATA,
  WCG_TEMPLATES,
  findWcgTemplate,
  type WcgCardData,
  type WcgStylingConfig,
  type WcgTrendSuggestion,
} from './src/lib/wcgTemplates';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WCG_OUTPUT_DIR = path.resolve(__dirname, 'data', 'wcg-renders');
const PUBLIC_S1_PATH = path.resolve(__dirname, 'public', 'assets', 'aistudio', 's1_0b0de8d4.jpeg');
const PUBLIC_S2_PATH = path.resolve(__dirname, 'public', 'assets', 'aistudio', 's2_610b836e.jpeg');
const DIST_S1_PATH = path.resolve(__dirname, 'dist', 'assets', 'aistudio', 's1_0b0de8d4.jpeg');
const DIST_S2_PATH = path.resolve(__dirname, 'dist', 'assets', 'aistudio', 's2_610b836e.jpeg');
const BACKEND_S1_PATH = path.resolve(__dirname, 'backend_wcg', 'assets', 's1.jpeg');
const BACKEND_S2_PATH = path.resolve(__dirname, 'backend_wcg', 'assets', 's2.jpeg');
const BUNDLED_FONTS_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'fonts');
const SYSTEM_FONTS_DIR = '/usr/share/fonts/truetype/dejavu';

function ensureOutputDir() {
  if (!fs.existsSync(WCG_OUTPUT_DIR)) {
    fs.mkdirSync(WCG_OUTPUT_DIR, { recursive: true });
  }
}

function resolveMultiPartAssetPaths(): { s1: string | null; s2: string | null } {
  const s1Candidates = [PUBLIC_S1_PATH, DIST_S1_PATH, BACKEND_S1_PATH];
  const s2Candidates = [PUBLIC_S2_PATH, DIST_S2_PATH, BACKEND_S2_PATH];
  const s1 = s1Candidates.find((p) => fs.existsSync(p)) || null;
  const s2 = s2Candidates.find((p) => fs.existsSync(p)) || null;
  return { s1, s2 };
}

function resolveFontsDir(): string | null {
  if (fs.existsSync(path.join(BUNDLED_FONTS_DIR, 'DejaVuSerif.ttf'))) {
    return BUNDLED_FONTS_DIR;
  }
  if (fs.existsSync(path.join(SYSTEM_FONTS_DIR, 'DejaVuSerif.ttf'))) {
    return SYSTEM_FONTS_DIR;
  }
  return null;
}

function resolveFfmpegBinary(): { bin: string; source: string } | null {
  const envBin = (process.env.FFMPEG_PATH || '').trim();
  if (envBin && fs.existsSync(envBin)) {
    return { bin: envBin, source: 'env:FFMPEG_PATH' };
  }

  const staticRaw =
    typeof ffmpegStatic === 'string'
      ? ffmpegStatic
      : (ffmpegStatic as unknown as { default?: string })?.default || '';

  if (staticRaw && fs.existsSync(staticRaw)) {
    try {
      if (process.platform !== 'win32') {
        fs.chmodSync(staticRaw, 0o755);
      }
    } catch {}
    return { bin: staticRaw, source: 'npm:ffmpeg-static' };
  }

  const systemCandidates = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    '/app/node_modules/ffmpeg-static/ffmpeg',
  ];
  for (const candidate of systemCandidates) {
    if (fs.existsSync(candidate)) {
      return { bin: candidate, source: `system:${candidate}` };
    }
  }

  const pathDirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  for (const dir of pathDirs) {
    const full = path.join(dir, exeName);
    if (fs.existsSync(full)) {
      return { bin: full, source: `path:${full}` };
    }
  }

  return null;
}

function escapeFfmpegFilterPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function hexToAssBgr(hex: string, fallback = '&H00FFFFFF&'): string {
  const clean = (hex || '').trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  const r = full.slice(0, 2).toUpperCase();
  const g = full.slice(2, 4).toUpperCase();
  const b = full.slice(4, 6).toUpperCase();
  return `&H00${b}${g}${r}&`;
}

function hexToFfmpegColor(hex: string, fallback = '0x196134'): string {
  const clean = (hex || '').trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return `0x${full.toUpperCase()}`;
}

function formatAssTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.min(99, Math.floor((s - Math.floor(s)) * 100));
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function escapeAssText(text: string): string {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r?\n/g, ' ');
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    if ((current + ' ' + words[i]).length <= maxChars) {
      current += ' ' + words[i];
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

interface AssLineSpec {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  isAccent?: boolean;
  bold?: boolean;
  italic?: boolean;
  revealOffsetSec: number;
  typeDurationSec: number;
  maxCharsPerLine?: number;
}

function buildTypewriterAssFile(
  lines: AssLineSpec[],
  partDurationSec: number,
  styling: WcgStylingConfig,
  fontNameSerif: string
): string {
  const textAssColor = hexToAssBgr(styling.textColor, '&H00FFFFFF&');
  const accentAssColor = hexToAssBgr(styling.accentColor, '&H006BC2E7&');

  const events: string[] = [];
  const spacing = Math.max(0.85, Math.min(1.2, Number(styling.spacingScale || 1)));

  for (const spec of lines) {
    const wrapped = wrapLines(spec.text, spec.maxCharsPerLine || 34);
    const lineHeight = Math.round(spec.fontSize * 1.18 * spacing);
    const startY = Math.round(spec.y - ((wrapped.length - 1) * lineHeight) / 2);

    const totalChars = Math.max(1, wrapped.join('').length);
    const perCharMs = Math.max(18, Math.round((spec.typeDurationSec * 1000) / totalChars));
    let charCursor = 0;

    wrapped.forEach((lineStr, idx) => {
      const yPos = startY + idx * lineHeight;
      const colorTag = spec.isAccent ? accentAssColor : textAssColor;
      const styleTags = `${spec.bold ? '\\b1' : '\\b0'}${spec.italic ? '\\i1' : '\\i0'}`;

      let animatedChars = '';
      for (const ch of Array.from(lineStr)) {
        const t1 = charCursor * perCharMs;
        const t2 = t1 + 75;
        animatedChars += `{\\alpha&HFF&\\t(${t1},${t2},\\alpha&H00&)}${escapeAssText(ch)}`;
        charCursor += 1;
      }

      const tStart = formatAssTime(spec.revealOffsetSec);
      const tEnd = formatAssTime(partDurationSec);
      const prefix = `{\\an5\\pos(${spec.x},${yPos})\\fn${fontNameSerif}\\fs${spec.fontSize}${styleTags}\\1c${colorTag}\\3c&H00091410&\\bord2.2\\shad1.5\\fad(120,250)}`;
      events.push(`Dialogue: 0,${tStart},${tEnd},Default,,0,0,0,,${prefix}${animatedChars}`);
    });
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontNameSerif},42,&H00FFFFFF,&H00FFFFFF,&H00091410,&H64000000,0,0,0,0,100,100,0.4,0,1,2,1.5,5,24,24,24,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`;
}

async function generateFallbackTrends(query: string, category: string): Promise<WcgTrendSuggestion> {
  const catLower = `${category} ${query}`.toLowerCase();
  if (catLower.includes('barat') || catLower.includes('maroon') || catLower.includes('shahi')) {
    return {
      query,
      trendSummaryRomanUrdu:
        '2026 mein Pakistani Barat cards mein deep Mughal maroon velvet aur embossed antique gold filigree top trend par hai, jisme 9:16 vertical wax-seal fade aur high-contrast Cinzel serif typography sabse zyada pasand ki ja rahi hai.',
      designHighlights: [
        'Mughal Jharokha & royal dome arches with fine warm brass double borders',
        'Deep crimson velvet backdrop paired with warm champagne #E6C275 accents',
        'Cinzel + Great Vibes calligraphy pairing for Host & Couple hierarchy',
      ],
      recommendedStyling: {
        primaryColor: '#4E0D19',
        secondaryColor: '#2D070F',
        accentColor: '#E6C275',
        textColor: '#FFF7E8',
        displayFont: 'Cinzel',
        scriptFont: 'Great Vibes',
        spacingScale: 1.02,
        transitionStyle: 'crossfade',
      },
      sources: [],
      verifiedLive: false,
    };
  }
  if (catLower.includes('walima')) {
    return {
      query,
      trendSummaryRomanUrdu:
        'Modern Walima e-invites 2026 mein quiet-luxury sage green, champagne ivory aur generous line-spacing dominant hai. WhatsApp aur Instagram Stories ke liye 18–20s soft crossfade aur minimalist botanical borders high retention dete hain.',
      designHighlights: [
        'Sage & emerald matte base with delicate champagne foil lines',
        'Extra breathing room (1.05x spacing) around Programme & Venue details',
        'Smooth slide-up / crossfade transitions for afternoon/evening receptions',
      ],
      recommendedStyling: {
        primaryColor: '#243B32',
        secondaryColor: '#182A23',
        accentColor: '#DFC592',
        textColor: '#FBF8F1',
        displayFont: 'Cormorant Garamond',
        scriptFont: 'Great Vibes',
        spacingScale: 1.05,
        transitionStyle: 'slideup',
      },
      sources: [],
      verifiedLive: false,
    };
  }
  return {
    query,
    trendSummaryRomanUrdu:
      '2026 Pakistani Mehndi & Rasm-e-Hina trend mein vibrant emerald/teal florals, hanging lanterns, dholki illustrations aur golden-cream typewriter reveal viral hain — khaas tor par 2-page 9:16 WhatsApp Status animated suites.',
    designHighlights: [
      'Sequential 2-part storytelling (Part 1 Family Hosts -> Part 2 Event, Programme & Venue)',
      'Emerald green palette contrasted with warm marigold/antique gold (#E7C26B)',
      'Typewriter character reveal synced under 20s vertical 9:16 mobile frame',
    ],
    recommendedStyling: {
      primaryColor: '#196134',
      secondaryColor: '#1B7A72',
      accentColor: '#E7C26B',
      textColor: '#FFFFFF',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'crossfade',
    },
    sources: [],
    verifiedLive: false,
  };
}

export function registerWcgRoutes(app: Express) {
  ensureOutputDir();

  // List available templates and asset readiness
  app.get('/api/wcg/templates', (_req, res) => {
    const { s1, s2 } = resolveMultiPartAssetPaths();
    const ffmpegResolved = resolveFfmpegBinary();
    const fontsDir = resolveFontsDir();
    res.json({
      ok: true,
      templates: WCG_TEMPLATES,
      assetsReady: {
        part1S1: Boolean(s1),
        part2S2: Boolean(s2),
        ffmpegAvailable: Boolean(ffmpegResolved),
        ffmpegSource: ffmpegResolved?.source || null,
        fontsReady: Boolean(fontsDir),
        pythonBackendDir: fs.existsSync(path.resolve(__dirname, 'backend_wcg', 'main.py')),
        externalPythonUrlConfigured: Boolean((process.env.WCG_PYTHON_URL || '').trim()),
      },
    });
  });

  app.get('/api/wcg/diagnostics', (_req, res) => {
    const { s1, s2 } = resolveMultiPartAssetPaths();
    const ffmpegResolved = resolveFfmpegBinary();
    const fontsDir = resolveFontsDir();
    res.json({
      ok: Boolean(ffmpegResolved),
      ffmpeg: ffmpegResolved,
      fontsDir,
      assets: { s1, s2 },
      outputDir: WCG_OUTPUT_DIR,
    });
  });

  // Online Adaptive AI Trend Verifier using @google/genai + Google Search Grounding
  app.post('/api/wcg/trends', async (req, res) => {
    const query = String(req.body?.query || 'Pakistani traditional wedding invitation card design trends 2026').trim();
    const category = String(req.body?.category || 'Mehndi').trim();

    try {
      const ai = getAiClient();
      if (!ai) {
        const fallback = await generateFallbackTrends(query, category);
        return res.json({ ok: true, trend: fallback });
      }

      const prompt = `Search online for current 2025-2026 Pakistani traditional & modern digital wedding invitation card trends (e-invites, Mehndi, Rasm-e-Hina, Barat, Walima, Nikah) matching: "${query}" (Event focus: ${category}).
Return ONLY a valid JSON object (no markdown fences) with this exact shape:
{
  "trendSummaryRomanUrdu": "2-3 concise sentences in natural Roman Urdu explaining current color, typography, motif and 9:16 video invite trends.",
  "designHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "recommendedStyling": {
    "primaryColor": "#196134",
    "secondaryColor": "#1B7A72",
    "accentColor": "#E7C26B",
    "textColor": "#FFFFFF",
    "displayFont": "Cormorant Garamond",
    "scriptFont": "Great Vibes",
    "spacingScale": 1.02,
    "transitionStyle": "crossfade"
  }
}
Allowed displayFont values: "Cormorant Garamond", "Cinzel", "Amiri".
Allowed scriptFont values: "Great Vibes", "Cormorant Garamond".
Allowed transitionStyle values: "crossfade", "slideup", "wipeup".
Keep spacingScale between 0.90 and 1.12.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = (response?.text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}');
        if (start !== -1 && end > start) {
          try {
            parsed = JSON.parse(rawText.slice(start, end + 1));
          } catch {
            parsed = null;
          }
        }
      }

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || c.web.uri,
          uri: c.web.uri,
        }))
        .slice(0, 6);

      if (!parsed || !parsed.recommendedStyling) {
        const fallback = await generateFallbackTrends(query, category);
        return res.json({
          ok: true,
          trend: {
            ...fallback,
            sources,
            verifiedLive: sources.length > 0,
          },
        });
      }

      const suggestion: WcgTrendSuggestion = {
        query,
        trendSummaryRomanUrdu:
          parsed.trendSummaryRomanUrdu ||
          'Fresh Pakistani wedding invitation aesthetic trends verified online aur styling apply karne ke liye tayar hai.',
        designHighlights: Array.isArray(parsed.designHighlights) ? parsed.designHighlights.slice(0, 4) : [],
        recommendedStyling: {
          primaryColor: parsed.recommendedStyling.primaryColor || '#196134',
          secondaryColor: parsed.recommendedStyling.secondaryColor || '#1B7A72',
          accentColor: parsed.recommendedStyling.accentColor || '#E7C26B',
          textColor: parsed.recommendedStyling.textColor || '#FFFFFF',
          displayFont: ['Cormorant Garamond', 'Cinzel', 'Amiri'].includes(parsed.recommendedStyling.displayFont)
            ? parsed.recommendedStyling.displayFont
            : 'Cormorant Garamond',
          scriptFont: ['Great Vibes', 'Cormorant Garamond'].includes(parsed.recommendedStyling.scriptFont)
            ? parsed.recommendedStyling.scriptFont
            : 'Great Vibes',
          spacingScale: Math.max(0.9, Math.min(1.12, Number(parsed.recommendedStyling.spacingScale || 1))),
          transitionStyle: ['crossfade', 'slideup', 'wipeup'].includes(parsed.recommendedStyling.transitionStyle)
            ? parsed.recommendedStyling.transitionStyle
            : 'crossfade',
        },
        sources,
        verifiedLive: true,
      };

      res.json({ ok: true, trend: suggestion });
    } catch (err: any) {
      console.warn('[WCG Trends] Using researched fallback:', err?.message || err);
      const fallback = await generateFallbackTrends(query, category);
      res.json({ ok: true, trend: fallback });
    }
  });

  // Render 9:16 18-20s multi-part wedding card video (delegates to WCG_PYTHON_URL if set, else native FFmpeg + LibASS)
  app.post('/api/wcg/render', async (req, res) => {
    ensureOutputDir();
    const body = req.body || {};
    const template = findWcgTemplate(String(body.templateId || 'pakistani-emerald-mehndi-multipart'));
    const durationSeconds = Math.max(18, Math.min(20, Number(body.durationSeconds || 19)));

    const card: WcgCardData = {
      ...DEFAULT_WCG_CARD_DATA,
      ...(body.card || {}),
    };
    const styling: WcgStylingConfig = {
      ...template.styling,
      ...(body.styling || {}),
    };

    const pythonServiceUrl = (process.env.WCG_PYTHON_URL || '').trim().replace(/\/+$/, '');
    if (pythonServiceUrl) {
      try {
        const pyRes = await fetch(`${pythonServiceUrl}/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template.id,
            durationSeconds,
            card,
            styling,
          }),
        });
        if (pyRes.ok) {
          const pyJson: any = await pyRes.json();
          const remoteUrl = `${pythonServiceUrl}${pyJson.downloadPath}`;
          return res.json({
            ok: true,
            filename: pyJson.filename,
            videoUrl: remoteUrl,
            downloadUrl: remoteUrl,
            durationSeconds,
            resolution: '1080x1920',
            engine: 'onrender-python-moviepy',
            multiPart: true,
          });
        }
      } catch (pyErr) {
        console.warn('[WCG Render] Python OnRender service unreachable, falling back to local FFmpeg engine:', pyErr);
      }
    }

    const jobId = `wcg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tmpDir = path.join(WCG_OUTPUT_DIR, `tmp_${jobId}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const ffmpegResolved = resolveFfmpegBinary();
      if (!ffmpegResolved) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({
          ok: false,
          error:
            'FFmpeg binary container mein nahi mila. Package.json mein ffmpeg-static install karein ya FFMPEG_PATH / Dockerfile ffmpeg configure karein.',
        });
      }
      const ffmpegBin = ffmpegResolved.bin;
      const fontsDir = resolveFontsDir();

      const xfadeDur = 0.9;
      const partDur = Number(((durationSeconds + xfadeDur) / 2).toFixed(2));
      const fontName = fontsDir ? 'DejaVu Serif' : 'Sans';

      const ass1Content = buildTypewriterAssFile(
        [
          { text: card.invocation, x: 540, y: 545, fontSize: 22, isAccent: true, bold: true, revealOffsetSec: 0.35, typeDurationSec: 1.0, maxCharsPerLine: 44 },
          { text: card.hostLine1, x: 540, y: 650, fontSize: 40, bold: true, revealOffsetSec: 1.2, typeDurationSec: 1.2, maxCharsPerLine: 32 },
          { text: card.relationLine1, x: 540, y: 745, fontSize: 27, italic: true, revealOffsetSec: 2.3, typeDurationSec: 1.5, maxCharsPerLine: 38 },
          { text: card.hostLine2, x: 540, y: 865, fontSize: 40, isAccent: true, bold: true, revealOffsetSec: 3.7, typeDurationSec: 1.2, maxCharsPerLine: 32 },
          { text: card.relationLine2, x: 540, y: 955, fontSize: 27, italic: true, revealOffsetSec: 4.8, typeDurationSec: 1.4, maxCharsPerLine: 38 },
          { text: `${card.groomName}  &  ${card.brideName}`, x: 540, y: 1055, fontSize: 50, isAccent: true, bold: true, italic: true, revealOffsetSec: 6.0, typeDurationSec: 1.1, maxCharsPerLine: 28 },
          { text: `${card.specialTitle}  ·  ${card.specialNames}`, x: 540, y: 1170, fontSize: 26, revealOffsetSec: 7.0, typeDurationSec: 1.2, maxCharsPerLine: 38 },
        ],
        partDur,
        styling,
        fontName
      );

      const ass2Content = buildTypewriterAssFile(
        [
          { text: card.part2Blessing, x: 540, y: 485, fontSize: 36, isAccent: true, bold: true, revealOffsetSec: 0.4, typeDurationSec: 0.85, maxCharsPerLine: 30 },
          { text: card.part2Intro, x: 540, y: 560, fontSize: 23, revealOffsetSec: 1.1, typeDurationSec: 1.0, maxCharsPerLine: 42 },
          { text: card.eventTitle, x: 540, y: 655, fontSize: 74, isAccent: true, bold: true, italic: true, revealOffsetSec: 1.9, typeDurationSec: 1.1, maxCharsPerLine: 22 },
          { text: card.eventSubtitle, x: 540, y: 745, fontSize: 31, italic: true, revealOffsetSec: 2.85, typeDurationSec: 1.0, maxCharsPerLine: 34 },
          { text: `Programme  ·  ${card.weddingDate}`, x: 540, y: 855, fontSize: 34, isAccent: true, bold: true, revealOffsetSec: 3.75, typeDurationSec: 1.3, maxCharsPerLine: 36 },
          { text: card.timing1, x: 540, y: 940, fontSize: 29, revealOffsetSec: 4.9, typeDurationSec: 1.0, maxCharsPerLine: 38 },
          { text: card.timing2, x: 540, y: 1000, fontSize: 29, revealOffsetSec: 5.7, typeDurationSec: 1.0, maxCharsPerLine: 38 },
          { text: card.venueName, x: 540, y: 1120, fontSize: 38, isAccent: true, bold: true, revealOffsetSec: 6.5, typeDurationSec: 1.0, maxCharsPerLine: 32 },
          { text: card.venueAddress, x: 540, y: 1205, fontSize: 25, revealOffsetSec: 7.3, typeDurationSec: 1.35, maxCharsPerLine: 38 },
        ],
        partDur,
        styling,
        fontName
      );

      const ass1Path = path.join(tmpDir, 'part1.ass');
      const ass2Path = path.join(tmpDir, 'part2.ass');
      fs.writeFileSync(ass1Path, ass1Content, 'utf8');
      fs.writeFileSync(ass2Path, ass2Content, 'utf8');

      const outFilename = `${jobId}.mp4`;
      const outPath = path.join(WCG_OUTPUT_DIR, outFilename);
      const { s1, s2 } = resolveMultiPartAssetPaths();
      const useUploadedImages = template.id === 'pakistani-emerald-mehndi-multipart' && Boolean(s1 && s2);

      const ass1Esc = escapeFfmpegFilterPath(ass1Path);
      const ass2Esc = escapeFfmpegFilterPath(ass2Path);
      const fontsOpt = fontsDir ? `:fontsdir='${escapeFfmpegFilterPath(fontsDir)}'` : '';
      const xfadeOffset = Math.max(2, partDur - xfadeDur).toFixed(2);
      const xfadeMode =
        styling.transitionStyle === 'slideup'
          ? 'slideup'
          : styling.transitionStyle === 'wipeup'
            ? 'wipeup'
            : 'fade';

      if (useUploadedImages && s1 && s2) {
        const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
        const p2BakedPath = path.join(tmpDir, 'p2_bg.png');

        const p1Mask = styling.cleanSampleText
          ? `,drawbox=x=265:y=465:w=550:h=795:color=0x1B7A72@0.98:t=fill`
          : '';
        const p2Mask = styling.cleanSampleText
          ? `,drawbox=x=295:y=415:w=510:h=860:color=0x196134@0.98:t=fill`
          : '';

        await Promise.all([
          execFileAsync(ffmpegBin, [
            '-y', '-i', s1,
            '-filter_complex',
            `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28,eq=brightness=-0.06[bgb];[fg]scale=1080:1420:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2${p1Mask},vignette=PI/6`,
            '-frames:v', '1',
            p1BakedPath,
          ]),
          execFileAsync(ffmpegBin, [
            '-y', '-i', s2,
            '-filter_complex',
            `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28,eq=brightness=-0.06[bgb];[fg]scale=1080:1420:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2${p2Mask},vignette=PI/6`,
            '-frames:v', '1',
            p2BakedPath,
          ]),
        ]);

        const filterComplex = [
          `[0:v]ass='${ass1Esc}'${fontsOpt},format=yuv420p[v1]`,
          `[1:v]ass='${ass2Esc}'${fontsOpt},format=yuv420p[v2]`,
          `[v1][v2]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${xfadeOffset},format=yuv420p[vout]`,
        ].join(';');

        await execFileAsync(
          ffmpegBin,
          [
            '-y',
            '-threads', '2',
            '-loop', '1', '-t', String(partDur), '-framerate', '24', '-i', p1BakedPath,
            '-loop', '1', '-t', String(partDur), '-framerate', '24', '-i', p2BakedPath,
            '-filter_complex', filterComplex,
            '-map', '[vout]',
            '-r', '24',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '22',
            '-threads', '2',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            outPath,
          ],
          { timeout: 120000 }
        );
      } else {
        const pColor = hexToFfmpegColor(styling.primaryColor, '0x4E0D19');
        const sColor = hexToFfmpegColor(styling.secondaryColor, '0x2D070F');
        const aColor = hexToFfmpegColor(styling.accentColor, '0xE6C275');

        const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
        const p2BakedPath = path.join(tmpDir, 'p2_bg.png');
        const frameDeco = [
          `drawbox=x=44:y=44:w=992:h=1832:color=${aColor}@0.82:t=4`,
          `drawbox=x=64:y=64:w=952:h=1792:color=${aColor}@0.45:t=2`,
          `drawbox=x=115:y=290:w=850:h=1340:color=${aColor}@0.28:t=2`,
          `drawbox=x=150:y=1100:w=780:h=155:color=${sColor}@0.45:t=fill`,
          `drawbox=x=150:y=1100:w=780:h=155:color=${aColor}@0.65:t=2`,
        ].join(',');

        await Promise.all([
          execFileAsync(ffmpegBin, [
            '-y', '-f', 'lavfi', '-i', `color=c=${pColor}:s=1080x1920:d=1:r=1`,
            '-vf', `${frameDeco},vignette=PI/6`, '-frames:v', '1', p1BakedPath,
          ]),
          execFileAsync(ffmpegBin, [
            '-y', '-f', 'lavfi', '-i', `color=c=${sColor}:s=1080x1920:d=1:r=1`,
            '-vf', `${frameDeco},vignette=PI/6`, '-frames:v', '1', p2BakedPath,
          ]),
        ]);

        const filterComplex = [
          `[0:v]ass='${ass1Esc}'${fontsOpt},format=yuv420p[v1]`,
          `[1:v]ass='${ass2Esc}'${fontsOpt},format=yuv420p[v2]`,
          `[v1][v2]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${xfadeOffset},format=yuv420p[vout]`,
        ].join(';');

        await execFileAsync(
          ffmpegBin,
          [
            '-y',
            '-threads', '2',
            '-loop', '1', '-t', String(partDur), '-framerate', '24', '-i', p1BakedPath,
            '-loop', '1', '-t', String(partDur), '-framerate', '24', '-i', p2BakedPath,
            '-filter_complex', filterComplex,
            '-map', '[vout]',
            '-r', '24',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '22',
            '-threads', '2',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            outPath,
          ],
          { timeout: 120000 }
        );
      }

      // Clean up temporary ASS scripts
      fs.rmSync(tmpDir, { recursive: true, force: true });

      const videoUrl = `/api/wcg/download/${outFilename}`;
      res.json({
        ok: true,
        filename: outFilename,
        videoUrl,
        downloadUrl: `${videoUrl}?download=1`,
        durationSeconds,
        resolution: '1080x1920',
        engine: 'ffmpeg-libass-typewriter',
        multiPart: true,
      });
    } catch (err: any) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.error('[WCG Render Error]:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Wedding card video render failed',
      });
    }
  });

  // Stream or download rendered MP4 safely with HTTP Range support
  app.get('/api/wcg/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename || '');
    if (!safeName || !safeName.endsWith('.mp4')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(WCG_OUTPUT_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Rendered video not found' });
    }

    const stat = fs.statSync(filePath);
    const total = stat.size;
    const forceDownload = req.query.download === '1' || req.query.download === 'true';
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (forceDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    }

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (isNaN(start) || start >= total || end >= total) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        return;
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', end - start + 1);
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', total);
      fs.createReadStream(filePath).pipe(res);
    }
  });
}
