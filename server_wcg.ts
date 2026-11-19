import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import ffmpegStatic from 'ffmpeg-static';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_WCG_CARD_DATA,
  WCG_MUSIC_PRESETS,
  WCG_TEMPLATES,
  findWcgMusicPreset,
  findWcgTemplate,
  type WcgCardData,
  type WcgCardPartAnalysis,
  type WcgCustomSongItem,
  type WcgCustomTemplateItem,
  type WcgNormalizedBox,
  type WcgPartCount,
  type WcgPatchBlendMode,
  type WcgRenderQuality,
  type WcgStylingConfig,
  type WcgTrendSuggestion,
} from './src/lib/wcgTemplates';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WCG_OUTPUT_DIR = path.resolve(__dirname, 'data', 'wcg-renders');
const WCG_LIB_DIR = path.resolve(__dirname, 'data', 'wcg-library');
const WCG_LIB_TEMPLATES_DIR = path.join(WCG_LIB_DIR, 'templates');
const WCG_LIB_MUSIC_DIR = path.join(WCG_LIB_DIR, 'music');
const WCG_LIB_MANIFEST_PATH = path.join(WCG_LIB_DIR, 'library.json');
const BACKEND_CUSTOM_TEMPLATES_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'custom_templates');
const BACKEND_CUSTOM_MUSIC_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'custom_music');
const PUBLIC_S1_PATH = path.resolve(__dirname, 'public', 'assets', 'aistudio', 's1_0b0de8d4.jpeg');
const PUBLIC_S2_PATH = path.resolve(__dirname, 'public', 'assets', 'aistudio', 's2_610b836e.jpeg');
const DIST_S1_PATH = path.resolve(__dirname, 'dist', 'assets', 'aistudio', 's1_0b0de8d4.jpeg');
const DIST_S2_PATH = path.resolve(__dirname, 'dist', 'assets', 'aistudio', 's2_610b836e.jpeg');
const BACKEND_S1_PATH = path.resolve(__dirname, 'backend_wcg', 'assets', 's1.jpeg');
const BACKEND_S2_PATH = path.resolve(__dirname, 'backend_wcg', 'assets', 's2.jpeg');
const BUNDLED_FONTS_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'fonts');
const SYSTEM_FONTS_DIR = '/usr/share/fonts/truetype/dejavu';
const PUBLIC_MUSIC_DIR = path.resolve(__dirname, 'public', 'assets', 'wcg-music');
const DIST_MUSIC_DIR = path.resolve(__dirname, 'dist', 'assets', 'wcg-music');
const BACKEND_MUSIC_DIR = path.resolve(__dirname, 'backend_wcg', 'assets', 'music');

interface WcgLibraryManifest {
  templates: WcgCustomTemplateItem[];
  songs: WcgCustomSongItem[];
}

function ensureOutputDir() {
  for (const dir of [
    WCG_OUTPUT_DIR,
    WCG_LIB_DIR,
    WCG_LIB_TEMPLATES_DIR,
    WCG_LIB_MUSIC_DIR,
    BACKEND_CUSTOM_TEMPLATES_DIR,
    BACKEND_CUSTOM_MUSIC_DIR,
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function readLibraryManifest(): WcgLibraryManifest {
  ensureOutputDir();
  if (!fs.existsSync(WCG_LIB_MANIFEST_PATH)) {
    return { templates: [], songs: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(WCG_LIB_MANIFEST_PATH, 'utf8'));
    const templates = (Array.isArray(raw?.templates) ? raw.templates : []).filter((t: WcgCustomTemplateItem) => {
      const p1 = path.join(WCG_LIB_TEMPLATES_DIR, path.basename(t.part1Filename || ''));
      const b1 = path.join(BACKEND_CUSTOM_TEMPLATES_DIR, path.basename(t.part1Filename || ''));
      return fs.existsSync(p1) || fs.existsSync(b1);
    });
    const songs = (Array.isArray(raw?.songs) ? raw.songs : []).filter((s: WcgCustomSongItem) => {
      const p = path.join(WCG_LIB_MUSIC_DIR, path.basename(s.filename || ''));
      const b = path.join(BACKEND_CUSTOM_MUSIC_DIR, path.basename(s.filename || ''));
      return fs.existsSync(p) || fs.existsSync(b);
    });
    return { templates, songs };
  } catch {
    return { templates: [], songs: [] };
  }
}

function writeLibraryManifest(manifest: WcgLibraryManifest) {
  ensureOutputDir();
  const payload = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(WCG_LIB_MANIFEST_PATH, payload, 'utf8');
  try {
    const backendManifest = path.resolve(__dirname, 'backend_wcg', 'assets', 'library.json');
    fs.writeFileSync(backendManifest, payload, 'utf8');
  } catch {}
}

function decodeBase64DataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return {
    mime: match[1].toLowerCase().trim(),
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function resolveMultiPartAssetPaths(): { s1: string | null; s2: string | null } {
  const s1Candidates = [PUBLIC_S1_PATH, DIST_S1_PATH, BACKEND_S1_PATH];
  const s2Candidates = [PUBLIC_S2_PATH, DIST_S2_PATH, BACKEND_S2_PATH];
  const s1 = s1Candidates.find((p) => fs.existsSync(p)) || null;
  const s2 = s2Candidates.find((p) => fs.existsSync(p)) || null;
  return { s1, s2 };
}

function resolveCustomTemplateFile(filename?: string): string | null {
  if (!filename) return null;
  const safe = path.basename(filename);
  const candidates = [
    path.join(WCG_LIB_TEMPLATES_DIR, safe),
    path.join(BACKEND_CUSTOM_TEMPLATES_DIR, safe),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function resolveMusicAssetPath(musicId?: string): string | null {
  if (!musicId || musicId === 'none') return null;

  const manifest = readLibraryManifest();
  const customSong = manifest.songs.find((s) => s.id === musicId);
  if (customSong) {
    const safe = path.basename(customSong.filename);
    const customCandidates = [
      path.join(WCG_LIB_MUSIC_DIR, safe),
      path.join(BACKEND_CUSTOM_MUSIC_DIR, safe),
    ];
    const found = customCandidates.find((p) => fs.existsSync(p));
    if (found) return found;
  }

  const preset = findWcgMusicPreset(musicId);
  if (!preset) return null;
  const filename = `${preset.id}.m4a`;
  const candidates = [
    path.join(PUBLIC_MUSIC_DIR, filename),
    path.join(DIST_MUSIC_DIR, filename),
    path.join(BACKEND_MUSIC_DIR, filename),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
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

interface AssAdaptiveLineSpec {
  text: string;
  slotY: number; // Normalized 0..1 within safeRect vertical stack
  fontSize: number;
  isAccent?: boolean;
  bold?: boolean;
  italic?: boolean;
  revealOffsetSec: number;
  typeDurationSec: number;
}

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clampBox(b: Partial<WcgNormalizedBox>, fallback: WcgNormalizedBox): WcgNormalizedBox {
  const x = Math.max(0.03, Math.min(0.85, Number.isFinite(Number(b?.x)) ? Number(b.x) : fallback.x));
  const y = Math.max(0.03, Math.min(0.85, Number.isFinite(Number(b?.y)) ? Number(b.y) : fallback.y));
  const maxW = Math.max(0.1, 0.97 - x);
  const maxH = Math.max(0.06, 0.97 - y);
  const w = Math.max(0.1, Math.min(maxW, Number.isFinite(Number(b?.w)) ? Number(b.w) : fallback.w));
  const h = Math.max(0.05, Math.min(maxH, Number.isFinite(Number(b?.h)) ? Number(b.h) : fallback.h));
  return { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), w: Number(w.toFixed(3)), h: Number(h.toFixed(3)) };
}

function hexToRgbTuple(hex: string, fallback: [number, number, number] = [27, 122, 114]): [number, number, number] {
  const clean = String(hex || '').trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbTupleToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getRelativeLuminance(rgb: [number, number, number]): number {
  return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
}

function suggestHarmoniousInkPalette(patchHex: string): { textColor: string; accentColor: string } {
  const rgb = hexToRgbTuple(patchHex, [27, 122, 114]);
  const lum = getRelativeLuminance(rgb);
  if (lum > 158) {
    // Light cream / ivory / pastel floral interior -> rich espresso & royal antique gold-bronze
    return {
      textColor: '#231915',
      accentColor: '#8B5A1E',
    };
  }
  // Deep emerald / maroon / navy interior -> crisp ivory white & champagne gold
  return {
    textColor: '#FFFFFF',
    accentColor: '#E7C26B',
  };
}

async function probeImageDimensions(ffmpegBin: string, imgPath: string): Promise<{ width: number; height: number }> {
  try {
    await execFileAsync(ffmpegBin, ['-i', imgPath]);
  } catch (err: any) {
    const stderr = String(err?.stderr || '');
    const m = stderr.match(/Video:[^\n]*?,\s*(\d{2,5})x(\d{2,5})\b/);
    if (m) {
      const w = Number(m[1]);
      const h = Number(m[2]);
      if (w > 0 && h > 0) return { width: w, height: h };
    }
  }
  return { width: 1080, height: 1350 };
}

async function sampleRegionMedianHex(
  ffmpegBin: string,
  imgPath: string,
  box: WcgNormalizedBox
): Promise<string | null> {
  try {
    const x = Math.max(0, Math.min(0.9, box.x));
    const y = Math.max(0, Math.min(0.9, box.y));
    const w = Math.max(0.06, Math.min(1 - x, box.w));
    const h = Math.max(0.06, Math.min(1 - y, box.h));
    const { stdout } = await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        imgPath,
        '-vf',
        `crop=max(4\\,iw*${w.toFixed(3)}):max(4\\,ih*${h.toFixed(3)}):iw*${x.toFixed(3)}:ih*${y.toFixed(3)},scale=16:16:flags=area`,
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        'pipe:1',
      ],
      { encoding: 'buffer', maxBuffer: 1024 * 1024 }
    );
    const buf = stdout as unknown as Buffer;
    if (!buf || buf.length < 3 * 16) return null;
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];
    for (let i = 0; i + 2 < buf.length; i += 3) {
      rs.push(buf[i]);
      gs.push(buf[i + 1]);
      bs.push(buf[i + 2]);
    }
    rs.sort((a, b) => a - b);
    gs.sort((a, b) => a - b);
    bs.sort((a, b) => a - b);
    const mid = Math.floor(rs.length / 2);
    return rgbTupleToHex(rs[mid], gs[mid], bs[mid]);
  } catch {
    return null;
  }
}

async function analyzeCardByPixels(
  ffmpegBin: string,
  imgPath: string
): Promise<WcgCardPartAnalysis> {
  const fallbackBox: WcgNormalizedBox = { x: 0.22, y: 0.22, w: 0.56, h: 0.48 };
  try {
    const grid = 24;
    const { stdout } = await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        imgPath,
        '-vf',
        `scale=${grid}:${grid}:flags=area`,
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        'pipe:1',
      ],
      { encoding: 'buffer', maxBuffer: 1024 * 1024 }
    );
    const buf = stdout as unknown as Buffer;
    if (!buf || buf.length < grid * grid * 3) {
      const patchColor = '#196134';
      const ink = suggestHarmoniousInkPalette(patchColor);
      return {
        safeBox: fallbackBox,
        hideBoxes: [fallbackBox],
        patchColor,
        suggestedTextColor: ink.textColor,
        suggestedAccentColor: ink.accentColor,
        summaryRomanUrdu:
          'Uploaded card ka central safe zone detect karke sample text hide patch aur harmonious typography set kar di gayi hai.',
        analyzedBy: 'pixel-heuristic',
      };
    }

    // Estimate interior core background color from middle 8x8 block
    const coreR: number[] = [];
    const coreG: number[] = [];
    const coreB: number[] = [];
    for (let gy = 8; gy < 16; gy += 1) {
      for (let gx = 8; gx < 16; gx += 1) {
        const idx = (gy * grid + gx) * 3;
        coreR.push(buf[idx]);
        coreG.push(buf[idx + 1]);
        coreB.push(buf[idx + 2]);
      }
    }
    coreR.sort((a, b) => a - b);
    coreG.sort((a, b) => a - b);
    coreB.sort((a, b) => a - b);
    const mid = Math.floor(coreR.length / 2);
    const bgR = coreR[mid];
    const bgG = coreG[mid];
    const bgB = coreB[mid];

    // Identify contiguous interior cells close to core background (avoiding floral borders)
    const isClean = (gx: number, gy: number) => {
      const idx = (gy * grid + gx) * 3;
      const dist = Math.hypot(buf[idx] - bgR, buf[idx + 1] - bgG, buf[idx + 2] - bgB);
      return dist <= 52;
    };

    let minX = 5;
    let maxX = 18;
    let minY = 5;
    let maxY = 17;
    // Shrink from edges if outer columns/rows are heavily floral/decorative
    for (let gx = 3; gx <= 8; gx += 1) {
      let cleanRows = 0;
      for (let gy = 6; gy <= 17; gy += 1) if (isClean(gx, gy)) cleanRows += 1;
      if (cleanRows >= 8) {
        minX = gx;
        break;
      }
    }
    for (let gx = 20; gx >= 15; gx -= 1) {
      let cleanRows = 0;
      for (let gy = 6; gy <= 17; gy += 1) if (isClean(gx, gy)) cleanRows += 1;
      if (cleanRows >= 8) {
        maxX = gx;
        break;
      }
    }
    for (let gy = 3; gy <= 8; gy += 1) {
      let cleanCols = 0;
      for (let gx = minX; gx <= maxX; gx += 1) if (isClean(gx, gy)) cleanCols += 1;
      if (cleanCols >= Math.max(4, Math.floor((maxX - minX) * 0.6))) {
        minY = gy;
        break;
      }
    }
    for (let gy = 20; gy >= 14; gy -= 1) {
      let cleanCols = 0;
      for (let gx = minX; gx <= maxX; gx += 1) if (isClean(gx, gy)) cleanCols += 1;
      if (cleanCols >= Math.max(4, Math.floor((maxX - minX) * 0.6))) {
        maxY = gy;
        break;
      }
    }

    const safeBox = clampBox(
      {
        x: Math.max(0.14, minX / grid),
        y: Math.max(0.14, minY / grid),
        w: Math.max(0.42, (maxX - minX + 1) / grid),
        h: Math.max(0.36, (maxY - minY + 1) / grid),
      },
      fallbackBox
    );
    const patchColor = (await sampleRegionMedianHex(ffmpegBin, imgPath, safeBox)) || rgbTupleToHex(bgR, bgG, bgB);
    const ink = suggestHarmoniousInkPalette(patchColor);
    return {
      safeBox,
      hideBoxes: [safeBox],
      patchColor,
      suggestedTextColor: ink.textColor,
      suggestedAccentColor: ink.accentColor,
      summaryRomanUrdu:
        'Image pixel scan se floral borders ke andar ka clean text-safe area aur background patch color auto-match kar liya gaya hai.',
      analyzedBy: 'pixel-heuristic',
    };
  } catch {
    const patchColor = '#196134';
    const ink = suggestHarmoniousInkPalette(patchColor);
    return {
      safeBox: fallbackBox,
      hideBoxes: [fallbackBox],
      patchColor,
      suggestedTextColor: ink.textColor,
      suggestedAccentColor: ink.accentColor,
      summaryRomanUrdu: 'Default adaptive central patch applied.',
      analyzedBy: 'pixel-heuristic',
    };
  }
}

async function analyzeCardImageDesign(params: {
  ffmpegBin: string;
  imagePath: string;
  mimeType: string;
  partLabel: string;
  throwOnAiError?: boolean;
}): Promise<WcgCardPartAnalysis> {
  const { ffmpegBin, imagePath, mimeType, partLabel, throwOnAiError } = params;
  const fallback = await analyzeCardByPixels(ffmpegBin, imagePath);
  const ai = getAiClient();
  if (!ai) {
    if (throwOnAiError) {
      throw new Error('Gemini API key server par configured nahi hai.');
    }
    return fallback;
  }

  try {
    const imgBase64 = fs.readFileSync(imagePath).toString('base64');
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imgBase64,
            },
          },
          {
            text: `Analyze this wedding invitation card design (${partLabel}) so our video engine can cleanly replace existing sample text with new guest/wedding details while preserving 100% of floral borders, domes, lanterns, dholki, or decorative illustrations.

Return strictly valid JSON matching the schema:
1. safeBox: The single largest clean interior rectangle (normalized 0.0-1.0 coordinates x, y, w, h) suitable for new invitation text overlay WITHOUT colliding with flowers, pillars, arches, couple illustrations, or decorative artwork. Ensure w >= 0.36 and h >= 0.28.
2. hideBoxes: 1 to 4 tight normalized {x, y, w, h} rectangles covering ALL pre-existing printed text, Arabic calligraphy, names, timings, and venue text in the source card that should be hidden/masked with matching background paint. Avoid covering decorative flowers!
3. suggestedTextColor: High-contrast hex ink color (e.g. "#FFFFFF" on dark backgrounds, "#231915" on light cream/pastel backgrounds).
4. suggestedAccentColor: Harmonious hex accent color matching the card aesthetic (e.g. "#E7C26B" or "#8B5A1E").
5. summaryRomanUrdu: 1 concise Roman Urdu sentence explaining which region was cleared and where new text fits cleanly.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safeBox: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                w: { type: Type.NUMBER },
                h: { type: Type.NUMBER },
              },
              required: ['x', 'y', 'w', 'h'],
            },
            hideBoxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                },
                required: ['x', 'y', 'w', 'h'],
              },
            },
            suggestedTextColor: { type: Type.STRING },
            suggestedAccentColor: { type: Type.STRING },
            summaryRomanUrdu: { type: Type.STRING },
          },
          required: ['safeBox', 'hideBoxes', 'suggestedTextColor', 'suggestedAccentColor', 'summaryRomanUrdu'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    const safeBox = clampBox(parsed.safeBox || {}, fallback.safeBox);
    if (safeBox.w < 0.36) safeBox.w = Math.min(0.92 - safeBox.x, 0.38);
    if (safeBox.h < 0.28) safeBox.h = Math.min(0.92 - safeBox.y, 0.32);

    const rawHides: WcgNormalizedBox[] = Array.isArray(parsed.hideBoxes) && parsed.hideBoxes.length > 0
      ? parsed.hideBoxes.slice(0, 5).map((b: any) => clampBox(b, safeBox))
      : [safeBox];

    // Always sample the real interior background RGB from the actual uploaded file for seamless color matching
    const sampledHex = (await sampleRegionMedianHex(ffmpegBin, imagePath, safeBox)) || fallback.patchColor;
    const autoInk = suggestHarmoniousInkPalette(sampledHex);
    const validHex = (v: any, fb: string) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '').trim()) ? String(v).trim() : fb);

    return {
      safeBox,
      hideBoxes: rawHides,
      patchColor: sampledHex,
      suggestedTextColor: validHex(parsed.suggestedTextColor, autoInk.textColor),
      suggestedAccentColor: validHex(parsed.suggestedAccentColor, autoInk.accentColor),
      summaryRomanUrdu: String(parsed.summaryRomanUrdu || fallback.summaryRomanUrdu),
      analyzedBy: 'gemini-vision',
    };
  } catch (err: any) {
    if (throwOnAiError) {
      throw err;
    }
    console.warn('[WCG Card Analyze] Falling back to pixel heuristic:', err?.message || err);
    return fallback;
  }
}

const CRC32_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[i] = c >>> 0;
  }
  return tbl;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width: number, height: number, rgba: Buffer): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOff = y * (stride + 1);
    raw[rowOff] = 0; // filter None
    rgba.copy(raw, rowOff + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 3 });
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function buildFeatheredPatchPngBuffer(params: {
  width: number;
  height: number;
  safeBox: WcgNormalizedBox;
  hideBoxes: WcgNormalizedBox[];
  patchHex: string;
  accentHex: string;
  patchMode: WcgPatchBlendMode;
  cleanSampleText: boolean;
}): Buffer {
  const { width, height, safeBox, hideBoxes, patchHex, accentHex, patchMode, cleanSampleText } = params;
  const rgba = Buffer.alloc(width * height * 4, 0);
  const [pr, pg, pb] = hexToRgbTuple(patchHex, [27, 122, 114]);
  const [ar, ag, ab] = hexToRgbTuple(accentHex, [231, 194, 107]);

  const paintSoftRoundedRect = (
    bx: number,
    by: number,
    bw: number,
    bh: number,
    r: number,
    g: number,
    b: number,
    maxAlpha: number,
    radius: number,
    feather: number
  ) => {
    const x0 = Math.max(0, Math.floor(bx - feather));
    const y0 = Math.max(0, Math.floor(by - feather));
    const x1 = Math.min(width - 1, Math.ceil(bx + bw + feather));
    const y1 = Math.min(height - 1, Math.ceil(by + bh + feather));
    const halfW = bw / 2;
    const halfH = bh / 2;
    const cx = bx + halfW;
    const cy = by + halfH;
    const rad = Math.min(radius, halfW * 0.45, halfH * 0.45);

    for (let py = y0; py <= y1; py += 1) {
      const dy = Math.abs(py - cy) - (halfH - rad);
      for (let px = x0; px <= x1; px += 1) {
        const dx = Math.abs(px - cx) - (halfW - rad);
        const signedDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - rad;
        if (signedDist >= feather) continue;
        let a = maxAlpha;
        if (signedDist > 0) {
          const t = signedDist / feather;
          const smooth = 1 - t * t * (3 - 2 * t);
          a = Math.round(maxAlpha * smooth);
        }
        if (a <= 0) continue;
        const off = (py * width + px) * 4;
        if (a > rgba[off + 3]) {
          rgba[off] = r;
          rgba[off + 1] = g;
          rgba[off + 2] = b;
          rgba[off + 3] = a;
        }
      }
    }
  };

  if (cleanSampleText && patchMode !== 'direct') {
    const targets = hideBoxes.length > 0 ? hideBoxes : [safeBox];
    for (const box of targets) {
      paintSoftRoundedRect(
        box.x * width,
        box.y * height,
        box.w * width,
        box.h * height,
        pr,
        pg,
        pb,
        248,
        18,
        14
      );
    }
  }

  if (patchMode === 'plaque') {
    const sx = safeBox.x * width + 6;
    const sy = safeBox.y * height + 6;
    const sw = Math.max(40, safeBox.w * width - 12);
    const sh = Math.max(40, safeBox.h * height - 12);
    paintSoftRoundedRect(sx, sy, sw, sh, pr, pg, pb, 224, 22, 10);

    // Subtle accent border frame around the plaque
    const x0 = Math.max(0, Math.floor(sx));
    const y0 = Math.max(0, Math.floor(sy));
    const x1 = Math.min(width - 1, Math.ceil(sx + sw));
    const y1 = Math.min(height - 1, Math.ceil(sy + sh));
    const halfW = sw / 2;
    const halfH = sh / 2;
    const cx = sx + halfW;
    const cy = sy + halfH;
    const rad = Math.min(20, halfW * 0.4, halfH * 0.4);
    for (let py = y0; py <= y1; py += 1) {
      const dy = Math.abs(py - cy) - (halfH - rad);
      for (let px = x0; px <= x1; px += 1) {
        const dx = Math.abs(px - cx) - (halfW - rad);
        const signedDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - rad;
        if (signedDist >= -2.5 && signedDist <= 0.5) {
          const off = (py * width + px) * 4;
          rgba[off] = ar;
          rgba[off + 1] = ag;
          rgba[off + 2] = ab;
          rgba[off + 3] = 195;
        }
      }
    }
  }

  return encodeRgbaPng(width, height, rgba);
}

function buildAdaptiveTypewriterAssFile(
  lines: AssAdaptiveLineSpec[],
  safeRect: PixelRect,
  partDurationSec: number,
  styling: WcgStylingConfig,
  fontNameSerif: string
): string {
  const textAssColor = hexToAssBgr(styling.textColor, '&H00FFFFFF&');
  const accentAssColor = hexToAssBgr(styling.accentColor, '&H006BC2E7&');

  const padX = Math.max(20, Math.round(safeRect.w * 0.08));
  const padY = Math.max(24, Math.round(safeRect.h * 0.075));
  const innerW = Math.max(220, safeRect.w - padX * 2);
  const innerH = Math.max(260, safeRect.h - padY * 2);
  const centerX = Math.round(safeRect.x + safeRect.w / 2);

  // Scale font sizes proportionally to available safeBox space so text fits neatly without overflowing floral margins
  const boxScale = Math.min(1.14, Math.max(0.58, Math.min(innerW / 540, innerH / 760)));
  const spacing = Math.max(0.85, Math.min(1.16, Number(styling.spacingScale || 1)));

  const prepared = lines
    .filter((l) => String(l.text || '').trim().length > 0)
    .map((spec) => {
      const fs = Math.max(17, Math.round(spec.fontSize * boxScale));
      const approxCharPx = fs * (spec.bold ? 0.54 : 0.49);
      const maxChars = Math.max(14, Math.floor(innerW / approxCharPx));
      const wrapped = wrapLines(spec.text, maxChars);
      const lineHeight = Math.round(fs * 1.18 * spacing);
      return { spec, fs, wrapped, lineHeight, totalH: wrapped.length * lineHeight };
    });

  // Ensure total vertical block stack never overflows innerH
  const sumHeights = prepared.reduce((acc, item) => acc + item.totalH + Math.round(item.fs * 0.25), 0);
  const compress = sumHeights > innerH ? (innerH * 0.94) / sumHeights : 1;

  const events: string[] = [];
  const minSlotY = safeRect.y + padY;
  const maxSlotY = safeRect.y + safeRect.h - padY;

  for (const item of prepared) {
    const fs = Math.max(15, Math.round(item.fs * compress));
    const lineHeight = Math.round(fs * 1.16 * spacing);
    const blockCenterY = Math.round(minSlotY + item.spec.slotY * (maxSlotY - minSlotY));
    const halfBlockH = ((item.wrapped.length - 1) * lineHeight) / 2;
    const clampedCenterY = Math.max(
      minSlotY + halfBlockH + fs * 0.5,
      Math.min(maxSlotY - halfBlockH - fs * 0.5, blockCenterY)
    );
    const startY = Math.round(clampedCenterY - halfBlockH);

    const totalChars = Math.max(1, item.wrapped.join('').length);
    const perCharMs = Math.max(18, Math.round((item.spec.typeDurationSec * 1000) / totalChars));
    let charCursor = 0;

    item.wrapped.forEach((lineStr, idx) => {
      const yPos = startY + idx * lineHeight;
      const colorTag = item.spec.isAccent ? accentAssColor : textAssColor;
      const styleTags = `${item.spec.bold ? '\\b1' : '\\b0'}${item.spec.italic ? '\\i1' : '\\i0'}`;

      let animatedChars = '';
      const chars = Array.from(lineStr);
      for (let cIdx = 0; cIdx < chars.length; cIdx += 3) {
        const chunk = chars.slice(cIdx, cIdx + 3).join('');
        const t1 = charCursor * perCharMs;
        const t2 = t1 + 90;
        animatedChars += `{\\alpha&HFF&\\t(${t1},${t2},\\alpha&H00&)}${escapeAssText(chunk)}`;
        charCursor += chunk.length;
      }

      const tStart = formatAssTime(item.spec.revealOffsetSec);
      const tEnd = formatAssTime(partDurationSec);
      const outlineHex = getRelativeLuminance(hexToRgbTuple(styling.textColor, [255, 255, 255])) > 140
        ? '&H00091410&'
        : '&H55FFFFFF&';
      const prefix = `{\\an5\\pos(${centerX},${yPos})\\fn${fontNameSerif}\\fs${fs}${styleTags}\\1c${colorTag}\\3c${outlineHex}\\bord2.0\\shad1.2\\fad(120,250)}`;
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

interface WcgJobRecord {
  jobId: string;
  status: 'rendering' | 'completed' | 'failed';
  startedAt: number;
  result?: Record<string, any>;
  error?: string;
}

const WCG_JOBS = new Map<string, WcgJobRecord>();

function pruneOldWcgJobs() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of WCG_JOBS.entries()) {
    if (job.startedAt < cutoff) {
      WCG_JOBS.delete(id);
    }
  }
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

  app.get('/api/wcg/music', (_req, res) => {
    const presets = WCG_MUSIC_PRESETS.map((p) => ({
      ...p,
      available: Boolean(resolveMusicAssetPath(p.id)),
    }));
    const manifest = readLibraryManifest();
    res.json({ ok: true, presets, customSongs: manifest.songs });
  });

  // Persistent Asset Library CRUD (Custom Templates & Custom 30s Wedding Songs)
  app.get('/api/wcg/library', (_req, res) => {
    const manifest = readLibraryManifest();
    res.json({
      ok: true,
      templates: manifest.templates,
      songs: manifest.songs,
    });
  });

  app.post('/api/wcg/library/templates', async (req, res) => {
    try {
      ensureOutputDir();
      const body = req.body || {};
      const name = String(body.name || `Custom Wedding Card ${Date.now().toString().slice(-4)}`).trim().slice(0, 80);
      const rawCat = String(body.category || 'Mehndi');
      const category = (['Mehndi', 'Barat', 'Walima', 'Nikah'].includes(rawCat) ? rawCat : 'Mehndi') as WcgCustomTemplateItem['category'];
      const part1Raw = String(body.part1DataUrl || body.dataUrl || '');
      const part2Raw = String(body.part2DataUrl || '');
      const part3Raw = String(body.part3DataUrl || '');

      const dec1 = decodeBase64DataUrl(part1Raw);
      if (!dec1 || !/^image\/(jpeg|jpg|png|webp)$/.test(dec1.mime)) {
        return res.status(400).json({ ok: false, error: 'Part 1 image JPG, PNG ya WebP format mein upload karein.' });
      }
      if (dec1.buffer.length > 12 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: 'Image size 12MB se kam hona chahiye.' });
      }

      const ext1 = dec1.mime === 'image/png' ? 'png' : dec1.mime === 'image/webp' ? 'webp' : 'jpg';
      const id = `custom_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const file1 = `${id}_p1.${ext1}`;
      const path1 = path.join(WCG_LIB_TEMPLATES_DIR, file1);
      fs.writeFileSync(path1, dec1.buffer);
      fs.writeFileSync(path.join(BACKEND_CUSTOM_TEMPLATES_DIR, file1), dec1.buffer);

      let file2: string | undefined;
      let path2: string | undefined;
      let mime2 = dec1.mime;
      if (part2Raw) {
        const dec2 = decodeBase64DataUrl(part2Raw);
        if (dec2 && /^image\/(jpeg|jpg|png|webp)$/.test(dec2.mime) && dec2.buffer.length <= 12 * 1024 * 1024) {
          const ext2 = dec2.mime === 'image/png' ? 'png' : dec2.mime === 'image/webp' ? 'webp' : 'jpg';
          file2 = `${id}_p2.${ext2}`;
          mime2 = dec2.mime;
          path2 = path.join(WCG_LIB_TEMPLATES_DIR, file2);
          fs.writeFileSync(path2, dec2.buffer);
          fs.writeFileSync(path.join(BACKEND_CUSTOM_TEMPLATES_DIR, file2), dec2.buffer);
        }
      }

      let file3: string | undefined;
      let path3: string | undefined;
      let mime3 = dec1.mime;
      if (part3Raw) {
        const dec3 = decodeBase64DataUrl(part3Raw);
        if (dec3 && /^image\/(jpeg|jpg|png|webp)$/.test(dec3.mime) && dec3.buffer.length <= 12 * 1024 * 1024) {
          const ext3 = dec3.mime === 'image/png' ? 'png' : dec3.mime === 'image/webp' ? 'webp' : 'jpg';
          file3 = `${id}_p3.${ext3}`;
          mime3 = dec3.mime;
          path3 = path.join(WCG_LIB_TEMPLATES_DIR, file3);
          fs.writeFileSync(path3, dec3.buffer);
          fs.writeFileSync(path.join(BACKEND_CUSTOM_TEMPLATES_DIR, file3), dec3.buffer);
        }
      }

      const reqPartCount = Number(body.partCount);
      const detectedParts: WcgPartCount =
        reqPartCount === 1 || reqPartCount === 2 || reqPartCount === 3
          ? reqPartCount
          : file3
            ? 3
            : file2
              ? 2
              : 1;

      const ff = resolveFfmpegBinary();
      let part1Analysis: WcgCardPartAnalysis | undefined;
      let part2Analysis: WcgCardPartAnalysis | undefined;
      let part3Analysis: WcgCardPartAnalysis | undefined;

      if (ff) {
        const [a1, a2, a3] = await Promise.all([
          analyzeCardImageDesign({ ffmpegBin: ff.bin, imagePath: path1, mimeType: dec1.mime, partLabel: 'Part 1' }),
          path2
            ? analyzeCardImageDesign({ ffmpegBin: ff.bin, imagePath: path2, mimeType: mime2, partLabel: 'Part 2' })
            : Promise.resolve(undefined),
          path3
            ? analyzeCardImageDesign({ ffmpegBin: ff.bin, imagePath: path3, mimeType: mime3, partLabel: 'Part 3' })
            : Promise.resolve(undefined),
        ]);
        part1Analysis = a1;
        part2Analysis = a2;
        part3Analysis = a3;
      }

      const item: WcgCustomTemplateItem = {
        id,
        name,
        category,
        partCount: detectedParts,
        part1Filename: file1,
        part2Filename: file2,
        part3Filename: file3,
        part1Url: `/api/wcg/library/assets/templates/${file1}`,
        part2Url: file2 ? `/api/wcg/library/assets/templates/${file2}` : undefined,
        part3Url: file3 ? `/api/wcg/library/assets/templates/${file3}` : undefined,
        part1Analysis,
        part2Analysis,
        part3Analysis,
        createdAt: new Date().toISOString(),
      };

      const manifest = readLibraryManifest();
      manifest.templates.unshift(item);
      writeLibraryManifest(manifest);

      res.json({ ok: true, template: item });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Template save failed' });
    }
  });

  // Analyze (or Re-Analyze) an uploaded or built-in wedding card design for safe overlay zones & sample-text hiding
  app.post('/api/wcg/analyze-card', async (req, res) => {
    try {
      const ff = resolveFfmpegBinary();
      if (!ff) {
        return res.status(500).json({ ok: false, error: 'FFmpeg binary not available for pixel sampling.' });
      }
      const body = req.body || {};
      const templateId = String(body.templateId || '');
      const part = Number(body.part || 1) as 1 | 2 | 3;
      const requireVision = Boolean(body.requireVision);

      let targetPath: string | null = null;
      let mime = 'image/jpeg';

      const manifest = readLibraryManifest();
      const customIdx = manifest.templates.findIndex((t) => t.id === templateId);
      if (customIdx !== -1) {
        const ct = manifest.templates[customIdx];
        const fname =
          part === 3
            ? ct.part3Filename || ct.part2Filename || ct.part1Filename
            : part === 2
              ? ct.part2Filename || ct.part1Filename
              : ct.part1Filename;
        targetPath = resolveCustomTemplateFile(fname);
        if (targetPath?.endsWith('.png')) mime = 'image/png';
        else if (targetPath?.endsWith('.webp')) mime = 'image/webp';
      } else if (templateId === 'pakistani-emerald-mehndi-multipart') {
        const { s1, s2 } = resolveMultiPartAssetPaths();
        targetPath = part === 2 ? s2 : s1;
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        return res.status(404).json({ ok: false, error: 'Card image file analyze karne ke liye nahi mili.' });
      }

      const analysis = await analyzeCardImageDesign({
        ffmpegBin: ff.bin,
        imagePath: targetPath,
        mimeType: mime,
        partLabel: `Part ${part}`,
        throwOnAiError: requireVision,
      });

      if (customIdx !== -1) {
        if (part === 1) manifest.templates[customIdx].part1Analysis = analysis;
        else if (part === 2) manifest.templates[customIdx].part2Analysis = analysis;
        else manifest.templates[customIdx].part3Analysis = analysis;
        writeLibraryManifest(manifest);
      }

      return res.json({ ok: true, part, analysis });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'AI Vision card analysis fail ho gayi.',
      });
    }
  });

  app.delete('/api/wcg/library/templates/:id', (req, res) => {
    const manifest = readLibraryManifest();
    const target = manifest.templates.find((t) => t.id === req.params.id);
    if (!target) {
      return res.status(404).json({ ok: false, error: 'Custom template not found' });
    }
    for (const fname of [target.part1Filename, target.part2Filename, target.part3Filename]) {
      if (!fname) continue;
      for (const dir of [WCG_LIB_TEMPLATES_DIR, BACKEND_CUSTOM_TEMPLATES_DIR]) {
        const p = path.join(dir, path.basename(fname));
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
    manifest.templates = manifest.templates.filter((t) => t.id !== req.params.id);
    writeLibraryManifest(manifest);
    res.json({ ok: true });
  });

  app.post('/api/wcg/library/songs', async (req, res) => {
    try {
      ensureOutputDir();
      const body = req.body || {};
      const title = String(body.title || `Custom Song ${Date.now().toString().slice(-4)}`).trim().slice(0, 80);
      const category = String(body.category || 'Custom').trim().slice(0, 32);
      const dec = decodeBase64DataUrl(String(body.dataUrl || ''));
      if (!dec || !/^audio\/(mpeg|mp3|wav|x-wav|mp4|x-m4a|aac|ogg|webm)$/.test(dec.mime)) {
        return res.status(400).json({ ok: false, error: 'Audio track MP3, WAV ya M4A format mein upload karein.' });
      }
      if (dec.buffer.length > 20 * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: 'Audio file size 20MB se kam hona chahiye.' });
      }

      const ext = dec.mime.includes('wav')
        ? 'wav'
        : dec.mime.includes('mp4') || dec.mime.includes('m4a') || dec.mime.includes('aac')
          ? 'm4a'
          : dec.mime.includes('ogg')
            ? 'ogg'
            : 'mp3';
      const id = `custom_song_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const filename = `${id}.${ext}`;
      const libPath = path.join(WCG_LIB_MUSIC_DIR, filename);
      fs.writeFileSync(libPath, dec.buffer);
      fs.writeFileSync(path.join(BACKEND_CUSTOM_MUSIC_DIR, filename), dec.buffer);

      let durationSec = 30;
      const ff = resolveFfmpegBinary();
      if (ff) {
        try {
          await execFileAsync(ff.bin, ['-i', libPath]);
        } catch (probeErr: any) {
          const stderr = String(probeErr?.stderr || '');
          const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
          if (m) {
            durationSec = Math.round(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
          }
        }
      }

      const item: WcgCustomSongItem = {
        id,
        title,
        category,
        filename,
        audioUrl: `/api/wcg/library/assets/music/${filename}`,
        durationSec: Math.max(1, durationSec),
        createdAt: new Date().toISOString(),
      };
      const manifest = readLibraryManifest();
      manifest.songs.unshift(item);
      writeLibraryManifest(manifest);
      res.json({ ok: true, song: item });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Song upload failed' });
    }
  });

  app.delete('/api/wcg/library/songs/:id', (req, res) => {
    const manifest = readLibraryManifest();
    const target = manifest.songs.find((s) => s.id === req.params.id);
    if (!target) {
      return res.status(404).json({ ok: false, error: 'Custom song not found' });
    }
    for (const dir of [WCG_LIB_MUSIC_DIR, BACKEND_CUSTOM_MUSIC_DIR]) {
      const p = path.join(dir, path.basename(target.filename));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    manifest.songs = manifest.songs.filter((s) => s.id !== req.params.id);
    writeLibraryManifest(manifest);
    res.json({ ok: true });
  });

  app.get('/api/wcg/library/assets/:kind/:filename', (req, res) => {
    const kind = req.params.kind;
    const safeName = path.basename(req.params.filename || '');
    if (!safeName || (kind !== 'templates' && kind !== 'music')) {
      return res.status(400).json({ error: 'Invalid asset path' });
    }
    const primaryDir = kind === 'templates' ? WCG_LIB_TEMPLATES_DIR : WCG_LIB_MUSIC_DIR;
    const backupDir = kind === 'templates' ? BACKEND_CUSTOM_TEMPLATES_DIR : BACKEND_CUSTOM_MUSIC_DIR;
    const filePath = [path.join(primaryDir, safeName), path.join(backupDir, safeName)].find((p) => fs.existsSync(p));
    if (!filePath) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  });

  app.get('/api/wcg/diagnostics', (_req, res) => {
    const { s1, s2 } = resolveMultiPartAssetPaths();
    const ffmpegResolved = resolveFfmpegBinary();
    const fontsDir = resolveFontsDir();
    const musicReadyCount = WCG_MUSIC_PRESETS.filter((p) => Boolean(resolveMusicAssetPath(p.id))).length;
    const manifest = readLibraryManifest();
    res.json({
      ok: Boolean(ffmpegResolved),
      ffmpeg: ffmpegResolved,
      fontsDir,
      assets: { s1, s2 },
      musicReadyCount,
      customTemplatesCount: manifest.templates.length,
      customSongsCount: manifest.songs.length,
      outputDir: WCG_OUTPUT_DIR,
    });
  });

  app.get('/api/wcg/jobs/:jobId', (req, res) => {
    const job = WCG_JOBS.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ ok: false, status: 'failed', error: 'Render job not found or expired' });
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

  // Render 9:16 18-20s multi-part wedding card MP4 with optional background music preset
  app.post('/api/wcg/render', async (req, res) => {
    ensureOutputDir();
    pruneOldWcgJobs();
    const body = req.body || {};
    const template = findWcgTemplate(String(body.templateId || 'pakistani-emerald-mehndi-multipart'));
    const durationSeconds = Math.max(18, Math.min(20, Number(body.durationSeconds || 19)));
    const quality: WcgRenderQuality = body.quality === '720p' ? '720p' : '1080p';
    const musicId = typeof body.musicId === 'string' ? body.musicId.trim() : 'mehndi-laga-ke-rakhna';
    const musicVolume = Math.max(0, Math.min(1, Number(body.musicVolume ?? 0.78)));

    const rawTplId = String(body.templateId || 'pakistani-emerald-mehndi-multipart');
    const manifestSnap = readLibraryManifest();
    const customTplSnap = manifestSnap.templates.find((t) => t.id === rawTplId);
    const reqPartCount = Number(body.partCount);
    const partCount: WcgPartCount =
      reqPartCount === 1 || reqPartCount === 2 || reqPartCount === 3
        ? reqPartCount
        : customTplSnap?.partCount || template.partCount || 2;

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
            templateId: rawTplId || template.id,
            partCount,
            durationSeconds,
            quality,
            musicId,
            musicVolume,
            card,
            styling,
          }),
        });
        if (pyRes.ok) {
          const pyJson: any = await pyRes.json();
          const remoteUrl = `${pythonServiceUrl}${pyJson.downloadPath}`;
          return res.json({
            ok: true,
            status: 'completed',
            filename: pyJson.filename,
            videoUrl: remoteUrl,
            downloadUrl: remoteUrl,
            durationSeconds,
            resolution: quality === '720p' ? '720x1280' : '1080x1920',
            engine: 'onrender-python-moviepy',
            multiPart: partCount > 1,
            partCount,
            musicId,
          });
        }
      } catch (pyErr) {
        console.warn('[WCG Render] Python OnRender service unreachable, falling back to local FFmpeg engine:', pyErr);
      }
    }

    const ffmpegResolved = resolveFfmpegBinary();
    if (!ffmpegResolved) {
      return res.status(500).json({
        ok: false,
        error:
          'FFmpeg binary container mein nahi mila. Package.json mein ffmpeg-static install karein ya FFMPEG_PATH / Dockerfile ffmpeg configure karein.',
      });
    }

    const jobId = `wcg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const jobRecord: WcgJobRecord = {
      jobId,
      status: 'rendering',
      startedAt: Date.now(),
    };
    WCG_JOBS.set(jobId, jobRecord);

    const runRenderTask = async () => {
      const tmpDir = path.join(WCG_OUTPUT_DIR, `tmp_${jobId}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      try {
        const ffmpegBin = ffmpegResolved.bin;
        const fontsDir = resolveFontsDir();
        const xfadeDur = 0.8;
        const partDur =
          partCount === 1
            ? durationSeconds
            : partCount === 2
              ? Number(((durationSeconds + xfadeDur) / 2).toFixed(2))
              : Number(((durationSeconds + xfadeDur * 2) / 3).toFixed(2));
        const isModernSans = ['Montserrat', 'Poppins', 'Lato'].includes(String(styling.displayFont || ''));
        const fontName = fontsDir ? (isModernSans ? 'DejaVu Sans' : 'DejaVu Serif') : 'Sans';
        const isFullHd = quality === '1080p';
        const targetW = isFullHd ? 1080 : 720;
        const targetH = isFullHd ? 1920 : 1280;
        const fps = isFullHd ? 18 : 15;
        const crf = isFullHd ? '20' : '22';
        const timeScale = partDur / 9.9;

        const manifest = readLibraryManifest();
        const customTpl = manifest.templates.find((t) => t.id === rawTplId);
        const customP1 = customTpl ? resolveCustomTemplateFile(customTpl.part1Filename) : null;
        const customP2 = customTpl
          ? resolveCustomTemplateFile(customTpl.part2Filename) || customP1
          : null;
        const customP3 = customTpl
          ? resolveCustomTemplateFile(customTpl.part3Filename) || customP2 || customP1
          : null;

        const { s1, s2 } = resolveMultiPartAssetPaths();
        const isBuiltinMultipart = rawTplId === 'pakistani-emerald-mehndi-multipart' && Boolean(s1 && s2);
        const part1ImagePath = customP1 || (isBuiltinMultipart ? s1 : null);
        const part2ImagePath = customP2 || (isBuiltinMultipart ? s2 : null);
        const part3ImagePath = customP3 || (isBuiltinMultipart ? s1 : null);
        const musicPath = resolveMusicAssetPath(musicId);

        const xfadeMap: Record<string, string> = {
          crossfade: 'fade',
          dissolve: 'dissolve',
          fade_black: 'fadeblack',
          slideup: 'slideup',
          slidedown: 'slidedown',
          slideleft: 'slideleft',
          slideright: 'slideright',
          zoomin: 'circleopen',
          zoomout: 'circleclose',
          spin: 'radial',
          wipeup: 'wipeup',
          wipedown: 'wipedown',
          wipeleft: 'wipeleft',
          wiperight: 'wiperight',
          glitch: 'pixelize',
          blur: 'hblur',
          lightleak: 'fadewhite',
        };
        const xfadeMode = xfadeMap[String(styling.transitionStyle || 'crossfade')] || 'fade';

        const patchMode: WcgPatchBlendMode = styling.patchMode || 'seamless';
        const builtinMultipartSpec = findWcgTemplate('pakistani-emerald-mehndi-multipart');

        const resolvePartAnalysis = async (
          imgPath: string | null,
          savedAnalysis: WcgCardPartAnalysis | undefined,
          partNum: 1 | 2 | 3
        ): Promise<WcgCardPartAnalysis | null> => {
          if (!imgPath) return null;
          if (savedAnalysis) return savedAnalysis;
          if (isBuiltinMultipart) {
            return (partNum === 2 ? builtinMultipartSpec.part2Analysis : builtinMultipartSpec.part1Analysis) || null;
          }
          const mime = imgPath.endsWith('.png') ? 'image/png' : imgPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          return await analyzeCardImageDesign({ ffmpegBin, imagePath: imgPath, mimeType: mime, partLabel: `Part ${partNum}` });
        };

        const [p1Analysis, p2Analysis, p3Analysis] = await Promise.all([
          resolvePartAnalysis(part1ImagePath, customTpl?.part1Analysis, 1),
          resolvePartAnalysis(part2ImagePath, customTpl?.part2Analysis || customTpl?.part1Analysis, 2),
          resolvePartAnalysis(part3ImagePath, customTpl?.part3Analysis || customTpl?.part2Analysis || customTpl?.part1Analysis, 3),
        ]);

        const computeImageCardSafeRect = async (
          srcImg: string | null,
          analysis: WcgCardPartAnalysis | null
        ): Promise<{ cardRect: PixelRect; safeRect: PixelRect }> => {
          if (!srcImg) {
            return {
              cardRect: { x: 0, y: 0, w: 1080, h: 1920 },
              safeRect: { x: 130, y: 310, w: 820, h: 1280 },
            };
          }
          const dims = await probeImageDimensions(ffmpegBin, srcImg);
          const scale = Math.min(1080 / dims.width, 1460 / dims.height);
          const cardW = Math.max(200, Math.round(dims.width * scale));
          const cardH = Math.max(200, Math.round(dims.height * scale));
          const cardX = Math.round((1080 - cardW) / 2);
          const cardY = Math.round((1920 - cardH) / 2);
          const sb = analysis?.safeBox || { x: 0.22, y: 0.22, w: 0.56, h: 0.48 };
          return {
            cardRect: { x: cardX, y: cardY, w: cardW, h: cardH },
            safeRect: {
              x: Math.round(cardX + sb.x * cardW),
              y: Math.round(cardY + sb.y * cardH),
              w: Math.round(sb.w * cardW),
              h: Math.round(sb.h * cardH),
            },
          };
        };

        const bakeBgStill = async (
          srcImg: string | null,
          fallbackHex: string,
          outPng: string,
          analysis: WcgCardPartAnalysis | null,
          cardRect: PixelRect,
          partIdx: number
        ) => {
          const scaleTail = isFullHd ? '' : `,scale=${targetW}:${targetH}`;
          if (srcImg) {
            const shouldPatch = Boolean(styling.cleanSampleText || patchMode === 'plaque');
            const patchPngPath = path.join(tmpDir, `p${partIdx}_patch.png`);
            if (shouldPatch) {
              const sb = analysis?.safeBox || { x: 0.22, y: 0.22, w: 0.56, h: 0.48 };
              const hbs = analysis?.hideBoxes || [sb];
              const pHex = analysis?.patchColor || fallbackHex;
              const patchBuf = buildFeatheredPatchPngBuffer({
                width: cardRect.w,
                height: cardRect.h,
                safeBox: sb,
                hideBoxes: hbs,
                patchHex: pHex,
                accentHex: styling.accentColor,
                patchMode,
                cleanSampleText: Boolean(styling.cleanSampleText),
              });
              fs.writeFileSync(patchPngPath, patchBuf);
              await execFileAsync(ffmpegBin, [
                '-y',
                '-i',
                srcImg,
                '-i',
                patchPngPath,
                '-filter_complex',
                `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24,eq=brightness=-0.06[bgb];[fg]scale=${cardRect.w}:${cardRect.h}[fgs];[fgs][1:v]overlay=0:0[patched];[bgb][patched]overlay=${cardRect.x}:${cardRect.y},vignette=PI/6${scaleTail}`,
                '-frames:v',
                '1',
                outPng,
              ]);
            } else {
              await execFileAsync(ffmpegBin, [
                '-y',
                '-i',
                srcImg,
                '-filter_complex',
                `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24,eq=brightness=-0.06[bgb];[fg]scale=${cardRect.w}:${cardRect.h}[fgs];[bgb][fgs]overlay=${cardRect.x}:${cardRect.y},vignette=PI/6${scaleTail}`,
                '-frames:v',
                '1',
                outPng,
              ]);
            }
          } else {
            const fillColor = hexToFfmpegColor(fallbackHex, '0x4E0D19');
            const sColor = hexToFfmpegColor(styling.secondaryColor, '0x2D070F');
            const aColor = hexToFfmpegColor(styling.accentColor, '0xE6C275');
            const frameDeco = [
              `drawbox=x=44:y=44:w=992:h=1832:color=${aColor}@0.82:t=4`,
              `drawbox=x=64:y=64:w=952:h=1792:color=${aColor}@0.45:t=2`,
              `drawbox=x=115:y=290:w=850:h=1340:color=${aColor}@0.28:t=2`,
              `drawbox=x=150:y=1100:w=780:h=155:color=${sColor}@0.45:t=fill`,
              `drawbox=x=150:y=1100:w=780:h=155:color=${aColor}@0.65:t=2`,
            ].join(',');
            await execFileAsync(ffmpegBin, [
              '-y',
              '-f',
              'lavfi',
              '-i',
              `color=c=${fillColor}:s=1080x1920:d=1:r=1`,
              '-vf',
              `${frameDeco},vignette=PI/6${scaleTail}`,
              '-frames:v',
              '1',
              outPng,
            ]);
          }
        };

        const fontsOpt = fontsDir ? `:fontsdir='${escapeFfmpegFilterPath(fontsDir)}'` : '';
        const outFilename = `${jobId}.mp4`;
        const outPath = path.join(WCG_OUTPUT_DIR, outFilename);
        const videoFilter: string[] = [];
        const ffmpegArgs: string[] = ['-y', '-threads', '2'];

        if (partCount === 1) {
          const s1Scale = durationSeconds / 18;
          const geom1 = await computeImageCardSafeRect(part1ImagePath, p1Analysis);
          const ass1 = buildAdaptiveTypewriterAssFile(
            [
              { text: card.invocation, slotY: 0.05, fontSize: 21, isAccent: true, bold: true, revealOffsetSec: 0.25 * s1Scale, typeDurationSec: 0.85 * s1Scale },
              { text: `${card.hostLine1}  &  ${card.hostLine2}`, slotY: 0.145, fontSize: 32, bold: true, revealOffsetSec: 0.9 * s1Scale, typeDurationSec: 1.1 * s1Scale },
              { text: 'Cordially Invite You to the Wedding Celebration of', slotY: 0.24, fontSize: 24, italic: true, revealOffsetSec: 1.9 * s1Scale, typeDurationSec: 0.95 * s1Scale },
              { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.345, fontSize: 52, isAccent: true, bold: true, italic: true, revealOffsetSec: 2.7 * s1Scale, typeDurationSec: 1.0 * s1Scale },
              { text: card.eventTitle, slotY: 0.465, fontSize: 56, isAccent: true, bold: true, revealOffsetSec: 3.6 * s1Scale, typeDurationSec: 0.95 * s1Scale },
              { text: card.eventSubtitle, slotY: 0.56, fontSize: 28, italic: true, revealOffsetSec: 4.4 * s1Scale, typeDurationSec: 0.85 * s1Scale },
              { text: `Programme  ·  ${card.weddingDate}`, slotY: 0.655, fontSize: 30, isAccent: true, bold: true, revealOffsetSec: 5.1 * s1Scale, typeDurationSec: 1.0 * s1Scale },
              { text: card.timing1, slotY: 0.735, fontSize: 27, revealOffsetSec: 5.9 * s1Scale, typeDurationSec: 0.85 * s1Scale },
              { text: card.timing2, slotY: 0.80, fontSize: 27, revealOffsetSec: 6.6 * s1Scale, typeDurationSec: 0.85 * s1Scale },
              { text: card.venueName, slotY: 0.885, fontSize: 36, isAccent: true, bold: true, revealOffsetSec: 7.3 * s1Scale, typeDurationSec: 0.9 * s1Scale },
              { text: card.venueAddress, slotY: 0.96, fontSize: 22, revealOffsetSec: 8.0 * s1Scale, typeDurationSec: 1.1 * s1Scale },
            ],
            geom1.safeRect,
            durationSeconds,
            styling,
            fontName
          );
          const ass1Path = path.join(tmpDir, 'part1.ass');
          const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
          fs.writeFileSync(ass1Path, ass1, 'utf8');
          await bakeBgStill(part1ImagePath, styling.primaryColor, p1BakedPath, p1Analysis, geom1.cardRect, 1);

          ffmpegArgs.push('-loop', '1', '-t', String(durationSeconds), '-framerate', String(fps), '-i', p1BakedPath);
          videoFilter.push(`[0:v]ass='${escapeFfmpegFilterPath(ass1Path)}'${fontsOpt},format=yuv420p[vout]`);
        } else if (partCount === 2) {
          const [geom1, geom2] = await Promise.all([
            computeImageCardSafeRect(part1ImagePath, p1Analysis),
            computeImageCardSafeRect(part2ImagePath, p2Analysis),
          ]);
          const ass1 = buildAdaptiveTypewriterAssFile(
            [
              { text: card.invocation, slotY: 0.06, fontSize: 21, isAccent: true, bold: true, revealOffsetSec: 0.3 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.hostLine1, slotY: 0.19, fontSize: 38, bold: true, revealOffsetSec: 1.05 * timeScale, typeDurationSec: 1.05 * timeScale },
              { text: card.relationLine1, slotY: 0.33, fontSize: 25, italic: true, revealOffsetSec: 2.0 * timeScale, typeDurationSec: 1.2 * timeScale },
              { text: card.hostLine2, slotY: 0.49, fontSize: 38, isAccent: true, bold: true, revealOffsetSec: 3.15 * timeScale, typeDurationSec: 1.05 * timeScale },
              { text: card.relationLine2, slotY: 0.63, fontSize: 25, italic: true, revealOffsetSec: 4.1 * timeScale, typeDurationSec: 1.15 * timeScale },
              { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.77, fontSize: 48, isAccent: true, bold: true, italic: true, revealOffsetSec: 5.15 * timeScale, typeDurationSec: 1.0 * timeScale },
              { text: `${card.specialTitle}  ·  ${card.specialNames}`, slotY: 0.92, fontSize: 24, revealOffsetSec: 6.05 * timeScale, typeDurationSec: 1.1 * timeScale },
            ],
            geom1.safeRect,
            partDur,
            styling,
            fontName
          );
          const ass2 = buildAdaptiveTypewriterAssFile(
            [
              { text: card.part2Blessing, slotY: 0.06, fontSize: 34, isAccent: true, bold: true, revealOffsetSec: 0.3 * timeScale, typeDurationSec: 0.8 * timeScale },
              { text: card.part2Intro, slotY: 0.15, fontSize: 22, revealOffsetSec: 0.95 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.eventTitle, slotY: 0.28, fontSize: 70, isAccent: true, bold: true, italic: true, revealOffsetSec: 1.7 * timeScale, typeDurationSec: 0.95 * timeScale },
              { text: card.eventSubtitle, slotY: 0.40, fontSize: 30, italic: true, revealOffsetSec: 2.55 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: `Programme  ·  ${card.weddingDate}`, slotY: 0.53, fontSize: 32, isAccent: true, bold: true, revealOffsetSec: 3.35 * timeScale, typeDurationSec: 1.1 * timeScale },
              { text: card.timing1, slotY: 0.64, fontSize: 28, revealOffsetSec: 4.35 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.timing2, slotY: 0.72, fontSize: 28, revealOffsetSec: 5.1 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.venueName, slotY: 0.84, fontSize: 36, isAccent: true, bold: true, revealOffsetSec: 5.9 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.venueAddress, slotY: 0.94, fontSize: 23, revealOffsetSec: 6.65 * timeScale, typeDurationSec: 1.1 * timeScale },
            ],
            geom2.safeRect,
            partDur,
            styling,
            fontName
          );
          const ass1Path = path.join(tmpDir, 'part1.ass');
          const ass2Path = path.join(tmpDir, 'part2.ass');
          const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
          const p2BakedPath = path.join(tmpDir, 'p2_bg.png');
          fs.writeFileSync(ass1Path, ass1, 'utf8');
          fs.writeFileSync(ass2Path, ass2, 'utf8');
          await Promise.all([
            bakeBgStill(part1ImagePath, styling.primaryColor, p1BakedPath, p1Analysis, geom1.cardRect, 1),
            bakeBgStill(part2ImagePath, styling.secondaryColor, p2BakedPath, p2Analysis, geom2.cardRect, 2),
          ]);

          const xfadeOffset = Math.max(2, partDur - xfadeDur).toFixed(2);
          ffmpegArgs.push(
            '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p1BakedPath,
            '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p2BakedPath
          );
          videoFilter.push(
            `[0:v]ass='${escapeFfmpegFilterPath(ass1Path)}'${fontsOpt},format=yuv420p[v1]`,
            `[1:v]ass='${escapeFfmpegFilterPath(ass2Path)}'${fontsOpt},format=yuv420p[v2]`,
            `[v1][v2]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${xfadeOffset},format=yuv420p[vout]`
          );
        } else {
          // 3-Part Triple Function Suite (Function 1 Mehndi -> Function 2 Barat -> Function 3 Walima)
          const [geom1, geom2, geom3] = await Promise.all([
            computeImageCardSafeRect(part1ImagePath, p1Analysis),
            computeImageCardSafeRect(part2ImagePath, p2Analysis),
            computeImageCardSafeRect(part3ImagePath, p3Analysis),
          ]);
          const ass1 = buildAdaptiveTypewriterAssFile(
            [
              { text: card.invocation, slotY: 0.06, fontSize: 21, isAccent: true, bold: true, revealOffsetSec: 0.2 * timeScale, typeDurationSec: 0.8 * timeScale },
              { text: `${card.hostLine1}  &  ${card.hostLine2}`, slotY: 0.17, fontSize: 31, bold: true, revealOffsetSec: 0.85 * timeScale, typeDurationSec: 0.95 * timeScale },
              { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.30, fontSize: 48, isAccent: true, bold: true, italic: true, revealOffsetSec: 1.7 * timeScale, typeDurationSec: 0.95 * timeScale },
              { text: `FUNCTION 1  ·  ${card.func1Title}`, slotY: 0.45, fontSize: 54, isAccent: true, bold: true, revealOffsetSec: 2.5 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.func1Subtitle, slotY: 0.57, fontSize: 29, italic: true, revealOffsetSec: 3.3 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func1Date, slotY: 0.69, fontSize: 32, isAccent: true, bold: true, revealOffsetSec: 4.1 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func1Timing, slotY: 0.80, fontSize: 27, revealOffsetSec: 4.8 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func1Venue, slotY: 0.92, fontSize: 27, isAccent: true, bold: true, revealOffsetSec: 5.5 * timeScale, typeDurationSec: 0.9 * timeScale },
            ],
            geom1.safeRect,
            partDur,
            styling,
            fontName
          );
          const ass2 = buildAdaptiveTypewriterAssFile(
            [
              { text: 'FUNCTION 2  ·  ROYAL CEREMONY', slotY: 0.08, fontSize: 24, isAccent: true, bold: true, revealOffsetSec: 0.2 * timeScale, typeDurationSec: 0.75 * timeScale },
              { text: card.func2Title, slotY: 0.24, fontSize: 70, isAccent: true, bold: true, italic: true, revealOffsetSec: 0.9 * timeScale, typeDurationSec: 0.95 * timeScale },
              { text: card.func2Subtitle, slotY: 0.40, fontSize: 32, italic: true, revealOffsetSec: 1.75 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.54, fontSize: 36, isAccent: true, bold: true, revealOffsetSec: 2.55 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func2Date, slotY: 0.68, fontSize: 34, isAccent: true, bold: true, revealOffsetSec: 3.3 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.func2Timing, slotY: 0.79, fontSize: 29, revealOffsetSec: 4.1 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func2Venue, slotY: 0.92, fontSize: 29, isAccent: true, bold: true, revealOffsetSec: 4.85 * timeScale, typeDurationSec: 0.95 * timeScale },
            ],
            geom2.safeRect,
            partDur,
            styling,
            fontName
          );
          const ass3 = buildAdaptiveTypewriterAssFile(
            [
              { text: 'FUNCTION 3  ·  GRAND RECEPTION', slotY: 0.08, fontSize: 24, isAccent: true, bold: true, revealOffsetSec: 0.2 * timeScale, typeDurationSec: 0.75 * timeScale },
              { text: card.func3Title, slotY: 0.24, fontSize: 70, isAccent: true, bold: true, italic: true, revealOffsetSec: 0.9 * timeScale, typeDurationSec: 0.95 * timeScale },
              { text: card.func3Subtitle, slotY: 0.40, fontSize: 32, italic: true, revealOffsetSec: 1.75 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.54, fontSize: 36, isAccent: true, bold: true, revealOffsetSec: 2.55 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func3Date, slotY: 0.68, fontSize: 34, isAccent: true, bold: true, revealOffsetSec: 3.3 * timeScale, typeDurationSec: 0.9 * timeScale },
              { text: card.func3Timing, slotY: 0.79, fontSize: 29, revealOffsetSec: 4.1 * timeScale, typeDurationSec: 0.85 * timeScale },
              { text: card.func3Venue, slotY: 0.92, fontSize: 29, isAccent: true, bold: true, revealOffsetSec: 4.85 * timeScale, typeDurationSec: 0.95 * timeScale },
            ],
            geom3.safeRect,
            partDur,
            styling,
            fontName
          );

          const ass1Path = path.join(tmpDir, 'part1.ass');
          const ass2Path = path.join(tmpDir, 'part2.ass');
          const ass3Path = path.join(tmpDir, 'part3.ass');
          const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
          const p2BakedPath = path.join(tmpDir, 'p2_bg.png');
          const p3BakedPath = path.join(tmpDir, 'p3_bg.png');
          fs.writeFileSync(ass1Path, ass1, 'utf8');
          fs.writeFileSync(ass2Path, ass2, 'utf8');
          fs.writeFileSync(ass3Path, ass3, 'utf8');
          await Promise.all([
            bakeBgStill(part1ImagePath, styling.primaryColor, p1BakedPath, p1Analysis, geom1.cardRect, 1),
            bakeBgStill(part2ImagePath, styling.secondaryColor, p2BakedPath, p2Analysis, geom2.cardRect, 2),
            bakeBgStill(part3ImagePath, styling.primaryColor, p3BakedPath, p3Analysis, geom3.cardRect, 3),
          ]);

          const off1 = Math.max(1.5, partDur - xfadeDur);
          const off2 = Math.max(3.0, off1 + partDur - xfadeDur);
          ffmpegArgs.push(
            '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p1BakedPath,
            '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p2BakedPath,
            '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p3BakedPath
          );
          videoFilter.push(
            `[0:v]ass='${escapeFfmpegFilterPath(ass1Path)}'${fontsOpt},format=yuv420p[v1]`,
            `[1:v]ass='${escapeFfmpegFilterPath(ass2Path)}'${fontsOpt},format=yuv420p[v2]`,
            `[2:v]ass='${escapeFfmpegFilterPath(ass3Path)}'${fontsOpt},format=yuv420p[v3]`,
            `[v1][v2]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${off1.toFixed(2)}[v12]`,
            `[v12][v3]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${off2.toFixed(2)},format=yuv420p[vout]`
          );
        }

        const audioInputIndex = partCount;
        if (musicPath && musicVolume > 0.01) {
          const fadeOutStart = Math.max(1, durationSeconds - 1.4).toFixed(2);
          videoFilter.push(
            `[${audioInputIndex}:a]atrim=0:${durationSeconds},asetpts=PTS-STARTPTS,volume=${musicVolume.toFixed(2)},afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOutStart}:d=1.4[aout]`
          );
          ffmpegArgs.push('-stream_loop', '-1', '-i', musicPath);
        }

        ffmpegArgs.push(
          '-filter_complex', videoFilter.join(';'),
          '-map', '[vout]'
        );

        if (musicPath && musicVolume > 0.01) {
          ffmpegArgs.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100');
        }

        ffmpegArgs.push(
          '-t', String(durationSeconds),
          '-r', String(fps),
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'stillimage',
          '-crf', crf,
          '-threads', '2',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          outPath
        );

        await execFileAsync(ffmpegBin, ffmpegArgs, { timeout: 300000 });

        fs.rmSync(tmpDir, { recursive: true, force: true });
        const videoUrl = `/api/wcg/download/${outFilename}`;
        jobRecord.status = 'completed';
        jobRecord.result = {
          ok: true,
          status: 'completed',
          filename: outFilename,
          videoUrl,
          downloadUrl: `${videoUrl}?download=1`,
          durationSeconds,
          resolution: `${targetW}x${targetH}`,
          engine: `ffmpeg-${quality}-${partCount}p${musicPath ? '+aac' : ''} (${ffmpegResolved.source})`,
          multiPart: partCount > 1,
          partCount,
          musicId: musicPath ? musicId : 'none',
        };
      } catch (err: any) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        console.error('[WCG Render Error]:', err);
        jobRecord.status = 'failed';
        jobRecord.error = err?.message || 'Wedding card video render failed';
      }
    };

    const backgroundPromise = runRenderTask();
    // Wait up to 8s so fast hosts finish in one request; slower hosts (Render Free Tier) return jobId for clean polling
    await Promise.race([
      backgroundPromise,
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);

    if (jobRecord.status === 'completed' && jobRecord.result) {
      return res.json(jobRecord.result);
    }
    if (jobRecord.status === 'failed') {
      return res.status(500).json({ ok: false, error: jobRecord.error || 'Render failed' });
    }
    return res.json({
      ok: true,
      status: 'rendering',
      jobId,
      elapsedSec: Math.round((Date.now() - jobRecord.startedAt) / 1000),
    });
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
