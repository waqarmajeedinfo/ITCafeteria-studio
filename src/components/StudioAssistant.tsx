import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Compass,
  MessageSquare,
  Video,
  Image as ImageIcon,
  Mic,
  Calendar as CalendarIcon
} from 'lucide-react';
import type { TabType } from '../App';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface StudioAssistantProps {
  currentTab: string;
  currentTabLabel: string;
  onNavigate: (tab: TabType) => void;
}

export const StudioAssistant: React.FC<StudioAssistantProps> = ({
  currentTab,
  currentTabLabel,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Asalam-u-Alikum Waqar Bhai! Main IT Cafeteria ka Assistant hoon — Chrome ke Gemini assistant ki tarah, app ke andar kahin bhi aap ki madad ke liye hazir hoon. Sawal poochein, ya neeche diye actions se kisi bhi studio mein jayein.',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const quickActions: { label: string; icon: React.ReactNode; prompt?: string; tab?: TabType }[] = [
    { label: 'Aaj ke 3 viral topics do', icon: <Sparkles className="w-3 h-3" />, prompt: 'Mere IT Cafeteria channel ke liye aaj ke 3 sab se viral tech topics do, har ek ke saath Roman Urdu hook likh kar.' },
    { label: 'Script Copilot', icon: <MessageSquare className="w-3 h-3" />, tab: 'chat' },
    { label: 'Video Studio', icon: <Video className="w-3 h-3" />, tab: 'video' },
    { label: 'Thumbnail Studio', icon: <ImageIcon className="w-3 h-3" />, tab: 'image' },
    { label: 'Voice Dictation', icon: <Mic className="w-3 h-3" />, tab: 'transcribe' },
    { label: 'Content Calendar', icon: <CalendarIcon className="w-3 h-3" />, tab: 'calendar' },
  ];

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
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
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          model: 'gemini-3.8-flash',
          fallback: true,
          systemInstruction: `You are the embedded IT Cafeteria Studio Assistant — like the Gemini assistant inside Chrome, but living inside Waqar Majeed's IT Cafeteria AI content studio app. Waqar is currently viewing the "${currentTabLabel}" tab (tab id: ${currentTab}).
Your job:
1. Guide him in friendly natural Roman Urdu (English tech terms allowed) about how to use the app's studios.
2. Write hooks, scripts, titles, descriptions, and thumbnails ideas when asked.
3. Suggest which studio tab fits his task (e.g. scripts -> AI Script Chatbot, video -> Omni Flash Video, thumbnails -> Nano Banana studio, voice -> Voice Dictation).
4. Give short, actionable YouTube Shorts growth advice for a Pakistani tech channel.
Keep replies concise (under 150 words) and always end with one practical next step.`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.text || 'Koi jawab generate nahi ho saka.',
        },
      ]);
    } catch (err: any) {
      console.error('Assistant error:', err);
      setErrorMsg(err.message || 'Assistant se rabta nahi ho saka.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: { label: string; prompt?: string; tab?: TabType }) => {
    if (action.tab) {
      onNavigate(action.tab);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: `"${action.label}" tab khol diya gaya hai. Ab wahan apna kaam shuru karein — agar koi madad chahiye to yahin poochein.`,
        },
      ]);
    } else if (action.prompt) {
      sendMessage(action.prompt);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="IT Cafeteria Assistant kholein"
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
          <Sparkles className="w-6 h-6 relative" />
        </button>
      )}

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[60] w-[22rem] sm:w-96 h-[540px] max-h-[75vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">IT Cafeteria Assistant</h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Har tab pe madad ke liye tayar
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Tab Indicator */}
          <div className="px-3.5 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Aap abhi dekh rahe hain:</span>
            <span className="text-cyan-300 font-medium">{currentTabLabel}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-cyan-500 text-slate-950' : 'bg-blue-600 text-white'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap select-text">{msg.text}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600/50 text-white flex items-center justify-center animate-pulse">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-slate-800 p-2.5 rounded-xl rounded-tl-none border border-slate-700 text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>Soch raha hoon...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2 bg-rose-950/50 border border-rose-500/30 text-rose-300 rounded-lg text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span className="break-words whitespace-pre-wrap leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Kuch bhi poochein..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition-opacity cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
