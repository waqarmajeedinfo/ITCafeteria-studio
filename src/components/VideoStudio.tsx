import React, { useState } from 'react';
import { 
  Video, 
  Film, 
  Play, 
  Upload, 
  Sparkles, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';

export const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'A high-tech cyber studio with dark blue neon lighting and holographic code screens floating in air. The camera slowly pushes in towards the desk.'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [duration, setDuration] = useState<'10s' | '5s'>('10s');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          base64Image: base64Image || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else if (data.videoUri) {
        setVideoUrl(data.videoUri);
      } else {
        throw new Error('Video generation completed, but no playable URL was returned.');
      }
    } catch (err: any) {
      console.error('Video gen error:', err);
      setError(err.message || 'Video generation failed. Please verify paid API key configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-gradient-to-tr from-purple-600 to-blue-500 text-white rounded-xl shadow-lg shadow-purple-500/20">
                <Video className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Gemini Omni Flash Video Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Model: <strong className="text-purple-400 font-mono">gemini-omni-1.1-flash</strong> via Interactions API. Generate high-fidelity text-to-video or animate starting reference photos into 10s video clips in <strong className="text-white">9:16 Shorts</strong> or <strong className="text-white">16:9 Lecture</strong> format.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-purple-950/60 text-purple-300 border border-purple-800/40 rounded-xl">
              Interactions API Native
            </span>
          </div>
        </div>
      </div>

      {/* Generation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Video Motion & Scene Prompt:
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe character motion, camera angle, studio lighting, hologram animations..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
              disabled={isLoading}
            />
          </div>

          {/* Optional Reference Image for Animation */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-cyan-400" />
                Optional: Animate Starting Image into Video
              </span>
              {base64Image && (
                <button
                  onClick={() => { setBase64Image(null); setImageName(''); }}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Remove Image
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Starting Frame</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={isLoading}
                />
              </label>

              {imageName ? (
                <span className="text-xs text-cyan-300 truncate max-w-xs">{imageName}</span>
              ) : (
                <span className="text-[11px] text-slate-500">Attach studio or character photo to animate</span>
              )}
            </div>

            {base64Image && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-slate-700">
                <img src={base64Image} alt="Reference" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Aspect Ratio */}
            <div>
              <label className="text-slate-400 block mb-1">Aspect Ratio (Mandatory Standard)</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              >
                <option value="9:16">9:16 (Shorts / TikTok — IT Cafeteria Default)</option>
                <option value="16:9">16:9 (Landscape — YT Automation Lecture)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-slate-400 block mb-1">Duration (Section 12 Omni Flash)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                disabled={isLoading}
              >
                <option value="10s">10 seconds (Omni Flash Native)</option>
                <option value="5s">5 seconds (Quick Preview)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating with Gemini Omni Flash (May take 30–60s)...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Generate Video with Gemini Omni Flash</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Generation Note:</strong>
                <p className="text-[11px] mt-0.5 break-words whitespace-pre-wrap leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Preview Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Video Output Preview:
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {aspectRatio} • {duration}
              </span>
            </div>

            <div className={`w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[460px] mx-auto' : 'aspect-video'
            }`}>
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <Film className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-xs">No video generated yet.</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Click Generate to dispatch a task to gemini-omni-1.1-flash.
                  </p>
                </div>
              )}
            </div>
          </div>

          {videoUrl && (
            <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready for CapCut Assembly
              </span>
              <a
                href={videoUrl}
                download="it_cafeteria_scene.mp4"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download MP4
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
