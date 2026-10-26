import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  User, 
  Cpu, 
  MessageSquare, 
  AlertCircle,
  Calendar as CalendarIcon,
  Globe2,
  TrendingUp,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  Search,
  Mic,
  MicOff,
  AudioLines
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
}

interface TrendingKeywordItem {
  keyword: string;
  urduIntent: string;
  surge: string;
  category: string;
  hook: string;
}

export const AiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      text: "Asalam-u-Alikum Waqar Bhai! Main IT Cafeteria ka dedicated AI Content Copilot hoon. Right sidebar mein live search-grounded trending tech keywords load ho chuke hain. Aap kisi bhi keyword par click karke direct viral script generate karwa sakte hain, ya mujh se custom hook brainstorm karwa sakte hain. Aaj kis topic par kaam karein?",
      timestamp: '05:15 AM',
      model: 'gemini-3.8-flash'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voice Input States (with Gemini Natural Flow Auto-Detection)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [vadState, setVadState] = useState<'idle' | 'listening' | 'speaking' | 'silence_detected'>('idle');
  const [silenceProgress, setSilenceProgress] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isAutoSubmittingRef = useRef<boolean>(false);

  // Trending Keywords Sidebar States
  const [showTrendingSidebar, setShowTrendingSidebar] = useState<boolean>(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isRefreshingTrends, setIsRefreshingTrends] = useState<boolean>(false);
  const [trendingKeywords, setTrendingKeywords] = useState<TrendingKeywordItem[]>([
    {
      keyword: "Windows 11 Temp Files Auto-Delete",
      urduIntent: "bina software PC 2X fast",
      surge: "+155% Surge",
      category: "PC & Windows Hacks",
      hook: "Aapka PC slow ho gaya hai? Sirf yeh 1 run command chalayein aur 5 seconds mein temp files clean karein!"
    },
    {
      keyword: "Google Sheets Smart Fill AI Trick",
      urduIntent: "ghanton ka data entry seconds mein",
      surge: "+180% Surge",
      category: "Google Workspace",
      hook: "Google Sheets ka naya Smart Fill AI feature jo manual typing hamesha ke liye khatam karta hai!"
    },
    {
      keyword: "ChatGPT Voice Mode Pakistani Accent",
      urduIntent: "realtime natural Urdu conversation",
      surge: "+210% Surge",
      category: "AI Tools",
      hook: "ChatGPT ka voice mode ab Pakistani Urdu samajhta hai bina kisi prompt ke! Kese enable karein dekhein..."
    },
    {
      keyword: "Excel Center Across Selection Trick",
      urduIntent: "stop merging cells shortcut",
      surge: "+130% Surge",
      category: "Excel Productivity",
      hook: "Excel mein cells merge mat karein! Center Across Selection ka shortcut dekhein jo formula break nahi karta..."
    },
    {
      keyword: "Power Automate Daily Report Flow",
      urduIntent: "office automation bina coding",
      surge: "+115% Surge",
      category: "AI Workflows",
      hook: "Office ki daily report auto send karein bina ek line code likhe!"
    },
    {
      keyword: "Chrome Flags Memory Saver Hack",
      urduIntent: "RAM consumption 40% kam",
      surge: "+95% Surge",
      category: "Secrets & Browsers",
      hook: "Chrome aapke laptop ki sari RAM khaa raha hai? Yeh flag on karein!"
    }
  ]);
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([
    { title: "Google Trends South Asia Tech", uri: "https://trends.google.com" },
    { title: "YouTube Search Queries Pakistan", uri: "https://youtube.com" }
  ]);

  const sendToContentCalendar = (text: string, id: string) => {
    try {
      const draft = {
        id,
        text,
        timestamp: Date.now(),
        model: selectedModel
      };
      localStorage.setItem('itcafeteria_latest_ai_draft', JSON.stringify(draft));
      setSavedDraftId(id);
      setTimeout(() => setSavedDraftId(null), 2500);
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch real-time search grounded trending keywords from Gemini API
  const fetchTrendingKeywords = async (category: string = 'All') => {
    setIsRefreshingTrends(true);
    try {
      const res = await fetch('/api/ai/trending-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.keywords) && data.keywords.length > 0) {
          setTrendingKeywords(data.keywords);
        }
        if (Array.isArray(data.sources)) {
          setGroundingSources(data.sources);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trending keywords:', err);
    } finally {
      setIsRefreshingTrends(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, text: m.text })),
          model: selectedModel,
          fallback: true,
          systemInstruction: `You are the specialized AI Production Agent for IT Cafeteria (Waqar Majeed). 
You help research, refine, and write Google Flow (Gemini Omni Flash) video scripts, hooks, and YouTube packages.
Always adhere to IT Cafeteria rules:
1. Speak in friendly, natural Roman Urdu (with English technical terms where needed).
2. Follow Section 7 phonetic spelling rules (waq-t, Fikr, ak-sr, usi waqt/for-rn, barra/barri, tareeqa, parre, Chat-G-P-T).
3. Strictly keep dialogue to ~22-25 words for 10-second scenes (2.7 words/sec).
4. Direct hooks in Scene 1 (no 'Salam', start directly with the problem or outcome).
5. Never invent false claims, earnings figures, or clickbait.`
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'Koi jawab generate nahi ho saka.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.modelUsed || selectedModel
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('Chat error:', err);
      setErrorMsg(err.message || 'Error communicating with Gemini');
    } finally {
      setIsLoading(false);
    }
  };

  const stopVoiceInput = () => {
    setIsRecordingVoice(false);
    setVadState('idle');
    setSilenceProgress(0);
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      voiceStreamRef.current = null;
    }
  };

  const toggleVoiceRecording = async () => {
    if (isRecordingVoice) {
      stopVoiceInput();
      return;
    }

    setErrorMsg(null);
    setSilenceProgress(0);
    isAutoSubmittingRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ur-PK';

        let accumulated = '';

        recognition.onstart = () => {
          setIsRecordingVoice(true);
          setVadState('listening');
        };

        recognition.onresult = (event: any) => {
          if (isAutoSubmittingRef.current) return;

          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulated += ' ' + event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          const currentWords = (accumulated + ' ' + interim).trim();
          if (!currentWords) return;

          setInputText(currentWords);
          setVadState('speaking');

          if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setSilenceProgress(0);

          // Once user has spoken, start 1.2s silence auto-submit countdown
          if (currentWords.length >= 2) {
            const start = Date.now();
            const durationMs = 1200;

            silenceTimerRef.current = setInterval(() => {
              const elapsed = Date.now() - start;
              const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
              setSilenceProgress(pct);
              setVadState('silence_detected');

              if (elapsed >= durationMs) {
                if (silenceTimerRef.current) {
                  clearInterval(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
                isAutoSubmittingRef.current = true;
                setSilenceProgress(100);
                stopVoiceInput();
                handleSend(currentWords);
              }
            }, 80);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition notice:', e?.error);
          if (e?.error === 'not-allowed') {
            setErrorMsg('Microphone allow karein browser address bar se.');
          }
          stopVoiceInput();
        };

        recognition.onend = () => {
          if (!isAutoSubmittingRef.current) {
            setIsRecordingVoice(false);
            setVadState('idle');
          }
        };

        recognition.start();
        setIsRecordingVoice(true);
        setVadState('listening');
        return;
      } catch (err) {
        console.warn('SpeechRecognition fallback to MediaRecorder:', err);
      }
    }

    // Fallback: MediaRecorder + Web Audio API VAD
    try {
      voiceChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);

      let hasSpoken = false;
      let silenceStart: number | null = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          audioCtx.close();
        } catch {}
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        voiceStreamRef.current = null;
        transcribeVoiceInput(blob);
      };

      const checkVolume = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const average = sum / buffer.length;
        const levelPct = Math.min(100, Math.round((average / 128) * 100));

        if (levelPct > 14) {
          hasSpoken = true;
          silenceStart = null;
          setVadState('speaking');
          setSilenceProgress(0);
        } else if (hasSpoken) {
          if (!silenceStart) silenceStart = Date.now();
          const elapsed = Date.now() - silenceStart;
          const pct = Math.min(100, Math.round((elapsed / 1200) * 100));
          setSilenceProgress(pct);
          setVadState('silence_detected');

          if (elapsed >= 1200) {
            hasSpoken = false;
            setSilenceProgress(100);
            isAutoSubmittingRef.current = true;
            stopVoiceInput();
            return;
          }
        }

        requestAnimationFrame(checkVolume);
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setVadState('listening');
      checkVolume();
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setErrorMsg('Microphone access check karein (browser site settings mein microphone allow karein).');
      stopVoiceInput();
    }
  };

  const transcribeVoiceInput = (blob: Blob) => {
    setIsTranscribingVoice(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Audio,
            mimeType: blob.type || 'audio/webm',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Transcription failed with status ${res.status}`);
        }

        const data = await res.json();
        const transcript = (data.text || '').trim();
        if (!transcript) {
          throw new Error('Koi awaaz detect nahi hui. Dobara try karein.');
        }

        const combined = inputText.trim() ? `${inputText.trim()} ${transcript}` : transcript;
        setInputText(combined);
        handleSend(combined);
      } catch (err: any) {
        console.warn('Voice transcription error:', err);
        setErrorMsg(err.message || 'Voice transcribe nahi ho saka.');
      } finally {
        setIsTranscribingVoice(false);
      }
    };
    reader.readAsDataURL(blob);
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyKeywordText = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  // One-click action: Inject trending keyword into chat prompt to generate Section 19 script
  const handleUseKeywordInChat = (kw: TrendingKeywordItem) => {
    const prompt = `Mujhe '${kw.keyword}' par IT Cafeteria ke liye 45-second (4 scenes) YouTube Short script bana kar do. Search Intent hai: '${kw.urduIntent}'. Hook mein Scene 1 direct problem se start ho, Section 19 anchor poses aur ~22-25 words per scene Roman Urdu rules follow karo. Saath mein 5-item YouTube package bhi do.`;
    handleSend(prompt);
  };

  const filteredKeywords = selectedCategoryFilter === 'All'
    ? trendingKeywords
    : trendingKeywords.filter(k => k.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[780px] overflow-hidden shadow-2xl">
      {/* Header with Model Switcher & Trending Sidebar Toggle */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">IT Cafeteria Script Copilot</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                Multi-Turn Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Roman Urdu Script Doctor & Google Flow Video Prompt Engine
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Model Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 p-1 rounded-xl">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedModel === 'gemini-3.8-flash' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flash (Fast)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedModel === 'gemini-4-argon' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Argon (Deep)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedModel === 'gemini-3.1-flash-lite' 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lite
            </button>
          </div>

          {/* Toggle Trending Sidebar Button */}
          <button
            onClick={() => setShowTrendingSidebar(!showTrendingSidebar)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showTrendingSidebar 
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border-cyan-500/50 shadow-sm' 
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trending Keywords</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Main Split Body: Chat Area (Left) + Trending Keywords Sidebar (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Conversation & Input Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500 text-slate-950 font-bold' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5 opacity-80 text-[10px]">
                    <span>{msg.role === 'user' ? 'Waqar Majeed' : 'IT Cafeteria Copilot'}</span>
                    <span className="font-mono">{msg.timestamp} {msg.model ? `• ${msg.model}` : ''}</span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs select-text">
                    {msg.text}
                  </div>

                  {/* Action row */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-end gap-3">
                      <button
                        onClick={() => sendToContentCalendar(msg.text, msg.id)}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        <span>{savedDraftId === msg.id ? '✓ Saved to Calendar Drafts!' : 'Send to Content Calendar'}</span>
                      </button>

                      <button
                        onClick={() => copyText(msg.id, msg.text)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Response
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/50 text-white flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Researching with {selectedModel}...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="break-words whitespace-pre-wrap leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-500 shrink-0">Quick Hooks:</span>
            <button
              onClick={() => handleSend("Windows 11 ka ek naya scroll-stopping viral hook likh kar do jo Shorts Feed mein 80% view rate laye.")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition-colors cursor-pointer"
            >
              🔥 Windows 11 Hook
            </button>
            <button
              onClick={() => handleSend("Google Sheets Smart Fill AI trick par 4-scenes (45s) script likhein Roman Urdu mein.")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition-colors cursor-pointer"
            >
              📊 Sheets Smart Fill Script
            </button>
            <button
              onClick={() => handleSend("Roman Urdu dialogue likhte waqt konsi 5 ahem ghaltiyan Flow voice ko kharab karti hain?")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 transition-colors cursor-pointer"
            >
              🎙️ Voice Phonetic Rules
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isLoading || isTranscribingVoice}
                title={isRecordingVoice ? 'Recording band karein' : 'Awaaz se likhein (Roman Urdu bol kar)'}
                className={`p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 shrink-0 ${
                  isRecordingVoice
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Roman Urdu ya English mein sawal poochein ya prompt dein... (ya mic se bol kar) "
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition-opacity shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Voice Status Line (Gemini Auto-Detection Flow) */}
            {(isRecordingVoice || isTranscribingVoice) && (
              <div className="mt-2 text-[11px] bg-slate-900/90 border border-slate-800 rounded-lg p-2 overflow-hidden relative">
                {vadState === 'silence_detected' && silenceProgress > 0 && (
                  <div
                    className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-75"
                    style={{ width: `${silenceProgress}%` }}
                  />
                )}
                {isRecordingVoice ? (
                  vadState === 'silence_detected' ? (
                    <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Khamoshi detect hui... Auto-submitting prompt!
                    </span>
                  ) : vadState === 'speaking' ? (
                    <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      Aap bol rahe hain... (Rukne par auto-submit ho jayega)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      🎙️ Sun raha hoon... Bolte jayein, rukne par khud submit ho jayega (Gemini Flow).
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <AudioLines className="w-3.5 h-3.5 animate-pulse" />
                    Aap ki awaaz process ho rahi hai...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Trending Keywords Sidebar */}
        {showTrendingSidebar && (
          <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-950/70 flex flex-col shrink-0 overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Trending Tech Keywords
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Real-time Search Grounded</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => fetchTrendingKeywords(selectedCategoryFilter)}
                disabled={isRefreshingTrends}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Refresh Google Search Trends"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTrends ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
              {['All', 'Excel', 'Windows', 'AI Tools', 'Google'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategoryFilter(cat);
                    fetchTrendingKeywords(cat);
                  }}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Keywords Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredKeywords.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl space-y-2 transition-all group"
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-white text-xs tracking-tight line-clamp-1">
                      {item.keyword}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.2 rounded shrink-0">
                      {item.surge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">{item.category}</span>
                    <span className="text-slate-400 truncate max-w-[140px] italic">"{item.urduIntent}"</span>
                  </div>

                  <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded border border-slate-800/80 leading-relaxed font-sans">
                    💡 <strong className="text-slate-200">Suggested Hook:</strong> {item.hook}
                  </p>

                  {/* Actions for this keyword */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => handleUseKeywordInChat(item)}
                      className="flex-1 py-1 px-2 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 hover:from-blue-600/50 hover:to-cyan-500/50 border border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-current text-cyan-400" />
                      <span>Draft Script in Chat</span>
                    </button>

                    <button
                      onClick={() => copyKeywordText(item.keyword)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy Keyword"
                    >
                      {copiedKeyword === item.keyword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Google Search Grounding Sources Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                  <Globe2 className="w-3 h-3" /> Grounding Sources:
                </span>
                <span className="text-slate-500">Google Trends API</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] text-slate-400">
                {groundingSources.slice(0, 2).map((s, i) => (
                  <span key={i} className="truncate max-w-[160px] underline decoration-slate-600">
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
