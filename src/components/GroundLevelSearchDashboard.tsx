import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Filter,
  Save,
  RotateCcw,
  Zap,
  Radio,
  FileText,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface GroundSourceItem {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: string;
  priority: 'high' | 'medium' | 'normal';
  enabled: boolean;
  notes?: string;
}

export interface GroundSearchCriteria {
  timeWindowHours: number;
  minGroundSources: number;
  lastUpdated?: string;
  updatedBy?: string;
  customKeywords: string[];
  negativeFilters: string[];
  sources: GroundSourceItem[];
}

export const DEFAULT_GROUND_SOURCES: GroundSourceItem[] = [
  {
    id: 'src-techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    domain: 'techcrunch.com',
    category: 'AI News & Startup Launches',
    priority: 'high',
    enabled: true,
    notes: 'Daily AI breakthroughs, startup launches, and tool announcements.'
  },
  {
    id: 'src-theverge-ai',
    name: 'The Verge AI',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    domain: 'theverge.com',
    category: 'Consumer Tech & Big AI',
    priority: 'high',
    enabled: true,
    notes: 'Hands-on analysis of major tech and generative AI releases within 24-48 hours.'
  },
  {
    id: 'src-hackernews',
    name: 'Hacker News Trending',
    url: 'https://news.ycombinator.com/',
    domain: 'news.ycombinator.com',
    category: 'Developer Community & Show HN',
    priority: 'high',
    enabled: true,
    notes: 'Fastest ground-level indicators of developer-loved open-source projects.'
  },
  {
    id: 'src-github-trending',
    name: 'GitHub Trending AI Repos',
    url: 'https://github.com/trending',
    domain: 'github.com',
    category: 'Open-Source Code & Models',
    priority: 'high',
    enabled: true,
    notes: 'Daily code releases, autonomous agent frameworks, and self-hosted AI models.'
  },
  {
    id: 'src-huggingface-papers',
    name: 'Hugging Face Daily Papers',
    url: 'https://huggingface.co/papers',
    domain: 'huggingface.co',
    category: 'AI Research Papers & Weights',
    priority: 'high',
    enabled: true,
    notes: 'Fresh scientific breakthroughs, fine-tunes, and open weight LLM releases.'
  },
  {
    id: 'src-producthunt-ai',
    name: 'Product Hunt AI',
    url: 'https://www.producthunt.com/topics/artificial-intelligence',
    domain: 'producthunt.com',
    category: 'New Product Launches',
    priority: 'medium',
    enabled: true,
    notes: 'Daily launched AI productivity apps, creator software, and extensions.'
  },
  {
    id: 'src-openai-news',
    name: 'OpenAI Official News & Research',
    url: 'https://openai.com/news/',
    domain: 'openai.com',
    category: 'Frontier Models & API Releases',
    priority: 'high',
    enabled: true,
    notes: 'Direct official announcements for GPT models, Sora, and developer tools.'
  },
  {
    id: 'src-google-ai-blog',
    name: 'Google DeepMind & AI Studio Blog',
    url: 'https://blog.google/technology/ai/',
    domain: 'blog.google',
    category: 'Google AI & Gemini Releases',
    priority: 'high',
    enabled: true,
    notes: 'First-party updates on Gemini models, Google AI Studio, and research.'
  },
  {
    id: 'src-venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/',
    domain: 'venturebeat.com',
    category: 'Enterprise AI & Models',
    priority: 'medium',
    enabled: true,
    notes: 'Detailed reporting on AI infrastructure, model benchmarks, and enterprise tech.'
  },
  {
    id: 'src-arstechnica-it',
    name: 'Ars Technica Tech & AI',
    url: 'https://arstechnica.com/information-technology/',
    domain: 'arstechnica.com',
    category: 'Deep Tech & Computing',
    priority: 'medium',
    enabled: true,
    notes: 'Deep technical journalism on computing, open source, and AI safety.'
  },
  {
    id: 'src-mit-techreview',
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
    domain: 'technologyreview.com',
    category: 'Emerging Tech Analysis',
    priority: 'medium',
    enabled: true,
    notes: 'High-credibility analysis on where AI systems and robotics are heading.'
  },
  {
    id: 'src-decrypt-ai',
    name: 'Decrypt AI & Automation',
    url: 'https://decrypt.co/news/ai',
    domain: 'decrypt.co',
    category: 'Emerging Tech & Automation',
    priority: 'normal',
    enabled: true,
    notes: 'Emerging creator workflows, agent tools, and practical automation guides.'
  }
];

interface GroundLevelSearchDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onApplyCriteria?: (criteria: GroundSearchCriteria) => void;
  isModal?: boolean;
}

export const GroundLevelSearchDashboard: React.FC<GroundLevelSearchDashboardProps> = ({
  isOpen = true,
  onClose,
  onApplyCriteria,
  isModal = true
}) => {
  const [activeTab, setActiveTab] = useState<'scenario' | 'sources' | 'criteria'>('scenario');
  const [criteria, setCriteria] = useState<GroundSearchCriteria>({
    timeWindowHours: 48,
    minGroundSources: 10,
    customKeywords: ['Google AI Studio', 'Gemini', 'Cursor AI', 'Agentic Workflows', 'Open-Source LLMs', 'Developer Automation'],
    negativeFilters: ['crypto trading', 'gossip', 'rumors'],
    sources: DEFAULT_GROUND_SOURCES
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New source form state
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('AI News & Releases');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'normal'>('high');
  const [newNotes, setNewNotes] = useState('');

  // Keyword input
  const [keywordInput, setKeywordInput] = useState('');
  const [negativeInput, setNegativeInput] = useState('');

  // Editing state for existing source
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'normal'>('high');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load criteria from backend on mount
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/agent/ground-search-criteria')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.criteria) {
          setCriteria(data.criteria);
        }
      })
      .catch((err) => console.error('Failed to load ground criteria:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveCriteria = async (updatedCriteria?: GroundSearchCriteria) => {
    const toSave = updatedCriteria || criteria;
    setIsSaving(true);
    try {
      const res = await fetch('/api/agent/ground-search-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: toSave, username: 'waqarmajeedinfo' })
      });
      const data = await res.json();
      if (data.ok) {
        setCriteria(data.criteria);
        if (onApplyCriteria) onApplyCriteria(data.criteria);
        showToast('Ground Search Criteria successfully saved & synced with GitHub!');
      } else {
        alert(data.error || 'Failed to save criteria');
      }
    } catch (err) {
      console.error('Save criteria error:', err);
      showToast('Error saving criteria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/agent/ground-search-criteria/simulate-48h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Artificial Intelligence & Developer Tools' })
      });
      const data = await res.json();
      if (data.ok) {
        setSimulationResult(data);
        showToast('48-Hour Ground Scenario scan completed successfully!');
      } else {
        alert(data.error || 'Simulation error');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      showToast('Simulation failed to connect');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newName.trim()) {
      alert('URL and Source Name are required');
      return;
    }

    let domain = '';
    try {
      const parsed = new URL(newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = newUrl.trim();
    }

    const newItem: GroundSourceItem = {
      id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
      domain,
      category: newCategory.trim() || 'General Tech',
      priority: newPriority,
      enabled: true,
      notes: newNotes.trim()
    };

    const nextSources = [newItem, ...criteria.sources];
    const nextCriteria = { ...criteria, sources: nextSources };
    setCriteria(nextCriteria);
    handleSaveCriteria(nextCriteria);

    setNewUrl('');
    setNewName('');
    setNewNotes('');
  };

  const handleToggleSource = (id: string) => {
    const nextSources = criteria.sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    const nextCriteria = { ...criteria, sources: nextSources };
    setCriteria(nextCriteria);
    handleSaveCriteria(nextCriteria);
  };

  const handleDeleteSource = (id: string) => {
    if (criteria.sources.length <= 10) {
      if (!confirm('Warning: Requirement is at least 10 ground sources. Do you still wish to remove this source?')) {
        return;
      }
    }
    const nextSources = criteria.sources.filter((s) => s.id !== id);
    const nextCriteria = { ...criteria, sources: nextSources };
    setCriteria(nextCriteria);
    handleSaveCriteria(nextCriteria);
  };

  const startEditSource = (s: GroundSourceItem) => {
    setEditingSourceId(s.id);
    setEditName(s.name);
    setEditUrl(s.url);
    setEditCategory(s.category);
    setEditPriority(s.priority);
  };

  const saveEditSource = (id: string) => {
    let domain = '';
    try {
      const parsed = new URL(editUrl.trim().startsWith('http') ? editUrl.trim() : `https://${editUrl.trim()}`);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = editUrl.trim();
    }

    const nextSources = criteria.sources.map((s) =>
      s.id === id
        ? {
            ...s,
            name: editName.trim() || s.name,
            url: editUrl.trim().startsWith('http') ? editUrl.trim() : `https://${editUrl.trim()}`,
            domain,
            category: editCategory.trim() || s.category,
            priority: editPriority
          }
        : s
    );

    const nextCriteria = { ...criteria, sources: nextSources };
    setCriteria(nextCriteria);
    setEditingSourceId(null);
    handleSaveCriteria(nextCriteria);
  };

  const handleAddKeyword = () => {
    const val = keywordInput.trim();
    if (!val || criteria.customKeywords.includes(val)) return;
    const nextKeywords = [...criteria.customKeywords, val];
    const next = { ...criteria, customKeywords: nextKeywords };
    setCriteria(next);
    setKeywordInput('');
    handleSaveCriteria(next);
  };

  const handleRemoveKeyword = (kw: string) => {
    const nextKeywords = criteria.customKeywords.filter((k) => k !== kw);
    const next = { ...criteria, customKeywords: nextKeywords };
    setCriteria(next);
    handleSaveCriteria(next);
  };

  const handleAddNegative = () => {
    const val = negativeInput.trim();
    if (!val || criteria.negativeFilters.includes(val)) return;
    const nextNeg = [...criteria.negativeFilters, val];
    const next = { ...criteria, negativeFilters: nextNeg };
    setCriteria(next);
    setNegativeInput('');
    handleSaveCriteria(next);
  };

  const handleRemoveNegative = (neg: string) => {
    const nextNeg = criteria.negativeFilters.filter((n) => n !== neg);
    const next = { ...criteria, negativeFilters: nextNeg };
    setCriteria(next);
    handleSaveCriteria(next);
  };

  const handleResetDefaults = () => {
    if (confirm('Restore default 12 high-authority ground websites and 48-hour settings?')) {
      const reset = {
        timeWindowHours: 48,
        minGroundSources: 10,
        customKeywords: ['Google AI Studio', 'Gemini', 'Cursor AI', 'Agentic Workflows', 'Open-Source LLMs', 'Developer Automation'],
        negativeFilters: ['crypto trading', 'gossip', 'rumors'],
        sources: DEFAULT_GROUND_SOURCES
      };
      setCriteria(reset);
      handleSaveCriteria(reset);
    }
  };

  const activeSourcesCount = criteria.sources.filter((s) => s.enabled).length;
  const hours = criteria.timeWindowHours || 48;
  const cutoffDate = new Date(Date.now() - hours * 3600 * 1000).toISOString().split('T')[0];

  if (isModal && !isOpen) return null;

  const content = (
    <div
      className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[80vh] flex flex-col shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100"
      style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">48-Hour Ground-Level Search Criteria &amp; Sources</h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                {activeSourcesCount} / {criteria.sources.length} Active Sites
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                {hours}h Freshness Window
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Agent story selection strictly pulls breakthroughs from the last 48 hours across a minimum of 10 ground-level tech websites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="mx-5 mt-3 p-2.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shadow-lg animate-in fade-in duration-150 shrink-0 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-Header Tabs */}
      <div className="px-5 pt-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('scenario')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'scenario'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live 48h Scenario Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sources'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ground Sources ({criteria.sources.length} Sites)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'criteria'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Search Filter &amp; Keywords</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset to 12 default sites"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveCriteria()}
            disabled={isSaving}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/40 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Criteria'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* TAB 1: LIVE 48-HOUR SCENARIO PREVIEW */}
        {activeTab === 'scenario' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Scenario Overview Banner */}
            <div className="p-4 bg-gradient-to-br from-cyan-950/50 via-slate-900 to-indigo-950/40 border border-cyan-500/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h4 className="font-bold text-white text-sm">Active 48-Hour Ground Search Scenario</h4>
                </div>
                <p className="text-xs text-cyan-200/90 leading-relaxed max-w-2xl">
                  Agent story selection query formula is locked to <strong className="text-white font-mono">{hours} hours</strong> (articles published since <strong className="text-cyan-300 font-mono">{cutoffDate}</strong>). Minimum ground level constraint is satisfied with <strong className="text-white font-mono">{activeSourcesCount} active websites</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer shrink-0 disabled:opacity-50 transition-all"
              >
                <Zap className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Scanning 10+ Ground Sites...' : '⚡ Run 48h Ground Search Simulation'}</span>
              </button>
            </div>

            {/* Target Sites Ground Coverage Matrix */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Ground Websites Verified in 48-Hour Scan Pool ({activeSourcesCount}):
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeSourcesCount >= 10 ? '✓ Minimum 10 Met' : '⚠️ Below 10 Target'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {criteria.sources.filter((s) => s.enabled).map((source) => (
                  <div
                    key={source.id}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-1.5"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-white truncate block text-[11px]">{source.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate block">{source.domain}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      source.priority === 'high' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {source.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Search Query String Dispatched to Gemini */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <span className="text-slate-400 text-[11px] font-bold block">
                Formulated Search Grounding Query (Time-Locked):
              </span>
              <div className="p-2.5 bg-slate-900 rounded-lg text-cyan-300 text-[11px] break-all leading-relaxed border border-slate-800/80 select-all">
                ({criteria.sources.filter((s) => s.enabled).slice(0, 8).map((s) => `site:${s.domain}`).join(' OR ')}) ({criteria.customKeywords.slice(0, 4).join(' OR ')}) after:{cutoffDate}
              </div>
            </div>

            {/* Simulation Results / Scenario Findings */}
            {simulationResult ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Discovered 48-Hour Ground Signals ({simulationResult.signals?.length || 0}):</span>
                  </h5>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Verified Against {simulationResult.activeSourcesCount} Ground Sites
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(simulationResult.signals || []).map((sig: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2 hover:border-cyan-400 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            {sig.source || 'Ground News'}
                          </span>
                          <span className="text-slate-400 font-mono">{sig.publishedAge || 'Last 48h'}</span>
                        </div>
                        <h6 className="font-bold text-white text-xs leading-snug">{sig.title}</h6>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{sig.breakthrough}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[10px]">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-purple-200">
                          <strong className="text-purple-300 block mb-0.5">Viral Hook Angle:</strong>
                          "{sig.shortsHook || sig.title}"
                        </div>
                        {sig.sourceUrl && (
                          <a
                            href={sig.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{sig.sourceUrl}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {simulationResult.citations && simulationResult.citations.length > 0 && (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block font-mono">
                      Grounding Citations &amp; Web Proof:
                    </span>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {simulationResult.citations.map((c: any, i: number) => (
                        <a
                          key={i}
                          href={c.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg border border-slate-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="max-w-[200px] truncate">{c.title || c.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                <Radio className="w-8 h-8 text-cyan-400/50 mx-auto animate-pulse" />
                <h5 className="font-semibold text-white text-xs">Run Live 48-Hour Scenario Test</h5>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Click the button above to run an instant ground-level scan across the active 10+ websites and see real-time topics from the last 48 hours.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GROUND SOURCES MANAGER (10+ WEBSITES) */}
        {activeTab === 'sources' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Add New Source Form */}
            <form onSubmit={handleAddSource} className="p-4 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Add New Ground Source Website to 48h Scan Pool
                </span>
                <span className="text-[11px] text-slate-400">Total: {criteria.sources.length} sites</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">Source Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. OpenAI Blog"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">Website URL *</label>
                  <input
                    type="text"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://openai.com/news/"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Frontier Models"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-medium">Priority Weight</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="normal">Normal Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes on coverage / what to extract (optional)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-md"
                >
                  + Add to 48h Scan Pool
                </button>
              </div>
            </form>

            {/* List of Configured Sources */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-slate-300 uppercase font-mono tracking-wider">
                  Configured Ground Sources ({criteria.sources.length} Total, {activeSourcesCount} Active):
                </span>
                <span className="text-slate-400 text-[11px]">
                  Toggle on/off to include or exclude from 48-hour discovery
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {criteria.sources.map((source) => {
                  const isEditing = editingSourceId === source.id;

                  return (
                    <div
                      key={source.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        source.enabled
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-white text-xs font-semibold"
                            placeholder="Source Name"
                          />
                          <input
                            type="text"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-white text-xs font-mono"
                            placeholder="URL"
                          />
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-white text-xs"
                            placeholder="Category"
                          />
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as any)}
                            className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-white text-xs"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="normal">Normal</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{source.name}</span>
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                              {source.domain}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              {source.category}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              source.priority === 'high' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {source.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{source.url}</span>
                            </a>
                            {source.notes && (
                              <span className="text-slate-500 truncate">• {source.notes}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditSource(source.id)}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSourceId(null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleSource(source.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                source.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {source.enabled ? '✓ Enabled' : 'Paused'}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditSource(source)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Edit Source"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSource(source.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Source"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEARCH FILTER & CRITERIA CUSTOMIZER */}
        {activeTab === 'criteria' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Freshness Time Window Setting */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Story Freshness Time Window (Required: 48 Hours)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Agent searches exclusively for topics, articles, and releases published within this window.
                  </p>
                </div>
                <span className="font-mono font-bold text-cyan-300 text-sm bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/40">
                  {hours} Hours Window
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { h: 24, label: '24 Hours (Breaking)', desc: 'Only today’s latest breakthroughs' },
                  { h: 48, label: '48 Hours (Standard)', desc: 'Official requirement: last 2 days scan' },
                  { h: 72, label: '72 Hours (Extended)', desc: 'Wider 3-day weekend window' },
                ].map((opt) => (
                  <button
                    key={opt.h}
                    type="button"
                    onClick={() => {
                      const next = { ...criteria, timeWindowHours: opt.h };
                      setCriteria(next);
                      handleSaveCriteria(next);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      criteria.timeWindowHours === opt.h
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Targeted Priority Focus Keywords */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-purple-400" />
                  Targeted Priority Focus Keywords ({criteria.customKeywords.length}):
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The agent ensures generated stories align with these tech focus areas:
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {criteria.customKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs rounded-lg flex items-center gap-1.5"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-purple-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="Add custom keyword (e.g. n8n automation, Local LLM)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + Add Keyword
                </button>
              </div>
            </div>

            {/* Negative / Excluded Filters */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div>
                <h4 className="font-bold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  Strictly Excluded / Negative Topics ({criteria.negativeFilters.length}):
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The agent will reject any story idea containing these topics:
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {criteria.negativeFilters.map((neg, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-lg flex items-center gap-1.5"
                  >
                    <span>{neg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNegative(neg)}
                      className="text-rose-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={negativeInput}
                  onChange={(e) => setNegativeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNegative())}
                  placeholder="Add negative topic to avoid (e.g. crypto drama)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={handleAddNegative}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + Add Negative Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Synced with GitHub: <strong className="text-white font-mono">user-data/waqarmajeedinfo/ground-search-criteria.json</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSaveCriteria()}
            disabled={isSaving}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {content}
    </div>
  );
};
