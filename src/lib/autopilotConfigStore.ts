/**
 * Autopilot Configuration Store with Comprehensive Undo / Redo State Manager
 * Handles state persistence, undo/redo history stacks, restore defaults,
 * and dirty-state integration across the application.
 */

import { dirtyManager } from './dirtyStore';

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
  enableCharacterTags: true
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
      return { ...DEFAULT_AUTOPILOT_CONFIG, ...parsed };
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
