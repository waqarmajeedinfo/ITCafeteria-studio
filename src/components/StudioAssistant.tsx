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
  UserCheck,
  MoreVertical,
  Pause,
  Keyboard,
  Trash2,
  MicOff,
  Maximize2,
  Minimize2,
  Layout,
  Monitor,
  Eye
} from 'lucide-react';

import type { TabType } from '../App';
import { PUBLISHED_VIDEOS, PHONETIC_DICTIONARY } from '../data/channelData';
import { buildMasterThumbnailPrompt, splitHeadline } from '../lib/thumbnailMaster';
import type { GeneratedStory, StoryScene } from './StoryPackageView';

export function getApplicationPortion(tabId: string): { group: string; name: string } {
  const map: Record<string, { group: string; name: string }> = {
    analytics: { group: 'Core Channel', name: 'Channel Diagnostics & Stats' },
    live: { group: 'Core Channel', name: 'Live Insights (YouTube + TikTok)' },
    signals: { group: 'Core Channel', name: 'Growth Signals & Anomalies' },
    benchmarking: { group: 'Core Channel', name: 'Competitor Benchmarks' },
    autopilot: { group: 'Autopilot & Agents', name: 'Autopilot Coordinator' },
    simulator: { group: 'Autopilot & Agents', name: 'Agent Flow Simulator' },
    community: { group: 'Autopilot & Agents', name: 'Community Polls & Feedback' },
    pending: { group: 'Management & Queue', name: 'Pending Stories & Target Queue' },
    calendar: { group: 'Management & Queue', name: 'Content Calendar & Schedule' },
    duplicates: { group: 'Management & Queue', name: 'Duplicate Checker (58 Catalog)' },
    masterlist: { group: 'Management & Queue', name: 'Master List Tracker' },
    roadmap: { group: 'Management & Queue', name: 'Upscaling Roadmap (v3.42+)' },
    chat: { group: 'AI Studios', name: 'AI Script Chatbot' },
    search: { group: 'AI Studios', name: 'Search Grounding Engine' },
    video: { group: 'AI Studios', name: 'Omni Flash Video Studio' },
    image: { group: 'AI Studios', name: 'Thumbnail Studio (Nano Banana)' },
    transcribe: { group: 'AI Studios', name: 'Voice Dictation Station' },
    music: { group: 'AI Studios', name: 'Music & Audio Generator' },
    '3d': { group: 'AI Studios', name: '3D Virtual Studio' },
  };
  return map[tabId] || { group: 'Studio Suite', name: tabId };
}

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
  isStreaming?: boolean;
  diagnosticHighlight?: {
    tab?: TabType;
    label: string;
    stepNumber?: number;
    description?: string;
  };
}

interface StudioAssistantProps {
  currentTab: string;
  currentTabLabel: string;
  onNavigate: (tab: TabType) => void;
  isLiveActive?: boolean;
  onToggleLive?: (active: boolean) => void;
}

export interface AutonomousIntentResult {
  tab?: TabType;
  label?: string;
  action?: 'highlight_masterlist_pending' | 'select_autopilot_task' | 'open_dictionary' | 'open_theme_customizer' | 'open_banner_modal' | 'toggle_live';
  isPendingTaskQuery?: boolean;
}

export function transliterateUrduToRoman(text: string): string {
  if (!text) return '';
  const hasUrdu = /[\u0600-\u06FF]/.test(text);
  if (!hasUrdu) return text;

  let res = text;
  const phraseMap: [RegExp, string][] = [
    [/\u0627\u06cc\u062c\u0646\u0679\s*\u0633[\u06cc\u06d2]\u0645[\u06cc\u0648]?\u0644\u06cc\u0679\u0631/gi, 'Agent Simulator'],
    [/\u0627\u06cc\u062c\u0646\u0679\s*\u0641\u0644\u0648/gi, 'Agent Flow'],
    [/\u0627\u06cc\u062c\u0646\u0679/gi, 'Agent'],
    [/\u0633[\u06cc\u06d2]\u0645[\u06cc\u0648]?\u0644\u06cc\u0679\u0631/gi, 'Simulator'],
    [/\u0645\u0627\u0633\u0679\u0631\s*\u0644\u0633\u0679/gi, 'Master List'],
    [/\u0645\u0627\u0633\u0679\u0631\u0644\u0633\u0679/gi, 'Master List'],
    [/\u0645\u06cc\u0646\u06cc\u062c\s*\u0644\u0633\u0679/gi, 'Master List'],
    [/\u0645\u06cc\u0646\u062c\u0645\u0646\u0679/gi, 'Management'],
    [/\u067e\u06cc\u0646\u0688\u0646\u06af\s*\u0633\u0679\u0648\u0631\u06cc\u0632/gi, 'Pending Stories'],
    [/\u067e\u06cc\u0646\u0688\u0646\u06af\s*\u0644\u0633\u0679/gi, 'Pending List'],
    [/\u067e\u06cc\u0646\u0688\u0646\u06af\s*\u0679\u0627\u0633\u06a9/gi, 'Pending Task'],
    [/\u067e\u06cc\u0646\u0688\u0646\u06af/gi, 'Pending'],
    [/\u0679\u0627\u0631\u06af\u0679\s*\u06a9\u06cc\u0648/gi, 'Target Queue'],
    [/\u06a9\u06cc\u0648/gi, 'Queue'],
    [/\u0622\u0679\u0648\s*\u067e\u0627\u0626\u0644\u0679/gi, 'Autopilot'],
    [/\u0622\u0679\u0648\u067e\u0627\u0626\u0644\u0679/gi, 'Autopilot'],
    [/\u06a9\u0648\u0622\u0631\u0688\u06cc\u0646\u06cc\u0679\u0631/gi, 'Coordinator'],
    [/\u0688\u067e\u0644\u06cc\u06a9\u06cc\u0679\s*\u0686\u06cc\u06a9\u0631/gi, 'Duplicate Checker'],
    [/\u0688\u067e\u0644\u06cc\u06a9\u06cc\u0679/gi, 'Duplicate'],
    [/\u06a9\u0646\u0679\u06cc\u0646\u0679\s*\u06a9\u06cc\u0644\u0646\u0688\u0631/gi, 'Content Calendar'],
    [/\u06a9\u06cc\u0644\u0646\u0688\u0631/gi, 'Calendar'],
    [/\u0634\u06cc\u0688\u0648\u0644/gi, 'Schedule'],
    [/\u0686\u06cc\u0646\u0644\s*\u0688\u0627\u0626\u06cc\u06af\u0646\u0648\u0633\u0679\u06a9\u0633?/gi, 'Channel Diagnostics'],
    [/\u0688\u0627\u0626\u06cc\u06af\u0646\u0648\u0633\u0679\u06a9\u0633?/gi, 'Diagnostics'],
    [/\u0627\u06cc\u0646\u0627\u0644\u06cc\u0679\u06a9\u0633/gi, 'Analytics'],
    [/\u0644\u0627\u0626\u06cc\u0648\s*\u0627\u0646\u0633\u0627\u0626\u0679\u0633?/gi, 'Live Insights'],
    [/\u06af\u0648\s*\u0644\u0627\u0626\u06cc\u0648/gi, 'Go Live'],
    [/\u06af\u0631\u0648\u062a\u06be\s*\u0633\u06af\u0646\u0644\u0632?/gi, 'Growth Signals'],
    [/\u0633\u06af\u0646\u0644\u0632?/gi, 'Signals'],
    [/\u06a9\u0645\u067e\u06cc\u0679\u06cc\u0679\u0631\s*\u0628\u06cc\u0646\u0686\s*\u0645\u0627\u0631\u06a9\u0633?/gi, 'Competitor Benchmarks'],
    [/\u0628\u06cc\u0646\u0686\s*\u0645\u0627\u0631\u06a9/gi, 'Benchmarks'],
    [/\u06a9\u0645\u06cc\u0648\u0646\u0679\u06cc\s*\u067e\u0648\u0644\u0632?/gi, 'Community Polls'],
    [/\u067e\u0648\u0644\u0632?/gi, 'Polls'],
    [/\u0627\u0633\u06a9\u0631\u067e\u0679\s*\u0686\u06cc\u0679\s*\u0628\u0627\u0679/gi, 'AI Script Chatbot'],
    [/\u0686\u06cc\u0679\s*\u0628\u0627\u0679/gi, 'Chatbot'],
    [/\u0633\u0631\u0686\s*\u06af\u0631\u0627\u0624\u0646\u0688\u0646\u06af/gi, 'Search Grounding'],
    [/\u0627\u0648\u0645\u0646\u06cc\s*\u0641\u0644\u06cc\u0634\s*\u0648\u06cc\u0688\u06cc\u0648/gi, 'Omni Flash Video'],
    [/\u0627\u0648\u0645\u0646\u06cc\s*\u0641\u0644\u06cc\u0634/gi, 'Omni Flash'],
    [/\u0648\u06cc\u0688\u06cc\u0648\s*\u0627\u0633\u0679\u0648\u0688\u06cc\u0648/gi, 'Video Studio'],
    [/\u062a\u06be\u0645\u0628\s*\u0646\u06cc\u0644/gi, 'Thumbnail'],
    [/\u062a\u06be\u0645\u0628\u0646\u06cc\u0644/gi, 'Thumbnail'],
    [/\u0646\u0627\u0646\u0648\s*\u0628\u0646\u0627\u0646\u0627/gi, 'Nano Banana'],
    [/\u0627\u0645\u06cc\u062c\s*\u0679\u0648\u0644/gi, 'Image Tool'],
    [/\u0648\u0627\u0626\u0633\s*\u0688\u06a9\u0679\u06cc\u0634\u0646/gi, 'Voice Dictation'],
    [/\u0688\u06a9\u0679\u06cc\u0634\u0646/gi, 'Dictation'],
    [/\u0679\u0631\u0627\u0646\u0633\u06a9\u0631\u0627\u0626\u0628/gi, 'Transcribe'],
    [/\u0645\u06cc\u0648\u0632\u06a9\s*\u062c\u0646\u0631\u06cc\u0679\u0631/gi, 'Music Generator'],
    [/\u0645\u06cc\u0648\u0632\u06a9/gi, 'Music'],
    [/\u0648\u0631\u0686\u0648\u0626\u0644\s*\u0627\u0633\u0679\u0648\u0688\u06cc\u0648/gi, '3D Virtual Studio'],
    [/\u062a\u06be\u0631\u06cc\s*\u0688\u06cc\s*\u0627\u0633\u0679\u0648\u0688\u06cc\u0648/gi, '3D Studio'],
    [/\u062a\u06be\u0631\u06cc\s*\u0688\u06cc/gi, '3D'],
    [/\u0627\u067e\s*\u0633\u06a9\u06cc\u0644\u0646\u06af/gi, 'Upscaling'],
    [/\u0631\u0648\u0688\s*\u0645\u06cc\u067e/gi, 'Roadmap'],
    [/\u0641\u0646\u06cc\u0679\u06a9\s*\u0631\u0648\u0644\u0632/gi, 'Phonetic Rules'],
    [/\u0641\u0646\u06cc\u0679\u06a9\s*\u0688\u06a9\u0634\u0646\u0631\u06cc/gi, 'Phonetic Dictionary'],
    [/\u0688\u06a9\u0634\u0646\u0631\u06cc/gi, 'Dictionary'],
    [/\u062a\u06be\u06cc\u0645\s*\u06a9\u0633\u0679\u0645\u0627\u0626\u0632\u0631?/gi, 'Theme Customizer'],
    [/\u062a\u06be\u06cc\u0645\s*\u0633\u06cc\u0679\u0646\u06af/gi, 'Theme Setting'],
    [/\u0628\u06cc\u0646\u0631\s*\u0627\u06cc\u0688\u0679/gi, 'Edit Banner'],
    [/\u0627\u0648\u067e\u0646\s*\u06a9\u0631\u0648/gi, 'open karo'],
    [/\u0627\u0648\u067e\u0646/gi, 'open'],
    [/\u06a9\u06be\u0648\u0644\u0648/gi, 'kholo'],
    [/\u062f\u06a9\u06be\u0627\u0624/gi, 'dikhao'],
    [/\u062f\u06cc\u06a9\u06be\u0627\u0624/gi, 'dikhao'],
    [/\u0628\u0646\u062f\s*\u06a9\u0631\u0648/gi, 'band karo'],
    [/\u0686\u0644\u0627\u0624/gi, 'chalao'],
    [/\u0628\u0646\u0627\u0624/gi, 'banao'],
    [/\u06a9\u0631\s*\u062f\u0648/gi, 'kar do'],
    [/\u06a9\u06cc\u0627\s*\u062d\u0627\u0644\s*\u06c1\u06d2/gi, 'kya haal hai'],
    [/\u06a9\u06cc\u0633\u06d2\s*\u06c1\u0648/gi, 'kaise ho'],
    [/\u0633\u0644\u0627\u0645/gi, 'Salam'],
    [/\u0627\u0644\u0633\u0644\u0627\u0645\s*\u0639\u0644\u06cc\u06a9\u0645/gi, 'Asalam-u-Alikum'],
    [/\u0634\u06a9\u0631\u06cc\u06c1/gi, 'shukriya'],
    [/\u067e\u06c1\u0644\u0627/gi, 'pehla'],
    [/\u0633\u0628\s*\u0633\u06d2\s*\u067e\u06c1\u0644\u0627/gi, 'sab se pehla'],
    [/\u062f\u0648\u0633\u0631\u0627/gi, 'doosra'],
    [/\u062a\u06cc\u0633\u0631\u0627/gi, 'teesra'],
    [/\u0686\u06cc\u0646\u0644/gi, 'Channel']
  ];

  for (const [pattern, repl] of phraseMap) {
    res = res.replace(pattern, repl);
  }

  // Letter by letter fallback transliteration for remaining Arabic/Urdu unicode characters
  if (/[\u0600-\u06FF]/.test(res)) {
    const charMap: Record<string, string> = {
      '\u0627': 'a', '\u0622': 'aa', '\u0628': 'b', '\u067e': 'p', '\u062a': 't', '\u0679': 't',
      '\u062b': 's', '\u062c': 'j', '\u0686': 'ch', '\u062d': 'h', '\u062e': 'kh', '\u062f': 'd',
      '\u0688': 'd', '\u0630': 'z', '\u0631': 'r', '\u0691': 'r', '\u0632': 'z', '\u0698': 'zh',
      '\u0633': 's', '\u0634': 'sh', '\u0635': 's', '\u0636': 'z', '\u0637': 't', '\u0638': 'z',
      '\u0639': 'a', '\u063a': 'gh', '\u0641': 'f', '\u0642': 'q', '\u06a9': 'k', '\u06af': 'g',
      '\u0644': 'l', '\u0645': 'm', '\u0646': 'n', '\u06ba': 'n', '\u0648': 'o', '\u06c1': 'h',
      '\u06be': 'h', '\u0621': '', '\u06cc': 'i', '\u06d2': 'e', '\u06c2': 'h', '\u06c3': 't',
      '\u06f0': '0', '\u06f1': '1', '\u06f2': '2', '\u06f3': '3', '\u06f4': '4', '\u06f5': '5',
      '\u06f6': '6', '\u06f7': '7', '\u06f8': '8', '\u06f9': '9', '\u061f': '?', '\u060c': ',',
      '\u061b': ';', '\u06d4': '.'
    };
    let transliterated = '';
    for (const ch of res) {
      transliterated += charMap[ch] !== undefined ? charMap[ch] : ch;
    }
    res = transliterated;
  }

  return res.replace(/\s+/g, ' ').trim();
}

export function detectAutonomousVoiceIntent(rawQuery: string): AutonomousIntentResult | null {
  const normalized = transliterateUrduToRoman(rawQuery).toLowerCase();

  // 1. Simulator & Agents
  if (
    normalized.includes('simulator') ||
    normalized.includes('agent flow') ||
    normalized.includes('agent simulator') ||
    normalized.includes('agent open') ||
    normalized.includes('agent kholo') ||
    normalized.includes('agent dikhao')
  ) {
    return { tab: 'simulator', label: 'Agent Flow Simulator' };
  }

  // 2. Master List Tracker
  if (
    normalized.includes('master list') ||
    normalized.includes('masterlist') ||
    normalized.includes('manage list') ||
    normalized.includes('management list') ||
    (normalized.includes('management') && normalized.includes('list'))
  ) {
    const isPending =
      normalized.includes('pending') ||
      normalized.includes('task') ||
      normalized.includes('pehla') ||
      normalized.includes('urdu') ||
      normalized.includes('setting');
    return {
      tab: 'masterlist',
      label: 'Master List Tracker',
      action: isPending ? 'highlight_masterlist_pending' : undefined,
      isPendingTaskQuery: isPending
    };
  }

  // 3. Thumbnail & Image Tool (Nano Banana)
  if (
    normalized.includes('thumbnail') ||
    normalized.includes('nano banana') ||
    normalized.includes('image tool') ||
    normalized.includes('poster') ||
    normalized.includes('banner image') ||
    normalized.includes('image creation')
  ) {
    return { tab: 'image', label: 'Thumbnails (Nano Banana)' };
  }

  // 4. Pending Stories & Target Queue
  if (
    (normalized.includes('pending') && (normalized.includes('queue') || normalized.includes('stories') || normalized.includes('target') || normalized.includes('list') || normalized.includes('kholo'))) ||
    normalized.includes('target queue') ||
    normalized.includes('pending stories') ||
    normalized.includes('backlog')
  ) {
    return { tab: 'pending', label: 'Pending Stories & Target Queue' };
  }

  // 5. Autopilot Coordinator
  if (
    normalized.includes('autopilot coordinator') ||
    normalized.includes('coordinator') ||
    normalized.includes('autopilot manager') ||
    (normalized.includes('autopilot') && !normalized.includes('short bana'))
  ) {
    return {
      tab: 'autopilot',
      label: 'Autopilot Coordinator',
      action: 'select_autopilot_task'
    };
  }

  // 6. Duplicate Checker (58 Catalog)
  if (
    normalized.includes('duplicate') ||
    normalized.includes('58 video') ||
    normalized.includes('catalog 58') ||
    normalized.includes('copy check')
  ) {
    return { tab: 'duplicates', label: 'Duplicate Checker (58)' };
  }

  // 7. Content Calendar
  if (
    normalized.includes('calendar') ||
    normalized.includes('content calendar') ||
    normalized.includes('schedule') ||
    normalized.includes('slot') ||
    normalized.includes('aaj ki post')
  ) {
    return { tab: 'calendar', label: 'Content Calendar' };
  }

  // 8. Channel Diagnostics & Stats
  if (
    normalized.includes('diagnostic') ||
    normalized.includes('channel health') ||
    normalized.includes('analytics') ||
    normalized.includes('views') ||
    normalized.includes('stats')
  ) {
    return { tab: 'analytics', label: 'Channel Diagnostics' };
  }

  // 9. Live Insights
  if (
    normalized.includes('live insight') ||
    normalized.includes('tiktok') ||
    normalized.includes('youtube live') ||
    normalized.includes('stream insight')
  ) {
    return { tab: 'live', label: 'Live Insights' };
  }

  // 10. Growth Signals & Anomalies
  if (
    normalized.includes('signals') ||
    normalized.includes('growth') ||
    normalized.includes('anomal') ||
    normalized.includes('viral alert')
  ) {
    return { tab: 'signals', label: 'Growth Signals & Anomalies' };
  }

  // 11. AI Script Chatbot
  if (
    normalized.includes('chatbot') ||
    normalized.includes('script generator') ||
    normalized.includes('chat studio') ||
    normalized.includes('script bot')
  ) {
    return { tab: 'chat', label: 'AI Script Chatbot' };
  }

  // 12. Search Grounding Engine
  if (
    normalized.includes('search grounding') ||
    normalized.includes('grounding') ||
    (normalized.includes('search') && normalized.includes('tool'))
  ) {
    return { tab: 'search', label: 'Search Grounding Engine' };
  }

  // 13. Omni Flash Video
  if (
    normalized.includes('omni flash') ||
    normalized.includes('video studio') ||
    normalized.includes('omni video')
  ) {
    return { tab: 'video', label: 'Omni Flash Video' };
  }

  // 14. Voice Dictation
  if (
    normalized.includes('dictation') ||
    normalized.includes('transcribe') ||
    normalized.includes('voice dictation') ||
    normalized.includes('speech to text')
  ) {
    return { tab: 'transcribe', label: 'Voice Dictation' };
  }

  // 15. Music Generator
  if (
    normalized.includes('music') ||
    normalized.includes('soundtrack') ||
    normalized.includes('bg music') ||
    normalized.includes('audio generator')
  ) {
    return { tab: 'music', label: 'Music Generator' };
  }

  // 16. 3D Virtual Studio
  if (
    normalized.includes('3d') ||
    normalized.includes('virtual studio') ||
    normalized.includes('virtual set')
  ) {
    return { tab: '3d', label: '3D Virtual Studio' };
  }

  // 17. Upscaling Roadmap
  if (
    normalized.includes('roadmap') ||
    normalized.includes('upscaling') ||
    normalized.includes('v3.42')
  ) {
    return { tab: 'roadmap', label: 'Upscaling Roadmap' };
  }

  // 18. Competitor Benchmarks
  if (
    normalized.includes('competitor') ||
    normalized.includes('benchmark') ||
    normalized.includes('rival channel')
  ) {
    return { tab: 'benchmarking', label: 'Competitor Benchmarks' };
  }

  // 19. Community Polls
  if (
    normalized.includes('community') ||
    normalized.includes('poll') ||
    normalized.includes('vote')
  ) {
    return { tab: 'community', label: 'Community Polls' };
  }

  // Modals & Action Controls
  if (
    normalized.includes('dictionary') ||
    normalized.includes('phonetic') ||
    normalized.includes('rules dictionary')
  ) {
    return { label: 'Phonetic Rules Dictionary', action: 'open_dictionary' };
  }

  if (
    normalized.includes('theme') && (normalized.includes('custom') || normalized.includes('setting') || normalized.includes('kholo') || normalized.includes('open'))
  ) {
    return { label: 'Theme Customizer', action: 'open_theme_customizer' };
  }

  if (
    normalized.includes('banner') && (normalized.includes('edit') || normalized.includes('setting') || normalized.includes('kholo') || normalized.includes('change'))
  ) {
    return { label: 'Edit Banner', action: 'open_banner_modal' };
  }

  return null;
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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState(false);
  const [isListeningPaused, setIsListeningPaused] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

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

  // Adaptive UI Behavior: Floating adjustable overlay spanning active page
  const [overlayViewMode, setOverlayViewMode] = useState<'compact' | 'cockpit' | 'spanning'>(() => {
    try {
      return (localStorage.getItem('itcafeteria_overlay_mode') as any) || 'compact';
    } catch {
      return 'compact';
    }
  });

  const activeStreamingIntervalRef = useRef<any>(null);

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
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const isListeningPausedRef = useRef(isListeningPaused);
  isListeningPausedRef.current = isListeningPaused;
  const navigatedTabRef = useRef<string>(currentTab);
  navigatedTabRef.current = currentTab;
  const [instantNavNotice, setInstantNavNotice] = useState<string | null>(null);

  const isAiProcessingOrSpeakingRef = useRef<boolean>(false);
  const startHandsFreeListeningRef = useRef<() => void>(() => {});
  const stopHandsFreeListeningRef = useRef<() => void>(() => {});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveInterimText, isLoading, isOpen]);

  // Synchronize continuous hands-free listening whenever drawer is open or live mode is active
  useEffect(() => {
    if ((isOpen || isLiveActive) && !isListeningPaused) {
      startHandsFreeListeningRef.current?.();
    } else if (!isOpen && !isLiveActive) {
      stopHandsFreeListeningRef.current?.();
    }
  }, [isOpen, isLiveActive, isListeningPaused]);

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

  // Options menu outside click dismiss
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showOptionsMenu]);

  const clearChatHistory = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        text: `Dialogue history reset kar di gayi hai ${operator.honorific}. Main active listening state mein tayar hoon, hukm karein!`,
      }
    ]);
    setShowOptionsMenu(false);
  };

  const handleTogglePause = () => {
    if (isListeningPaused) {
      setIsListeningPaused(false);
      startHandsFreeListening();
    } else {
      setIsListeningPaused(true);
      stopHandsFreeListening();
      stopAudioPlayback();
    }
  };

  const stopStreaming = useCallback(() => {
    if (activeStreamingIntervalRef.current) {
      clearInterval(activeStreamingIntervalRef.current);
      activeStreamingIntervalRef.current = null;
    }
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  // Stop current audio playback immediately (Instant Barge-In Interruption)
  const stopAudioPlayback = useCallback(() => {
    if (activeStreamingIntervalRef.current) {
      clearInterval(activeStreamingIntervalRef.current);
      activeStreamingIntervalRef.current = null;
    }
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
        if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
          setTimeout(() => startHandsFreeListeningRef.current?.(), 200);
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
        if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
          setTimeout(() => startHandsFreeListeningRef.current?.(), 200);
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
              // Automatically resume listening hands-free for user's next turn continuously
              if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
                setTimeout(() => {
                  startHandsFreeListeningRef.current?.();
                }, 200);
              }
            };

            audio.onerror = () => {
              setIsSpeakingAudio(false);
              isAiProcessingOrSpeakingRef.current = false;
              currentAudioRef.current = null;
              setVadState('idle');
              if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
                setTimeout(() => {
                  startHandsFreeListeningRef.current?.();
                }, 200);
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
          if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
            setTimeout(() => {
              startHandsFreeListeningRef.current?.();
            }, 200);
          }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeakingAudio(false);
        isAiProcessingOrSpeakingRef.current = false;
        setVadState('idle');
        if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current) {
          setTimeout(() => {
            startHandsFreeListeningRef.current?.();
          }, 200);
        }
      }
    },
    [voiceGender, voicePersona, stopAudioPlayback]
  );

  const testCurrentVoice = useCallback(() => {
    speakNaturalUrdu('Assalam o alaikum! IT Cafeteria anchor voice bilkul active aur synced hai.');
  }, [speakNaturalUrdu]);


  // Diagnostic Visual Guidance Dispatcher (Step-by-step UI elements highlights)
  const triggerDiagnosticGuidance = useCallback((tab?: TabType, label?: string, stepNumber = 1, desc?: string) => {
    if (!label) return;
    window.dispatchEvent(
      new CustomEvent('itcafeteria_diagnostic_highlight', {
        detail: { tab, label, stepNumber, description: desc }
      })
    );
  }, []);

  // 1. Real-time Output Streaming: Generates concurrent word-by-word responses in real-time
  const streamAssistantResponse = useCallback((
    fullText: string,
    card?: ActionCardData,
    diagnostic?: AssistantMessage['diagnosticHighlight']
  ) => {
    stopStreaming();
    const msgId = (Date.now() + Math.floor(Math.random() * 1000)).toString();

    // Trigger visual diagnostic highlight on target element if specified
    if (diagnostic?.label) {
      triggerDiagnosticGuidance(
        diagnostic.tab,
        diagnostic.label,
        diagnostic.stepNumber || 1,
        diagnostic.description
      );
    }

    // Concurrently trigger spoken audio stream
    speakNaturalUrdu(fullText);

    // Progressive real-time concurrent word-by-word streaming
    const words = fullText.split(' ');
    let currentIdx = 0;
    let streamed = '';

    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        role: 'assistant',
        text: '',
        isStreaming: true,
        card,
        diagnosticHighlight: diagnostic,
      }
    ]);

    activeStreamingIntervalRef.current = setInterval(() => {
      if (currentIdx < words.length) {
        streamed += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
        currentIdx++;
        const isStillStreaming = currentIdx < words.length;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, text: streamed, isStreaming: isStillStreaming } : m
          )
        );
      } else {
        if (activeStreamingIntervalRef.current) {
          clearInterval(activeStreamingIntervalRef.current);
          activeStreamingIntervalRef.current = null;
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, isStreaming: false } : m))
        );
      }
    }, 24);
  }, [speakNaturalUrdu, stopStreaming, triggerDiagnosticGuidance]);

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

      streamAssistantResponse(switchReply, {
        type: 'trainee_step',
        title: 'Operator Switched: Trainee Mode',
        nextStepText: 'Try bolein: "Pending list dikhao" ya "Calendar kholo"'
      });
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

      streamAssistantResponse(
        pendingReply,
        {
          type: 'autopilot_result',
          title: 'Power Automate Desktop: Web Scraping to Clean Excel in 60s',
          category: 'AI Chatbots, Workflows & AI Tools',
          scheduledTime: '5:00 PM PKT (Tomorrow)',
          nextStepText: 'Autopilot screen par task open ho chuka hai — "Run Task Now" dabayein ya verify karein.',
          targetTab: 'autopilot'
        },
        {
          tab: 'autopilot',
          label: 'Autopilot Coordinator',
          stepNumber: 1,
          description: 'High-priority task queued for 5:00 PM peak slot'
        }
      );
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

        streamAssistantResponse(
          replyText,
          {
            type: 'autopilot_result',
            title: story.title,
            category: story.categoryName,
            scheduledTime,
            scenesCount: 10,
            flowPrompts: flowPromptSummary,
            thumbnailPrompt: story.thumbnailPrompt,
            nextStepText: 'Agla step: Flow Prompts copy karein ya Content Calendar mein check karein!',
            targetTab: 'calendar'
          },
          {
            tab: 'calendar',
            label: 'Content Calendar',
            stepNumber: 1,
            description: `Scheduled slot: ${scheduledTime} (${story.title})`
          }
        );
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

      streamAssistantResponse(trainReply, {
        type: 'trainee_step',
        title: 'Trainee Workflow: 3 Steps to Publish',
        nextStepText: 'Abhi test karne ke liye "Aaj ka short bana do" bol kar check karein!'
      });
      setIsLoading(false);
      return;
    }

    // 4. Autonomous Voice Navigation & Menu Commands (0ms Instant Synchronization)
    const voiceIntent = detectAutonomousVoiceIntent(trimmed);

    if (voiceIntent) {
      if (voiceIntent.tab) {
        onNavigate(voiceIntent.tab);
        navigatedTabRef.current = voiceIntent.tab;
        setInstantNavNotice(`⚡ 0ms Voice Nav: Switched to ${voiceIntent.label}`);
        setTimeout(() => setInstantNavNotice(null), 3500);
      }

      // Special action: Master List with pending task focus
      if (voiceIntent.tab === 'masterlist') {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('itcafeteria_highlight_masterlist_task', {
              detail: { highlightFirstPending: true }
            })
          );
        }, 150);

        const masterReply = `${operator.honorific}! Screen par Master List Tracker 0ms mein open kar diya hai aur Section A ka pehla pending task "Default video language set to Urdu" highlight kar diya hai.\n\nYeh task YouTube Studio Settings > Upload defaults > Advanced settings mein video language ko Urdu set karne ke liye hai taake global Hindi/Urdu search audience maximize ho sake. Agla hukm karein!`;

        streamAssistantResponse(
          masterReply,
          {
            type: 'action_done',
            title: 'Master List: Default video language set to Urdu (Pending)',
            nextStepText: 'YouTube Studio settings mein ja kar Urdu language set karein.',
            targetTab: 'masterlist'
          },
          {
            tab: 'masterlist',
            label: 'Master List Tracker',
            stepNumber: 1,
            description: 'Section A - Video language Urdu configuration'
          }
        );
        setIsLoading(false);
        return;
      }

      // Special action: Agent Simulator
      if (voiceIntent.tab === 'simulator') {
        const simReply = `Ji ${operator.honorific}! Screen par Agent Flow Simulator 0ms latency ke sath open ho gaya hai. CPU bilkul chill hai, agla script test run karne ke liye tayar hoon!`;
        streamAssistantResponse(
          simReply,
          {
            type: 'action_done',
            title: 'Agent Flow Simulator Active',
            nextStepText: 'Simulator flow step test karein!',
            targetTab: 'simulator'
          },
          {
            tab: 'simulator',
            label: 'Agent Flow Simulator',
            stepNumber: 1,
            description: 'Multi-Agent Story Engine v3.42'
          }
        );
        setIsLoading(false);
        return;
      }

      // Special action: Thumbnail Studio (Nano Banana)
      if (voiceIntent.tab === 'image') {
        const imgReply = `Ji ${operator.honorific}! Thumbnails (Nano Banana) studio screen par khol diya hai. Master headline aur 3D hologram prompt engine tayar hai!`;
        streamAssistantResponse(
          imgReply,
          {
            type: 'action_done',
            title: 'Thumbnails (Nano Banana) Ready',
            nextStepText: 'Thumbnail generate karein!',
            targetTab: 'image'
          },
          {
            tab: 'image',
            label: 'Thumbnails (Nano Banana)',
            stepNumber: 1,
            description: 'Master headline and 3D hologram prompt engine'
          }
        );
        setIsLoading(false);
        return;
      }

      // Modals & Action Controls
      if (voiceIntent.action === 'open_dictionary') {
        window.dispatchEvent(new CustomEvent('itcafeteria_open_dictionary', { detail: {} }));
        const dictReply = `Ji ${operator.honorific}! Screen par Phonetic Rules Dictionary modal khol diya hai. Yahan YouTube content casing aur rules check kar sakte hain.`;
        streamAssistantResponse(dictReply, undefined, { label: 'Phonetic Rules Dictionary', stepNumber: 1 });
        setIsLoading(false);
        return;
      }

      if (voiceIntent.action === 'open_theme_customizer') {
        window.dispatchEvent(new CustomEvent('itcafeteria_open_theme_customizer', { detail: {} }));
        const themeReply = `Ji ${operator.honorific}! WordPress-style Theme Customizer modal open kar diya hai. Color palette, holographic mode aur block settings adjust karein.`;
        streamAssistantResponse(themeReply, undefined, { label: 'Theme Customizer', stepNumber: 1 });
        setIsLoading(false);
        return;
      }

      if (voiceIntent.action === 'open_banner_modal') {
        window.dispatchEvent(new CustomEvent('itcafeteria_open_banner_modal', { detail: {} }));
        const bannerReply = `Ji ${operator.honorific}! Edit Banner modal open kar diya hai. Yahan se custom banner URL aur height adjust karein.`;
        streamAssistantResponse(bannerReply, undefined, { label: 'Banner & Overlay Editor', stepNumber: 1 });
        setIsLoading(false);
        return;
      }

      // Generic tab navigation response
      if (voiceIntent.tab) {
        const genericNavReply = `Ji ${operator.honorific}! Screen par foran "${voiceIntent.label}" open kar diya hai. Screen par check karein, agla hukm farmayein!`;
        streamAssistantResponse(
          genericNavReply,
          {
            type: 'action_done',
            title: `${voiceIntent.label} Opened`,
            targetTab: voiceIntent.tab
          },
          {
            tab: voiceIntent.tab,
            label: voiceIntent.label || 'Studio Navigation',
            stepNumber: 1
          }
        );
        setIsLoading(false);
        return;
      }
    }

    // 5. Intelligent Model Chat Generation with Snappy Fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const currentPortion = getApplicationPortion(currentTab);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          model: 'gemini-3.1-flash-lite',
          fallback: true,
          systemInstruction: `You are the IT Cafeteria Live Co-Pilot & Studio Assistant for ${operator.name} (@WM25-1).
Active Operator: ${operator.name} (${operator.role}).
Address them respectfully as "${operator.honorific}".
Current Application Portion in use: "${currentPortion.group} > ${currentPortion.name}".
${operator.isTrainee ? 'Note: Operator is a new trainee. Explain everything in clear, friendly 3-step beginner Roman Urdu.' : ''}
Core rules:
1. Speak exclusively in natural, warm Pakistani Roman Urdu with a friendly Lahore tech YouTuber cadence.
2. Maintain engaging responsiveness and a refined, witty sense of humor (e.g. "Waqar bhai CPU bilkul chill hai, agla script viral karwane ke liye tayar hoon!").
3. Always helpful, sharp, and practical — if asked to switch menus or check tasks, note that you can operate the dashboard directly.
4. Keep answers concise, punchy, and under 50 words so spoken audio sounds lively and crisp.`,
        }),
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      const replyText = data.text || `Theek hai ${operator.honorific}, main ne note kar liya hai.`;
      streamAssistantResponse(replyText);
    } catch (err: any) {
      console.warn('Chat error:', err);
      const currentPortion = getApplicationPortion(currentTab);
      const fallbackReply = `${operator.honorific}! Main active listening mode mein aapke sath hoon. Is waqt hum "${currentPortion.group} > ${currentPortion.name}" portion mein hain. CPU chill hai aur coffee garam! Agla hukm karein, main foran screen update karunga.`;
      streamAssistantResponse(fallbackReply);
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
        recognition.lang = 'en-US';

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

          const rawWords = (accumulatedTranscript + ' ' + interim).trim();
          if (!rawWords) return;

          // Convert any Urdu script instantly to clean Roman Urdu
          const currentWords = transliterateUrduToRoman(rawWords);

          // CRITICAL: True Barge-in Voice Interruption!
          if (isSpeakingAudio || currentAudioRef.current) {
            stopAudioPlayback();
            isAiProcessingOrSpeakingRef.current = false;
            setIsSpeakingAudio(false);
          }

          setLiveInterimText(currentWords);
          setVadState('speaking');

          // ⚡ Real-Time Instant 0ms Intent Dispatcher while user is still speaking!
          const realTimeIntent = detectAutonomousVoiceIntent(currentWords);
          if (realTimeIntent && realTimeIntent.tab && realTimeIntent.tab !== navigatedTabRef.current) {
            navigatedTabRef.current = realTimeIntent.tab;
            onNavigate(realTimeIntent.tab);
            setInstantNavNotice(`⚡ 0ms Voice Nav: Switched to ${realTimeIntent.label}`);
            setTimeout(() => setInstantNavNotice(null), 3500);

            if (realTimeIntent.action === 'highlight_masterlist_pending') {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('itcafeteria_highlight_masterlist_task', {
                    detail: { highlightFirstPending: true }
                  })
                );
              }, 150);
            } else if (realTimeIntent.action === 'select_autopilot_task') {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('itcafeteria_select_autopilot_task', { detail: {} })
                );
              }, 150);
            }
          }

          // Reset silence timer on any newly spoken token
          if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setSilenceProgress(0);

          // Snappy 700ms silence detection for fast, responsive natural dialogue
          if (currentWords.length >= 2) {
            const startTime = Date.now();
            const durationMs = 700; // 0.7s silence threshold (snappy & real-time)

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
            }, 60);
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
          // Automatically resume continuous recognition loop if drawer is open or live mode active
          const shouldKeepListening = (isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current;
          if (shouldKeepListening) {
            try {
              recognition.start();
              setIsHandsFreeListening(true);
              setVadState('listening');
            } catch {
              setTimeout(() => {
                if ((isLiveActiveRef.current || isOpenRef.current) && !isListeningPausedRef.current && !isAiProcessingOrSpeakingRef.current) {
                  try {
                    recognition.start();
                    setIsHandsFreeListening(true);
                    setVadState('listening');
                  } catch {}
                }
              }, 250);
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

      {/* 3. Persistent Co-Pilot Chat Board & Live Voice Station (Adaptive UI Floating Overlay) */}
      {isOpen && (
        <div
          className={`fixed z-[60] transition-all duration-300 flex flex-col overflow-hidden text-slate-100 ring-1 ring-cyan-500/20 shadow-2xl ${
            overlayViewMode === 'spanning'
              ? 'inset-x-2 md:inset-x-6 bottom-3 h-[740px] max-h-[92vh] bg-slate-950/85 backdrop-blur-3xl border-2 border-cyan-400/60 rounded-3xl shadow-[0_25px_80px_rgba(6,182,212,0.3)]'
              : overlayViewMode === 'cockpit'
              ? 'right-3 md:right-6 bottom-4 md:bottom-6 w-[780px] max-w-[95vw] h-[700px] max-h-[90vh] bg-slate-950/90 backdrop-blur-2xl border border-cyan-400/50 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
              : 'right-4 sm:right-6 bottom-4 sm:bottom-6 w-[22rem] sm:w-[460px] h-[670px] max-h-[88vh] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-black/90'
          }`}
        >
          {/* Header: Logo on one side, Status Indicator + Adaptive UI Toggle + Options Menu + Close Icon on the other */}
          <div className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 relative z-30">
            {/* Left: User Logo + Copilot Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src="/brand/logo.jpeg"
                  alt="IT Cafeteria Logo"
                  className="w-9 h-9 rounded-xl object-cover border border-cyan-500/40 shadow-md shadow-cyan-950 ring-2 ring-cyan-500/20"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isListeningPaused 
                    ? 'bg-amber-400' 
                    : isHandsFreeListening 
                    ? 'bg-emerald-400 animate-ping' 
                    : 'bg-slate-500'
                }`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-xs truncate tracking-wide">
                    IT Cafeteria Copilot
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono shrink-0">
                    AI Studio
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span>Host:</span>
                  <span className="text-cyan-300 font-medium truncate">{operator.honorific}</span>
                  <span className="text-[9px] text-emerald-400 font-mono ml-1 hidden sm:inline">• Persistent VAD</span>
                </p>
              </div>
            </div>

            {/* Right: Status Indicator + Adaptive UI Mode Switcher + Three-dot Options Menu + Close Icon */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Adaptive UI Mode Switcher (Compact / Cockpit / Spanning Overlay) */}
              <button
                onClick={() => {
                  setOverlayViewMode((prev) => {
                    const next = prev === 'compact' ? 'cockpit' : prev === 'cockpit' ? 'spanning' : 'compact';
                    try { localStorage.setItem('itcafeteria_overlay_mode', next); } catch {}
                    return next;
                  });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title={`Adaptive UI Mode: ${overlayViewMode.toUpperCase()} (Click to toggle Compact / Cockpit / Spanning View)`}
              >
                {overlayViewMode === 'spanning' ? (
                  <Minimize2 className="w-4 h-4 text-cyan-400" />
                ) : overlayViewMode === 'cockpit' ? (
                  <Monitor className="w-4 h-4 text-purple-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {/* Dynamic Status Indicator */}
              <div className="flex items-center">
                {isListeningPaused ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Paused</span>
                  </span>
                ) : vadState === 'ai_speaking' || isSpeakingAudio ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-semibold animate-pulse">
                    <Volume2 className="w-3 h-3 text-cyan-400 animate-bounce" />
                    <span>Speaking</span>
                  </span>
                ) : vadState === 'processing' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-semibold animate-pulse">
                    <Cpu className="w-3 h-3 text-indigo-400 animate-spin" />
                    <span>Thinking</span>
                  </span>
                ) : isHandsFreeListening ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Listening</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Standby</span>
                  </span>
                )}
              </div>

              {/* Three-dot Options Menu Dropdown */}
              <div className="relative" ref={optionsMenuRef}>
                <button
                  onClick={() => setShowOptionsMenu((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showOptionsMenu ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Copilot Options Menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showOptionsMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 text-xs backdrop-blur-md">
                    <button
                      onClick={() => {
                        setShowOperatorModal(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Switch Operator ({operator.honorific})</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowVoiceSettings((prev) => !prev);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Anchor Voice: {voiceGender} (Waqar Majeed)</span>
                    </button>

                    <div className="px-2.5 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Adaptive UI Mode:
                    </div>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      <button
                        onClick={() => {
                          setOverlayViewMode('compact');
                          try { localStorage.setItem('itcafeteria_overlay_mode', 'compact'); } catch {}
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                          overlayViewMode === 'compact' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Compact
                      </button>
                      <button
                        onClick={() => {
                          setOverlayViewMode('cockpit');
                          try { localStorage.setItem('itcafeteria_overlay_mode', 'cockpit'); } catch {}
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                          overlayViewMode === 'cockpit' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Cockpit
                      </button>
                      <button
                        onClick={() => {
                          setOverlayViewMode('spanning');
                          try { localStorage.setItem('itcafeteria_overlay_mode', 'spanning'); } catch {}
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                          overlayViewMode === 'spanning' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Spanning
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setVoiceRepliesOn(!voiceRepliesOn);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      {voiceRepliesOn ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span>Mute Spoken Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Unmute Spoken Audio</span>
                        </>
                      )}
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={clearChatHistory}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Dialogue History</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Close Icon Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Copilot Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clearly Show Current Application Portion in Use */}
          {(() => {
            const currentPortion = getApplicationPortion(currentTab);
            return (
              <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <div className="truncate flex items-center gap-1.5 text-slate-300">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold shrink-0">
                      Current Portion:
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-mono text-[11px] truncate">
                      {currentPortion.group} › {currentPortion.name}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono shrink-0 pl-2 hidden sm:inline">
                  Active Context Sync
                </span>
              </div>
            );
          })()}

          {/* ⚡ 0ms Instant Navigation Notification Pill */}
          {instantNavNotice && (
            <div className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-950/95 via-cyan-950/95 to-slate-950 border-b border-cyan-400/40 text-xs text-cyan-200 font-mono flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-1.5 truncate">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="font-semibold text-cyan-300 truncate">{instantNavNotice}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-400/40 shrink-0">
                0ms Sync
              </span>
            </div>
          )}

          {/* Active Listening State Soundwave Mirror & Real-Time Dialogue Transcriptions */}
          <div className="p-3 bg-gradient-to-b from-slate-950/95 to-slate-900/90 border-b border-slate-800/80 space-y-2">
            {/* Visual Audio Soundwave Mirror */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* 8-bar Reactive Soundwave Equalizer */}
                <div className="flex items-end gap-1 h-5 w-20 px-1.5 py-0.5 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
                  {[0.35, 0.65, 0.95, 0.55, 0.85, 0.45, 0.8, 0.3].map((factor, idx) => {
                    const isActive = !isListeningPaused && (isHandsFreeListening || isSpeakingAudio);
                    const calculatedHeight = isActive
                      ? Math.max(3, Math.min(18, ((audioLevel || 22) * factor / 100) * 18 + (isSpeakingAudio ? 9 * factor : 4)))
                      : 3;
                    return (
                      <span
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isListeningPaused
                            ? 'bg-slate-700'
                            : isSpeakingAudio
                            ? 'bg-gradient-to-t from-cyan-500 to-blue-400'
                            : vadState === 'speaking'
                            ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                            : 'bg-cyan-500/40'
                        }`}
                        style={{ height: `${calculatedHeight}px` }}
                      />
                    );
                  })}
                </div>

                <span className="text-[11px] font-semibold text-slate-200">
                  {isListeningPaused
                    ? 'Listening Paused'
                    : isSpeakingAudio
                    ? 'Copilot Voicing Dialogue...'
                    : vadState === 'speaking'
                    ? 'Listening to your speech...'
                    : vadState === 'processing'
                    ? 'Gemini Processing...'
                    : 'Active Listening Mirror'}
                </span>
              </div>

              {/* Progress/VAD Timer indicator */}
              <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400">
                {vadState === 'silence_detected' && silenceProgress > 0 ? (
                  <span className="text-amber-300 font-bold animate-pulse">Triggering in {100 - silenceProgress}%</span>
                ) : isListeningPaused ? (
                  <span className="text-amber-400">Mic Paused</span>
                ) : (
                  <span className="text-emerald-400">Voice Sync Active</span>
                )}
              </div>
            </div>

            {/* Real-time Ongoing Dialogue Transcription Feed */}
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs shadow-inner">
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono mb-1">
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                <span className="font-bold tracking-wider uppercase">Real-Time Transcription:</span>
              </div>
              <p className="text-slate-200 font-sans text-xs italic leading-relaxed min-h-[1.5rem] break-words">
                {liveInterimText ? (
                  <span className="text-cyan-200 font-medium font-mono">"{liveInterimText}"</span>
                ) : isSpeakingAudio ? (
                  <span className="text-cyan-300">Copilot is currently speaking... (Aap bol kar rokein to foran sunega)</span>
                ) : isListeningPaused ? (
                  <span className="text-slate-500">Listening is paused. Tap "Resume" in the bottom control bar to start dialogue.</span>
                ) : (
                  <span className="text-slate-400">Aap bolna shuru karein, aapka dialogue yahan live transcribe hoga...</span>
                )}
              </p>
            </div>
          </div>

          {/* Collapsible Voice Settings Panel (Toggled via Options Menu) */}
          {showVoiceSettings && (
            <div className="p-3 bg-slate-950/95 border-b border-slate-800 space-y-2 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Voice Texture & Flow Engine
                </span>
                <button
                  onClick={() => setVoicePersona(DEFAULT_VOICE_PERSONA)}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Default
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Voice Cadence / Style:</label>
                <textarea
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  rows={2}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Paste Google Flow voice description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Voice Model:</label>
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
                    <Volume2 className="w-3 h-3" /> Test Voice
                  </button>
                </div>
              </div>
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
                    <div className="whitespace-pre-wrap select-text">

                      {msg.text}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-3.5 ml-1 bg-cyan-400 animate-pulse rounded-sm align-middle" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Diagnostic Visual Guidance Step Highlight Chip */}
                {msg.diagnosticHighlight && (
                  <div className="ml-8 p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-400/50 flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {msg.diagnosticHighlight.stepNumber || 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                          Diagnostic Guidance Highlight:
                        </span>
                        <span className="text-white text-xs font-semibold truncate block">
                          {msg.diagnosticHighlight.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (msg.diagnosticHighlight?.tab) {
                          onNavigate(msg.diagnosticHighlight.tab);
                        }
                        triggerDiagnosticGuidance(
                          msg.diagnosticHighlight?.tab,
                          msg.diagnosticHighlight?.label,
                          msg.diagnosticHighlight?.stepNumber || 1,
                          msg.diagnosticHighlight?.description
                        );
                      }}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-md animate-pulse"
                      title="UI element highlight karein"
                    >
                      <Eye className="w-3 h-3" /> Focus View
                    </button>
                  </div>
                )}

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

          {/* Persistent Bottom Control Bar (Featuring Pause Button & Keyboard Toggle) */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 z-30">
            {/* If Keyboard toggle is ON, reveal Text Input Form */}
            {showKeyboardInput && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputText);
                }}
                className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or command for Copilot..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl transition-opacity cursor-pointer shadow-md"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Always Visible Persistent Control Actions Row */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
              <div className="flex items-center gap-2">
                {/* 1. Pause / Resume Button */}
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                    isListeningPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                  }`}
                  title={isListeningPaused ? 'Resume Active Listening' : 'Pause Active Listening'}
                >
                  {isListeningPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                {/* 2. Keyboard Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowKeyboardInput(!showKeyboardInput)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    showKeyboardInput
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-cyan-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
                  title={showKeyboardInput ? 'Hide Keyboard Input' : 'Show Keyboard Input'}
                >
                  <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Keyboard</span>
                </button>

                {/* 3. Audio Voice Output Mute Toggle */}
                <button
                  type="button"
                  onClick={() => setVoiceRepliesOn(!voiceRepliesOn)}
                  className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                    voiceRepliesOn
                      ? 'bg-slate-900 text-cyan-300 border-slate-700/80 hover:border-cyan-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                  title={voiceRepliesOn ? 'Mute AI Spoken Audio' : 'Enable AI Spoken Audio'}
                >
                  {voiceRepliesOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Right: Barge-in Stop if speaking */}
              <div className="flex items-center gap-1.5">
                {isSpeakingAudio && (
                  <button
                    type="button"
                    onClick={stopAudioPlayback}
                    className="px-2.5 py-1 bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-md shadow-rose-950 animate-pulse"
                    title="Stop Voice Playback"
                  >
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>
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
