import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  ListChecks,
  User,
  Search,
  ShieldCheck,
  FileText,
  Layers,
  ArrowRight,
  Play
} from 'lucide-react';
import type { ChannelProfile } from '../data/channelData';

export interface AgentFlowSelection {
  tag: string;
  categoryId: number;
  sceneCount: number;
}

interface AgentFlowScreenProps {
  profile: ChannelProfile;
  mode: 'routine' | 'custom';
  currentTag: string;
  currentCategoryId: number;
  currentSceneCount: number;
  onClose: () => void;
  onApply: (selection: AgentFlowSelection) => void;
}

const HOOK_FORMULAS = ['Reveal', 'Mistake', 'Contrarian Flip', 'Warning', 'Before/After', 'Comparison', 'Statistic'];

export const AgentFlowScreen: React.FC<AgentFlowScreenProps> = ({
  profile,
  mode,
  currentTag,
  currentCategoryId,
  currentSceneCount,
  onClose,
  onApply
}) => {
  const isRoutine = mode === 'routine';

  // Section 11.1 — Routine mode auto-rotates category and character tag
  const rotationPool = profile.rotationCategoryIds.length ? profile.rotationCategoryIds : profile.categories.map((c) => c.id);
  const currentCatIndex = rotationPool.indexOf(currentCategoryId);
  const nextCategoryId = rotationPool[(currentCatIndex + 1) % rotationPool.length];
  const rotatedCategory =
    profile.categories.find((c) => c.id === nextCategoryId) ?? profile.categories[0];
  const currentTagIndex = profile.tags.findIndex((t) => t.value === currentTag);
  const rotatedTag = profile.tags[(currentTagIndex + 1) % profile.tags.length]?.value ?? profile.tags[0].value;

  const [customTopic, setCustomTopic] = useState('');
  const [hookFormula, setHookFormula] = useState('Reveal');
  const [formCategoryId, setFormCategoryId] = useState(currentCategoryId);
  const [formTag, setFormTag] = useState(currentTag);
  const [formSceneCount, setFormSceneCount] = useState(currentSceneCount);
  const [formError, setFormError] = useState<string | null>(null);

  const [phase, setPhase] = useState<'setup' | 'running' | 'complete'>(isRoutine ? 'running' : 'setup');
  const [stepIndex, setStepIndex] = useState(0);

  const selection = useMemo(() => {
    if (isRoutine) {
      return {
        tag: rotatedTag,
        categoryId: rotatedCategory.id,
        sceneCount: currentSceneCount,
        category: rotatedCategory
      };
    }
    const category = profile.categories.find((c) => c.id === formCategoryId) ?? profile.categories[0];
    return { tag: formTag, categoryId: category.id, sceneCount: formSceneCount, category };
  }, [isRoutine, rotatedTag, rotatedCategory, currentSceneCount, formTag, formCategoryId, formSceneCount, profile.categories]);

  const note = isRoutine
    ? profile.sampleNotes[selection.categoryId] ?? { title: selection.category.name, hook: 'Reveal' }
    : { title: customTopic.trim() || 'Custom Topic', hook: hookFormula };

  const duplicateDetail =
    profile.id === 'itcafeteria'
      ? '58 published videos + memory blocks scan'
      : 'Beauty Hub library + memory blocks scan';

  const steps = isRoutine
    ? [
        { title: 'Channel identity lock', detail: `${profile.name} • ${profile.presenter} • ${profile.niche}`, icon: <Lock className="w-4 h-4" /> },
        { title: 'Category rotation (Section 11.1)', detail: `${selection.categoryId}. ${selection.category.name} — rotation ke mutabiq auto-select`, icon: <ListChecks className="w-4 h-4" /> },
        { title: 'Character tag rotation', detail: `${selection.tag} — auto-rotate${profile.tags.length === 1 ? ' (sirf 1 tag setup hai)' : ''}`, icon: <User className="w-4 h-4" /> },
        { title: 'Live research (Section 10)', detail: `${profile.niche} momentum scan — Pakistan + global trends`, icon: <Search className="w-4 h-4" /> },
        { title: 'Duplicate check (Step 4b)', detail: duplicateDetail, icon: <ShieldCheck className="w-4 h-4" /> },
        { title: 'Decision Note tayar', detail: `Title: ${note.title} | Hook: ${note.hook} | Confidence: High`, icon: <FileText className="w-4 h-4" /> },
        { title: 'Full story + upload package', detail: `${selection.sceneCount} scenes × 10s = ${selection.sceneCount * 10}s • 5 items + Memory Block`, icon: <Layers className="w-4 h-4" /> }
      ]
    : [
        { title: 'Custom topic lock', detail: note.title, icon: <Lock className="w-4 h-4" /> },
        { title: 'Category & tag confirm', detail: `${selection.categoryId}. ${selection.category.name} • ${selection.tag}`, icon: <ListChecks className="w-4 h-4" /> },
        { title: 'Research + story angle', detail: `${profile.niche} — custom topic ke liye verified research`, icon: <Search className="w-4 h-4" /> },
        { title: 'Duplicate check (Step 4b)', detail: duplicateDetail, icon: <ShieldCheck className="w-4 h-4" /> },
        { title: 'Decision Note tayar', detail: `Title: ${note.title} | Hook: ${note.hook} | Confidence: Medium`, icon: <FileText className="w-4 h-4" /> },
        { title: 'Full story + upload package', detail: `${selection.sceneCount} scenes × 10s = ${selection.sceneCount * 10}s • 5 items + Memory Block`, icon: <Layers className="w-4 h-4" /> }
      ];

  // Stage-by-stage automation timer
  useEffect(() => {
    if (phase !== 'running') return;
    if (stepIndex < steps.length) {
      const timer = setTimeout(() => setStepIndex((i) => i + 1), 750);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhase('complete'), 500);
    return () => clearTimeout(timer);
  }, [phase, stepIndex, steps.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const startCustomFlow = () => {
    if (!customTopic.trim()) {
      setFormError('Pehle custom topic likhein — phir flow trigger karein.');
      return;
    }
    setFormError(null);
    setStepIndex(0);
    setPhase('running');
  };

  const applyAndClose = () => {
    onApply({ tag: selection.tag, categoryId: selection.categoryId, sceneCount: selection.sceneCount });
    onClose();
  };

  const progress = phase === 'complete' ? 100 : Math.round((stepIndex / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white shadow-lg ${isRoutine ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/25' : 'bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-violet-500/25'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  {isRoutine ? 'Routine / Auto Flow' : 'Custom Flow'} — {profile.name}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isRoutine ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30'}`}>
                  v3.41 Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRoutine
                  ? 'Category aur character tag rotation ke saath automated production cycle.'
                  : 'Aap ki custom selection ke mutabiq step-by-step production flow.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Summary */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Channel: <strong className="text-white">{profile.name}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
            Tag: <strong className="text-cyan-300">{selection.tag}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Category: <strong className="text-white">{selection.categoryId}. {selection.category.name}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Duration: <strong className="text-white">{selection.sceneCount * 10}s</strong> ({selection.sceneCount} scenes)
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {phase === 'setup' && !isRoutine && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Custom Topic / Idea</label>
                <textarea
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  rows={2}
                  placeholder="e.g. Winter mein dry skin ka ilaaj — 3-step night routine"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Hook Formula (Section 18)</label>
                  <select
                    value={hookFormula}
                    onChange={(e) => setHookFormula(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-400"
                  >
                    {HOOK_FORMULAS.map((formula) => (
                      <option key={formula} value={formula}>{formula}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category & Playlist (Section 9)</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-400"
                  >
                    {profile.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.id}. {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Character Tag Variant (Q3)</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-fuchsia-400"
                  >
                    {profile.tags.map((tag) => (
                      <option key={tag.value} value={tag.value}>{tag.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Duration & Scenes (Section 12)</label>
                  <select
                    value={formSceneCount}
                    onChange={(e) => setFormSceneCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-400"
                  >
                    {profile.durations.map((duration) => (
                      <option key={duration.value} value={duration.value}>{duration.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">{formError}</p>
              )}
            </div>
          )}

          {phase !== 'setup' && (
            <>
              {/* Progress bar */}
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${isRoutine ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-violet-500 to-fuchsia-400'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-1.5">
                {steps.map((step, idx) => {
                  const isDone = phase === 'complete' || idx < stepIndex;
                  const isActive = phase === 'running' && idx === stepIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/25'
                          : isActive
                          ? 'bg-slate-800/80 border-cyan-500/40'
                          : 'bg-slate-950/40 border-slate-800/70 opacity-60'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500/15 text-emerald-300' : isActive ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : step.icon}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${isDone ? 'text-emerald-200' : isActive ? 'text-white' : 'text-slate-400'}`}>
                          {idx + 1}. {step.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono break-words">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion Card */}
              {phase === 'complete' && (
                <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Flow mukammal — production package ready
                  </div>
                  <p className="text-xs text-slate-200">
                    <span className="text-slate-400">Title:</span> “{note.title}”
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hook: <span className="text-slate-200">{note.hook}</span> • Confidence:{' '}
                    <span className="text-slate-200">{isRoutine ? 'High' : 'Medium'}</span> • Duplicate check:{' '}
                    <span className="text-emerald-300">Naya (Safe to produce)</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selection.categoryId}. {selection.category.name} • {selection.tag} • {selection.sceneCount} scenes ({selection.sceneCount * 10}s) • Thumbnail prompt + 5-item package + Memory Block auto-assembled.
                  </p>
                  {isRoutine && (
                    <p className="text-[10px] text-cyan-300/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Rotation apply karne par aap ke dropdowns naye category/tag par set ho jayenge.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Band Karein
          </button>

          <div className="flex items-center gap-2">
            {phase === 'running' && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Flow chal raha hai...
              </span>
            )}

            {phase === 'setup' && !isRoutine && (
              <button
                onClick={startCustomFlow}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-violet-500/25 transition-opacity cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Custom Flow Trigger Karein
              </button>
            )}

            {phase === 'complete' && (
              <>
                <button
                  onClick={() => {
                    setStepIndex(0);
                    if (isRoutine) {
                      setPhase('running');
                    } else {
                      setPhase('setup');
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {isRoutine ? 'Dobara Chalayein' : 'Topic Badlein'}
                </button>
                <button
                  onClick={applyAndClose}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg transition-opacity hover:opacity-90 cursor-pointer ${
                    isRoutine
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/25'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-violet-500/25'
                  }`}
                >
                  Apply Selection
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
