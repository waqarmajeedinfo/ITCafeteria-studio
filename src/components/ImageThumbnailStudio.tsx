import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Upload, 
  Sliders, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Zap,
  Wand2
} from 'lucide-react';

export type ThumbnailModelId =
  | 'xiaomi-mimo-v2.6-pro-free'
  | 'mimo-v2.6-pro'
  | 'gemini-nano-banana-2.1'
  | 'gemini-3.1-flash-lite-image';

export const ImageThumbnailStudio: React.FC = () => {
  const [headline, setHeadline] = useState('STORAGE SENSE');
  const [subBanner, setSubBanner] = useState('Auto Clean PC');
  const [prompt, setPrompt] = useState(
    'Create a YouTube thumbnail using character Waqar Majeed for IT Cafeteria (tagline: Learn • Build • Grow). Follow Section 19.1.2 Universal Template: Dark navy studio backdrop with neon-blue edge glow and vibrant swirling cyan energy-vortex with bright sparkle particles. Hero headline: "STORAGE SENSE" in bold 3D blue-to-white gradient lettering with heavy drop shadow. Sub-banner: "Auto Clean PC" on bright yellow brush-stroke banner. Glowing 3D hologram of a Windows hard drive clearing red cache to blue. Confident presenter pointing to central hologram. Branded mug and laptop on desk. Saturated vibrant wow factor lighting.'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [model, setModel] = useState<ThumbnailModelId>('xiaomi-mimo-v2.6-pro-free');
  const [base64InputImage, setBase64InputImage] = useState<string | null>(null);
  const [inputImageName, setInputImageName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Xiaomi / AIHubMix API Key State
  const [xiaomiKeyInput, setXiaomiKeyInput] = useState<string>(() => {
    try {
      return localStorage.getItem('itc_xiaomi_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ configured: boolean; keySource: string | null } | null>(null);

  React.useEffect(() => {
    fetch('/api/ai/xiaomi-status')
      .then((r) => r.json())
      .then((data) => setServerStatus(data))
      .catch(() => {});
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setBase64InputImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    const isXiaomi = model.includes('xiaomi') || model.includes('mimo');

    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(xiaomiKeyInput.trim() ? { 'x-xiaomi-api-key': xiaomiKeyInput.trim() } : {})
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          imageSize,
          model,
          base64InputImage: base64InputImage || undefined,
          xiaomiApiKey: xiaomiKeyInput.trim() || undefined
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Image generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.imageUrl) {
        throw new Error('No image URL returned from model.');
      }

      setGeneratedImageUrl(data.imageUrl);
      setUsedModel(model);
    } catch (err: any) {
      console.error('Image gen error:', err);
      setError(err.message || 'Image generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset generator for Section 19.1.2 template
  const applyPreset = (topicTitle: string, toolName: string, subText: string) => {
    setHeadline(toolName.toUpperCase());
    setSubBanner(subText);
    setPrompt(
      `Create a YouTube thumbnail using character Waqar Majeed for IT Cafeteria (tagline: Learn • Build • Grow). Follow Section 19.1.2 Universal Template: Dark navy studio backdrop with neon-blue edge glow and vibrant swirling cyan energy-vortex with bright sparkle particles. Hero headline: "${toolName.toUpperCase()}" in bold 3D blue-to-white gradient lettering with heavy drop shadow. Sub-banner: "${subText}" on bright yellow brush-stroke banner. Glowing 3D hologram of ${toolName} features with energetic light accents. Confident presenter pointing to central hologram. Branded mug and laptop on desk. Saturated vibrant wow factor lighting.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-500/20">
                <ImageIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Image & Universal Thumbnail Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Model: <strong className="text-cyan-400 font-mono">xiaomi-mimo-v2.6-pro-free</strong> (supports 1K, 2K & high-fidelity visual polish). Generate or edit IT Cafeteria thumbnails match 19.1.2 Universal Anatomical Template.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 rounded-xl flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Xiaomi Mimo 2.6 Pro
            </span>
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-[11px] font-sans flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Xiaomi / AIHubMix API Key Config"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>{serverStatus?.configured ? 'API Key: Active (Render)' : xiaomiKeyInput ? 'Custom Key: Set' : 'Add API Key'}</span>
            </button>
          </div>
        </div>

        {/* Optional Collapsible Key Input */}
        {showKeyInput && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/60 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                Xiaomi MiMo / AIHubMix API Key Settings
              </span>
              {serverStatus?.configured && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                  ✓ Server Environment Connected ({serverStatus.keySource})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Render.com or GitHub Environment Variables mein <code>XIAOMI_API_KEY</code> save hai to automatically use hogi. Agar aap yahan local key lagana chahte hain to paste karein:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={xiaomiKeyInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setXiaomiKeyInput(val);
                  try {
                    if (val.trim()) localStorage.setItem('itc_xiaomi_api_key', val.trim());
                    else localStorage.removeItem('itc_xiaomi_api_key');
                  } catch {}
                }}
                placeholder="sk-gateway-... ya sk-... (Xiaomi MiMo / AIHubMix Key)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              {xiaomiKeyInput && (
                <button
                  type="button"
                  onClick={() => {
                    setXiaomiKeyInput('');
                    try { localStorage.removeItem('itc_xiaomi_api_key'); } catch {}
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs cursor-pointer"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Section 19.1.2 Fast Presets:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => applyPreset('Storage Sense', 'Storage Sense', 'Auto Clean PC')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
              >
                💻 Windows Storage Sense
              </button>
              <button
                onClick={() => applyPreset('Power Automate Free Setup', 'Power Automate', 'Free Setup')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
              >
                ⚡ Power Automate
              </button>
              <button
                onClick={() => applyPreset('GPT-6 Astra', 'GPT-6 Astra', 'No Code AI')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
              >
                🤖 GPT-6 Astra
              </button>
              <button
                onClick={() => applyPreset('WhatsApp Secrets', 'WhatsApp', '3 Secret Hacks')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
              >
                📱 WhatsApp Secrets
              </button>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Thumbnail & Visual Prompt (Describes Zones 1–13 without numbers):
            </label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe background studio, headline, sub-banner, central hologram, props and lighting..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
              disabled={isLoading}
            />
          </div>

          {/* Optional Image to Edit */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                Optional: Edit or Restyle Existing Image
              </span>
              {base64InputImage && (
                <button
                  onClick={() => { setBase64InputImage(null); setInputImageName(''); }}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Clear Image
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Image to Edit</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={isLoading}
                />
              </label>

              {inputImageName ? (
                <span className="text-xs text-cyan-300 truncate max-w-xs">{inputImageName}</span>
              ) : (
                <span className="text-[11px] text-slate-500">Provide image + prompt to add text or effects</span>
              )}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              >
                <option value="9:16">9:16 (Shorts Cover)</option>
                <option value="16:9">16:9 (YouTube Video)</option>
                <option value="1:1">1:1 (Square Tile)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Resolution</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                disabled={isLoading}
              >
                <option value="1K">1K Standard</option>
                <option value="2K">2K Ultra HD</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Model Engine</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              >
                <option value="xiaomi-mimo-v2.6-pro-free">Xiaomi Mimo 2.6 Pro (HQ)</option>
                <option value="mimo-v2.6-pro">Xiaomi Mimo 2.6 Pro (Flagship)</option>
                <option value="gemini-nano-banana-2.1">Nano Banana 2.1 (Google)</option>
                <option value="gemini-3.1-flash-lite-image">Flash Lite Image (Fast)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating Image with {model}...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Generate High-CTR Thumbnail</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="break-words whitespace-pre-wrap leading-relaxed">{error}</span>
            </div>
          )}
        </div>

        {/* Thumbnail Preview Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Generated Image / Thumbnail Preview:
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {aspectRatio} • {imageSize}
              </span>
            </div>

            <div className={`w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[460px] mx-auto' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
            }`}>
              {generatedImageUrl ? (
                <img 
                  src={generatedImageUrl} 
                  alt="Generated Thumbnail" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-xs">No thumbnail generated yet.</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Choose a preset or enter a prompt to generate studio visuals.
                  </p>
                </div>
              )}
            </div>
          </div>

          {generatedImageUrl && (
            <div className="pt-4 border-t border-slate-800 mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready for YouTube Studio
                </span>
                {usedModel && (
                  <span className="text-[10px] font-mono text-slate-500">Model: {usedModel}</span>
                )}
              </div>
              <a
                href={generatedImageUrl}
                download="it_cafeteria_thumbnail.png"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Image
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
