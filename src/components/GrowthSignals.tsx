import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Flame, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  Compass, 
  Radio, 
  Eye, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  Target
} from 'lucide-react';

interface GrowthSignal {
  id: string;
  type: 'viral_trigger' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  metric: string;
  severity: 'high' | 'medium' | 'positive';
  impact: string;
  evidence: string;
  recommendedAction: string;
}

export const GrowthSignals: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [selectedHookType, setSelectedHookType] = useState<string>('Contrarian Warning');
  const [selectedDuration, setSelectedDuration] = useState<number>(75);
  const [selectedCategory, setSelectedCategory] = useState<string>('PC & Windows Hacks');
  const [hasVisualInterrupt, setHasVisualInterrupt] = useState<boolean>(true);
  const [hasLoopEnding, setHasLoopEnding] = useState<boolean>(true);

  const signals: GrowthSignal[] = [
    {
      id: 'sig-1',
      type: 'viral_trigger',
      title: '104.7% Retention Loop Anomaly Detected',
      metric: 'ChatGPT Voice Mode (1:06s) -> 104.7% Avg View %',
      severity: 'positive',
      impact: 'Triggers Shorts Feed algorithm multiplier; viewer watched full video and replayed the opening hook',
      evidence: 'Video #28 produced 107 views with 1:06 duration, beating the channel 0:34 baseline by +94% in watch length.',
      recommendedAction: 'Apply the same seamless loop structure (Section 18) to all Category 4 and Category 2 stories: final line must resolve directly into Scene 1 opening phrase without a seam.'
    },
    {
      id: 'sig-2',
      type: 'opportunity',
      title: 'Dual-Platform Search Surge: Power Automate Workflows',
      metric: '137 Views on YT (#1) + 27.8% Top Search Share on TikTok',
      severity: 'positive',
      impact: 'Strongest organic demand signal across both platforms simultaneously',
      evidence: 'TikTok analytics showed 3 out of 5 top queries ("power automate using api help", "web scraping with search result limitation", "power automate workflows") are concentrated on this tool.',
      recommendedAction: 'Produce Episode 8 of Power Automate Desktop focusing specifically on "No-Code Web Scraping & Excel Export" to capture high-intent searchers.'
    },
    {
      id: 'sig-3',
      type: 'anomaly',
      title: 'Cross-Border Retention Gap: Pakistan (0:49) vs India (0:32)',
      metric: 'Pakistan viewers watch +53% longer per view',
      severity: 'medium',
      impact: 'India represents 37.9% of views (684) but drops off at 32s, limiting total audience retention score',
      evidence: 'Studio Geography report reveals Indian audience drops at the 30-second mark (where technical details begin), while Pakistani audience stays through the full demonstration.',
      recommendedAction: 'Insert a visual pattern interrupt at 0:25s (Scene 3) — e.g. a bold text contrast badge or sound accent — to sustain Indian viewer attention past the 35s cliff.'
    },
    {
      id: 'sig-4',
      type: 'warning',
      title: 'Returning Audience Deficit Anomaly (0.2% vs 97.2% New)',
      metric: 'Only ~1-2 recurring viewers out of 575 monthly active audience',
      severity: 'high',
      impact: 'Severe subscriber leak: viewers consume videos as single-use search answers rather than channel fandom',
      evidence: 'New viewers are 97.2%, casual 2.6%, regular 0.2%. Channel views are vulnerable to sudden search keyword fluctuations.',
      recommendedAction: 'Switch final CTAs from generic "follow" to next-episode episodic teasers (e.g. "Kal shaam 6 baje iska part 2 aayega, abhi save karein aur notification ON karein!").'
    },
    {
      id: 'sig-5',
      type: 'anomaly',
      title: 'Upload Cadence Momentum Drop (Oct 5–13 Dip)',
      metric: 'Daily views dropped from ~150 to ~18 during 7-day upload pause',
      severity: 'medium',
      impact: 'YouTube Shorts algorithm deprioritizes channel distribution when daily schedule halts',
      evidence: 'Studio chart shows views rebounded to ~90 immediately upon uploading Gemini Notebook (Oct 16) and Google Flow (Oct 18).',
      recommendedAction: 'Commit to 1 scheduled upload daily at fixed 6:00 PM PKT using YouTube Studio Schedule feature.'
    }
  ];

  // Simulator Calculator: Viral Feed Potential Score
  const calculateViralScore = () => {
    let score = 50;
    if (hasVisualInterrupt) score += 20; // Cuts swipe-away
    if (hasLoopEnding) score += 15; // Drives >100% loop retention
    if (selectedDuration >= 60 && selectedDuration <= 95) score += 10; // Sweet spot
    if (selectedHookType === 'Contrarian Warning' || selectedHookType === 'Mistake') score += 5;
    return Math.min(score, 98);
  };

  const viralScore = calculateViralScore();

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Viral Signal Engine
              </span>
              <span className="text-xs text-slate-400">Pattern Recognition & Anomaly Radar</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              IT Cafeteria Growth Signals & Viral Triggers
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Recent 28-day analytics data se extract kiye gaye ahem patterns jo flag karte hain ke algorithm kab video ko boost deta hai aur kin anomalies ko foran fix karna zaroori hai.
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-center shrink-0">
            <div className="text-[11px] text-slate-400 font-mono">Channel Viral Readiness</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">76 / 100</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Search: Strong • Feed: Primed
            </div>
          </div>
        </div>
      </div>

      {/* Autopilot Coordination Action Banner */}
      {onNavigateTab && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">Autopilot Mode Ready</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">5 Signals Mapped</span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                In anomalies aur viral triggers ko khud-kar sequence mein execute karein: script, flow prompt aur calendar slot khud banayein.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('autopilot')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all shrink-0 cursor-pointer"
          >
            Launch Autopilot Manager <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Flagged Signals & Anomalies Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            Detected Performance Signals & Anomalies (5 Active Flags)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Cross-Platform YouTube & TikTok Data</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {signals.map((sig) => (
            <div 
              key={sig.id}
              className={`p-5 rounded-2xl border transition-all ${
                sig.severity === 'positive' 
                  ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/50' 
                  : sig.severity === 'high'
                  ? 'bg-slate-900/90 border-rose-500/30 hover:border-rose-500/50'
                  : 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    sig.severity === 'positive' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : sig.severity === 'high'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {sig.severity === 'positive' ? (
                      <Flame className="w-4 h-4" />
                    ) : sig.severity === 'high' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base tracking-tight">{sig.title}</h4>
                    <span className="text-xs font-mono text-cyan-300">{sig.metric}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  sig.severity === 'positive'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                    : sig.severity === 'high'
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                }`}>
                  {sig.severity === 'positive' ? '🚀 Viral Multiplier' : sig.severity === 'high' ? '⚠️ Critical Anomaly' : '⚡ Growth Pattern'}
                </span>
              </div>

              {/* Grid breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Algorithmic Impact & Real Evidence:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{sig.impact}</p>
                  <p className="text-[11px] text-slate-400 pt-1 italic">{sig.evidence}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prescribed Agent / Production Action:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">{sig.recommendedAction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Viral Potential Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Pre-Upload Viral Trigger Simulator</h3>
            </div>
            <p className="text-xs text-slate-400">
              Check how planned parameters impact your Shorts Feed retention and swipe-away protection
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Estimated Viral Probability:</span>
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20">
              {viralScore}%
            </div>
          </div>
        </div>

        {/* Simulator Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1.5 font-medium">Hook Formula (Scene 1)</label>
            <select
              value={selectedHookType}
              onChange={(e) => setSelectedHookType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Contrarian Warning">Contrarian Warning (Highest retention)</option>
              <option value="Mistake">Mistake / Frustration Pain</option>
              <option value="Reveal">Secret Reveal</option>
              <option value="Clock">Clock / Time Saver</option>
              <option value="Comparison">Old vs New Comparison</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1.5 font-medium">Video Duration Band</label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value={70}>70–80s (High-Pace Short)</option>
              <option value={100}>100s (Standard 10-Scene Short)</option>
              <option value={120}>120s (Extended 12-Scene)</option>
              <option value={45}>45s (Sub-60s Short)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1.5 font-medium">Visual Pattern Interrupt</label>
            <button
              onClick={() => setHasVisualInterrupt(!hasVisualInterrupt)}
              className={`w-full py-2 px-3 rounded-xl border text-left transition-colors flex items-center justify-between ${
                hasVisualInterrupt 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 font-medium' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>{hasVisualInterrupt ? '✓ First 1.5s Shock Active' : 'No Visual Shock'}</span>
              <span className="text-[10px] font-mono">{hasVisualInterrupt ? '+20%' : '0%'}</span>
            </button>
          </div>

          <div>
            <label className="text-slate-300 block mb-1.5 font-medium">Seamless Replay Loop</label>
            <button
              onClick={() => setHasLoopEnding(!hasLoopEnding)}
              className={`w-full py-2 px-3 rounded-xl border text-left transition-colors flex items-center justify-between ${
                hasLoopEnding 
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 font-medium' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span>{hasLoopEnding ? '✓ Infinite Loop Ending' : 'Hard Cut CTA'}</span>
              <span className="text-[10px] font-mono">{hasLoopEnding ? '+15%' : '0%'}</span>
            </button>
          </div>
        </div>

        {/* Simulator Verdict Card */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Algorithm Distribution Projection:
            </span>
            <p className="text-slate-300">
              {viralScore > 80 
                ? 'High Feed Probability: Video meets the 75%+ retention and sub-25% swipe-away criteria needed for YouTube Shorts Feed algorithmic explosion.'
                : 'Search Bias: Video will perform well on YouTube Search, but may face higher swipe rates on Shorts Feed without the early visual interrupt.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono">
              Projected Swiped-Away Rate: <strong className="text-cyan-300 font-bold">{Math.max(18, 45 - Math.round(viralScore * 0.3))}%</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
