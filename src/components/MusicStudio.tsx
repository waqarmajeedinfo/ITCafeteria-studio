import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Play, 
  Download, 
  Volume2, 
  AlertCircle, 
  CheckCircle2, 
  Radio 
} from 'lucide-react';

export const MusicStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'A punchy modern electronic tech background track for YouTube Shorts with energetic synth arpeggios, subtle bass drops and snappy drums.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      title: "⚡ Tech Shorts High-Energy Beat",
      desc: "Fast, punchy, snappy drums with modern electronic synth hooks",
      prompt: "A punchy modern electronic tech background track for YouTube Shorts with energetic synth arpeggios, subtle bass drops and snappy drums."
    },
    {
      title: "🌌 Cyber Ambient Curiosity",
      desc: "Atmospheric, intriguing cyber soundscape for tech reveal moments",
      prompt: "Atmospheric technological ambient soundscape with gentle futuristic pulses, curious chords, and subtle glitched percussion."
    },
    {
      title: "🚀 Fast Tutorial Walkthrough",
      desc: "Upbeat, motivational, driving rhythm keeping viewers focused",
      prompt: "An upbeat, motivational Lo-Fi tech instrumental with crisp beat, warm rhodes piano and gentle driving bassline for software tutorial."
    }
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const p = customPrompt || prompt;
    if (!p.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Music generation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        throw new Error('No audio data returned from Lyria model.');
      }
    } catch (err: any) {
      console.error('Music gen error:', err);
      setError(err.message || 'Music generation failed. Check API key settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-gradient-to-tr from-pink-600 to-rose-500 text-white rounded-xl shadow-lg shadow-pink-500/20">
                <Music className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Music & Background Beats Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Model: <strong className="text-pink-400 font-mono">lyria-3-clip-preview</strong>. Generate custom, copyright-free tech background music and jingles for IT Cafeteria Shorts and lecture videos.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-pink-950/60 text-pink-300 border border-pink-800/40 rounded-xl">
              Lyria 3 Clip
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {/* Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Background Style Presets for Tech Content:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((pre, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(pre.prompt);
                    handleGenerate(pre.prompt);
                  }}
                  className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-left transition-colors space-y-1 cursor-pointer"
                >
                  <div className="font-semibold text-white text-xs">{pre.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{pre.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Music Track Description & Instrument Directives:
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 30-second energetic tech beat with synth arpeggio and punchy kick drum..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating 30s Audio with Lyria...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Generate Royalty-Free Background Audio</span>
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

        {/* Player Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
              Generated Audio Track:
            </span>

            <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Music className="w-8 h-8" />
              </div>

              {audioUrl ? (
                <div className="w-full space-y-3">
                  <audio src={audioUrl} controls autoPlay className="w-full" />
                  <p className="text-center text-[11px] text-emerald-400 font-medium">
                    ✓ Clean 30s Audio Rendered (WAV 44.1kHz)
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-1 text-slate-500">
                  <p className="text-xs">No audio clip generated yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Click a preset or generate to compose a track.
                  </p>
                </div>
              )}
            </div>
          </div>

          {audioUrl && (
            <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Copyright-free output</span>
              <a
                href={audioUrl}
                download="it_cafeteria_bgm.wav"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Audio
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
