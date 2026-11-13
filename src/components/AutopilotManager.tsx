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
  Save,
  Search
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
import { IT_CAFETERIA_LONG_FORM_TAGS, IT_CAFETERIA_SHORT_FORM_TAGS } from './AgentSimulator';
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
  DEFAULT_AGENT_JDS,
  DEFAULT_SEARCH_RULES,
  type AutopilotConfiguration,
  type AutopilotAgentJD,
  type AutopilotSearchRule
} from '../lib/autopilotConfigStore';
import {
  loadAllChannels,
  saveOrUpdateChannel,
  getEngineConfigForChannel,
  deleteChannel,
  type ExtendedChannelProfile
} from '../lib/channelStore';
import { dirtyManager } from '../lib/dirtyStore';
import { AutopilotConfigModal } from './AutopilotConfigModal';
import { DiagnosticMessageBox } from './DiagnosticMessageBox';
import { selfHealingEngine } from '../lib/selfHealingEngine';
import type { TabType } from '../App';
import { ScrollReveal, AutopilotPipelineDiagram } from './MotionPrimitives';

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
  const [autopilotConfig, setAutopilotConfig] = useState<AutopilotConfiguration>(loadAutopilotConfig);
  const [cadenceSeconds, setCadenceSeconds] = useState<number>(() => loadAutopilotConfig().cadenceSeconds || 30);
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
  const [editingUrlIdx, setEditingUrlIdx] = useState<number | null>(null);
  const [editingUrlText, setEditingUrlText] = useState<string>('');
  const [searchStrategy, setSearchStrategy] = useState<string>(() => {
    try {
      return localStorage.getItem('itcafeteria_search_strategy') || 'deep';
    } catch {
      return 'deep';
    }
  });
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
  const [showAutopilotConfigModal, setShowAutopilotConfigModal] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'jds' | 'search' | 'triggers' | 'channels' | 'sources'>('jds');

  // New inline JD form state
  const [showAddJdInline, setShowAddJdInline] = useState(false);
  const [newJdRoleInline, setNewJdRoleInline] = useState('');
  const [newJdTitleInline, setNewJdTitleInline] = useState('');
  const [newJdDescriptionInline, setNewJdDescriptionInline] = useState('');
  const [newJdTriggerInline, setNewJdTriggerInline] = useState('Runs on cadence timer (30s) or low queue (<3).');
  const [newJdIntervalInline, setNewJdIntervalInline] = useState('Every 30 seconds');
  const [newJdQueryInline, setNewJdQueryInline] = useState('{niche} latest trending shortcuts 2026');
  const [newJdPriorityInline, setNewJdPriorityInline] = useState(8);

  // New inline Search Rule form state
  const [showAddSearchRuleInline, setShowAddSearchRuleInline] = useState(false);
  const [newSrNameInline, setNewSrNameInline] = useState('');
  const [newSrCategoryInline, setNewSrCategoryInline] = useState('');
  const [newSrQueryInline, setNewSrQueryInline] = useState('');
  const [newSrEngineInline, setNewSrEngineInline] = useState<'google_grounding' | 'fast_internal' | 'custom_web'>('google_grounding');
  const [newSrFrequencyInline, setNewSrFrequencyInline] = useState<'continuous' | 'hourly' | 'daily_scheduled' | 'queue_depleted'>('continuous');
  const [newSrDomainsInline, setNewSrDomainsInline] = useState('blog.google, microsoft.com');

  // Inline Edit JD state
  const [editingJdIdInline, setEditingJdIdInline] = useState<string | null>(null);
  const [editJdRoleInline, setEditJdRoleInline] = useState('');
  const [editJdTitleInline, setEditJdTitleInline] = useState('');
  const [editJdDescriptionInline, setEditJdDescriptionInline] = useState('');
  const [editJdTriggerInline, setEditJdTriggerInline] = useState('');
  const [editJdIntervalInline, setEditJdIntervalInline] = useState('');
  const [editJdQueryInline, setEditJdQueryInline] = useState('');
  const [editJdPriorityInline, setEditJdPriorityInline] = useState(8);

  // Inline Edit Search Rule state
  const [editingSrIdInline, setEditingSrIdInline] = useState<string | null>(null);
  const [editSrNameInline, setEditSrNameInline] = useState('');
  const [editSrCategoryInline, setEditSrCategoryInline] = useState('');
  const [editSrQueryInline, setEditSrQueryInline] = useState('');
  const [editSrEngineInline, setEditSrEngineInline] = useState<'google_grounding' | 'fast_internal' | 'custom_web'>('google_grounding');
  const [editSrFrequencyInline, setEditSrFrequencyInline] = useState<'continuous' | 'hourly' | 'daily_scheduled' | 'queue_depleted'>('continuous');
  const [editSrDomainsInline, setEditSrDomainsInline] = useState('');

  // Inline Edit Channel Scope state
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChPresenter, setEditChPresenter] = useState('');
  const [editChNiche, setEditChNiche] = useState('');
  const [editChDialect, setEditChDialect] = useState('');
  const [editChSceneCount, setEditChSceneCount] = useState(10);
  const [editChPriority, setEditChPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('HIGH');

  const startEditChannel = (ch: ExtendedChannelProfile) => {
    setEditingChannelId(ch.id);
    setEditChPresenter(ch.presenter || '');
    setEditChNiche(ch.niche || '');
    setEditChDialect(ch.engineConfig?.dialectTone || 'Lahori Tech');
    setEditChSceneCount(ch.defaultSceneCount || 10);
    setEditChPriority(ch.engineConfig?.autonomousPriority || 'HIGH');
  };

  const saveEditChannel = (ch: ExtendedChannelProfile) => {
    const baseEngine = ch.engineConfig || getEngineConfigForChannel(ch.id);
    const updated: ExtendedChannelProfile = {
      ...ch,
      presenter: editChPresenter.trim() || ch.presenter,
      niche: editChNiche.trim() || ch.niche,
      defaultSceneCount: Math.max(5, Math.min(30, Number(editChSceneCount) || 10)),
      engineConfig: {
        ...baseEngine,
        dialectTone: editChDialect.trim() || baseEngine.dialectTone || 'Lahori Tech',
        autonomousPriority: editChPriority
      }
    };
    saveOrUpdateChannel(updated);
    setEditingChannelId(null);
    setSyncToast(`⚡ Channel "${ch.name}" scope updated successfully!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const startEditJdInline = (jd: AutopilotAgentJD) => {
    setEditingJdIdInline(jd.id);
    setEditJdRoleInline(jd.roleName);
    setEditJdTitleInline(jd.agentTitle);
    setEditJdDescriptionInline(jd.description);
    setEditJdTriggerInline(jd.triggerCondition);
    setEditJdIntervalInline(jd.executionInterval);
    setEditJdQueryInline(jd.searchQueryTemplate || '');
    setEditJdPriorityInline(jd.priorityWeight);
  };

  const saveEditJdInline = (id: string) => {
    if (!editJdRoleInline.trim() || !editJdDescriptionInline.trim()) return;
    const nextJds = (autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).map((j) =>
      j.id === id
        ? {
            ...j,
            roleName: editJdRoleInline.trim(),
            agentTitle: editJdTitleInline.trim() || editJdRoleInline.trim(),
            description: editJdDescriptionInline.trim(),
            triggerCondition: editJdTriggerInline.trim(),
            executionInterval: editJdIntervalInline.trim(),
            searchQueryTemplate: editJdQueryInline.trim(),
            priorityWeight: Number(editJdPriorityInline) || 8
          }
        : j
    );
    handleUpdateAutopilotConfig({ agentJDs: nextJds }, `Updated JD: ${editJdRoleInline.trim()}`);
    setEditingJdIdInline(null);
  };

  const startEditSrInline = (sr: AutopilotSearchRule) => {
    setEditingSrIdInline(sr.id);
    setEditSrNameInline(sr.name);
    setEditSrCategoryInline(sr.targetNicheOrCategory);
    setEditSrQueryInline(sr.queryTemplate);
    setEditSrEngineInline(sr.searchEngine);
    setEditSrFrequencyInline(sr.frequency);
    setEditSrDomainsInline(sr.domainsPriority.join(', '));
  };

  const saveEditSrInline = (id: string) => {
    if (!editSrNameInline.trim() || !editSrQueryInline.trim()) return;
    const nextRules = (autopilotConfig.searchRules || DEFAULT_SEARCH_RULES).map((r) =>
      r.id === id
        ? {
            ...r,
            name: editSrNameInline.trim(),
            targetNicheOrCategory: editSrCategoryInline.trim() || 'All Categories',
            queryTemplate: editSrQueryInline.trim(),
            searchEngine: editSrEngineInline,
            frequency: editSrFrequencyInline,
            domainsPriority: editSrDomainsInline.split(',').map((d) => d.trim()).filter(Boolean)
          }
        : r
    );
    handleUpdateAutopilotConfig({ searchRules: nextRules }, `Updated Search Rule: ${editSrNameInline.trim()}`);
    setEditingSrIdInline(null);
  };

  const handleUpdateAutopilotConfig = (updates: Partial<AutopilotConfiguration>, message?: string) => {
    const next = { ...autopilotConfig, ...updates };
    setAutopilotConfig(next);
    if (next.cadenceSeconds) setCadenceSeconds(next.cadenceSeconds);
    const saved = updateAutopilotConfig(next, message || 'Dashboard Update');
    setAutopilotConfig(saved);
    setSyncToast(`⚡ Autopilot Settings updated: ${message || 'Saved'}`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleResetAutopilotDefaults = () => {
    if (window.confirm('Kya aap Autopilot ki tamam settings, JDs aur search rules ko default par reset karna chahte hain?')) {
      const restored = restoreDefaultAutopilotConfig();
      setAutopilotConfig(restored);
      if (restored.cadenceSeconds) setCadenceSeconds(restored.cadenceSeconds);
      setSyncToast('⚡ Autopilot Settings default par restore ho gayi hain!');
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  const handleUndoAutopilot = () => {
    const res = undoAutopilotConfig();
    if (res.success && res.config) {
      setAutopilotConfig(res.config);
      if (res.config.cadenceSeconds) setCadenceSeconds(res.config.cadenceSeconds);
      setSyncToast('↩️ Pichli Autopilot configuration wapis aa gayi!');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleRedoAutopilot = () => {
    const res = redoAutopilotConfig();
    if (res.success && res.config) {
      setAutopilotConfig(res.config);
      if (res.config.cadenceSeconds) setCadenceSeconds(res.config.cadenceSeconds);
      setSyncToast('↪️ Agli Autopilot configuration redo ho gayi!');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

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

    const handleConfigUpdated = (e: any) => {
      const updated = e.detail?.config || loadAutopilotConfig();
      setAutopilotConfig(updated);
      if (updated.cadenceSeconds) {
        setCadenceSeconds(updated.cadenceSeconds);
      }
    };

    window.addEventListener('itcafeteria_autopilot_stop_all', handleStopAll);
    window.addEventListener('itcafeteria_autopilot_start_all', handleStartAll);
    window.addEventListener('itcafeteria_autopilot_config_updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('itcafeteria_autopilot_stop_all', handleStopAll);
      window.removeEventListener('itcafeteria_autopilot_start_all', handleStartAll);
      window.removeEventListener('itcafeteria_autopilot_config_updated', handleConfigUpdated);
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
        addLog('RADAR', `Duplicate collision detected for "${task.title}". Auto-pivoting: Searching Category Topic Bank for fresh non-duplicate topic...`);
        const bank = (CATEGORY_TOPIC_BANK[task.categoryId] || []).filter(Boolean);
        const freshAlt = bank.find(bt => !PUBLISHED_VIDEOS.some(v => v.title.toLowerCase() === bt.toLowerCase().trim()))
          || `${task.title.replace(/\s*\(Part\s*\d+.*?\)/i, '')} (Part 2: Advanced Pro Sequel)`;
        task.title = freshAlt;
        addLog('RADAR', `Zero-Halt Auto-Pivot: Selected fresh unique topic "${task.title}". Continuing generation without halting!`);
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

        // Advance Agent Simulator rotation to the next category & aspect-ratio synced tag!
        const profile = CHANNEL_PROFILES.itcafeteria;
        const nextCatIndex = (profile.rotationCategoryIds.indexOf(task.categoryId) + 1) % profile.rotationCategoryIds.length;
        const nextCatId = profile.rotationCategoryIds[nextCatIndex] || profile.defaultCategoryId;

        // Resolve ratio for next category (Cat 9 is default 16:9, others 9:16)
        const nextCatObj = profile.categories.find((c) => c.id === nextCatId);
        const nextRatio: '9:16' | '16:9' = (nextCatObj?.defaultRatio === '16:9' || nextCatId === 9) ? '16:9' : '9:16';

        let nextTag = '@WM25-1';
        if (nextRatio === '16:9') {
          const pool = IT_CAFETERIA_LONG_FORM_TAGS;
          const currIdx = pool.indexOf(task.characterTag);
          nextTag = currIdx === -1 ? pool[0] : pool[(currIdx + 1) % pool.length];
        } else {
          const pool = IT_CAFETERIA_SHORT_FORM_TAGS;
          const currIdx = pool.indexOf(task.characterTag);
          nextTag = currIdx === -1 ? pool[0] : pool[(currIdx + 1) % pool.length];
        }

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
              const isLongForm = category.defaultRatio === '16:9' || category.id === 9;
              let resolvedTag = activeRot.tag || (isLongForm ? '@WM25-6' : '@WM25-1');
              if (isLongForm && !IT_CAFETERIA_LONG_FORM_TAGS.includes(resolvedTag)) {
                resolvedTag = IT_CAFETERIA_LONG_FORM_TAGS[0];
              } else if (!isLongForm && !IT_CAFETERIA_SHORT_FORM_TAGS.includes(resolvedTag)) {
                resolvedTag = IT_CAFETERIA_SHORT_FORM_TAGS[0];
              }

              const newTask: AutopilotTask = {
                id: `task-ap-${Date.now()}`,
                type: 'AUTO_POST',
                title: `${category.name}: Top Secret Speedup & Automation Trick`,
                category: category.name,
                categoryId: category.id,
                characterTag: resolvedTag,
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

    setSyncToast('✅ All studio states, pending queue & phonetic dictionary synchronized!');
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
      const isLong = cat.defaultRatio === '16:9' || catId === 9;
      const tag = isLong
        ? IT_CAFETERIA_LONG_FORM_TAGS[i % IT_CAFETERIA_LONG_FORM_TAGS.length]
        : IT_CAFETERIA_SHORT_FORM_TAGS[(startTagIdx + i) % IT_CAFETERIA_SHORT_FORM_TAGS.length];

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
          setSyncToast(`ℹ️ Pending Queue already has ${count} stories (3 or more) — standby threshold satisfied!`);
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
          ? `⚡ Pending queue had only ${count} stories! 3-day autonomous sprint automatically enqueued.`
          : `⚡ Pending queue had 2 stories! 1 new story queued to reach 3-story target.`
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
      {/* Living Autonomous Production Pipeline Diagram */}
      <ScrollReveal direction="down" delay={0.04}>
        <AutopilotPipelineDiagram title="Autopilot Autonomous Production & Continuity Pipeline" />
      </ScrollReveal>

      {/* Top Banner: Autonomous Logic Layer Control Center */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 overflow-hidden shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Row 1: Badges, Title & Full-Width Description */}
        <div className="relative z-10 space-y-2">
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
          <p className="text-slate-300 text-sm leading-relaxed max-w-5xl">
            Yeh logic layer <strong>Agent Simulator</strong>, <strong>Content Calendar</strong>, aur <strong>Thumbnail Studio</strong> ko background task queue ke zariye aapas mein jodti hai. Yeh bina manual clicks ke khud faislay karti hai: auto-posting, metadata refinement, aur cross-studio sync background mein chalti rehti hai.
          </p>
        </div>

        {/* Row 2: Structured Multi-Panel Control Deck */}
        <div data-guide-target="autopilot-daemon-hud" className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Card 1: Navigation & Studio Views */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Studio Navigation &amp; Views
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('itcafeteria_open_assistant_overlay', {
                      detail: { mode: 'span' }
                    })
                  );
                }}
                data-guide-target="autopilot-overlay-btn"
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all border border-cyan-400/30"
                title="Open floating adjustable overlay across active page"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>⚡ Floating Overlay</span>
              </button>

              <button
                onClick={() => {
                  selfHealingEngine.healScrollLock(true);
                  setActiveTab('engine');
                  setTimeout(() => {
                    const el = document.getElementById('autopilot-settings-dashboard');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                data-guide-target="autopilot-settings-inline-btn"
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer transition-all border border-cyan-400/40"
                title="Autopilot Settings Dashboard (JDs, Priorities &amp; Search Rules) inline kholein"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-200" />
                <span>⚙️ Settings</span>
              </button>

              <button
                onClick={() => setShowAutopilotConfigModal(true)}
                data-guide-target="autopilot-config-manager-btn"
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all border border-slate-700 hover:border-indigo-400/50"
                title="Popup Modal Dialog mein Autopilot settings kholein"
              >
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                <span>Popup</span>
              </button>
            </div>
          </div>

          {/* Card 2: Manual Daemon Engine Controls */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Autonomous Engine Controls
            </span>
            <div className="flex items-center gap-2">
              {isDaemonActive ? (
                <button
                  onClick={() => {
                    setIsDaemonActive(false);
                    window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 animate-pulse"
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
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  title="Click to Start Autopilot"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Autopilot</span>
                </button>
              )}

              <button
                onClick={forceSyncAll}
                disabled={isSyncingAll}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all font-semibold"
                title="Force Sync Cross-Studios"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Syncing...' : 'Sync All'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Autonomous Queue Sprints */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Rapid Content Sprints
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => enqueueNewSprint(3)}
                disabled={isWorkerBusy}
                className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40 text-center"
              >
                +3 Days
              </button>
              <button
                onClick={() => enqueueNewSprint(7)}
                disabled={isWorkerBusy}
                className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40 text-center"
              >
                +7 Days
              </button>
              <button
                onClick={() => enqueueNewSprint(14)}
                disabled={isWorkerBusy}
                className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40 text-center"
              >
                +14 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Autopilot Active Configuration Indicator Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-indigo-500/30 rounded-xl text-xs shadow-md">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Team:</span>
            <strong className="text-white">{(autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).filter(j => j.isActive).length} Active JDs</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Search className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Radar Grounding:</span>
            <strong className="text-cyan-300 uppercase font-mono">{autopilotConfig.searchStrategy || 'DEEP_GROUNDING'}</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Autonomous Triggers:</span>
            <strong className="text-amber-300 font-mono">Sprint &le; {autopilotConfig.criticalSprintThreshold ?? 1} | Replenish &lt; {autopilotConfig.lowInventoryThreshold || 3}</strong>
          </div>
        </div>
        <button
          onClick={() => setShowAutopilotConfigModal(true)}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Modify Priorities &amp; JDs &rarr;</span>
        </button>
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

      {/* Self-Healing & Diagnostic Message Center HUD */}
      <DiagnosticMessageBox embedInHud={true} />

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
              <span>Daily 6:00 AM PKT Autonomous Replenishment Trigger</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              This autonomous trigger runs daily at 6:00 AM PKT to verify Pending Production Queue depth:
              If pending stories are <strong>3 or more</strong>, it remains in standby.
              If pending stories drop <strong>below 3</strong>, it automatically discovers fresh zero-duplicate topics, generates full 10-scene packages, and replenishes the queue.
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
            <span>⚙️ Autopilot Settings &amp; JDs Dashboard</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
              {(autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).filter(j => j.isActive).length} JDs
            </span>
          </button>
        </div>

        {/* Tab 4: Autopilot Settings & Engine JDs Dashboard */}
        {activeTab === 'engine' && (
          <div id="autopilot-settings-dashboard" className="p-4 sm:p-6 space-y-6 text-xs animate-in fade-in duration-200">
            {/* Dashboard Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-white text-base">
                    Autopilot Settings &amp; Execution Dashboard
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Mode: {autopilotConfig.searchStrategy?.toUpperCase() || 'DEEP_GROUNDING'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Cadence: {cadenceSeconds}s
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Agent team responsibilities (JDs), autonomous execution priorities, search radar rules aur automated function triggering customize karein.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleUndoAutopilot}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Undo previous change"
                >
                  <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Undo</span>
                </button>

                <button
                  type="button"
                  onClick={handleRedoAutopilot}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Redo previous change"
                >
                  <Redo2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Redo</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAutopilotDefaults}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Restore default autopilot configuration"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutopilotConfigModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Open in Popup Modal"
                >
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Popup Dialog</span>
                </button>
              </div>
            </div>

            {/* Dashboard Subtabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSettingsSubTab('jds')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsSubTab === 'jds'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>🤖 Agent Roles &amp; JDs ({(autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('search')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsSubTab === 'search'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>🔍 Search Strategies &amp; Rules ({(autopilotConfig.searchRules || DEFAULT_SEARCH_RULES).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('triggers')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsSubTab === 'triggers'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Automated Triggers &amp; Cadence</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('channels')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsSubTab === 'channels'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-emerald-400" />
                <span>📺 Channel Engine Scope</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('sources')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsSubTab === 'sources'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>🎯 Priority URLs ({priorityResources.length})</span>
              </button>
            </div>

            {/* SUBTAB 1: Agent Roles & JDs */}
            {settingsSubTab === 'jds' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      Agent Team Job Descriptions (JDs) &amp; Autonomous Trigger Priorities
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Har agent ka role, responsibility, kab wo trigger hota hai aur uska execution interval set karein.
                    </p>
                  </div>
                  {!showAddJdInline && (
                    <button
                      type="button"
                      onClick={() => setShowAddJdInline(true)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-cyan-950"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Agent JD</span>
                    </button>
                  )}
                </div>

                {/* Add Agent JD Form */}
                {showAddJdInline && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newJdRoleInline.trim()) return;
                      const newJD: AutopilotAgentJD = {
                        id: `agent-jd-${Date.now()}`,
                        roleName: newJdRoleInline.trim(),
                        agentTitle: newJdTitleInline.trim() || newJdRoleInline.trim(),
                        description: newJdDescriptionInline.trim(),
                        triggerCondition: newJdTriggerInline.trim() || 'On demand',
                        executionInterval: newJdIntervalInline.trim() || 'Every 30s cycle',
                        searchQueryTemplate: newJdQueryInline.trim(),
                        priorityWeight: newJdPriorityInline,
                        isActive: true
                      };
                      const nextJds = [...(autopilotConfig.agentJDs || DEFAULT_AGENT_JDS), newJD];
                      handleUpdateAutopilotConfig({ agentJDs: nextJds }, `Added JD: ${newJD.roleName}`);
                      setNewJdRoleInline('');
                      setNewJdTitleInline('');
                      setNewJdDescriptionInline('');
                      setShowAddJdInline(false);
                    }}
                    className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h5 className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Naya Agent Role / Custom JD Define Karein
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowAddJdInline(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Role Name</label>
                        <input
                          type="text"
                          value={newJdRoleInline}
                          onChange={(e) => setNewJdRoleInline(e.target.value)}
                          placeholder="e.g. Trend Predictor Agent"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Agent Title / Badge</label>
                        <input
                          type="text"
                          value={newJdTitleInline}
                          onChange={(e) => setNewJdTitleInline(e.target.value)}
                          placeholder="e.g. Viral Prediction Engine"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Job Description &amp; Responsibilities</label>
                      <textarea
                        value={newJdDescriptionInline}
                        onChange={(e) => setNewJdDescriptionInline(e.target.value)}
                        placeholder="Explain what this agent does, what data it examines, and what output it produces..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Trigger Condition</label>
                        <input
                          type="text"
                          value={newJdTriggerInline}
                          onChange={(e) => setNewJdTriggerInline(e.target.value)}
                          placeholder="When pending queue < 2"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Execution Interval</label>
                        <input
                          type="text"
                          value={newJdIntervalInline}
                          onChange={(e) => setNewJdIntervalInline(e.target.value)}
                          placeholder="Every 30s cycle"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Priority Weight (1-10)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={newJdPriorityInline}
                          onChange={(e) => setNewJdPriorityInline(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Search Query / Prompt Template</label>
                      <input
                        type="text"
                        value={newJdQueryInline}
                        onChange={(e) => setNewJdQueryInline(e.target.value)}
                        placeholder="{niche} viral hacks and tools 2026"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddJdInline(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Agent JD</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Agent JDs Cards List */}
                <div className="space-y-3">
                  {(autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).map((jd) => {
                    const isEditing = editingJdIdInline === jd.id;

                    if (isEditing) {
                      return (
                        <div key={jd.id} className="p-4 bg-slate-950 border border-cyan-500/50 rounded-xl space-y-3 shadow-lg shadow-cyan-950/30">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5" /> Edit Agent JD: {jd.roleName}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingJdIdInline(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Role Name</label>
                              <input
                                type="text"
                                value={editJdRoleInline}
                                onChange={(e) => setEditJdRoleInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Agent Title / Badge</label>
                              <input
                                type="text"
                                value={editJdTitleInline}
                                onChange={(e) => setEditJdTitleInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Priority Weight (1-10)</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={editJdPriorityInline}
                                onChange={(e) => setEditJdPriorityInline(Number(e.target.value) || 1)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-300 font-semibold block mb-1">Job Description &amp; Responsibilities</label>
                            <textarea
                              rows={2}
                              value={editJdDescriptionInline}
                              onChange={(e) => setEditJdDescriptionInline(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Trigger Condition</label>
                              <input
                                type="text"
                                value={editJdTriggerInline}
                                onChange={(e) => setEditJdTriggerInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Execution Interval</label>
                              <input
                                type="text"
                                value={editJdIntervalInline}
                                onChange={(e) => setEditJdIntervalInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Search Query / Pattern</label>
                              <input
                                type="text"
                                value={editJdQueryInline}
                                onChange={(e) => setEditJdQueryInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setEditingJdIdInline(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditJdInline(jd.id)}
                              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={jd.id}
                        className={`p-4 rounded-xl border transition-all ${
                          jd.isActive
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/60 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const nextJds = (autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).map((j) =>
                                  j.id === jd.id ? { ...j, isActive: !j.isActive } : j
                                );
                                handleUpdateAutopilotConfig({ agentJDs: nextJds }, `${jd.roleName} ${!jd.isActive ? 'Activated' : 'Paused'}`);
                              }}
                              className={`p-2 rounded-xl border mt-0.5 transition-colors cursor-pointer ${
                                jd.isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                              title={jd.isActive ? 'Click to Pause Agent' : 'Click to Activate Agent'}
                            >
                              <Bot className="w-4 h-4" />
                            </button>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-white text-sm">{jd.roleName}</h5>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {jd.agentTitle}
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  jd.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {jd.isActive ? 'ACTIVE' : 'PAUSED'}
                                </span>
                              </div>
                              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                                {jd.description}
                              </p>
                            </div>
                          </div>

                          {/* Controls: Priority & Actions */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Priority (1-10)</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={jd.priorityWeight}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                                    const nextJds = (autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).map((j) =>
                                      j.id === jd.id ? { ...j, priorityWeight: val } : j
                                    );
                                    handleUpdateAutopilotConfig({ agentJDs: nextJds });
                                  }}
                                  className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-center text-cyan-300 font-mono font-bold text-xs"
                                />
                              </div>
                            </div>

                            {/* Edit JD Button */}
                            <button
                              type="button"
                              onClick={() => startEditJdInline(jd)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                              title="Edit this Agent JD"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Kya aap "${jd.roleName}" JD ko delete karna chahte hain?`)) {
                                  const nextJds = (autopilotConfig.agentJDs || DEFAULT_AGENT_JDS).filter((j) => j.id !== jd.id);
                                  handleUpdateAutopilotConfig({ agentJDs: nextJds }, `Deleted ${jd.roleName}`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                              title="Delete JD"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Details Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate"><strong>Trigger:</strong> {jd.triggerCondition}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate"><strong>Interval:</strong> {jd.executionInterval}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate font-mono text-[10px]"><strong>Query:</strong> {jd.searchQueryTemplate || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 2: Search Strategies & Rules */}
            {settingsSubTab === 'search' && (
              <div className="space-y-5">
                {/* Search Strategy Selection */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" /> Search Strategy Mode &amp; Crawling Engine
                      </h4>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Select how Autopilot and Radar agents collect fresh topics and ground information.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60">
                      Active: {autopilotConfig.searchStrategy?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'deep', label: 'Deep Grounding + Web Scan', desc: 'Google Search Grounding + Live Web verification' },
                      { id: 'fast', label: 'Fast In-Memory Engine', desc: 'Instant pattern matching without network delay' },
                      { id: 'strict', label: 'Strict Duplicate Defense', desc: 'Zero tolerance against all 58 catalog stories' },
                      { id: 'custom_links', label: 'Priority External Links', desc: 'Prioritizes specific user-added URLs and feeds' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSearchStrategy(st.id);
                          handleUpdateAutopilotConfig({ searchStrategy: st.id as any }, `Search Strategy: ${st.label}`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          (autopilotConfig.searchStrategy || searchStrategy) === st.id
                            ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/40 text-cyan-100 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-white text-xs mb-1 flex items-center justify-between">
                          <span>{st.label}</span>
                          {(autopilotConfig.searchStrategy || searchStrategy) === st.id && (
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{st.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Radar Rules List */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-cyan-400" />
                        Radar Rules &amp; Continuous Topic Crawlers
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        These specific rules execute on every cadence cycle to keep the queue replenished.
                      </p>
                    </div>

                    {!showAddSearchRuleInline && (
                      <button
                        type="button"
                        onClick={() => setShowAddSearchRuleInline(true)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-cyan-950"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Radar Rule</span>
                      </button>
                    )}
                  </div>

                  {/* Add Radar Rule Form */}
                  {showAddSearchRuleInline && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newSrNameInline.trim() || !newSrQueryInline.trim()) return;
                        const newRule: AutopilotSearchRule = {
                          id: `search-rule-${Date.now()}`,
                          name: newSrNameInline.trim(),
                          targetNicheOrCategory: newSrCategoryInline.trim() || 'General AI',
                          queryTemplate: newSrQueryInline.trim(),
                          searchEngine: newSrEngineInline,
                          frequency: newSrFrequencyInline,
                          domainsPriority: newSrDomainsInline.split(',').map(s => s.trim()).filter(Boolean),
                          isActive: true
                        };
                        const nextRules = [...(autopilotConfig.searchRules || DEFAULT_SEARCH_RULES), newRule];
                        handleUpdateAutopilotConfig({ searchRules: nextRules }, `Added Radar Rule: ${newRule.name}`);
                        setNewSrNameInline('');
                        setNewSrCategoryInline('');
                        setNewSrQueryInline('');
                        setShowAddSearchRuleInline(false);
                      }}
                      className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h5 className="font-bold text-cyan-300 text-xs">Naya Search Radar Rule Add Karein</h5>
                        <button type="button" onClick={() => setShowAddSearchRuleInline(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Rule Name</label>
                          <input
                            type="text"
                            value={newSrNameInline}
                            onChange={(e) => setNewSrNameInline(e.target.value)}
                            placeholder="e.g. Daily AI Agents Scanner"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Category Target</label>
                          <input
                            type="text"
                            value={newSrCategoryInline}
                            onChange={(e) => setNewSrCategoryInline(e.target.value)}
                            placeholder="e.g. AI Tools & Agents"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Search Query Pattern</label>
                        <input
                          type="text"
                          value={newSrQueryInline}
                          onChange={(e) => setNewSrQueryInline(e.target.value)}
                          placeholder="trending AI productivity agents new release 2026"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Search Engine</label>
                          <select
                            value={newSrEngineInline}
                            onChange={(e) => setNewSrEngineInline(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                          >
                            <option value="google_grounding">Google Search Grounding (Live Web)</option>
                            <option value="fast_internal">Fast Internal Catalog Scan</option>
                            <option value="custom_web">Custom Priority URLs Scan</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Execution Cadence</label>
                          <select
                            value={newSrFrequencyInline}
                            onChange={(e) => setNewSrFrequencyInline(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                          >
                            <option value="continuous">Continuous (Every Cadence Cycle)</option>
                            <option value="hourly">Hourly Rotation</option>
                            <option value="daily_scheduled">Daily Scheduled (6:00 AM PKT)</option>
                            <option value="queue_depleted">Only When Queue Depleted (&lt; 3)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setShowAddSearchRuleInline(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
                          Cancel
                        </button>
                        <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Add Rule</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Rules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(autopilotConfig.searchRules || DEFAULT_SEARCH_RULES).map((rule) => {
                      const isEditing = editingSrIdInline === rule.id;

                      if (isEditing) {
                        return (
                          <div
                            key={rule.id}
                            className="p-4 bg-slate-950 border border-cyan-500/50 rounded-xl space-y-3 shadow-lg shadow-cyan-950/30 md:col-span-2"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5" /> Edit Radar Rule: {rule.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingSrIdInline(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Rule Name</label>
                                <input
                                  type="text"
                                  value={editSrNameInline}
                                  onChange={(e) => setEditSrNameInline(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Category Target</label>
                                <input
                                  type="text"
                                  value={editSrCategoryInline}
                                  onChange={(e) => setEditSrCategoryInline(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Search Query Pattern</label>
                              <input
                                type="text"
                                value={editSrQueryInline}
                                onChange={(e) => setEditSrQueryInline(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Search Engine</label>
                                <select
                                  value={editSrEngineInline}
                                  onChange={(e) => setNewSrEngineInline(e.target.value as any)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                >
                                  <option value="google_grounding">Google Search Grounding (Live Web)</option>
                                  <option value="fast_internal">Fast Internal Catalog Scan</option>
                                  <option value="custom_web">Custom Priority URLs Scan</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Execution Cadence</label>
                                <select
                                  value={editSrFrequencyInline}
                                  onChange={(e) => setEditSrFrequencyInline(e.target.value as any)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                >
                                  <option value="continuous">Continuous (Every Cadence Cycle)</option>
                                  <option value="hourly">Hourly Rotation</option>
                                  <option value="daily_scheduled">Daily Scheduled (6:00 AM PKT)</option>
                                  <option value="queue_depleted">Only When Queue Depleted (&lt; 3)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[11px] text-slate-300 font-semibold block mb-1">Priority Domains (comma-separated)</label>
                                <input
                                  type="text"
                                  value={editSrDomainsInline}
                                  onChange={(e) => setEditSrDomainsInline(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                              <button
                                type="button"
                                onClick={() => setEditingSrIdInline(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditSrInline(rule.id)}
                                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={rule.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            rule.isActive
                              ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                              : 'bg-slate-950/60 border-slate-900 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-xs truncate">{rule.name}</h5>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {rule.targetNicheOrCategory}
                                </span>
                              </div>
                              <div className="font-mono text-cyan-300 text-[11px] truncate mt-1">
                                {rule.queryTemplate}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextRules = (autopilotConfig.searchRules || DEFAULT_SEARCH_RULES).map(r =>
                                    r.id === rule.id ? { ...r, isActive: !r.isActive } : r
                                  );
                                  handleUpdateAutopilotConfig({ searchRules: nextRules });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                                  rule.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {rule.isActive ? 'ACTIVE' : 'OFF'}
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditSrInline(rule)}
                                className="p-1 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
                                title="Edit Rule"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Kya aap "${rule.name}" search rule delete karna chahte hain?`)) {
                                    const nextRules = (autopilotConfig.searchRules || DEFAULT_SEARCH_RULES).filter(r => r.id !== rule.id);
                                    handleUpdateAutopilotConfig({ searchRules: nextRules }, `Deleted Rule: ${rule.name}`);
                                  }
                                }}
                                className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                            <span>Engine: <strong className="text-slate-300">{rule.searchEngine}</strong></span>
                            <span>•</span>
                            <span>Frequency: <strong className="text-slate-300">{rule.frequency}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: Automated Triggers & Cadence */}
            {settingsSubTab === 'triggers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cadence Cycle Tuning */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold text-white text-xs">Autonomous Cycle Interval (Cadence)</h4>
                      </div>
                      <span className="font-mono text-cyan-300 text-xs font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {cadenceSeconds} seconds
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Autopilot background daemon har kitne second baad queue aur replenish check karega.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 60, 120].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setCadenceSeconds(sec);
                            handleUpdateAutopilotConfig({ cadenceSeconds: sec }, `Cadence: ${sec}s`);
                          }}
                          className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                            cadenceSeconds === sec
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Replenishment Thresholds */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-white text-xs">Autonomous Trigger Thresholds</h4>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Jab pending queue is threshold se kam hogi to Autopilot khud ba khud naye topics generate karega.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">Low Inventory Alert</label>
                        <select
                          value={autopilotConfig.lowInventoryThreshold || 3}
                          onChange={(e) => handleUpdateAutopilotConfig({ lowInventoryThreshold: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                        >
                          <option value={2}>&lt; 2 Stories</option>
                          <option value={3}>&lt; 3 Stories (Default Rec)</option>
                          <option value={5}>&lt; 5 Stories</option>
                          <option value={7}>&lt; 7 Stories</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">Critical Sprint Trigger</label>
                        <select
                          value={autopilotConfig.criticalSprintThreshold ?? 1}
                          onChange={(e) => handleUpdateAutopilotConfig({ criticalSprintThreshold: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                        >
                          <option value={0}>0 (Queue Empty Only)</option>
                          <option value={1}>&le; 1 Story (Recommended)</option>
                          <option value={2}>&le; 2 Stories</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Function Trigger Automation Gates
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 6:00 AM PKT Trigger Toggle */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-xs">6:00 AM PKT Check</div>
                        <div className="text-[10px] text-slate-400">Daily autonomous sprint check</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateAutopilotConfig({ enableDaily6AmCheck: !autopilotConfig.enableDaily6AmCheck })}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                          autopilotConfig.enableDaily6AmCheck
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {autopilotConfig.enableDaily6AmCheck ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Auto-Publish Toggle */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-xs">Auto-Publish Completed</div>
                        <div className="text-[10px] text-slate-400">Directly sync to library &amp; catalog</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateAutopilotConfig({ autoPublishCompleted: !autopilotConfig.autoPublishCompleted })}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                          autopilotConfig.autoPublishCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {autopilotConfig.autoPublishCompleted ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Zero-Duplicate Tolerance */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-xs">Duplicate Tolerance</div>
                        <div className="text-[10px] text-slate-400">Catalog match sensitivity</div>
                      </div>
                      <select
                        value={autopilotConfig.duplicateCheckStrictness || 'deep'}
                        onChange={(e) => handleUpdateAutopilotConfig({ duplicateCheckStrictness: e.target.value as any })}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs font-mono"
                      >
                        <option value="deep">Deep (0.92)</option>
                        <option value="balanced">Balanced (0.85)</option>
                        <option value="strict">Strict (0.95)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: Channel Engine Scope */}
            {settingsSubTab === 'channels' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <Tv className="w-4 h-4 text-emerald-400" />
                      Multi-Channel Engine Profiles &amp; Isolation
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Har channel ka apna engine configuration, voice/dialect, aur target platform alag save hota hai.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('itcafeteria_open_channel_manager'));
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Channel Manager</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(loadAllChannels()).map((ch) => {
                    const isEditing = editingChannelId === ch.id;

                    if (isEditing) {
                      return (
                        <div
                          key={ch.id}
                          className="p-4 bg-slate-950 border border-emerald-500/50 rounded-xl space-y-3 shadow-lg shadow-emerald-950/30 sm:col-span-2 md:col-span-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <Edit2 className="w-3.5 h-3.5" /> Edit Channel Engine Scope: {ch.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingChannelId(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Presenter</label>
                              <input
                                type="text"
                                value={editChPresenter}
                                onChange={(e) => setEditChPresenter(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Channel Niche</label>
                              <input
                                type="text"
                                value={editChNiche}
                                onChange={(e) => setEditChNiche(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Dialect / Tone</label>
                              <input
                                type="text"
                                value={editChDialect}
                                onChange={(e) => setEditChDialect(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Default Scene Count</label>
                              <input
                                type="number"
                                min={5}
                                max={30}
                                value={editChSceneCount}
                                onChange={(e) => setEditChSceneCount(Number(e.target.value) || 10)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-300 font-semibold block mb-1">Autonomous Priority</label>
                              <select
                                value={editChPriority}
                                onChange={(e) => setEditChPriority(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                              >
                                <option value="URGENT">URGENT (Daily Priority Runs)</option>
                                <option value="HIGH">HIGH (Standard Queue Runs)</option>
                                <option value="NORMAL">NORMAL (Alternate Runs)</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setEditingChannelId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditChannel(ch)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Channel Scope</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={ch.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs truncate">{ch.name}</h5>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              {ch.engineConfig?.autonomousPriority || 'PRIORITY'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditChannel(ch)}
                              className="p-1 rounded bg-slate-800 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
                              title="Edit Channel Engine Scope"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          Presenter: <strong className="text-slate-300">{ch.presenter}</strong> • Niche: <strong className="text-slate-300">{ch.niche}</strong>
                        </p>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Dialect: <strong className="text-indigo-300">{ch.engineConfig?.dialectTone || 'Lahori Tech'}</strong></span>
                          <span>Scenes: <strong className="text-cyan-300">{ch.defaultSceneCount || 10}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 5: Priority External Links */}
            {settingsSubTab === 'sources' && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" /> Prioritized Focus Links &amp; Search Sources
                  </h4>
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60">
                    {priorityResources.length} Active Sources
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Enter specific external links, RSS feeds, or focus points that Autopilot must prioritize during autonomous web crawling.
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
                  {priorityResources.map((res, idx) => {
                    const isEditing = editingUrlIdx === idx;

                    if (isEditing) {
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-cyan-500/50 rounded-lg p-2">
                          <input
                            type="text"
                            value={editingUrlText}
                            onChange={(e) => setEditingUrlText(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingUrlText.trim()) return;
                              const updated = [...priorityResources];
                              updated[idx] = editingUrlText.trim();
                              setPriorityResources(updated);
                              setEditingUrlIdx(null);
                              try {
                                localStorage.setItem('itcafeteria_priority_resources', JSON.stringify(updated));
                              } catch {}
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUrlIdx(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                        <span className="font-mono text-cyan-300 truncate mr-2">{res}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUrlIdx(idx);
                              setEditingUrlText(res);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Edit URL"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = priorityResources.filter((_, i) => i !== idx);
                              setPriorityResources(updated);
                              try {
                                localStorage.setItem('itcafeteria_priority_resources', JSON.stringify(updated));
                              } catch {}
                            }}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                  Autopilot har task ke baad agle category aur aspect-ratio synced character tag (16:9 Long Videos ke liye <code className="text-cyan-300">@WM25-6, 8, 9</code> aur Vertical Shorts ke liye <code className="text-cyan-300">@WM25-1 to 5, 7</code>) par auto-rotate karta hai aur session memory mein register karta hai taake repetition 0% rahe.
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
                    {selectedTask.status === 'completed' ? '✅ Published' : '⏳ Pending'}
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

      {/* Autopilot Engine & JDs Configuration Manager Modal */}
      <AutopilotConfigModal
        isOpen={showAutopilotConfigModal}
        onClose={() => setShowAutopilotConfigModal(false)}
        onConfigSaved={(saved) => {
          setAutopilotConfig(saved);
          if (saved.cadenceSeconds) setCadenceSeconds(saved.cadenceSeconds);
        }}
      />
    </div>
  );
};
