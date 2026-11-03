import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
    try {
      import('../lib/selfHealingEngine').then(({ selfHealingEngine }) => {
        selfHealingEngine.recordFault({
          source: 'RUNTIME_ERROR',
          severity: 'CRITICAL',
          summary: `Component Rendering Fault: ${(error?.message || 'Render Exception').slice(0, 100)}`,
          technicalDetails: String(error?.stack || errorInfo?.componentStack || ''),
          remedyApplied: 'Captured safely by React ErrorBoundary. Component isolate preserved without blanking full viewport.',
          permanentSolutionPrompt: `Inspect component props and state for undefined access causing "${error?.message}".`
        });
      });
    } catch {}
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleClearCorruptStorage = () => {
    try {
      localStorage.removeItem('itcafeteria_latest_story');
      localStorage.removeItem('itcafeteria_memory_records');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 my-4 bg-slate-900 border border-rose-500/50 rounded-2xl text-slate-200 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {this.props.fallbackTitle || 'Component Rendering Error Recovered'}
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Story component render karte waqt aik runtime issue catch hua hai. Screen ko blank hone se bacha liya gaya hai.
              </p>
              {this.state.error && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-rose-500/30 font-mono text-[11px] text-rose-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Dobara Render Karein
                </button>
                <button
                  type="button"
                  onClick={this.handleClearCorruptStorage}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Purana corrupt local cache saaf karke refresh karein"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Corrupt Cache Saaf Karein
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
