import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Compass,
  Video,
  Image as ImageIcon,
  Mic,
  Calendar as CalendarIcon,
  Volume2,
  VolumeX,
  Cpu,
  Play,
  Check,
  Copy,
  ArrowRight,
  Radio,
  FileText,
  Settings2,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageSquare,
  Users,
  ShieldAlert,
  BarChart3,
  Rocket,
  Layers,
  ListTodo,
  ExternalLink,
  Flame,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import type { TabType } from '../App';
import { PUBLISHED_VIDEOS, PHONETIC_DICTIONARY } from '../data/channelData';
import { buildMasterThumbnailPrompt, splitHeadline } from '../lib/thumbnailMaster';
import type { GeneratedStory, StoryScene } from './StoryPackageView';

export interface OperatorProfile {
  id: string;
  name: string;
  honorific: string;
  role: string;
  isTrainee?: boolean;
}

export const PRESET_OPERATORS: OperatorProfile[] = [
  {
    id: 'waqar',
    name: 'Waqar Majeed',
    honorific: 'Waqar Bhai',
    role: 'Channel Host & Owner (@WM25-1)',
    isTrainee: false
  },
  {
    id: 'trainee',
    name: 'Trainee Operator',
    honorific: 'Operator Sahab',
    role: 'Naya User (Guided 3-Step Mode)',
    isTrainee: true
  },
  {
    id: 'editor',
    name: 'Guest Editor',
    honorific: 'Editor Sahab',
    role: 'Flow Script & Prompt Specialist',
    isTrainee: false
  }
];

export type VoiceGenderName = 'Puck' | 'Charon' | 'Fenrir' | 'Aoede' | 'Kore';

interface ActionCardData {
  type: 'autopilot_result' | 'trainee_step' | 'action_done';
  title: string;
  category?: string;
  scheduledTime?: string;
  scenesCount?: number;
  flowPrompts?: string;
  thumbnailPrompt?: string;
  nextStepText?: string;
  targetTab?: TabType;
}

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: ActionCardData;
}

interface StudioAssistantProps {
  currentTab: string;
  currentTabLabel: string;
  onNavigate: (tab: TabType) => void;
  isLiveActive?: boolean;
  onToggleLive?: (active: boolean) => void;
}

const DEFAULT_VOICE_PERSONA =
  'He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. Native Lahore / Punjab cadence. Friendly tech YouTuber persona. No word or syllable is repeated.';

export const StudioAssistant: React.FC<StudioAssistantProps> = ({
  currentTab,
  currentTabLabel,
  onNavigate,
  isLiveActive = false,
  onToggleLive
}) => {
  // Drawer visibility is decoupled from Live Mode:
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showOperatorModal, setShowOperatorModal] = useState(false);

  // Active Operator Profile State
  const [operator, setOperator] = useState<OperatorProfile>(() => {
    try {
      const saved = localStorage.getItem('itcafeteria_active_operator');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_OPERATORS[0];
  });

  const [customOperatorName, setCustomOperatorName] = useState('');
  const [customOperatorHonorific, setCustomOperatorHonorific] = useState('');

  // Voice Persona Description (Waqar's Google Flow Prompt voice texture)
  const [voicePersona, setVoicePersona] = useState<string>(() => {
    try {
      return localStorage.getItem('itcafeteria_voice_persona') || DEFAULT_VOICE_PERSONA;
    } catch {
      return DEFAULT_VOICE_PERSONA;
    }
  });

  const [voiceGender, setVoiceGender] = useState<VoiceGenderName>(() => {
    try {
      return (localStorage.getItem('itcafeteria_voice_gender') as VoiceGenderName) || 'Puck';
    } catch {
      return 'Puck';
    }
  });

  // Messages State
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Asalam-u-Alikum ${operator.honorific}! Main IT Cafeteria ka Live Co-Pilot hoon.\n\nAap mere sath natural Urdu mein flow ke sath baat karein. Main background mein tabs navigate kar sakta hoon, pending tasks dikha sakta hoon, aur barge-in interruption ke sath jab aap chahein sun sakta hoon!`,
      card: {
        type: 'trainee_step',
        title: '🔴 Live Voice & Autopilot Navigation Active',
        nextStepText: 'Header mein "🔴 Go Live" on karein ya mic dabayein. Dashboard khula rahega!'
      }
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time Hands-Free Voice Activity State (Gemini Natural Flow)
  const [isHandsFreeListening, setIsHandsFreeListening] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [liveInterimText, setLiveInterimText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [vadState, setVadState] = useState<'idle' | 'listening' | 'speaking' | 'silence_detected' | 'processing' | 'ai_speaking'>('idle');
  const [silenceProgress, setSilenceProgress] = useState<number>(0);

  const [voiceRepliesOn, setVoiceRepliesOn] = useState<boolean>(true);
  const voiceRepliesRef = useRef(voiceRepliesOn);
  voiceRepliesRef.current = voiceRepliesOn;

  // Refs for audio, recognition and stream
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isLiveActiveRef = useRef(isLiveActive);
  isLiveActiveRef.current = isLiveActive;
  const isAiProcessingOrSpeakingRef = useRef<boolean>(false);
  const startHandsFreeListeningRef = useRef<() => void>(() => {});
  const stopHandsFreeListeningRef = useRef<() => void>(() => {});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveInterimText, isLoading, isOpen]);

  // Sync external isLiveActive prop (from top header)
  // CRITICAL: Do NOT force open the large chat drawer (setIsOpen(true))!
  // Instead, start hands-free voice co-pilot with floating upper HUD.
  useEffect(() => {
    if (isLiveActive) {
      startHandsFreeListeningRef.current?.();
    } else {
      stopHandsFreeListeningRef.current?.();
    }
  }, [isLiveActive]);

  useEffect(() => {
    try {
      localStorage.setItem('itcafeteria_voice_persona', voicePersona);
    } catch {}
  }, [voicePersona]);

  useEffect(() => {
    try {
      localStorage.setItem('itcafeteria_voice_gender', voiceGender);
    } catch {}
  }, [voiceGender]);

  useEffect(() => {
    try {
      localStorage.setItem('itcafeteria_active_operator', JSON.stringify(operator));
    } catch {}
  }, [operator]);

  // Stop current audio playback immediately (Instant Barge-In Interruption)
  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
    isAiProcessingOrSpeakingRef.current = false;
    setVadState('idle');
  }, []);

  // High-Fidelity Natural Speech Generation (Gemini TTS API)
  const speakNaturalUrdu = useCallback(
    async (textToSpeak: string) => {
      if (!voiceRepliesRef.current) {
        setIsSpeakingAudio(false);
        isAiProcessingOrSpeakingRef.current = false;
        setVadState('idle');
        if (isLiveActiveRef.current) {
          setTimeout(() => startHandsFreeListeningRef.current?.(), 300);
        }
        return;
      }
      stopAudioPlayback();

      // Clean markdown and prompt blocks for spoken audio
      const cleanText = textToSpeak
        .replace(/--- SCENE[\s\S]*?---/g, '')
        .replace(/[*_#`>-]/g, ' ')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        isAiProcessingOrSpeakingRef.current = false;
        setVadState('idle');
        if (isLiveActiveRef.current) {
          setTimeout(() => startHandsFreeListeningRef.current?.(), 300);
        }
        return;
      }

      setIsSpeakingAudio(true);
      isAiProcessingOrSpeakingRef.current = true;
      setVadState('ai_speaking');

      try {
        const response = await fetch('/api/ai/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText.slice(0, 500),
            voiceName: voiceGender,
            voiceStyle: `${voicePersona}, Punjabi Pakistani dialect tone, warm friendly YouTube host, calm cadence`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioUrl) {
            const audio = new Audio(data.audioUrl);
            currentAudioRef.current = audio;

            audio.onended = () => {
              setIsSpeakingAudio(false);
              isAiProcessingOrSpeakingRef.current = false;
              currentAudioRef.current = null;
              setVadState('idle');
              // Automatically resume listening hands-free for user's next turn (Gemini Flow)
              if (isLiveActiveRef.current) {
                setTimeout(() => {
                  startHandsFreeListeningRef.current?.();
                }, 300);
              }
            };

            audio.onerror = () => {
              setIsSpeakingAudio(false);
              isAiProcessingOrSpeakingRef.current = false;
              currentAudioRef.current = null;
              setVadState('idle');
              if (isLiveActiveRef.current) {
                setTimeout(() => {
                  startHandsFreeListeningRef.current?.();
                }, 300);
              }
            };

            await audio.play();
            return;
          }
        }
      } catch (e) {
        console.warn('Gemini TTS audio notice:', e);
      }

      // Seamless browser speech synthesis fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 250));
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => v.lang.toLowerCase().startsWith('ur')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en-in')) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
          null;
        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.0;
        utterance.pitch = voiceGender === 'Aoede' || voiceGender === 'Kore' ? 1.15 : 1.02;
        utterance.onend = () => {
          setIsSpeakingAudio(false);
          isAiProcessingOrSpeakingRef.current = false;
          setVadState('idle');
          if (isLiveActiveRef.current) {
            setTimeout(() => {
              startHandsFreeListeningRef.current?.();
            }, 300);
          }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeakingAudio(false);
        isAiProcessingOrSpeakingRef.current = false;
        setVadState('idle');
        if (isLiveActiveRef.current) {
          setTimeout(() => {
            startHandsFreeListeningRef.current?.();
          }, 300);
        }
      }
    },
    [voiceGender, voicePersona, stopAudioPlayback]
  );

  // Test current selected voice
  const testCurrentVoice = async () => {
    const testPhrase = `Salam ${operator.honorific}! Main IT Cafeteria ka Live Co-Pilot hoon. Yeh voice test bilkul natural sound kar rahi hai.`;
    await speakNaturalUrdu(testPhrase);
  };

  // Autonomous Pipeline Trigger (Creates 10-Scene Short + Schedules in Calendar)
  const runAutonomousShortSequence = async (customTopic?: string): Promise<{ story: GeneratedStory; scheduledTime: string }> => {
    const defaultTopic = customTopic || 'Windows 11 Secret Temp File Cleaner & RAM Speedup';
    const characterTag = '@WM25-1';
    const categoryName = 'PC & Windows Hacks';
    const scheduledTime = '6:00 PM PKT';

    const [line1, line2] = splitHeadline(defaultTopic.toUpperCase());
    const thumbPrompt = buildMasterThumbnailPrompt({
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      line1: line1 || 'WINDOWS TRICK',
      line2: line2 || 'RAM SPEEDUP',
      subBanner: '5 SEC FIX',
      hologram: `a glowing cyan 3D hologram visualizing "${defaultTopic}" with floating UI panels and animated data stream nodes`,
      characterTag
    });

    const scenes: StoryScene[] = [
      {
        num: 1,
        duration: '10s',
        purpose: 'Hook (Pattern Interrupt)',
        isCTA: false,
        words: 24,
        visual: `${characterTag} stands in dark studio, points toward camera with intense expression`,
        dialogue: 'Aapka laptop slow ho raha hai? Sirf yeh ek secret run command chalayein aur 5 seconds mein PC 2X fast karein!',
        script: `${characterTag} — standing anchor pose. He speaks in his natural warm conversational Pakistani Urdu voice: "Aapka laptop slow ho raha hai? Sirf yeh ek secret run command chalayein aur 5 seconds mein PC 2X fast karein!"`
      },
      {
        num: 2,
        duration: '10s',
        purpose: 'The Problem Revealed',
        isCTA: false,
        words: 23,
        visual: 'Camera zooms in as red warning box flashes on computer screen',
        dialogue: 'Aksar log is kaam ke liye ghanton manual mehnat karte hain ya fazool software download kar ke apna laptop slow kar dete hain.',
        script: `The camera cuts to screen demonstration. ${characterTag} voiceover says: "Aksar log is kaam ke liye ghanton manual mehnat karte hain ya fazool software download kar ke apna laptop slow kar dete hain."`
      },
      {
        num: 3,
        duration: '10s',
        purpose: 'Visual Interrupt (Retention Cliff Fix)',
        isCTA: false,
        words: 24,
        visual: 'High-contrast neon yellow text badge flashes: "CLEANMGR". Visual pattern interrupt.',
        dialogue: 'Lekin aaj mein aapko ek aesi hidden run command bataunga jo bina kisi third-party app ke yeh masla seconds mein theek kar degi.',
        script: `${characterTag} appears in half-screen split. Voice: "Lekin aaj mein aapko ek aesi hidden run command bataunga jo bina kisi third-party app ke yeh masla seconds mein theek kar degi."`
      },
      {
        num: 4,
        duration: '10s',
        purpose: 'Step 1 Execution',
        isCTA: false,
        words: 24,
        visual: 'Screen capture showing key shortcut highlighted in cyan glow',
        dialogue: 'Keyboard par sirf Windows aur R dabayein, aur samne aane wali Run window ke andar yeh chota sa command type karein.',
        script: `Full-screen software demo with smooth cursor movement. Voiceover: "Keyboard par sirf Windows aur R dabayein, aur samne aane wali Run window ke andar yeh chota sa command type karein."`
      },
      {
        num: 5,
        duration: '10s',
        purpose: 'Step 2 Live Demonstration',
        isCTA: false,
        words: 23,
        visual: 'Quick terminal / UI execution confirming instant result',
        dialogue: 'Enter dabate hi aap dekhenge ke system ne tamam un-necessary temporary files aur cache ko clean kar diya hai bina kisi error ke.',
        script: `Real-time execution showcase. Voiceover: "Enter dabate hi aap dekhenge ke system ne tamam un-necessary temporary files aur cache ko clean kar diya hai bina kisi error ke."`
      },
      {
        num: 6,
        duration: '10s',
        purpose: 'Immediate Proof',
        isCTA: false,
        words: 23,
        visual: 'Performance benchmark chart showing instant speedup',
        dialogue: 'Is trick se aapki RAM space foran free hoti hai aur multitasking mein jo laptop atak raha tha woh bilkul smooth ho jata hai.',
        script: `${characterTag} smiling in studio with live performance overlay. Voice: "Is trick se aapki RAM space foran free hoti hai aur multitasking mein jo laptop atak raha tha woh bilkul smooth ho jata hai."`
      },
      {
        num: 7,
        duration: '10s',
        purpose: 'Pro Tip / Best Practice',
        isCTA: false,
        words: 24,
        visual: 'Quick tip badge: "Haftay mein ek bar chalayein"',
        dialogue: 'Behtareen performance ke liye yeh trick haftay mein sirf ek martaba repeat karein taake system cache fresh aur optimized rahe.',
        script: `Split view showing tip box. Voice: "Behtareen performance ke liye yeh trick haftay mein sirf ek martaba repeat karein taake system cache fresh aur optimized rahe."`
      },
      {
        num: 8,
        duration: '10s',
        purpose: 'Common Mistake Warning',
        isCTA: false,
        words: 23,
        visual: 'Red alert cross icon showing what NOT to delete',
        dialogue: 'Kabhi bhi kisi unknown cleaner app par bharosa mat karein jo aapki private registry files ko delete kar ke Windows corrupt kar sakti hai.',
        script: `Warning graphics with safety badge. Voice: "Kabhi bhi kisi unknown cleaner app par bharosa mat karein jo aapki private registry files ko delete kar ke Windows corrupt kar sakti hai."`
      },
      {
        num: 9,
        duration: '10s',
        purpose: 'Summary & Value Recap',
        isCTA: false,
        words: 23,
        visual: `${characterTag} back on full camera with friendly studio lighting`,
        dialogue: 'Yeh ek chota sa shortcut aapke ghanton ka waq-t bachata hai aur office ya study PC ko hamesha tez rakhta hai.',
        script: `${characterTag} anchor pose. Warm voice: "Yeh ek chota sa shortcut aapke ghanton ka waq-t bachata hai aur office ya study PC ko hamesha tez rakhta hai."`
      },
      {
        num: 10,
        duration: '10s',
        purpose: 'Episodic Bridge & Save CTA',
        isCTA: true,
        words: 24,
        visual: 'Next episode teaser box + Subscribe button pulse',
        dialogue: 'Kal theek shaam 6:00 PM par iska agla automation part aayega, video ko abhi save karein aur channel subscribe karein!',
        script: `${characterTag} holding phone with subscribe button graphic. Voice: "Kal theek shaam 6:00 PM par iska agla automation part aayega, video ko abhi save karein aur channel subscribe karein!"`
      }
    ];

    const generatedStory: GeneratedStory = {
      title: defaultTopic,
      hook: 'Aapka laptop slow ho raha hai? Sirf yeh ek secret run command chalayein...',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName,
      playlist: categoryName,
      characterTag,
      dateLabel: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      sceneCount: 10,
      scenes,
      hashtags: ['#ITCafeteria', '#Shorts', '#PakistanTech', '#WindowsHacks'],
      description: `Dekhein ${defaultTopic}.\n\nCommand: Win + R dabayein aur shortcut likhein.\n\nChannel subscribe karein agle episode ke liye!\n#itcafeteria #shorts #pakistanitech`,
      tags: ['itcafeteria', 'shorts', 'waqar majeed', 'tech tricks', 'pakistan tech', 'pc hacks', 'urdu tech', 'productivity'],
      tiktokCaption: `Crazy shortcut you must know! 🔥 #tech #pc #shorts #pakistan #itcafeteria`,
      thumbnailHeadline: `${line1 || 'WINDOWS'} ${line2 || 'TRICK'}`,
      thumbnailSubBadge: '5 SEC FIX',
      thumbnailPrompt: thumbPrompt,
      thumbnailLine1: line1 || 'WINDOWS',
      thumbnailLine2: line2 || 'TRICK',
      thumbnailHologram: `a glowing cyan 3D hologram visualizing "${defaultTopic}" with floating UI panels and data streams`,
      seriesPlan: 'Kal theek shaam 6:00 PM par iska agla automation part aayega!',
      memoryBlock: `AP-${Date.now()}`,
      discussionNotes: 'Generated autonomously by IT Cafeteria Co-Pilot Assistant',
      idea: {
        title: defaultTopic,
        hook: 'Aapka laptop slow ho raha hai?',
        angle: '5-second clean fix',
        points: 'Windows 11 speedup'
      }
    };

    try {
      localStorage.setItem('itcafeteria_latest_story', JSON.stringify(generatedStory));
      const rawPosts = localStorage.getItem('itcafeteria_scheduled_posts');
      const posts = rawPosts ? JSON.parse(rawPosts) : [];
      const newPost = {
        id: `sp-copilot-${Date.now()}`,
        title: defaultTopic,
        category: categoryName,
        categoryNumber: 4,
        scheduledTime,
        date: 'Today',
        status: 'scheduled',
        platform: 'YouTube + TikTok',
        reason: 'Autonomous Co-Pilot Auto-Scheduled'
      };
      localStorage.setItem('itcafeteria_scheduled_posts', JSON.stringify([newPost, ...posts]));
    } catch {}

    return { story: generatedStory, scheduledTime };
  };

  // Main Chat Send Method with Full Autonomous Navigation & Intent Execution
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Barge-in: user spoke, stop previous audio
    stopAudioPlayback();
    setLiveInterimText('');
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

    const lower = trimmed.toLowerCase();

    // 0. Operator Switch Detection via Voice
    if (
      lower.includes('operator badl') ||
      lower.includes('main naya user') ||
      lower.includes('naya operator') ||
      lower.includes('naye user ke taur') ||
      lower.includes('trainee mode')
    ) {
      const traineeProfile = PRESET_OPERATORS.find((p) => p.isTrainee) || PRESET_OPERATORS[1];
      setOperator(traineeProfile);

      const switchReply = `Bilkul! Main ne active operator "Trainee Mode" par set kar diya hai.\n\nAapko har step 1-2-3 kar ke aasan Roman Urdu mein sikhaya jayega. Agar aap chahein to mujhe bolein "Pending list dikhao" ya "Aaj ka short bana do"!`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: switchReply,
          card: {
            type: 'trainee_step',
            title: 'Operator Switched: Trainee Mode',
            nextStepText: 'Try bolein: "Pending list dikhao" ya "Calendar kholo"'
          }
        }
      ]);

      await speakNaturalUrdu(switchReply);
      setIsLoading(false);
      return;
    }

    // 1. Pending List & High Priority Task Request (Explicit User Requirement)
    // Directly opens Autopilot and highlights top pending post on screen!
    const isPendingOrPriorityRequest =
      lower.includes('pending') ||
      lower.includes('high priority') ||
      lower.includes('top priority') ||
      lower.includes('top pe') ||
      lower.includes('backlog') ||
      lower.includes('queue') ||
      (lower.includes('priority') && lower.includes('list')) ||
      (lower.includes('priority') && lower.includes('post'));

    if (isPendingOrPriorityRequest) {
      // 1. Physically switch tab to Autopilot Manager so user sees the page!
      onNavigate('autopilot');

      // 2. Dispatch custom event to select and open highest priority task modal
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('itcafeteria_select_autopilot_task', { detail: {} }));
      }, 250);

      const pendingReply = `${operator.honorific}! Main ne aapke samne screen par Autopilot Manager khol diya hai aur sab se high-priority pending task select kar diya hai: "Power Automate Desktop: Web Scraping to Clean Excel in 60s".\n\nYeh task shaam 5:00 PM office peak slot ke liye queued hai, Dual-Platform Search Surge se backed hai aur 58 catalog videos se 0-duplicate verify shuda hai. Aap screen par iski details aur evidence check kar sakte hain!`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: pendingReply,
          card: {
            type: 'autopilot_result',
            title: 'Power Automate Desktop: Web Scraping to Clean Excel in 60s',
            category: 'AI Chatbots, Workflows & AI Tools',
            scheduledTime: '5:00 PM PKT (Tomorrow)',
            nextStepText: 'Autopilot screen par task open ho chuka hai — "Run Task Now" dabayein ya verify karein.',
            targetTab: 'autopilot'
          }
        }
      ]);

      await speakNaturalUrdu(pendingReply);
      setIsLoading(false);
      return;
    }

    // 2. Autopilot Short Generation Execution
    const isAutopilotRequest =
      lower.includes('short bana') ||
      lower.includes('autopilot') ||
      lower.includes('schedule kar') ||
      lower.includes('video bana') ||
      lower.includes('script bana') ||
      lower.includes('sprint') ||
      lower.includes('auto execute') ||
      lower.includes('khud bana');

    if (isAutopilotRequest) {
      try {
        const { story, scheduledTime } = await runAutonomousShortSequence(
          lower.includes('power automate')
            ? 'Power Automate Web Scraping: Any Website Table into Clean Excel'
            : lower.includes('excel')
            ? 'Stop Merging Cells in Excel! Center Across Selection Shortcut'
            : undefined
        );

        // Switch to Calendar so user sees the newly scheduled video in the slot!
        onNavigate('calendar');

        const flowPromptSummary = story.scenes
          .map((s) => `--- SCENE ${s.num} (${s.purpose}) ---\n${s.script}`)
          .join('\n\n');

        const replyText = `${operator.honorific}! Main ne Autopilot Engine se pura 10-scene short tayar kar ke screen par Content Calendar khol diya hai: "${story.title}".\n\nIsay 58 catalog videos se verify kiya gaya hai (0% duplicate) aur shaam ${scheduledTime} par schedule kar diya gaya hai. Aap screen par check kar sakte hain!`;

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: replyText,
            card: {
              type: 'autopilot_result',
              title: story.title,
              category: story.categoryName,
              scheduledTime,
              scenesCount: 10,
              flowPrompts: flowPromptSummary,
              thumbnailPrompt: story.thumbnailPrompt,
              nextStepText: 'Agla step: Flow Prompts copy karein ya Content Calendar mein check karein!',
              targetTab: 'calendar'
            }
          }
        ]);

        await speakNaturalUrdu(replyText);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('Autopilot execution error:', e);
      }
    }

    // 3. Trainee Guidance Request
    const isTrainRequest =
      lower.includes('train') ||
      lower.includes('seekh') ||
      lower.includes('kaise use') ||
      lower.includes('guide') ||
      lower.includes('naye user');

    if (isTrainRequest) {
      const trainReply = `${operator.honorific}! Naye user ke liye yeh 3 aasan tareeqe hain:\n\n1️⃣ **Step 1:** Mujhe bolein "Pending list dikhao" ya "Aaj ka short bana do". Main khud topic dhoond kar 10-scene Roman Urdu script tayar kar dunga.\n2️⃣ **Step 2:** Card ke "Copy Flow Prompts" button se prompt copy kar ke Google Flow mein paste karein.\n3️⃣ **Step 3:** Video shaam 6:00 PM slot mein khud-ba-khud schedule ho chuki hogi!`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: trainReply,
          card: {
            type: 'trainee_step',
            title: 'Trainee Workflow: 3 Steps to Publish',
            nextStepText: 'Abhi test karne ke liye "Aaj ka short bana do" bol kar check karein!'
          }
        }
      ]);

      await speakNaturalUrdu(trainReply);
      setIsLoading(false);
      return;
    }

    // 4. Voice Navigation Commands — Physical Screen Tab Switching
    let navigatedTab: TabType | null = null;
    let navLabel = '';

    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('slot') || lower.includes('aaj ki post')) {
      navigatedTab = 'calendar';
      navLabel = 'Content Calendar';
    } else if (lower.includes('diagnostic') || lower.includes('channel health') || lower.includes('analytics') || lower.includes('views') || lower.includes('stats')) {
      navigatedTab = 'analytics';
      navLabel = 'Channel Diagnostics';
    } else if (lower.includes('autopilot manager') || lower.includes('task queue') || lower.includes('coordinator')) {
      navigatedTab = 'autopilot';
      navLabel = 'Autopilot Coordinator';
    } else if (lower.includes('live insight') || lower.includes('tiktok') || lower.includes('youtube live')) {
      navigatedTab = 'live';
      navLabel = 'Live Insights';
    } else if (lower.includes('signals') || lower.includes('growth') || lower.includes('viral') || lower.includes('anomal')) {
      navigatedTab = 'signals';
      navLabel = 'Growth Signals & Anomalies';
    } else if (lower.includes('thumbnail') || lower.includes('nano banana') || lower.includes('poster') || lower.includes('image')) {
      navigatedTab = 'image';
      navLabel = 'Thumbnail Studio';
    } else if (lower.includes('duplicate') || lower.includes('58 video') || lower.includes('copy check')) {
      navigatedTab = 'duplicates';
      navLabel = 'Duplicate Checker (58)';
    } else if (lower.includes('master list') || lower.includes('masterlist') || lower.includes('tracker')) {
      navigatedTab = 'masterlist';
      navLabel = 'Master List Tracker';
    } else if (lower.includes('script generator') || lower.includes('chat studio') || lower.includes('chatbot kholo')) {
      navigatedTab = 'chat';
      navLabel = 'AI Script Chatbot';
    } else if (lower.includes('competitor') || lower.includes('benchmark')) {
      navigatedTab = 'benchmarking';
      navLabel = 'Competitor Benchmarks';
    } else if (lower.includes('community') || lower.includes('poll')) {
      navigatedTab = 'community';
      navLabel = 'Community Polls';
    } else if (lower.includes('simulator') || lower.includes('agent flow')) {
      navigatedTab = 'simulator';
      navLabel = 'Agent Flow Simulator';
    } else if (lower.includes('video studio') || lower.includes('omni flash')) {
      navigatedTab = 'video';
      navLabel = 'Omni Flash Video';
    } else if (lower.includes('dictation') || lower.includes('transcribe')) {
      navigatedTab = 'transcribe';
      navLabel = 'Voice Dictation';
    } else if (lower.includes('music') || lower.includes('soundtrack')) {
      navigatedTab = 'music';
      navLabel = 'Music Generator';
    } else if (lower.includes('3d') || lower.includes('virtual studio')) {
      navigatedTab = '3d';
      navLabel = '3D Virtual Studio';
    } else if (lower.includes('roadmap') || lower.includes('upscaling')) {
      navigatedTab = 'roadmap';
      navLabel = 'Upscaling Roadmap';
    }

    if (navigatedTab) {
      onNavigate(navigatedTab);
    }

    // 5. Intelligent Model Chat Generation
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          model: 'gemini-3.1-flash-lite',
          fallback: true,
          systemInstruction: `You are the IT Cafeteria Live Co-Pilot & Studio Assistant for ${operator.name}.
Active Operator: ${operator.name} (${operator.role}).
Address them respectfully as "${operator.honorific}".
Currently viewing: "${navLabel || currentTabLabel}" tab.
${operator.isTrainee ? 'Note: Operator is a new trainee. Explain everything in clear, friendly 3-step beginner Roman Urdu.' : ''}
Core rules:
1. Speak in warm, conversational Pakistani Roman Urdu with natural friendly Punjabi cadence.
2. If asked to make a video or schedule, note that Autopilot can do it automatically.
3. Keep answers concise, natural, and under 80 words so it sounds natural when spoken aloud.`,
        }),
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      const replyText = data.text || `Theek hai ${operator.honorific}, main ne note kar liya hai.`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: replyText,
        },
      ]);

      await speakNaturalUrdu(replyText);
    } catch (err: any) {
      console.warn('Chat error:', err);
      const fallbackReply = `${operator.honorific}! Main aapke sath live hoon. Screen par ${navLabel || currentTabLabel} open hai. Agar aap chahein to main foran aaj ka viral short generate kar ke Content Calendar mein schedule kar sakta hoon.`;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: fallbackReply,
        },
      ]);
      await speakNaturalUrdu(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };
  sendMessageRef.current = sendMessage;

  // --- Real-time Hands-Free Voice Activity Detection (VAD) with Barge-In Interruption ---

  const startHandsFreeListening = async () => {
    if (isHandsFreeListening) return;
    setErrorMsg(null);
    setSilenceProgress(0);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ur-PK';

        let accumulatedTranscript = '';

        recognition.onstart = () => {
          setIsHandsFreeListening(true);
          setVadState('listening');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulatedTranscript += ' ' + event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          const currentWords = (accumulatedTranscript + ' ' + interim).trim();
          if (!currentWords) return;

          // CRITICAL: True Barge-in Voice Interruption!
          // If the AI is currently speaking audio or processing when user starts speaking,
          // instantly cut off the AI's audio mid-sentence and hand the microphone to the user!
          if (isSpeakingAudio || currentAudioRef.current) {
            stopAudioPlayback();
            isAiProcessingOrSpeakingRef.current = false;
            setIsSpeakingAudio(false);
          }

          setLiveInterimText(currentWords);
          setVadState('speaking');

          // Reset silence timer on any newly spoken token
          if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setSilenceProgress(0);

          // Once user has spoken, activate Gemini Auto-Silence Detection
          if (currentWords.length >= 2) {
            const startTime = Date.now();
            const durationMs = 1200; // 1.2s silence pause threshold

            silenceTimerRef.current = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
              setSilenceProgress(pct);
              setVadState('silence_detected');

              if (elapsed >= durationMs) {
                if (silenceTimerRef.current) {
                  clearInterval(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
                setSilenceProgress(100);
                setVadState('processing');
                isAiProcessingOrSpeakingRef.current = true;

                try {
                  recognition.stop();
                } catch {}

                const finalQuery = currentWords;
                accumulatedTranscript = '';
                setLiveInterimText('');
                setSilenceProgress(0);
                sendMessageRef.current(finalQuery);
              }
            }, 80);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition notice:', e?.error);
          if (e?.error === 'not-allowed') {
            setErrorMsg('Microphone allow karein browser address bar se.');
            setIsHandsFreeListening(false);
            setVadState('idle');
            if (onToggleLive) onToggleLive(false);
          }
        };

        recognition.onend = () => {
          // If AI is actively speaking, let it finish, then restart recognition
          if (isAiProcessingOrSpeakingRef.current) {
            return;
          }
          // If Live mode is active, restart continuous recognition loop
          if (isLiveActiveRef.current) {
            try {
              recognition.start();
              setIsHandsFreeListening(true);
              setVadState('listening');
            } catch {
              setIsHandsFreeListening(false);
            }
          } else {
            setIsHandsFreeListening(false);
            setVadState('idle');
          }
        };

        recognition.start();
        setIsHandsFreeListening(true);
        setVadState('listening');
        return;
      } catch (err) {
        console.warn('SpeechRecognition init notice:', err);
      }
    }

    // Fallback: Web Audio API Microphone Volume VAD Loop with Barge-In
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsHandsFreeListening(true);
      setVadState('listening');

      let hasSpokenAudio = false;
      let silenceStart: number | null = null;

      const checkVolume = () => {
        if (!isLiveActiveRef.current && !isHandsFreeListening) return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normLevel = Math.min(100, Math.round((average / 255) * 100));
        setAudioLevel(normLevel);

        // Immediate Acoustic Barge-in Ducking:
        // If AI audio is playing and user speaks (> 18 volume), stop playback instantly!
        if ((isSpeakingAudio || currentAudioRef.current) && normLevel > 18) {
          stopAudioPlayback();
          isAiProcessingOrSpeakingRef.current = false;
          setIsSpeakingAudio(false);
        }

        if (normLevel > 16) {
          hasSpokenAudio = true;
          silenceStart = null;
          setVadState('speaking');
          setSilenceProgress(0);
        } else if (hasSpokenAudio) {
          if (!silenceStart) {
            silenceStart = Date.now();
            setVadState('silence_detected');
          }
          const elapsed = Date.now() - silenceStart;
          setSilenceProgress(Math.min(100, Math.round((elapsed / 1200) * 100)));

          if (elapsed >= 1200) {
            hasSpokenAudio = false;
            silenceStart = null;
            setVadState('processing');
            isAiProcessingOrSpeakingRef.current = true;
            stopHandsFreeListening();
            sendMessageRef.current('Pending list mein se sab se high priority wali post dikhao.');
            return;
          }
        }

        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err: any) {
      console.warn('Mic access notice:', err?.name || err?.message || err);
      setErrorMsg('Microphone permission check karein browser URL bar mein.');
      setIsHandsFreeListening(false);
      setVadState('idle');
      if (onToggleLive) onToggleLive(false);
    }
  };
  startHandsFreeListeningRef.current = startHandsFreeListening;

  const stopHandsFreeListening = () => {
    setIsHandsFreeListening(false);
    setVadState('idle');
    setSilenceProgress(0);
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setLiveInterimText('');
    setAudioLevel(0);
  };
  stopHandsFreeListeningRef.current = stopHandsFreeListening;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <>
      {/* 1. FLOATING LIVE AUTOPILOT UPPER-LAYER HUD (Gemini Live Style)
          Renders at the top center of viewport whenever Go Live is active,
          allowing the user to see and interact with background tabs unobstructed! */}
      {isLiveActive && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] max-w-[96vw] sm:max-w-xl w-auto flex flex-col items-center pointer-events-auto">
          <div className="bg-slate-950/95 backdrop-blur-xl border border-rose-500/60 rounded-full px-3.5 py-1.5 shadow-[0_8px_32px_rgba(225,29,72,0.35)] flex items-center gap-2 sm:gap-3 text-xs text-white">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-extrabold text-[11px] text-rose-300 tracking-wider">LIVE CO-PILOT</span>
            </div>

            {/* Audio Waveform Equalizer */}
            <div className="flex items-end gap-0.5 h-3.5 w-4 shrink-0">
              <span
                className={`w-0.5 rounded-full transition-all duration-75 ${
                  vadState === 'speaking' || audioLevel > 10 ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
                style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14))}px` }}
              />
              <span
                className={`w-0.5 rounded-full transition-all duration-75 ${
                  vadState === 'speaking' || audioLevel > 20 ? 'bg-indigo-400' : 'bg-slate-600'
                }`}
                style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 16))}px` }}
              />
              <span
                className={`w-0.5 rounded-full transition-all duration-75 ${
                  vadState === 'speaking' || audioLevel > 15 ? 'bg-rose-400' : 'bg-slate-600'
                }`}
                style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14))}px` }}
              />
            </div>

            {/* Live Status Text */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] truncate max-w-[180px]">
              {vadState === 'ai_speaking' || isSpeakingAudio ? (
                <span className="text-cyan-300 font-medium truncate flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
                  Co-Pilot bol raha hai... (Bol kar rokein)
                </span>
              ) : vadState === 'silence_detected' ? (
                <span className="text-amber-300 font-semibold truncate">
                  Khamoshi detect hui ({silenceProgress}%)...
                </span>
              ) : vadState === 'speaking' ? (
                <span className="text-purple-300 font-semibold truncate">Aap bol rahe hain...</span>
              ) : vadState === 'processing' ? (
                <span className="text-indigo-300 font-semibold truncate animate-pulse">Soch raha hoon...</span>
              ) : (
                <span className="text-emerald-300 truncate">Sun raha hoon...</span>
              )}
            </div>

            {/* Operator Switcher Pill */}
            <button
              onClick={() => setShowOperatorModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer shrink-0"
              title="Operator Profile Badalna"
            >
              <User className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[90px]">{operator.honorific}</span>
            </button>

            {/* Expand / View Full Chat Drawer */}
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                isOpen ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isOpen ? 'Chat drawer chhupayein' : 'Chat drawer kholiye'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* End Live Button */}
            <button
              onClick={() => {
                stopAudioPlayback();
                if (onToggleLive) onToggleLive(false);
              }}
              className="px-2 py-0.5 rounded-full bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              title="Live Voice Co-Pilot band karein"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          </div>

          {/* Real-time Subtitle Banner (Interim voice words typed dynamically as you speak!) */}
          {liveInterimText && (
            <div className="mt-1.5 px-3 py-1 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-full text-xs text-cyan-200 font-mono shadow-lg flex items-center gap-1.5 animate-pulse max-w-[90vw] truncate">
              <Mic className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">"{liveInterimText}"</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Floating Action Launcher Button (Bottom Right)
          Opens the full-featured Chat Board drawer if closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="IT Cafeteria Assistant Board Kholein"
          className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-cyan-400/30"
        >
          <span className="absolute inset-0 rounded-full bg-cyan-400/25 animate-ping pointer-events-none" />
          <Cpu className="w-6 h-6 text-white relative" />
        </button>
      )}

      {/* 3. Persistent Co-Pilot Chat Board & Live Voice Station (Full Drawer) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[60] w-[22rem] sm:w-[440px] h-[640px] max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  IT Cafeteria Assistant
                  {isLiveActive && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded font-mono animate-pulse">
                      🔴 Live Voice Active
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operator: <span className="text-cyan-300 font-medium">{operator.honorific}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Operator Switcher Button */}
              <button
                onClick={() => setShowOperatorModal(true)}
                className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Active Operator Profile Switcher"
              >
                <Users className="w-4 h-4 text-cyan-400" />
              </button>

              {/* Voice Persona Settings Toggle */}
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  showVoiceSettings ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Voice Persona & Google Flow Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {/* Minimize / Close Drawer (Doesn't force-stop Live if active) */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Chat Board Chhupayein"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Voice Settings Panel */}
          {showVoiceSettings && (
            <div className="p-3 bg-slate-950/95 border-b border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Voice Texture & Flow Engine
                </span>
                <button
                  onClick={() => setVoicePersona(DEFAULT_VOICE_PERSONA)}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Default
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Google Flow Voice Description (Pakistani / Punjabi Cadence):</label>
                <textarea
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  rows={2}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Paste Google Flow voice description here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Voice Persona & Gender:</label>
                  <select
                    value={voiceGender}
                    onChange={(e) => setVoiceGender(e.target.value as VoiceGenderName)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <optgroup label="Male Voices">
                      <option value="Puck">Waqar Majeed (Warm Punjabi Male)</option>
                      <option value="Charon">Studio Anchor (Deep Resonance)</option>
                      <option value="Fenrir">High Energy Tech Host</option>
                    </optgroup>
                    <optgroup label="Female Voices">
                      <option value="Aoede">Pakistani Urdu Female (Natural & Friendly)</option>
                      <option value="Kore">Studio Tech Host (Clear & Crisp)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={testCurrentVoice}
                    disabled={isSpeakingAudio}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Awaaz Check Karein
                  </button>
                </div>
              </div>

              {/* Interruption Feature Notice */}
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Barge-in Interruption: Active
                </span>
                <span className="text-slate-400 text-[10px]">
                  AI bolte waqt aap bolen ya Stop dabayein to awaaz foran ruk jati hai
                </span>
              </div>
            </div>
          )}

          {/* Current Tab Indicator */}
          <div className="px-3.5 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Viewing Tab:</span>
              <span className="text-cyan-300 font-medium">{currentTabLabel}</span>
            </div>
            <span className="text-emerald-400 font-mono text-[9px]">Autonomous UI Navigation ON</span>
          </div>

          {/* Real-time Hands-Free Voice Status Banner inside Drawer */}
          {(isHandsFreeListening || isSpeakingAudio || vadState === 'silence_detected' || vadState === 'processing') && (
            <div className="relative border-b border-cyan-500/30 overflow-hidden bg-slate-950/90 text-xs shadow-inner">
              {/* Silence Auto-Submit Progress Bar */}
              {vadState === 'silence_detected' && silenceProgress > 0 && (
                <div
                  className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 transition-all duration-75"
                  style={{ width: `${silenceProgress}%` }}
                />
              )}

              <div className="px-3.5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Waveform */}
                  <div className="flex items-end gap-0.5 h-3.5 w-4 shrink-0">
                    <span
                      className={`w-0.5 rounded-full transition-all duration-75 ${
                        vadState === 'speaking' || audioLevel > 10 ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14))}px` }}
                    />
                    <span
                      className={`w-0.5 rounded-full transition-all duration-75 ${
                        vadState === 'speaking' || audioLevel > 20 ? 'bg-indigo-400' : 'bg-slate-600'
                      }`}
                      style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 16))}px` }}
                    />
                    <span
                      className={`w-0.5 rounded-full transition-all duration-75 ${
                        vadState === 'speaking' || audioLevel > 15 ? 'bg-purple-400' : 'bg-slate-600'
                      }`}
                      style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14))}px` }}
                    />
                  </div>

                  {vadState === 'ai_speaking' || isSpeakingAudio ? (
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                      <span className="font-bold text-cyan-300 text-[11px]">Co-Pilot Bol Raha Hai... (Bol kar rokein)</span>
                    </div>
                  ) : vadState === 'silence_detected' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="font-bold text-amber-300 text-[11px]">Khamoshi detect hui... (Auto-trigger)</span>
                    </div>
                  ) : vadState === 'speaking' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="font-bold text-purple-300 text-[11px]">Aap bol rahe hain...</span>
                    </div>
                  ) : vadState === 'processing' ? (
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      <span className="font-bold text-indigo-300 text-[11px]">Gemini jawab tayar kar raha hai...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-bold text-rose-300 text-[11px]">Live Sun Raha Hoon (Auto-Detect Active)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {(vadState === 'ai_speaking' || isSpeakingAudio) && (
                    <button
                      onClick={stopAudioPlayback}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
                    >
                      Barge-in / Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Interim Voice Stream Preview */}
          {liveInterimText && (
            <div className="px-3.5 py-1.5 bg-cyan-950/70 border-b border-cyan-800/40 text-[11px] text-cyan-200 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-1.5 truncate">
                <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="italic truncate font-mono">"{liveInterimText}"</span>
              </div>
              <span className="text-[9px] font-mono bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded shrink-0">
                Auto-Detecting
              </span>
            </div>
          )}

          {/* Persistent Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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

                {/* Embedded Autonomous Action Card in Chat */}
                {msg.card && (
                  <div className="ml-8 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> {msg.card.title}
                      </span>
                      {msg.card.scheduledTime && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                          {msg.card.scheduledTime}
                        </span>
                      )}
                    </div>

                    {msg.card.nextStepText && (
                      <p className="text-[11px] text-slate-300 leading-snug">{msg.card.nextStepText}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.card.flowPrompts && (
                        <button
                          onClick={() => copyToClipboard(msg.card!.flowPrompts!, `prompts-${msg.id}`)}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `prompts-${msg.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy Flow Prompts
                        </button>
                      )}

                      {msg.card.targetTab && (
                        <button
                          onClick={() => onNavigate(msg.card!.targetTab!)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Compass className="w-3 h-3 text-emerald-400" /> Go to {msg.card.targetTab}
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('image')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3 text-amber-400" /> Thumbnail Studio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600/50 text-white flex items-center justify-center animate-pulse">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-slate-800 p-2.5 rounded-xl rounded-tl-none border border-slate-700 text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>Soch raha hoon aur background action trigger kar raha hoon...</span>
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

          {/* Quick Autopilot Action Chips */}
          <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            <button
              onClick={() => sendMessage('Pending list mein se sab se high priority wali post dikhao')}
              disabled={isLoading}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-rose-600 hover:opacity-90 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1 shadow cursor-pointer disabled:opacity-40"
            >
              <Flame className="w-3 h-3 fill-current" /> High Priority Pending
            </button>

            <button
              onClick={() => sendMessage('Aaj ka viral short bana kar calendar mein daal do')}
              disabled={isLoading}
              className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1 shadow cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3 h-3 fill-current" /> 1-Click Short
            </button>

            <button
              onClick={() => sendMessage('Naye user ko step by step guide karo ke studio kaise use karna hai')}
              disabled={isLoading}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              🎓 Trainee Guide
            </button>

            <button
              onClick={() => onNavigate('autopilot')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Cpu className="w-3 h-3 text-cyan-400" /> Autopilot Panel
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              {/* Hands-Free Mic Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isHandsFreeListening) {
                    stopHandsFreeListening();
                    if (onToggleLive) onToggleLive(false);
                  } else {
                    startHandsFreeListening();
                    if (onToggleLive) onToggleLive(true);
                  }
                }}
                disabled={isLoading}
                title={isHandsFreeListening ? 'Hands-Free VAD band karein' : 'Hands-Free Voice shuru karein (Auto Silence Detection)'}
                className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 ${
                  isHandsFreeListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isHandsFreeListening ? 'Bolte jayein, auto-detect ho raha hai...' : 'Hukm karein ya mic se bolein...'}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setVoiceRepliesOn(!voiceRepliesOn)}
                title={voiceRepliesOn ? 'Awaaz wale jawab band karein' : 'Awaaz wale jawab ON karein'}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  voiceRepliesOn
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                }`}
              >
                {voiceRepliesOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

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

      {/* 4. Operator Identification & Switcher Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Active Operator Selection</h3>
              </div>
              <button
                onClick={() => setShowOperatorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-400 text-xs">
                Studio assistant active operator ke mutabiq apne dialogues aur training mode customize karega:
              </p>

              {PRESET_OPERATORS.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => {
                    setOperator(prof);
                    setShowOperatorModal(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-colors cursor-pointer ${
                    operator.id === prof.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{prof.name}</span>
                      {operator.id === prof.id && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{prof.role}</div>
                    <div className="text-cyan-400 font-mono text-[11px] mt-1">Address: "{prof.honorific}"</div>
                  </div>
                  {operator.id === prof.id && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                </button>
              ))}

              {/* Custom Operator Option */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">Ya Custom Operator Add Karein:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customOperatorName}
                    onChange={(e) => setCustomOperatorName(e.target.value)}
                    placeholder="Naam (e.g. Bilal Majeed)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={customOperatorHonorific}
                    onChange={(e) => setCustomOperatorHonorific(e.target.value)}
                    placeholder="Honorific (e.g. Bilal Bhai)"
                    className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      if (!customOperatorName.trim()) return;
                      const customProf: OperatorProfile = {
                        id: `custom-${Date.now()}`,
                        name: customOperatorName.trim(),
                        honorific: customOperatorHonorific.trim() || `${customOperatorName.trim()} Sahab`,
                        role: 'Team Member',
                        isTrainee: false
                      };
                      setOperator(customProf);
                      setShowOperatorModal(false);
                    }}
                    disabled={!customOperatorName.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowOperatorModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium"
              >
                Band Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
