import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Radio,
  Play,
  Square,
  Sparkles,
  X,
  Volume2,
  Brain,
  History,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Zap,
  RefreshCw,
  Sliders,
  ChevronRight,
  Flame,
  ShieldCheck,
  Award
} from 'lucide-react';

interface LiveCoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveActive: boolean;
  onToggleLive: (active: boolean) => void;
  elapsedSeconds: number;
}

export const GoLiveCoPilotModal: React.FC<LiveCoPilotModalProps> = ({
  isOpen,
  onClose,
  isLiveActive,
  onToggleLive,
  elapsedSeconds
}) => {
  const [topic, setTopic] = useState('Google AI Studio & Local Autonomous Agents');
  const [liveAdvice, setLiveAdvice] = useState<string>(
    'Waqar Bhai! Live broadcast shuru karein. Pehle 5 seconds mein direct hook dein: "Aapko pata hai Google AI Studio ne bilkul free mein autonomous agent workflows enable kar diye hain?"'
  );
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [autoPacer, setAutoPacer] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'memory' | 'insights'>('live');

  // Memory & Insights state
  const [memoryData, setMemoryData] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCompanionMemory();
    }
  }, [isOpen]);

  const loadCompanionMemory = async () => {
    try {
      const res = await fetch('/api/agent/companion-memory/proactive-guidance');
      const data = await res.json();
      if (data?.ok) {
        setMemoryData(data);
        setHistoryList(data.interactionHistory || []);
      }
    } catch (e) {
      console.error('Failed to load memory for live copilot:', e);
    }
  };

  const handleStartLive = async () => {
    onToggleLive(true);
    try {
      await fetch('/api/agent/copilot/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', currentTopic: topic, elapsedTime: elapsedSeconds })
      });
      loadCompanionMemory();
    } catch (e) {
      console.error('Error starting live session:', e);
    }
  };

  const handleStopLive = async () => {
    onToggleLive(false);
    try {
      await fetch('/api/agent/copilot/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', currentTopic: topic, elapsedTime: elapsedSeconds })
      });
      loadCompanionMemory();
    } catch (e) {
      console.error('Error stopping live session:', e);
    }
  };

  const handleFetchNextPoint = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch('/api/agent/copilot/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insight', currentTopic: topic, elapsedTime: elapsedSeconds })
      });
      const data = await res.json();
      if (data?.ok && data.advice) {
        setLiveAdvice(data.advice);
      }
    } catch (e) {
      console.error('Failed to fetch live advice:', e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[125] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden overscroll-contain text-slate-100 my-auto"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-rose-950/90 via-slate-900 to-purple-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isLiveActive
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-lg shadow-rose-950/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Radio className={`w-5 h-5 ${isLiveActive ? 'animate-pulse text-rose-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">Live Co-Pilot &amp; Adaptive Companion HUD</h3>
                {isLiveActive ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    LIVE ON-AIR ({formatTimer(elapsedSeconds)})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    Standby / Ready
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  IT Cafeteria Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time live streaming co-pilot: Waqar Bhai ko live hooks, talking points aur audience engagement guidance deta hai.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-rose-600/30 text-rose-200 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Teleprompter &amp; Controls</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'insights'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proactive Insights ({memoryData?.proactiveInsights?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'memory'
                  ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Learned Preferences &amp; History</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
            <span>Scroll Rule:</span>
            <span className="text-cyan-400">80vh Contained</span>
          </div>
        </div>

        {/* Scrollable Content Body - Strictly obeys max-height: 80vh & overscroll-behavior: contain */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-modal-scroll" style={{ overscrollBehavior: 'contain' }}>
          {activeTab === 'live' && (
            <div className="space-y-4">
              {/* Primary Live Controller Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Current Live Topic / Stream Theme
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Google AI Studio Agentic Workflows & Gemini API"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Primary Start / Stop Button */}
                  <div className="flex items-center gap-2 sm:self-end">
                    {isLiveActive ? (
                      <button
                        onClick={handleStopLive}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop Live Co-Pilot</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStartLive}
                        className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                      >
                        <Flame className="w-4 h-4 animate-bounce" />
                        <span>Go Live Now</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Session Timer: <strong className="text-white font-mono">{formatTimer(elapsedSeconds)}</strong></span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoPacer}
                      onChange={(e) => setAutoPacer(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span>Auto Pacing Tips Enabled</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Live Co-Pilot Teleprompter & Talking Point Card */}
              <div className="p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    Live Co-Pilot Real-Time Suggestion (Next Talking Point)
                  </span>
                  <button
                    onClick={handleFetchNextPoint}
                    disabled={loadingAdvice}
                    className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingAdvice ? 'animate-spin' : ''}`} />
                    <span>Agla Point Mangwayen</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium leading-relaxed shadow-inner">
                  {liveAdvice}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Hook First:</strong> No intro filler</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Pacing:</strong> 30s per concept</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span><strong>CTA:</strong> Ask for comment</span>
                  </div>
                </div>
              </div>

              {/* Quick Broadcast Hooks Grid */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 text-xs block">
                  One-Click Emergency Live Hooks (Agar topic change karna ho):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setLiveAdvice('Waqar Bhai audience se bolein: "Agar aap AI Studio use kar rahe hain to yeh 3 settings foran enable karein warna aapka model slow response dega!"')}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-slate-300 hover:text-white transition"
                  >
                    <div className="font-semibold text-rose-300 mb-0.5">🔥 Urgency Hook</div>
                    <p className="text-[11px] text-slate-400">"Yeh 3 settings foran on karein warna model slow response dega..."</p>
                  </button>
                  <button
                    onClick={() => setLiveAdvice('Waqar Bhai screen dikha kar bolein: "Chat GPT aur Claude par paise zaya karne se behtar hai yeh free setup follow karein jo $0 mein chalta hai!"')}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-slate-300 hover:text-white transition"
                  >
                    <div className="font-semibold text-emerald-300 mb-0.5">💰 Zero Cost Hook</div>
                    <p className="text-[11px] text-slate-400">"ChatGPT / Claude par paise zaya karne se behtar hai yeh free setup..."</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl text-purple-200 text-xs">
                <strong>Proactive Insights:</strong> Hamara adaptive companion aapki interaction history aur channel trends analyze karke rozana proactive recommendations generate karta hai.
              </div>

              <div className="space-y-3">
                {(memoryData?.proactiveInsights || []).map((ins: any) => (
                  <div key={ins.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-white text-xs">{ins.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        ins.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {ins.priority} Priority
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{ins.insight}</p>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 text-[11px] flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>Recommendation:</strong> {ins.actionableRecommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              {/* Learned Preferences Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Waqar Majeed's Learned Profile &amp; Preferences
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Preferred Language:</span>
                    <strong className="text-white">Pure Roman Urdu (Zero Urdu script in UI)</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">UI Viewport Law:</span>
                    <strong className="text-cyan-300 font-mono">max-height: 80vh (Contained)</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Ground Search Window:</span>
                    <strong className="text-emerald-300">Strict 48 Hours / 10+ Sources</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Security Role Model:</span>
                    <strong className="text-purple-300">Super Admin only quick switch</strong>
                  </div>
                </div>
              </div>

              {/* Interaction History Feed */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Recent Interaction History &amp; Learned Takeaways ({historyList.length})
                </h4>
                <div className="space-y-2">
                  {historyList.map((item: any) => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200">{item.summary}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-purple-300">Learned Takeaway:</strong> {item.learnedTakeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isLiveActive ? 'Live Co-Pilot streaming active' : 'Adaptive Companion Memory in sync with GitHub'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
          >
            Done &amp; Minimize
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
