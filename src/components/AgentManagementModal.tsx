import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Terminal,
  X,
  Plus,
  Play,
  Pause,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Radio,
  ShieldCheck,
  Code2,
} from 'lucide-react';

export interface AgentFunctionRecord {
  id: string;
  actionKey: string;
  name: string;
  category: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  schedule: string;
  triggerType: string;
  enabled: boolean;
  status: 'active' | 'paused' | 'error';
  instructions: string;
  payloadTemplate: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  lastRunAt: string | null;
  lastDurationMs: number | null;
  lastStatusCode: number | null;
  lastResult: string | null;
  isSystemCore: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecutionLog {
  id: string;
  functionId: string;
  functionName: string;
  actionKey: string;
  method: string;
  endpoint: string;
  status: 'success' | 'error';
  statusCode: number;
  durationMs: number;
  timestamp: string;
  summary: string;
}

interface RegistrySummary {
  total: number;
  active: number;
  paused: number;
  errors: number;
  totalRuns: number;
  successRate: number;
}

interface AgentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: 'admin' | 'standard';
}

type ActiveTab = 'functions' | 'monitor' | 'add';

const CATEGORIES = [
  'All Categories',
  'Analytics & Sync',
  'Autopilot Engine',
  'Intelligence',
  'Research',
  'Content Creation',
  'Execution',
  'Memory & Rules',
  'Voice & Script',
  'Channel Sync',
  'Diagnostics',
  'Custom Action',
];

const METHODS: Array<'GET' | 'POST' | 'PUT' | 'DELETE'> = ['GET', 'POST', 'PUT', 'DELETE'];

function formatUptime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m ${sec % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const AgentManagementModal: React.FC<AgentManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('functions');
  const [functions, setFunctions] = useState<AgentFunctionRecord[]>([]);
  const [executionLogs, setExecutionLogs] = useState<AgentExecutionLog[]>([]);
  const [summary, setSummary] = useState<RegistrySummary>({
    total: 0,
    active: 0,
    paused: 0,
    errors: 0,
    totalRuns: 0,
    successRate: 100,
  });
  const [serverUptimeSec, setServerUptimeSec] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Auto-monitor
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'error'>('all');
  const [liveMonitor, setLiveMonitor] = useState(false);

  // Row state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [runningIds, setRunningIds] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Edit form state
  const [editDraft, setEditDraft] = useState<{
    name: string;
    actionKey: string;
    category: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    schedule: string;
    triggerType: string;
    description: string;
    instructions: string;
    payloadTemplate: string;
    enabled: boolean;
  } | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '',
    actionKey: '',
    category: 'Custom Action',
    endpoint: '/api/autopilot/execute-action',
    method: 'POST' as 'GET' | 'POST' | 'PUT' | 'DELETE',
    schedule: 'On Demand',
    triggerType: 'Manual / API',
    description: '',
    instructions: '',
    payloadTemplate: '{\n  "action": "CUSTOM_TASK"\n}',
    enabled: true,
  });
  const [creating, setCreating] = useState(false);

  const showNotice = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const fetchRegistry = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/agent/registry');
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setFunctions(Array.isArray(data.functions) ? data.functions : []);
      setExecutionLogs(Array.isArray(data.executionLogs) ? data.executionLogs : []);
      if (data.summary) setSummary(data.summary);
      setServerUptimeSec(Number(data.serverUptimeSec || 0));
      setLastUpdated(data.lastUpdated || '');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load back-end agent registry.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRegistry();
    }
  }, [isOpen, fetchRegistry]);

  useEffect(() => {
    if (!isOpen || !liveMonitor) return;
    const timer = setInterval(() => {
      fetchRegistry(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [isOpen, liveMonitor, fetchRegistry]);

  const filteredFunctions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return functions.filter((fn) => {
      if (categoryFilter !== 'All Categories' && fn.category !== categoryFilter) return false;
      if (statusFilter === 'active' && (!fn.enabled || fn.status !== 'active')) return false;
      if (statusFilter === 'paused' && fn.enabled && fn.status !== 'paused') return false;
      if (statusFilter === 'error' && fn.status !== 'error') return false;
      if (!q) return true;
      return (
        fn.name.toLowerCase().includes(q) ||
        fn.actionKey.toLowerCase().includes(q) ||
        fn.endpoint.toLowerCase().includes(q) ||
        fn.category.toLowerCase().includes(q) ||
        fn.description.toLowerCase().includes(q)
      );
    });
  }, [functions, searchQuery, categoryFilter, statusFilter]);

  const handleToggleEnable = async (fn: AgentFunctionRecord) => {
    setSavingId(fn.id);
    try {
      const nextEnabled = !fn.enabled;
      const res = await fetch(`/api/agent/registry/${encodeURIComponent(fn.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: nextEnabled,
          status: nextEnabled ? 'active' : 'paused',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Update failed');
      await fetchRegistry(true);
      showNotice('success', `${fn.name} is now ${nextEnabled ? 'Active' : 'Paused'}.`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to toggle function status.');
    } finally {
      setSavingId(null);
    }
  };

  const handleExecuteNow = async (fn: AgentFunctionRecord) => {
    if (!fn.enabled) {
      showNotice('error', `"${fn.name}" is paused. Enable it before executing.`);
      return;
    }
    setRunningIds((prev) => ({ ...prev, [fn.id]: true }));
    try {
      const res = await fetch(`/api/agent/registry/${encodeURIComponent(fn.id)}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Execution failed');
      await fetchRegistry(true);
      const log: AgentExecutionLog | undefined = data.log;
      if (data.executed) {
        showNotice(
          'success',
          `${fn.name} executed (${log?.statusCode ?? 200} · ${log?.durationMs ?? 0}ms)`
        );
      } else {
        showNotice(
          'error',
          `${fn.name} returned HTTP ${log?.statusCode ?? 500}: ${log?.summary || 'Error'}`
        );
      }
      setExpandedId(fn.id);
    } catch (err: any) {
      showNotice('error', err?.message || 'Execution error');
    } finally {
      setRunningIds((prev) => ({ ...prev, [fn.id]: false }));
    }
  };

  const startEditing = (fn: AgentFunctionRecord) => {
    setEditingId(fn.id);
    setExpandedId(fn.id);
    setDeleteConfirmId(null);
    setEditDraft({
      name: fn.name,
      actionKey: fn.actionKey,
      category: fn.category,
      endpoint: fn.endpoint,
      method: fn.method,
      schedule: fn.schedule,
      triggerType: fn.triggerType,
      description: fn.description,
      instructions: fn.instructions,
      payloadTemplate: fn.payloadTemplate || '{}',
      enabled: fn.enabled,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editDraft) return;
    if (!editDraft.name.trim() || !editDraft.endpoint.trim()) {
      showNotice('error', 'Function Name and Endpoint are required.');
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`/api/agent/registry/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editDraft,
          status: editDraft.enabled ? 'active' : 'paused',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save changes');
      setEditingId(null);
      setEditDraft(null);
      await fetchRegistry(true);
      showNotice('success', `Saved changes to "${editDraft.name}".`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Could not save modifications.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteFunction = async (fn: AgentFunctionRecord) => {
    setSavingId(fn.id);
    try {
      const res = await fetch(`/api/agent/registry/${encodeURIComponent(fn.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Delete failed');
      setDeleteConfirmId(null);
      if (editingId === fn.id) cancelEditing();
      if (expandedId === fn.id) setExpandedId(null);
      await fetchRegistry(true);
      showNotice('success', `Deleted "${fn.name}" from back-end agent registry.`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Delete failed.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddFunction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      showNotice('error', 'Please provide a Function / Action Name.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/agent/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          name: addForm.name.trim(),
          actionKey:
            addForm.actionKey.trim() ||
            addForm.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          endpoint: addForm.endpoint.trim() || '/api/autopilot/execute-action',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to create function');
      await fetchRegistry(true);
      setAddForm({
        name: '',
        actionKey: '',
        category: 'Custom Action',
        endpoint: '/api/autopilot/execute-action',
        method: 'POST',
        schedule: 'On Demand',
        triggerType: 'Manual / API',
        description: '',
        instructions: '',
        payloadTemplate: '{\n  "action": "CUSTOM_TASK"\n}',
        enabled: true,
      });
      setActiveTab('functions');
      if (data.function?.id) setExpandedId(data.function.id);
      showNotice('success', `Added "${data.function?.name || 'New Action'}" to back-end agent.`);
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to add function.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="custom-modal-scroll w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Agent Management
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  {currentUserRole === 'admin' ? 'Admin Control' : 'Operator View'} · Uptime{' '}
                  <span className="text-emerald-400 tabular-nums">{formatUptime(serverUptimeSec)}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Review, edit, monitor, run, delete, or add functions and actions for the back-end agent.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLiveMonitor((v) => !v)}
              className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                liveMonitor
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Auto-refresh registry & logs every 15 seconds"
            >
              <Radio className={`w-3.5 h-3.5 ${liveMonitor ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{liveMonitor ? 'Live Monitor ON' : 'Live Monitor'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchRegistry(false)}
              disabled={loading}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Agent Management"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-800/80 bg-slate-900/40 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
          <div className="px-4 py-2.5">
            <div className="text-[11px] font-medium text-slate-400">Total Functions</div>
            <div className="text-lg font-bold font-mono tabular-nums text-white">{summary.total}</div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[11px] font-medium text-slate-400">Active</div>
            <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">{summary.active}</div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[11px] font-medium text-slate-400">Paused / Errors</div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-400">
              {summary.paused} <span className="text-slate-600">/</span>{' '}
              <span className={summary.errors > 0 ? 'text-rose-400' : 'text-slate-400'}>{summary.errors}</span>
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="text-[11px] font-medium text-slate-400">Total Executions</div>
            <div className="text-lg font-bold font-mono tabular-nums text-cyan-400">{summary.totalRuns}</div>
          </div>
          <div className="px-4 py-2.5 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-slate-400">Success Rate</div>
            <div className="text-lg font-bold font-mono tabular-nums text-white">{summary.successRate}%</div>
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('functions')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'functions'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Functions & Actions ({functions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monitor')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'monitor'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Monitor & Logs ({executionLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Function / Action</span>
            </button>
          </div>

          {lastUpdated && (
            <div className="text-[11px] font-mono text-slate-500">
              Synced: {formatTimestamp(lastUpdated)}
            </div>
          )}
        </div>

        {/* Feedback / Error Banner */}
        {(feedback || errorMsg) && (
          <div
            className={`mx-5 mt-4 px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
              errorMsg || feedback?.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {errorMsg || feedback?.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{errorMsg || feedback?.text}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setErrorMsg(null);
              }}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'functions' && (
            <>
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by function name, action key, or endpoint..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="paused">Paused Only</option>
                  <option value="error">Errors Only</option>
                </select>
              </div>

              {loading && functions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading back-end agent registry...
                </div>
              ) : filteredFunctions.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                  <p className="text-sm font-medium text-slate-300">
                    No matching agent functions found.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('All Categories');
                      setStatusFilter('all');
                    }}
                    className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFunctions.map((fn) => {
                    const isExpanded = expandedId === fn.id;
                    const isEditing = editingId === fn.id && editDraft !== null;
                    const isRunning = Boolean(runningIds[fn.id]);
                    const isSaving = savingId === fn.id;
                    const isConfirmingDelete = deleteConfirmId === fn.id;

                    const statusDotColor =
                      !fn.enabled || fn.status === 'paused'
                        ? 'bg-amber-400'
                        : fn.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-emerald-400';

                    const statusLabel =
                      !fn.enabled || fn.status === 'paused'
                        ? 'Paused'
                        : fn.status === 'error'
                          ? 'Error'
                          : 'Active';

                    return (
                      <div
                        key={fn.id}
                        className={`rounded-xl border transition-colors ${
                          isEditing
                            ? 'bg-slate-900/95 border-cyan-500/50'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Row Header */}
                        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`}
                                title={statusLabel}
                              />
                              <h3 className="text-sm font-semibold text-white truncate">
                                {fn.name}
                              </h3>
                              <span className="text-[11px] font-mono text-cyan-400">
                                {fn.actionKey}
                              </span>
                              {fn.isSystemCore && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  · <ShieldCheck className="w-3 h-3 text-cyan-400" /> Core
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2">{fn.description}</p>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono">
                              <span className="text-slate-200 font-semibold">{fn.method}</span>
                              <span className="text-cyan-300">{fn.endpoint}</span>
                              <span className="text-slate-600">·</span>
                              <span className="font-sans">{fn.category}</span>
                              <span className="text-slate-600">·</span>
                              <span className="font-sans">{fn.schedule}</span>
                              <span className="text-slate-600">·</span>
                              <span className="tabular-nums">
                                {fn.runCount} runs ({fn.successCount} ok / {fn.errorCount} err)
                              </span>
                              {fn.lastDurationMs !== null && (
                                <>
                                  <span className="text-slate-600">·</span>
                                  <span className="tabular-nums text-emerald-300">
                                    {fn.lastDurationMs}ms
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Row Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            <button
                              type="button"
                              onClick={() => handleExecuteNow(fn)}
                              disabled={isRunning || !fn.enabled}
                              className="h-8 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
                              title="Run this back-end agent function now and record telemetry"
                            >
                              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
                              <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleEnable(fn)}
                              disabled={isSaving}
                              className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                                fn.enabled
                                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                              }`}
                              title={fn.enabled ? 'Pause function' : 'Enable function'}
                            >
                              {fn.enabled ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Enable</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => (isEditing ? cancelEditing() : startEditing(fn))}
                              className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                            </button>

                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/40 rounded-lg px-2 h-8">
                                <span className="text-[11px] text-rose-200 font-medium mr-1">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFunction(fn)}
                                  disabled={isSaving}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-[11px] font-semibold text-white cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(fn.id)}
                                className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                title="Delete function/action"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : fn.id)}
                              aria-label="Inspect function details"
                              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Inspector or Edit Form */}
                        {isExpanded && (
                          <div className="border-t border-slate-800/80 p-4 bg-slate-950/60 rounded-b-xl">
                            {isEditing && editDraft ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Function / Action Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editDraft.name}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, name: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Action Key
                                    </label>
                                    <input
                                      type="text"
                                      value={editDraft.actionKey}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, actionKey: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Category
                                    </label>
                                    <input
                                      type="text"
                                      value={editDraft.category}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, category: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      HTTP Method
                                    </label>
                                    <select
                                      value={editDraft.method}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          method: e.target.value as any,
                                        })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                      {METHODS.map((m) => (
                                        <option key={m} value={m}>
                                          {m}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Back-End Endpoint
                                    </label>
                                    <input
                                      type="text"
                                      value={editDraft.endpoint}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, endpoint: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Schedule / Trigger
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={editDraft.schedule}
                                        onChange={(e) =>
                                          setEditDraft({ ...editDraft, schedule: e.target.value })
                                        }
                                        placeholder="Schedule"
                                        className="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                      />
                                      <input
                                        type="text"
                                        value={editDraft.triggerType}
                                        onChange={(e) =>
                                          setEditDraft({
                                            ...editDraft,
                                            triggerType: e.target.value,
                                          })
                                        }
                                        placeholder="Trigger"
                                        className="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={editDraft.description}
                                    onChange={(e) =>
                                      setEditDraft({ ...editDraft, description: e.target.value })
                                    }
                                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                                  />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      Agent Instructions / Execution Rules
                                    </label>
                                    <textarea
                                      rows={4}
                                      value={editDraft.instructions}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, instructions: e.target.value })
                                      }
                                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                      JSON Payload Template
                                    </label>
                                    <textarea
                                      rows={4}
                                      value={editDraft.payloadTemplate}
                                      onChange={(e) =>
                                        setEditDraft({
                                          ...editDraft,
                                          payloadTemplate: e.target.value,
                                        })
                                      }
                                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editDraft.enabled}
                                      onChange={(e) =>
                                        setEditDraft({ ...editDraft, enabled: e.target.checked })
                                      }
                                      className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                                    />
                                    <span>Enabled (Active for Back-End Execution)</span>
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={cancelEditing}
                                      className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(fn.id)}
                                      disabled={isSaving}
                                      className="h-8 px-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                      Agent Directives & Instructions
                                    </span>
                                    <p className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                                      {fn.instructions || 'No custom directives configured.'}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                      <span className="text-slate-400">Trigger Type</span>
                                      <div className="text-slate-100 font-medium mt-0.5">
                                        {fn.triggerType}
                                      </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                                      <span className="text-slate-400">Last Run</span>
                                      <div className="text-slate-100 font-mono mt-0.5">
                                        {formatTimestamp(fn.lastRunAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                      Payload Template
                                    </span>
                                    <pre className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-28">
                                      {fn.payloadTemplate || '{}'}
                                    </pre>
                                  </div>

                                  <div>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                      Last Execution Output (HTTP {fn.lastStatusCode ?? '—'})
                                    </span>
                                    <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 break-words">
                                      {fn.lastResult || 'No execution output recorded yet.'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'monitor' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Execution & Health Stream
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time back-end invocation history, HTTP response codes, and latency telemetry.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  Showing {executionLogs.length} recent runs
                </span>
              </div>

              {executionLogs.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                  <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No live executions recorded yet. Click "Run Now" on any function to test and monitor it here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Function / Action</th>
                        <th className="py-2.5 px-3">Endpoint</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Latency</th>
                        <th className="py-2.5 px-3">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {executionLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/60">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-100">{log.functionName}</div>
                            <div className="font-mono text-[10px] text-cyan-400">
                              {log.actionKey}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            <span className="font-bold text-slate-100 mr-1.5">{log.method}</span>
                            {log.endpoint}
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {log.status === 'success' ? 'OK' : 'ERR'} ({log.statusCode})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-300 whitespace-nowrap">
                            {log.durationMs}ms
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={log.summary}>
                            {log.summary}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddFunction} className="space-y-4 max-w-4xl">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Register New Back-End Agent Function / Action
                </h3>
                <p className="text-xs text-slate-400">
                  Define a new action key, HTTP endpoint, schedule, and instructions for the autonomous back-end agent.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Function / Action Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Daily Viral Hook Audit"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Action Key
                  </label>
                  <input
                    type="text"
                    value={addForm.actionKey}
                    onChange={(e) => setAddForm({ ...addForm, actionKey: e.target.value })}
                    placeholder="AUTO_GENERATED_IF_EMPTY"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    HTTP Method
                  </label>
                  <select
                    value={addForm.method}
                    onChange={(e) => setAddForm({ ...addForm, method: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Back-End Endpoint
                  </label>
                  <input
                    type="text"
                    value={addForm.endpoint}
                    onChange={(e) => setAddForm({ ...addForm, endpoint: e.target.value })}
                    placeholder="/api/autopilot/execute-action"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Schedule & Trigger
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={addForm.schedule}
                      onChange={(e) => setAddForm({ ...addForm, schedule: e.target.value })}
                      placeholder="On Demand"
                      className="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      value={addForm.triggerType}
                      onChange={(e) => setAddForm({ ...addForm, triggerType: e.target.value })}
                      placeholder="Manual / API"
                      className="w-full h-9 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Describe what this back-end agent function or action performs..."
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Agent Instructions / Rules
                  </label>
                  <textarea
                    rows={4}
                    value={addForm.instructions}
                    onChange={(e) => setAddForm({ ...addForm, instructions: e.target.value })}
                    placeholder="Specific directives or constraints for the agent when running this function..."
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Default JSON Payload Template
                  </label>
                  <textarea
                    rows={4}
                    value={addForm.payloadTemplate}
                    onChange={(e) => setAddForm({ ...addForm, payloadTemplate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.enabled}
                    onChange={(e) => setAddForm({ ...addForm, enabled: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                  />
                  <span>Activate immediately after creation</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('functions')}
                    className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creating ? 'Creating...' : 'Create Agent Function'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
