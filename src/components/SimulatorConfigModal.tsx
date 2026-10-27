import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';

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

const STORAGE_KEY = 'itcafeteria_simulator_config_v1';

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

  useEffect(() => {
    setLocal(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSimulatorConfig(local);
    onSave(local);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap Simulator ki settings ko default par reset karna chahte hain?')) {
      onReset();
      setLocal(DEFAULT_SIMULATOR_CONFIG);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-blue-950/80 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Baseline & Version Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Version Label (Header Display)
              </label>
              <input
                type="text"
                value={local.versionLabel}
                onChange={(e) => setLocal({ ...local, versionLabel: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-400"
                placeholder="e.g. v3.42 AI Story Engine"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Baseline Tag Status
              </label>
              <input
                type="text"
                value={local.baselineTag}
                onChange={(e) => setLocal({ ...local, baselineTag: e.target.value })}
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
                <label className="text-slate-400 block mb-1">Default Scene Count</label>
                <select
                  value={local.defaultSceneCount}
                  onChange={(e) => setLocal({ ...local, defaultSceneCount: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value={7}>7 Scenes (70s — Minimal Threshold)</option>
                  <option value={10}>10 Scenes (100s — Standard Short)</option>
                  <option value={12}>12 Scenes (120s — Extended)</option>
                  <option value={15}>15 Scenes (150s — Max Format)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Duplicate Check Tolerance</label>
                <select
                  value={local.duplicateStrictness}
                  onChange={(e) => setLocal({ ...local, duplicateStrictness: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="strict">Strict (0-Tolerance against 58 Videos)</option>
                  <option value="balanced">Balanced (Allows fresh angle on old topics)</option>
                  <option value="relaxed">Relaxed (Experimental)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dialect & Cadence</label>
                <select
                  value={local.dialectTone}
                  onChange={(e) => setLocal({ ...local, dialectTone: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="conversational">Lahori Conversational (Pakistani Tech YouTuber)</option>
                  <option value="formal">Neutral Tech Urdu (Semi-formal)</option>
                  <option value="fast_paced">Fast-Paced Energetic (TikTok viral style)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Flow Prompt Script Style</label>
                <select
                  value={local.flowPromptFormat}
                  onChange={(e) => setLocal({ ...local, flowPromptFormat: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="cinematic_3d">Cinematic 3D Hologram + Anchor Split</option>
                  <option value="standard">Standard YouTube Studio Setup</option>
                  <option value="minimal">Minimal Prompt</option>
                </select>
              </div>
            </div>

            {/* Checkbox: Auto Push to Queue */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={local.autoQueueSync}
                  onChange={(e) => setLocal({ ...local, autoQueueSync: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0"
                />
                <span>Generate hote hi kahani ko Target Queue aur Content Calendar mein auto-save karein</span>
              </label>
            </div>
          </div>

          {/* 3. Custom System Prompt / Script Instructions */}
          <div className="space-y-2 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Agent Script Rules & Prompt Instructions
            </h4>
            <textarea
              rows={4}
              value={local.customInstructions}
              onChange={(e) => setLocal({ ...local, customInstructions: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-blue-400 leading-relaxed"
              placeholder="Script formatting rules, pacing instructions..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-950/60 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {savedToast ? 'Saved!' : 'Save Engine Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
