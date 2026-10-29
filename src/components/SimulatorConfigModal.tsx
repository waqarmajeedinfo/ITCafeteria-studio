import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sliders,
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
  CheckCircle2
} from 'lucide-react';
import { dirtyManager } from '../lib/dirtyStore';

export interface SimulatorConfig {
  versionLabel: string;
  baselineTag: string;
  defaultSceneCount: number;
  duplicateStrictness: 'strict' | 'balanced' | 'relaxed';
  dialectTone: 'conversational' | 'formal' | 'fast_paced';
  autoQueueSync: boolean;
  flowPromptFormat: 'standard' | 'cinematic_3d' | 'minimal';
  customInstructions: string;
}

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  versionLabel: 'v3.42 AI Story Engine',
  baselineTag: 'Active Baseline',
  defaultSceneCount: 10,
  duplicateStrictness: 'strict',
  dialectTone: 'conversational',
  autoQueueSync: true,
  flowPromptFormat: 'cinematic_3d',
  customInstructions:
    'No intro greetings. Natural Roman Urdu, warm conversational tech YouTuber cadence. 10 scenes: Hook, Problem, Pattern Interrupt, Step 1, Step 2, Proof, Pro Tip, Mistake Warning, Summary, CTA.'
};

const STORAGE_KEY = 'itcafeteria_simulator_config_v2';

export function loadSimulatorConfig(): SimulatorConfig {
  if (typeof window === 'undefined') return DEFAULT_SIMULATOR_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SIMULATOR_CONFIG, ...JSON.parse(raw) };
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
    setLocal((prev) => {
      const next = { ...prev, [field]: value };
      markDirty(next);
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setLocal(config);
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

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] h-full sm:h-auto flex flex-col shadow-2xl shadow-blue-950/80 overflow-hidden overscroll-contain text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Agent Simulator Engine Configuration</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  {local.baselineTag}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Agent Story Engine ke rules, baseline version, scene settings aur dialect customize karein.
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
            <span>Engine Configuration kamyabi se save ho gayi! Foran sync ho chuki hai.</span>
          </div>
        )}

        {/* Content Body — Scrollable only within modal */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. Baseline & Version Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Version Label (Header Display)
              </label>
              <input
                type="text"
                value={local.versionLabel}
                onChange={(e) => updateField('versionLabel', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-400"
                placeholder="e.g. v3.42 AI Story Engine"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Baseline Tag Status
              </label>
              <input
                type="text"
                value={local.baselineTag}
                onChange={(e) => updateField('baselineTag', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                placeholder="e.g. Active Baseline"
              />
            </div>
          </div>


          {/* 2. Generation Engine Settings */}
          <div className="space-y-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Story Generation Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Scene Count</label>
                <select
                  value={local.defaultSceneCount}
                  onChange={(e) => updateField('defaultSceneCount', parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value={7}>7 Scenes (70s — Minimal Threshold)</option>
                  <option value={10}>10 Scenes (100s — Standard Short)</option>
                  <option value={12}>12 Scenes (120s — Extended)</option>
                  <option value={15}>15 Scenes (150s — Max Format)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Duplicate Check Tolerance</label>
                <select
                  value={local.duplicateStrictness}
                  onChange={(e) => updateField('duplicateStrictness', e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="strict">Strict (0-Tolerance against 58 Videos)</option>
                  <option value="balanced">Balanced (Allows fresh angle on old topics)</option>
                  <option value="relaxed">Relaxed (Experimental)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Dialect & Cadence</label>
                <select
                  value={local.dialectTone}
                  onChange={(e) => updateField('dialectTone', e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="conversational">Lahori Conversational (Pakistani Tech YouTuber)</option>
                  <option value="formal">Neutral Tech Urdu (Semi-formal)</option>
                  <option value="fast_paced">Fast-Paced Energetic (TikTok viral style)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Flow Prompt Script Style</label>
                <select
                  value={local.flowPromptFormat}
                  onChange={(e) => updateField('flowPromptFormat', e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="cinematic_3d">Cinematic 3D Hologram + Anchor Split</option>
                  <option value="standard">Standard YouTube Studio Setup</option>
                  <option value="minimal">Minimal Prompt</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={local.autoQueueSync}
                onChange={(e) => updateField('autoQueueSync', e.target.checked)}
                className="rounded border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span>Generate hote hi kahani ko Target Queue aur Content Calendar mein auto-save karein</span>
            </label>
          </div>

          {/* 3. Prompt Rules & Directives */}
          <div className="space-y-2 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Agent Script Rules & Prompt Instructions
            </h4>
            <textarea
              rows={4}
              value={local.customInstructions}
              onChange={(e) => updateField('customInstructions', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-400"
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
