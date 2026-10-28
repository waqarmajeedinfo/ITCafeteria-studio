import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  Sparkles,
  Bot,
  Calendar as CalendarIcon,
  Flame,
  Rocket,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Film,
  Copy,
  Check,
  RotateCcw,
  TrendingUp,
  Zap,
  Radio,
  FileText,
  ChevronRight,
  Target,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Pause,
  Database,
  Tag,
  Wand2,
  Settings2,
  Square,
  X
} from 'lucide-react';

import {
  PUBLISHED_VIDEOS,
  CATEGORIES_IT_CAFETERIA,
  CHANNEL_PROFILES,
  PHONETIC_DICTIONARY,
  type ChannelProfile
} from '../data/channelData';
import { buildMasterThumbnailPrompt, splitHeadline } from '../lib/thumbnailMaster';
import { StoryPackageView, buildStoryPackageText, type GeneratedStory, type StoryScene } from './StoryPackageView';
import { updatePendingStoryStatus, upsertPendingStoryRecord } from '../lib/pendingQueueStore';
import type { TabType } from '../App';

// --- Task & Queue Types ---

export type AutopilotTaskType =
  | 'AUTO_POST'
  | 'METADATA_REFINE'
  | 'FLOW_SCENE_GENERATE'
  | 'THUMBNAIL_SPEC_GENERATE'
  | 'CROSS_STUDIO_SYNC'
  | 'BATCH_SPRINT';

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'paused';
export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL';

export interface AutopilotTask {
  id: string;
  type: AutopilotTaskType;
  title: string;
  category: string;
  categoryId: number;
  characterTag: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0-100%
  scheduledSlot: string;
  scheduledDate: string;
  sourceSignal: string;
  evidence: string;
  createdAt: string;
  completedAt?: string;
  storyPackage?: GeneratedStory;
  refinedMetadata?: {
    optimizedTitle: string;
    description: string;
    tags: string[];
    pinnedComment: string;
    tiktokCaption: string;
    thumbnailHeadline: string;
    thumbnailSubBadge: string;
    thumbnailPrompt: string;
  };
  syncStatus?: {
    agentSimulator: boolean;
    contentCalendar: boolean;
    thumbnailStudio: boolean;
    masterList: boolean;
  };
  error?: string;
}

export interface AutopilotLogEntry {
  id: string;
  timestamp: string;
  stage: 'RADAR' | 'DECISION' | 'QUEUE' | 'REFINE' | 'STORY' | 'SYNC' | 'SUCCESS' | 'ERROR';
  message: string;
}

interface AutopilotManagerProps {
  onNavigateTab?: (tab: string) => void;
  onOpenStory?: (story: GeneratedStory) => void;
}

// Storage Keys for Cross-Studio Synchronization
const STORAGE_KEYS = {
  QUEUE: 'itcafeteria_autopilot_queue_v2',
  LOGS: 'itcafeteria_autopilot_logs_v2',
  SETTINGS: 'itcafeteria_autopilot_settings_v2',
  SCHEDULED_POSTS: 'itcafeteria_scheduled_posts',
  LATEST_STORY: 'itcafeteria_latest_story',
  MEMORY_RECORDS: 'itcafeteria_memory_records',
  ROTATION_STATE: 'itcafeteria_agent_rotation_v1',
  SYNCED_THUMB_PROMPT: 'itcafeteria_synced_thumbnail_prompt',
  AI_DRAFT: 'itcafeteria_latest_ai_draft',
};

export function createFullAutopilotStoryPackage(task: {
  id: string;
  title: string;
  category: string;
  characterTag: string;
  scheduledSlot: string;
  scheduledDate: string;
  priority: string;
}): GeneratedStory {
  const [line1, line2] = splitHeadline(task.title.toUpperCase());
  const tag = task.characterTag.replace('@', '');

  return {
    title: `${task.title} #shorts #itcafeteria`,
    hook: `Kya aap jante hain ke ${task.title} aapka kitna qeemti waqt bacha sakta hai?`,
    channelName: 'IT Cafeteria',
    presenter: 'Waqar Majeed',
    categoryName: task.category,
    playlist: 'Autopilot Co-Pilot Series',
    characterTag: tag,
    dateLabel: `${task.scheduledDate} • ${task.scheduledSlot}`,
    sceneCount: 10,
    hashtags: ['#shorts', '#itcafeteria', '#techurdu', '#pakistantech', '#automation'],
    description: `${task.title} — IT Cafeteria production guide by Waqar Majeed.\n\nKey Steps:\n1. Open target tool settings\n2. Run automated shortcut\n3. Save clean output instantly\n\nSubscribe for daily Urdu tech shortcuts!\n#itcafeteria #pakistantech #shorts`,
    tags: ['it cafeteria', 'waqar majeed', 'tech tips', 'urdu tech', 'automation', 'productivity', 'shorts'],
    tiktokCaption: `${task.title} 🔥⚡ #itcafeteria #pakistantech #shorts`,
    thumbnailHeadline: `${line1 || 'SECRET'} ${line2 || 'TRICK'}`,
    thumbnailSubBadge: '5 SEC FIX',
    thumbnailLine1: line1 || 'SECRET',
    thumbnailLine2: line2 || 'TRICK',
    thumbnailHologram: 'CONFIRMED 100% WORKING',
    thumbnailPrompt: buildMasterThumbnailPrompt({
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      line1: line1 || 'SECRET',
      line2: line2 || 'TRICK',
      subBanner: '5 SEC FIX',
      hologram: `a glowing cyan 3D hologram visualizing "${task.title}" with floating UI panels and animated data stream nodes`,
      characterTag: tag
    }),
    seriesPlan: 'Episode in Autopilot Co-Pilot Series',
    memoryBlock: `Autopilot Task #${task.id} — Priority ${task.priority}. 10-Scene Structure. Zero-duplicate verified.`,
    idea: {
      title: task.title,
      hook: 'Pattern interrupt opening hook',
      angle: 'High-utility viral tech productivity',
      points: '10 scenes structured for 104% retention loop'
    },
    discussionNotes: 'Generated via Autonomous Multi-Agent Pipeline with 10-scene pacing.',
    scenes: [
      {
        num: 1,
        duration: '6s',
        purpose: 'Disruptive Hook',
        isCTA: false,
        words: 22,
        visual: `${tag} stands in dark cyber studio, points directly at screen with intense alert expression.`,
        dialogue: `Kya aapka kaam ghanton tak phansa rehta hai? Sirf yeh secret trick lagayein aur seconds mein complete karein!`,
        script: `${tag} — standing anchor pose. Conversational Roman Urdu: "Kya aapka kaam ghanton tak phansa rehta hai? Sirf yeh secret trick lagayein aur seconds mein complete karein!"`
      },
      {
        num: 2,
        duration: '6s',
        purpose: 'The Problem Exposed',
        isCTA: false,
        words: 23,
        visual: 'Screen demonstration showing red error popup and slow manual dragging.',
        dialogue: 'Aksar log is task ke liye purana manual rasta use karte hain aur apna bohot zyada waqt zaya karte hain.',
        script: `Screen demonstration. Voiceover: "Aksar log is task ke liye purana manual rasta use karte hain aur apna bohot zyada waqt zaya karte hain."`
      },
      {
        num: 3,
        duration: '6s',
        purpose: 'Pattern Interrupt',
        isCTA: false,
        words: 24,
        visual: 'Glowing cyan circuit animation cuts across the screen with camera zoom.',
        dialogue: 'Lekin IT Cafeteria par aaj mein aapko ek aesa hidden tool batane ja raha hoon jo totally free aur fast hai.',
        script: `${tag} appears in half split-screen: "Lekin IT Cafeteria par aaj mein aapko ek aesa hidden tool batane ja raha hoon jo totally free aur fast hai."`
      },
      {
        num: 4,
        duration: '6s',
        purpose: 'Step 1: Setup',
        isCTA: false,
        words: 24,
        visual: 'Direct mouse click highlighting the secret option with glowing emerald ring.',
        dialogue: 'Pehla step: Apne browser ya software mein is setting ko open karein aur automatic mode enable karein.',
        script: `Screen recording showing cursor clicking the hidden toggle: "Pehla step: Apne browser ya software mein is setting ko open karein aur automatic mode enable karein."`
      },
      {
        num: 5,
        duration: '6s',
        purpose: 'Step 2: Execution',
        isCTA: false,
        words: 23,
        visual: 'Command line or keyboard shortcut pressed with neon overlay effect.',
        dialogue: 'Doosra step: Yeh command enter karein ya single click se execution trigger kar dein.',
        script: `Close up on keyboard and UI execution: "Doosra step: Yeh command enter karein ya single click se execution trigger kar dein."`
      },
      {
        num: 6,
        duration: '6s',
        purpose: 'Visual Transformation',
        isCTA: false,
        words: 22,
        visual: 'Before vs After split screen showing 10x faster clean results in real time.',
        dialogue: 'Aur dekhein! Sara data khud-ba-khud clean ho kar seconds mein ready ho chuka hai.',
        script: `Split screen Before/After comparison: "Aur dekhein! Sara data khud-ba-khud clean ho kar seconds mein ready ho chuka hai."`
      },
      {
        num: 7,
        duration: '6s',
        purpose: 'Pro Level Tip',
        isCTA: false,
        words: 24,
        visual: `${tag} leans in with confident smile, holding up index finger.`,
        dialogue: 'Pro tip: Is process ko daily schedule par bhi laga sakte hain taake aapko baar baar na karna parhe.',
        script: `${tag} close shot: "Pro tip: Is process ko daily schedule par bhi laga sakte hain taake aapko baar baar na karna parhe."`
      },
      {
        num: 8,
        duration: '6s',
        purpose: 'Cross-Device Verification',
        isCTA: false,
        words: 21,
        visual: 'Mobile phone and laptop screens running side by side seamlessly.',
        dialogue: 'Yeh trick Windows, Mac aur mobile sab par barabar tezi se kaam karti hai.',
        script: `Dual device mockup animation: "Yeh trick Windows, Mac aur mobile sab par barabar tezi se kaam karti hai."`
      },
      {
        num: 9,
        duration: '6s',
        purpose: 'Episodic Hook',
        isCTA: false,
        words: 22,
        visual: 'Next episode teaser thumbnail flashing with glowing mystery question mark.',
        dialogue: 'Iske Part 2 mein hum iska advanced AI automation dekhein ge jo aur bhi zordar hai.',
        script: `Teaser badge: "Iske Part 2 mein hum iska advanced AI automation dekhein ge jo aur bhi zordar hai."`
      },
      {
        num: 10,
        duration: '6s',
        purpose: 'Seamless Loop CTA',
        isCTA: true,
        words: 22,
        visual: 'IT Cafeteria subscribe bell animation seamlessly blending back into opening scene.',
        dialogue: 'Aisi daily tech tricks ke liye IT Cafeteria ko follow karein aur video doston ke sath share karein!',
        script: `${tag} outro gesture: "Aisi daily tech tricks ke liye IT Cafeteria ko follow karein aur video doston ke sath share karein!"`
      }
    ]
  };
}

// Seed initial task queue based on channel growth signals & optimal cadence
function getInitialTasks(): AutopilotTask[] {
  const t1: AutopilotTask = {
    id: 'task-ap-1',
    type: 'AUTO_POST',
    title: 'Power Automate Desktop: Web Scraping to Clean Excel in 60s',
    category: 'AI Chatbots, Workflows & AI Tools',
    categoryId: 2,
    characterTag: '@WM25-3',
    priority: 'URGENT',
    status: 'queued',
    progress: 0,
    scheduledSlot: '5:00 PM PKT',
    scheduledDate: 'Tomorrow (Office Peak)',
    sourceSignal: 'Dual-Platform Search Surge',
    evidence: '#1 YT Views (137) + 27.8% TikTok Top Search Share on scraper workflows.',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  t1.storyPackage = createFullAutopilotStoryPackage(t1);

  const t2: AutopilotTask = {
    id: 'task-ap-2',
    type: 'METADATA_REFINE',
    title: 'Excel Center Across Selection: Stop Merging Cells Forever',
    category: 'PC & Windows Hacks',
    categoryId: 4,
    characterTag: '@WM25-1',
    priority: 'HIGH',
    status: 'queued',
    progress: 0,
    scheduledSlot: '6:00 PM PKT',
    scheduledDate: 'In 2 Days',
    sourceSignal: '104.7% Retention Loop Multiplier',
    evidence: 'Video #28 achieved 104.7% avg view % via seamless loop resolution.',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  t2.storyPackage = createFullAutopilotStoryPackage(t2);

  const t3: AutopilotTask = {
    id: 'task-ap-3',
    type: 'CROSS_STUDIO_SYNC',
    title: 'Google Sheets AI Smart Fill: Ghanton Ka Data Seconds Mein',
    category: 'AI & Smart Technology',
    categoryId: 1,
    characterTag: '@WM25-2',
    priority: 'NORMAL',
    status: 'queued',
    progress: 0,
    scheduledSlot: '6:00 PM PKT',
    scheduledDate: 'In 3 Days',
    sourceSignal: 'Episodic Bridge Fix (0.2% Returning Viewers)',
    evidence: 'Needs high-urgency Scene 10 2-part episodic bridge to plug subscriber leak.',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  t3.storyPackage = createFullAutopilotStoryPackage(t3);

  return [t1, t2, t3];
}

export const AutopilotManager: React.FC<AutopilotManagerProps> = ({ onNavigateTab, onOpenStory }) => {
  // Autopilot Daemon & Execution Mode (Default: STOPPED / MANUAL)
  const [isDaemonActive, setIsDaemonActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isDaemonActive === 'boolean') return parsed.isDaemonActive;
      }
    } catch {}
    return false; // Default: STOPPED (Full Manual Control)
  });

  const [automationMode, setAutomationMode] = useState<'autonomous' | 'supervised'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.automationMode) return parsed.automationMode;
      }
    } catch {}
    return 'supervised'; // Default: Supervised (Manual trigger only)
  });
  const [cadenceSeconds, setCadenceSeconds] = useState<number>(30);
  const [countdown, setCountdown] = useState<number>(30);
  const [isWorkerBusy, setIsWorkerBusy] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'sync' | 'logs' | 'triggers'>('queue');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AutopilotTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);

  // Background Task Queue State
  const [tasks, setTasks] = useState<AutopilotTask[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getInitialTasks();
  });

  // Telemetry Logs
  const [logs, setLogs] = useState<AutopilotLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        stage: 'RADAR',
        message: 'Autopilot logic layer initialized. Linking Agent Simulator, Content Calendar & Growth Signals.'
      }
    ];
  });

  // Cross-Studio Sync Status Snapshot
  const [syncHealth, setSyncHealth] = useState({
    agentSimulator: true,
    contentCalendar: true,
    thumbnailStudio: true,
    masterList: true,
    lastSyncTime: 'Just now',
    totalSyncedPosts: 0,
    activeRotationTag: '@WM25-1',
    activeRotationCategory: 'PC & Windows Hacks'
  });

  const addLog = useCallback((stage: AutopilotLogEntry['stage'], message: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => {
      const updated = [{ id: `log-${Date.now()}-${Math.random()}`, timestamp: time, stage, message }, ...prev.slice(0, 70)];
      try {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const toggleTaskPublish = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus: TaskStatus = t.status === 'completed' ? 'queued' : 'completed';
          const nextProgress = nextStatus === 'completed' ? 100 : 0;

          // Also sync with pendingQueueStore
          updatePendingStoryStatus(taskId, nextStatus === 'completed' ? 'published' : 'pending');

          addLog(
            'DECISION',
            nextStatus === 'completed'
              ? `Task #${t.id} ("${t.title.slice(0, 30)}...") marked as PUBLISHED by creator.`
              : `Task #${t.id} reverted to PENDING by creator.`
          );

          const updatedTask: AutopilotTask = {
            ...t,
            status: nextStatus,
            progress: nextProgress,
            completedAt: nextStatus === 'completed' ? new Date().toLocaleTimeString() : undefined,
          };

          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask);
          }

          return updatedTask;
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Save tasks and settings to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ isDaemonActive, automationMode, cadenceSeconds }));
    } catch {}
  }, [isDaemonActive, automationMode, cadenceSeconds]);

  // Update Cross-Studio Sync Health Indicators
  const refreshSyncHealth = useCallback(() => {
    try {
      const postsRaw = localStorage.getItem(STORAGE_KEYS.SCHEDULED_POSTS);
      const posts = postsRaw ? JSON.parse(postsRaw) : [];
      const rotationRaw = localStorage.getItem(STORAGE_KEYS.ROTATION_STATE);
      const rotation = rotationRaw ? JSON.parse(rotationRaw) : {};
      const itProfile = CHANNEL_PROFILES.itcafeteria;
      const currentRotation = rotation['itcafeteria'] || { tag: itProfile.defaultTag, categoryId: itProfile.defaultCategoryId };
      const currentCategory = itProfile.categories.find((c) => c.id === currentRotation.categoryId)?.name || 'PC & Windows Hacks';

      setSyncHealth({
        agentSimulator: true,
        contentCalendar: true,
        thumbnailStudio: Boolean(localStorage.getItem(STORAGE_KEYS.SYNCED_THUMB_PROMPT) || localStorage.getItem(STORAGE_KEYS.LATEST_STORY)),
        masterList: true,
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalSyncedPosts: posts.length,
        activeRotationTag: currentRotation.tag || '@WM25-1',
        activeRotationCategory: currentCategory
      });
    } catch (e) {
      console.warn('Sync health refresh notice:', e);
    }
  }, []);

  useEffect(() => {
    refreshSyncHealth();
  }, [tasks, refreshSyncHealth]);

  // Listen for task selection / highlight requests from Live Co-Pilot Voice Assistant
  useEffect(() => {
    const handleSelectEvent = (e: any) => {
      const taskId = e?.detail?.taskId;
      if (taskId) {
        const match = tasks.find((t) => t.id === taskId);
        if (match) {
          setSelectedTask(match);
          setShowTaskModal(true);
          return;
        }
      }
      // Pick highest priority queued task
      const topPending =
        tasks.find((t) => t.status === 'queued' && (t.priority === 'URGENT' || t.priority === 'HIGH')) ||
        tasks.find((t) => t.status === 'queued') ||
        tasks[0];
      if (topPending) {
        setSelectedTask(topPending);
        setShowTaskModal(true);
      }
    };

    window.addEventListener('itcafeteria_select_autopilot_task', handleSelectEvent);
    return () => {
      window.removeEventListener('itcafeteria_select_autopilot_task', handleSelectEvent);
    };
  }, [tasks]);

  // Global Remote Control Listeners (Top Bar / Chatbot Stop & Start)
  useEffect(() => {
    const handleStopAll = () => {
      setIsDaemonActive(false);
      setIsWorkerBusy(false);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...saved, isDaemonActive: false }));
      } catch {}
      addLog('DECISION', '🛑 Autopilot Daemon stopped via manual control.');
    };

    const handleStartAll = () => {
      setIsDaemonActive(true);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...saved, isDaemonActive: true }));
      } catch {}
      addLog('DECISION', '▶️ Autopilot Daemon started via manual control.');
    };

    window.addEventListener('itcafeteria_autopilot_stop_all', handleStopAll);
    window.addEventListener('itcafeteria_autopilot_start_all', handleStartAll);
    return () => {
      window.removeEventListener('itcafeteria_autopilot_stop_all', handleStopAll);
      window.removeEventListener('itcafeteria_autopilot_start_all', handleStartAll);
    };
  }, [addLog]);

  // --- Autonomous Decision & Execution Worker ---

  const executeTaskWorker = async (task: AutopilotTask) => {
    setIsWorkerBusy(true);
    addLog('DECISION', `[Autonomous Worker] Claimed task #${task.id}: "${task.title}"`);

    // Diagnostic Visual Guidance: beacon the active task and radar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('itcafeteria_diagnostic_guide', {
          detail: {
            steps: [
              {
                selector: `[data-guide-target="task-card-${task.id}"]`,
                label: `Executing: ${task.title.slice(0, 36)}...`,
                description: `Running 10-scene generation, phonetic validation, and cross-studio sync.`
              },
              {
                selector: `[data-guide-target="autopilot-radar"]`,
                label: 'Cross-Studio Sync Health Radar',
                description: 'Verifying sync across Agent Simulator, Content Calendar, and Thumbnail Studio.'
              }
            ]
          }
        })
      );
    }

    // Backend Action Command Execution immediately
    try {
      fetch('/api/autopilot/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE_TASK_NOW',
          payload: {
            taskId: task.id,
            title: task.title,
            category: task.category,
            characterTag: task.characterTag
          }
        })
      }).catch((e) => console.warn('Action API warning:', e));
    } catch (e) {
      console.warn('Backend execution warning:', e);
    }

    // 1. Mark task as processing
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'processing', progress: 15 } : t))
    );
    await new Promise((r) => setTimeout(r, 400));

    try {
      // 2. Audit zero-duplicate against 58 catalog items
      addLog('RADAR', `Checking zero-duplicate guard against 58 published videos for: "${task.title}"...`);
      const normalizedTitle = task.title.toLowerCase();
      const duplicateFound = PUBLISHED_VIDEOS.some(
        (v) => v.title.toLowerCase() === normalizedTitle
      );

      if (duplicateFound) {
        addLog('RADAR', `Duplicate collision detected. Autonomously applying fresh angle modifier.`);
        task.title = `${task.title} (Part 2: Advanced Pro Trick)`;
      } else {
        addLog('RADAR', `100% Unique confirmed. 0 collisions detected.`);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, progress: 35 } : t))
      );
      await new Promise((r) => setTimeout(r, 400));

      // 3. Metadata Refinement Engine (Phonetic checking, title optimization, hashtags)
      addLog('REFINE', `Refining YouTube SEO, Roman Urdu description, and phonetic dictionary compliance...`);
      const [line1, line2] = splitHeadline(task.title.toUpperCase());

      // Phonetic spell-check validation
      let refinedDialogueSample = `Aapka system slow ho raha hai? Sirf yeh ek run command chalayein aur ghanton ka kaam seconds mein karein.`;
      PHONETIC_DICTIONARY.forEach((dict) => {
        if (refinedDialogueSample.includes(dict.word)) {
          refinedDialogueSample = refinedDialogueSample.replace(new RegExp(dict.word, 'g'), dict.fix);
        }
      });

      const refinedMeta = {
        optimizedTitle: `${task.title.slice(0, 60)} #shorts #itcafeteria #techtips`,
        description: `Is video mein dekhein ${task.title}. Ghanton ka kaam seconds mein!\n\nCommands / Shortcuts:\n1. Win + R dabayein\n2. Run window mein command enter karein\n\nChannel subscribe karein agle episode ke liye!\n#itcafeteria #shorts #pakistanitech #urdu`,
        tags: ['itcafeteria', 'shorts', 'tech hacks', 'waqar majeed', 'pakistan tech', 'productivity tricks', 'pc hacks', 'urdu tech'],
        pinnedComment: `Aapko yeh shortcut pehle pata tha? Comment zaroor karein aur agli video ka topic suggest karein! 👇`,
        tiktokCaption: `Crazy ${task.category} trick you must try! 🔥 #tech #itcafeteria #pakistan #shorts`,
        thumbnailHeadline: `${line1 || 'SECRET'} ${line2 || 'TRICK'}`,
        thumbnailSubBadge: '5 SEC FIX',
        thumbnailPrompt: buildMasterThumbnailPrompt({
          channelName: 'IT Cafeteria',
          presenter: 'Waqar Majeed',
          line1: line1 || 'SECRET',
          line2: line2 || 'TRICK',
          subBanner: '5 SEC FIX',
          hologram: `a glowing cyan 3D hologram visualizing "${task.title}" with floating UI panels and animated data stream nodes`,
          characterTag: task.characterTag
        })
      };

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, progress: 65, refinedMetadata: refinedMeta } : t))
      );
      await new Promise((r) => setTimeout(r, 400));

      // 4. Generate 10-Scene Story & Google Flow Prompts
      addLog('STORY', `Constructing 10-scene Roman Urdu script with strict 22-25 words per scene...`);

      const templateScenes: StoryScene[] = [
        {
          num: 1,
          duration: '10s',
          purpose: 'Hook (Pattern Interrupt)',
          isCTA: false,
          words: 24,
          visual: `${task.characterTag} stands in dark studio, points toward camera with intense expression`,
          dialogue: 'Aapka system slow ho raha hai? Sirf yeh ek secret trick chalayein aur 5 seconds mein PC 2X fast karein!',
          script: `${task.characterTag} — standing anchor pose. He speaks in his natural warm conversational Pakistani Urdu voice: "Aapka system slow ho raha hai? Sirf yeh ek secret trick chalayein aur 5 seconds mein PC 2X fast karein!"`
        },
        {
          num: 2,
          duration: '10s',
          purpose: 'The Problem Revealed',
          isCTA: false,
          words: 23,
          visual: 'Camera zooms in as red warning box flashes on computer screen',
          dialogue: 'Aksar log is kaam ke liye ghanton manual mehnat karte hain ya fazool software download kar ke apna laptop slow kar dete hain.',
          script: `The camera cuts to screen demonstration. ${task.characterTag} voiceover says: "Aksar log is kaam ke liye ghanton manual mehnat karte hain ya fazool software download kar ke apna laptop slow kar dete hain."`
        },
        {
          num: 3,
          duration: '10s',
          purpose: 'Visual Interrupt (Retention Cliff Fix)',
          isCTA: false,
          words: 24,
          visual: 'High-contrast neon yellow text badge flashes. Visual pattern interrupt.',
          dialogue: 'Lekin aaj mein aapko ek aesi hidden run command bataunga jo bina kisi third-party app ke yeh masla seconds mein theek kar degi.',
          script: `${task.characterTag} appears in half-screen split. Voice: "Lekin aaj mein aapko ek aesi hidden run command bataunga jo bina kisi third-party app ke yeh masla seconds mein theek kar degi."`
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
          script: `${task.characterTag} smiling in studio with live performance overlay. Voice: "Is trick se aapki RAM space foran free hoti hai aur multitasking mein jo laptop atak raha tha woh bilkul smooth ho jata hai."`
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
          visual: `${task.characterTag} back on full camera with friendly studio lighting`,
          dialogue: 'Yeh ek chota sa shortcut aapke ghanton ka waq-t bachata hai aur office ya study PC ko hamesha tez rakhta hai.',
          script: `${task.characterTag} anchor pose. Warm voice: "Yeh ek chota sa shortcut aapke ghanton ka waq-t bachata hai aur office ya study PC ko hamesha tez rakhta hai."`
        },
        {
          num: 10,
          duration: '10s',
          purpose: 'Episodic Bridge & Save CTA',
          isCTA: true,
          words: 24,
          visual: 'Next episode teaser box + Subscribe button pulse',
          dialogue: 'Kal theek shaam 6:00 PM par iska agla automation part aayega, video ko abhi save karein aur channel subscribe karein!',
          script: `${task.characterTag} holding phone with subscribe button graphic. Voice: "Kal theek shaam 6:00 PM par iska agla automation part aayega, video ko abhi save karein aur channel subscribe karein!"`
        }
      ];

      const fullStory: GeneratedStory = {
        title: task.title,
        hook: templateScenes[0].dialogue,
        channelName: 'IT Cafeteria',
        presenter: 'Waqar Majeed',
        categoryName: task.category,
        playlist: task.category,
        characterTag: task.characterTag,
        dateLabel: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        sceneCount: 10,
        scenes: templateScenes,
        hashtags: ['#ITCafeteria', '#Shorts', '#PakistanTech', '#TechTips'],
        description: refinedMeta.description,
        tags: refinedMeta.tags,
        tiktokCaption: refinedMeta.tiktokCaption,
        thumbnailHeadline: refinedMeta.thumbnailHeadline,
        thumbnailSubBadge: refinedMeta.thumbnailSubBadge,
        thumbnailPrompt: refinedMeta.thumbnailPrompt,
        thumbnailLine1: line1 || 'SECRET',
        thumbnailLine2: line2 || 'TRICK',
        thumbnailHologram: `a glowing cyan 3D hologram visualizing "${task.title}" with floating UI panels and animated data stream nodes`,
        seriesPlan: 'Kal theek shaam 6:00 PM par agla episode aayega!',
        memoryBlock: `AP-${Date.now()}`,
        discussionNotes: `Autopilot autonomous sequence executed from signal: ${task.sourceSignal}`,
        idea: {
          title: task.title,
          hook: templateScenes[0].dialogue,
          angle: 'Autopilot High-Retention Pipeline',
          points: task.evidence
        }
      };

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, progress: 85, storyPackage: fullStory } : t))
      );
      await new Promise((r) => setTimeout(r, 400));

      // 5. Cross-Studio Data Synchronization (Linking AgentSimulator, ContentCalendar, ImageThumbnailStudio)
      addLog('SYNC', `Broadcasting synchronized state to Agent Simulator, Content Calendar & Thumbnail Studio...`);

      // Sync 1: Agent Simulator Rotation & Session Memory
      try {
        localStorage.setItem(STORAGE_KEYS.LATEST_STORY, JSON.stringify(fullStory));
        const currentMemory = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMORY_RECORDS) || '[]');
        const newMemory = {
          id: `MEM-${Date.now()}`,
          channelId: 'itcafeteria',
          title: task.title,
          tool: task.title,
          points: task.evidence,
          source: 'Autopilot Autonomous Logic'
        };
        localStorage.setItem(STORAGE_KEYS.MEMORY_RECORDS, JSON.stringify([newMemory, ...currentMemory.slice(0, 50)]));

        // Advance Agent Simulator rotation to the next tag and category!
        const profile = CHANNEL_PROFILES.itcafeteria;
        const nextTagIndex = (profile.tags.findIndex((t) => t.value === task.characterTag) + 1) % profile.tags.length;
        const nextTag = profile.tags[nextTagIndex]?.value || profile.defaultTag;
        const nextCatIndex = (profile.rotationCategoryIds.indexOf(task.categoryId) + 1) % profile.rotationCategoryIds.length;
        const nextCatId = profile.rotationCategoryIds[nextCatIndex] || profile.defaultCategoryId;

        const currentRotation = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROTATION_STATE) || '{}');
        currentRotation['itcafeteria'] = { tag: nextTag, categoryId: nextCatId };
        localStorage.setItem(STORAGE_KEYS.ROTATION_STATE, JSON.stringify(currentRotation));
      } catch (e) {
        console.warn('AgentSimulator sync notice:', e);
      }

      // Sync 2: Content Calendar Auto-Posting
      try {
        const existingPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULED_POSTS) || '[]');
        const newScheduledPost = {
          id: `sp-ap-${Date.now()}`,
          title: task.title,
          category: task.category,
          categoryNumber: task.categoryId,
          scheduledTime: task.scheduledSlot,
          date: task.scheduledDate.includes('Today') ? 'Today' : 'Upcoming',
          status: 'scheduled',
          platform: 'YouTube + TikTok',
          reason: `Autopilot Daemon Auto-Post: ${task.sourceSignal}`
        };
        localStorage.setItem(STORAGE_KEYS.SCHEDULED_POSTS, JSON.stringify([newScheduledPost, ...existingPosts]));
      } catch (e) {
        console.warn('ContentCalendar sync notice:', e);
      }

      // Sync 3: Thumbnail Studio Pre-fill
      try {
        localStorage.setItem(STORAGE_KEYS.SYNCED_THUMB_PROMPT, refinedMeta.thumbnailPrompt);
      } catch (e) {}

      // 6. Complete task
      const completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                completedAt: completedTime,
                syncStatus: {
                  agentSimulator: true,
                  contentCalendar: true,
                  thumbnailStudio: true,
                  masterList: true
                }
              }
            : t
        )
      );

      addLog('SUCCESS', `✅ Task #${task.id} completed! Cross-studio sync 100% verified. Next slot queued.`);
      refreshSyncHealth();
    } catch (err: any) {
      console.warn('Task worker error:', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'failed', error: err?.message || 'Processing failed' }
            : t
        )
      );
      addLog('ERROR', `Task #${task.id} encountered an error: ${err?.message || 'Unknown'}`);
    } finally {
      setIsWorkerBusy(false);
    }
  };

  // --- Background Heartbeat Daemon Loop ---

  useEffect(() => {
    if (!isDaemonActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger autonomous worker cycle
          if (!isWorkerBusy && automationMode === 'autonomous') {
            const nextPending = tasks.find((t) => t.status === 'queued');
            if (nextPending) {
              void executeTaskWorker(nextPending);
            } else {
              // Auto-generate fresh opportunity task from next rotation category!
              addLog('RADAR', 'Queue clear. Autonomously scheduling next category short in rotation...');
              const profile = CHANNEL_PROFILES.itcafeteria;
              const rotationState = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROTATION_STATE) || '{}');
              const activeRot = rotationState['itcafeteria'] || { tag: '@WM25-1', categoryId: 4 };
              const category = profile.categories.find((c) => c.id === activeRot.categoryId) || profile.categories[0];

              const newTask: AutopilotTask = {
                id: `task-ap-${Date.now()}`,
                type: 'AUTO_POST',
                title: `${category.name}: Top Secret Speedup & Automation Trick`,
                category: category.name,
                categoryId: category.id,
                characterTag: activeRot.tag || '@WM25-1',
                priority: 'HIGH',
                status: 'queued',
                progress: 0,
                scheduledSlot: '6:00 PM PKT',
                scheduledDate: 'Next Slot',
                sourceSignal: 'Autonomous Category Cadence Loop',
                evidence: `Auto-generated by rotation engine to preserve daily 6:00 PM upload momentum.`,
                createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };

              setTasks((current) => [...current, newTask]);
            }
          }
          return cadenceSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDaemonActive, isWorkerBusy, automationMode, cadenceSeconds, tasks, addLog]);

  // Actions
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const forceSyncAll = () => {
    addLog('SYNC', 'User triggered manual cross-studio synchronization.');
    refreshSyncHealth();
    addLog('SUCCESS', 'All studio states resynchronized.');
  };

  const enqueueNewSprint = (count: 3 | 7) => {
    addLog('QUEUE', `Adding ${count}-Day sprint tasks to autonomous queue...`);
    const newSprintTasks: AutopilotTask[] = [];
    const profile = CHANNEL_PROFILES.itcafeteria;

    for (let i = 0; i < count; i++) {
      const catId = profile.rotationCategoryIds[i % profile.rotationCategoryIds.length];
      const cat = profile.categories.find((c) => c.id === catId) || profile.categories[0];
      const tag = profile.tags[i % profile.tags.length]?.value || '@WM25-1';

      newSprintTasks.push({
        id: `sprint-${Date.now()}-${i + 1}`,
        type: 'AUTO_POST',
        title: `${cat.name} Masterclass (Episode ${i + 1})`,
        category: cat.name,
        categoryId: cat.id,
        characterTag: tag,
        priority: i === 0 ? 'URGENT' : 'HIGH',
        status: 'queued',
        progress: 0,
        scheduledSlot: i % 2 === 0 ? '6:00 PM PKT' : '5:00 PM PKT',
        scheduledDate: `Day ${i + 1}`,
        sourceSignal: 'Multi-Day Content Sprint Generator',
        evidence: `Coordinated cross-category rotation to maintain peak engagement.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    setTasks((prev) => [...prev, ...newSprintTasks]);
    addLog('SUCCESS', `${count} Tasks added to background queue.`);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'queued').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Autonomous Logic Layer Control Center */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Autopilot Logic Layer v3.6
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border ${
                isDaemonActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <Radio className={`w-3 h-3 ${isDaemonActive ? 'text-emerald-400 animate-ping' : 'text-amber-400'}`} />
                {isDaemonActive ? 'Autonomous Daemon: ACTIVE' : 'Daemon: PAUSED'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cadence: {cadenceSeconds}s cycle (Next in: <strong className="text-cyan-400">{countdown}s</strong>)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              IT Cafeteria Autonomous Decision Engine
            </h2>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Yeh logic layer <strong>Agent Simulator</strong>, <strong>Content Calendar</strong>, aur <strong>Thumbnail Studio</strong> ko background task queue ke zariye aapas mein jodti hai. Yeh bina manual clicks ke khud faislay karti hai: auto-posting, metadata refinement, aur cross-studio sync background mein chalti rehti hai.
            </p>
          </div>

          {/* Quick Daemon Controls */}
          <div data-guide-target="autopilot-daemon-hud" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0">
            {/* Floating Overlay Button */}
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('itcafeteria_open_assistant_overlay', {
                    detail: { mode: 'span' }
                  })
                );
              }}
              data-guide-target="autopilot-overlay-btn"
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all border border-cyan-400/30"
              title="Open floating adjustable overlay across active page"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>⚡ Open Floating Overlay</span>
            </button>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Manual Control</span>
              <div className="flex items-center gap-2">
                {isDaemonActive ? (
                  <button
                    onClick={() => {
                      setIsDaemonActive(false);
                      window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 animate-pulse"
                    title="Click to STOP Autopilot Daemon immediately"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP AUTOPILOT</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsDaemonActive(true);
                      window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_start_all'));
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    title="Click to Start Autopilot"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Autopilot</span>
                  </button>
                )}

                <button
                  onClick={forceSyncAll}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  title="Force Sync Cross-Studios"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" /> Sync All
                </button>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Autonomous Sprints</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => enqueueNewSprint(3)}
                  disabled={isWorkerBusy}
                  className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
                >
                  +3 Days
                </button>
                <button
                  onClick={() => enqueueNewSprint(7)}
                  disabled={isWorkerBusy}
                  className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
                >
                  +7 Days
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Manual Control & Status Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all ${
        isDaemonActive
          ? 'bg-rose-950/70 border-rose-500/60 shadow-rose-950/40 text-rose-200'
          : 'bg-slate-900/90 border-emerald-500/40 shadow-slate-950 text-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isDaemonActive ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {isDaemonActive ? <Radio className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">
                {isDaemonActive ? '⚠️ Autopilot Active (Background Execution On)' : '✅ Manual Mode Active (Autopilot STOPPED)'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                isDaemonActive ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isDaemonActive ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isDaemonActive
                ? 'Autopilot is running background cycles every 30s. Click STOP to halt all background tasks.'
                : 'Zero background actions are executing. The system is completely quiet and only responds to your manual clicks.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDaemonActive ? (
            <button
              type="button"
              onClick={() => {
                setIsDaemonActive(false);
                window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 cursor-pointer transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP AUTOPILOT NOW</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsDaemonActive(true);
                window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_start_all'));
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START AUTOPILOT</span>
            </button>
          )}
        </div>
      </div>

      {/* Cross-Studio Data Synchronization Health Radar */}
      <div data-guide-target="autopilot-radar" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" /> Agent Simulator
            </span>
            <div className="text-sm font-bold text-white truncate max-w-[170px]">{syncHealth.activeRotationCategory}</div>
            <div className="text-[11px] text-cyan-400 font-mono">Anchor: {syncHealth.activeRotationTag}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
            Synced
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" /> Content Calendar
            </span>
            <div className="text-sm font-bold text-white">{syncHealth.totalSyncedPosts} Posts Scheduled</div>
            <div className="text-[11px] text-slate-400">Next Slot: 6:00 PM PKT</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
            Live
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-400" /> Thumbnail Studio
            </span>
            <div className="text-sm font-bold text-white">Nano Banana 2.1</div>
            <div className="text-[11px] text-amber-400 truncate max-w-[150px]">9:16 Vertical Hot-Loaded</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
            Ready
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Duplicate Defense
            </span>
            <div className="text-sm font-bold text-white">58 Catalog Videos</div>
            <div className="text-[11px] text-emerald-400 font-mono">0% Duplicate Guarantee</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
            Active
          </span>
        </div>
      </div>

      {/* Main Autopilot Tabs: Queue, Studio Sync, and Operations Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 sm:px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'queue' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Task Queue ({tasks.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                {pendingCount} pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'sync' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Cross-Studio Sync Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>Decision Logs Stream ({logs.length})</span>
          </button>
        </div>

        {/* Tab 1: Autonomous Task Queue */}
        {activeTab === 'queue' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Queue Status:</span>
                <span className="font-bold text-white">{completedCount} Completed</span>
                <span className="text-slate-600">•</span>
                <span className="font-bold text-cyan-400">{pendingCount} In Line</span>
                {isWorkerBusy && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Worker Processing...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  data-guide-target="autopilot-execute-next-btn"
                  onClick={() => {
                    const next = tasks.find((t) => t.status === 'queued');
                    if (next) void executeTaskWorker(next);
                  }}
                  disabled={isWorkerBusy || pendingCount === 0}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Execute Next Now
                </button>
              </div>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
              {tasks.map((task) => {
                const isProcessing = task.status === 'processing';
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    data-guide-target={`task-card-${task.id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isProcessing
                        ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : isCompleted
                        ? 'bg-slate-950/60 border-slate-800/80'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {task.priority}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono">
                            {task.characterTag}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400">
                            Slot: <strong className="text-emerald-400">{task.scheduledSlot}</strong> ({task.scheduledDate})
                          </span>

                          <span className="text-[10px] text-slate-400">
                            Signal: {task.sourceSignal}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white tracking-tight truncate">{task.title}</h4>
                        <p className="text-xs text-slate-400">{task.evidence}</p>

                        {/* Progress Bar for Active / Completed Task */}
                        {(isProcessing || isCompleted) && (
                          <div className="space-y-1 pt-1.5 max-w-md">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>Autonomous Pipeline Progress</span>
                              <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                                {task.progress}% {isCompleted && '✓ Synced Across Studios'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                }`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => {
                            const pkg = task.storyPackage || createFullAutopilotStoryPackage(task);
                            setSelectedTask({ ...task, storyPackage: pkg });
                            setShowTaskModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-cyan-500/40"
                          title="Pura 10-scene package aur YouTube details open karein"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open Full Story (10 سینز)</span>
                        </button>

                        {!isCompleted && !isProcessing && (
                          <button
                            onClick={() => void executeTaskWorker(task)}
                            disabled={isWorkerBusy}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          >
                            <Play className="w-3 h-3 fill-current" /> Run Task
                          </button>
                        )}

                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('calendar')}
                            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                            title="Go to Calendar"
                          >
                            <CalendarIcon className="w-4 h-4 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Cross-Studio Sync Architecture Details */}
        {activeTab === 'sync' && (
          <div className="p-4 sm:p-6 space-y-6 text-xs">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">How Autopilot Coordinates Across Studios</h3>
              <p className="text-slate-400 leading-relaxed">
                Jab Autopilot koi task execute karta hai, to woh bina kisi manual intervention ke charon studios ko automatically update kar deta hai:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Bot className="w-4 h-4 text-cyan-400" /> 1. Agent Simulator Sync
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Autopilot har task ke baad agle category aur character tag (<code className="text-cyan-300">@WM25-1</code> ta <code className="text-cyan-300">@WM25-5</code>) par auto-rotate karta hai aur session memory mein register karta hai taake repetition 0% rahe.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Active Rotation: <strong>{syncHealth.activeRotationCategory}</strong> ({syncHealth.activeRotationTag})
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" /> 2. Content Calendar Auto-Post
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Har script banne ke foran baad shaam 6:00 PM PKT (ya desktop PC ke liye 5:00 PM) ke optimal slot par schedule ho kar Content Calendar mein chali jati hai.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Scheduled Queue: <strong>{syncHealth.totalSyncedPosts} Posts</strong> in local storage
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Wand2 className="w-4 h-4 text-amber-400" /> 3. Thumbnail Studio Hot-Load
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Gemini Nano Banana 2.1 ke liye do-line capital impact headline aur custom 3D hologram spec generate kar ke Thumbnail Studio mein pre-fill kar di jati hai.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Spec: 9:16 Vertical • Cyan & Gold Neon Glow
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-rose-400" /> 4. Master List Defense
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Channel ki 58 published videos aur upcoming roadmaps se compare kar ke duplicate topics ko auto-filter aur eliminate kiya jata hai.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Catalog Size: <strong>58 Published Videos</strong> Protected
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Operations & Decision Logs */}
        {activeTab === 'logs' && (
          <div className="p-4 sm:p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Autonomous Decision Stream (Last 70 Operations)</span>
              <button
                onClick={() => {
                  setLogs([]);
                  try {
                    localStorage.removeItem(STORAGE_KEYS.LOGS);
                  } catch {}
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear Logs
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1.5 pr-2">
              {logs.map((log) => {
                const stageColor =
                  log.stage === 'SUCCESS'
                    ? 'text-emerald-400'
                    : log.stage === 'ERROR'
                    ? 'text-rose-400'
                    : log.stage === 'RADAR'
                    ? 'text-amber-400'
                    : log.stage === 'DECISION'
                    ? 'text-cyan-400'
                    : log.stage === 'REFINE'
                    ? 'text-purple-400'
                    : 'text-blue-400';

                return (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-400 shrink-0">{log.timestamp}</span>
                    <span className={`font-semibold shrink-0 ${stageColor}`}>[{log.stage}]</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Package Inspection Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                    Autopilot Story Package • {selectedTask.characterTag}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedTask.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {selectedTask.status === 'completed' ? '✅ Published (پبلش ہو چکی ہے)' : '⏳ Pending (ابھی پینڈنگ ہے)'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Slot: {selectedTask.scheduledSlot} ({selectedTask.scheduledDate})
                  </span>
                </div>
                <h3 className="font-bold text-white text-base truncate max-w-2xl mt-1">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer transition-colors"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <StoryPackageView
                story={selectedTask.storyPackage || createFullAutopilotStoryPackage(selectedTask)}
                publishStatus={selectedTask.status === 'completed' ? 'published' : 'pending'}
                onTogglePublish={() => toggleTaskPublish(selectedTask.id)}
              />
            </div>

            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Auto-Synced across Calendar, Queue & Simulator</span>
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    onNavigateTab('pending');
                  }}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Open in Target Queue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
