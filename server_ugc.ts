import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile, execFileSync, spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegStatic from 'ffmpeg-static';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { generateScriptJsonWithProviders } from './server_script_providers';
import type { ScriptProviderId } from './src/lib/scriptModelProviders';
import type {
  UgcAdFormat,
  UgcAspectRatio,
  UgcCampaignSettings,
  UgcFastAssemblyJson,
  UgcModelAnalysis,
  UgcProductAnalysis,
  UgcSavedCampaign,
  UgcScenePlan,
  UgcSceneVisualFocus,
  UgcStoryboardResult,
} from './src/lib/ugcTypes';
import { UGC_AD_FORMATS } from './src/lib/ugcTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.resolve(__dirname, 'data');
const UGC_OUTPUT_DIR = path.join(DATA_ROOT, 'ugc-renders');
const UGC_LIB_DIR = path.join(DATA_ROOT, 'ugc-library');
const UGC_CAMPAIGNS_FILE = path.join(UGC_LIB_DIR, 'campaigns.json');
const FONTS_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'fonts');

interface UgcRenderJob {
  jobId: string;
  status: 'rendering' | 'completed' | 'failed';
  startedAt: number;
  result?: {
    ok: boolean;
    engine: string;
    filename: string;
    videoUrl: string;
    downloadUrl: string;
    durationSec: number;
    hasVoiceover: boolean;
    voiceoverScenesRendered: number;
    voiceoverWarning?: string;
  };
  error?: string;
}

const UGC_JOBS = new Map<string, UgcRenderJob>();
const UGC_PYTHON_DIR = path.resolve(__dirname, 'backend_ugc');
const DEFAULT_PYTHON_PORT = Number(process.env.UGC_PYTHON_PORT || 5055);
let pythonChildProc: ChildProcess | null = null;
let pythonBootPromise: Promise<string> | null = null;

function ensureUgcDirs(): void {
  for (const dir of [UGC_OUTPUT_DIR, UGC_LIB_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function getLocalOrConfiguredPythonUrl(): { url: string; isExternal: boolean } {
  const configured = (process.env.UGC_PYTHON_URL || '').trim().replace(/\/+$/, '');
  if (configured) return { url: configured, isExternal: true };
  return { url: `http://127.0.0.1:${DEFAULT_PYTHON_PORT}`, isExternal: false };
}

async function fetchPythonHealth(baseUrl: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function ensurePythonCompanionRunning(): Promise<{ baseUrl: string; health: any }> {
  const { url, isExternal } = getLocalOrConfiguredPythonUrl();
  const existing = await fetchPythonHealth(url);
  if (existing?.ok) {
    return { baseUrl: url, health: existing };
  }

  if (isExternal) {
    throw new Error(`Configured UGC_PYTHON_URL (${url}) respond nahi kar raha. Flask companion service check karein.`);
  }

  if (!pythonBootPromise) {
    pythonBootPromise = (async () => {
      ensureUgcDirs();
      const ff = resolveFfmpegBinary();
      const appPy = path.join(UGC_PYTHON_DIR, 'app.py');
      if (!fs.existsSync(appPy)) {
        throw new Error('backend_ugc/app.py missing hai.');
      }

      if (!pythonChildProc || pythonChildProc.killed) {
        const pyBin = process.env.PYTHON_BIN || 'python3';
        pythonChildProc = spawn(pyBin, [appPy], {
          cwd: UGC_PYTHON_DIR,
          env: {
            ...process.env,
            UGC_PYTHON_PORT: String(DEFAULT_PYTHON_PORT),
            UGC_RENDERS_DIR: UGC_OUTPUT_DIR,
            ...(ff ? { FFMPEG_PATH: ff.bin } : {}),
            PYTHONUNBUFFERED: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        pythonChildProc.stdout?.on('data', (d) => {
          const msg = String(d).trim();
          if (msg) console.log(`[UGC-Flask] ${msg}`);
        });
        pythonChildProc.stderr?.on('data', (d) => {
          const msg = String(d).trim();
          if (msg && !msg.includes('WARNING: This is a development server')) {
            console.log(`[UGC-Flask] ${msg}`);
          }
        });
        pythonChildProc.on('exit', () => {
          pythonChildProc = null;
        });
      }

      for (let i = 0; i < 24; i++) {
        const h = await fetchPythonHealth(url);
        if (h?.ok) return url;
        await new Promise((r) => setTimeout(r, 350));
      }
      throw new Error('Python Flask Companion Service port 5055 par start nahi ho saki.');
    })().finally(() => {
      pythonBootPromise = null;
    });
  }

  const readyUrl = await pythonBootPromise;
  const readyHealth = await fetchPythonHealth(readyUrl);
  if (!readyHealth?.ok) {
    throw new Error('Python Flask Companion Service health check fail ho gayi.');
  }
  return { baseUrl: readyUrl, health: readyHealth };
}

function buildDirectStoryboardFromScriptInputs(
  settings: Partial<UgcCampaignSettings>,
  productAnalysis?: UgcProductAnalysis | null,
  hasModelImage = false
): UgcStoryboardResult {
  const totalDuration = Math.max(6, Math.min(45, Number(settings.totalDurationSec || 15)));
  const ratio: UgcAspectRatio =
    settings.aspectRatio === '16:9' || settings.aspectRatio === '1:1' ? settings.aspectRatio : '9:16';
  const brand = String(settings.brandName || productAnalysis?.brandName || 'Brand Studio').trim();
  const product = String(settings.productDetails || productAnalysis?.productName || 'Signature Product').trim();
  const usp = String(settings.uspOffer || 'Premium crafted quality for everyday results').trim();
  const cta = String(settings.callToAction || 'Shop Now · Limited Offer').trim();
  const lang = (settings.language || 'Roman Urdu (Pakistani Creator)') as UgcCampaignSettings['language'];

  const rawLines = product
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const durations = splitDurationsEvenly(totalDuration, 4);
  const templates: Array<{
    title: string;
    focus: UgcSceneVisualFocus;
    hook: string;
    vo: string;
  }> = [
    {
      title: 'Attention Hook & Product Lock',
      focus: 'product_hero',
      hook: `${brand} · Watch This`,
      vo:
        rawLines[0] ||
        (lang.includes('English')
          ? `Meet ${product} by ${brand} — engineered to upgrade your daily routine.`
          : `${brand} ka ${product} check karein — pehli hi nazar mein farq saaf dikhta hai!`),
    },
    {
      title: 'Macro Texture & Proof',
      focus: 'product_macro',
      hook: productAnalysis?.material || '100% Authentic Craft',
      vo:
        rawLines[1] ||
        (lang.includes('English')
          ? `Look closer at every detail. ${usp}.`
          : `Har detail aur finish bilkul original hai. ${usp}.`),
    },
    {
      title: hasModelImage ? 'Creator Showcase & Proof' : 'Showcase Highlight',
      focus: hasModelImage ? 'split_model_product' : 'product_hero',
      hook: usp.slice(0, 42),
      vo:
        rawLines[2] ||
        (lang.includes('English')
          ? `Real performance you can trust every single day.`
          : `Daily use ke liye zabardast performance aur real results.`),
    },
    {
      title: 'Final Brand Lockup & CTA',
      focus: 'reveal_lockup',
      hook: cta,
      vo:
        rawLines[3] ||
        (lang.includes('English')
          ? `${cta} with ${brand} today.`
          : `Abhi order karein — ${cta}!`),
    },
  ];

  const normalized = normalizeSceneDurations(
    templates.map((t, i) => ({
      title: t.title,
      durationSec: durations[i],
      visualFocus: t.focus,
      cameraMovement: 'Python Direct Ken-Burns + Crossfade Motion',
      lightingStyle: 'Studio Balanced Grade',
      characterAction: hasModelImage ? 'Creator paired cleanly beside locked product card' : 'Product centerpiece motion',
      productInteraction: 'Uploaded product geometry & branding strictly locked',
      voiceoverLine: t.vo,
      onScreenHook: t.hook,
      negativeConstraints: settings.customNegativeConstraints || 'blurry, altered product',
    })),
    totalDuration
  );

  return {
    campaignTitle: `${brand} — Direct Python Commercial`,
    openingSignature: getFormatRuleSummary((settings.adFormat || 'ugc_creator_haul') as UgcAdFormat),
    totalDurationSec: totalDuration,
    aspectRatio: ratio,
    language: lang,
    scenes: normalized,
    fullFormattedOutput: normalized.map((s) => s.veo3PromptFormatted).join('\n\n'),
    masterNegativePrompt: String(settings.customNegativeConstraints || ''),
    strategyNotesRomanUrdu:
      'Stage 4 Python Flask pipeline ne script inputs ko directly multi-scene HD MP4 mein synthesize kar diya (external video generation models bypass kiye gaye hain).',
  };
}

function getUgcAiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function resolveFfmpegBinary(): { bin: string; source: string } | null {
  const candidates: Array<{ bin: string; source: string }> = [];
  if (process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim()) {
    candidates.push({ bin: process.env.FFMPEG_PATH.trim(), source: 'env:FFMPEG_PATH' });
  }
  candidates.push({ bin: '/usr/bin/ffmpeg', source: 'system:/usr/bin/ffmpeg' });
  candidates.push({ bin: 'ffmpeg', source: 'PATH:ffmpeg' });
  if (typeof ffmpegStatic === 'string' && ffmpegStatic.length > 0) {
    candidates.push({ bin: ffmpegStatic, source: 'npm:ffmpeg-static' });
  }

  for (const cand of candidates) {
    try {
      if (cand.bin.includes(path.sep) && !fs.existsSync(cand.bin)) continue;
      execFileSync(cand.bin, ['-version'], { stdio: 'ignore', timeout: 4000 });
      return cand;
    } catch {
      // try next
    }
  }
  return null;
}

function runExecFile(
  bin: string,
  args: string[],
  timeoutMs = 210000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      bin,
      args,
      { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const tail = String(stderr || err.message || '').slice(-1400);
          return reject(new Error(`${err.message}\n${tail}`));
        }
        resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
      }
    );
  });
}

function decodeBase64DataUrl(
  dataUrl: string
): { mime: string; buffer: Buffer; base64: string } | null {
  const trimmed = String(dataUrl || '').trim();
  const m = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return null;
  try {
    const cleanB64 = m[2].replace(/\s+/g, '');
    return { mime: m[1].toLowerCase(), buffer: Buffer.from(cleanB64, 'base64'), base64: cleanB64 };
  } catch {
    return null;
  }
}

function extractJsonSafe(raw: string): any {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI response JSON format parse nahi ho saka.');
  }
}

function friendlyGeminiError(err: any, fallback: string): string {
  const msg = String(err?.message || '');
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
    return 'Gemini API quota limit abhi complete ho chuki hai. Thori der baad ya billing-enabled key ke sath try karein.';
  }
  if (/401|403|PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(msg)) {
    return 'Gemini API key invalid ya unauthorized hai. Settings > Secrets mein GEMINI_API_KEY check karein.';
  }
  if (/503|UNAVAILABLE|overloaded/i.test(msg)) {
    return 'Gemini model abhi busy hai. 1 minute baad dobara koshish karein.';
  }
  return msg && msg.length <= 260 ? msg : fallback;
}

function getDimensionsForAspect(ratio: UgcAspectRatio): { width: number; height: number } {
  if (ratio === '16:9') return { width: 1280, height: 720 };
  if (ratio === '1:1') return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function escapeAssText(s: string): string {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r?\n/g, '\\N');
}

function formatAssTime(sec: number): string {
  const clamped = Math.max(0, sec);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function wrapCaptionLines(text: string, maxChars: number): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current ? current + ' ' + w : w).length <= maxChars) {
      current = current ? current + ' ' + w : w;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function buildSceneCaptionAss(
  hookText: string,
  voiceoverLine: string,
  brandLabel: string,
  durationSec: number,
  width: number,
  height: number,
  captionMode: UgcCampaignSettings['captionMode'],
  accentHex: string
): string {
  const events: string[] = [];
  const cleanAccent = /^#[0-9a-f]{6}$/i.test(accentHex) ? accentHex : '#10B981';
  const r = cleanAccent.slice(1, 3);
  const g = cleanAccent.slice(3, 5);
  const b = cleanAccent.slice(5, 7);
  const accentAss = `&H00${b}${g}${r}&`.toUpperCase();

  if (captionMode !== 'no_text') {
    const tEnd = formatAssTime(Math.max(0.5, durationSec - 0.1));
    if (hookText.trim()) {
      const hookWrapped = wrapCaptionLines(hookText, width >= 1200 ? 36 : 24).join('\\N');
      const hookY = Math.round(height * (captionMode === 'bold_hook' ? 0.16 : 0.14));
      const hookFs = captionMode === 'bold_hook' ? Math.round(height * 0.032) : Math.round(height * 0.024);
      events.push(
        `Dialogue: 1,0:00:00.12,${tEnd},Hook,,0,0,0,,{\\an5\\pos(${Math.round(width / 2)},${hookY})\\fs${hookFs}\\b1\\1c&H00FFFFFF&\\3c&H000F172A&\\bord4\\shad2\\fad(180,180)}${escapeAssText(hookWrapped).replace(/\\\\N/g, '\\N')}`
      );
    }

    if (voiceoverLine.trim()) {
      const voWrapped = wrapCaptionLines(voiceoverLine, width >= 1200 ? 42 : 28).join('\\N');
      const voY = Math.round(height * 0.83);
      const voFs = Math.round(height * 0.025);
      events.push(
        `Dialogue: 2,0:00:00.20,${tEnd},Subtitle,,0,0,0,,{\\an5\\pos(${Math.round(width / 2)},${voY})\\fs${voFs}\\b1\\1c&H00F8FAFC&\\3c&H00090D16&\\4c&H70000000&\\bord3\\shad1.5\\fad(150,150)}${escapeAssText(voWrapped).replace(/\\\\N/g, '\\N')}`
      );
    }

    if (brandLabel.trim()) {
      const brandY = Math.round(height * 0.92);
      const brandFs = Math.round(height * 0.019);
      events.push(
        `Dialogue: 0,0:00:00.05,${tEnd},Brand,,0,0,0,,{\\an5\\pos(${Math.round(width / 2)},${brandY})\\fs${brandFs}\\b1\\1c${accentAss}\\3c&H00090D16&\\bord2.5\\fad(120,120)}${escapeAssText(brandLabel.toUpperCase())}`
      );
    }
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,DejaVu Sans,46,&H00FFFFFF,&H00FFFFFF,&H000F172A,&H70000000,1,0,0,0,100,100,0.4,0,1,4,2,5,32,32,32,1
Style: Subtitle,DejaVu Sans,40,&H00F8FAFC,&H00FFFFFF,&H00090D16,&H80000000,1,0,0,0,100,100,0.2,0,1,3,1.5,5,36,36,36,1
Style: Brand,DejaVu Sans,30,&H0010B981,&H00FFFFFF,&H00090D16,&H60000000,1,0,0,0,100,100,1.2,0,1,2.5,1,5,24,24,24,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`;
}

function readCampaigns(): UgcSavedCampaign[] {
  ensureUgcDirs();
  if (!fs.existsSync(UGC_CAMPAIGNS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(UGC_CAMPAIGNS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCampaigns(items: UgcSavedCampaign[]): void {
  ensureUgcDirs();
  fs.writeFileSync(UGC_CAMPAIGNS_FILE, JSON.stringify(items.slice(0, 40), null, 2), 'utf8');
}

function getFormatRuleSummary(adFormat: UgcAdFormat): string {
  const found = UGC_AD_FORMATS.find((f) => f.id === adFormat);
  return found ? `${found.label} — Opening: ${found.openingRule}` : adFormat;
}

function splitDurationsEvenly(totalSec: number, count: number): number[] {
  const clampedTotal = Math.max(6, Math.min(45, totalSec));
  const raw = clampedTotal / count;
  const rounded = Array.from({ length: count }, () => Number(raw.toFixed(1)));
  const currentSum = rounded.reduce((a, b) => a + b, 0);
  rounded[count - 1] = Number((rounded[count - 1] + (clampedTotal - currentSum)).toFixed(1));
  return rounded;
}

function normalizeSceneDurations(scenes: any[], targetTotalSec: number): UgcScenePlan[] {
  const count = Math.max(1, scenes.length);
  const sum = scenes.reduce((acc, s) => acc + Math.max(1.2, Number(s.durationSec) || 2.5), 0);
  const scale = sum > 0 ? targetTotalSec / sum : 1;

  let cursor = 0;
  return scenes.map((s, idx) => {
    const isLast = idx === count - 1;
    const dur = isLast
      ? Math.max(1.5, Number((targetTotalSec - cursor).toFixed(1)))
      : Math.max(1.5, Number((Math.max(1.2, Number(s.durationSec) || 2.5) * scale).toFixed(1)));
    const startT = Number(cursor.toFixed(1));
    const endT = Number((cursor + dur).toFixed(1));
    cursor = endT;

    const validFocus: UgcSceneVisualFocus[] = [
      'product_hero',
      'product_macro',
      'model_avatar',
      'split_model_product',
      'reveal_lockup',
    ];
    const visualFocus: UgcSceneVisualFocus = validFocus.includes(s.visualFocus)
      ? s.visualFocus
      : idx === 0
        ? 'product_hero'
        : idx === count - 1
          ? 'reveal_lockup'
          : 'split_model_product';

    const timeRange = `${startT.toFixed(1)}s–${endT.toFixed(1)}s`;
    const camera = String(s.cameraMovement || 'Smooth macro push-in with controlled shallow depth of field').trim();
    const lighting = String(s.lightingStyle || 'Soft directional studio key light with crisp rim highlights').trim();
    const charAct = String(s.characterAction || 'Creator presents the product naturally toward camera').trim();
    const prodInt = String(s.productInteraction || 'Exact product silhouette, colors, and branding locked in sharp focus').trim();
    const vo = String(s.voiceoverLine || '').trim();
    const neg = String(
      s.negativeConstraints ||
        'blurry, deformed hands, extra fingers, floating objects, warped fabric, distorted brand logo, redesigned product, unrelated text overlays'
    ).trim();

    const promptBody = `[Cinematic Movement: ${camera}] [Voiceover: "${vo || 'None / Pure sound design'}"] [Character Actions: ${charAct}] [Product Interaction: ${prodInt}] [Camera Style: ${camera}] [Lighting: ${lighting}] [Negative Constraints: ${neg}]`;
    const veo3PromptFormatted = `**SCENE ${idx + 1} (${dur.toFixed(1)}s | ${timeRange})**\nGoogle Omni / Veo 3 Prompt: ${promptBody}`;

    return {
      sceneNumber: idx + 1,
      title: String(s.title || `Scene ${idx + 1}`).trim(),
      durationSec: dur,
      timeRange,
      visualFocus,
      cameraMovement: camera,
      lightingStyle: lighting,
      characterAction: charAct,
      productInteraction: prodInt,
      voiceoverLine: vo,
      onScreenHook: String(s.onScreenHook || '').trim(),
      negativeConstraints: neg,
      veo3PromptFormatted,
    };
  });
}

export function registerUgcRoutes(app: Express): void {
  ensureUgcDirs();

  // Stage 1: Product Reality Lock (Vision AI)
  app.post('/api/ugc/analyze-product', async (req, res) => {
    try {
      const body = req.body || {};
      const productImageDataUrl = String(body.productImageDataUrl || '');
      const secondaryImageDataUrl = String(body.secondaryImageDataUrl || '');
      const brandHint = String(body.brandHint || '').trim();
      const productDetails = String(body.productDetails || '').trim();

      const dec1 = decodeBase64DataUrl(productImageDataUrl);
      if (!dec1) {
        return res.status(400).json({ ok: false, error: 'Valid product image (PNG/JPG/WebP) upload karein.' });
      }

      // Optional delegation to Python Flask analyzer microservice if configured
      const pyUrl = (process.env.UGC_PYTHON_URL || '').trim().replace(/\/+$/, '');
      if (pyUrl) {
        try {
          const pyResp = await fetch(`${pyUrl}/analyze-product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productImageDataUrl, brandHint }),
          });
          if (pyResp.ok) {
            const pyJson: any = await pyResp.json();
            if (pyJson?.ok && pyJson.analysis) {
              return res.json({
                ok: true,
                engine: 'python-flask-vision',
                analysis: { ...pyJson.analysis, analyzedAt: new Date().toISOString() },
              });
            }
          }
        } catch (err) {
          console.warn('[UGC Python Delegation Note]:', err);
        }
      }

      const ai = getUgcAiClient();
      if (!ai) {
        return res.status(400).json({
          ok: false,
          error: 'GEMINI_API_KEY configured nahi hai. Settings > Secrets mein valid API key check karein.',
        });
      }

      const parts: any[] = [
        { inlineData: { mimeType: dec1.mime, data: dec1.base64 } },
      ];
      const dec2 = decodeBase64DataUrl(secondaryImageDataUrl);
      if (dec2) {
        parts.push({ inlineData: { mimeType: dec2.mime, data: dec2.base64 } });
      }
      parts.push({
        text: `You are Stage 1 (Product Reality Lock) of the UGC Ad Engine.
Analyze the uploaded product image(s) as the ABSOLUTE SOURCE OF TRUTH.
Brand / Product Hint from client: "${brandHint || 'Infer directly from image'}".
Additional Details: "${productDetails || 'None'}".

Rules:
- Identify exact category, visible material/texture, colorPalette (3-5 exact hex codes), human-readable colorNames, exact visible brandingAndText/labels, silhouetteAndProportions, 4-6 keyVisualFeatures physically present in the image, recommendedOpening (matched to product category: e.g. Liquid Formation for skincare, Sole Drop for footwear, Hyper-Kinetic Macro for watch, 3D Emergence for menu card, Creator Haul Hold for fashion/general, Fast-Assembly Reveal for brand/tech), and a strict realityLockDirective stating zero redesign/color/logo alteration.
- Write summaryRomanUrdu in natural, crisp Pakistani Roman Urdu (2 short sentences).`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              productName: { type: Type.STRING },
              brandName: { type: Type.STRING },
              material: { type: Type.STRING },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              colorNames: { type: Type.STRING },
              brandingAndText: { type: Type.STRING },
              silhouetteAndProportions: { type: Type.STRING },
              keyVisualFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedOpening: { type: Type.STRING },
              realityLockDirective: { type: Type.STRING },
              summaryRomanUrdu: { type: Type.STRING },
            },
            required: [
              'category',
              'productName',
              'brandName',
              'material',
              'colorPalette',
              'colorNames',
              'brandingAndText',
              'silhouetteAndProportions',
              'keyVisualFeatures',
              'recommendedOpening',
              'realityLockDirective',
              'summaryRomanUrdu',
            ],
          },
        },
      });

      const parsed = extractJsonSafe(response.text || '');
      const analysis: UgcProductAnalysis = {
        category: String(parsed.category || 'Consumer Product'),
        productName: String(parsed.productName || brandHint || 'Hero Product'),
        brandName: String(parsed.brandName || brandHint || 'Brand'),
        material: String(parsed.material || 'Studio authentic finish'),
        colorPalette: Array.isArray(parsed.colorPalette) && parsed.colorPalette.length > 0
          ? parsed.colorPalette.slice(0, 5)
          : ['#0F172A', '#10B981', '#F8FAFC'],
        colorNames: String(parsed.colorNames || 'Natural Studio Palette'),
        brandingAndText: String(parsed.brandingAndText || 'Exact uploaded packaging & label preserved'),
        silhouetteAndProportions: String(parsed.silhouetteAndProportions || 'Exact geometry locked'),
        keyVisualFeatures: Array.isArray(parsed.keyVisualFeatures) ? parsed.keyVisualFeatures.slice(0, 6) : [],
        recommendedOpening: String(parsed.recommendedOpening || 'Creator Showcase Reveal'),
        realityLockDirective: String(
          parsed.realityLockDirective ||
            'Treat uploaded product image as absolute source of truth: zero redesign, zero recolor, zero altered logos.'
        ),
        summaryRomanUrdu: String(parsed.summaryRomanUrdu || 'Product ke colors, branding aur design ko 100% lock kar diya gaya hai.'),
        analyzedAt: new Date().toISOString(),
      };

      return res.json({ ok: true, engine: 'gemini-4-hydrogen-vision', analysis });
    } catch (err: any) {
      console.error('[UGC Product Vision Error]:', err);
      return res.status(500).json({ ok: false, error: friendlyGeminiError(err, 'Product analyze nahi ho saka.') });
    }
  });

  // Stage 2: Model / Avatar Integration & Identity Lock
  app.post('/api/ugc/analyze-model', async (req, res) => {
    try {
      const body = req.body || {};
      const modelImageDataUrl = String(body.modelImageDataUrl || '');
      const productCategory = String(body.productCategory || '').trim();

      const dec = decodeBase64DataUrl(modelImageDataUrl);
      if (!dec) {
        return res.status(400).json({ ok: false, error: 'Valid model/avatar image upload karein.' });
      }

      const pyUrl = (process.env.UGC_PYTHON_URL || '').trim().replace(/\/+$/, '');
      if (pyUrl) {
        try {
          const pyResp = await fetch(`${pyUrl}/analyze-model`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelImageDataUrl }),
          });
          if (pyResp.ok) {
            const pyJson: any = await pyResp.json();
            if (pyJson?.ok && pyJson.analysis) {
              return res.json({
                ok: true,
                engine: 'python-flask-vision',
                analysis: { ...pyJson.analysis, analyzedAt: new Date().toISOString() },
              });
            }
          }
        } catch (err) {
          console.warn('[UGC Python Model Delegation Note]:', err);
        }
      }

      const ai = getUgcAiClient();
      if (!ai) {
        return res.status(400).json({
          ok: false,
          error: 'GEMINI_API_KEY configured nahi hai. Settings > Secrets mein valid API key check karein.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            { inlineData: { mimeType: dec.mime, data: dec.base64 } },
            {
              text: `You are Stage 2 (Model / Avatar Integration & Face Identity Lock) of the UGC Ad Engine.
Analyze this uploaded model/avatar reference photo for ${productCategory || 'a commercial UGC video ad'}.
Focus on:
- subjectType (e.g., Gen-Z Female Creator, Male Lifestyle Presenter, etc.)
- skinToneAndRealism (natural pores, micro-texture, warm tone, zero artificial airbrushing)
- hairAndStyling (hair length, texture, strand realism, accessories)
- outfitAndFabricPhysics (garment drape, fabric weave, natural gravity folds)
- poseAndFraming (eye-level / 3/4 portrait / full-body)
- compatibilityNotes (how the creator should hold or wear the product naturally)
- faceIdentityLockRule (strict prompt rule locking face structure, expression, hair, body proportions across every scene)
- summaryRomanUrdu (2 concise Roman Urdu sentences summarizing the locked avatar profile).`,
            },
          ],
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjectType: { type: Type.STRING },
              skinToneAndRealism: { type: Type.STRING },
              hairAndStyling: { type: Type.STRING },
              outfitAndFabricPhysics: { type: Type.STRING },
              poseAndFraming: { type: Type.STRING },
              compatibilityNotes: { type: Type.STRING },
              faceIdentityLockRule: { type: Type.STRING },
              summaryRomanUrdu: { type: Type.STRING },
            },
            required: [
              'subjectType',
              'skinToneAndRealism',
              'hairAndStyling',
              'outfitAndFabricPhysics',
              'poseAndFraming',
              'compatibilityNotes',
              'faceIdentityLockRule',
              'summaryRomanUrdu',
            ],
          },
        },
      });

      const parsed = extractJsonSafe(response.text || '');
      const analysis: UgcModelAnalysis = {
        subjectType: String(parsed.subjectType || 'UGC Presenter'),
        skinToneAndRealism: String(parsed.skinToneAndRealism || 'Natural DSLR skin texture with visible pores'),
        hairAndStyling: String(parsed.hairAndStyling || 'Realistic natural hair strands'),
        outfitAndFabricPhysics: String(parsed.outfitAndFabricPhysics || 'Natural fabric folds and gravity physics'),
        poseAndFraming: String(parsed.poseAndFraming || 'Vertical 9:16 creator framing'),
        compatibilityNotes: String(parsed.compatibilityNotes || 'Direct-to-camera delivery holding hero product'),
        faceIdentityLockRule: String(
          parsed.faceIdentityLockRule ||
            'Preserve exact facial features, skin tone, hairstyle, and proportions across every shot.'
        ),
        summaryRomanUrdu: String(parsed.summaryRomanUrdu || 'Model face identity, natural skin aur hair realism lock ho gaye hain.'),
        analyzedAt: new Date().toISOString(),
      };

      return res.json({ ok: true, engine: 'gemini-4-hydrogen-vision', analysis });
    } catch (err: any) {
      console.error('[UGC Model Vision Error]:', err);
      return res.status(500).json({ ok: false, error: friendlyGeminiError(err, 'Model image analyze nahi ho saki.') });
    }
  });

  // Stage 3 & 4: Campaign Storyboard & Production-Ready Google Omni / Veo 3 Prompts
  app.post('/api/ugc/generate-storyboard', async (req, res) => {
    try {
      const body = req.body || {};
      const settings = (body.settings || {}) as UgcCampaignSettings;
      const productAnalysis = body.productAnalysis as UgcProductAnalysis | null | undefined;
      const modelAnalysis = body.modelAnalysis as UgcModelAnalysis | null | undefined;

      const totalDuration = Math.max(6, Math.min(45, Number(settings.totalDurationSec || 15)));
      const sceneCount = totalDuration <= 10 ? 3 : totalDuration <= 18 ? 4 : totalDuration <= 30 ? 5 : 6;
      const aspectRatio: UgcAspectRatio =
        settings.aspectRatio === '16:9' || settings.aspectRatio === '1:1' ? settings.aspectRatio : '9:16';

      const formatRule = getFormatRuleSummary(settings.adFormat || 'ugc_creator_haul');
      const suggestedSplits = splitDurationsEvenly(totalDuration, sceneCount);

      const prompt = `You are the Elite AI Creative Director, Product Marketing Strategist, and Veo 3 Prompt Engineer of "UGC Ad Engine".

CLIENT & CAMPAIGN BRIEF:
- Brand Name: ${settings.brandName || productAnalysis?.brandName || 'Brand'}
- Product Details: ${settings.productDetails || productAnalysis?.productName || 'Hero Product'}
- USP / Key Offer: ${settings.uspOffer || 'Premium quality and visible results'}
- Desired Environment: ${settings.desiredEnvironment || 'Clean editorial lifestyle interior'}
- Campaign Goal: ${settings.campaignGoal || 'Conversion & Direct Sales'}
- Ad Format Architecture: ${formatRule}
- Language / Voiceover Script Language: ${settings.language || 'Roman Urdu (Pakistani Creator)'}
- Aspect Ratio: ${aspectRatio}
- Total Video Duration: ${totalDuration} seconds split strictly into ${sceneCount} sequential scenes summing to EXACTLY ${totalDuration}s (suggested split: ${suggestedSplits.join('s, ')}s).
- Call To Action: ${settings.callToAction || 'Shop Now'}
- Caption Mode: ${settings.captionMode || 'bold_hook'}
- Base Negative Constraints: ${settings.customNegativeConstraints || 'blurry, deformed hands, extra fingers, floating objects, warped fabric, distorted brand logo, redesigned product'}

STAGE 1 — PRODUCT REALITY LOCK (ABSOLUTE SOURCE OF TRUTH):
${productAnalysis ? JSON.stringify(productAnalysis, null, 2) : 'Use user product details faithfully with zero redesign or invented branding.'}

STAGE 2 — MODEL / AVATAR INTEGRATION (${settings.modelMode || 'upload'}):
${
  settings.modelMode === 'product_only'
    ? 'Product-Only Commercial Mode: Focus on cinematic macro product cinematography and natural hands/lower-leg human interaction without showing a full face identity.'
    : modelAnalysis
      ? JSON.stringify(modelAnalysis, null, 2)
      : `AI Avatar Specification: ${settings.avatarPromptSpec}. Enforce skin pores, natural hair strands, fabric physics, and strict face identity lock.`
}

INSTRUCTIONS FOR SCENES:
1. Build ${sceneCount} tightly paced scenes matching the chosen Ad Format:
   - Include authentic camera language (extreme macro push-in, whip-pan transition, shallow depth of field, slow-motion product interaction, confidence hero finale).
   - For ${settings.language}, write punchy, authentic, zero-cliche spoken dialogue in "voiceoverLine" (keep each scene's voiceover realistic to speak within its scene duration, ~2.2 words/sec; if captionMode is "no_text", set onScreenHook to "" or concise if captions active).
   - Pick "visualFocus" per scene strictly from: "product_hero", "product_macro", "model_avatar", "split_model_product", "reveal_lockup".
   - Make sure "negativeConstraints" on EVERY scene explicitly preserves product identity and avoids blurry/deformed/floating artifacts.
2. Also populate "fastAssemblyJson" (concise pure JSON specification for fast-assembly hero reveal spots: present tense, active voice, under 120 words description, "text": "none").
3. Write "strategyNotesRomanUrdu" in crisp Roman Urdu explaining the hook, pacing, and brand positioning.

Return STRICT valid raw JSON only (no markdown fences) matching this exact schema:
{
  "campaignTitle": "string",
  "openingSignature": "string",
  "strategyNotesRomanUrdu": "string",
  "masterNegativePrompt": "string",
  "scenes": [
    {
      "title": "string",
      "durationSec": 4,
      "visualFocus": "product_hero",
      "cameraMovement": "string",
      "lightingStyle": "string",
      "characterAction": "string",
      "productInteraction": "string",
      "voiceoverLine": "string",
      "onScreenHook": "string",
      "negativeConstraints": "string"
    }
  ],
  "fastAssemblyJson": {
    "description": "string",
    "style": "string",
    "camera": "string",
    "lighting": "string",
    "environment": "string",
    "elements": ["string"],
    "motion": "string",
    "ending": "string",
    "text": "none",
    "keywords": ["string"]
  }
}`;

      const routerRes = await generateScriptJsonWithProviders<any>({
        prompt,
        preferredProvider: (settings.scriptProvider || 'auto') as ScriptProviderId,
        preferredModel: String(settings.scriptModel || ''),
        autoFailover: settings.autoFailover !== false,
        temperature: 0.78,
        maxTokens: 8192,
        timeoutMs: 45000,
        validate: (p) => {
          const s = Array.isArray(p?.scenes) ? p.scenes : [];
          if (s.length === 0) {
            throw new Error('AI ne empty storyboard return kiya. Dobara try karein.');
          }
        },
      });

      const parsed = routerRes.parsed;
      const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];

      const normalizedScenes = normalizeSceneDurations(rawScenes, totalDuration);
      const fullFormattedOutput = normalizedScenes.map((s) => s.veo3PromptFormatted).join('\n\n');

      const fastAssemblyJson: UgcFastAssemblyJson | undefined = parsed.fastAssemblyJson
        ? {
            description: String(parsed.fastAssemblyJson.description || ''),
            style: String(parsed.fastAssemblyJson.style || 'cinematic, photoreal, 4K'),
            camera: String(parsed.fastAssemblyJson.camera || ''),
            lighting: String(parsed.fastAssemblyJson.lighting || ''),
            environment: String(parsed.fastAssemblyJson.environment || ''),
            elements: Array.isArray(parsed.fastAssemblyJson.elements)
              ? parsed.fastAssemblyJson.elements
              : [],
            motion: String(parsed.fastAssemblyJson.motion || ''),
            ending: String(parsed.fastAssemblyJson.ending || ''),
            text: 'none',
            keywords: Array.isArray(parsed.fastAssemblyJson.keywords)
              ? parsed.fastAssemblyJson.keywords
              : [aspectRatio, settings.brandName || 'brand', 'no text'],
          }
        : undefined;

      const storyboard: UgcStoryboardResult = {
        campaignTitle: String(
          parsed.campaignTitle || `${settings.brandName || productAnalysis?.brandName || 'Brand'} UGC Campaign`
        ),
        openingSignature: String(parsed.openingSignature || formatRule),
        totalDurationSec: totalDuration,
        aspectRatio,
        language: settings.language,
        scenes: normalizedScenes,
        fastAssemblyJson,
        fullFormattedOutput,
        masterNegativePrompt: String(parsed.masterNegativePrompt || settings.customNegativeConstraints),
        strategyNotesRomanUrdu: String(parsed.strategyNotesRomanUrdu || ''),
        providerUsed: routerRes.providerUsed,
        modelUsed: routerRes.modelUsed,
        failoverUsed: routerRes.failoverUsed,
      };

      return res.json({
        ok: true,
        storyboard,
        providerUsed: routerRes.providerUsed,
        modelUsed: routerRes.modelUsed,
        failoverUsed: routerRes.failoverUsed,
      });
    } catch (err: any) {
      console.error('[UGC Storyboard Error]:', err);
      return res.status(500).json({ ok: false, error: friendlyGeminiError(err, 'Storyboard aur Veo 3 prompts generate nahi ho sake.') });
    }
  });

  // Auto-boot local Python Flask Companion Service in background when routes register
  ensurePythonCompanionRunning().catch((err) => {
    console.warn('[UGC-Flask Boot Note]:', err?.message || err);
  });

  app.get('/api/ugc/python-status', async (_req, res) => {
    try {
      const { baseUrl, health } = await ensurePythonCompanionRunning();
      return res.json({
        ok: true,
        pythonUrl: baseUrl,
        mode: 'python-flask-companion',
        externalVideoModelsBypassed: true,
        health,
      });
    } catch (err: any) {
      return res.status(503).json({
        ok: false,
        mode: 'python-flask-companion',
        error: err?.message || 'Python Flask Companion Service unavailable',
      });
    }
  });

  // Render complete multi-scene MP4 Commercial Video via Python Flask Companion Service
  // Directly processes script writing inputs & synthesizes HD MP4 (bypasses external video gen models)
  app.post('/api/ugc/render-video', async (req, res) => {
    const ff = resolveFfmpegBinary();
    const body = req.body || {};
    const productImageDataUrl = String(body.productImageDataUrl || '');
    const modelImageDataUrl = String(body.modelImageDataUrl || '');
    const settings = (body.settings || {}) as UgcCampaignSettings;
    const productAnalysis = body.productAnalysis as UgcProductAnalysis | undefined;

    const decProduct = decodeBase64DataUrl(productImageDataUrl);
    const decModel = decodeBase64DataUrl(modelImageDataUrl);
    if (!decProduct && !decModel) {
      return res.status(400).json({
        ok: false,
        error: 'Video synthesize karne ke liye kam az kam Product ya Model image provide karein.',
      });
    }

    // Automatically convert script-writing inputs into multi-scene storyboard if scenes weren't generated yet
    let storyboard = body.storyboard as UgcStoryboardResult | undefined;
    if (!storyboard || !Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
      storyboard = buildDirectStoryboardFromScriptInputs(settings, productAnalysis, Boolean(decModel));
    }

    const jobId = `ugc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const job: UgcRenderJob = {
      jobId,
      status: 'rendering',
      startedAt: Date.now(),
    };
    UGC_JOBS.set(jobId, job);

    const runRender = async () => {
      ensureUgcDirs();
      try {
        // 1. Ensure Python Flask Companion Service is active
        const { baseUrl: pyBaseUrl } = await ensurePythonCompanionRunning();

        // 2. Optional Gemini TTS Voiceover generation per scene (passes base64 WAV clips into Python Flask)
        const ai = getUgcAiClient();
        const voiceoverClips: Array<{ idx: number; wavBase64: string; startOffsetSec: number }> = [];
        let voiceoverWarning = '';
        const scenes = storyboard!.scenes;

        if (settings.enableVoiceover && ai) {
          let timeCursor = 0;
          for (let i = 0; i < scenes.length; i++) {
            const sc = scenes[i];
            const voText = String(sc.voiceoverLine || '').replace(/["*#`]/g, '').trim();
            if (voText.length > 0) {
              try {
                const ttsResp = await ai.models.generateContent({
                  model: 'gemini-3.8-flash-lite-tts',
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        {
                          text: voText.slice(0, 320),
                          speechMetadata: {
                            style:
                              settings.voiceStyle ||
                              'Energetic natural UGC brand creator speaking with crisp authentic tone',
                          },
                        },
                      ],
                    },
                  ],
                  config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Kore' },
                      },
                    },
                  },
                });
                const b64Audio = ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (b64Audio) {
                  voiceoverClips.push({ idx: i, wavBase64: b64Audio, startOffsetSec: timeCursor });
                }
              } catch (ttsErr: any) {
                if (!voiceoverWarning) {
                  voiceoverWarning = friendlyGeminiError(ttsErr, 'TTS voiceover generate nahi ho saka.');
                }
              }
            }
            timeCursor += Math.max(1.5, Number(sc.durationSec || 3));
          }
        } else if (settings.enableVoiceover && !ai) {
          voiceoverWarning = 'GEMINI_API_KEY missing hone ki wajah se TTS voiceover skip hua.';
        }

        // 3. Dispatch full script-to-video synthesis directly to Python Flask Companion Service
        const pyResp = await fetch(`${pyBaseUrl}/synthesize-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            async: false,
            productImageDataUrl,
            modelImageDataUrl,
            settings,
            storyboard,
            productAnalysis,
            voiceoverClips,
            ...(ff ? { ffmpegPath: ff.bin } : {}),
          }),
        });

        const pyData: any = await pyResp.json().catch(() => null);
        if (!pyResp.ok || !pyData?.ok || !pyData?.filename) {
          throw new Error(pyData?.error || 'Python Flask video synthesis fail ho gayi.');
        }

        // If external UGC_PYTHON_URL rendered remotely, mirror MP4 into local UGC_OUTPUT_DIR
        const outFilename = path.basename(String(pyData.filename));
        const localOutPath = path.join(UGC_OUTPUT_DIR, outFilename);
        if (!fs.existsSync(localOutPath)) {
          const dlResp = await fetch(`${pyBaseUrl}/download/${encodeURIComponent(outFilename)}`);
          if (!dlResp.ok) {
            throw new Error('Synthesized MP4 Python Flask service se download nahi ho saki.');
          }
          const arrBuf = await dlResp.arrayBuffer();
          fs.writeFileSync(localOutPath, Buffer.from(arrBuf));
        }

        job.status = 'completed';
        job.result = {
          ok: true,
          engine: String(pyData.engine || 'python-flask (Pillow + NumPy + FFmpeg)'),
          filename: outFilename,
          videoUrl: `/api/ugc/download/${outFilename}`,
          downloadUrl: `/api/ugc/download/${outFilename}?download=1`,
          durationSec: Number(pyData.durationSec || storyboard!.totalDurationSec || 15),
          hasVoiceover: Boolean(pyData.hasVoiceover),
          voiceoverScenesRendered: Number(pyData.voiceoverScenesRendered || 0),
          ...(voiceoverWarning ? { voiceoverWarning } : {}),
        };
      } catch (err: any) {
        job.status = 'failed';
        job.error = err?.message || 'Python Flask UGC video synthesis fail ho gayi.';
      }
    };

    const renderPromise = runRender();
    const fastOutcome = await Promise.race([
      renderPromise.then(() => 'done' as const),
      new Promise<'pending'>((r) => setTimeout(() => r('pending'), 8000)),
    ]);

    if (fastOutcome === 'done') {
      if (job.status === 'completed' && job.result) {
        return res.json({ ...job.result, status: 'completed', jobId, storyboardUsed: storyboard });
      }
      return res.status(500).json({ ok: false, status: 'failed', jobId, error: job.error || 'Render failed' });
    }

    return res.json({ ok: true, status: 'rendering', jobId, storyboardUsed: storyboard });
  });

  app.get('/api/ugc/jobs/:jobId', (req, res) => {
    const job = UGC_JOBS.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ ok: false, status: 'failed', error: 'UGC job not found' });
    }
    const elapsedSec = Math.max(0, Math.round((Date.now() - job.startedAt) / 1000));
    if (job.status === 'completed' && job.result) {
      return res.json({ ...job.result, status: 'completed', jobId: job.jobId, elapsedSec });
    }
    if (job.status === 'failed') {
      return res.status(500).json({ ok: false, status: 'failed', jobId: job.jobId, elapsedSec, error: job.error || 'Render failed' });
    }
    return res.json({ ok: true, status: 'rendering', jobId: job.jobId, elapsedSec });
  });

  app.get('/api/ugc/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename || '');
    const filePath = path.join(UGC_OUTPUT_DIR, safeName);
    if (!safeName || !fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: 'Rendered UGC video file nahi mili.' });
    }
    const stat = fs.statSync(filePath);
    const total = stat.size;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    }

    const range = req.headers.range;
    if (range) {
      const m = range.match(/bytes=(\d+)-(\d*)/);
      const start = m ? parseInt(m[1], 10) : 0;
      const end = m && m[2] ? Math.min(total - 1, parseInt(m[2], 10)) : total - 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(end - start + 1));
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.setHeader('Content-Length', String(total));
    fs.createReadStream(filePath).pipe(res);
  });

  // Saved Client Campaigns CRUD
  app.get('/api/ugc/campaigns', (_req, res) => {
    res.json({ ok: true, campaigns: readCampaigns() });
  });

  app.post('/api/ugc/campaigns', (req, res) => {
    try {
      const body = req.body || {};
      const title = String(body.title || body.settings?.brandName || 'Client UGC Campaign').trim().slice(0, 80);
      const clientName = String(body.clientName || body.settings?.brandName || 'Brand Client').trim().slice(0, 80);
      const settings = body.settings as UgcCampaignSettings;
      if (!settings) {
        return res.status(400).json({ ok: false, error: 'Campaign settings required' });
      }
      const now = new Date().toISOString();
      const id = String(body.id || `ugc_camp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`);
      const existing = readCampaigns();
      const item: UgcSavedCampaign = {
        id,
        title,
        clientName,
        settings,
        productAnalysis: body.productAnalysis || null,
        modelAnalysis: body.modelAnalysis || null,
        storyboard: body.storyboard || null,
        lastVideoUrl: body.lastVideoUrl || undefined,
        createdAt: body.createdAt || now,
        updatedAt: now,
      };
      const updated = [item, ...existing.filter((c) => c.id !== id)];
      writeCampaigns(updated);
      res.json({ ok: true, campaign: item });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Save campaign failed' });
    }
  });

  app.delete('/api/ugc/campaigns/:id', (req, res) => {
    const items = readCampaigns();
    const filtered = items.filter((c) => c.id !== req.params.id);
    writeCampaigns(filtered);
    res.json({ ok: true });
  });
}
