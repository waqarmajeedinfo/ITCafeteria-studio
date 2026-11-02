/**
 * Autopilot Configuration Store with Comprehensive Undo / Redo State Manager
 * Handles state persistence, undo/redo history stacks, restore defaults,
 * and dirty-state integration across the application.
 */

import { dirtyManager } from './dirtyStore';

export interface AutopilotAgentJD {
  id: string;
  roleName: string;
  agentTitle: string;
  description: string;
  triggerCondition: string;
  executionInterval: string;
  searchQueryTemplate?: string;
  priorityWeight: number; // 1-10
  isActive: boolean;
}

export interface AutopilotSearchRule {
  id: string;
  name: string;
  targetNicheOrCategory: string;
  queryTemplate: string;
  searchEngine: 'google_grounding' | 'fast_internal' | 'custom_web';
  frequency: 'continuous' | 'hourly' | 'daily_scheduled' | 'queue_depleted';
  domainsPriority: string[];
  isActive: boolean;
}

export const DEFAULT_AGENT_JDS: AutopilotAgentJD[] = [
  {
    id: 'jd-radar',
    roleName: 'Radar & Discovery Agent',
    agentTitle: 'Market Trends & Grounding Radar',
    description: 'Scans Google Search, trending YouTube Shorts, and tech news for active channel niche. Extracts verified feature breakdowns.',
    triggerCondition: 'Runs on cadence timer (30s) or when pending queue drops below threshold (<3).',
    executionInterval: 'Every 30 seconds',
    searchQueryTemplate: '{niche} latest hacks, viral shortcuts, breaking features 2026',
    priorityWeight: 9,
    isActive: true
  },
  {
    id: 'jd-decision',
    roleName: 'Decision & Rotation Governor',
    agentTitle: 'Autonomous Queue Replenisher',
    description: 'Balances category rotation order, enforces presenter tags, prevents topic exhaustion, and triggers 3-day sprint if queue <= 1.',
    triggerCondition: 'Triggers immediately whenever story is consumed or queue hits critical low.',
    executionInterval: 'Event-driven & every cycle',
    priorityWeight: 10,
    isActive: true
  },
  {
    id: 'jd-producer',
    roleName: 'Script & Scene Producer',
    agentTitle: 'Roman Urdu Script Engine',
    description: 'Generates structured 7-to-15 scene scripts in natural Roman Urdu with pattern-interrupt hooks (0-10s) and step-by-step guidance.',
    triggerCondition: 'Runs as soon as Decision Agent approves a fresh, verified topic.',
    executionInterval: 'On-demand pipeline',
    priorityWeight: 9,
    isActive: true
  },
  {
    id: 'jd-director',
    roleName: 'Cinematic Director Agent',
    agentTitle: 'Google Flow Visual Director',
    description: 'Crafts Google Flow camera directions (pan, tilt, push-in zoom), 3D holographic UI props, volumetric lighting, and aspect ratio.',
    triggerCondition: 'Runs in parallel with Script Producer for each individual scene.',
    executionInterval: 'Per-scene assembly',
    priorityWeight: 8,
    isActive: true
  },
  {
    id: 'jd-refiner',
    roleName: 'Metadata & CTR Optimizer',
    agentTitle: 'Publishing Package Packager',
    description: 'Generates 2-line punchy thumbnail headlines, SEO YouTube title, viral tags, pinned comment question, and TikTok captions.',
    triggerCondition: 'Post-script generation stage.',
    executionInterval: 'Per-story completion',
    priorityWeight: 8,
    isActive: true
  },
  {
    id: 'jd-quality',
    roleName: 'Phonetic & Defense Guard',
    agentTitle: 'Quality & Pronunciation Gatekeeper',
    description: 'Runs phonetic dictionary regex substitutions on dialogue to eliminate TTS speech engine stutter, and scans against 58+ video catalog.',
    triggerCondition: 'Final validation barrier before saving to Pending Queue.',
    executionInterval: 'Instant pre-flight gate',
    priorityWeight: 10,
    isActive: true
  }
];

export const DEFAULT_SEARCH_RULES: AutopilotSearchRule[] = [
  {
    id: 'sr-breaking-tech',
    name: 'Breaking Tech & Model Releases',
    targetNicheOrCategory: 'AI & Smart Technology',
    queryTemplate: 'latest Gemini, OpenAI, Claude breakthroughs and features this month',
    searchEngine: 'google_grounding',
    frequency: 'continuous',
    domainsPriority: ['blog.google', 'openai.com', 'theverge.com'],
    isActive: true
  },
  {
    id: 'sr-pc-hacks',
    name: 'PC & Windows Productivity Hacks',
    targetNicheOrCategory: 'PC & Windows Hacks',
    queryTemplate: 'Windows 11 hidden shortcuts, registry tweaks, storage cleaning tricks 2026',
    searchEngine: 'google_grounding',
    frequency: 'queue_depleted',
    domainsPriority: ['microsoft.com', 'support.microsoft.com', 'xda-developers.com'],
    isActive: true
  },
  {
    id: 'sr-beauty-trends',
    name: 'Skincare & Beauty Viral Trends',
    targetNicheOrCategory: 'Beauty & Grooming',
    queryTemplate: 'trending 5-minute everyday makeup routine, glass skin hydration tips',
    searchEngine: 'google_grounding',
    frequency: 'continuous',
    domainsPriority: ['allure.com', 'vogue.com', 'healthline.com'],
    isActive: true
  }
];

export interface AutopilotConfiguration {
  isDaemonActive: boolean;
  automationMode: 'autonomous' | 'supervised';
  cadenceSeconds: number;
  autoPostTimeSlot: string;
  defaultSceneCount: number;
  strictDuplicateDefense: boolean;
  autoHotloadThumbnails: boolean;
  autoSyncCalendar: boolean;
  autoRotatePresenters: boolean;
  targetChannelId: string;
  flowPromptStyle: string;
  sprintDurationDays: number;
  enableCharacterTags: boolean;
  // Dynamic priorities, JDs & search controls:
  lowInventoryThreshold: number;
  criticalSprintThreshold: number;
  searchStrategy: 'deep_grounding' | 'fast_scan' | 'catalog_priority' | 'multi_source';
  agentJDs: AutopilotAgentJD[];
  searchRules: AutopilotSearchRule[];
  customTriggerRules?: string;
  enableDaily6AmCheck?: boolean;
  autoPublishCompleted?: boolean;
  duplicateCheckStrictness?: 'deep' | 'balanced' | 'strict';
}

export const DEFAULT_AUTOPILOT_CONFIG: AutopilotConfiguration = {
  isDaemonActive: false, // Default: Full manual control (STOPPED)
  automationMode: 'supervised',
  cadenceSeconds: 30,
  autoPostTimeSlot: '6:00 PM PKT (Prime Loop)',
  defaultSceneCount: 10,
  strictDuplicateDefense: true,
  autoHotloadThumbnails: true,
  autoSyncCalendar: true,
  autoRotatePresenters: true,
  targetChannelId: 'itcafeteria',
  flowPromptStyle: 'Cinematic 3D Hologram + Anchor Split',
  sprintDurationDays: 3,
  enableCharacterTags: true,
  lowInventoryThreshold: 3,
  criticalSprintThreshold: 1,
  searchStrategy: 'deep_grounding',
  agentJDs: DEFAULT_AGENT_JDS,
  searchRules: DEFAULT_SEARCH_RULES,
  enableDaily6AmCheck: true,
  autoPublishCompleted: false,
  duplicateCheckStrictness: 'deep',
  customTriggerRules:
    'Trigger 3-day sprint if pending stories count <= 1. Replenish single rotated category if pending stories count < 3. Cross-sync to Content Calendar and Thumbnail Studio.'
};

const STORAGE_KEYS = {
  SETTINGS: 'itcafeteria_autopilot_settings_v2',
  HISTORY: 'itcafeteria_autopilot_history_v2',
  FUTURE: 'itcafeteria_autopilot_future_v2'
};

const MAX_HISTORY_LENGTH = 30;

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? parsed : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

export function loadAutopilotConfig(): AutopilotConfiguration {
  if (typeof window === 'undefined') return { ...DEFAULT_AUTOPILOT_CONFIG };
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_AUTOPILOT_CONFIG,
        ...parsed,
        agentJDs: Array.isArray(parsed.agentJDs) && parsed.agentJDs.length > 0 ? parsed.agentJDs : DEFAULT_AGENT_JDS,
        searchRules: Array.isArray(parsed.searchRules) && parsed.searchRules.length > 0 ? parsed.searchRules : DEFAULT_SEARCH_RULES
      };
    }
  } catch (e) {
    console.warn('Failed to parse autopilot settings:', e);
  }
  return { ...DEFAULT_AUTOPILOT_CONFIG };
}

export function getAutopilotHistoryStacks(): { history: AutopilotConfiguration[]; future: AutopilotConfiguration[] } {
  const history = safeParse<AutopilotConfiguration[]>(STORAGE_KEYS.HISTORY, []);
  const future = safeParse<AutopilotConfiguration[]>(STORAGE_KEYS.FUTURE, []);
  return {
    history: Array.isArray(history) ? history : [],
    future: Array.isArray(future) ? future : []
  };
}

function persistStacks(history: AutopilotConfiguration[], future: AutopilotConfiguration[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(-MAX_HISTORY_LENGTH)));
    localStorage.setItem(STORAGE_KEYS.FUTURE, JSON.stringify(future.slice(-MAX_HISTORY_LENGTH)));
  } catch (e) {
    console.warn('Failed to persist undo/redo stacks:', e);
  }
}

function notifyConfigUpdate(config: AutopilotConfiguration, action: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('itcafeteria_autopilot_config_updated', {
        detail: { config, action, timestamp: Date.now() }
      })
    );
  }
}

/**
 * Update configuration with an automatic snapshot saved to history.
 */
export function updateAutopilotConfig(
  updates: Partial<AutopilotConfiguration>,
  actionName = 'Config Updated'
): AutopilotConfiguration {
  const current = loadAutopilotConfig();
  const nextConfig: AutopilotConfiguration = { ...current, ...updates };

  const { history } = getAutopilotHistoryStacks();
  const updatedHistory = [...history, current].slice(-MAX_HISTORY_LENGTH);

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextConfig));
    persistStacks(updatedHistory, []); // Future is cleared on new mutations
  } catch (e) {
    console.warn('Failed to write autopilot settings:', e);
  }

  notifyConfigUpdate(nextConfig, actionName);
  return nextConfig;
}

/**
 * Undo the last configuration modification.
 */
export function undoAutopilotConfig(): { success: boolean; config: AutopilotConfiguration } {
  const { history, future } = getAutopilotHistoryStacks();
  if (history.length === 0) {
    return { success: false, config: loadAutopilotConfig() };
  }

  const current = loadAutopilotConfig();
  const previous = history[history.length - 1];
  const newHistory = history.slice(0, -1);
  const newFuture = [current, ...future].slice(0, MAX_HISTORY_LENGTH);

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(previous));
    persistStacks(newHistory, newFuture);
  } catch (e) {
    console.warn('Failed to apply undo to storage:', e);
  }

  notifyConfigUpdate(previous, 'UNDO_APPLIED');
  return { success: true, config: previous };
}

/**
 * Redo the previously undone configuration modification.
 */
export function redoAutopilotConfig(): { success: boolean; config: AutopilotConfiguration } {
  const { history, future } = getAutopilotHistoryStacks();
  if (future.length === 0) {
    return { success: false, config: loadAutopilotConfig() };
  }

  const current = loadAutopilotConfig();
  const next = future[0];
  const newFuture = future.slice(1);
  const newHistory = [...history, current].slice(-MAX_HISTORY_LENGTH);

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
    persistStacks(newHistory, newFuture);
  } catch (e) {
    console.warn('Failed to apply redo to storage:', e);
  }

  notifyConfigUpdate(next, 'REDO_APPLIED');
  return { success: true, config: next };
}

/**
 * Restore all settings to clean default baseline.
 */
export function restoreDefaultAutopilotConfig(): AutopilotConfiguration {
  const current = loadAutopilotConfig();
  const { history } = getAutopilotHistoryStacks();
  const updatedHistory = [...history, current].slice(-MAX_HISTORY_LENGTH);

  const cleanDefaults = { ...DEFAULT_AUTOPILOT_CONFIG };

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cleanDefaults));
    persistStacks(updatedHistory, []);
  } catch (e) {
    console.warn('Failed to restore defaults in storage:', e);
  }

  notifyConfigUpdate(cleanDefaults, 'RESTORE_DEFAULTS');
  return cleanDefaults;
}
