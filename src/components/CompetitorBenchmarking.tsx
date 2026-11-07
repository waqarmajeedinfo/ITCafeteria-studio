import React, { useState, useEffect } from 'react';
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
  Award,
  FileText,
  Radio,
  Calendar,
  Send,
  X,
  Copy,
  ChevronRight,
  ShieldCheck,
  Cpu
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

  const [activeTab, setActiveTab] = useState<'matrix' | 'surveillance' | 'pipeline'>('matrix');
  const [intelData, setIntelData] = useState<any>(null);
  const [strategyOutput, setStrategyOutput] = useState<{ competitor: string; topic: string; text: string } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [copiedStrategy, setCopiedStrategy] = useState(false);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    try {
      const res = await fetch('/api/agent/competitors');
      const data = await res.json();
      if (data?.ok && data.intelligence) {
        setIntelData(data.intelligence);
      }
    } catch (e) {
      console.error('Failed to load competitor intelligence:', e);
    }
  };

  const runSurveillanceScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/agent/competitors/scan', { method: 'POST' });
      const data = await res.json();
      if (data?.ok && data.intelligence) {
        setIntelData(data.intelligence);
      }
    } catch (e) {
      console.error('Failed to run surveillance scan:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateStrategy = async (competitorName: string, topicName: string) => {
    setGeneratingFor(competitorName);
    try {
      const res = await fetch('/api/agent/competitors/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCompetitor: competitorName, topic: topicName })
      });
      const data = await res.json();
      if (data?.ok && data.strategy) {
        setStrategyOutput({ competitor: competitorName, topic: topicName, text: data.strategy });
      }
    } catch (e) {
      console.error('Failed to generate out-rank strategy:', e);
    } finally {
      setGeneratingFor(null);
    }
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
                <Users className="w-3.5 h-3.5 text-blue-400" /> Chief Competitor Intelligence Agent
              </span>
              <span className="text-xs text-slate-400 font-mono">Daily YouTube Data Surveillance Active</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Competitor Intelligence &amp; Content Strategist Engine
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Track competitor channels using YouTube Data API patterns. Transcripts decode karein, hooks aur pacing gaps identify karein, aur IT Cafeteria ke liye actionable 7-day out-rank pipelines generate karein.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runSurveillanceScan}
              disabled={isScanning}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Surveillance Scanning...' : 'Run 24h Surveillance Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tab Strategist Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Competitive Matrix &amp; Scoreboard</span>
          </button>
          <button
            onClick={() => setActiveTab('surveillance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'surveillance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Surveillance &amp; Transcripts Spy ({intelData?.trackedCompetitors?.length || 3})</span>
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>7-Day Out-Rank Pipeline ({intelData?.sevenDayOutRankPipeline?.length || 7})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>79% Search Moat Active</span>
        </div>
      </div>

      {/* Tab 1: Competitive Matrix & Scoreboard */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
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
                First 1.5s visual hook &amp; pattern interrupt implement karke Feed share 35%+ tak le jana target hai.
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
                        <option value="AI Tools & Workflows">AI Tools &amp; Workflows</option>
                        <option value="Smartphone & Android">Smartphone &amp; Android</option>
                        <option value="Windows & PC Productivity">Windows &amp; PC Productivity</option>
                        <option value="Excel & Office Formulas">Excel &amp; Office Formulas</option>
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
                          <span className="text-slate-300">Hook &amp; Pacing Architecture</span>
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
      )}

      {/* Tab 2: Surveillance & Transcripts Spy */}
      {activeTab === 'surveillance' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Surveillance Ingestion Status Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  Daily YouTube Data API Surveillance Ingestion
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                    24h Automated
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Last Ingested: <span className="text-cyan-300 font-mono">{intelData?.lastSurveillanceScan ? new Date(intelData.lastSurveillanceScan).toLocaleString() : 'Just now'}</span> • Tracked Channels: <strong className="text-white">{intelData?.trackedCompetitors?.length || 3}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={runSurveillanceScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Re-scan Transcripts</span>
            </button>
          </div>

          {/* Competitor Surveillance & Transcript Decoders */}
          <div className="space-y-4">
            {(intelData?.trackedCompetitors || []).map((comp: any) => (
              <div key={comp.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <h4 className="font-bold text-white text-base">{comp.channelName}</h4>
                      <span className="text-xs font-mono text-cyan-400">{comp.handle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {comp.region}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                      Cadence: <strong className="text-cyan-400">{comp.weeklyShortsCadence} Shorts/wk</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                      Pacing: <strong className="text-purple-400">{comp.pacingWordsPerMinute} WPM</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                      Scene Cut: <strong className="text-amber-400">{comp.sceneCutIntervalSec}s</strong>
                    </span>
                  </div>
                </div>

                {/* Grid: Decoded Hook + Transcript Ingestion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Decoded Hook Pattern */}
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Decoded Hook Pattern ({comp.hookDecoded?.durationSec}s)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">First 1.5s Impact</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-300">
                        <strong className="text-indigo-300">Auditory Hook:</strong> {comp.hookDecoded?.auditory}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <strong className="text-cyan-300">Visual Pattern:</strong> {comp.hookDecoded?.visual}
                      </div>
                    </div>
                  </div>

                  {/* Latest Ingested Video & Transcript Snippet */}
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Latest Video Transcript ({comp.latestVideoMetadata?.publishedAge})
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                        {comp.latestVideoMetadata?.views} Views
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                      <div className="font-semibold text-white text-xs truncate">
                        "{comp.latestVideoMetadata?.title}"
                      </div>
                      <div className="text-[11px] text-slate-400 italic line-clamp-2">
                        "{comp.latestVideoMetadata?.transcriptSnippet}"
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vulnerability & Out-Rank Strategy */}
                <div className="p-4 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-300">Identified Vulnerability:</span>
                      <span className="text-slate-300">{comp.latestVideoMetadata?.criticalVulnerability}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-300">IT Cafeteria Out-Rank:</span>
                      <span className="text-slate-200 font-semibold">{comp.outRankStrategy?.itCafeteriaTitle}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateStrategy(comp.channelName, comp.latestVideoMetadata?.title)}
                    disabled={generatingFor === comp.channelName}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingFor === comp.channelName ? 'Generating...' : 'Generate Counter Script'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: 7-Day Out-Rank Content Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                7-Day High-Retention Out-Rank Strategy Pipeline
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Competitors ki high-volume topics ko direct target karke unhe Roman Urdu quality, developer truth aur 10-scene pacing ke sath out-rank karein.
              </p>
            </div>
            <div className="text-right font-mono text-xs hidden sm:block">
              <span className="text-emerald-400 font-bold">100% Tailored for IT Cafeteria</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(intelData?.sevenDayOutRankPipeline || []).map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg hover:border-slate-700 transition">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                    {item.day}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Vs: <strong className="text-indigo-300">{item.targetCompetitor}</strong>
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-white text-sm leading-snug">{item.title}</h5>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    Target Query: "{item.targetSearchTerm}"
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-amber-400 block font-semibold">3-Second Hook:</span>
                  <p className="text-slate-200 text-xs italic">"{item.hook3Sec}"</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Retention Target: <strong className="text-emerald-400 font-mono">{item.estimatedRetentionTarget}</strong>
                  </span>
                  <button
                    onClick={() => handleGenerateStrategy(item.targetCompetitor, item.title)}
                    disabled={generatingFor === item.targetCompetitor}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate 10-Scene Plan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Strategy Output Modal - Adheres strictly to max-height 80vh & overscroll-behavior contain */}
      {strategyOutput && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden overscroll-contain text-slate-100 my-auto"
            style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
          >
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Out-Rank Strategy &amp; Counter-Play Script</h3>
                  <p className="text-xs text-slate-400">
                    Target: <strong className="text-indigo-300">{strategyOutput.competitor}</strong> • Topic: <span className="text-cyan-300 font-mono">{strategyOutput.topic}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStrategyOutput(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-modal-scroll" style={{ overscrollBehavior: 'contain' }}>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium shadow-inner">
                {strategyOutput.text}
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Is plan ko direct Google Flow Engine ya Video Studio mein paste karke 10-scene short render kar sakte hain.</span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(strategyOutput.text);
                  setCopiedStrategy(true);
                  setTimeout(() => setCopiedStrategy(false), 3000);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedStrategy ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStrategy ? 'Copied to Clipboard!' : 'Copy Script Plan'}</span>
              </button>

              <button
                onClick={() => setStrategyOutput(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
              >
                Done &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
