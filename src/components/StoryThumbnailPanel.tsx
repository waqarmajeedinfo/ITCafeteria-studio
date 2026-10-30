import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
  X,
  Edit2,
  Save
} from 'lucide-react';
import type { GeneratedStory } from './StoryPackageView';
import { resolveThumbnailSpec } from '../lib/thumbnailMaster';

const IMAGE_MODELS = [
  { id: 'gemini-nano-banana-2.1', label: 'Nano Banana 2.1 (best)' },
  { id: 'gemini-3.1-flash-lite-image', label: 'Gemini 3.1 Flash Lite Image (fallback)' }
] as const;

type ImageModel = (typeof IMAGE_MODELS)[number]['id'];

interface StoredReference {
  image: string;
  name: string;
  bundled?: boolean;
}

const REFERENCE_STORAGE_PREFIX = 'itcafeteria_character_ref_';
const REFERENCE_EVENT = 'itcafeteria-character-reference';
const BUNDLED_REFERENCE_BASE = '/character-refs/';

const getBundledReferencePath = (tag: string): string | null => {
  const match = /^@?(WM25-\d)$/.exec((tag || '').trim());
  if (!match) return null;
  if (match[1] === 'WM25-6') return `${BUNDLED_REFERENCE_BASE}${match[1]}.png`;
  return `${BUNDLED_REFERENCE_BASE}${match[1]}.jpg`;
};

const readStoredReference = (tag: string): StoredReference | null => {
  try {
    const raw = localStorage.getItem(`${REFERENCE_STORAGE_PREFIX}${tag || 'default'}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.image === 'string' && parsed.image.startsWith('data:image/')) {
      return {
        image: parsed.image,
        name: typeof parsed?.name === 'string' && parsed.name ? parsed.name : 'reference.jpg'
      };
    }
  } catch {
    // Storage disabled ya corrupt value ho to reference ke bina continue karein.
  }
  return null;
};

const persistReference = (tag: string, reference: StoredReference | null) => {
  const key = tag || 'default';
  try {
    if (reference) localStorage.setItem(`${REFERENCE_STORAGE_PREFIX}${key}`, JSON.stringify(reference));
    else localStorage.removeItem(`${REFERENCE_STORAGE_PREFIX}${key}`);
  } catch {
    // Quota full ho to image sirf isi session mein kaam karegi.
  }
  window.dispatchEvent(new CustomEvent(REFERENCE_EVENT, { detail: { tag: key, reference } }));
};

const downscaleImageFile = async (file: File): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Reference image read nahi ho saki.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Reference image load nahi ho saki.'));
    img.src = dataUrl;
  });

  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Reference image process nahi ho saki.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
};

export const StoryThumbnailPanel: React.FC<{
  story: GeneratedStory;
  onUpdateStory?: (updated: GeneratedStory) => void;
}> = ({ story, onUpdateStory }) => {
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState<ImageModel>('gemini-nano-banana-2.1');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState('');
  const [error, setError] = useState('');
  const [reference, setReference] = useState<StoredReference | null>(() =>
    readStoredReference(story.characterTag)
  );
  const [referenceBusy, setReferenceBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceImage = reference?.image || '';
  const referenceName = reference?.name || '';

  // Inline Thumbnail Editing State
  const initialSpec = resolveThumbnailSpec({
    channelName: story.channelName,
    presenter: story.presenter,
    title: story.title,
    ideaTitle: story.idea?.title,
    headline: story.thumbnailHeadline,
    line1: story.thumbnailLine1,
    line2: story.thumbnailLine2,
    subBanner: story.thumbnailSubBadge,
    hologram: story.thumbnailHologram,
    characterTag: story.characterTag
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editLine1, setEditLine1] = useState(initialSpec.line1 || '');
  const [editLine2, setEditLine2] = useState(initialSpec.line2 || '');
  const [editSubBanner, setEditSubBanner] = useState(initialSpec.subBanner || '');
  const [editHologram, setEditHologram] = useState(initialSpec.hologram || '');
  const [editPrompt, setEditPrompt] = useState(initialSpec.prompt || '');

  useEffect(() => {
    const tag = story.characterTag || 'default';
    const handleReferenceChange = (event: Event) => {
      const detail = (event as CustomEvent<{ tag: string; reference: StoredReference | null }>).detail;
      if (detail?.tag === tag) {
        setReference(detail.reference ?? null);
        setImageUrl(null);
        setUsedModel('');
      }
    };
    window.addEventListener(REFERENCE_EVENT, handleReferenceChange);
    return () => window.removeEventListener(REFERENCE_EVENT, handleReferenceChange);
  }, [story.characterTag]);

  const bundledPath = getBundledReferencePath(story.characterTag);

  useEffect(() => {
    if (!bundledPath) return;
    if (readStoredReference(story.characterTag)) return;
    let cancelled = false;
    setReferenceBusy(true);
    const fileName = bundledPath.split('/').pop() || 'default.jpg';
    fetch(bundledPath)
      .then((res) => {
        if (!res.ok) throw new Error('Bundled reference available nahi.');
        return res.blob();
      })
      .then((blob) => downscaleImageFile(new File([blob], fileName, { type: 'image/jpeg' })))
      .then((image) => {
        if (cancelled) return;
        setReference({ image, name: fileName, bundled: true });
      })
      .catch(() => {
        // Built-in reference optional hai — upload prompt waise bhi kaam karta hai.
      })
      .finally(() => {
        if (!cancelled) setReferenceBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bundledPath, story.characterTag]);

  const spec = resolveThumbnailSpec({
    channelName: story.channelName,
    presenter: story.presenter,
    title: story.title,
    ideaTitle: story.idea?.title,
    headline: story.thumbnailHeadline,
    line1: story.thumbnailLine1,
    line2: story.thumbnailLine2,
    subBanner: story.thumbnailSubBadge,
    hologram: story.thumbnailHologram,
    characterTag: story.characterTag,
    hasReferenceImage: Boolean(referenceImage)
  });

  const handleReferenceFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Sirf image file upload karein (JPG, PNG ya WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Reference image 12 MB se choti honi chahiye.');
      return;
    }

    setReferenceBusy(true);
    setError('');
    try {
      const image = await downscaleImageFile(file);
      const nextReference = {
        image,
        name: file.name
      };
      setReference(nextReference);
      persistReference(story.characterTag, nextReference);
      setImageUrl(null);
      setUsedModel('');
    } catch (err: any) {
      setError(err?.message || 'Reference image load nahi ho saki.');
    } finally {
      setReferenceBusy(false);
    }
  };

  const removeReference = () => {
    setReference(null);
    persistReference(story.characterTag, null);
    setImageUrl(null);
    setUsedModel('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyPrompt = async () => {
    let copiedOk = false;
    try {
      await navigator.clipboard.writeText(spec.prompt);
      copiedOk = true;
    } catch {
      // Clipboard API available na ho to legacy fallback.
    }

    if (!copiedOk) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = spec.prompt;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copiedOk = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copiedOk = false;
      }
    }

    if (copiedOk) {
      setError('');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setError('Prompt copy nahi ho saka. Prompt box ke andar text select karke manually copy karein.');
    }
  };

  const requestImage = async (modelId: ImageModel) => {
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: spec.prompt,
        aspectRatio: '9:16',
        imageSize: '1K',
        model: modelId,
        ...(referenceImage ? { base64InputImage: referenceImage } : {})
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(String(data.error || `Image generation failed (${res.status})`));
    }

    const data = await res.json();
    if (!data.imageUrl) throw new Error('Model ne image return nahi ki.');
    return String(data.imageUrl);
  };

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setImageUrl(null);
    setUsedModel('');

    const order: ImageModel[] =
      model === 'gemini-nano-banana-2.1'
        ? ['gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image']
        : ['gemini-3.1-flash-lite-image', 'gemini-nano-banana-2.1'];

    let lastError = '';
    for (const candidate of order) {
      try {
        const url = await requestImage(candidate);
        setImageUrl(url);
        setUsedModel(candidate);
        lastError = '';
        break;
      } catch (err: any) {
        lastError = err?.message || 'Image generation failed';
      }
    }

    if (lastError) setError(lastError);
    setLoading(false);
  };

  const slug =
    (story.title || 'thumbnail')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'itcafeteria';
  const downloadName = `${slug}-thumbnail.png`;

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/20 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 text-[10px] font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MASTER THUMBNAIL AGENT · v3.45
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
              9:16
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
              20% top / bottom clean
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mt-2">Story-specific thumbnail package</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Har new story ke saath yeh rule automatically apply hota hai. Prompt copy karein, seedha image generate karein, ya PNG download karein.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Prompt Copied!' : 'Copy Prompt'}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-colors ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Thumbnail Headline, Sub-banner aur Prompt edit karein"
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || referenceBusy}
            title={referenceImage ? 'Change character reference image' : 'Upload character reference image'}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {referenceBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : referenceImage ? (
              <img src={referenceImage} alt="" className="w-4 h-4 rounded object-cover border border-cyan-500/40" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {referenceBusy ? 'Processing...' : referenceImage ? 'Change Reference' : 'Add Reference'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || referenceBusy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-fuchsia-600 to-cyan-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? 'Generating Thumbnail...' : imageUrl ? 'Regenerate Thumbnail' : 'Generate Thumbnail'}
          </button>
        </div>
      </div>

      {/* Inline Thumbnail Edit Panel */}
      {isEditing && (
        <div className="p-4 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Edit Thumbnail Package Spec & Master Prompt
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Headline Part 1 (Bold White)</label>
              <input
                type="text"
                value={editLine1}
                onChange={(e) => setEditLine1(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Headline Part 2 (Cyan Accent)</label>
              <input
                type="text"
                value={editLine2}
                onChange={(e) => setEditLine2(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Yellow Sub-Banner Badge</label>
              <input
                type="text"
                value={editSubBanner}
                onChange={(e) => setEditSubBanner(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Floating 3D Hologram Prop</label>
              <input
                type="text"
                value={editHologram}
                onChange={(e) => setEditHologram(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 block mb-1 text-xs">Master Thumbnail Prompt</label>
            <textarea
              rows={3}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updatedStory: GeneratedStory = {
                  ...story,
                  thumbnailHeadline: `${editLine1.trim()} ${editLine2.trim()}`.trim(),
                  thumbnailLine1: editLine1.trim(),
                  thumbnailLine2: editLine2.trim(),
                  thumbnailSubBadge: editSubBanner.trim(),
                  thumbnailHologram: editHologram.trim(),
                  thumbnailPrompt: editPrompt.trim()
                };
                onUpdateStory?.(updatedStory);
                setIsEditing(false);
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Thumbnail Spec
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Hero headline</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
                {spec.line1}
              </span>
              {spec.line2 && (
                <span className="text-lg sm:text-xl font-black tracking-tight text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.55)]">
                  {spec.line2}
                </span>
              )}
              <span className="w-5 h-5 rounded-full border border-cyan-300/70 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                &gt;
              </span>
            </div>

            <div className="pt-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Yellow sub-banner</span>
              <div className="mt-1 inline-block px-3 py-1 rounded-sm bg-gradient-to-br from-yellow-300 to-amber-400 text-black font-bold text-xs shadow-md -rotate-1">
                {spec.subBanner}
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Floating 3D hologram</span>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{spec.hologram}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              `Logo: ${spec.identity.channelName}`,
              `Tagline: ${spec.identity.tagline}`,
              `Character tag: ${story.characterTag || 'default'}`,
              referenceImage
                ? reference?.bundled
                  ? 'Reference: built-in (tag default)'
                  : 'Reference: uploaded'
                : 'Reference: not uploaded',
              'Character: lower-left',
              'Signature patch',
              'No haze / heavy filters'
            ].map((chip) => (
              <span
                key={chip}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[10px]"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                Full v3.45 image prompt
              </span>
              <span className="text-[9px] text-slate-600 font-mono">{spec.prompt.length} chars</span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-300 font-mono selection:bg-fuchsia-600 selection:text-white">
              {spec.prompt}
            </pre>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                  Character reference image
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  Tag: <span className="text-cyan-300 font-mono">{story.characterTag || 'default'}</span>
                </p>
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                  referenceImage
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-slate-400 bg-slate-800/60 border-slate-700'
                }`}
              >
                {referenceImage ? 'Identity locked' : 'Recommended'}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleReferenceFile(file);
                event.target.value = '';
              }}
            />

            {referenceImage ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={referenceImage}
                  alt={`Reference for ${story.characterTag || story.presenter}`}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-slate-200">{referenceName || 'reference.jpg'}</p>
                  <p className="text-[9px] text-emerald-400 leading-snug mt-0.5">
                    Face, hair aur outfit isi image se lock honge.
                  </p>
                  {reference?.bundled && (
                    <p className="text-[9px] text-slate-500 leading-snug mt-0.5">
                      Tag ka built-in default — remove kar sakte hain, apni photo upload karna override kar deti hai.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || referenceBusy}
                    title="Change reference image"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={removeReference}
                    disabled={loading}
                    title="Remove reference image"
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={referenceBusy || loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-600 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-[11px] font-semibold transition-colors disabled:opacity-60"
              >
                {referenceBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {referenceBusy ? 'Processing image...' : 'Upload reference image'}
              </button>
            )}

            <p className="text-[9px] text-slate-500 leading-snug">
              WM25 tag ka built-in studio reference apne aap load ho jata hai. Apni pasand ki image upload karein to woh save ho kar agli story mein khud load hogi aur built-in ko override kar degi. Prompt copy kar rahe hain to yehi image external tool mein bhi attach karein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="thumbnail-model" className="text-[10px] uppercase tracking-wider text-slate-500 font-mono shrink-0">
              Image model
            </label>
            <select
              id="thumbnail-model"
              value={model}
              onChange={(event) => setModel(event.target.value as ImageModel)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              {IMAGE_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-[11px] text-rose-200 max-h-36 overflow-auto">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="break-words whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {loading && (
            <div className="aspect-[9/16] max-h-[420px] w-full rounded-xl border border-fuchsia-500/30 bg-slate-950 flex flex-col items-center justify-center gap-3 text-center px-4">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
              <p className="text-xs text-slate-300 font-semibold">Thumbnail generate ho rahi hai...</p>
              <p className="text-[10px] text-slate-500">Usually 20–60 seconds. Free-tier model busy ho to app khud doosra model try karti hai.</p>
            </div>
          )}

          {!loading && imageUrl && (
            <div className="space-y-2">
              <div className="aspect-[9/16] max-h-[460px] w-full rounded-xl overflow-hidden border border-fuchsia-500/30 bg-slate-950">
                <img
                  src={imageUrl}
                  alt={`${story.title} thumbnail`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={imageUrl}
                  download={downloadName}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </a>
                <button
                  onClick={handleGenerate}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              </div>
              <p className="text-[9px] text-slate-500 font-mono">
                Model: {usedModel} • Download kar lein; page reload par preview reset ho jata hai.
              </p>
            </div>
          )}

          {!loading && !imageUrl && (
            <div className="aspect-[9/16] max-h-[420px] w-full rounded-xl border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center gap-2 text-center px-5">
              <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-400">Abhi koi thumbnail generate nahi hui.</p>
              <p className="text-[10px] text-slate-500">
                Upar wala v3.45 prompt isi story se bana hai — Generate dabaein ya prompt copy karke kisi bhi image model mein chalaein.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
