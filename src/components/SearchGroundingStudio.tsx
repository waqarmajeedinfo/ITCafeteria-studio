import React, { useState } from 'react';
import { 
  Search, 
  Globe2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export const SearchGroundingStudio: React.FC = () => {
  const [query, setQuery] = useState('What are the latest AI video generator features in 2026 (Runway Gen-3, Pika, Sora) and their free tiers?');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: Array<{ title: string; uri: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (customQ?: string) => {
    const q = customQ || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Search failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Grounding search error:', err);
      setError(err.message || 'Failed to search Google data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-blue-500/20 text-cyan-400 rounded-xl border border-blue-500/30">
                <Globe2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Google Search Grounding Studio (Section 10 Standard)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Authentic primary research powered by <strong className="text-cyan-400 font-mono">gemini-3.8-flash</strong> with live Google Search Grounding. IT Cafeteria ke videos mein ghalat dawe, unverified pricing ya fake news se bachne ke liye live verification tool.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Outlier Checked
            </span>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Research Topic or Claim to Verify:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Latest Windows 11 24H2 shortcuts, Power Automate pricing updates, Gemini 4 Argon features..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Run Grounded Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets for IT Cafeteria */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-500 text-[11px]">Quick Research Topics:</span>
          <button
            onClick={() => handleSearch("Windows 11 new secret shortcuts and power tools 2026")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            💻 Windows 11 Shortcuts
          </button>
          <button
            onClick={() => handleSearch("Free AI video generators 2026 free trial without watermark")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            🎬 Free AI Video Tools (Sec 8)
          </button>
          <button
            onClick={() => handleSearch("Power Automate Desktop web scraping latest tricks 2026")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            ⚡ Power Automate
          </button>
          <button
            onClick={() => handleSearch("Google Flow AI video latest features start frame end frame")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            🎥 Google Flow Updates
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="break-words whitespace-pre-wrap leading-relaxed">{error}</span>
          </div>
        )}

        {/* Grounded Search Result Output */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Grounded Verification Findings:
                </span>
              </div>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Findings
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
              {result.text}
            </div>

            {/* Cited Sources */}
            {result.sources && result.sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Authentic Primary Web Sources Cited:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-cyan-400 rounded-xl text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                      <span className="max-w-xs truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
