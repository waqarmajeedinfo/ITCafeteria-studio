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
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  PlaySquare,
  HelpCircle
} from 'lucide-react';

export type StoryPatternPreset = 'pattern_a' | 'pattern_b' | 'pattern_c' | 'pattern_d' | 'custom';

export interface SimulatorConfig {
  versionLabel?: string;
  baselineTag: string;
  defaultSceneCount: number;
  duplicateStrictness: 'subpoints' | 'strict' | 'balanced' | 'relaxed';
  dialectTone:
    | 'conversational'
    | 'formal'
    | 'fast_paced'
    | 'documentary'
    | 'brotherly'
    | 'urgent_tech'
    | 'workshop';
  autoQueueSync: boolean;
  flowPromptFormat:
    | 'cinematic_3d'
    | 'standard'
    | 'motion_graphics'
    | 'split_screen'
    | 'kinetic'
    | 'minimal';
  selectedPattern: StoryPatternPreset;
  customInstructions: string;
}

export const STORY_PATTERNS: Record<StoryPatternPreset, { name: string; tag: string; description: string; instructions: string }> = {
  pattern_a: {
    name: 'Pattern A: Standard Short (Problem-Solution)',
    tag: '10-Scene Short',
    description: 'Hook, Problem, Agitate, Reveal, Step 1, Step 2, Proof, Pro-Tip, Mistake Warning, CTA.',
    instructions:
      'No intro greetings. Natural Roman Urdu, warm conversational tech YouTuber cadence. 10 scenes: Hook (Pattern Interrupt), Problem, Agitate/Relatable Pain, Reveal Solution, Step 1 Demo, Step 2 Demo, Proof/Result, Pro-Tip Secret, Common Mistake Warning, Save & Subscribe CTA.'
  },
  pattern_b: {
    name: 'Pattern B: Multi-Secret / 3-Hacks Showcase',
    tag: 'WhatsApp & Tools Secrets',
    description: 'Hook, Instant Teaser, Secret Hack 1, Secret Hack 2, Secret Hack 3, Speed Proof, Safeguard Tip, CTA.',
    instructions:
      'No intro greetings. Fast-paced high-retention Roman Urdu. Multi-secret showcase: Hook (Shocking feature teaser), Immediate Tease, Secret Hack 1 (Feature + Onscreen demo), Secret Hack 2 (Hidden setting you missed), Secret Hack 3 (Master pro trick), Comparison Proof, Bonus Pro-Tip & Safeguard, Follow/Save CTA.'
  },
  pattern_c: {
    name: 'Pattern C: Tool Series / Tutorial (Episodic)',
    tag: 'Power Automate & Long-form',
    description: 'Episode Context & Recap, Workplace Problem, Prerequisite, Step 1-3 Build, Live Run, Next Part Teaser.',
    instructions:
      'Episodic series format. Natural Roman Urdu mentor cadence. Series tutorial: Series Context & Quick Recap, Real-World Workplace Problem, Prerequisite Setup, Workflow Step 1, Workflow Step 2, Workflow Step 3, Live Execution & Validation Test, Edge-Case Warning / Troubleshooting, Teaser for Next Part + Save/Subscribe CTA.'
  },
  pattern_d: {
    name: 'Pattern D: Urgent Tech Warning & Myth Buster',
    tag: 'Bug Alert & Security',
    description: 'Shocking Tech Alert, Risk Proof, Root Cause, 1-Click Fix, Verification Test, Viewer Q, CTA.',
    instructions:
      'High-stakes urgent tone in Roman Urdu. Structure: Shocking security/productivity warning or myth reveal, Live proof of why users are at risk, Root cause explanation, 1-Click fix & prevention step, Post-fix verification test, Interactive viewer question, Subscribe CTA.'
  },
  custom: {
    name: 'Custom User Rules',
    tag: 'User Defined',
    description: 'Aapki apni custom rules aur story structure prompt instructions.',
    instructions: ''
  }
};

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  versionLabel: 'v3.42 AI Story Engine',
  baselineTag: 'Active Baseline',
  defaultSceneCount: 10,
  duplicateStrictness: 'subpoints',
  dialectTone: 'conversational',
  autoQueueSync: true,
  flowPromptFormat: 'cinematic_3d',
  selectedPattern: 'pattern_a',
  customInstructions: STORY_PATTERNS.pattern_a.instructions
};

const STORAGE_KEY = 'itcafeteria_simulator_config_v3';

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

  useEffect(() => {
    if (isOpen) {
      setLocal(config);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSimulatorConfig(local);
    onSave(local);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 450);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap Simulator ki settings ko default par reset karna chahte hain?')) {
      onReset();
      setLocal(DEFAULT_SIMULATOR_CONFIG);
      saveSimulatorConfig(DEFAULT_SIMULATOR_CONFIG);
      onSave(DEFAULT_SIMULATOR_CONFIG);
    }
  };

  const handleSelectPattern = (patternKey: StoryPatternPreset) => {
    if (patternKey === 'custom') {
      setLocal({ ...local, selectedPattern: 'custom' });
    } else {
      setLocal({
        ...local,
        selectedPattern: patternKey,
        customInstructions: STORY_PATTERNS[patternKey].instructions
      });
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-blue-950/80 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Agent Simulator Engine Configuration</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-md font-mono font-semibold">
                  {local.baselineTag || 'Active Baseline'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Agent Story Engine ke rules, baseline status, scene settings, dialect aur pattern structure customize karein.
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
            <span>Engine Configuration kamyabi se save ho gayi!</span>
          </div>
        )}

        {/* Content Body — Scrollable only within modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Baseline Tag Status (Version Label header input removed per request) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Baseline Tag Status</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current active production baseline for the Multi-Channel Story Engine.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-medium text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{local.baselineTag || 'Active Baseline'}</span>
              </span>
              <input
                type="text"
                value={local.baselineTag}
                onChange={(e) => setLocal({ ...local, baselineTag: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400 w-36"
                placeholder="Active Baseline"
                title="Baseline Status Tag"
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
              {/* Scene Count & Duration (10s per scene math) */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                  <span>Default Scene Count</span>
                  <span className="text-[10px] text-cyan-400 font-mono">10s / scene</span>
                </label>
                <select
                  value={local.defaultSceneCount}
                  onChange={(e) => setLocal({ ...local, defaultSceneCount: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value={7}>7 Scenes (70s — 1m 10s)</option>
                  <option value={10}>10 Scenes (100s — 1m 40s Standard Short)</option>
                  <option value={12}>12 Scenes (120s — 2m 00s Video)</option>
                  <option value={15}>15 Scenes (150s — 2m 30s Video)</option>
                  <option value={18}>18 Scenes (180s — 3m 00s Video)</option>
                  <option value={30}>30 Scenes (300s — 5m 00s Deep Dive)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculation: Har scene theek 10 second ka hai. 18 scenes = 3 min, 30 scenes = 5 min.
                </p>
              </div>

              {/* Duplicate Check Tolerance */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                  <span>Duplicate Check Tolerance</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Sub-Point Verification</span>
                </label>
                <select
                  value={local.duplicateStrictness}
                  onChange={(e) => setLocal({ ...local, duplicateStrictness: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="subpoints">Deep Sub-Point & Secret Verification (Recommended)</option>
                  <option value="balanced">Balanced (Allows fresh angle on old topics)</option>
                  <option value="strict">Strict (0-Tolerance against 58 Videos)</option>
                  <option value="relaxed">Relaxed (Experimental / Broad check)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Main tool (e.g. WhatsApp / Power Automate) par duplicate mark nahi karega, balkay andar ke specific features aur points check karega (Part 1, 2, 3 allowed).
                </p>
              </div>

              {/* Dialect & Cadence */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Dialect & Cadence</label>
                <select
                  value={local.dialectTone}
                  onChange={(e) => setLocal({ ...local, dialectTone: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="conversational">Lahori Conversational (Pakistani Tech YouTuber)</option>
                  <option value="formal">Natural Tech Urdu (Semi-formal)</option>
                  <option value="fast_paced">Fast-Paced Energetic (TikTok Viral Style)</option>
                  <option value="documentary">Deep-Dive Documentary Explainer (Authoritative)</option>
                  <option value="brotherly">Casual Senior Brotherly / Bhai Advice (Trustworthy)</option>
                  <option value="urgent_tech">High-Stakes Urgent Breaking Tech (Fast hook alert)</option>
                  <option value="workshop">Step-by-Step Hands-On Workshop (Instructor pace)</option>
                </select>
              </div>

              {/* Flow Prompt Script Style */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Flow Prompt Script Style</label>
                <select
                  value={local.flowPromptFormat}
                  onChange={(e) => setLocal({ ...local, flowPromptFormat: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="cinematic_3d">Cinematic 3D Hologram + Anchor Split</option>
                  <option value="motion_graphics">Minimalist Clean Motion Graphics & Code Screencast</option>
                  <option value="split_screen">Live Split-Screen Hands-On Demo & Facecam Reaction</option>
                  <option value="kinetic">Kinetic Typography & Dynamic Zoom Cutaways</option>
                  <option value="standard">Standard YouTube Studio Setup</option>
                  <option value="minimal">Minimal Prompt</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={local.autoQueueSync}
                onChange={(e) => setLocal({ ...local, autoQueueSync: e.target.checked })}
                className="rounded border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span>Generate hote hi kahani ko Target Queue aur Content Calendar mein auto-save karein</span>
            </label>
          </div>

          {/* 3. Multi-Pattern Story Presets & User Editable Prompt Instructions */}
          <div className="space-y-3 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Agent Script Rules & Prompt Instructions
              </h4>
              <span className="text-[10px] text-cyan-400 font-medium">
                Click any pattern below to load, or type custom instructions:
              </span>
            </div>

            {/* Switchable Story Structure Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(['pattern_a', 'pattern_b', 'pattern_c', 'pattern_d'] as StoryPatternPreset[]).map((patternKey) => {
                const item = STORY_PATTERNS[patternKey];
                const isActive = local.selectedPattern === patternKey;
                return (
                  <button
                    key={patternKey}
                    type="button"
                    onClick={() => handleSelectPattern(patternKey)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-950/70 border-cyan-400 shadow-sm shadow-cyan-950'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-white text-[11px] truncate">
                        {item.tag}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Editable Textarea with Full User Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Prompt Instructions for AI Story Engine:</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {local.customInstructions.length} chars • {local.customInstructions.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={4}
                value={local.customInstructions}
                onChange={(e) => {
                  setLocal({
                    ...local,
                    customInstructions: e.target.value,
                    selectedPattern: 'custom'
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:border-blue-400"
                placeholder="Aap apni marzi ke prompt rules, beat structure aur voice instructions yahan likh sakte hain..."
              />
            </div>
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
              onClick={handleSave}
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
