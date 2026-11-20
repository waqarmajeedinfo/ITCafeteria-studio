import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegStatic from 'ffmpeg-static';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
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

function ensureUgcDirs(): void {
  for (const dir of [UGC_OUTPUT_DIR, UGC_LIB_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
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

      const ai = getUgcAiClient();
      if (!ai) {
        return res.status(400).json({
          ok: false,
          error: 'GEMINI_API_KEY configured nahi hai. Settings > Secrets mein valid API key check karein.',
        });
      }

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
3. Write "strategyNotesRomanUrdu" in crisp Roman Urdu explaining the hook, pacing, and brand positioning.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              campaignTitle: { type: Type.STRING },
              openingSignature: { type: Type.STRING },
              strategyNotesRomanUrdu: { type: Type.STRING },
              masterNegativePrompt: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    durationSec: { type: Type.NUMBER },
                    visualFocus: { type: Type.STRING },
                    cameraMovement: { type: Type.STRING },
                    lightingStyle: { type: Type.STRING },
                    characterAction: { type: Type.STRING },
                    productInteraction: { type: Type.STRING },
                    voiceoverLine: { type: Type.STRING },
                    onScreenHook: { type: Type.STRING },
                    negativeConstraints: { type: Type.STRING },
                  },
                  required: [
                    'title',
                    'durationSec',
                    'visualFocus',
                    'cameraMovement',
                    'lightingStyle',
                    'characterAction',
                    'productInteraction',
                    'voiceoverLine',
                    'onScreenHook',
                    'negativeConstraints',
                  ],
                },
              },
              fastAssemblyJson: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  style: { type: Type.STRING },
                  camera: { type: Type.STRING },
                  lighting: { type: Type.STRING },
                  environment: { type: Type.STRING },
                  elements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  motion: { type: Type.STRING },
                  ending: { type: Type.STRING },
                  text: { type: Type.STRING },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'description',
                  'style',
                  'camera',
                  'lighting',
                  'environment',
                  'elements',
                  'motion',
                  'ending',
                  'text',
                  'keywords',
                ],
              },
            },
            required: [
              'campaignTitle',
              'openingSignature',
              'strategyNotesRomanUrdu',
              'masterNegativePrompt',
              'scenes',
              'fastAssemblyJson',
            ],
          },
        },
      });

      const parsed = extractJsonSafe(response.text || '');
      const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
      if (rawScenes.length === 0) {
        throw new Error('AI ne empty storyboard return kiya. Dobara try karein.');
      }

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
      };

      return res.json({ ok: true, storyboard });
    } catch (err: any) {
      console.error('[UGC Storyboard Error]:', err);
      return res.status(500).json({ ok: false, error: friendlyGeminiError(err, 'Storyboard aur Veo 3 prompts generate nahi ho sake.') });
    }
  });

  // Render complete multi-scene MP4 Commercial Video (FFmpeg + LibASS + Gemini TTS Voiceover)
  app.post('/api/ugc/render-video', async (req, res) => {
    const ff = resolveFfmpegBinary();
    if (!ff) {
      return res.status(500).json({
        ok: false,
        error: 'FFmpeg binary server par available nahi hai.',
      });
    }

    const body = req.body || {};
    const productImageDataUrl = String(body.productImageDataUrl || '');
    const modelImageDataUrl = String(body.modelImageDataUrl || '');
    const settings = (body.settings || {}) as UgcCampaignSettings;
    const storyboard = body.storyboard as UgcStoryboardResult | undefined;
    const productAnalysis = body.productAnalysis as UgcProductAnalysis | undefined;

    const decProduct = decodeBase64DataUrl(productImageDataUrl);
    const decModel = decodeBase64DataUrl(modelImageDataUrl);
    if (!decProduct && !decModel) {
      return res.status(400).json({
        ok: false,
        error: 'Video render karne ke liye kam az kam Product ya Model image provide karein.',
      });
    }

    if (!storyboard || !Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Pehle Stage 4 storyboard scenes generate karein.',
      });
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
      const tmpDir = path.join(UGC_OUTPUT_DIR, `tmp_${jobId}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        const aspectRatio: UgcAspectRatio = storyboard.aspectRatio || settings.aspectRatio || '9:16';
        const { width: W, height: H } = getDimensionsForAspect(aspectRatio);
        const scenes = storyboard.scenes;
        const brandLabel = String(settings.brandName || productAnalysis?.brandName || 'BRAND CAMPAIGN').trim();
        const accentHex = productAnalysis?.colorPalette?.[1] || productAnalysis?.colorPalette?.[0] || '#10B981';

        const prodExt = decProduct?.mime.includes('png') ? 'png' : decProduct?.mime.includes('webp') ? 'webp' : 'jpg';
        const modExt = decModel?.mime.includes('png') ? 'png' : decModel?.mime.includes('webp') ? 'webp' : 'jpg';

        let prodPath = '';
        if (decProduct) {
          prodPath = path.join(tmpDir, `product.${prodExt}`);
          fs.writeFileSync(prodPath, decProduct.buffer);
        }
        let modPath = '';
        if (decModel) {
          modPath = path.join(tmpDir, `model.${modExt}`);
          fs.writeFileSync(modPath, decModel.buffer);
        }

        // Primary fallback if only one image was supplied
        if (!prodPath && modPath) prodPath = modPath;
        if (!modPath && prodPath) modPath = prodPath;

        // 1. Optional Gemini TTS Voiceover generation per scene
        const ai = getUgcAiClient();
        const voiceoverPaths: Array<{ idx: number; path: string; startOffsetSec: number }> = [];
        let voiceoverWarning = '';

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
                  const wavPath = path.join(tmpDir, `vo_${i}.wav`);
                  fs.writeFileSync(wavPath, Buffer.from(b64Audio, 'base64'));
                  voiceoverPaths.push({ idx: i, path: wavPath, startOffsetSec: timeCursor });
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

        // 2. Render each scene clip individually at uniform fps/size/pix_fmt for rock-solid xfade concatenation
        const sceneMp4Paths: string[] = [];
        const safeFontsDir = fs.existsSync(FONTS_DIR) ? FONTS_DIR : tmpDir;

        for (let i = 0; i < scenes.length; i++) {
          const sc = scenes[i];
          const dur = Math.max(1.5, Number(sc.durationSec || 3));
          const sceneFile = path.join(tmpDir, `scene_${i}.mp4`);
          const assPath = path.join(tmpDir, `scene_${i}.ass`);
          const assContent = buildSceneCaptionAss(
            sc.onScreenHook || sc.title,
            sc.voiceoverLine || '',
            i === scenes.length - 1 ? settings.callToAction || brandLabel : brandLabel,
            dur,
            W,
            H,
            settings.captionMode || 'bold_hook',
            accentHex
          );
          fs.writeFileSync(assPath, assContent, 'utf8');

          const focus: UgcSceneVisualFocus = sc.visualFocus || 'product_hero';
          const hasSeparateModel = prodPath !== modPath;
          const isSplit = focus === 'split_model_product' && hasSeparateModel;
          const isModelOnly = focus === 'model_avatar' && hasSeparateModel;
          const isMacro = focus === 'product_macro';

          const args: string[] = ['-y', '-threads', '2'];

          if (isSplit) {
            // Dual-panel Model + Locked Product showcase over ambient blur
            args.push('-loop', '1', '-t', dur.toFixed(2), '-framerate', '24', '-i', modPath);
            args.push('-loop', '1', '-t', dur.toFixed(2), '-framerate', '24', '-i', prodPath);

            const isWide = W > H;
            const modW = isWide ? Math.round(W * 0.56) : Math.round(W * 0.90);
            const modH = isWide ? Math.round(H * 0.86) : Math.round(H * 0.50);
            const prodW = isWide ? Math.round(W * 0.36) : Math.round(W * 0.66);
            const prodH = isWide ? Math.round(H * 0.72) : Math.round(H * 0.30);

            const modX = isWide ? Math.round(W * 0.04) : Math.round((W - modW) / 2);
            const modY = isWide ? Math.round((H - modH) / 2) : Math.round(H * 0.14);
            const prodX = isWide ? Math.round(W * 0.61) : Math.round((W - prodW) / 2);
            const prodY = isWide ? Math.round((H - prodH) / 2) : Math.round(H * 0.56);

            const fc = [
              `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=28,eq=brightness=-0.16[bg]`,
              `[0:v]scale=${Math.round(modW * 1.08)}:${Math.round(modH * 1.08)}:force_original_aspect_ratio=increase,crop=${modW}:${modH}:'(iw-${modW})/2':'(ih-${modH})*0.35'[modc]`,
              `[1:v]scale=${prodW}:${prodH}:force_original_aspect_ratio=decrease,pad=${prodW}:${prodH}:(ow-iw)/2:(oh-ih)/2:color=0xFFFFFF@0.92[prodc]`,
              `[bg][modc]overlay=${modX}:${modY}[step1]`,
              `[step1][prodc]overlay=${prodX}:${prodY}:shortest=1[comp]`,
              `[comp]ass='${escapeFilterPath(assPath)}':fontsdir='${escapeFilterPath(safeFontsDir)}',format=yuv420p[vout]`,
            ].join(';');

            args.push('-filter_complex', fc, '-map', '[vout]');
          } else {
            const activeImg = isModelOnly ? modPath : prodPath;
            args.push('-loop', '1', '-t', dur.toFixed(2), '-framerate', '24', '-i', activeImg);

            // Dynamic motion crop per scene (macro zoom vs gentle showcase pan)
            const overW = isMacro ? Math.round(W * 1.38) : Math.round(W * 1.12);
            const overH = isMacro ? Math.round(H * 1.38) : Math.round(H * 1.12);
            const panXExpr =
              i % 2 === 0
                ? `(iw-${W})*0.5+(iw-${W})*0.18*sin(t*0.8)`
                : `(iw-${W})*0.5-(iw-${W})*0.18*sin(t*0.8)`;
            const panYExpr = isMacro
              ? `(ih-${H})*0.42+(ih-${H})*0.15*cos(t*0.7)`
              : `(ih-${H})*0.5-(ih-${H})*0.12*(t/${dur.toFixed(2)})`;

            const fgScaleW = Math.round((W * 0.92) / 2) * 2;
            const fgScaleH = Math.round((H * (aspectRatio === '9:16' ? 0.68 : 0.84)) / 2) * 2;
            const fgOverW = Math.round((fgScaleW * 1.28) / 2) * 2;
            const fgOverH = Math.round((fgScaleH * 1.28) / 2) * 2;

            const fc = isModelOnly
              ? [
                  `[0:v]scale=${overW}:${overH}:force_original_aspect_ratio=increase,crop=${W}:${H}:'${panXExpr}':'${panYExpr}'[moved]`,
                  `[moved]ass='${escapeFilterPath(assPath)}':fontsdir='${escapeFilterPath(safeFontsDir)}',format=yuv420p[vout]`,
                ].join(';')
              : [
                  `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=32,eq=brightness=-0.14[bg]`,
                  isMacro
                    ? `[0:v]scale=${fgOverW}:${fgOverH}:force_original_aspect_ratio=increase,crop=${fgScaleW}:${fgScaleH}:'(iw-${fgScaleW})*0.5+(iw-${fgScaleW})*0.22*sin(t*0.85)':'(ih-${fgScaleH})*0.45+(ih-${fgScaleH})*0.14*cos(t*0.7)'[fg]`
                    : `[0:v]scale=${fgScaleW}:${fgScaleH}:force_original_aspect_ratio=decrease[fg]`,
                  `[bg][fg]overlay=(W-w)/2:(H-h)/2[comp]`,
                  `[comp]ass='${escapeFilterPath(assPath)}':fontsdir='${escapeFilterPath(safeFontsDir)}',format=yuv420p[vout]`,
                ].join(';');

            args.push('-filter_complex', fc, '-map', '[vout]');
          }

          args.push(
            '-r',
            '24',
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '21',
            '-pix_fmt',
            'yuv420p',
            sceneFile
          );
          await runExecFile(ff.bin, args, 90000);
          sceneMp4Paths.push(sceneFile);
        }

        // 3. Concatenate scenes cleanly with xfade transitions + mix Voiceover + background commercial bed
        const xfadeDur = sceneMp4Paths.length > 1 ? 0.35 : 0;
        const mergeArgs: string[] = ['-y', '-threads', '2'];
        sceneMp4Paths.forEach((p) => mergeArgs.push('-i', p));

        let audioStartInputIndex = sceneMp4Paths.length;
        const transitionChoices = ['fade', 'smoothleft', 'wipeup', 'slideleft', 'fadeblack'];

        const filterParts: string[] = [];
        let lastVideoLabel = '0:v';
        if (sceneMp4Paths.length > 1) {
          let runningOffset = Math.max(0.5, Number(scenes[0].durationSec || 3) - xfadeDur);
          for (let i = 1; i < sceneMp4Paths.length; i++) {
            const outLabel = i === sceneMp4Paths.length - 1 ? 'vout' : `vx${i}`;
            const tr = transitionChoices[(i - 1) % transitionChoices.length];
            filterParts.push(
              `[${lastVideoLabel}][${i}:v]xfade=transition=${tr}:duration=${xfadeDur.toFixed(2)}:offset=${runningOffset.toFixed(2)}[${outLabel}]`
            );
            lastVideoLabel = outLabel;
            runningOffset += Math.max(0.5, Number(scenes[i].durationSec || 3) - xfadeDur);
          }
        } else {
          filterParts.push(`[0:v]null[vout]`);
        }

        const finalDur = scenes.reduce((a, s) => a + Math.max(1.5, Number(s.durationSec || 3)), 0) - xfadeDur * (sceneMp4Paths.length - 1);

        // Background audio bed + Voiceovers
        const audioStreamsToMix: string[] = [];
        if (settings.audioBedMood !== 'none') {
          const baseFreq =
            settings.audioBedMood === 'luxury_minimal'
              ? '146.83'
              : settings.audioBedMood === 'kinetic_bass'
                ? '110.00'
                : '196.00';
          const harmFreq =
            settings.audioBedMood === 'luxury_minimal'
              ? '220.00'
              : settings.audioBedMood === 'kinetic_bass'
                ? '164.81'
                : '293.66';
          filterParts.push(
            `aevalsrc=exprs='0.035*sin(2*PI*${baseFreq}*t)+0.02*sin(2*PI*${harmFreq}*t)*(0.5+0.5*sin(2*PI*2*t))':s=44100:c=stereo:d=${Math.max(2, finalDur).toFixed(2)},afade=t=in:st=0:d=0.4,afade=t=out:st=${Math.max(0.5, finalDur - 0.6).toFixed(2)}:d=0.6[musicbed]`
          );
          audioStreamsToMix.push('[musicbed]');
        } else {
          filterParts.push(
            `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=${Math.max(2, finalDur).toFixed(2)}[silbed]`
          );
          audioStreamsToMix.push('[silbed]');
        }

        voiceoverPaths.forEach((vo, idx) => {
          mergeArgs.push('-i', vo.path);
          const inputIdx = audioStartInputIndex + idx;
          const delayMs = Math.max(0, Math.round(vo.startOffsetSec * 1000));
          const lbl = `vo${idx}`;
          filterParts.push(
            `[${inputIdx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=1.35,adelay=${delayMs}|${delayMs}[${lbl}]`
          );
          audioStreamsToMix.push(`[${lbl}]`);
        });

        if (audioStreamsToMix.length === 1) {
          filterParts.push(`${audioStreamsToMix[0]}anull[aout]`);
        } else {
          filterParts.push(
            `${audioStreamsToMix.join('')}amix=inputs=${audioStreamsToMix.length}:duration=longest:dropout_transition=0.2,dynaudnorm[aout]`
          );
        }

        const outFilename = `${jobId}.mp4`;
        const outPath = path.join(UGC_OUTPUT_DIR, outFilename);
        mergeArgs.push(
          '-filter_complex',
          filterParts.join(';'),
          '-map',
          '[vout]',
          '-map',
          '[aout]',
          '-t',
          Math.max(2, finalDur).toFixed(2),
          '-r',
          '24',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '20',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-ac',
          '2',
          '-ar',
          '44100',
          '-movflags',
          '+faststart',
          outPath
        );

        await runExecFile(ff.bin, mergeArgs, 120000);

        job.status = 'completed';
        job.result = {
          ok: true,
          engine: `ffmpeg (${ff.source}) + gemini-tts`,
          filename: outFilename,
          videoUrl: `/api/ugc/download/${outFilename}`,
          downloadUrl: `/api/ugc/download/${outFilename}?download=1`,
          durationSec: Number(finalDur.toFixed(1)),
          hasVoiceover: voiceoverPaths.length > 0,
          voiceoverScenesRendered: voiceoverPaths.length,
          ...(voiceoverWarning ? { voiceoverWarning } : {}),
        };
      } catch (err: any) {
        job.status = 'failed';
        job.error = err?.message || 'UGC video render fail ho gaya.';
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      }
    };

    const renderPromise = runRender();
    const fastOutcome = await Promise.race([
      renderPromise.then(() => 'done' as const),
      new Promise<'pending'>((r) => setTimeout(() => r('pending'), 8000)),
    ]);

    if (fastOutcome === 'done') {
      if (job.status === 'completed' && job.result) {
        return res.json({ ...job.result, status: 'completed', jobId });
      }
      return res.status(500).json({ ok: false, status: 'failed', jobId, error: job.error || 'Render failed' });
    }

    return res.json({ ok: true, status: 'rendering', jobId });
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
