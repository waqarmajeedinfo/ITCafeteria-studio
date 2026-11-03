import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  RotateCcw,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Sparkles,
  Zap,
  Trash2,
  FileText,
  Lock,
  Unlock,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  selfHealingEngine,
  SELF_HEALING_UPDATED_EVENT,
  type DiagnosticFaultRecord,
  type SystemHealthStatus
} from '../lib/selfHealingEngine';

interface DiagnosticMessageBoxProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedInHud?: boolean;
}

export const DiagnosticMessageBox: React.FC<DiagnosticMessageBoxProps> = ({
  isOpen: propIsOpen,
  onClose,
  embedInHud = false
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const [records, setRecords] = useState<DiagnosticFaultRecord[]>(() => selfHealingEngine.getRecords());
  const [health, setHealth] = useState<SystemHealthStatus>(() => selfHealingEngine.runCompleteDiagnostics());
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'SCROLL' | 'STORAGE' | 'AUTOPILOT'>('ALL');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setRecords(e.detail || selfHealingEngine.getRecords());
      setHealth(selfHealingEngine.runCompleteDiagnostics());
    };

    window.addEventListener(SELF_HEALING_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SELF_HEALING_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const handleRunDiagnostics = () => {
    setIsScanning(true);
    setTimeout(() => {
      const res = selfHealingEngine.runCompleteDiagnostics();
      setHealth(res);
      setRecords(selfHealingEngine.getRecords());
      setIsScanning(false);
      setCopyToast('⚡ Self-Diagnostics complete: Tamam engines check aur auto-heal ho gaye!');
      setTimeout(() => setCopyToast(null), 3500);
    }, 400);
  };

  const handleForceUnlockScroll = () => {
    selfHealingEngine.healScrollLock(true);
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.height = '';
    setCopyToast('🔓 Viewport & Screen scroll forcefully unblocked!');
    setTimeout(() => setCopyToast(null), 3000);
  };

  const handleCopyReport = () => {
    const report = selfHealingEngine.generatePermanentSolutionReport();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
      setCopyToast('📋 Permanent Solution Report copy ho gaya! Chat mein paste kar sakte hain.');
      setTimeout(() => setCopyToast(null), 4000);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Kya aap tamam diagnostic fault history ko clear karna chahte hain?')) {
      selfHealingEngine.clearRecords();
      setRecords([]);
      setCopyToast('Diagnostic log clear ho gaya.');
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'CRITICAL') return r.severity === 'CRITICAL';
    if (activeFilter === 'SCROLL') return r.source === 'SCROLL_LOCK';
    if (activeFilter === 'STORAGE') return r.source === 'STORAGE';
    if (activeFilter === 'AUTOPILOT') return r.source === 'AUTOPILOT';
    return true;
  });

  // Embeddable HUD Bar view
  if (embedInHud) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              health.isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">
                  Autonomous Self-Healing & Diagnostic Message Center
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                  health.isHealthy
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}>
                  {health.score}% HEALTH • {records.length} HEALED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Runtime errors, storage corruptions aur viewport scroll locks ko khud pehchanta hai, theek karta hai aur backup save karta hai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleForceUnlockScroll}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Fix & unblock page scroll if locked"
            >
              <Unlock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unlock Scroll</span>
            </button>

            <button
              onClick={handleRunDiagnostics}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Diagnosing...' : '⚡ Scan & Heal'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Copy solution report for permanent resolution"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Permanent Report</span>
            </button>
          </div>
        </div>

        {copyToast && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Recent 3 Auto-Healed Issues Stream */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Recent Auto-Remediations & Diagnostic Messages:</span>
            <span>{records.length} logged events</span>
          </div>
          {records.length === 0 ? (
            <div className="p-3 bg-slate-950/60 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
              ✅ Koi error ya fault nahi mila. Tamam components aur scroll handlers 100% healthy hain.
            </div>
          ) : (
            records.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-500">{rec.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      rec.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {rec.source}
                    </span>
                    <span className="font-semibold text-white">{rec.summary}</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    ↳ Remedied: {rec.remedyApplied}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase shrink-0 self-start sm:self-center">
                  Auto-Healed
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Floating Trigger & Drawer view
  return (
    <>
      {/* Floating Status Pill Button at Bottom Corner */}
      <button
        onClick={() => {
          if (onClose && propIsOpen !== undefined) {
            onClose();
          } else {
            setInternalOpen(!internalOpen);
          }
        }}
        className="fixed bottom-5 right-24 z-40 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl flex items-center gap-2 text-xs font-semibold cursor-pointer backdrop-blur-md transition-all hover:scale-105"
        title="Open Diagnostic & Self-Healing Message Box"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${
          health.isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
        }`} />
        <span className="hidden sm:inline">Self-Healing</span>
        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
          {health.score}%
        </span>
      </button>

      {/* Floating Modal / Message Box Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">
                      Autonomous Diagnostic & Self-Healing Message Box
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      {health.score}% Optimal
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Errors ko auto-catch karta hai, scroll traps unblock karta hai, aur permanent solution backup tayar karta hai.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onClose) onClose();
                  else setInternalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Ribbon */}
            <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {(['ALL', 'CRITICAL', 'SCROLL', 'STORAGE', 'AUTOPILOT'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      activeFilter === filter
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceUnlockScroll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
                  title="Unlock page scrolling immediately"
                >
                  <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unlock Scroll</span>
                </button>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isScanning ? 'Scanning...' : 'Scan & Heal Now'}</span>
                </button>

                <button
                  onClick={handleCopyReport}
                  className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy AI Solution Note</span>
                </button>
              </div>
            </div>

            {copyToast && (
              <div className="px-5 py-2.5 bg-emerald-950/90 border-b border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 shrink-0 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{copyToast}</span>
              </div>
            )}

            {/* List of Faults & Remediations */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs custom-modal-scroll">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-sm">Koi Active Issues Ya Errors Nahi Hain</div>
                  <p className="max-w-md mx-auto text-xs text-slate-500">
                    Tamam component states, Autopilot pipelines aur scroll handlers cleanly chal rahe hain. Agar koi error aayega to yeh system khud use detect kar ke theek kar dega.
                  </p>
                </div>
              ) : (
                filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 relative group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-500">{rec.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          rec.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {rec.source}
                        </span>
                        <h4 className="font-bold text-white text-xs">{rec.summary}</h4>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase font-mono shrink-0">
                        {rec.status}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
                      <span className="font-bold">Auto-Remedy Applied:</span> {rec.remedyApplied}
                    </div>

                    {rec.technicalDetails && (
                      <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-400 break-words">
                        {rec.technicalDetails}
                      </div>
                    )}

                    <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-indigo-200 text-[11px] leading-relaxed">
                      <span className="font-bold text-cyan-300">Permanent Solution Guidance:</span>{' '}
                      {rec.permanentSolutionPrompt}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 text-[11px]">
                IT Cafeteria Self-Healing Engine • Persistent Diagnostics Active
              </span>

              {records.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Diagnostic History</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
