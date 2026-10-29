import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bot,
  RotateCcw,
  Check,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Film,
  MessageSquare,
  Wand2,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  Lock,
  Edit3
} from 'lucide-react';
import { dirtyManager } from '../lib/dirtyStore';
import { PUBLISHED_VIDEOS } from '../data/channelData';

export interface ScenePresetItem {
  id: string;
  count: number;
  label: string;
}

export interface DialectPresetItem {
  id: string;
  label: string;
  description: string;
}

export interface StylePresetItem {
  id: string;
  label: string;
  description: string;
}

export interface SimulatorConfig {
  baselineTag: string;
  defaultSceneCount: number;
  duplicateStrictness: 'strict' | 'balanced' | 'relaxed' | string;
  dialectTone: string;
  lockPersonaAcrossScenes: boolean;
  autoQueueSync: boolean;
  flowPromptFormat: string;
  customInstructions: string;
  // User-manageable presets
  scenePresets?: ScenePresetItem[];
  dialectPresets?: DialectPresetItem[];
  stylePresets?: StylePresetItem[];
}

export const DEFAULT_SCENE_PRESETS: ScenePresetItem[] = [
  { id: 'sc-7', count: 7, label: '7 Scenes (70s — Minimal Threshold)' },
  { id: 'sc-10', count: 10, label: '10 Scenes (100s — Standard Short)' },
  { id: 'sc-12', count: 12, label: '12 Scenes (120s — Extended Short)' },
  { id: 'sc-15', count: 15, label: '15 Scenes (150s — Deep Tutorial)' },
  { id: 'sc-20', count: 20, label: '20 Scenes (200s — Masterclass)' },
  { id: 'sc-25', count: 25, label: '25 Scenes (250s — Extended Series)' },
  { id: 'sc-30', count: 30, label: '30 Scenes (300s — Max Long-form Short)' }
];

export const DEFAULT_DIALECT_PRESETS: DialectPresetItem[] = [
  {
    id: 'lahori_conversational',
    label: 'Lahori Conversational (Pakistani Tech YouTuber)',
    description: 'Natural Lahori tech cadence with punchy hooks, relatable examples ("Bhai yeh check karein..."), and zero mid-story voice switching.'
  },
  {
    id: 'formal',
    label: 'Neutral Tech Urdu (Semi-formal)',
    description: 'Clean, professional Urdu technical vocabulary suitable for enterprise workflows.'
  },
  {
    id: 'fast_paced',
    label: 'Fast-Paced Energetic (TikTok Viral Style)',
    description: 'High-speed urgency, rapid pattern-interrupts, and aggressive retention hooks.'
  }
];

export const DEFAULT_STYLE_PRESETS: StylePresetItem[] = [
  {
    id: 'cinematic_3d',
    label: 'Cinematic 3D Hologram + Anchor Split',
    description: 'Prepends visual cinematic directing (9:16 vertical, 8K, anamorphic lens, cyan/amber volumetric lighting, left anchor split with floating holographic UI).'
  },
  {
    id: 'standard',
    label: 'Standard YouTube Studio Setup',
    description: 'Centered anchor, crisp desk ring lights, and clean desktop screen recording cutaways.'
  },
  {
    id: 'minimal',
    label: 'Minimal Clean Prompt',
    description: 'Compact prompt format focusing purely on dialogue and essential visual cues.'
  }
];

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  baselineTag: 'Active Baseline',
  defaultSceneCount: 10,
  duplicateStrictness: 'strict',
  dialectTone: 'lahori_conversational',
  lockPersonaAcrossScenes: true,
  autoQueueSync: true,
  flowPromptFormat: 'cinematic_3d',
  scenePresets: DEFAULT_SCENE_PRESETS,
  dialectPresets: DEFAULT_DIALECT_PRESETS,
  stylePresets: DEFAULT_STYLE_PRESETS,
  customInstructions:
    'Strict Lahori Conversational Dialect. Single consistent anchor persona from Scene 1 to the end (No mid-story voice or narrator switching). Prepend Cinematic Directing instructions (9:16, 8K volumetric lighting, cyan/amber glowing holographic UI) on every scene script.'
};

const STORAGE_KEY = 'itcafeteria_simulator_config_v3';

export function loadSimulatorConfig(): SimulatorConfig {
  if (typeof window === 'undefined') return DEFAULT_SIMULATOR_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SIMULATOR_CONFIG,
        ...parsed,
        scenePresets: Array.isArray(parsed.scenePresets) && parsed.scenePresets.length ? parsed.scenePresets : DEFAULT_SCENE_PRESETS,
        dialectPresets: Array.isArray(parsed.dialectPresets) && parsed.dialectPresets.length ? parsed.dialectPresets : DEFAULT_DIALECT_PRESETS,
        stylePresets: Array.isArray(parsed.stylePresets) && parsed.stylePresets.length ? parsed.stylePresets : DEFAULT_STYLE_PRESETS
      };
    }
  } catch {}
  return DEFAULT_SIMULATOR_CONFIG;
}

export function saveSimulatorConfig(cfg: SimulatorConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('itcafeteria_simulator_config_updated', { detail: cfg }));
    }
  } catch {}
}

interface SimulatorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulatorConfig;
  onSave: (updated: SimulatorConfig) => void;
  onReset: () => void;
}

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset
}) => {
  const [local, setLocal] = useState<SimulatorConfig>(config);
  const [savedToast, setSavedToast] = useState(false);

  // Preset addition states
  const [showAddScenePreset, setShowAddScenePreset] = useState(false);
  const [newSceneCount, setNewSceneCount] = useState<number>(14);
  const [newSceneLabel, setNewSceneLabel] = useState<string>('');

  const [showAddDialectPreset, setShowAddDialectPreset] = useState(false);
  const [newDialectName, setNewDialectName] = useState<string>('');
  const [newDialectDesc, setNewDialectDesc] = useState<string>('');

  const [showAddStylePreset, setShowAddStylePreset] = useState(false);
  const [newStyleName, setNewStyleName] = useState<string>('');
  const [newStyleDesc, setNewStyleDesc] = useState<string>('');

  // Dynamic published count for duplicate defense label
  const [liveCatalogCount, setLiveCatalogCount] = useState<number>(PUBLISHED_VIDEOS.length);

  useEffect(() => {
    try {
      const queueRaw = localStorage.getItem('itcafeteria_autopilot_queue');
      const queue = queueRaw ? JSON.parse(queueRaw) : [];
      const completedCount = Array.isArray(queue) ? queue.filter((t: any) => t.status === 'completed').length : 0;
      setLiveCatalogCount(PUBLISHED_VIDEOS.length + completedCount);
    } catch {
      setLiveCatalogCount(PUBLISHED_VIDEOS.length);
    }
  }, [isOpen]);

  const markDirty = (updated: SimulatorConfig) => {
    dirtyManager.setDirty({
      id: 'simulator_config',
      title: 'Agent Simulator Engine Configuration',
      description: 'Story Engine ke parameters aur baseline rules ki tabdeeliyaan ghair mehfooz hain.',
      onSave: () => handleSave(updated),
      onDiscard: () => {
        setLocal(config);
        dirtyManager.clearDirty('simulator_config');
      }
    });
  };

  const updateField = <K extends keyof SimulatorConfig>(field: K, value: SimulatorConfig[K]) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
    markDirty({ ...local, [field]: value });
  };

  useEffect(() => {
    if (isOpen) {
      setLocal({
        ...config,
        scenePresets: config.scenePresets || DEFAULT_SCENE_PRESETS,
        dialectPresets: config.dialectPresets || DEFAULT_DIALECT_PRESETS,
        stylePresets: config.stylePresets || DEFAULT_STYLE_PRESETS
      });
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        dirtyManager.clearDirty('simulator_config');
      };
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = (overrideConfig?: SimulatorConfig) => {
    const target = overrideConfig || local;
    saveSimulatorConfig(target);
    onSave(target);
    dirtyManager.clearDirty('simulator_config');
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap Simulator ki settings ko default par reset karna chahte hain?')) {
      onReset();
      setLocal(DEFAULT_SIMULATOR_CONFIG);
      saveSimulatorConfig(DEFAULT_SIMULATOR_CONFIG);
      onSave(DEFAULT_SIMULATOR_CONFIG);
      dirtyManager.clearDirty('simulator_config');
    }
  };

  // Add / Delete Scene Presets
  const handleAddScenePreset = () => {
    const count = Number(newSceneCount);
    if (!count || count < 7 || count > 30) {
      alert('Scene count 7 se 30 ke darmiyan hona chahiye.');
      return;
    }
    const label = newSceneLabel.trim() || `${count} Scenes (${count * 10}s — Custom Format)`;
    const newPreset: ScenePresetItem = {
      id: `sc-custom-${Date.now()}`,
      count,
      label
    };
    const updatedPresets = [...(local.scenePresets || DEFAULT_SCENE_PRESETS), newPreset].sort((a, b) => a.count - b.count);
    updateField('scenePresets', updatedPresets);
    updateField('defaultSceneCount', count);
    setNewSceneLabel('');
    setShowAddScenePreset(false);
  };

  const handleDeleteScenePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentList = local.scenePresets || DEFAULT_SCENE_PRESETS;
    if (currentList.length <= 1) {
      alert('Kam az kam aik scene preset lazmi rehna chahiye.');
      return;
    }
    const updated = currentList.filter((p) => p.id !== presetId);
    updateField('scenePresets', updated);
    if (!updated.some((p) => p.count === local.defaultSceneCount)) {
      updateField('defaultSceneCount', updated[0]?.count || 10);
    }
  };

  // Add / Delete Dialect Presets
  const handleAddDialectPreset = () => {
    if (!newDialectName.trim()) return;
    const newPreset: DialectPresetItem = {
      id: `dialect-${Date.now()}`,
      label: newDialectName.trim(),
      description: newDialectDesc.trim() || 'Custom dialect tone & cadence.'
    };
    const updated = [...(local.dialectPresets || DEFAULT_DIALECT_PRESETS), newPreset];
    updateField('dialectPresets', updated);
    updateField('dialectTone', newPreset.id);
    setNewDialectName('');
    setNewDialectDesc('');
    setShowAddDialectPreset(false);
  };

  const handleDeleteDialectPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = local.dialectPresets || DEFAULT_DIALECT_PRESETS;
    if (current.length <= 1) {
      alert('Kam az kam aik dialect preset hona chahiye.');
      return;
    }
    const updated = current.filter((p) => p.id !== id);
    updateField('dialectPresets', updated);
    if (local.dialectTone === id) {
      updateField('dialectTone', updated[0]?.id || 'lahori_conversational');
    }
  };

  // Add / Delete Style Presets
  const handleAddStylePreset = () => {
    if (!newStyleName.trim()) return;
    const newPreset: StylePresetItem = {
      id: `style-${Date.now()}`,
      label: newStyleName.trim(),
      description: newStyleDesc.trim() || 'Custom visual directing & flow prompt style.'
    };
    const updated = [...(local.stylePresets || DEFAULT_STYLE_PRESETS), newPreset];
    updateField('stylePresets', updated);
    updateField('flowPromptFormat', newPreset.id);
    setNewStyleName('');
    setNewStyleDesc('');
    setShowAddStylePreset(false);
  };

  const handleDeleteStylePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = local.stylePresets || DEFAULT_STYLE_PRESETS;
    if (current.length <= 1) {
      alert('Kam az kam aik style preset hona chahiye.');
      return;
    }
    const updated = current.filter((p) => p.id !== id);
    updateField('stylePresets', updated);
    if (local.flowPromptFormat === id) {
      updateField('flowPromptFormat', updated[0]?.id || 'cinematic_3d');
    }
  };

  // Quick instruction templates
  const injectDirective = (text: string) => {
    const existing = local.customInstructions.trim();
    const updated = existing ? `${existing}\n\n• ${text}` : `• ${text}`;
    updateField('customInstructions', updated);
  };

  const scenePresets = local.scenePresets || DEFAULT_SCENE_PRESETS;
  const dialectPresets = local.dialectPresets || DEFAULT_DIALECT_PRESETS;
  const stylePresets = local.stylePresets || DEFAULT_STYLE_PRESETS;

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-3xl max-h-[88vh] h-full sm:h-auto flex flex-col shadow-2xl shadow-blue-950/80 overflow-hidden overscroll-contain text-slate-100">
        {/* Header — Cleaned as requested: v3.42 label completely removed, Active Baseline kept intact */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Agent Simulator Engine Configuration</h3>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  {local.baselineTag || 'Active Baseline'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Story parameters, Lahori dialect, custom scene presets (7–30), aur cinematic directing rules customize karein.
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

        {/* Saved Feedback Toast */}
        {savedToast && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg animate-in fade-in duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Engine Configuration kamyabi se save ho gayi! Tamam changes live sync ho chuke hain.</span>
          </div>
        )}

        {/* Content Body — Fixed height with internal scrolling only, preventing full-page scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Baseline Tag Status (Editable without any v3.42 label) */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-slate-300 font-semibold block text-xs">Engine Baseline Status</span>
              <p className="text-[11px] text-slate-400">Current active model pipeline baseline tag</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={local.baselineTag}
                onChange={(e) => updateField('baselineTag', e.target.value)}
                className="bg-slate-800 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                placeholder="Active Baseline"
              />
            </div>
          </div>

          {/* 1. SCENE COUNT PARAMETERS & CUSTOM PRESET BUILDER */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  Configurable Scene Counts (7 to 30 Scenes)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct scene count set karein ya apni marzi se naye presets add / delete karein.
                </p>
              </div>

              {/* Direct Scene Count Stepper (7 to 30) */}
              <div className="flex items-center gap-2 bg-slate-900 border border-cyan-500/40 px-2.5 py-1 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Selected:</span>
                <button
                  type="button"
                  onClick={() => updateField('defaultSceneCount', Math.max(7, local.defaultSceneCount - 1))}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={7}
                  max={30}
                  value={local.defaultSceneCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      updateField('defaultSceneCount', Math.max(7, Math.min(30, val)));
                    }
                  }}
                  className="w-12 bg-transparent text-center font-bold font-mono text-cyan-300 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateField('defaultSceneCount', Math.min(30, local.defaultSceneCount + 1))}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
                <span className="text-[10px] text-slate-400">Scenes</span>
              </div>
            </div>

            {/* Presets Chips with Delete Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-300 font-semibold block text-[11px]">
                  Scene Presets (Click to Select, [x] to Delete):
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddScenePreset(!showAddScenePreset)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30"
                >
                  <Plus className="w-3 h-3" />
                  <span>Naya Preset Banayein</span>
                </button>
              </div>

              {/* Add New Scene Preset Mini-Form */}
              {showAddScenePreset && (
                <div className="p-3 mb-3 bg-slate-900 border border-cyan-500/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="font-semibold text-cyan-300 text-[11px] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Naya Scene Preset Darj Karein:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Scene Count (7-30)</label>
                      <input
                        type="number"
                        min={7}
                        max={30}
                        value={newSceneCount}
                        onChange={(e) => setNewSceneCount(parseInt(e.target.value) || 10)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Label (e.g. 14 Scenes — Deep Dive)</label>
                      <input
                        type="text"
                        value={newSceneLabel}
                        onChange={(e) => setNewSceneLabel(e.target.value)}
                        placeholder="e.g. 14 Scenes (140s — Intermediate)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddScenePreset(false)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddScenePreset}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Preset Save Karein
                    </button>
                  </div>
                </div>
              )}

              {/* Preset List Badges */}
              <div className="flex flex-wrap gap-2">
                {scenePresets.map((preset) => {
                  const isSelected = local.defaultSceneCount === preset.count;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => updateField('defaultSceneCount', preset.count)}
                      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950 ring-1 ring-cyan-500/40 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteScenePreset(preset.id, e)}
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition-opacity"
                        title="Is preset ko delete karein"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. DUPLICATE CHECK TOLERANCE & RADAR */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Duplicate Defense & Tolerance Rules
              </h4>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono">
                {liveCatalogCount} Catalog Videos Synced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'strict',
                  title: 'Strict (0-Tolerance)',
                  desc: `Zero duplication allowed against ${liveCatalogCount} published library videos.`
                },
                {
                  id: 'balanced',
                  title: 'Balanced Angle',
                  desc: 'Allows fresh angle or distinct workflow on previously covered tools.'
                },
                {
                  id: 'relaxed',
                  title: 'Relaxed Experimental',
                  desc: 'Soft semantic threshold for testing viral variations of top videos.'
                }
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => updateField('duplicateStrictness', opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    local.duplicateStrictness === opt.id
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/40 shadow-lg'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-1 flex items-center justify-between">
                    <span>{opt.title}</span>
                    {local.duplicateStrictness === opt.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[10px] leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. LAHORI DIALECT & STRICT PERSONA LOCK */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  Dialect, Cadence & Anchor Persona
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lahori conversational tone select karein aur persona lock enforce karein.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDialectPreset(!showAddDialectPreset)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30"
              >
                <Plus className="w-3 h-3" />
                <span>Naya Dialect Preset</span>
              </button>
            </div>

            {/* Add Dialect Preset Form */}
            {showAddDialectPreset && (
              <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="font-semibold text-emerald-300 text-[11px]">Naya Dialect Tone Add Karein:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newDialectName}
                    onChange={(e) => setNewDialectName(e.target.value)}
                    placeholder="Dialect Title (e.g. Punjabi Punch Urdu)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <input
                    type="text"
                    value={newDialectDesc}
                    onChange={(e) => setNewDialectDesc(e.target.value)}
                    placeholder="Description & tone rules..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDialectPreset(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDialectPreset}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Save Preset
                  </button>
                </div>
              </div>
            )}

            {/* Dialect Cards */}
            <div className="space-y-2">
              {dialectPresets.map((preset) => {
                const isSelected = local.dialectTone === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateField('dialectTone', preset.id)}
                    className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white flex items-center gap-2">
                        <span>{preset.label}</span>
                        {preset.id === 'lahori_conversational' && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDialectPreset(preset.id, e)}
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-1 transition-opacity"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Strict Persona Lock Switch */}
            <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white text-xs">
                    Strict Persona Lock (No Mid-Story Persona Switching)
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Scene 1 se aakhri scene tak anchor character tag aur awaaz ka persona 100% aik jaisa rahega.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={local.lockPersonaAcrossScenes}
                onClick={() => updateField('lockPersonaAcrossScenes', !local.lockPersonaAcrossScenes)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  local.lockPersonaAcrossScenes ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    local.lockPersonaAcrossScenes ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. FLOW PROMPT SCRIPT STYLE & CINEMATIC DIRECTING */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Flow Prompt Script Style (Google Flow)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cinematic 3D Hologram + Anchor Split with camera movements and lighting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStylePreset(!showAddStylePreset)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30"
              >
                <Plus className="w-3 h-3" />
                <span>Naya Style Preset</span>
              </button>
            </div>

            {/* Add Style Preset Form */}
            {showAddStylePreset && (
              <div className="p-3 bg-slate-900 border border-cyan-500/40 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="font-semibold text-cyan-300 text-[11px]">Naya Flow Script Style Add Karein:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    placeholder="Style Name (e.g. Cyberpunk Holographic HUD)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    value={newStyleDesc}
                    onChange={(e) => setNewStyleDesc(e.target.value)}
                    placeholder="Visual directing instructions..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStylePreset(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStylePreset}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Save Preset
                  </button>
                </div>
              </div>
            )}

            {/* Style Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {stylePresets.map((preset) => {
                const isSelected = local.flowPromptFormat === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateField('flowPromptFormat', preset.id)}
                    className={`group p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/40 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white mb-1 flex items-center justify-between">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteStylePreset(preset.id, e)}
                        className="opacity-30 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition-opacity"
                        title="Delete Preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Auto-Sync Toggle to Target Queue and Content Calendar */}
            <label className="flex items-center gap-2.5 pt-1 text-slate-300 cursor-pointer select-none bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={local.autoQueueSync}
                onChange={(e) => updateField('autoQueueSync', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-white block text-xs">
                  Target Queue aur Content Calendar Auto-Sync
                </span>
                <span className="text-[10px] text-slate-400">
                  Generate hote hi kahani ko Pending Queue (`pendingQueueStore`) aur Calendar mein auto-save karein.
                </span>
              </div>
            </label>
          </div>

          {/* 5. AGENT SCRIPT RULES & PROMPT INSTRUCTIONS */}
          <div className="space-y-2.5 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                Script Rules & Prompt Directives (Editable)
              </h4>

              {/* Quick Template Injections */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => injectDirective('Dialect: Lahori Conversational Urdu ("Bhai yeh check karein...").')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] border border-slate-700"
                >
                  + Lahori Dialect
                </button>
                <button
                  type="button"
                  onClick={() => injectDirective('Cinematic Directing: Prepend visual direction with 8K volumetric lighting and floating 3D hologram.')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] border border-slate-700"
                >
                  + Cinematic Directing
                </button>
                <button
                  type="button"
                  onClick={() => injectDirective('Persona Lock: Anchor identity remains completely unchanged across all scenes without mid-story voice change.')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] border border-slate-700"
                >
                  + Persona Lock
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={local.customInstructions}
              onChange={(e) => updateField('customInstructions', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-400"
              placeholder="Custom instructions for AI story script generation..."
            />
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
              onClick={() => handleSave()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-950 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Engine Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
