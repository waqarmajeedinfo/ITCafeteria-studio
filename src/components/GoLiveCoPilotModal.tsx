import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Radio,
  Play,
  Square,
  Sparkles,
  X,
  Volume2,
  VolumeX,
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
  Award,
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Target,
  FileText,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Repeat
} from 'lucide-react';

interface LiveCoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveActive: boolean;
  onToggleLive: (active: boolean) => void;
  elapsedSeconds: number;
}

interface DialogueMessage {
  id: string;
  sender: 'host' | 'copilot';
  text: string;
  timestamp: string;
}

export interface VoiceActionRecord {
  id: string;
  command: string;
  intent: 'hook_request' | 'competitor_spy' | 'pacing_check' | 'outrank_plan' | 'emergency_hook' | 'general_query';
  intentLabel: string;
  summary: string;
  responseSnippet: string;
  timestamp: string;
  status: 'executed' | 'processing' | 'failed';
  source: 'mic_voice' | 'quick_action' | 'direct_prompt';
}

const DEFAULT_VOICE_ACTIONS: VoiceActionRecord[] = [
  {
    id: 'va-1',
    command: 'Generate high-urgency hook for Google AI Studio workflows',
    intent: 'hook_request',
    intentLabel: 'Urgent Hook',
    summary: 'Generated 1.2s zero-filler hook targeting creator productivity',
    responseSnippet: 'Agar aap AI Studio use kar rahe hain to yeh 3 settings foran enable karein...',
    timestamp: '15:39:12',
    status: 'executed',
    source: 'mic_voice'
  },
  {
    id: 'va-2',
    command: 'Spy competitor transcripts for Manoj Saru mobile heating video',
    intent: 'competitor_spy',
    intentLabel: 'Competitor Spy',
    summary: 'Decoded 165 WPM cadence & 2.5s scene cuts; identified desktop gap',
    responseSnippet: 'Manoj Saru fast pacing use karta hai lekin deep coding workflows missing hain.',
    timestamp: '15:35:40',
    status: 'executed',
    source: 'mic_voice'
  },
  {
    id: 'va-3',
    command: 'Check Kevin Stratvert Windows 11 secret features video',
    intent: 'competitor_spy',
    intentLabel: 'Competitor Spy',
    summary: 'Analyzed English walkthrough gap for South Asian audience',
    responseSnippet: 'Kevin English me walkthrough deta hai; Roman Urdu local explanation se out-rank karein.',
    timestamp: '15:31:05',
    status: 'executed',
    source: 'mic_voice'
  },
  {
    id: 'va-4',
    command: 'Audience retention pacing adjustment for 30s mark',
    intent: 'pacing_check',
    intentLabel: 'Pacing Check',
    summary: 'Injected 30s micro-CTA to prevent drop-off',
    responseSnippet: 'Agla point 30 seconds me cover karein aur foran comment karne ka bolein.',
    timestamp: '15:26:18',
    status: 'executed',
    source: 'mic_voice'
  },
  {
    id: 'va-5',
    command: '7-Day out-rank pipeline execution for AI Studio Agents',
    intent: 'outrank_plan',
    intentLabel: 'Out-Rank Plan',
    summary: 'Validated Monday-to-Sunday content calendar with 84% retention target',
    responseSnippet: 'Schedule confirmed: Monday autonomous agents, Tuesday Windows hacks counter-play.',
    timestamp: '15:20:50',
    status: 'executed',
    source: 'quick_action'
  }
];

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
  const [activeTab, setActiveTab] = useState<'live' | 'dialogue' | 'insights' | 'memory'>('live');

  // Voice Action Feed Overlay State
  const [showVoiceActionOverlay, setShowVoiceActionOverlay] = useState<boolean>(true);
  const [isOverlayExpanded, setIsOverlayExpanded] = useState<boolean>(true);
  const [voiceActions, setVoiceActions] = useState<VoiceActionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('itc_voice_action_feed');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
      }
    } catch {}
    return DEFAULT_VOICE_ACTIONS;
  });

  // Continuous Hands-Free Voice Dialogue State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [liveHostInput, setLiveHostInput] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [dialogueHistory, setDialogueHistory] = useState<DialogueMessage[]>([
    {
      id: 'init-1',
      sender: 'copilot',
      text: 'Salam Waqar Bhai! Main IT Cafeteria ka Chief Competitor Intelligence aur Co-Pilot Agent hoon. Main continuous live session ke liye active hoon. Aap mic on karke mujhse live baat kar sakte hain bina kisi reset ke!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Memory & Insights state
  const [memoryData, setMemoryData] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompanionMemory();
    } else {
      stopVoiceRecognition();
    }
  }, [isOpen]);

  useEffect(() => {
    shouldListenRef.current = isVoiceListening;
  }, [isVoiceListening]);

  useEffect(() => {
    if (dialogueEndRef.current) {
      dialogueEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueHistory]);

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

  // Intent classification for Voice Action Feed
  const determineVoiceIntent = (cmd: string): { intent: VoiceActionRecord['intent']; intentLabel: string; summary: string } => {
    const lower = cmd.toLowerCase();
    if (lower.includes('hook') || lower.includes('opening') || lower.includes('shuru')) {
      return { intent: 'hook_request', intentLabel: 'Urgent Hook', summary: 'Generated high-impact retention hook with zero filler' };
    }
    if (lower.includes('competitor') || lower.includes('manoj') || lower.includes('kevin') || lower.includes('spy') || lower.includes('transcript')) {
      return { intent: 'competitor_spy', intentLabel: 'Competitor Spy', summary: 'Surveillance scan decoded competitor transcripts & gaps' };
    }
    if (lower.includes('pace') || lower.includes('pacing') || lower.includes('speed') || lower.includes('wpm') || lower.includes('retention') || lower.includes('cadence')) {
      return { intent: 'pacing_check', intentLabel: 'Pacing Check', summary: 'Recalibrated speech cadence & retention interval' };
    }
    if (lower.includes('outrank') || lower.includes('strategy') || lower.includes('pipeline') || lower.includes('plan')) {
      return { intent: 'outrank_plan', intentLabel: 'Out-Rank Plan', summary: 'Formulated content strategy counter-play' };
    }
    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('zero cost') || lower.includes('setting')) {
      return { intent: 'emergency_hook', intentLabel: 'Emergency Hook', summary: 'Switched broadcast hook to emergency high-engagement topic' };
    }
    return {
      intent: 'general_query',
      intentLabel: 'Live Query',
      summary: `Executed live voice instruction: "${cmd.slice(0, 40)}${cmd.length > 40 ? '...' : ''}"`
    };
  };

  // Record into Voice Action Feed (Strict 5 items)
  const recordVoiceAction = (
    cmd: string,
    adviceSnippet: string,
    src: 'mic_voice' | 'quick_action' | 'direct_prompt' = 'mic_voice'
  ) => {
    const { intent, intentLabel, summary } = determineVoiceIntent(cmd);
    const newAction: VoiceActionRecord = {
      id: `va-${Date.now()}`,
      command: cmd,
      intent,
      intentLabel,
      summary,
      responseSnippet: adviceSnippet || 'Instruction executed successfully by Chief Strategist Co-Pilot.',
      timestamp: new Date().toLocaleTimeString(),
      status: 'executed',
      source: src
    };

    setVoiceActions(prev => {
      const updated = [newAction, ...prev.filter(a => a.id !== newAction.id)].slice(0, 5);
      try {
        localStorage.setItem('itc_voice_action_feed', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Text-To-Speech Output for Co-Pilot
  const speakText = (text: string) => {
    if (isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Closest native accent cadence to Roman Urdu / Hindi
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeechStatus('speaking');
      utterance.onend = () => {
        if (shouldListenRef.current) {
          setSpeechStatus('listening');
        } else {
          setSpeechStatus('idle');
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  // Continuous Hands-Free Speech Recognition Loop
  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Aapka browser Speech Recognition support nahi karta. Chrome ya Edge use karein.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        shouldListenRef.current = true;
        setSpeechStatus('listening');
      };

      recognition.onresult = async (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim();
        if (transcript) {
          await handleSendHostPrompt(transcript, 'mic_voice');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setIsVoiceListening(false);
          shouldListenRef.current = false;
          setSpeechStatus('idle');
        }
      };

      recognition.onend = () => {
        // Auto-reconnect voice loop if still marked active (stateful, no reset)
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn('Recognition restart caught:', e);
          }
        } else {
          setIsVoiceListening(false);
          setSpeechStatus('idle');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  };

  const stopVoiceRecognition = () => {
    shouldListenRef.current = false;
    setIsVoiceListening(false);
    setSpeechStatus('idle');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleVoiceDialogue = () => {
    if (isVoiceListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  // Immediate Execution of Host Prompt (Live Query to Chief Competitor Intelligence Agent)
  const handleSendHostPrompt = async (
    promptToSend?: string,
    source: 'mic_voice' | 'quick_action' | 'direct_prompt' = 'direct_prompt'
  ) => {
    const query = (promptToSend || liveHostInput).trim();
    if (!query) return;

    const userMsg: DialogueMessage = {
      id: `usr-${Date.now()}`,
      sender: 'host',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setDialogueHistory(prev => [...prev, userMsg]);
    setLiveHostInput('');
    setLoadingAdvice(true);
    setSpeechStatus('processing');

    try {
      const res = await fetch('/api/agent/copilot/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insight',
          currentTopic: topic,
          elapsedTime: elapsedSeconds,
          userPrompt: query
        })
      });

      const data = await res.json();
      if (data?.ok && data.advice) {
        setLiveAdvice(data.advice);
        const copilotMsg: DialogueMessage = {
          id: `bot-${Date.now()}`,
          sender: 'copilot',
          text: data.advice,
          timestamp: new Date().toLocaleTimeString()
        };
        setDialogueHistory(prev => [...prev, copilotMsg]);
        speakText(data.advice);

        // Record in the real-time Voice Action Feed overlay (Strict last 5 commands)
        recordVoiceAction(query, data.advice, source);
      }
      loadCompanionMemory();
    } catch (e) {
      console.error('Failed to dispatch host prompt:', e);
    } finally {
      setLoadingAdvice(false);
      if (shouldListenRef.current && speechStatus !== 'speaking') {
        setSpeechStatus('listening');
      }
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
      recordVoiceAction('Start Live Broadcast Session', `Live stream initiated on: ${topic}`, 'quick_action');
    } catch (e) {
      console.error('Error starting live session:', e);
    }
  };

  const handleStopLive = async () => {
    onToggleLive(false);
    stopVoiceRecognition();
    try {
      await fetch('/api/agent/copilot/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', currentTopic: topic, elapsedTime: elapsedSeconds })
      });
      loadCompanionMemory();
      recordVoiceAction('Stop Live Broadcast Session', `Live session concluded after ${formatTimer(elapsedSeconds)}`, 'quick_action');
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
        speakText(data.advice);
        recordVoiceAction(`Request Next Live Point for "${topic}"`, data.advice, 'quick_action');
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

  const getIntentBadgeStyle = (intent: VoiceActionRecord['intent']) => {
    switch (intent) {
      case 'hook_request':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'competitor_spy':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'pacing_check':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'outrank_plan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'emergency_hook':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
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
                <h3 className="font-bold text-white text-base">Chief Competitor Intelligence &amp; Live Co-Pilot</h3>
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
                {isVoiceListening && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                    <Mic className="w-3 h-3 text-emerald-400" />
                    Voice Loop Active
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  IT Cafeteria Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time voice dialogue, competitor surveillance decoding, pacing triggers aur out-rank strategy engine.
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
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-rose-600/30 text-rose-200 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Teleprompter</span>
            </button>
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'dialogue'
                  ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Voice Dialogue Loop ({dialogueHistory.length})</span>
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
              <span>Learned Memory</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Action Feed Overlay Toggle Button */}
            <button
              onClick={() => setShowVoiceActionOverlay(!showVoiceActionOverlay)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                showVoiceActionOverlay
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Voice Action Feed Overlay"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Action Feed ({voiceActions.length})</span>
            </button>

            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                isVoiceMuted
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
              title={isVoiceMuted ? 'Unmute voice readout' : 'Mute voice readout'}
            >
              {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isVoiceMuted ? 'TTS Muted' : 'TTS Voice On'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body - Strictly obeys max-height: 80vh & overscroll-behavior: contain */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-modal-scroll" style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}>
          {activeTab === 'live' && (
            <div className="space-y-4">
              {/* REAL-TIME VOICE ACTION FEED OVERLAY (LAST 5 COMMANDS) */}
              {showVoiceActionOverlay && (
                <div className="bg-slate-950/95 border-2 border-amber-500/40 rounded-xl p-3.5 shadow-xl space-y-3 relative overflow-hidden backdrop-blur-sm transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                        <Activity className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xs tracking-wide">
                            Real-Time Voice Action Feed
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Last 5 Commands
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Live session me bole gaye aakhri 5 voice commands ka execution status aur summary record.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsOverlayExpanded(!isOverlayExpanded)}
                        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition"
                        title={isOverlayExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isOverlayExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setShowVoiceActionOverlay(false)}
                        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs transition"
                        title="Close overlay"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Feed Items (Last 5 commands) */}
                  {isOverlayExpanded && (
                    <div className="space-y-2">
                      {voiceActions.slice(0, 5).map((action, idx) => (
                        <div
                          key={action.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            idx === 0
                              ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/50 shadow-md shadow-amber-950/30'
                              : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                                #{idx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getIntentBadgeStyle(action.intent)}`}>
                                {action.intentLabel}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-200">
                                "{action.command}"
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                {action.status}
                              </span>
                              <span>{action.timestamp}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300">
                              <span className="text-amber-400 font-bold block mb-0.5">Execution Summary:</span>
                              <p className="line-clamp-2">{action.summary}</p>
                            </div>
                            <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300 flex flex-col justify-between">
                              <div>
                                <span className="text-cyan-400 font-bold block mb-0.5">Result Takeaway:</span>
                                <p className="line-clamp-2 text-slate-400">{action.responseSnippet}</p>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 mt-1 pt-1 border-t border-slate-900">
                                <button
                                  onClick={() => speakText(action.responseSnippet)}
                                  className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-800/60 transition cursor-pointer"
                                  title="Speak response snippet"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Speak</span>
                                </button>
                                <button
                                  onClick={() => handleSendHostPrompt(action.command, 'quick_action')}
                                  className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/60 transition cursor-pointer"
                                  title="Re-execute this command"
                                >
                                  <Repeat className="w-3 h-3" />
                                  <span>Re-run</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Quick Voice Simulation Buttons for Waqar Bhai */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 flex-wrap gap-2">
                        <span>Quick Voice Actions to test feed:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSendHostPrompt('Give me a 1.5s emergency hook for this stream', 'quick_action')}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[10px] transition cursor-pointer"
                          >
                            + Hook Action
                          </button>
                          <button
                            onClick={() => handleSendHostPrompt('Spy competitor pacing for Kevin Stratvert', 'quick_action')}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 text-[10px] transition cursor-pointer"
                          >
                            + Competitor Action
                          </button>
                          <button
                            onClick={() => handleSendHostPrompt('Adjust audience retention pacing now', 'quick_action')}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-[10px] transition cursor-pointer"
                          >
                            + Pacing Action
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

                  {/* Primary Start / Stop Button & Hands-Free Mic Toggle */}
                  <div className="flex items-center gap-2 sm:self-end">
                    <button
                      onClick={toggleVoiceDialogue}
                      className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 border transition cursor-pointer ${
                        isVoiceListening
                          ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 shadow-lg shadow-emerald-950/40 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title={isVoiceListening ? 'Stop continuous listening' : 'Start hands-free voice dialogue'}
                    >
                      {isVoiceListening ? (
                        <>
                          <Mic className="w-4 h-4 text-emerald-400 animate-spin" />
                          <span>Listening Live...</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="w-4 h-4 text-slate-400" />
                          <span>Enable Mic Voice Loop</span>
                        </>
                      )}
                    </button>

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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakText(liveAdvice)}
                      className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Speak advice out loud"
                    >
                      <Volume2 className="w-3 h-3 text-purple-300" />
                      <span>Sunye</span>
                    </button>
                    <button
                      onClick={handleFetchNextPoint}
                      disabled={loadingAdvice}
                      className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingAdvice ? 'animate-spin' : ''}`} />
                      <span>Agla Point Mangwayen</span>
                    </button>
                  </div>
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

              {/* Live Direct Query / Command Input */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-slate-300 text-xs block flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  Live Host Prompt / Direct Query to Co-Pilot:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={liveHostInput}
                    onChange={(e) => setLiveHostInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendHostPrompt()}
                    placeholder="Waqar Bhai: Co-pilot se poochiye (e.g. 'Competitors ka retention hook kya tha?' ya 'Agla punch point do')..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleSendHostPrompt()}
                    disabled={loadingAdvice || !liveHostInput.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>

              {/* Quick Broadcast Hooks Grid */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 text-xs block">
                  One-Click Emergency Live Hooks (Agar topic change karna ho):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      const txt = 'Waqar Bhai audience se bolein: "Agar aap AI Studio use kar rahe hain to yeh 3 settings foran enable karein warna aapka model slow response dega!"';
                      setLiveAdvice(txt);
                      speakText(txt);
                      recordVoiceAction('Switch to Urgency 3-Settings Hook', txt, 'quick_action');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <div className="font-semibold text-rose-300 mb-0.5">🔥 Urgency Hook</div>
                    <p className="text-[11px] text-slate-400">"Yeh 3 settings foran on karein warna model slow response dega..."</p>
                  </button>
                  <button
                    onClick={() => {
                      const txt = 'Waqar Bhai screen dikha kar bolein: "Chat GPT aur Claude par paise zaya karne se behtar hai yeh free setup follow karein jo $0 mein chalta hai!"';
                      setLiveAdvice(txt);
                      speakText(txt);
                      recordVoiceAction('Switch to Zero-Cost ChatGPT Alternative Hook', txt, 'quick_action');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <div className="font-semibold text-emerald-300 mb-0.5">💰 Zero Cost Hook</div>
                    <p className="text-[11px] text-slate-400">"ChatGPT / Claude par paise zaya karne se behtar hai yeh free setup..."</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dialogue' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <strong>Continuous Interactive Voice Loop:</strong> Host aur Co-Pilot ke darmiyan live interactive conversation active hai. Har sawal aur jawab persistent memory me bina state reset ke store ho raha hai.
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Status: {speechStatus}
                </div>
              </div>

              {/* Chat turns */}
              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800" style={{ overscrollBehavior: 'contain' }}>
                {dialogueHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-2.5 ${item.sender === 'host' ? 'justify-end' : 'justify-start'}`}
                  >
                    {item.sender === 'copilot' && (
                      <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-xl text-xs space-y-1 ${
                        item.sender === 'host'
                          ? 'bg-blue-600/30 border border-blue-500/40 text-blue-100'
                          : 'bg-slate-900 border border-slate-700/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                        <span className="font-bold uppercase tracking-wider">
                          {item.sender === 'host' ? 'Host (Waqar Majeed)' : 'Chief Strategist Co-Pilot'}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="leading-relaxed font-sans">{item.text}</p>
                    </div>
                    {item.sender === 'host' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={dialogueEndRef} />
              </div>

              {/* Dialogue input bar */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={liveHostInput}
                  onChange={(e) => setLiveHostInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendHostPrompt()}
                  placeholder="Type or speak prompt to Co-Pilot..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => handleSendHostPrompt()}
                  disabled={loadingAdvice || !liveHostInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Done &amp; Minimize
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
