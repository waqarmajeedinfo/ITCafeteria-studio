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
  WCG_MUSIC_PRESETS,
  WCG_TEMPLATES,
  findWcgMusicPreset,
  findWcgTemplate,
  type WcgCardData,
  type WcgCustomSongItem,
  type WcgCustomTemplateItem,
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
  fs.writeFileSync(WCG_LIB_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
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
      const chars = Array.from(lineStr);
      for (let cIdx = 0; cIdx < chars.length; cIdx += 3) {
        const chunk = chars.slice(cIdx, cIdx + 3).join('');
        const t1 = charCursor * perCharMs;
        const t2 = t1 + 90;
        animatedChars += `{\\alpha&HFF&\\t(${t1},${t2},\\alpha&H00&)}${escapeAssText(chunk)}`;
        charCursor += chunk.length;
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

  app.post('/api/wcg/library/templates', (req, res) => {
    try {
      ensureOutputDir();
      const body = req.body || {};
      const name = String(body.name || `Custom Wedding Card ${Date.now().toString().slice(-4)}`).trim().slice(0, 80);
      const rawCat = String(body.category || 'Mehndi');
      const category = (['Mehndi', 'Barat', 'Walima', 'Nikah'].includes(rawCat) ? rawCat : 'Mehndi') as WcgCustomTemplateItem['category'];
      const part1Raw = String(body.part1DataUrl || body.dataUrl || '');
      const part2Raw = String(body.part2DataUrl || '');

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
      fs.writeFileSync(path.join(WCG_LIB_TEMPLATES_DIR, file1), dec1.buffer);
      fs.writeFileSync(path.join(BACKEND_CUSTOM_TEMPLATES_DIR, file1), dec1.buffer);

      let file2: string | undefined;
      if (part2Raw) {
        const dec2 = decodeBase64DataUrl(part2Raw);
        if (dec2 && /^image\/(jpeg|jpg|png|webp)$/.test(dec2.mime) && dec2.buffer.length <= 12 * 1024 * 1024) {
          const ext2 = dec2.mime === 'image/png' ? 'png' : dec2.mime === 'image/webp' ? 'webp' : 'jpg';
          file2 = `${id}_p2.${ext2}`;
          fs.writeFileSync(path.join(WCG_LIB_TEMPLATES_DIR, file2), dec2.buffer);
          fs.writeFileSync(path.join(BACKEND_CUSTOM_TEMPLATES_DIR, file2), dec2.buffer);
        }
      }

      const item: WcgCustomTemplateItem = {
        id,
        name,
        category,
        part1Filename: file1,
        part2Filename: file2,
        part1Url: `/api/wcg/library/assets/templates/${file1}`,
        part2Url: file2 ? `/api/wcg/library/assets/templates/${file2}` : undefined,
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

  app.delete('/api/wcg/library/templates/:id', (req, res) => {
    const manifest = readLibraryManifest();
    const target = manifest.templates.find((t) => t.id === req.params.id);
    if (!target) {
      return res.status(404).json({ ok: false, error: 'Custom template not found' });
    }
    for (const fname of [target.part1Filename, target.part2Filename]) {
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
            multiPart: true,
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
        const partDur = Number(((durationSeconds + xfadeDur) / 2).toFixed(2));
        const fontName = fontsDir ? 'DejaVu Serif' : 'Sans';
        const isFullHd = quality === '1080p';
        const targetW = isFullHd ? 1080 : 720;
        const targetH = isFullHd ? 1920 : 1280;
        const fps = isFullHd ? 18 : 15;
        const crf = isFullHd ? '20' : '22';
        const timeScale = partDur / 9.9;

        const ass1Content = buildTypewriterAssFile(
          [
            { text: card.invocation, x: 540, y: 565, fontSize: 21, isAccent: true, bold: true, revealOffsetSec: 0.3 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 34 },
            { text: card.hostLine1, x: 540, y: 655, fontSize: 38, bold: true, revealOffsetSec: 1.05 * timeScale, typeDurationSec: 1.05 * timeScale, maxCharsPerLine: 28 },
            { text: card.relationLine1, x: 540, y: 745, fontSize: 25, italic: true, revealOffsetSec: 2.0 * timeScale, typeDurationSec: 1.2 * timeScale, maxCharsPerLine: 34 },
            { text: card.hostLine2, x: 540, y: 855, fontSize: 38, isAccent: true, bold: true, revealOffsetSec: 3.15 * timeScale, typeDurationSec: 1.05 * timeScale, maxCharsPerLine: 28 },
            { text: card.relationLine2, x: 540, y: 940, fontSize: 25, italic: true, revealOffsetSec: 4.1 * timeScale, typeDurationSec: 1.15 * timeScale, maxCharsPerLine: 34 },
            { text: `${card.groomName}  &  ${card.brideName}`, x: 540, y: 1035, fontSize: 48, isAccent: true, bold: true, italic: true, revealOffsetSec: 5.15 * timeScale, typeDurationSec: 1.0 * timeScale, maxCharsPerLine: 24 },
            { text: `${card.specialTitle}  ·  ${card.specialNames}`, x: 540, y: 1140, fontSize: 25, revealOffsetSec: 6.05 * timeScale, typeDurationSec: 1.1 * timeScale, maxCharsPerLine: 34 },
          ],
          partDur,
          styling,
          fontName
        );

        const ass2Content = buildTypewriterAssFile(
          [
            { text: card.part2Blessing, x: 540, y: 495, fontSize: 35, isAccent: true, bold: true, revealOffsetSec: 0.3 * timeScale, typeDurationSec: 0.8 * timeScale, maxCharsPerLine: 28 },
            { text: card.part2Intro, x: 540, y: 565, fontSize: 22, revealOffsetSec: 0.95 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 38 },
            { text: card.eventTitle, x: 540, y: 660, fontSize: 72, isAccent: true, bold: true, italic: true, revealOffsetSec: 1.7 * timeScale, typeDurationSec: 0.95 * timeScale, maxCharsPerLine: 20 },
            { text: card.eventSubtitle, x: 540, y: 745, fontSize: 30, italic: true, revealOffsetSec: 2.55 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 32 },
            { text: `Programme  ·  ${card.weddingDate}`, x: 540, y: 850, fontSize: 33, isAccent: true, bold: true, revealOffsetSec: 3.35 * timeScale, typeDurationSec: 1.1 * timeScale, maxCharsPerLine: 34 },
            { text: card.timing1, x: 540, y: 932, fontSize: 28, revealOffsetSec: 4.35 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 36 },
            { text: card.timing2, x: 540, y: 992, fontSize: 28, revealOffsetSec: 5.1 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 36 },
            { text: card.venueName, x: 540, y: 1105, fontSize: 37, isAccent: true, bold: true, revealOffsetSec: 5.9 * timeScale, typeDurationSec: 0.9 * timeScale, maxCharsPerLine: 30 },
            { text: card.venueAddress, x: 540, y: 1185, fontSize: 24, revealOffsetSec: 6.65 * timeScale, typeDurationSec: 1.1 * timeScale, maxCharsPerLine: 36 },
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
        const rawTplId = String(body.templateId || '');
        const manifest = readLibraryManifest();
        const customTpl = manifest.templates.find((t) => t.id === rawTplId);
        const customP1 = customTpl ? resolveCustomTemplateFile(customTpl.part1Filename) : null;
        const customP2 = customTpl
          ? resolveCustomTemplateFile(customTpl.part2Filename) || customP1
          : null;

        const { s1, s2 } = resolveMultiPartAssetPaths();
        const isBuiltinMultipart = rawTplId === 'pakistani-emerald-mehndi-multipart' && Boolean(s1 && s2);
        const part1ImagePath = customP1 || (isBuiltinMultipart ? s1 : null);
        const part2ImagePath = customP2 || (isBuiltinMultipart ? s2 : null);
        const musicPath = resolveMusicAssetPath(musicId);

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

        const p1BakedPath = path.join(tmpDir, 'p1_bg.png');
        const p2BakedPath = path.join(tmpDir, 'p2_bg.png');
        const scaleTail = isFullHd ? '' : `,scale=${targetW}:${targetH}`;

        if (part1ImagePath && part2ImagePath) {
          const p1Mask =
            isBuiltinMultipart && styling.cleanSampleText
              ? `,drawbox=x=275:y=495:w=530:h=735:color=0x1B7A72@0.98:t=fill`
              : '';
          const p2Mask =
            isBuiltinMultipart && styling.cleanSampleText
              ? `,drawbox=x=285:y=420:w=510:h=840:color=0x196134@0.98:t=fill`
              : '';

          // Bake crisp target-resolution stills once per part (supports both s1/s2 and custom user uploads)
          await Promise.all([
            execFileAsync(ffmpegBin, [
              '-y', '-i', part1ImagePath,
              '-filter_complex',
              `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24,eq=brightness=-0.06[bgb];[fg]scale=1080:1420:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2${p1Mask},vignette=PI/6${scaleTail}`,
              '-frames:v', '1',
              p1BakedPath,
            ]),
            execFileAsync(ffmpegBin, [
              '-y', '-i', part2ImagePath,
              '-filter_complex',
              `[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=24,eq=brightness=-0.06[bgb];[fg]scale=1080:1420:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2${p2Mask},vignette=PI/6${scaleTail}`,
              '-frames:v', '1',
              p2BakedPath,
            ]),
          ]);
        } else {
          const pColor = hexToFfmpegColor(styling.primaryColor, '0x4E0D19');
          const sColor = hexToFfmpegColor(styling.secondaryColor, '0x2D070F');
          const aColor = hexToFfmpegColor(styling.accentColor, '0xE6C275');

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
              '-vf', `${frameDeco},vignette=PI/6${scaleTail}`, '-frames:v', '1', p1BakedPath,
            ]),
            execFileAsync(ffmpegBin, [
              '-y', '-f', 'lavfi', '-i', `color=c=${sColor}:s=1080x1920:d=1:r=1`,
              '-vf', `${frameDeco},vignette=PI/6${scaleTail}`, '-frames:v', '1', p2BakedPath,
            ]),
          ]);
        }

        const videoFilter = [
          `[0:v]ass='${ass1Esc}'${fontsOpt},format=yuv420p[v1]`,
          `[1:v]ass='${ass2Esc}'${fontsOpt},format=yuv420p[v2]`,
          `[v1][v2]xfade=transition=${xfadeMode}:duration=${xfadeDur}:offset=${xfadeOffset},format=yuv420p[vout]`,
        ];

        const ffmpegArgs: string[] = [
          '-y',
          '-threads', '2',
          '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p1BakedPath,
          '-loop', '1', '-t', String(partDur), '-framerate', String(fps), '-i', p2BakedPath,
        ];

        if (musicPath && musicVolume > 0.01) {
          const fadeOutStart = Math.max(1, durationSeconds - 1.4).toFixed(2);
          videoFilter.push(
            `[2:a]atrim=0:${durationSeconds},asetpts=PTS-STARTPTS,volume=${musicVolume.toFixed(2)},afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOutStart}:d=1.4[aout]`
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
          engine: `ffmpeg-${quality}${musicPath ? '+aac' : ''} (${ffmpegResolved.source})`,
          multiPart: true,
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
