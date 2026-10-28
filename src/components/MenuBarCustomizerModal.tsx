import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  AlertTriangle,
  FolderTree,
  Edit2,
  Save,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  GripVertical,
  MoveHorizontal,
  Info,
  CheckCircle2
} from 'lucide-react';
import type { TabType } from '../App';

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
    { id: 'duplicates', label: 'Duplicate Checker (58)', groupId: 'management', isLocked: true },
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
        return parsed;
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

  // Drag and Drop States
  const [draggedItemId, setDraggedItemId] = useState<TabType | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<TabType | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverCategoryRibbonId, setDragOverCategoryRibbonId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Toggle Lock for a Group
  const toggleGroupLock = (groupId: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, isLocked: !g.isLocked } : g))
    }));
  };

  // Toggle Lock for an Item
  const toggleItemLock = (itemId: TabType) => {
    setLocalConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, isLocked: !item.isLocked } : item))
    }));
  };

  // Move category sequence Left or Right
  const moveGroupSequence = (groupId: string, direction: 'left' | 'right') => {
    const currentIndex = localConfig.groups.findIndex((g) => g.id === groupId);
    if (currentIndex === -1) return;

    const group = localConfig.groups[currentIndex];
    if (group.isLocked) {
      setLockWarning(`"${group.label}" is waqt LOCKED hai! Sequence tabdeel karne ke liye pehle iska Lock kholein.`);
      return;
    }

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= localConfig.groups.length) return;

    const targetGroup = localConfig.groups[targetIndex];
    if (targetGroup.isLocked) {
      setLockWarning(`Saath wali category "${targetGroup.label}" LOCKED hai! Sequence switch karne ke liye dono categories ka Unlock hona zaroori hai.`);
      return;
    }

    setLockWarning(null);
    const newGroups = [...localConfig.groups];
    const [moved] = newGroups.splice(currentIndex, 1);
    newGroups.splice(targetIndex, 0, moved);

    setLocalConfig((prev) => ({
      ...prev,
      groups: newGroups
    }));
  };

  // Drag and drop for Category Sequence Reordering
  const handleCategoryDragStart = (e: React.DragEvent, groupId: string) => {
    const group = localConfig.groups.find((g) => g.id === groupId);
    if (group?.isLocked) {
      e.preventDefault();
      setLockWarning(`Menu category "${group.label}" LOCKED hai! Drag karke sequence tabdeel karne ke liye pehle iska Lock kholein.`);
      return;
    }
    setLockWarning(null);
    setDraggedGroupId(groupId);
    e.dataTransfer.setData('text/plain', `category:${groupId}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOverRibbon = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== targetGroupId) {
      setDragOverCategoryRibbonId(targetGroupId);
    }
  };

  const handleCategoryDropRibbon = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggedGroupId || draggedGroupId === targetGroupId) {
      setDraggedGroupId(null);
      setDragOverCategoryRibbonId(null);
      return;
    }

    const sourceGroup = localConfig.groups.find((g) => g.id === draggedGroupId);
    const targetGroup = localConfig.groups.find((g) => g.id === targetGroupId);

    if (sourceGroup?.isLocked) {
      setLockWarning(`"${sourceGroup.label}" locked hai! Pehle unlock karein.`);
      setDraggedGroupId(null);
      setDragOverCategoryRibbonId(null);
      return;
    }
    if (targetGroup?.isLocked) {
      setLockWarning(`Destination category "${targetGroup.label}" locked hai! Pehle unlock karein.`);
      setDraggedGroupId(null);
      setDragOverCategoryRibbonId(null);
      return;
    }

    setLockWarning(null);
    const fromIndex = localConfig.groups.findIndex((g) => g.id === draggedGroupId);
    const toIndex = localConfig.groups.findIndex((g) => g.id === targetGroupId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newGroups = [...localConfig.groups];
      const [moved] = newGroups.splice(fromIndex, 1);
      newGroups.splice(toIndex, 0, moved);
      setLocalConfig((prev) => ({ ...prev, groups: newGroups }));
    }

    setDraggedGroupId(null);
    setDragOverCategoryRibbonId(null);
  };

  // Move item Up or Down within the same category
  const moveItemUpDown = (itemId: TabType, direction: 'up' | 'down') => {
    const item = localConfig.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.isLocked) {
      setLockWarning(`"${item.label}" is waqt LOCKED hai! Reorder karne ke liye pehle iska Lock kholein.`);
      return;
    }

    const parentGroup = localConfig.groups.find((g) => g.id === item.groupId);
    if (parentGroup?.isLocked) {
      setLockWarning(`Parent category "${parentGroup.label}" is waqt LOCKED hai! Pehle parent category ko unlock karein.`);
      return;
    }

    // Get group items in their current sequential order
    const groupItems = localConfig.items.filter((i) => i.groupId === item.groupId);
    const currentIndexInGroup = groupItems.findIndex((i) => i.id === itemId);
    const targetIndexInGroup = direction === 'up' ? currentIndexInGroup - 1 : currentIndexInGroup + 1;

    if (targetIndexInGroup < 0 || targetIndexInGroup >= groupItems.length) return;

    const targetItem = groupItems[targetIndexInGroup];
    if (targetItem.isLocked) {
      setLockWarning(`Target item "${targetItem.label}" LOCKED hai! Position switch karne ke liye dono items ka unlock hona zaroori hai.`);
      return;
    }

    // Reorder in master items array
    const fromIndex = localConfig.items.findIndex((i) => i.id === itemId);
    const toIndex = localConfig.items.findIndex((i) => i.id === targetItem.id);

    const newItems = [...localConfig.items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);

    setLockWarning(null);
    setLocalConfig((prev) => ({
      ...prev,
      items: newItems
    }));
  };

  // Move an item to a new group via Dropdown (STRICT NO-DUPLICATE RULE)
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
    setLocalConfig((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, groupId: targetGroupId } : i))
    }));
  };

  // Item Drag & Drop Handlers
  const handleItemDragStart = (e: React.DragEvent, item: MenuItemConfig) => {
    const parentGroup = localConfig.groups.find((g) => g.id === item.groupId);
    if (item.isLocked || parentGroup?.isLocked) {
      e.preventDefault();
      setLockWarning(
        `"${item.label}" ya iski parent category LOCKED hai! Mouse se drag karke move ya up/down karne ke liye pehle Lock kholein.`
      );
      return;
    }
    setLockWarning(null);
    setDraggedItemId(item.id);
    e.dataTransfer.setData('text/plain', `item:${item.id}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOverItem = (e: React.DragEvent, targetItemId: TabType) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId && draggedItemId !== targetItemId) {
      setDragOverItemId(targetItemId);
    }
  };

  const handleItemDropOnItem = (e: React.DragEvent, targetItem: MenuItemConfig) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItemId || draggedItemId === targetItem.id) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const draggedItem = localConfig.items.find((i) => i.id === draggedItemId);
    if (!draggedItem) return;

    const sourceGroup = localConfig.groups.find((g) => g.id === draggedItem.groupId);
    const targetGroup = localConfig.groups.find((g) => g.id === targetItem.groupId);

    if (draggedItem.isLocked || sourceGroup?.isLocked) {
      setLockWarning(`"${draggedItem.label}" ya iski category locked hai! Move karne ke liye unlock karein.`);
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    if (targetItem.isLocked || targetGroup?.isLocked) {
      setLockWarning(`Target "${targetItem.label}" ya destination category locked hai! Pehle unlock karein.`);
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    setLockWarning(null);

    // Splice dragged item and insert at target item position
    const fromIndex = localConfig.items.findIndex((i) => i.id === draggedItemId);
    const newItems = [...localConfig.items];
    const [moved] = newItems.splice(fromIndex, 1);

    // Update its groupId to destination if cross-category
    moved.groupId = targetItem.groupId;

    const toIndex = newItems.findIndex((i) => i.id === targetItem.id);
    newItems.splice(toIndex, 0, moved);

    setLocalConfig((prev) => ({
      ...prev,
      items: newItems
    }));

    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // Dropping an item directly onto a Category card body
  const handleItemDragOverCategory = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (draggedItemId) {
      setDragOverGroupId(groupId);
    }
  };

  const handleItemDropOnCategory = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!draggedItemId) {
      setDragOverGroupId(null);
      return;
    }

    const draggedItem = localConfig.items.find((i) => i.id === draggedItemId);
    if (!draggedItem) {
      setDraggedItemId(null);
      setDragOverGroupId(null);
      return;
    }

    // If dropped into the same category body and not on a specific item, nothing to change
    if (draggedItem.groupId === targetGroupId) {
      setDraggedItemId(null);
      setDragOverGroupId(null);
      return;
    }

    const sourceGroup = localConfig.groups.find((g) => g.id === draggedItem.groupId);
    const targetGroup = localConfig.groups.find((g) => g.id === targetGroupId);

    if (draggedItem.isLocked || sourceGroup?.isLocked) {
      setLockWarning(`"${draggedItem.label}" ya iski category locked hai! Pehle unlock karein.`);
      setDraggedItemId(null);
      setDragOverGroupId(null);
      return;
    }

    if (targetGroup?.isLocked) {
      setLockWarning(`Destination category "${targetGroup.label}" locked hai! Pehle unlock karein.`);
      setDraggedItemId(null);
      setDragOverGroupId(null);
      return;
    }

    setLockWarning(null);
    // Move to target group at the end
    setLocalConfig((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === draggedItemId ? { ...i, groupId: targetGroupId } : i))
    }));

    setDraggedItemId(null);
    setDragOverGroupId(null);
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
  };

  const saveEditGroup = (groupId: string, newLabel?: string) => {
    const labelToSave = (newLabel !== undefined ? newLabel : tempLabel).trim();
    if (!labelToSave) {
      setEditingGroupId(null);
      return;
    }
    setLocalConfig((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, label: labelToSave } : g))
    }));
    setEditingGroupId(null);
    setTempLabel('');
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
  };

  const saveEditItem = (itemId: TabType, newLabel?: string) => {
    const labelToSave = (newLabel !== undefined ? newLabel : tempLabel).trim();
    if (!labelToSave) {
      setEditingItemId(null);
      return;
    }
    setLocalConfig((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, label: labelToSave } : i))
    }));
    setEditingItemId(null);
    setTempLabel('');
  };

  // Unlock item on warning prompt
  const unlockItemFromWarning = () => {
    if (selectedItemId) {
      toggleItemLock(selectedItemId);
      setLockWarning(null);
    }
  };

  const handleApply = () => {
    // Commit any currently open editing inputs before saving!
    let finalConfig = { ...localConfig };

    if (editingItemId && tempLabel.trim()) {
      finalConfig = {
        ...finalConfig,
        items: finalConfig.items.map((i) =>
          i.id === editingItemId ? { ...i, label: tempLabel.trim() } : i
        )
      };
    }

    if (editingGroupId && tempLabel.trim()) {
      finalConfig = {
        ...finalConfig,
        groups: finalConfig.groups.map((g) =>
          g.id === editingGroupId ? { ...g, label: tempLabel.trim() } : g
        )
      };
    }

    saveMenuConfig(finalConfig);
    onSave(finalConfig);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap menu bar ko default settings par reset karna chahte hain?')) {
      onReset();
      setLocalConfig(DEFAULT_MENU_STATE);
      saveMenuConfig(DEFAULT_MENU_STATE);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Menu Bar Handler & Customizer</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                  WordPress Style
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-sans hidden sm:inline">
                  Drag & Drop Enabled
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Menus ko Drag & Drop karein (Left-to-Right sequence), sub-items ko Up/Down shift karein, aur ghalti se bachne ke liye Lock/Unlock karein.
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
          <div className="mx-5 mt-4 p-3 bg-rose-950/85 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-start justify-between gap-3 shadow-lg shadow-rose-950/40 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Action Blocked (Lock Protection Active):</p>
                <p className="text-slate-300 mt-0.5">{lockWarning}</p>
                <p className="text-[11px] text-amber-300/90 mt-1">
                  💡 Move ya drag karne ke liye pehle yellow Lock icon par click karke usay Green Unlock karein.
                </p>
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
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body (Scrollable only within modal) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TOP LAYER: Menu Tabs Sequence Reordering (Left-to-Right) */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 shadow-lg shadow-black/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <MoveHorizontal className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Top Navigation Tabs Sequence (Left → Right)
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      Main Menu Order
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Menu tabs ki position adjust karein (e.g. Core Channel 1st, Autopilot 2nd). Mouse se drag karein ya arrows dabayein.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Move karne ke liye Lock khula hona zaroori hai</span>
              </div>
            </div>

            {/* Horizontal Tabs Sequence Strip (Interactive Drag & Drop + Left/Right sequence buttons) */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {localConfig.groups.map((group, index) => {
                const groupItems = localConfig.items.filter((i) => i.groupId === group.id);
                const isFirst = index === 0;
                const isLast = index === localConfig.groups.length - 1;
                const isDragOver = dragOverCategoryRibbonId === group.id;

                return (
                  <div
                    key={group.id}
                    draggable={!group.isLocked}
                    onDragStart={(e) => handleCategoryDragStart(e, group.id)}
                    onDragOver={(e) => handleCategoryDragOverRibbon(e, group.id)}
                    onDrop={(e) => handleCategoryDropRibbon(e, group.id)}
                    onDragEnd={() => {
                      setDraggedGroupId(null);
                      setDragOverCategoryRibbonId(null);
                    }}
                    className={`relative p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      group.isLocked
                        ? 'bg-slate-900/70 border-slate-800 text-slate-300 cursor-default'
                        : 'bg-slate-900/95 border-cyan-500/40 text-white cursor-grab active:cursor-grabbing hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-950/40'
                    } ${
                      isDragOver ? 'ring-2 ring-cyan-400 bg-cyan-950/70 scale-[1.02]' : ''
                    }`}
                    title={
                      group.isLocked
                        ? `LOCKED: ${group.label}. Unlock karke drag ya move karein.`
                        : `UNLOCKED: Mouse se pakad kar Left/Right drag karein`
                    }
                  >
                    {/* Left: Sequence index badge & Drag grip */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 w-6 h-6 ${
                          group.isLocked
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      {!group.isLocked ? (
                        <GripVertical className="w-3.5 h-3.5 text-cyan-400 shrink-0 cursor-grab" />
                      ) : (
                        <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0 opacity-40 cursor-not-allowed" />
                      )}

                      <div className="min-w-0 truncate">
                        <p className="text-xs font-bold text-white truncate">{group.label}</p>
                        <p className="text-[10px] text-slate-400">{groupItems.length} items</p>
                      </div>
                    </div>

                    {/* Right: Sequence Arrows & Lock Toggle */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Left Arrow Button */}
                      <button
                        type="button"
                        onClick={() => moveGroupSequence(group.id, 'left')}
                        disabled={isFirst || group.isLocked}
                        className={`p-1 rounded-md border text-[10px] transition-colors ${
                          isFirst || group.isLocked
                            ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'border-slate-700 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 cursor-pointer'
                        }`}
                        title={
                          group.isLocked
                            ? 'Locked: Unlock karein'
                            : isFirst
                            ? 'First position par hai'
                            : 'Left shift karein (Move Left)'
                        }
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>

                      {/* Right Arrow Button */}
                      <button
                        type="button"
                        onClick={() => moveGroupSequence(group.id, 'right')}
                        disabled={isLast || group.isLocked}
                        className={`p-1 rounded-md border text-[10px] transition-colors ${
                          isLast || group.isLocked
                            ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'border-slate-700 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 cursor-pointer'
                        }`}
                        title={
                          group.isLocked
                            ? 'Locked: Unlock karein'
                            : isLast
                            ? 'Last position par hai'
                            : 'Right shift karein (Move Right)'
                        }
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* Lock Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleGroupLock(group.id)}
                        className={`p-1 rounded-md border transition-colors cursor-pointer ${
                          group.isLocked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={group.isLocked ? 'Locked (Click to Unlock)' : 'Unlocked (Click to Lock)'}
                      >
                        {group.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LOWER LAYER: Interactive Grid of Menu Categories & Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localConfig.groups.map((group, groupIndex) => {
              const groupItems = localConfig.items.filter((i) => i.groupId === group.id);
              const isGroupDragOver = dragOverGroupId === group.id;

              return (
                <div
                  key={group.id}
                  onDragOver={(e) => handleItemDragOverCategory(e, group.id)}
                  onDrop={(e) => handleItemDropOnCategory(e, group.id)}
                  className={`border rounded-2xl p-4 flex flex-col transition-all ${
                    group.isLocked
                      ? 'bg-slate-950/70 border-slate-800 shadow-md'
                      : 'bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  } ${isGroupDragOver ? 'ring-2 ring-cyan-400/80 bg-slate-900' : ''}`}
                >
                  {/* Category Header with Lock, Sequence Nudge & Rename */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-mono font-bold shrink-0">
                        Tab #{groupIndex + 1}
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
                      {/* Sequence Left / Right Arrows on Category Header */}
                      <div className="flex items-center gap-0.5 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => moveGroupSequence(group.id, 'left')}
                          disabled={groupIndex === 0 || group.isLocked}
                          className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                            groupIndex === 0 || group.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'
                          }`}
                          title="Sequence Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGroupSequence(group.id, 'right')}
                          disabled={groupIndex === localConfig.groups.length - 1 || group.isLocked}
                          className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                            groupIndex === localConfig.groups.length - 1 || group.isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700'
                          }`}
                          title="Sequence Right"
                        >
                          <ArrowRight className="w-3 h-3" />
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
                        title={group.isLocked ? 'Menu Locked (Click to Unlock)' : 'Menu Unlocked (Click to Lock)'}
                      >
                        {group.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Items in this Menu (Interactive Drag & Drop Up/Down) */}
                  <div className="mt-3 space-y-2 flex-1">
                    {groupItems.length === 0 ? (
                      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        Is menu mein koi item nahi hai. Yahan doosre menu se drag karke drop karein ya shift karein.
                      </div>
                    ) : (
                      groupItems.map((item, itemIndex) => {
                        const isSelected = selectedItemId === item.id;
                        const isItemDragOver = dragOverItemId === item.id;
                        const canDrag = !item.isLocked && !group.isLocked;

                        return (
                          <div
                            key={item.id}
                            draggable={canDrag}
                            onDragStart={(e) => handleItemDragStart(e, item)}
                            onDragOver={(e) => handleItemDragOverItem(e, item.id)}
                            onDrop={(e) => handleItemDropOnItem(e, item)}
                            onDragEnd={() => {
                              setDraggedItemId(null);
                              setDragOverItemId(null);
                            }}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all select-none ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/40 shadow-md shadow-cyan-950/60'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            } ${
                              isItemDragOver ? 'ring-2 ring-cyan-400 bg-cyan-950/80 scale-[1.01]' : ''
                            } ${
                              canDrag
                                ? 'cursor-grab active:cursor-grabbing hover:border-cyan-500/50'
                                : 'cursor-pointer'
                            }`}
                            title={
                              canDrag
                                ? 'Mouse se pakad kar upar ya neeche drag karein (Up/Down reorder) ya kisi doosri category mein drop karein'
                                : item.isLocked
                                ? 'Item locked hai: Pehle unlock karein'
                                : 'Parent category locked hai: Pehle unlock karein'
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Drag Handle & Quick Up/Down Nudge Controls */}
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                {canDrag ? (
                                  <div className="flex items-center gap-0.5">
                                    <GripVertical className="w-3.5 h-3.5 text-cyan-400 cursor-grab hover:text-cyan-300" />
                                    {/* Up & Down Arrows for precision 1-click nudge inside same category */}
                                    <div className="flex flex-col">
                                      <button
                                        type="button"
                                        onClick={() => moveItemUpDown(item.id, 'up')}
                                        disabled={itemIndex === 0}
                                        className={`p-0.5 hover:text-cyan-300 text-slate-400 cursor-pointer ${
                                          itemIndex === 0 ? 'opacity-20 cursor-not-allowed' : ''
                                        }`}
                                        title="Move Up 1 step"
                                      >
                                        <ChevronUp className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveItemUpDown(item.id, 'down')}
                                        disabled={itemIndex === groupItems.length - 1}
                                        className={`p-0.5 hover:text-cyan-300 text-slate-400 cursor-pointer ${
                                          itemIndex === groupItems.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                                        }`}
                                        title="Move Down 1 step"
                                      >
                                        <ChevronDown className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="p-1 text-slate-600 opacity-40 cursor-not-allowed"
                                    title="Locked: Pehle lock open karein"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>

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
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title={item.isLocked ? 'Locked (Click to Unlock for Drag & Move)' : 'Unlocked (Ready to Drag & Move)'}
                              >
                                {item.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>

                              {/* Move / Shift Dropdown (Maintained as requested) */}
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
              onClick={handleApply}
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
