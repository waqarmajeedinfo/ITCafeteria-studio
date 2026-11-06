import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Brain,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  Layers,
  Search,
  Code2,
  DollarSign,
  Gift,
  RefreshCw,
  Cpu,
  BookmarkCheck,
  Trash2,
  HelpCircle,
  FileCheck2,
  Info
} from 'lucide-react';

interface Directive {
  id: string;
  category: string;
  title: string;
  formula: string;
  enforced: boolean;
  dateAdded: string;
  description: string;
}

interface CustomMemory {
  id: string;
  title: string;
  content: string;
  dateAdded: string;
}

interface CompanionMemoryData {
  companionName: string;
  owner: string;
  studioTitle: string;
  lastUpdated: string;
  pricingAndTrainingInfo: {
    isFree: boolean;
    cost: string;
    noSubscriptionNeeded: boolean;
    apiKeyTier: string;
    howLearningWorks: string;
  };
  activeDirectives: Directive[];
  customMemories: CustomMemory[];
}

interface CompanionMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: 'admin' | 'standard';
}

export const CompanionMemoryModal: React.FC<CompanionMemoryModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'admin',
}) => {
  const [memoryData, setMemoryData] = useState<CompanionMemoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // New rule form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('UI & Layout Formula');

  useEffect(() => {
    if (isOpen) {
      loadMemory();
    }
  }, [isOpen]);

  const loadMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/companion-memory');
      const data = await res.json();
      if (data?.ok && data.memory) {
        setMemoryData(data.memory);
      }
    } catch (err) {
      console.error('Failed to load companion memory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/agent/companion-memory/add-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          formula: newFormula.trim(),
          description: newDescription.trim(),
          category: newCategory,
          username: 'waqarmajeedinfo',
        }),
      });
      const data = await res.json();
      if (data?.ok && data.memory) {
        setMemoryData(data.memory);
        setNewTitle('');
        setNewFormula('');
        setNewDescription('');
        setShowAddForm(false);
        setSaveSuccess('Naya rule AI Companion memory me permanently save ho chuka hai!');
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to add memory directive:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[125] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden overscroll-contain text-slate-100 my-auto"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">AI Companion Persistent Memory Engine</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Gift className="w-3 h-3 text-emerald-400" /> 100% Free / $0.00
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Waqar Majeed (@waqarmajeedinfo)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Long-term memory store: Har conversation, refresh aur naye feature ke baad bhi aapke rules yaad rehte hain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body - Strictly obeys max-height: 80vh & overscroll-behavior: contain */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs custom-modal-scroll" style={{ overscrollBehavior: 'contain' }}>
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Pricing & Free Tier Explanation Banner */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 border border-emerald-500/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    Kya AI Studio aur yeh Memory Feature Free hai ya Paid?
                    <span className="text-emerald-400 text-xs font-mono font-bold">(100% Muft / Zero Cost)</span>
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono border border-emerald-500/30">
                    No Subscription Required
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  <strong className="text-emerald-300">Waqar Bhai!</strong> Aapko kisi bhi qisam ki paid subscription ya extra plugin khareedne ki zaroorat nahi hai.
                  Google AI Studio ka Gemini API Free Tier bilkul muft hai jo <strong className="text-cyan-300">15 RPM (Requests Per Minute)</strong> aur <strong className="text-cyan-300">1,500 Requests Per Day</strong> provide karta hai, jo daily development aur production testing ke liye kaafi zyada hai.
                </p>
                <div className="mt-2 pt-2 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span><strong>Local &amp; GitHub Storage:</strong> $0.00 (Zero hosting bill)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span><strong>Gemini API Free Tier:</strong> 15 RPM / 1,500 Daily Calls</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Permanent Rule Highlight: 80vh Scrolling */}
          <div className="bg-slate-950 border border-cyan-500/50 rounded-xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-sm">Universal Scrolling &amp; Modal Containment Law</h4>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold font-mono">
                      PERMANENTLY ENFORCED
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Aapka farmaaya gaya scrolling formula ab application ke Global CSS (<code className="text-cyan-300 font-mono">src/index.css</code>) aur AI Companion Memory me permanently lock ho chuka hai:
                  </p>
                  <div className="mt-2 p-2.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-cyan-300 text-[11px] select-all flex items-center justify-between">
                    <span>max-height: 80vh; overflow-y: auto; overscroll-behavior: contain;</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-semibold">Active Everywhere</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-2">
                    Future Protection: Jab bhi koi naya menu, submenu, modal ya list banegi, yeh formula baghair kisi bhool ke automatically lagaya jayega.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How Learning Works in this App */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-white text-xs mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              ChatGPT, Claude aur Gemini ki tarah Learning &amp; Memory kaise kaam karti hai?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="font-semibold text-purple-300 mb-1">1. Persistent JSON Brain</div>
                <p className="text-slate-400">
                  Har rule aur directive disk file (<code className="text-purple-300">companion-memory.json</code>) aur GitHub repo me save hoti hai taake session khatam hone par bhi gayab na ho.
                </p>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="font-semibold text-cyan-300 mb-1">2. Dynamic Prompt Grounding</div>
                <p className="text-slate-400">
                  Backend har Gemini model call ke sath <code className="text-cyan-300">systemInstruction</code> me Waqar Bhai ke tamam rules automatically inject karta hai.
                </p>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="font-semibold text-emerald-300 mb-1">3. Zero Drift / Strict Compliance</div>
                <p className="text-slate-400">
                  Aapke rules strict technical constraints ban jate hain—jaise 80vh scroll, 48h search limit, aur admin-only role switches.
                </p>
              </div>
            </div>
          </div>

          {/* Active Directives List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                Active Architectural Directives ({memoryData?.activeDirectives?.length || 0})
              </h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Naya Rule Add Karein</span>
              </button>
            </div>

            {/* Add New Directive Form */}
            {showAddForm && (
              <form onSubmit={handleAddRule} className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-200 text-xs">AI Companion ko Nayi Thinking ya Rule sikhayein</span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 text-[11px] font-medium block mb-1">Rule / Directive Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Card Border Glow Effect"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-[11px] font-medium block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="UI & Layout Formula">UI &amp; Layout Formula</option>
                      <option value="Navigation Law">Navigation Law</option>
                      <option value="Agent Search Engine">Agent Search Engine</option>
                      <option value="Security & RBAC">Security &amp; RBAC</option>
                      <option value="AI Companion Thinking">AI Companion Thinking</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-[11px] font-medium block mb-1">Formula / Technical Code</label>
                  <input
                    type="text"
                    value={newFormula}
                    onChange={(e) => setNewFormula(e.target.value)}
                    placeholder="e.g. border-cyan-500/40 shadow-cyan-500/20"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-[11px] font-medium block mb-1">Explanation / Description</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Describe how the AI should apply this rule..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>AI Memory me Save Karein</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Directives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(memoryData?.activeDirectives || []).map((dir) => (
                <div
                  key={dir.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        {dir.category}
                      </span>
                      <h5 className="font-semibold text-white text-xs mt-1">{dir.title}</h5>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-mono border border-emerald-500/30 shrink-0">
                      Enforced
                    </span>
                  </div>

                  {dir.formula && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-cyan-300 break-all select-all">
                      {dir.formula}
                    </div>
                  )}

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {dir.description}
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Locked on: {dir.dateAdded}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Companion synchronized with local storage &amp; GitHub</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-cyan-600/20"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

function Save(props: any) {
  return <CheckCircle2 {...props} />;
}
