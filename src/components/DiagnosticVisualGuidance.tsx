import React, { useState, useEffect, useRef } from 'react';
import { Target, X, ChevronRight, CheckCircle2, Sparkles, Navigation } from 'lucide-react';

export interface DiagnosticStep {
  selector?: string;
  targetSelector?: string;
  label?: string;
  title?: string;
  description: string;
}

export interface DiagnosticGuidePayload {
  step?: number;
  totalSteps?: number;
  title?: string;
  label?: string;
  description?: string;
  targetSelector?: string;
  selector?: string;
  steps?: DiagnosticStep[];
  autoDismissMs?: number;
}

export const DiagnosticVisualGuidance: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepList, setStepList] = useState<DiagnosticStep[]>([]);
  const [activeGuide, setActiveGuide] = useState<DiagnosticGuidePayload | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<any>(null);

  const applyStepHighlight = (step: DiagnosticStep) => {
    const selector = step.selector || step.targetSelector;
    if (selector) {
      setTimeout(() => {
        try {
          const el = document.querySelector(selector) as HTMLElement;
          if (el) {
            const rect = el.getBoundingClientRect();
            setHighlightRect(rect);
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            setHighlightRect(null);
          }
        } catch {
          setHighlightRect(null);
        }
      }, 100);
    } else {
      setHighlightRect(null);
    }
  };

  useEffect(() => {
    const handleGuideEvent = (e: CustomEvent<DiagnosticGuidePayload>) => {
      const payload = e.detail;
      if (!payload) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Check if multi-step or single step
      if (payload.steps && payload.steps.length > 0) {
        setStepList(payload.steps);
        setCurrentStepIndex(0);
        setActiveGuide({
          ...payload,
          step: 1,
          totalSteps: payload.steps.length,
          title: payload.steps[0].title || payload.steps[0].label || payload.title || 'Diagnostic Step',
          description: payload.steps[0].description,
          targetSelector: payload.steps[0].selector || payload.steps[0].targetSelector
        });
        applyStepHighlight(payload.steps[0]);
      } else {
        const title = payload.title || payload.label || 'Diagnostic Step';
        const description = payload.description || '';
        const targetSelector = payload.targetSelector || payload.selector;
        setStepList([]);
        setCurrentStepIndex(0);
        setActiveGuide({
          ...payload,
          step: payload.step || 1,
          totalSteps: payload.totalSteps || 1,
          title,
          description,
          targetSelector
        });
        applyStepHighlight({ selector: targetSelector, title, description });
      }

      const dismissMs = payload.autoDismissMs || 9000;
      timerRef.current = setTimeout(() => {
        setActiveGuide(null);
        setHighlightRect(null);
      }, dismissMs);
    };

    window.addEventListener('itcafeteria_diagnostic_guide' as any, handleGuideEvent);

    const handleResizeOrScroll = () => {
      if (activeGuide?.targetSelector) {
        try {
          const el = document.querySelector(activeGuide.targetSelector) as HTMLElement;
          if (el) {
            setHighlightRect(el.getBoundingClientRect());
          }
        } catch {}
      }
    };

    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });
    window.addEventListener('resize', handleResizeOrScroll);

    return () => {
      window.removeEventListener('itcafeteria_diagnostic_guide' as any, handleGuideEvent);
      window.removeEventListener('scroll', handleResizeOrScroll);
      window.removeEventListener('resize', handleResizeOrScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeGuide]);

  const handleNextStep = () => {
    if (stepList.length > 0 && currentStepIndex < stepList.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const stepItem = stepList[nextIdx];
      setActiveGuide((prev) => ({
        ...prev,
        step: nextIdx + 1,
        totalSteps: stepList.length,
        title: stepItem.title || stepItem.label || `Step ${nextIdx + 1}`,
        description: stepItem.description,
        targetSelector: stepItem.selector || stepItem.targetSelector
      }));
      applyStepHighlight(stepItem);
    } else {
      setActiveGuide(null);
      setHighlightRect(null);
    }
  };

  if (!activeGuide) return null;

  return (
    <>
      {/* 1. Element Spotlight Ring */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            top: `${highlightRect.top - 6}px`,
            left: `${highlightRect.left - 6}px`,
            width: `${highlightRect.width + 12}px`,
            height: `${highlightRect.height + 12}px`,
          }}
          className="pointer-events-none z-[9998] rounded-xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.85)] ring-4 ring-cyan-500/30 animate-pulse transition-all duration-300"
        >
          {/* Target Pointer Tag */}
          <div className="absolute -top-7 left-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
            <Target className="w-3 h-3 text-slate-950 animate-spin" />
            <span>Step {activeGuide.step} Target</span>
          </div>
        </div>
      )}

      {/* 2. Top-Center Floating Diagnostic Guidance HUD */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] max-w-[94vw] sm:max-w-xl w-full pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-4">
        <div className="bg-slate-950/95 border-2 border-cyan-400/80 rounded-2xl p-3 sm:p-4 shadow-[0_12px_45px_rgba(6,182,212,0.45)] backdrop-blur-xl ring-1 ring-cyan-300/40 text-white flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {activeGuide.step}
              </span>
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Auto-Pilot Diagnostic Guidance
                  {activeGuide.totalSteps && (
                    <span className="text-slate-400 font-mono">({activeGuide.step}/{activeGuide.totalSteps})</span>
                  )}
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-sm sm:max-w-md">
                  {activeGuide.title}
                </h4>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveGuide(null);
                setHighlightRect(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            {activeGuide.description}
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px] text-cyan-300">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <Navigation className="w-3 h-3 text-cyan-400 animate-bounce" />
              <span>Screen element highlighted & aligned</span>
            </div>

            <div className="flex items-center gap-2">
              {stepList.length > 1 && currentStepIndex < stepList.length - 1 && (
                <button
                  onClick={handleNextStep}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Next Step ({currentStepIndex + 2}/{stepList.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => {
                  setActiveGuide(null);
                  setHighlightRect(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Understood</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export function triggerDiagnosticGuidance(payload: DiagnosticGuidePayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('itcafeteria_diagnostic_guide', { detail: payload })
    );
  }
}
