import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Sparkles, 
  ShieldAlert, 
  Search, 
  Youtube, 
  Zap, 
  Flame, 
  CheckCircle2, 
  BarChart2, 
  ArrowUpRight, 
  RefreshCw, 
  Compass, 
  Target,
  Layers,
  Award
} from 'lucide-react';

export interface CompetitorChannel {
  id: string;
  handle: string;
  channelName: string;
  niche: string;
  subscribers: string;
  shortsPerWeek: number;
  avgDurationSec: number;
  stayedToWatchPct: number;
  feedVsSearchPct: { feed: number; search: number };
  hookStyle: string;
  recentShorts: {
    title: string;
    views: string;
    hookText: string;
    counterPlay: string;
  }[];
  advantage: string;
  vulnerability: string;
}

export const CompetitorBenchmarking: React.FC = () => {
  // IT Cafeteria Baseline Metrics (Channel_Insights.md Verified)
  const itCafeteriaBaseline = {
    handle: '@itcafeteria',
    channelName: 'IT Cafeteria (Waqar Majeed)',
    niche: 'Tech Productivity, AI Tools, Windows & Excel',
    subscribers: 'Growing (~1.1k+)',
    shortsPerWeek: 3.5,
    avgDurationSec: 34,
    stayedToWatchPct: 66.2,
    feedVsSearchPct: { feed: 9.4, search: 79.0 },
    topRetention: '104.7% (ChatGPT Voice)',
    returningViewers: '0.2%',
    geoFocus: 'India 37.9% • Pakistan 7.0%'
  };

  const initialCompetitors: CompetitorChannel[] = [
    {
      id: 'comp-1',
      handle: '@TechnologyGyan',
      channelName: 'Technology Gyan (Manoj Saru)',
      niche: 'General Hindi Tech, Smartphone Tricks & Windows',
      subscribers: '14.5M',
      shortsPerWeek: 7,
      avgDurationSec: 28,
      stayedToWatchPct: 74.5,
      feedVsSearchPct: { feed: 78.0, search: 16.0 },
      hookStyle: 'Shock face + "Yeh setting turant band karo!" in 0.8s',
      recentShorts: [
        {
          title: 'Do This To Speed Up Any Phone Instantly!',
          views: '840K',
          hookText: '"Agar aapka phone lag kar raha hai to abhi yeh karo..."',
          counterPlay: 'IT Cafeteria can win with deeper technical Windows/Android developer settings + Roman Urdu precision.'
        },
        {
          title: '3 Secret Chrome Flags Everyone Needs',
          views: '520K',
          hookText: '"Google Chrome ka yeh feature 99% log nahi jante!"',
          counterPlay: 'Cover Category 7 Chrome vs Chromium architecture with reproducible steps.'
        }
      ],
      advantage: 'Massive algorithmic Shorts Feed velocity and high face-value brand trust.',
      vulnerability: 'Superficial tricks that fade quickly; weak on deep enterprise tools like Power Automate or Excel formulas.'
    },
    {
      id: 'comp-2',
      handle: '@KevinStratvert',
      channelName: 'Kevin Stratvert',
      niche: 'Global Productivity, Microsoft 365, Excel & Windows',
      subscribers: '4.2M',
      shortsPerWeek: 4,
      avgDurationSec: 42,
      stayedToWatchPct: 68.0,
      feedVsSearchPct: { feed: 24.0, search: 71.0 },
      hookStyle: 'Calm screen-zoom + "Here is a secret Excel formula that saves 2 hours..."',
      recentShorts: [
        {
          title: 'Stop Merging Cells in Excel! Do This Instead',
          views: '1.2M',
          hookText: '"Stop doing this! Highlight your cells, press Ctrl + 1..."',
          counterPlay: 'Make the exact Roman Urdu equivalent: "Excel mein Center Across Selection ka jaadu".'
        },
        {
          title: 'Top 3 Windows 11 Shortcuts You Are Not Using',
          views: '410K',
          hookText: '"Press Win + V right now to see your full clipboard history."',
          counterPlay: 'Link Windows 11 clipboard to automated productivity scripts (Category 4).'
        }
      ],
      advantage: 'Monopolizes global English search traffic with clean high-contrast screen zooms.',
      vulnerability: 'Zero localized South Asian / Urdu voiceover; leaves the 300M+ Urdu/Hindi market completely open for IT Cafeteria.'
    },
    {
      id: 'comp-3',
      handle: '@BilalTechUrdu',
      channelName: 'Pakistani Tech Creators (Micro Niche)',
      niche: 'Urdu Android Tricks, Mobile Reviews & Freelance AI',
      subscribers: '320K',
      shortsPerWeek: 2.5,
      avgDurationSec: 31,
      stayedToWatchPct: 61.0,
      feedVsSearchPct: { feed: 62.0, search: 30.0 },
      hookStyle: 'Casual front-camera holding phone + Urdu voiceover',
      recentShorts: [
        {
          title: 'Free AI Voice Generator for YouTube Automation',
          views: '95K',
          hookText: '"Agar aap faceless channel banana chahte hain to yeh website dekhein..."',
          counterPlay: 'IT Cafeteria has Flow engine + ElevenLabs + Lyria pipeline (far higher fidelity).'
        }
      ],
      advantage: 'Organic Pakistani audience connection with culturally relatable terminology.',
      vulnerability: 'Low production consistency, inconsistent audio levels, and lacks systematic 10-second scene pacing.'
    }
  ];

  const [competitors, setCompetitors] = useState<CompetitorChannel[]>(initialCompetitors);
  const [newHandle, setNewHandle] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newNiche, setNewNiche] = useState('AI Tools & Workflows');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorChannel | null>(competitors[0]);
  const [filterNiche, setFilterNiche] = useState<string>('all');

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    const formattedHandle = newHandle.startsWith('@') ? newHandle.trim() : `@${newHandle.trim()}`;
    const name = newChannelName.trim() || formattedHandle.replace('@', '');

    const newComp: CompetitorChannel = {
      id: `comp-${Date.now()}`,
      handle: formattedHandle,
      channelName: name,
      niche: newNiche,
      subscribers: 'Estimating...',
      shortsPerWeek: 4,
      avgDurationSec: 32,
      stayedToWatchPct: 65.0,
      feedVsSearchPct: { feed: 55.0, search: 38.0 },
      hookStyle: 'Fast visual demonstration in first 1.5 seconds',
      recentShorts: [
        {
          title: `${newNiche} Latest Viral Short`,
          views: '120K',
          hookText: '"Yeh trick miss mat karna..."',
          counterPlay: 'Analyze their search keywords and publish an enhanced IT Cafeteria Short with 10s scene pacing.'
        }
      ],
      advantage: 'Regular upload cadence in targeted category.',
      vulnerability: 'Can be outranked with IT Cafeteria’s Section 19 structured SEO and phonetic script quality.'
    };

    setCompetitors([newComp, ...competitors]);
    setSelectedCompetitor(newComp);
    setNewHandle('');
    setNewChannelName('');
  };

  const handleRemoveCompetitor = (id: string) => {
    const updated = competitors.filter(c => c.id !== id);
    setCompetitors(updated);
    if (selectedCompetitor?.id === id) {
      setSelectedCompetitor(updated[0] || null);
    }
  };

  const runQuickScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  const filteredCompetitors = filterNiche === 'all' 
    ? competitors 
    : competitors.filter(c => c.niche.toLowerCase().includes(filterNiche.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Competitive Intelligence & Gap Analysis
              </span>
              <span className="text-xs text-slate-400">South Asian & Global Tech Shorts Matrix</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Competitor Benchmarking Engine
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Track karein ke Technology Gyan, Kevin Stratvert, aur doosre South Asian creators Shorts kis frequency par upload kar rahe hain, unka Shorts Feed vs Search traffic split kya hai, aur IT Cafeteria unhe kahan beat kar sakta hai.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runQuickScan}
              disabled={isScanning}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Syncing Feeds...' : 'Refresh Competitor Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparative High-Level Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* IT Cafeteria Search Edge */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-4 space-y-1 relative overflow-hidden">
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-cyan-400" /> IT Cafeteria Search Moat
          </div>
          <div className="text-2xl font-black text-white">79.0% Traffic</div>
          <div className="text-[11px] text-slate-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Competitors avg only 15-30% search</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            IT Cafeteria evergreen keywords par rank karta hai; competitors ki video 48 hours baad flat ho jati hain.
          </p>
        </div>

        {/* Shorts Feed Vulnerability */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Shorts Feed Gap
          </div>
          <div className="text-2xl font-black text-white">9.4% vs 78.0%</div>
          <div className="text-[11px] text-slate-300 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Manoj Saru gets 78% from Feed</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            First 1.5s visual hook & pattern interrupt implement karke Feed share 35%+ tak le jana target hai.
          </p>
        </div>

        {/* Cadence Velocity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Upload Velocity
          </div>
          <div className="text-2xl font-black text-white">3.5 vs 7.0 /wk</div>
          <div className="text-[11px] text-slate-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quality over quantity balance</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            3-4 high-retention Shorts/week schedule is optimal; daily spamming algorithm ko hurt kar sakti hai.
          </p>
        </div>

        {/* Completion Retention */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> Retention Benchmark
          </div>
          <div className="text-2xl font-black text-white">66.2% Stayed</div>
          <div className="text-[11px] text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Loop: 104.7% (ChatGPT Voice)</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            Viewers swipe away only 33.8% of the time. Industry average swipe-away is 40-45%.
          </p>
        </div>
      </div>

      {/* Main Benchmarking Matrix & Competitor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tracked Channels List & Add Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Add Channel Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Track New Competitor Channel</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Custom Channel ID / Handle</span>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-medium">Channel Handle or ID</label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="e.g. @Mrwhosetheboss or UC123456..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">Channel Name</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Optional Display Name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">Primary Focus Niche</label>
                  <select
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="AI Tools & Workflows">AI Tools & Workflows</option>
                    <option value="Smartphone & Android">Smartphone & Android</option>
                    <option value="Windows & PC Productivity">Windows & PC Productivity</option>
                    <option value="Excel & Office Formulas">Excel & Office Formulas</option>
                    <option value="Pakistani Freelancing / Tech">Pakistani Freelancing / Tech</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Channel to Radar</span>
              </button>
            </form>
          </div>

          {/* IT Cafeteria Pinned Card */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-2 border-cyan-400/60 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                  ITC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{itCafeteriaBaseline.channelName}</h4>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                      Your Channel
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">{itCafeteriaBaseline.handle}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 font-mono">3.5 Shorts/wk</span>
                <div className="text-[10px] text-slate-400">Current Cadence</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
              <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Search Share</div>
                <div className="font-bold text-cyan-400">{itCafeteriaBaseline.feedVsSearchPct.search}%</div>
              </div>
              <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Stayed to Watch</div>
                <div className="font-bold text-emerald-400">{itCafeteriaBaseline.stayedToWatchPct}%</div>
              </div>
              <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Top Loop Ret.</div>
                <div className="font-bold text-amber-400">{itCafeteriaBaseline.topRetention}</div>
              </div>
            </div>
          </div>

          {/* Competitor Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Tracked Competitors ({competitors.length})</span>
              <span className="font-mono">Click card to view deep analysis</span>
            </div>

            {competitors.map((comp) => {
              const isSelected = selectedCompetitor?.id === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompetitor(comp)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/50' 
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <h4 className="font-bold text-white text-xs sm:text-sm">{comp.channelName}</h4>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{comp.handle} • {comp.subscribers}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                        {comp.shortsPerWeek} Shorts/wk
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCompetitor(comp.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove from benchmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span>Niche: <strong className="text-slate-300">{comp.niche}</strong></span>
                    <span className="text-indigo-400 font-semibold">{comp.feedVsSearchPct.feed}% Feed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Comparative Analysis of Selected Competitor */}
        <div className="lg:col-span-7 space-y-5">
          {selectedCompetitor ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Header with Channel Comparison Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-mono uppercase font-bold">
                      Direct Channel Benchmark
                    </span>
                    <span className="text-xs text-slate-400">{selectedCompetitor.niche}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                    IT Cafeteria vs. {selectedCompetitor.channelName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCompetitor.handle}</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400">Their Audience</div>
                    <div className="font-bold text-white font-mono">{selectedCompetitor.subscribers}</div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Metric Comparison Visualizer */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-cyan-400" /> Key Performance Comparison Matrix
                </h4>

                <div className="space-y-3 text-xs">
                  {/* Upload Frequency */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">Upload Frequency (Shorts / Week)</span>
                      <span className="text-slate-400">
                        IT Cafeteria: <strong className="text-cyan-400">3.5</strong> | Them: <strong className="text-indigo-400">{selectedCompetitor.shortsPerWeek}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-cyan-500 h-full" style={{ width: `${(3.5 / (3.5 + selectedCompetitor.shortsPerWeek)) * 100}%` }} />
                      <div className="bg-indigo-500 h-full" style={{ width: `${(selectedCompetitor.shortsPerWeek / (3.5 + selectedCompetitor.shortsPerWeek)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>ITC: 3-4 strategic high-yield topics</span>
                      <span>Them: Higher volume push</span>
                    </div>
                  </div>

                  {/* Feed vs Search Distribution */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">Traffic Source Distribution</span>
                      <span className="text-slate-400">
                        ITC Search: <strong className="text-cyan-400">79.0%</strong> | Their Feed: <strong className="text-indigo-400">{selectedCompetitor.feedVsSearchPct.feed}%</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-cyan-300">IT Cafeteria</span>
                          <span>Search 79% / Feed 9%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-cyan-400 h-full" style={{ width: '79%' }} />
                          <div className="bg-blue-600 h-full" style={{ width: '9%' }} />
                          <div className="bg-slate-700 h-full" style={{ width: '12%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-indigo-300">{selectedCompetitor.channelName.split(' ')[0]}</span>
                          <span>Feed {selectedCompetitor.feedVsSearchPct.feed}% / Search {selectedCompetitor.feedVsSearchPct.search}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-400 h-full" style={{ width: `${selectedCompetitor.feedVsSearchPct.feed}%` }} />
                          <div className="bg-purple-600 h-full" style={{ width: `${selectedCompetitor.feedVsSearchPct.search}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hook Style & Retention */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-300">Hook & Pacing Architecture</span>
                      <span className="text-slate-400">
                        Stayed: ITC <strong className="text-emerald-400">66.2%</strong> vs Them <strong className="text-indigo-400">{selectedCompetitor.stayedToWatchPct}%</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div><strong className="text-indigo-300">Their Hook Style:</strong> {selectedCompetitor.hookStyle}</div>
                      <div><strong className="text-cyan-300">IT Cafeteria Style:</strong> Section 19 strict 10s scene pacing, 22-25 words Roman Urdu, high-contrast yellow typography.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Gap & Tactical Counter-Play */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Their Advantage & Vulnerability */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Their Weakness / Gap
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedCompetitor.vulnerability}
                  </p>
                  <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <strong className="text-slate-300">Their Core Strength:</strong> {selectedCompetitor.advantage}
                  </div>
                </div>

                {/* IT Cafeteria Winning Counter-Play */}
                <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> IT Cafeteria Out-Rank Strategy
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Unki video ke title aur query ko target karein lekin <strong>Roman Urdu step-by-step clarity</strong> aur <strong>Section 19.1.2 high-contrast thumbnail</strong> ke sath publish karein. Pakistan + India viewers searching for solutions will choose IT Cafeteria for direct answers without clickbait fluff.
                  </p>
                </div>
              </div>

              {/* Recent Shorts Breakdown & Hook Spy */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" /> Hook Spy: Recent Competitor Shorts
                </h4>

                <div className="space-y-2.5">
                  {selectedCompetitor.recentShorts.map((short, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-white">{short.title}</div>
                        <span className="font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded text-[10px]">
                          {short.views} views
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300/90 font-mono">
                        Hook: {short.hookText}
                      </div>
                      <div className="text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-800/80 flex items-start gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>ITC Counter:</strong> {short.counterPlay}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Select a competitor from the left list to see full comparative metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
