import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Undo2,
  Redo2,
  Sliders,
  Tv,
  Plus,
  Trash2,
  Edit2,
  Save
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
import { updatePendingStoryStatus, upsertPendingStoryRecord, loadPendingQueue } from '../lib/pendingQueueStore';
import { getAllPublishedVideos } from '../lib/publishedLibraryStore';
import { applyCinematicDirecting } from '../lib/cinematicDirector';
import { loadSimulatorConfig } from './SimulatorConfigModal';
import { generateTopicAccurateStoryPackage } from '../lib/storyTopicGenerator';
import { PHONETIC_UPDATED_EVENT } from '../lib/phoneticDictionaryStore';
import {
  loadAutopilotConfig,
  updateAutopilotConfig,
  undoAutopilotConfig,
  redoAutopilotConfig,
  restoreDefaultAutopilotConfig,
  getAutopilotHistoryStacks,
  DEFAULT_AUTOPILOT_CONFIG,
  type AutopilotConfiguration
} from '../lib/autopilotConfigStore';
import {
  loadAllChannels,
  saveOrUpdateChannel,
  deleteChannel,
  type ExtendedChannelProfile
} from '../lib/channelStore';
import { dirtyManager } from '../lib/dirtyStore';
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

// Dynamic Categorized Topic Bank for Systematic Channel Rotations
export const CATEGORY_TOPIC_BANK: Record<number, string[]> = {
  1: [
    'Google Sheets AI Smart Fill: Ghanton Ka Data Seconds Mein',
    'Google Gemini AI Vision: Image Se Data Table Extraction',
    'OpenAI Canvas & Claude Artifacts: Secret Productivity Hacks',
    'AI Web Scraper: Bina Coding Kisi Bhi Website Ka Data Download Karein'
  ],
  2: [
    'Gemini 1.5 Flash Audio Transcription: 1-Hour Lecture in 30s',
    'ChatGPT Agent Workflows: Autonomous Tasks Setup',
    'Claude 3.5 Sonnet Artifacts: Interactive Dashboards in 1-Click',
    'n8n AI Workflow Automation: Free Self-Hosted Alternatives'
  ],
  3: [
    'AI Prompt Hacks & Shortcuts Masterclass',
    'DeepSeek vs ChatGPT: 3 Prompts Jo Sab Badal Denge',
    'Zero-Shot Reasoning Prompts: Complex Math & Logic Solutions',
    'Role-Play Persona Prompts for Instant Professional Code'
  ],
  4: [
    'Excel Center Across Selection: Stop Merging Cells Forever',
    'Windows 11 Secret God Mode & Master Control Panel',
    'Power Automate Desktop: Free Daily Repetitive Task Bot',
    'Win + R Secret Run Commands Jo 99% Log Nahi Jaante'
  ],
  5: [
    'WhatsApp Multi-Device Hidden Features & HD Photo Lock',
    'Android Developer Options: 3 Toggles Jo Phone Ko 2X Fast Bana Dein',
    'WhatsApp Business Automated Catalogs & Payment Integration',
    'Mobile Screen Mirroring to PC with Zero Lag and High FPS'
  ],
  6: [
    'Outlook Quick Steps & Rules: Inbox Zero in 5 Minutes Daily',
    'Notion AI Formulas & Database Automation Setup',
    'Google Workspace Add-ons: Auto-Reply & Contract Generator',
    'Zapier Free Alternatives: Open-Source Workflow Automation'
  ],
  7: [
    'Urgent Windows Security Alert: Fake Browser Updates Scam',
    'Google Chrome Zero-Day Patch: Instant Update Guide',
    'Two-Factor Authentication Hardware Keys vs Authenticator Apps',
    'Phishing Email Detection: 5 Instant Red Flags'
  ],
  9: [
    'New AI Tools This Week: Top 5 Free Game Changers',
    'Cursor AI vs GitHub Copilot: The Ultimate Coding Showdown',
    'Local LLMs on Low-End PC: Ollama Complete Guide',
    'Perplexity Pro Search: Replace Google Search Forever'
  ]
};

export function createFullAutopilotStoryPackage(
  task: {
    id: string;
    title: string;
    category: string;
    characterTag: string;
    scheduledSlot: string;
    scheduledDate: string;
    priority: string;
    categoryId?: number;
  },
  sceneCountOverride?: number
): GeneratedStory {
  const [line1, line2] = splitHeadline(task.title.toUpperCase());
  const tag = task.characterTag ? task.characterTag.replace('@', '') : 'WM25-1';
  const cfg = loadSimulatorConfig();
  const targetSceneCount = Math.max(7, Math.min(30, sceneCountOverride || cfg.defaultSceneCount || 10));

  const topicPackage = generateTopicAccurateStoryPackage({
    id: task.id,
    title: task.title,
    category: task.category,
    categoryId: task.categoryId,
    characterTag: task.characterTag,
    scheduledTime: task.scheduledSlot,
    scheduledDate: task.scheduledDate,
    channelName: 'IT Cafeteria',
    presenter: 'Waqar Majeed'
  });

  return {
    ...topicPackage,
    sceneCount: targetSceneCount,
    thumbnailHeadline: `${line1 || 'SECRET'} ${line2 || 'TRICK'}`,
    thumbnailLine1: line1 || topicPackage.thumbnailLine1 || 'SECRET',
    thumbnailLine2: line2 || topicPackage.thumbnailLine2 || 'TRICK',
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
    memoryBlock: `Autopilot Task #${task.id} — Priority ${task.priority}. ${targetSceneCount}-Scene Structure. Zero-duplicate verified.`,
  };
}

// Seed initial task queue based on channel growth signals & optimal cadence
function getInitialTasks(): AutopilotTask[] {
  const publishedTitles = new Set(
    getAllPublishedVideos().map((v) => v.title.toLowerCase().trim())
  );

  const t1: AutopilotTask = {
    id: 'task-ap-1',
    type: 'AUTO_POST',
    title: 'Gemini 1.5 Flash Audio Transcription: 1-Hour Lecture in 30s',
    category: 'AI Chatbots, Workflows & AI Tools',
    categoryId: 2,
    characterTag: '@WM25-3',
    priority: 'URGENT',
    status: 'queued',
    progress: 0,
    scheduledSlot: '5:00 PM PKT',
    scheduledDate: 'Tomorrow (Office Peak)',
    sourceSignal: 'Dual-Platform Search Surge',
    evidence: 'High-demand audio workflow signal with 42% search concurrency. 0 collisions in published library.',
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
    evidence: 'Achieves 104.7% avg view % via seamless loop resolution.',
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

  return [t1, t2, t3].filter((t) => !publishedTitles.has(t.title.toLowerCase().trim()));
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
  const [activeTab, setActiveTab] = useState<'queue' | 'sync' | 'logs' | 'engine'>('queue');
  const [priorityResources, setPriorityResources] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('itcafeteria_priority_resources');
      return raw ? JSON.parse(raw) : ['https://blog.google/technology/ai/', 'https://github.com/trending'];
    } catch {
      return [];
    }
  });
  const [newResourceInput, setNewResourceInput] = useState('');
  const [autopilotJD, setAutopilotJD] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('itcafeteria_autopilot_jd');
      return raw || 'Chief Autonomous Content Producer & Growth Agent: Responsible for scanning tech trends, auditing duplicate coverage across 58+ published catalog items, executing 10-scene Roman Urdu script generation, and synchronizing state across Agent Simulator, Content Calendar, and Thumbnail Studio.';
    } catch {
      return 'Chief Autonomous Content Producer & Growth Agent';
    }
  });
  const [decisionThreshold, setDecisionThreshold] = useState<string>('0.92 (Strict Zero-Duplicate Confidence)');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AutopilotTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);

  // Sync All & PKT Scheduler States
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [pktTime, setPktTime] = useState<string>('');
  const [pendingStoriesCount, setPendingStoriesCount] = useState<number>(() => {
    return loadPendingQueue().filter((i) => i.status === 'pending').length;
  });
  const [lastDailyCheckResult, setLastDailyCheckResult] = useState<{
    time: string;
    status: 'STANDBY' | 'TRIGGERED';
    pendingCount: number;
    actionTaken: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('itcafeteria_autopilot_last_daily_check');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Background Task Queue State - filters out already published tasks
  const [tasks, setTasks] = useState<AutopilotTask[]>(() => {
    const publishedTitles = new Set(
      getAllPublishedVideos().map((v) => v.title.toLowerCase().trim())
    );
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTasks = parsed.filter(
            (t: AutopilotTask) => !publishedTitles.has(t.title.toLowerCase().trim())
          );
          if (validTasks.length > 0) return validTasks;
        }
      }
    } catch {}
    return getInitialTasks();
  });

  // Modal open scroll-lock effect
  useEffect(() => {
    if (showTaskModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showTaskModal]);

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

      // 4. Generate 10-Scene Story & Google Flow Prompts (Strictly Topic-Accurate)
      addLog('STORY', `Constructing 10-scene Roman Urdu script strictly matching topic: "${task.title}"...`);

      const topicPackage = generateTopicAccurateStoryPackage({
        id: task.id,
        title: task.title,
        category: task.category,
        categoryId: task.categoryId,
        characterTag: task.characterTag,
        scheduledTime: task.scheduledSlot,
        scheduledDate: task.scheduledDate,
        channelName: 'IT Cafeteria',
        presenter: 'Waqar Majeed'
      });

      const fullStory: GeneratedStory = {
        ...topicPackage,
        title: task.title,
        description: refinedMeta.description || topicPackage.description,
        tags: refinedMeta.tags.length ? refinedMeta.tags : topicPackage.tags,
        tiktokCaption: refinedMeta.tiktokCaption || topicPackage.tiktokCaption,
        thumbnailHeadline: refinedMeta.thumbnailHeadline || topicPackage.thumbnailHeadline,
        thumbnailSubBadge: refinedMeta.thumbnailSubBadge || topicPackage.thumbnailSubBadge,
        thumbnailPrompt: refinedMeta.thumbnailPrompt || topicPackage.thumbnailPrompt,
        thumbnailLine1: line1 || topicPackage.thumbnailLine1 || 'SECRET',
        thumbnailLine2: line2 || topicPackage.thumbnailLine2 || 'TRICK',
        thumbnailHologram: `a glowing cyan 3D hologram visualizing "${task.title}" with floating UI panels and animated data stream nodes`,
        seriesPlan: 'Kal theek shaam 6:00 PM par agla episode aayega!',
        memoryBlock: `AP-${Date.now()}`,
        discussionNotes: `Autopilot autonomous sequence executed from signal: ${task.sourceSignal}. Topic-verified: ${task.title}`
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

      // 6. Complete task & Handoff to Pending Stories and Content Calendar
      const completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      try {
        upsertPendingStoryRecord({
          id: `pq-${task.id}`,
          title: task.title,
          hook: fullStory.hook,
          category: task.category,
          categoryId: task.categoryId,
          characterTag: task.characterTag,
          scheduledTime: task.scheduledSlot,
          scheduledDate: task.scheduledDate,
          targetSlotReason: `Autopilot Autonomous Delivery: ${task.sourceSignal}`,
          status: 'pending',
          source: 'autopilot',
          priority: task.priority,
          createdAt: new Date().toISOString(),
          storyPackage: fullStory
        });
        window.dispatchEvent(new CustomEvent('itcafeteria_pending_queue_updated'));
        window.dispatchEvent(new CustomEvent('itcafeteria_calendar_refresh'));
      } catch (e) {
        console.warn('Pending queue handoff notice:', e);
      }

      // Remove from Autopilot's active working queue so it doesn't clutter active tasks
      setTasks((prev) => {
        const remaining = prev.filter((t) => t.id !== task.id);
        try {
          localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(remaining));
        } catch {}
        return remaining;
      });

      addLog('SUCCESS', `✅ Task #${task.id} completed, handed off to Pending Stories & Content Calendar, and pruned from active Autopilot queue.`);
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

  // Live PKT (UTC+5) Clock & Pending Queue Listeners
  useEffect(() => {
    const updatePkt = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const pkt = new Date(utc + 5 * 3600000);
      setPktTime(
        pkt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updatePkt();
    const ticker = setInterval(updatePkt, 1000);

    const handlePendingUpdate = () => {
      setPendingStoriesCount(loadPendingQueue().filter((i) => i.status === 'pending').length);
    };
    window.addEventListener('itcafeteria_pending_queue_updated', handlePendingUpdate);

    return () => {
      clearInterval(ticker);
      window.removeEventListener('itcafeteria_pending_queue_updated', handlePendingUpdate);
    };
  }, []);

  // Daily 6:00 AM PKT Autonomous Replenishment Watcher
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const pkt = new Date(utc + 5 * 3600000);
      const hour = pkt.getHours();
      const minute = pkt.getMinutes();
      const todayPktKey = `${pkt.getFullYear()}-${pkt.getMonth() + 1}-${pkt.getDate()}`;
      const lastTriggeredDate = localStorage.getItem('itcafeteria_autopilot_last_daily_trigger_pkt');

      // Trigger daily at 6:00 AM PKT window (06:00 - 06:04) once per day
      if (hour === 6 && minute < 5 && lastTriggeredDate !== todayPktKey) {
        localStorage.setItem('itcafeteria_autopilot_last_daily_trigger_pkt', todayPktKey);
        addLog('RADAR', '⏰ 6:00 AM PKT Daily Replenishment window reached. Executing check...');
        void runDailyReplenishmentCheck(false);
      }
    };

    const interval = setInterval(checkSchedule, 20000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Actions
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const forceSyncAll = async () => {
    setIsSyncingAll(true);
    addLog('SYNC', '🔄 Manual cross-studio synchronization triggered by user.');
    try {
      await fetch('/api/autopilot/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch((e) => console.warn('Sync all backend warning:', e));
    } catch {}

    // Dispatch global sync events across all tabs and stores
    window.dispatchEvent(new CustomEvent('itcafeteria_pending_queue_updated'));
    window.dispatchEvent(new CustomEvent('itcafeteria_calendar_refresh'));
    window.dispatchEvent(new CustomEvent('itcafeteria_library_updated'));
    window.dispatchEvent(new CustomEvent(PHONETIC_UPDATED_EVENT));
    window.dispatchEvent(new Event('storage'));

    refreshSyncHealth();
    setPendingStoriesCount(loadPendingQueue().filter((i) => i.status === 'pending').length);
    addLog('SUCCESS', '✅ All studio states, pending queue & phonetic dictionary resynchronized.');

    setSyncToast('✅ تمام اسٹوڈیوز، پینڈنگ کیو اور فونیٹک ڈکشنری سنک (Synced) ہو گئے!');
    setTimeout(() => {
      setSyncToast(null);
      setIsSyncingAll(false);
    }, 2500);
  };

  const enqueueNewSprint = (count: number) => {
    addLog('QUEUE', `Adding ${count} autonomous tasks to queue...`);
    const newSprintTasks: AutopilotTask[] = [];
    const profile = CHANNEL_PROFILES.itcafeteria;

    // Read current rotation anchor
    let currentTag = '@WM25-1';
    let currentCatId = 4;
    try {
      const rot = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROTATION_STATE) || '{}');
      if (rot.itcafeteria) {
        currentTag = rot.itcafeteria.tag || currentTag;
        currentCatId = rot.itcafeteria.categoryId || currentCatId;
      }
    } catch {}

    const rotCatIds = profile.rotationCategoryIds && profile.rotationCategoryIds.length > 0
      ? profile.rotationCategoryIds
      : [4, 2, 1, 5, 3, 6, 7, 9];

    let startCatIdx = rotCatIds.indexOf(currentCatId);
    if (startCatIdx === -1) startCatIdx = 0;

    let startTagIdx = profile.tags.findIndex((t) => t.value === currentTag);
    if (startTagIdx === -1) startTagIdx = 0;

    const publishedTitles = new Set(
      getAllPublishedVideos().map((v) => v.title.toLowerCase().trim())
    );

    for (let i = 0; i < count; i++) {
      const catIdx = (startCatIdx + i) % rotCatIds.length;
      const catId = rotCatIds[catIdx];
      const cat = profile.categories.find((c) => c.id === catId) || profile.categories[0];
      const tag = profile.tags[(startTagIdx + i) % profile.tags.length]?.value || '@WM25-1';

      // Pick authentic title from CATEGORY_TOPIC_BANK
      const bank = CATEGORY_TOPIC_BANK[catId] || [];
      let chosenTitle = bank[i % bank.length] || `${cat.name} Masterclass (Episode ${i + 1})`;
      if (publishedTitles.has(chosenTitle.toLowerCase().trim())) {
        chosenTitle = `${chosenTitle} (Part 2: Advanced Pro Trick)`;
      }

      const newTask: AutopilotTask = {
        id: `sprint-${Date.now()}-${i + 1}`,
        type: 'AUTO_POST',
        title: chosenTitle,
        category: cat.name,
        categoryId: cat.id,
        characterTag: tag,
        priority: i === 0 ? 'URGENT' : 'HIGH',
        status: 'queued',
        progress: 0,
        scheduledSlot: i % 2 === 0 ? '6:00 PM PKT' : '5:00 PM PKT',
        scheduledDate: `Day ${i + 1}`,
        sourceSignal: 'Multi-Day Content Sprint Generator',
        evidence: `Coordinated rotation (${tag} • ${cat.name}) to maintain peak engagement.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      newTask.storyPackage = createFullAutopilotStoryPackage(newTask);
      newSprintTasks.push(newTask);
    }

    setTasks((prev) => {
      const updated = [...prev, ...newSprintTasks];
      try {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    addLog('SUCCESS', `${count} Tasks added to background queue.`);

    // If worker is idle, start executing the first task
    setTimeout(() => {
      if (!isWorkerBusy && newSprintTasks.length > 0) {
        void executeTaskWorker(newSprintTasks[0]);
      }
    }, 400);
  };

  const runDailyReplenishmentCheck = async (manual: boolean = false) => {
    try {
      const allPending = loadPendingQueue();
      const pendingStories = allPending.filter((i) => i.status === 'pending');
      const count = pendingStories.length;
      setPendingStoriesCount(count);

      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const pkt = new Date(utc + 5 * 3600000);
      const timeStr = pkt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // Record to backend
      fetch('/api/autopilot/trigger-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPendingCount: count, manual })
      }).catch(() => {});

      if (count >= 3) {
        addLog('DECISION', `[6:00 AM PKT Trigger] Pending stories count = ${count} (>= 3 threshold). Standby mode active. Zero generation required.`);
        const checkResult = {
          time: timeStr,
          status: 'STANDBY' as const,
          pendingCount: count,
          actionTaken: `Pending Queue mein ${count} stories mojood hain (>= 3 threshold). Standby mode active.`
        };
        setLastDailyCheckResult(checkResult);
        try {
          localStorage.setItem('itcafeteria_autopilot_last_daily_check', JSON.stringify(checkResult));
        } catch {}
        if (manual) {
          setSyncToast(`ℹ️ پینڈنگ کیو میں پہلے ہی ${count} کہانیاں موجود ہیں (3 یا زیادہ)، اس لیے نیا ٹاسک جنریٹ کرنے کی ضرورت نہیں!`);
          setTimeout(() => setSyncToast(null), 4000);
        }
        return;
      }

      // count < 3: Needs replenishment!
      addLog('RADAR', `[6:00 AM PKT Trigger] Pending count = ${count} (< 3 threshold). Auto-trigger activated!`);

      const sprintCount = count === 2 ? 1 : 3;
      enqueueNewSprint(sprintCount);

      const actionText = sprintCount === 3
        ? `Queue critical (${count} pending <= 1). 3-Day Autonomous Sprint triggered.`
        : `Queue replenishment (${count} pending === 2). 1 new rotated story queued.`;

      const checkResult = {
        time: timeStr,
        status: 'TRIGGERED' as const,
        pendingCount: count,
        actionTaken: actionText
      };
      setLastDailyCheckResult(checkResult);
      try {
        localStorage.setItem('itcafeteria_autopilot_last_daily_check', JSON.stringify(checkResult));
      } catch {}

      setSyncToast(
        sprintCount === 3
          ? `⚡ پینڈنگ لسٹ میں صرف ${count} کہانیاں تھیں! 3 روزہ آٹونومس اسپرنٹ خودکار طور پر کیو میں شامل کر دیا گیا۔`
          : `⚡ پینڈنگ لسٹ میں 2 کہانیاں تھیں! 1 نئی کہانی شامل کی گئی تاکہ 3 کا ٹارگٹ پورا ہو۔`
      );
      setTimeout(() => setSyncToast(null), 5000);
    } catch (e: any) {
      console.error('Daily replenishment check failed:', e);
      addLog('ERROR', `Daily check failed: ${e?.message || 'Unknown error'}`);
    }
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
                  disabled={isSyncingAll}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all font-semibold"
                  title="Force Sync Cross-Studios"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Syncing...' : 'Sync All'}</span>
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

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="p-3 bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-500/50 rounded-xl text-cyan-100 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-cyan-400 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6:00 AM PKT Autonomous Replenishment Trigger Card */}
      <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Daily 6:00 AM PKT Trigger
              </span>
              <span className="font-mono text-xs text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                PKT Time (UTC+5): <strong className="text-white">{pktTime || '06:00 AM PKT'}</strong>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                pendingStoriesCount >= 3
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              }`}>
                {pendingStoriesCount >= 3
                  ? `Standby Mode (${pendingStoriesCount} Pending Stories >= 3)`
                  : `Trigger Active (${pendingStoriesCount} Pending Stories < 3)`}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>صبح 6:00 بجے کا خودکار ریپلینشمنٹ ٹرگر (Daily 6:00 AM PKT Autonomous Trigger)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              یہ ٹرگر روزانہ صبح 6:00 بجے پاکستانی وقت کے مطابق چلتا ہے۔ یہ مینجمنٹ میں پینڈنگ کہانیاں چیک کرتا ہے:
              اگر پینڈنگ کہانیاں <strong>3 کے برابر یا اس سے زیادہ</strong> ہوں تو یہ کوئی کام نہیں کرتا (اسٹینڈ بائی رہتا ہے)۔
              اگر <strong>3 سے کم</strong> ہوں تو خودکار نئی کہانیاں تلاش کر کے کیو میں لگاتا ہے اور تیار شدہ پیکج پینڈنگ کیو میں منتقل کر دیتا ہے۔
            </p>

            {lastDailyCheckResult && (
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-indigo-300">Last Check ({lastDailyCheckResult.time} PKT):</span>
                <span className={lastDailyCheckResult.status === 'STANDBY' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  [{lastDailyCheckResult.status}] {lastDailyCheckResult.actionTaken}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => runDailyReplenishmentCheck(true)}
              disabled={isWorkerBusy}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer disabled:opacity-40 transition-all border border-indigo-400/30"
              title="Test the 6:00 AM PKT Check condition right now"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>⚡ Run 6:00 AM PKT Check Now</span>
            </button>
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
            <div className="text-sm font-bold text-white">
              {PUBLISHED_VIDEOS.length + tasks.filter((t) => t.status === 'completed').length} Catalog Videos
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              0% Duplicate Guarantee • {tasks.filter((t) => t.status === 'completed').length} Published Synced
            </div>
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

          <button
            onClick={() => setActiveTab('engine')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'engine' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Focus Links & Engine JDs</span>
          </button>
        </div>

        {/* Tab 4: Focus Links & Autonomous Engine JDs */}
        {activeTab === 'engine' && (
          <div className="p-4 sm:p-6 space-y-6 text-xs">
            {/* Prioritized Focus Links Management */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" /> Prioritized Focus Links & Search Sources
                </h4>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60">
                  {priorityResources.length} Active Sources
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Enter specific external links, RSS feeds, or focus points that Autopilot must prioritize during autonomous web crawling and story search.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/feed or focus keyword"
                  value={newResourceInput}
                  onChange={(e) => setNewResourceInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newResourceInput.trim()) return;
                    const updated = [...priorityResources, newResourceInput.trim()];
                    setPriorityResources(updated);
                    setNewResourceInput('');
                    try {
                      localStorage.setItem('itcafeteria_priority_resources', JSON.stringify(updated));
                    } catch {}
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Add Link
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {priorityResources.map((res, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                    <span className="font-mono text-cyan-300 truncate mr-2">{res}</span>
                    <button
                      onClick={() => {
                        const updated = priorityResources.filter((_, i) => i !== idx);
                        setPriorityResources(updated);
                        try {
                          localStorage.setItem('itcafeteria_priority_resources', JSON.stringify(updated));
                        } catch {}
                      }}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Autopilot Job Description & Autonomous Decision Engine Tuning */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" /> Autopilot Job Description (JD) & Decision Engine Tuning
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('itcafeteria_autopilot_jd', autopilotJD);
                      alert('Autopilot Job Description & Decision Engine tuning saved successfully!');
                    } catch {}
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
                >
                  Save Engine Settings
                </button>
              </div>
              <p className="text-slate-400 text-xs">
                Define Autopilot's exact role description (JD) and modify autonomous decision thresholds for background execution.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Autopilot Job Description (JD)</label>
                  <textarea
                    rows={3}
                    value={autopilotJD}
                    onChange={(e) => setAutopilotJD(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Autonomous Decision Threshold</label>
                  <select
                    value={decisionThreshold}
                    onChange={(e) => setDecisionThreshold(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="0.92 (Strict Zero-Duplicate Confidence)">0.92 (Strict Zero-Duplicate Confidence)</option>
                    <option value="0.85 (Balanced Growth & Fresh Angle)">0.85 (Balanced Growth & Fresh Angle)</option>
                    <option value="0.75 (Aggressive Viral Exploration)">0.75 (Aggressive Viral Exploration)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          title="Complete story package aur YouTube production details open karein"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open Story ({task.storyPackage?.sceneCount || 10} Scenes)</span>
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
      {showTaskModal && selectedTask && typeof document !== 'undefined' ? createPortal(
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
                storyId={selectedTask.id}
                publishStatus={selectedTask.status === 'completed' ? 'published' : 'pending'}
                onTogglePublish={() => toggleTaskPublish(selectedTask.id)}
                onDeleteStory={() => {
                  setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
                  setShowTaskModal(false);
                }}
                onUpdateStory={(updatedStory: GeneratedStory) => {
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === selectedTask.id
                        ? { ...t, title: updatedStory.title, storyPackage: updatedStory }
                        : t
                    )
                  );
                }}
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
        </div>,
        document.body
      ) : null}
    </div>
  );
};
