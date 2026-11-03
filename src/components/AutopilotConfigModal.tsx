import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sliders,
  Bot,
  Search,
  Zap,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  Radio,
  Tv,
  Edit2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  loadAutopilotConfig,
  updateAutopilotConfig,
  restoreDefaultAutopilotConfig,
  DEFAULT_AUTOPILOT_CONFIG,
  DEFAULT_AGENT_JDS,
  DEFAULT_SEARCH_RULES,
  type AutopilotConfiguration,
  type AutopilotAgentJD,
  type AutopilotSearchRule
} from '../lib/autopilotConfigStore';
import { loadAllChannels, type ExtendedChannelProfile } from '../lib/channelStore';
import { dirtyManager } from '../lib/dirtyStore';

interface AutopilotConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (cfg: AutopilotConfiguration) => void;
}

type ActiveTab = 'jds' | 'search' | 'triggers' | 'channels';

export const AutopilotConfigModal: React.FC<AutopilotConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<AutopilotConfiguration>(loadAutopilotConfig);
  const [activeTab, setActiveTab] = useState<ActiveTab>('jds');
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // New Agent JD form state
  const [showAddJdForm, setShowAddJdForm] = useState(false);
  const [newJdRole, setNewJdRole] = useState('');
  const [newJdTitle, setNewJdTitle] = useState('');
  const [newJdDescription, setNewJdDescription] = useState('');
  const [newJdTrigger, setNewJdTrigger] = useState('Runs on cadence timer (30s) or low queue (<3).');
  const [newJdInterval, setNewJdInterval] = useState('Every 30 seconds');
  const [newJdQuery, setNewJdQuery] = useState('{niche} latest trending shortcuts 2026');
  const [newJdPriority, setNewJdPriority] = useState(8);

  // New Search Rule form state
  const [showAddSearchRule, setShowAddSearchRule] = useState(false);
  const [newSrName, setNewSrName] = useState('');
  const [newSrCategory, setNewSrCategory] = useState('');
  const [newSrQuery, setNewSrQuery] = useState('');
  const [newSrEngine, setNewSrEngine] = useState<'google_grounding' | 'fast_internal' | 'custom_web'>('google_grounding');
  const [newSrFrequency, setNewSrFrequency] = useState<'continuous' | 'hourly' | 'daily_scheduled' | 'queue_depleted'>('continuous');
  const [newSrDomains, setNewSrDomains] = useState('blog.google, microsoft.com');

  // Edit Agent JD form state
  const [editingJdId, setEditingJdId] = useState<string | null>(null);
  const [editJdRole, setEditJdRole] = useState('');
  const [editJdTitle, setEditJdTitle] = useState('');
  const [editJdDescription, setEditJdDescription] = useState('');
  const [editJdTrigger, setEditJdTrigger] = useState('');
  const [editJdInterval, setEditJdInterval] = useState('');
  const [editJdQuery, setEditJdQuery] = useState('');
  const [editJdPriority, setEditJdPriority] = useState(8);

  // Edit Search Rule form state
  const [editingSrId, setEditingSrId] = useState<string | null>(null);
  const [editSrName, setEditSrName] = useState('');
  const [editSrCategory, setEditSrCategory] = useState('');
  const [editSrQuery, setEditSrQuery] = useState('');
  const [editSrEngine, setEditSrEngine] = useState<'google_grounding' | 'fast_internal' | 'custom_web'>('google_grounding');
  const [editSrFrequency, setEditSrFrequency] = useState<'continuous' | 'hourly' | 'daily_scheduled' | 'queue_depleted'>('continuous');
  const [editSrDomains, setEditSrDomains] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfig(loadAutopilotConfig());
      setChannels(loadAllChannels());
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleUpdate = (updates: Partial<AutopilotConfiguration>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    dirtyManager.setDirty({
      id: 'autopilot_manager',
      title: 'Autopilot Configuration Modified',
      description: 'Unsaved changes in Autopilot JDs or triggers'
    });
  };

  const handleSave = () => {
    const saved = updateAutopilotConfig(config, 'Autopilot Config Saved via Manager');
    setConfig(saved);
    dirtyManager.clearDirty('autopilot_manager');
    if (onConfigSaved) onConfigSaved(saved);
    showStatus('Autopilot Configuration & JDs successfully save ho gayi hain!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap Autopilot ki tamam settings, JDs aur search rules ko default par restore karna chahte hain?')) {
      const restored = restoreDefaultAutopilotConfig();
      setConfig(restored);
      dirtyManager.clearDirty('autopilot_manager');
      if (onConfigSaved) onConfigSaved(restored);
      showStatus('Autopilot defaults restore ho gaye.');
    }
  };

  // Agent JD Actions
  const handleToggleJd = (id: string) => {
    const nextJds = (config.agentJDs || DEFAULT_AGENT_JDS).map((jd) =>
      jd.id === id ? { ...jd, isActive: !jd.isActive } : jd
    );
    handleUpdate({ agentJDs: nextJds });
  };

  const handleDeleteJd = (id: string) => {
    if (window.confirm('Kya aap is Agent JD ko delete karna chahte hain?')) {
      const nextJds = (config.agentJDs || DEFAULT_AGENT_JDS).filter((jd) => jd.id !== id);
      handleUpdate({ agentJDs: nextJds });
      showStatus('Agent JD remove ho gaya.');
    }
  };

  const handleAddJd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJdRole.trim() || !newJdDescription.trim()) return;

    const newJd: AutopilotAgentJD = {
      id: `jd-custom-${Date.now()}`,
      roleName: newJdRole.trim(),
      agentTitle: newJdTitle.trim() || newJdRole.trim(),
      description: newJdDescription.trim(),
      triggerCondition: newJdTrigger.trim() || 'Custom condition',
      executionInterval: newJdInterval.trim() || 'On demand',
      searchQueryTemplate: newJdQuery.trim(),
      priorityWeight: Number(newJdPriority) || 8,
      isActive: true
    };

    const nextJds = [...(config.agentJDs || DEFAULT_AGENT_JDS), newJd];
    handleUpdate({ agentJDs: nextJds });
    setNewJdRole('');
    setNewJdTitle('');
    setNewJdDescription('');
    setShowAddJdForm(false);
    showStatus(`Naya Agent JD "${newJd.roleName}" kamyabi se add ho gaya!`);
  };

  // Search Rule Actions
  const handleToggleSearchRule = (id: string) => {
    const nextRules = (config.searchRules || DEFAULT_SEARCH_RULES).map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    handleUpdate({ searchRules: nextRules });
  };

  const handleDeleteSearchRule = (id: string) => {
    if (window.confirm('Kya aap is Search Rule ko delete karna chahte hain?')) {
      const nextRules = (config.searchRules || DEFAULT_SEARCH_RULES).filter((r) => r.id !== id);
      handleUpdate({ searchRules: nextRules });
      showStatus('Search rule remove ho gaya.');
    }
  };

  const handleAddSearchRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrName.trim() || !newSrQuery.trim()) return;

    const newRule: AutopilotSearchRule = {
      id: `sr-custom-${Date.now()}`,
      name: newSrName.trim(),
      targetNicheOrCategory: newSrCategory.trim() || 'All Categories',
      queryTemplate: newSrQuery.trim(),
      searchEngine: newSrEngine,
      frequency: newSrFrequency,
      domainsPriority: newSrDomains.split(',').map((d) => d.trim()).filter(Boolean),
      isActive: true
    };

    const nextRules = [...(config.searchRules || DEFAULT_SEARCH_RULES), newRule];
    handleUpdate({ searchRules: nextRules });
    setNewSrName('');
    setNewSrCategory('');
    setNewSrQuery('');
    setShowAddSearchRule(false);
    showStatus(`Naya Search Rule "${newRule.name}" add ho gaya!`);
  };

  const startEditJd = (jd: AutopilotAgentJD) => {
    setEditingJdId(jd.id);
    setEditJdRole(jd.roleName);
    setEditJdTitle(jd.agentTitle);
    setEditJdDescription(jd.description);
    setEditJdTrigger(jd.triggerCondition);
    setEditJdInterval(jd.executionInterval);
    setEditJdQuery(jd.searchQueryTemplate || '');
    setEditJdPriority(jd.priorityWeight);
  };

  const saveEditJd = (id: string) => {
    if (!editJdRole.trim() || !editJdDescription.trim()) return;
    const nextJds = (config.agentJDs || DEFAULT_AGENT_JDS).map((j) =>
      j.id === id
        ? {
            ...j,
            roleName: editJdRole.trim(),
            agentTitle: editJdTitle.trim() || editJdRole.trim(),
            description: editJdDescription.trim(),
            triggerCondition: editJdTrigger.trim(),
            executionInterval: editJdInterval.trim(),
            searchQueryTemplate: editJdQuery.trim(),
            priorityWeight: Number(editJdPriority) || 8
          }
        : j
    );
    handleUpdate({ agentJDs: nextJds });
    setEditingJdId(null);
    showStatus(`Agent JD "${editJdRole.trim()}" kamyabi se update ho gaya!`);
  };

  const startEditSr = (sr: AutopilotSearchRule) => {
    setEditingSrId(sr.id);
    setEditSrName(sr.name);
    setEditSrCategory(sr.targetNicheOrCategory);
    setEditSrQuery(sr.queryTemplate);
    setEditSrEngine(sr.searchEngine);
    setEditSrFrequency(sr.frequency);
    setEditSrDomains(sr.domainsPriority.join(', '));
  };

  const saveEditSr = (id: string) => {
    if (!editSrName.trim() || !editSrQuery.trim()) return;
    const nextRules = (config.searchRules || DEFAULT_SEARCH_RULES).map((r) =>
      r.id === id
        ? {
            ...r,
            name: editSrName.trim(),
            targetNicheOrCategory: editSrCategory.trim() || 'All Categories',
            queryTemplate: editSrQuery.trim(),
            searchEngine: editSrEngine,
            frequency: editSrFrequency,
            domainsPriority: editSrDomains.split(',').map((d) => d.trim()).filter(Boolean)
          }
        : r
    );
    handleUpdate({ searchRules: nextRules });
    setEditingSrId(null);
    showStatus(`Search Rule "${editSrName.trim()}" kamyabi se update ho gaya!`);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/80 overflow-hidden overscroll-contain text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Autopilot Engine & JDs Configuration Manager</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono">
                  Autonomous Logic v3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autopilot ke agent roles (JDs), search schedule, radar queries aur autonomous trigger conditions ko customize karein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Default autopilot settings restore karein"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-950"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Config</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusNotice && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('jds')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'jds'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 Agent Roles & JDs ({(config.agentJDs || DEFAULT_AGENT_JDS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'search'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>🔍 Search Rules & Radar ({(config.searchRules || DEFAULT_SEARCH_RULES).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'triggers'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Autonomous Triggers & Cadence</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'channels'
                ? 'bg-slate-900 text-cyan-300 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>📺 Channel Scope & Rotation</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-modal-scroll p-5 space-y-5 text-xs">
          {/* TAB 1: Agent Roles & JDs */}
          {activeTab === 'jds' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    Agent Team Job Descriptions & Autonomous Execution Priorities
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Har agent ka role, responsibility, kab wo trigger hota hai aur uska execution interval set karein.
                  </p>
                </div>
                {!showAddJdForm && (
                  <button
                    onClick={() => setShowAddJdForm(true)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-cyan-950"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Agent JD</span>
                  </button>
                )}
              </div>

              {/* Add New Agent JD Form */}
              {showAddJdForm && (
                <form
                  onSubmit={handleAddJd}
                  className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Naya Agent Role / Custom JD Define Karein
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddJdForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Role Name</label>
                      <input
                        type="text"
                        value={newJdRole}
                        onChange={(e) => setNewJdRole(e.target.value)}
                        placeholder="e.g. Trend Predictor Agent"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Agent Title / Badge</label>
                      <input
                        type="text"
                        value={newJdTitle}
                        onChange={(e) => setNewJdTitle(e.target.value)}
                        placeholder="e.g. Viral Prediction Engine"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Job Description & Responsibilities</label>
                    <textarea
                      value={newJdDescription}
                      onChange={(e) => setNewJdDescription(e.target.value)}
                      placeholder="Explain what this agent does, what data it examines, and what output it produces..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Trigger Condition</label>
                      <input
                        type="text"
                        value={newJdTrigger}
                        onChange={(e) => setNewJdTrigger(e.target.value)}
                        placeholder="When pending queue < 2"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Execution Interval</label>
                      <input
                        type="text"
                        value={newJdInterval}
                        onChange={(e) => setNewJdInterval(e.target.value)}
                        placeholder="Every 30s cycle"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Priority Weight (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={newJdPriority}
                        onChange={(e) => setNewJdPriority(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Search Query / Prompt Template</label>
                    <input
                      type="text"
                      value={newJdQuery}
                      onChange={(e) => setNewJdQuery(e.target.value)}
                      placeholder="{niche} viral hacks and tools 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddJdForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      Save Agent Role
                    </button>
                  </div>
                </form>
              )}

              {/* JDs List */}
              <div className="space-y-3">
                {(config.agentJDs || DEFAULT_AGENT_JDS).map((jd) => (
                  <div
                    key={jd.id}
                    className={`p-4 rounded-xl border transition-all ${
                      jd.isActive
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    {editingJdId === jd.id ? (
                      /* Inline JD Editor Form */
                      <div className="space-y-3 bg-slate-900/90 p-3 rounded-lg border border-cyan-500/50">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Agent JD: {jd.roleName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingJdId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Role Name</label>
                            <input
                              type="text"
                              value={editJdRole}
                              onChange={(e) => setEditJdRole(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Agent Title / Badge</label>
                            <input
                              type="text"
                              value={editJdTitle}
                              onChange={(e) => setEditJdTitle(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Job Description & Responsibilities</label>
                          <textarea
                            value={editJdDescription}
                            onChange={(e) => setEditJdDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Trigger Condition</label>
                            <input
                              type="text"
                              value={editJdTrigger}
                              onChange={(e) => setEditJdTrigger(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Execution Interval</label>
                            <input
                              type="text"
                              value={editJdInterval}
                              onChange={(e) => setEditJdInterval(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Priority Weight (1-10)</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={editJdPriority}
                              onChange={(e) => setEditJdPriority(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 font-mono font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Query / Prompt Pattern</label>
                          <input
                            type="text"
                            value={editJdQuery}
                            onChange={(e) => setEditJdQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-400 font-mono text-[11px]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingJdId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditJd(jd.id)}
                            className="px-4 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-white text-xs">{jd.roleName}</h5>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                              {jd.agentTitle}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/60">
                              Priority: {jd.priorityWeight}/10
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              jd.isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {jd.isActive ? '● Active' : '○ Disabled'}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {jd.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                            <div>
                              <span className="text-slate-500">Trigger:</span> {jd.triggerCondition}
                            </div>
                            <div>
                              <span className="text-slate-500">Interval:</span> {jd.executionInterval}
                            </div>
                            {jd.searchQueryTemplate && (
                              <div className="sm:col-span-2">
                                <span className="text-slate-500">Query Pattern:</span>{' '}
                                <span className="text-cyan-400">{jd.searchQueryTemplate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditJd(jd)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Edit Agent JD"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleJd(jd.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                              jd.isActive
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {jd.isActive ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJd(jd.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
                            title="Delete Agent JD"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Search Rules & Radar */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-cyan-400" />
                      Global Search Strategy Mode
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Autopilot topic discovery aur grounding ke liye konsa mechanism istemal kare.
                    </p>
                  </div>
                  <select
                    value={config.searchStrategy || 'deep_grounding'}
                    onChange={(e) => handleUpdate({ searchStrategy: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="deep_grounding">Deep Grounding + Live Web Scan (Recommended)</option>
                    <option value="fast_scan">Fast In-Memory / Quick Synthesis</option>
                    <option value="catalog_priority">Catalog Priority (Strict 0-Tolerance)</option>
                    <option value="multi_source">Multi-Source Cross-Platform Radar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                <div>
                  <h5 className="font-bold text-white text-xs">Autonomous Search Query Rules</h5>
                  <p className="text-[11px] text-slate-300">
                    Kab kya search kare, kis frequency pe aur kin verified domains ko prioritize kare.
                  </p>
                </div>
                {!showAddSearchRule && (
                  <button
                    onClick={() => setShowAddSearchRule(true)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-cyan-950"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Search Rule</span>
                  </button>
                )}
              </div>

              {/* Add Search Rule Form */}
              {showAddSearchRule && (
                <form
                  onSubmit={handleAddSearchRule}
                  className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="font-bold text-cyan-300 text-xs">Naya Search Rule Shamil Karein</h5>
                    <button
                      type="button"
                      onClick={() => setShowAddSearchRule(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Rule Name</label>
                      <input
                        type="text"
                        value={newSrName}
                        onChange={(e) => setNewSrName(e.target.value)}
                        placeholder="e.g. Breaking AI Updates"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Target Niche or Category</label>
                      <input
                        type="text"
                        value={newSrCategory}
                        onChange={(e) => setNewSrCategory(e.target.value)}
                        placeholder="e.g. AI & Smart Technology"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Search Query Template</label>
                    <input
                      type="text"
                      value={newSrQuery}
                      onChange={(e) => setNewSrQuery(e.target.value)}
                      placeholder="e.g. latest {niche} breakthrough features and secrets 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Search Engine</label>
                      <select
                        value={newSrEngine}
                        onChange={(e) => setNewSrEngine(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="google_grounding">Google Grounding API</option>
                        <option value="fast_internal">Fast Internal Bank</option>
                        <option value="custom_web">Custom Web Crawler</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Frequency</label>
                      <select
                        value={newSrFrequency}
                        onChange={(e) => setNewSrFrequency(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="continuous">Continuous (Every Cadence)</option>
                        <option value="queue_depleted">On Low Queue (&lt;3 stories)</option>
                        <option value="hourly">Hourly Interval</option>
                        <option value="daily_scheduled">Daily Scheduled Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Priority Domains (comma-separated)</label>
                      <input
                        type="text"
                        value={newSrDomains}
                        onChange={(e) => setNewSrDomains(e.target.value)}
                        placeholder="blog.google, microsoft.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddSearchRule(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Search Rules List */}
              <div className="space-y-3">
                {(config.searchRules || DEFAULT_SEARCH_RULES).map((sr) => (
                  <div
                    key={sr.id}
                    className={`p-4 rounded-xl border transition-all ${
                      sr.isActive
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    {editingSrId === sr.id ? (
                      /* Inline Search Rule Editor */
                      <div className="space-y-3 bg-slate-900/90 p-3 rounded-lg border border-cyan-500/50">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Search Rule: {sr.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingSrId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Rule Name</label>
                            <input
                              type="text"
                              value={editSrName}
                              onChange={(e) => setEditSrName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Target Niche or Category</label>
                            <input
                              type="text"
                              value={editSrCategory}
                              onChange={(e) => setEditSrCategory(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Search Query Pattern</label>
                          <input
                            type="text"
                            value={editSrQuery}
                            onChange={(e) => setEditSrQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-400 font-mono text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Search Engine</label>
                            <select
                              value={editSrEngine}
                              onChange={(e) => setEditSrEngine(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
                            >
                              <option value="google_grounding">Google Grounding API</option>
                              <option value="fast_internal">Fast Internal Bank</option>
                              <option value="custom_web">Custom Web Crawler</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Frequency</label>
                            <select
                              value={editSrFrequency}
                              onChange={(e) => setEditSrFrequency(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400"
                            >
                              <option value="continuous">Continuous (Every Cycle)</option>
                              <option value="hourly">Hourly Rotation</option>
                              <option value="daily_scheduled">Daily Scheduled (6:00 AM PKT)</option>
                              <option value="queue_depleted">Only When Queue Depleted (&lt; 3)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Priority Domains</label>
                            <input
                              type="text"
                              value={editSrDomains}
                              onChange={(e) => setEditSrDomains(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingSrId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditSr(sr.id)}
                            className="px-4 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Rule Changes</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{sr.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {sr.targetNicheOrCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                              {sr.searchEngine}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                              {sr.frequency}
                            </span>
                          </div>
                          <p className="text-cyan-300 font-mono text-[11px]">
                            Query: "{sr.queryTemplate}"
                          </p>
                          <p className="text-slate-400 text-[10px] font-mono">
                            Domains: {sr.domainsPriority.join(', ')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditSr(sr)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Edit Search Rule"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSearchRule(sr.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                              sr.isActive
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {sr.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSearchRule(sr.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Autonomous Triggers & Cadence */}
          {activeTab === 'triggers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cadence Timer */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">Daemon Cadence Cycle</label>
                    <span className="text-cyan-400 font-mono font-bold">{config.cadenceSeconds}s</span>
                  </div>
                  <select
                    value={config.cadenceSeconds}
                    onChange={(e) => handleUpdate({ cadenceSeconds: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={15}>15 Seconds (Rapid Testing)</option>
                    <option value={30}>30 Seconds (Recommended Production)</option>
                    <option value={60}>60 Seconds (Balanced Hourly Loop)</option>
                    <option value={120}>2 Minutes (Conservative)</option>
                    <option value={300}>5 Minutes (Idle Watcher)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Har cycle par Autopilot pending queue, radar signals aur scheduled timeslots check karta hai.
                  </p>
                </div>

                {/* Automation Mode */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <label className="font-bold text-white text-xs block">Automation Mode</label>
                  <select
                    value={config.automationMode}
                    onChange={(e) => handleUpdate({ automationMode: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="supervised">Supervised (Human approval required before auto-post)</option>
                    <option value="autonomous">Fully Autonomous (Auto-approve & queue pipeline)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Supervised mode mein stories pending status mein rehti hain taake aap unhe review kar sakein.
                  </p>
                </div>

                {/* Low Inventory Threshold */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">Replenish Trigger Threshold</label>
                    <span className="text-amber-400 font-mono font-bold">&lt; {config.lowInventoryThreshold || 3} stories</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={config.lowInventoryThreshold || 3}
                    onChange={(e) => handleUpdate({ lowInventoryThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Jab pending stories is number se kam ho jayein to Autopilot automatically agla category topic generate karega.
                  </p>
                </div>

                {/* Critical Sprint Threshold */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white text-xs">Critical Sprint Trigger (3-Day)</label>
                    <span className="text-rose-400 font-mono font-bold">&lt;= {config.criticalSprintThreshold ?? 1} stories</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={config.criticalSprintThreshold ?? 1}
                    onChange={(e) => handleUpdate({ criticalSprintThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Agar queue is threshold par gir jaye to 3-day multi-category autonomous sprint trigger ho jayega.
                  </p>
                </div>

                {/* Sprint Duration */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <label className="font-bold text-white text-xs block">Sprint Duration Days</label>
                  <select
                    value={config.sprintDurationDays || 3}
                    onChange={(e) => handleUpdate({ sprintDurationDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={1}>1 Day (Single Sprint)</option>
                    <option value={3}>3 Days (Standard Autonomous Sprint)</option>
                    <option value={5}>5 Days (Weekly Reserve)</option>
                    <option value={7}>7 Days (Full Week Buffer)</option>
                  </select>
                </div>

                {/* Auto Post Timeslot */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <label className="font-bold text-white text-xs block">Prime Loop Auto-Post Slot</label>
                  <input
                    type="text"
                    value={config.autoPostTimeSlot}
                    onChange={(e) => handleUpdate({ autoPostTimeSlot: e.target.value })}
                    placeholder="6:00 PM PKT (Prime Loop)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Custom Algorithmic Trigger Rules */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <label className="font-bold text-white text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Custom Autopilot Algorithmic Trigger Rules (Rules Engine)
                </label>
                <textarea
                  value={config.customTriggerRules || ''}
                  onChange={(e) => handleUpdate({ customTriggerRules: e.target.value })}
                  placeholder="Define custom logic statements..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[10px] text-slate-400">
                  Yeh instructions Autopilot Decision Engine ko guide karti hain ke kis condition pe kya prioritisation apply karni hai.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Strict Duplicate Defense</span>
                    <span className="text-[10px] text-slate-400">Catalog videos se collision roke</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.strictDuplicateDefense}
                    onChange={(e) => handleUpdate({ strictDuplicateDefense: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </label>

                <label className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Auto-Sync to Studios</span>
                    <span className="text-[10px] text-slate-400">Calendar & Thumbnail Studio update</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoSyncCalendar}
                    onChange={(e) => handleUpdate({ autoSyncCalendar: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Channel Scope */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  Target Channel Execution Scope
                </h4>
                <p className="text-[11px] text-slate-400">
                  Autopilot ko specific channel ke liye chalana hai ya multi-channel network mein round-robin rotation karni hai.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Primary Target Channel</label>
                    <select
                      value={config.targetChannelId}
                      onChange={(e) => handleUpdate({ targetChannelId: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      {Object.values(channels).map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} ({ch.presenter})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Presenter Rotation</label>
                    <select
                      value={config.autoRotatePresenters ? 'yes' : 'no'}
                      onChange={(e) => handleUpdate({ autoRotatePresenters: e.target.value === 'yes' })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="yes">Auto-Rotate Character Tags per Video</option>
                      <option value="no">Lock to Active Channel Default Tag</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Channel Engine Status Cards */}
              <div className="space-y-2">
                <h5 className="font-bold text-white text-xs">Available Channels & Configured Engines</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(channels).map((ch) => {
                    const isTarget = config.targetChannelId === ch.id;
                    const eng = ch.engineConfig;
                    return (
                      <div
                        key={ch.id}
                        className={`p-3.5 rounded-xl border ${
                          isTarget
                            ? 'bg-cyan-950/30 border-cyan-500/40'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{ch.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isTarget
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isTarget ? 'Active Autopilot Target' : 'Standby'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">
                          Presenter: <strong className="text-slate-200">{ch.presenter}</strong> • Niche: <strong className="text-slate-200">{ch.niche}</strong>
                        </p>
                        <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
                          <span>Dialect: {eng?.dialectTone || 'Standard'}</span>
                          <span>Priority: {eng?.autonomousPriority || 'HIGH'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Changes are stored persistently in Autopilot Configuration Store.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer text-xs shadow-md shadow-emerald-950 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
