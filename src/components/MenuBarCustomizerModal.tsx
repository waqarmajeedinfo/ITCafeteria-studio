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
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import type { TabType } from '../App';
import { dirtyManager } from '../lib/dirtyStore';


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
}

export interface MenuCustomizerState {
  groups: MenuGroupConfig[];
  items: MenuItemConfig[];
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
    { id: 'analytics', label: 'Channel Diagnostics', groupId: 'core', isLocked: true },
    { id: 'live', label: 'Live Insights (YouTube + TikTok)', groupId: 'core', isLocked: true },
    { id: 'signals', label: 'Growth Signals & Anomalies', groupId: 'core', isLocked: true },
    { id: 'benchmarking', label: 'Competitor Benchmarks', groupId: 'core', isLocked: true },

    // Autopilot & Agents (3)
    { id: 'autopilot', label: 'Autopilot Coordinator', groupId: 'automation', isLocked: true },
    { id: 'simulator', label: 'Agent Flow Simulator', groupId: 'automation', isLocked: true },
    { id: 'community', label: 'Community Polls', groupId: 'automation', isLocked: true },

    // Management & Queue (5)
    { id: 'pending', label: 'Pending Stories & Target Queue', groupId: 'management', isLocked: true },
    { id: 'calendar', label: 'Content Calendar', groupId: 'management', isLocked: true },
    { id: 'duplicates', label: 'Duplicate Checker', groupId: 'management', isLocked: true },
    { id: 'masterlist', label: 'Master List', groupId: 'management', isLocked: true },
    { id: 'roadmap', label: 'Upscaling (v3.42+)', groupId: 'management', isLocked: true },

    // AI Studios (7)
    { id: 'chat', label: 'AI Script Chatbot', groupId: 'ai', isLocked: true },
    { id: 'search', label: 'Search Grounding', groupId: 'ai', isLocked: true },
    { id: 'video', label: 'Omni Flash Video', groupId: 'ai', isLocked: true },
    { id: 'image', label: 'Thumbnails (Nano Banana)', groupId: 'ai', isLocked: true },
    { id: 'transcribe', label: 'Voice Dictation', groupId: 'ai', isLocked: true },
    { id: 'music', label: 'Music Generator', groupId: 'ai', isLocked: true },
    { id: '3d', label: '3D Virtual Studio', groupId: 'ai', isLocked: true },
  ]
};

const STORAGE_KEY = 'itcafeteria_menu_customizer_config';

export function loadMenuConfig(): MenuCustomizerState {
  if (typeof window === 'undefined') return DEFAULT_MENU_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.groups) && Array.isArray(parsed.items)) {
        // Sanitize any stale hardcoded "(58)" from duplicates label
        const sanitizedItems = parsed.items.map((it: MenuItemConfig) => {
          if (it.id === 'duplicates' && it.label && (it.label.includes('(58)') || it.label.includes('(63)'))) {
            return { ...it, label: 'Duplicate Checker' };
          }
          return it;
        });
        return { ...parsed, items: sanitizedItems };
      }
    }
  } catch (e) {
    console.error('Failed to load menu config', e);
  }
  return DEFAULT_MENU_STATE;
}

export function saveMenuConfig(config: MenuCustomizerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('itcafeteria_menu_customizer_updated', { detail: config }));
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
  const [localConfig, setLocalConfig] = useState<MenuCustomizerState>(config);
  const [selectedItemId, setSelectedItemId] = useState<TabType | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<TabType | null>(null);
  const [tempLabel, setTempLabel] = useState<string>('');
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // References to guarantee no typed label is ever lost during click/blur race condition
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
      description: 'Menu layout aur sub-menu names ki tabdeeliyaan ghair mehfooz hain.',
      onSave: () => handleApply(newConfig),
      onDiscard: () => {
        setLocalConfig(config);
        dirtyManager.clearDirty('menu_customizer');
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
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
  // Move an entire top-level menu group left/right (Reorder top navbar)
  const handleMoveGroup = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localConfig.groups.length) return;

    const currentGroup = localConfig.groups[index];
    if (currentGroup.isLocked) {
      setLockWarning(`"${currentGroup.label}" LOCKED hai. Reorder karne ke liye pehle unlock karein.`);
      return;
    }

    const targetGroup = localConfig.groups[targetIndex];
    if (targetGroup.isLocked) {
      setLockWarning(`"${targetGroup.label}" LOCKED hai. Reorder karne ke liye isay bhi unlock karein.`);
      return;
    }

    setLockWarning(null);
    const nextGroups = [...localConfig.groups];
    const [moved] = nextGroups.splice(index, 1);
    nextGroups.splice(targetIndex, 0, moved);

    const next = { ...localConfig, groups: nextGroups };
    setLocalConfig(next);
    markDirty(next);
  };

  const handleSetGroupPosition = (currentIndex: number, newIndex: number) => {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= localConfig.groups.length) return;
    const currentGroup = localConfig.groups[currentIndex];
    if (currentGroup.isLocked) {
      setLockWarning(`"${currentGroup.label}" LOCKED hai. Reorder karne ke liye pehle unlock karein.`);
      return;
    }

    const targetGroup = localConfig.groups[newIndex];
    if (targetGroup.isLocked) {
      setLockWarning(`"${targetGroup.label}" LOCKED hai. Reorder karne ke liye isay bhi unlock karein.`);
      return;
    }

    setLockWarning(null);
    const nextGroups = [...localConfig.groups];
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

  // Move an item to a new group (STRICT NO-DUPLICATE RULE)
  const handleMoveItem = (itemId: TabType, targetGroupId: string) => {
    const item = localConfig.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.isLocked) {
      setLockWarning(
        `"${item.label}" is waqt LOCKED hai! Ghalti se move hone se bachane ke liye isay pehle unlock karein.`
      );
      return;
    }

    const currentGroup = localConfig.groups.find((g) => g.id === item.groupId);
    if (currentGroup?.isLocked) {
      setLockWarning(
        `Parent Menu "${currentGroup.label}" is waqt LOCKED hai! Pehle parent menu ko unlock karein.`
      );
      return;
    }

    const targetGroup = localConfig.groups.find((g) => g.id === targetGroupId);
    if (targetGroup?.isLocked) {
      setLockWarning(
        `Destination Menu "${targetGroup.label}" is waqt LOCKED hai! Pehle destination menu ko unlock karein.`
      );
      return;
    }

    setLockWarning(null);

    // Update assignment (item stays unique across the whole app)
    const next = {
      ...localConfig,
      items: localConfig.items.map((i) => (i.id === itemId ? { ...i, groupId: targetGroupId } : i))
    };
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

  // Unlock item on warning prompt
  const unlockItemFromWarning = () => {
    if (selectedItemId) {
      toggleItemLock(selectedItemId);
      setLockWarning(null);
    }
  };

  const handleApply = (overrideConfig?: MenuCustomizerState) => {
    const base = overrideConfig || localConfig;
    let finalConfig = { ...base };

    // Commit any currently open editing inputs before saving via refs to eliminate blur race conditions!
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
    }, 400);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap menu bar ko default settings par reset karna chahte hain?')) {
      onReset();
      setLocalConfig(DEFAULT_MENU_STATE);
      saveMenuConfig(DEFAULT_MENU_STATE);
      dirtyManager.clearDirty('menu_customizer');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[85vh] h-full sm:h-auto flex flex-col shadow-2xl shadow-cyan-950/80 overflow-hidden overscroll-contain text-slate-100">

        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Menu Bar Handler &amp; Customizer</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                  Movable Top Bar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Menus ko rename karein, items ko shift karein, aur Main Top-Bar Menus ko move/reorder (#1, #2, #3, #4) karein.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Band Karein"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Content Body — Interactive Grid of 4 Menu Categories (Scrollable only within modal) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-4">

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
                  {/* Category Header with Lock, Reordering & Rename */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded-lg bg-slate-800 text-cyan-400">
                        <Layers className="w-4 h-4" />
                      </span>

                      {/* Top Bar Order Position Badge */}
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
                      {/* Move Top Menu Left / Right Controls when Unlocked */}
                      {!group.isLocked && (
                        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleMoveGroup(groupIndex, 'left')}
                            disabled={groupIndex === 0}
                            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 disabled:opacity-25 transition-colors cursor-pointer"
                            title="Move Menu Left in Top Bar"
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
                            title="Move Menu Right in Top Bar"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

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
                        title={group.isLocked ? 'Menu Locked (Click to Unlock & Move)' : 'Menu Unlocked (Click to Lock)'}
                      >
                        {group.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Items in this Menu */}
                  <div className="mt-3 space-y-2 flex-1">
                    {groupItems.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        Is menu mein koi item nahi hai. Doosre menu se shift karein.
                      </div>
                    ) : (
                      groupItems.map((item) => {
                        const isSelected = selectedItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/40 shadow-md shadow-cyan-950/60'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  item.isLocked ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                              />

                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <input
                                    type="text"
                                    value={tempLabel}
                                    onChange={(e) => setTempLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditItem(item.id)}
                                    onBlur={() => saveEditItem(item.id)}
                                    className="bg-slate-800 border border-cyan-400 text-white rounded px-2 py-0.5 text-xs font-medium focus:outline-none w-44"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      saveEditItem(item.id);
                                    }}
                                    className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 cursor-pointer"
                                    title="Save Rename"
                                  >
                                    <Save className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs font-semibold text-slate-200 truncate">
                                    {item.label}
                                  </span>
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

                            {/* Item Actions: Lock/Unlock & Shift dropdown */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleItemLock(item.id)}
                                className={`p-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  item.isLocked
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                }`}
                                title={item.isLocked ? 'Locked (Click to Unlock)' : 'Unlocked (Click to Lock)'}
                              >
                                {item.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>

                              {/* Move / Shift Dropdown */}
                              <div className="relative flex items-center gap-1 text-[11px] bg-slate-800/80 border border-slate-700 rounded-lg px-1.5 py-0.5">
                                <span className="text-slate-400 text-[10px]">Move to:</span>
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
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
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
              <span>Save Menu Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
}
