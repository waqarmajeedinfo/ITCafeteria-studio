import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Unlock,
  MoveRight,
  RotateCcw,
  Check,
  AlertTriangle,
  FolderTree,
  Edit2,
  Save,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  Shield,
  GitBranch,
  RefreshCw
} from 'lucide-react';
import type { TabType } from '../App';
import { dirtyManager } from '../lib/dirtyStore';
import {
  pushStudioStatePatch,
  isHydratingRemoteState,
  getGitHubSyncStatus,
  triggerGitHubSyncNow,
  GITHUB_SYNC_STATUS_EVENT,
  type GitHubSyncStatusInfo
} from '../lib/studioSyncStore';


export interface MenuGroupConfig {
  id: string;
  label: string;
  isLocked: boolean;
}

export interface MenuItemConfig {
  id: TabType;
  label: string;
  groupId: string;
  isLocked: boolean;
  roleVisibility?: 'all' | 'admin' | 'standard';
}

export interface ButtonLabelsConfig {
  phoneticDictionary: string;
  manageChannels: string;
  topicBank: string;
  goLive: string;
  agentManagement: string;
  search48h: string;
  aiMemory: string;
  editBanner: string;
  theme: string;
  holoBg: string;
  settings: string;
  mobileMenu: string;
  wcg: string;
  ugc: string;
}

export const DEFAULT_BUTTON_LABELS: ButtonLabelsConfig = {
  phoneticDictionary: 'Phonetic Rules Dictionary',
  manageChannels: 'Manage Channels',
  topicBank: 'Topic Bank',
  goLive: 'Go Live',
  agentManagement: 'Agent Management',
  search48h: '48h Search',
  aiMemory: 'AI Memory',
  editBanner: 'Edit Banner',
  theme: 'Theme',
  holoBg: 'Holo BG',
  settings: 'Settings',
  mobileMenu: 'Navigation Menu',
  wcg: 'WCG',
  ugc: 'UGC',
};

export const BUTTON_LABEL_META: Array<{
  key: keyof ButtonLabelsConfig;
  location: string;
  defaultLabel: string;
}> = [
  { key: 'phoneticDictionary', location: 'Top Bar Left', defaultLabel: 'Phonetic Rules Dictionary' },
  { key: 'manageChannels', location: 'Top Bar Left', defaultLabel: 'Manage Channels' },
  { key: 'topicBank', location: 'Top Bar Left', defaultLabel: 'Topic Bank' },
  { key: 'goLive', location: 'Top Bar Left', defaultLabel: 'Go Live' },
  { key: 'agentManagement', location: 'Top Bar Left', defaultLabel: 'Agent Management' },
  { key: 'search48h', location: 'Top Bar (Next to Agent Mgmt)', defaultLabel: '48h Search' },
  { key: 'aiMemory', location: 'Top Bar (Next to Agent Mgmt)', defaultLabel: 'AI Memory' },
  { key: 'editBanner', location: 'Top Bar Right', defaultLabel: 'Edit Banner' },
  { key: 'theme', location: 'Top Bar Right', defaultLabel: 'Theme' },
  { key: 'holoBg', location: 'Top Bar Right', defaultLabel: 'Holo BG' },
  { key: 'settings', location: 'Bottom Menu Bar Right', defaultLabel: 'Settings' },
  { key: 'wcg', location: 'Menu Bar (Beside AI Studios)', defaultLabel: 'WCG' },
  { key: 'ugc', location: 'Menu Bar (Between WCG & Settings)', defaultLabel: 'UGC' },
  { key: 'mobileMenu', location: 'Mobile Menu Toggle', defaultLabel: 'Navigation Menu' },
];

export interface MenuCustomizerState {
  groups: MenuGroupConfig[];
  items: MenuItemConfig[];
  buttonLabels?: ButtonLabelsConfig;
}

export const DEFAULT_MENU_STATE: MenuCustomizerState = {
  groups: [
    { id: 'core', label: 'Core Channel', isLocked: true },
    { id: 'automation', label: 'Autopilot & Agents', isLocked: true },
    { id: 'management', label: 'Management & Queue', isLocked: true },
    { id: 'ai', label: 'AI Studios', isLocked: true },
  ],
  items: [
    // Core Channel (4)
    { id: 'analytics', label: 'Channel Diagnostics', groupId: 'core', isLocked: true, roleVisibility: 'all' },
    { id: 'live', label: 'Live Insights (YouTube + TikTok)', groupId: 'core', isLocked: true, roleVisibility: 'all' },
    { id: 'signals', label: 'Growth Signals & Anomalies', groupId: 'core', isLocked: true, roleVisibility: 'all' },
    { id: 'benchmarking', label: 'Competitor Benchmarks', groupId: 'core', isLocked: true, roleVisibility: 'all' },

    // Autopilot & Agents (3)
    { id: 'autopilot', label: 'Autopilot Coordinator', groupId: 'automation', isLocked: true, roleVisibility: 'all' },
    { id: 'simulator', label: 'Agent Flow Simulator', groupId: 'automation', isLocked: true, roleVisibility: 'all' },
    { id: 'community', label: 'Community Polls', groupId: 'automation', isLocked: true, roleVisibility: 'all' },

    // Management & Queue (5)
    { id: 'pending', label: 'Pending Stories & Target Queue', groupId: 'management', isLocked: true, roleVisibility: 'all' },
    { id: 'calendar', label: 'Content Calendar', groupId: 'management', isLocked: true, roleVisibility: 'all' },
    { id: 'duplicates', label: 'Duplicate Checker', groupId: 'management', isLocked: true, roleVisibility: 'all' },
    { id: 'masterlist', label: 'Master List', groupId: 'management', isLocked: true, roleVisibility: 'all' },
    { id: 'roadmap', label: 'Upscaling (v3.42+)', groupId: 'management', isLocked: true, roleVisibility: 'all' },

    // AI Studios (7)
    { id: 'chat', label: 'AI Script Chatbot', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: 'search', label: 'Search Grounding', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: 'video', label: 'Omni Flash Video', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: 'image', label: 'Thumbnails (Nano Banana)', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: 'transcribe', label: 'Voice Dictation', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: 'music', label: 'Music Generator', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
    { id: '3d', label: '3D Virtual Studio', groupId: 'ai', isLocked: true, roleVisibility: 'all' },
  ],
  buttonLabels: { ...DEFAULT_BUTTON_LABELS },
};

const STORAGE_KEY = 'itcafeteria_menu_customizer_config';

export function loadMenuConfig(): MenuCustomizerState {
  if (typeof window === 'undefined') return DEFAULT_MENU_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.groups) && Array.isArray(parsed.items)) {
        const sanitizedItems = parsed.items.map((it: MenuItemConfig) => {
          if (it.id === 'duplicates' && it.label && (it.label.includes('(58)') || it.label.includes('(63)'))) {
            return { ...it, label: 'Duplicate Checker' };
          }
          return {
            ...it,
            roleVisibility: it.roleVisibility || 'all'
          };
        });
        return {
          ...parsed,
          items: sanitizedItems,
          buttonLabels: {
            ...DEFAULT_BUTTON_LABELS,
            ...(parsed.buttonLabels || {}),
          },
        };
      }
    }
  } catch (e) {
    console.error('Failed to load menu config', e);
  }
  return DEFAULT_MENU_STATE;
}

export function saveMenuConfig(config: MenuCustomizerState) {
  try {
    const normalized: MenuCustomizerState = {
      ...config,
      buttonLabels: {
        ...DEFAULT_BUTTON_LABELS,
        ...(config.buttonLabels || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('itcafeteria_menu_customizer_updated', { detail: normalized }));
      if (!isHydratingRemoteState()) {
        pushStudioStatePatch({ menuConfig: normalized }, 'menu_and_button_labels_updated');
      }
    }
  } catch (e) {
    console.error('Failed to save menu config', e);
  }
}

interface MenuBarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MenuCustomizerState;
  onSave: (updated: MenuCustomizerState) => void;
  onReset: () => void;
}

export const MenuBarCustomizerModal: React.FC<MenuBarCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset
}) => {
  const [localConfig, setLocalConfig] = useState<MenuCustomizerState>(() => ({
    ...config,
    buttonLabels: { ...DEFAULT_BUTTON_LABELS, ...(config.buttonLabels || {}) },
  }));
  const [selectedItemId, setSelectedItemId] = useState<TabType | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<TabType | null>(null);
  const [tempLabel, setTempLabel] = useState<string>('');
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GitHubSyncStatusInfo | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const tempLabelRef = useRef<string>('');
  const editingItemIdRef = useRef<TabType | null>(null);
  const editingGroupIdRef = useRef<string | null>(null);

  useEffect(() => {
    tempLabelRef.current = tempLabel;
  }, [tempLabel]);

  useEffect(() => {
    editingItemIdRef.current = editingItemId;
  }, [editingItemId]);

  useEffect(() => {
    editingGroupIdRef.current = editingGroupId;
  }, [editingGroupId]);

  const markDirty = (newConfig: MenuCustomizerState) => {
    dirtyManager.setDirty({
      id: 'menu_customizer',
      title: 'Menu Bar Customizer',
      description: 'Menu layout, button labels aur role visibility ki tabdeeliyaan ghair mehfooz hain.',
      onSave: () => handleApply(newConfig),
      onDiscard: () => {
        setLocalConfig({
          ...config,
          buttonLabels: { ...DEFAULT_BUTTON_LABELS, ...(config.buttonLabels || {}) },
        });
        dirtyManager.clearDirty('menu_customizer');
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      setLocalConfig({
        ...config,
        buttonLabels: { ...DEFAULT_BUTTON_LABELS, ...(config.buttonLabels || {}) },
      });
      setConfirmReset(false);
      setSyncFeedback(null);
      getGitHubSyncStatus().then((st) => {
        if (st) setSyncStatus(st);
      });
      const onSyncStatus = (e: any) => {
        if (e.detail) setSyncStatus(e.detail);
      };
      window.addEventListener(GITHUB_SYNC_STATUS_EVENT, onSyncStatus);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        window.removeEventListener(GITHUB_SYNC_STATUS_EVENT, onSyncStatus);
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        dirtyManager.clearDirty('menu_customizer');
      };
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Toggle Lock for a Group
  const toggleGroupLock = (groupId: string) => {
    const next = {
      ...localConfig,
      groups: localConfig.groups.map((g) => (g.id === groupId ? { ...g, isLocked: !g.isLocked } : g))
    };
    setLocalConfig(next);
    markDirty(next);
  };

  // Move an entire top-level menu group left/right
  const handleMoveGroup = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localConfig.groups.length) return;

    setLockWarning(null);
    const nextGroups = [...localConfig.groups];
    // If groups were locked, seamlessly unlock them to permit user's intentional reordering
    nextGroups[index] = { ...nextGroups[index], isLocked: false };
    nextGroups[targetIndex] = { ...nextGroups[targetIndex], isLocked: false };

    const [moved] = nextGroups.splice(index, 1);
    nextGroups.splice(targetIndex, 0, moved);

    const next = { ...localConfig, groups: nextGroups };
    setLocalConfig(next);
    markDirty(next);
  };

  const handleSetGroupPosition = (currentIndex: number, newIndex: number) => {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= localConfig.groups.length) return;

    setLockWarning(null);
    const nextGroups = [...localConfig.groups];
    nextGroups[currentIndex] = { ...nextGroups[currentIndex], isLocked: false };
    nextGroups[newIndex] = { ...nextGroups[newIndex], isLocked: false };

    const [moved] = nextGroups.splice(currentIndex, 1);
    nextGroups.splice(newIndex, 0, moved);

    const next = { ...localConfig, groups: nextGroups };
    setLocalConfig(next);
    markDirty(next);
  };

  // Toggle Lock for an Item
  const toggleItemLock = (itemId: TabType) => {
    const next = {
      ...localConfig,
      items: localConfig.items.map((item) => (item.id === itemId ? { ...item, isLocked: !item.isLocked } : item))
    };
    setLocalConfig(next);
    markDirty(next);
  };

  // Change Role Visibility for an Item
  const handleRoleVisibilityChange = (itemId: TabType, visibility: 'all' | 'admin' | 'standard') => {
    const next = {
      ...localConfig,
      items: localConfig.items.map((item) => (item.id === itemId ? { ...item, roleVisibility: visibility } : item))
    };
    setLocalConfig(next);
    markDirty(next);
  };

  // Move an item to a new group
  const handleMoveItem = (itemId: TabType, targetGroupId: string) => {
    const item = localConfig.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.isLocked) {
      setLockWarning(`"${item.label}" is waqt LOCKED hai! Ghalti se move hone se bachane ke liye isay pehle unlock karein.`);
      return;
    }

    const currentGroup = localConfig.groups.find((g) => g.id === item.groupId);
    if (currentGroup?.isLocked) {
      setLockWarning(`Parent Menu "${currentGroup.label}" is waqt LOCKED hai! Pehle parent menu ko unlock karein.`);
      return;
    }

    const targetGroup = localConfig.groups.find((g) => g.id === targetGroupId);
    if (targetGroup?.isLocked) {
      setLockWarning(`Destination Menu "${targetGroup.label}" is waqt LOCKED hai! Pehle destination menu ko unlock karein.`);
      return;
    }

    setLockWarning(null);

    const next = {
      ...localConfig,
      items: localConfig.items.map((i) => (i.id === itemId ? { ...i, groupId: targetGroupId } : i))
    };
    setLocalConfig(next);
    markDirty(next);
  };

  // Move a submenu item up or down within its current menu group
  const handleMoveItemOrder = (itemId: TabType, direction: 'up' | 'down') => {
    const currentItem = localConfig.items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const groupItems = localConfig.items.filter((i) => i.groupId === currentItem.groupId);
    const indexInGroup = groupItems.findIndex((i) => i.id === itemId);
    const targetIndexInGroup = direction === 'up' ? indexInGroup - 1 : indexInGroup + 1;
    if (targetIndexInGroup < 0 || targetIndexInGroup >= groupItems.length) return;

    const targetItem = groupItems[targetIndexInGroup];
    const idxCurrent = localConfig.items.findIndex((i) => i.id === itemId);
    const idxTarget = localConfig.items.findIndex((i) => i.id === targetItem.id);
    if (idxCurrent === -1 || idxTarget === -1) return;

    setLockWarning(null);
    const nextItems = [...localConfig.items];
    const temp = nextItems[idxCurrent];
    nextItems[idxCurrent] = nextItems[idxTarget];
    nextItems[idxTarget] = temp;

    const next = { ...localConfig, items: nextItems };
    setLocalConfig(next);
    markDirty(next);
  };

  // Jump a submenu item directly to a slot number within its current menu group
  const handleSetItemPosition = (itemId: TabType, newIndexInGroup: number) => {
    const currentItem = localConfig.items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const groupItems = localConfig.items.filter((i) => i.groupId === currentItem.groupId);
    const currentIndexInGroup = groupItems.findIndex((i) => i.id === itemId);
    if (newIndexInGroup === currentIndexInGroup || newIndexInGroup < 0 || newIndexInGroup >= groupItems.length) return;

    setLockWarning(null);
    const reorderedGroup = [...groupItems];
    const [moved] = reorderedGroup.splice(currentIndexInGroup, 1);
    reorderedGroup.splice(newIndexInGroup, 0, moved);

    let cursor = 0;
    const nextItems = localConfig.items.map((it) => {
      if (it.groupId === currentItem.groupId) {
        return reorderedGroup[cursor++];
      }
      return it;
    });

    const next = { ...localConfig, items: nextItems };
    setLocalConfig(next);
    markDirty(next);
  };

  // Start renaming a group
  const startEditGroup = (group: MenuGroupConfig) => {
    if (group.isLocked) {
      setLockWarning(`"${group.label}" locked hai. Rename karne ke liye pehle unlock karein.`);
      return;
    }
    setLockWarning(null);
    setEditingGroupId(group.id);
    setTempLabel(group.label);
    tempLabelRef.current = group.label;
    editingGroupIdRef.current = group.id;
  };

  const saveEditGroup = (groupId: string, newLabel?: string) => {
    const labelToSave = (newLabel !== undefined ? newLabel : tempLabelRef.current || tempLabel).trim();
    if (!labelToSave) {
      setEditingGroupId(null);
      editingGroupIdRef.current = null;
      return;
    }
    const next = {
      ...localConfig,
      groups: localConfig.groups.map((g) => (g.id === groupId ? { ...g, label: labelToSave } : g))
    };
    setLocalConfig(next);
    markDirty(next);
    setEditingGroupId(null);
    editingGroupIdRef.current = null;
    setTempLabel('');
    tempLabelRef.current = '';
  };

  // Start renaming an item
  const startEditItem = (item: MenuItemConfig) => {
    if (item.isLocked) {
      setLockWarning(`"${item.label}" locked hai. Rename karne ke liye pehle unlock karein.`);
      return;
    }
    setLockWarning(null);
    setEditingItemId(item.id);
    setTempLabel(item.label);
    tempLabelRef.current = item.label;
    editingItemIdRef.current = item.id;
  };

  const saveEditItem = (itemId: TabType, newLabel?: string) => {
    const labelToSave = (newLabel !== undefined ? newLabel : tempLabelRef.current || tempLabel).trim();
    if (!labelToSave) {
      setEditingItemId(null);
      editingItemIdRef.current = null;
      return;
    }
    const next = {
      ...localConfig,
      items: localConfig.items.map((i) => (i.id === itemId ? { ...i, label: labelToSave } : i))
    };
    setLocalConfig(next);
    markDirty(next);
    setEditingItemId(null);
    editingItemIdRef.current = null;
    setTempLabel('');
    tempLabelRef.current = '';
  };

  const unlockItemFromWarning = () => {
    if (selectedItemId) {
      toggleItemLock(selectedItemId);
      setLockWarning(null);
    }
  };

  const handleButtonLabelChange = (key: keyof ButtonLabelsConfig, value: string) => {
    const next: MenuCustomizerState = {
      ...localConfig,
      buttonLabels: {
        ...DEFAULT_BUTTON_LABELS,
        ...(localConfig.buttonLabels || {}),
        [key]: value,
      },
    };
    setLocalConfig(next);
    markDirty(next);
  };

  const toggleAllLocks = (locked: boolean) => {
    const next: MenuCustomizerState = {
      ...localConfig,
      groups: localConfig.groups.map((g) => ({ ...g, isLocked: locked })),
      items: localConfig.items.map((i) => ({ ...i, isLocked: locked })),
    };
    setLockWarning(null);
    setLocalConfig(next);
    markDirty(next);
  };

  const handleSyncToGitHubNow = async () => {
    setIsSyncingNow(true);
    setSyncFeedback(null);
    const sanitizedLabels: ButtonLabelsConfig = {
      ...DEFAULT_BUTTON_LABELS,
      ...(localConfig.buttonLabels || {}),
    };
    (Object.keys(DEFAULT_BUTTON_LABELS) as Array<keyof ButtonLabelsConfig>).forEach((k) => {
      if (!sanitizedLabels[k] || !sanitizedLabels[k].trim()) {
        sanitizedLabels[k] = DEFAULT_BUTTON_LABELS[k];
      } else {
        sanitizedLabels[k] = sanitizedLabels[k].trim();
      }
    });
    const toSave = { ...localConfig, buttonLabels: sanitizedLabels };
    saveMenuConfig(toSave);
    onSave(toSave);
    const res = await triggerGitHubSyncNow('Manual Sync from Menu & Button Customizer');
    setIsSyncingNow(false);
    if (res?.committed) {
      setSyncFeedback(`GitHub repo mein commit ho gaya (${String(res.sha || '').slice(0, 7)})`);
    } else if (res?.ok) {
      setSyncFeedback('Live studio state server par mehfooz ho gayi (all devices synced).');
    } else {
      setSyncFeedback(res?.error || 'Sync complete with warning.');
    }
  };

  const handleApply = (overrideConfig?: MenuCustomizerState) => {
    const base = overrideConfig || localConfig;
    const rawLabels = {
      ...DEFAULT_BUTTON_LABELS,
      ...(base.buttonLabels || {}),
    };
    const sanitizedLabels: ButtonLabelsConfig = { ...rawLabels };
    (Object.keys(DEFAULT_BUTTON_LABELS) as Array<keyof ButtonLabelsConfig>).forEach((k) => {
      const val = (sanitizedLabels[k] || '').trim();
      sanitizedLabels[k] = val || DEFAULT_BUTTON_LABELS[k];
    });

    let finalConfig: MenuCustomizerState = {
      ...base,
      buttonLabels: sanitizedLabels,
    };

    const activeItemId = editingItemIdRef.current || editingItemId;
    const activeGroupId = editingGroupIdRef.current || editingGroupId;
    const activeLabel = (tempLabelRef.current || tempLabel).trim();

    if (activeItemId && activeLabel) {
      finalConfig = {
        ...finalConfig,
        items: finalConfig.items.map((i) =>
          i.id === activeItemId ? { ...i, label: activeLabel } : i
        )
      };
    }

    if (activeGroupId && activeLabel) {
      finalConfig = {
        ...finalConfig,
        groups: finalConfig.groups.map((g) =>
          g.id === activeGroupId ? { ...g, label: activeLabel } : g
        )
      };
    }

    saveMenuConfig(finalConfig);
    onSave(finalConfig);
    dirtyManager.clearDirty('menu_customizer');
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 350);
  };

  const handleResetDefaults = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onReset();
    setLocalConfig(DEFAULT_MENU_STATE);
    saveMenuConfig(DEFAULT_MENU_STATE);
    dirtyManager.clearDirty('menu_customizer');
  };

  const allAnyLocked = localConfig.groups.some((g) => g.isLocked) || localConfig.items.some((i) => i.isLocked);

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[80vh] h-full sm:h-auto flex flex-col shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >

        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">Menu, Button Renamer &amp; Live GitHub Sync</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                  All Buttons Editable
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Har button aur menu ko rename karein — sabhi tabdeeliyaan live sab devices aur GitHub repo par sync hoti hain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleAllLocks(!allAnyLocked)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                allAnyLocked
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              }`}
              title={allAnyLocked ? 'Rename ke liye sab menus unlock karein' : 'Sab menus dubara lock karein'}
            >
              {allAnyLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{allAnyLocked ? 'Unlock All' : 'Lock All'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Band Karein"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lock Warning Toast / Notice */}
        {lockWarning && (
          <div className="mx-5 mt-4 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-start justify-between gap-3 shadow-lg shadow-rose-950/40 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Action Blocked (Protection Active):</p>
                <p className="text-slate-300 mt-0.5">{lockWarning}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedItemId && (
                <button
                  onClick={unlockItemFromWarning}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Unlock Item
                </button>
              )}
              <button
                onClick={() => setLockWarning(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body — Top Bar & Action Buttons + Interactive Grid of Menu Categories */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-5"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Section 1: Rename Every Top-Bar & Action Button */}
          <div className="border border-cyan-500/30 bg-slate-950/75 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-white">Top Bar &amp; Action Buttons (Rename Any Button)</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {BUTTON_LABEL_META.length} Global Buttons
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BUTTON_LABEL_META.map((btnMeta) => {
                const currentVal = localConfig.buttonLabels?.[btnMeta.key] ?? btnMeta.defaultLabel;
                return (
                  <div
                    key={btnMeta.key}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-cyan-300 font-semibold truncate">{btnMeta.location}</span>
                      {currentVal !== btnMeta.defaultLabel && (
                        <button
                          type="button"
                          onClick={() => handleButtonLabelChange(btnMeta.key, btnMeta.defaultLabel)}
                          className="text-slate-400 hover:text-amber-300 cursor-pointer shrink-0"
                          title={`Reset to "${btnMeta.defaultLabel}"`}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleButtonLabelChange(btnMeta.key, e.target.value)}
                      placeholder={btnMeta.defaultLabel}
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localConfig.groups.map((group, groupIndex) => {
              const groupItems = localConfig.items.filter((i) => i.groupId === group.id);

              return (
                <div
                  key={group.id}
                  className={`border rounded-2xl p-4 flex flex-col transition-all ${
                    group.isLocked
                      ? 'bg-slate-950/70 border-slate-800 shadow-md'
                      : 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded-lg bg-slate-800 text-cyan-400">
                        <Layers className="w-4 h-4" />
                      </span>

                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        group.isLocked
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`} title={`Top Bar Position #${groupIndex + 1}`}>
                        #{groupIndex + 1}
                      </span>

                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempLabel}
                            onChange={(e) => setTempLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditGroup(group.id)}
                            onBlur={() => saveEditGroup(group.id)}
                            className="bg-slate-800 border border-cyan-400 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onMouseDown={() => saveEditGroup(group.id)}
                            className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px]"
                            title="Save Rename"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="font-bold text-sm text-white truncate">{group.label}</h4>
                          <button
                            onClick={() => startEditGroup(group)}
                            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Rename Menu"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleMoveGroup(groupIndex, 'left')}
                          disabled={groupIndex === 0}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Move Menu Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={groupIndex}
                          onChange={(e) => handleSetGroupPosition(groupIndex, Number(e.target.value))}
                          className="bg-slate-900 border-none text-[10px] text-cyan-300 font-mono font-bold focus:outline-none px-1 py-0.5 cursor-pointer"
                          title="Top Bar Slot Number"
                        >
                          {localConfig.groups.map((_, idx) => (
                            <option key={idx} value={idx}>#{idx + 1}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMoveGroup(groupIndex, 'right')}
                          disabled={groupIndex === localConfig.groups.length - 1}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Move Menu Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        {groupItems.length} items
                      </span>

                      <button
                        onClick={() => toggleGroupLock(group.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                          group.isLocked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={group.isLocked ? 'Menu Locked' : 'Menu Unlocked'}
                      >
                        {group.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Items in this Menu with Role Visibility Toggle */}
                  <div className="mt-3 space-y-2 flex-1">
                    {groupItems.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        Is menu mein koi item nahi hai.
                      </div>
                    ) : (
                      groupItems.map((item, itemIndexInGroup) => {
                        const isSelected = selectedItemId === item.id;
                        const roleVis = item.roleVisibility || 'all';

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/40 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${item.isLocked ? 'bg-amber-400' : 'bg-emerald-400'}`} />

                                {editingItemId === item.id ? (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <input
                                      type="text"
                                      value={tempLabel}
                                      onChange={(e) => setTempLabel(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditItem(item.id)}
                                      onBlur={() => saveEditItem(item.id)}
                                      className="bg-slate-800 border border-cyan-400 text-white rounded px-2 py-0.5 text-xs font-medium focus:outline-none w-36"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        saveEditItem(item.id);
                                      }}
                                      className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 cursor-pointer"
                                    >
                                      <Save className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-xs font-semibold text-slate-200 truncate">{item.label}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditItem(item);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                      title="Rename item"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {/* Submenu Up & Down Reordering Controls */}
                                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800" title="Submenu Order in Menu">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItemOrder(item.id, 'up')}
                                    disabled={itemIndexInGroup === 0}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 disabled:opacity-25 transition-colors cursor-pointer"
                                    title="Move Submenu Up (Upar Karein)"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <select
                                    value={itemIndexInGroup}
                                    onChange={(e) => handleSetItemPosition(item.id, Number(e.target.value))}
                                    className="bg-slate-900 border-none text-[10px] text-cyan-300 font-mono font-bold focus:outline-none px-1 py-0.5 cursor-pointer rounded"
                                    title="Submenu Position Number"
                                  >
                                    {groupItems.map((_, idx) => (
                                      <option key={idx} value={idx}>#{idx + 1}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItemOrder(item.id, 'down')}
                                    disabled={itemIndexInGroup === groupItems.length - 1}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 disabled:opacity-25 transition-colors cursor-pointer"
                                    title="Move Submenu Down (Neechay Karein)"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => toggleItemLock(item.id)}
                                  className={`p-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    item.isLocked
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  }`}
                                  title={item.isLocked ? 'Locked' : 'Unlocked'}
                                >
                                  {item.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                </button>

                                <div className="relative flex items-center gap-1 text-[11px] bg-slate-800/80 border border-slate-700 rounded-lg px-1.5 py-0.5">
                                  <span className="text-slate-400 text-[10px]">Move:</span>
                                  <select
                                    value={item.groupId}
                                    onChange={(e) => handleMoveItem(item.id, e.target.value)}
                                    disabled={item.isLocked}
                                    className={`bg-transparent text-slate-200 text-[11px] focus:outline-none cursor-pointer ${
                                      item.isLocked ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    {localConfig.groups.map((g) => (
                                      <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                                        {g.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Role Visibility Toggle Bar */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]" onClick={(e) => e.stopPropagation()}>
                              <span className="text-slate-400 flex items-center gap-1 font-medium">
                                <Shield className="w-3 h-3 text-cyan-400" />
                                <span>Role Visibility:</span>
                              </span>

                              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleRoleVisibilityChange(item.id, 'all')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    roleVis === 'all'
                                      ? 'bg-cyan-600 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="Visible to All Users (Standard & Admin)"
                                >
                                  All
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRoleVisibilityChange(item.id, 'admin')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    roleVis === 'admin'
                                      ? 'bg-purple-600 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="Restrict to Admin Role Only"
                                >
                                  Admin Only
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRoleVisibilityChange(item.id, 'standard')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    roleVis === 'standard'
                                      ? 'bg-blue-600 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="Standard Role Only"
                                >
                                  Standard
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with GitHub Cross-Device Sync */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {confirmReset ? (
              <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-500/40 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-rose-200 font-medium">Confirm reset?</span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                >
                  Haan, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSyncToGitHubNow}
              disabled={isSyncingNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              title={syncStatus?.repo ? `Sync to ${syncStatus.repo} (${syncStatus.branch})` : 'Sync all studio & agent data'}
            >
              {isSyncingNow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
              <span>{isSyncingNow ? 'Syncing...' : 'Sync GitHub'}</span>
            </button>

            {(syncFeedback || syncStatus?.lastCommitSha) && (
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                {syncFeedback || `Commit ${String(syncStatus?.lastCommitSha || '').slice(0, 7)}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {saveToast && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApply()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Menu &amp; Buttons</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default MenuBarCustomizerModal;
