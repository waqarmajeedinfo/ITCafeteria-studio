import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Save, Trash2, ArrowLeft, X } from 'lucide-react';
import type { DirtyRecord } from '../lib/dirtyStore';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  dirtyRecord: DirtyRecord | null;
  targetTabName: string;
  onConfirmSaveAndSwitch: () => void;
  onDiscardAndSwitch: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  dirtyRecord,
  targetTabName,
  onConfirmSaveAndSwitch,
  onDiscardAndSwitch,
  onCancel
}) => {
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen || !dirtyRecord) return null;

  const content = (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-lg shadow-2xl shadow-amber-950/60 overflow-hidden overscroll-contain text-slate-100 ring-1 ring-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ghair Mehfooz Tabdeeliyaan!</h3>
              <p className="text-[11px] text-amber-300 font-mono">Unsaved Changes Detected in {dirtyRecord.title}</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Band Karein"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Message */}
        <div className="p-5 space-y-3 text-xs leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
            <p className="font-semibold text-amber-300">
              Aap ne <span className="text-white underline decoration-amber-400">{dirtyRecord.title}</span> mein tabdeeliyaan save nahi keen.
            </p>
            {dirtyRecord.description && (
              <p className="text-slate-300 mt-1 text-[11px]">{dirtyRecord.description}</p>
            )}
          </div>

          <p className="text-slate-300">
            Agar aap abhi <span className="font-semibold text-cyan-300">"{targetTabName}"</span> par switch karein ge to aap ki ki gayi tabdeeliyaan zaya ho sakti hain.
            Aap kya karna chahte hain?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Yahin Rahein (Cancel)</span>
          </button>

          <button
            type="button"
            onClick={onDiscardAndSwitch}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Switch</span>
          </button>

          <button
            type="button"
            onClick={onConfirmSaveAndSwitch}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Switch Tab</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};
