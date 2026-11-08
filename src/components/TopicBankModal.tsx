/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Topic Bank & Research Hub
 * Per-Profile Persistent Topic Storage, Smarter Duplicate Defense, and Backfill Covered Points
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  ShieldAlert,
  Database,
  Layers,
  Flame,
  Radio,
  FileText,
  BookmarkPlus,
  Check,
  Eye
} from 'lucide-react';
import {
  loadProfileTopicBank,
  saveProfileTopicBank,
  loadProfileLibrary,
  saveProfileLibrary,
  checkSmarterDuplicate,
  TOPIC_BANK_UPDATED_EVENT,
  PROFILE_LIBRARY_UPDATED_EVENT,
  type TopicCard,
  type DynamicPublishedStory,
  type DuplicateVerdictType
} from '../lib/profileStore';
import { getAllPublishedVideos } from '../lib/publishedLibraryStore';

interface TopicBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  onProduceTopic?: (topic: TopicCard) => void;
}

export const TopicBankModal: React.FC<TopicBankModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  onProduceTopic
}) => {
  const [topics, setTopics] = useState<TopicCard[]>(() => loadProfileTopicBank(channelId));
  const [library, setLibrary] = useState<DynamicPublishedStory[]>(() => loadProfileLibrary(channelId));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lensFilter, setLensFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<TopicCard | null>(null);
  const [editingTopic, setEditingTopic] = useState<TopicCard | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any[] | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Manual Add Form State
  const [newTitle, setNewTitle] = useState('');
  const [newHook, setNewHook] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(7);
  const [newAspectRatio, setNewAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [newLens, setNewLens] = useState<TopicCard['lens']>('Lens 4: Category Functionality');
  const [newKeyPointsText, setNewKeyPointsText] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  useEffect(() => {
    const handleSync = () => {
      setTopics(loadProfileTopicBank(channelId));
      setLibrary(loadProfileLibrary(channelId));
    };

    window.addEventListener(TOPIC_BANK_UPDATED_EVENT, handleSync);
    window.addEventListener(PROFILE_LIBRARY_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(TOPIC_BANK_UPDATED_EVENT, handleSync);
      window.removeEventListener(PROFILE_LIBRARY_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [channelId]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Filter topics
  const filteredTopics = topics.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchLens = lensFilter === 'all' || t.lens === lensFilter;
    const matchSearch = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keyPoints.some(kp => kp.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchLens && matchSearch;
  }).sort((a, b) => {
    // Sort by score then freshness
    return b.score - a.score;
  });

  const handleProduceNow = (topic: TopicCard) => {
    const updated = topics.map(t => t.id === topic.id ? { ...t, status: 'in_production' as const } : t);
    saveProfileTopicBank(channelId, updated);
    setTopics(updated);

    showToast(`"${topic.title}" production mein bhej diya gaya hai!`);
    if (onProduceTopic) {
      onProduceTopic(topic);
    }
    onClose();
  };

  const handleDiscard = (topicId: string) => {
    const updated = topics.map(t => t.id === topicId ? { ...t, status: 'discarded' as const } : t);
    saveProfileTopicBank(channelId, updated);
    setTopics(updated);
    showToast('Topic discard status mein chala gaya.');
  };

  const handleRecheck = (topic: TopicCard) => {
    const check = checkSmarterDuplicate({
      title: topic.title,
      points: topic.keyPoints,
      categoryId: topic.categoryId,
      channelId
    });

    const isStale = topic.expiresAt !== 'evergreen' && new Date(topic.expiresAt).getTime() < Date.now();
    const updated = topics.map(t => {
      if (t.id === topic.id) {
        return {
          ...t,
          duplicateVerdict: check.verdict,
          matchedStoryTitle: check.matchedStoryTitle,
          matchedStoryPoint: check.matchedPoint,
          status: isStale ? ('stale' as const) : t.status,
          scoreReason: `${check.reason} • Re-checked verified.`
        };
      }
      return t;
    });

    saveProfileTopicBank(channelId, updated);
    setTopics(updated);
    showToast(`Re-check complete: Verdict = ${check.verdict.toUpperCase()}`);
  };

  const handleSaveManualTopic = () => {
    if (!newTitle.trim()) {
      showToast('Title lazmi enter karein.');
      return;
    }

    const keyPoints = newKeyPointsText
      .split(/[\n,;•]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const dupCheck = checkSmarterDuplicate({
      title: newTitle,
      points: keyPoints,
      categoryId: newCategoryId,
      channelId
    });

    const newTopic: TopicCard = {
      id: `tb-manual-${Date.now()}`,
      channelId,
      title: newTitle.trim(),
      hook: newHook.trim() || 'Manual custom hook in Roman Urdu',
      categoryId: newCategoryId,
      aspectRatio: newAspectRatio,
      lens: newLens,
      whyNow: 'Manually added by channel owner',
      angle: 'Custom creator angle',
      keyPoints: keyPoints.length > 0 ? keyPoints : [newTitle.trim()],
      sources: newSourceName.trim() ? [{ name: newSourceName.trim(), url: newSourceUrl.trim() || '#', date: 'Manual Entry' }] : [],
      verificationStatus: 'verified',
      duplicateVerdict: dupCheck.verdict,
      matchedStoryTitle: dupCheck.matchedStoryTitle,
      matchedStoryPoint: dupCheck.matchedPoint,
      competitorCoverage: 'none',
      gapLine: 'Original topic created manually in Topic Bank',
      score: dupCheck.verdict === 'exact' ? 45 : 95,
      scoreReason: dupCheck.reason,
      expiresAt: 'evergreen',
      status: 'saved',
      createdAt: new Date().toISOString()
    };

    const updated = [newTopic, ...topics];
    saveProfileTopicBank(channelId, updated);
    setTopics(updated);
    setShowAddModal(false);

    // reset fields
    setNewTitle('');
    setNewHook('');
    setNewKeyPointsText('');
    setNewSourceName('');
    setNewSourceUrl('');

    showToast(`Naya Topic "${newTopic.title}" Topic Bank mein save ho gaya!`);
  };

  // Run Backfill for Existing Stories in this channel
  const handleRunBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(channelId)}/analyze-existing-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories: library })
      });
      const data = await res.json();
      if (data && data.analyzedStories) {
        setBackfillResult(data.analyzedStories);
      } else {
        showToast('Backfill server error, using client fallback.');
      }
    } catch {
      // Local client fallback
      const analyzed = library.map(s => ({
        id: s.id,
        title: s.title,
        covered_points: s.covered_points && s.covered_points.length > 0
          ? s.covered_points
          : s.points.split(/[\n,;•]+/).map(p => p.trim()).filter(Boolean),
        source: 'local_heuristic_analysis'
      }));
      setBackfillResult(analyzed);
    } finally {
      setBackfilling(false);
    }
  };

  const handleApplyBackfill = () => {
    if (!backfillResult) return;
    const map = new Map<string | number, string[]>();
    backfillResult.forEach(item => {
      map.set(item.id, item.covered_points);
    });

    const updatedLib = library.map(s => {
      const found = map.get(s.id);
      return {
        ...s,
        covered_points: found || s.covered_points || [s.points || s.title]
      };
    });

    saveProfileLibrary(channelId, updatedLib);
    setLibrary(updatedLib);
    setShowBackfillModal(false);
    setBackfillResult(null);
    showToast(`Zabardast! ${updatedLib.length} stories ke covered points permanently update ho gaye!`);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      channelId,
      channelName,
      exportedAt: new Date().toISOString(),
      topicCount: topics.length,
      topics
    }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${channelId}_topic_bank_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Topic Bank JSON file download ho gayi!');
  };

  const handleDownloadSafetyBackup = () => {
    window.open('/api/backup/download-full', '_blank');
    showToast('Safety Backup download shuru ho gaya!');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overscroll-contain animate-in fade-in duration-200">
      <div
        className="bg-slate-950 border border-slate-800 w-full max-w-6xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col custom-modal-scroll"
        data-studio-scroll="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-400 rounded-2xl border border-cyan-500/40 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {channelName} — Topic Bank &amp; Research Repository
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold">
                  {topics.length} Topics Saved
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold">
                  {library.length} Stories in Library
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved topics survive runs &amp; reloads. Pick "Produce Now" to activate, while remaining topics stay safely preserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSafetyBackup}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Download full JSON safety backup before edits"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Safety Backup (JSON)</span>
            </button>

            <button
              onClick={() => setShowBackfillModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Purani stories ke covered points nikalien aur verify karein"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analyze Existing Stories</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Manual Topic</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast notice */}
        {statusNotice && (
          <div className="bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border-b border-cyan-500/50 px-4 py-2 text-xs text-cyan-200 font-medium flex items-center justify-between shrink-0 animate-in fade-in">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {statusNotice}
            </span>
            <button onClick={() => setStatusNotice(null)} className="text-cyan-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            {/* Status Tabs */}
            {(['all', 'saved', 'in_production', 'published', 'stale'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-colors cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {st === 'all' ? `All (${topics.length})` : `${st.replace('_', ' ')} (${topics.filter(t => t.status === st).length})`}
              </button>
            ))}

            {/* Lens Selector */}
            <select
              value={lensFilter}
              onChange={(e) => setLensFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 ml-1"
            >
              <option value="all">All 4 Lenses</option>
              <option value="Lens 1: New Updates">Lens 1: New Updates (48h)</option>
              <option value="Lens 2: Questions & Problems">Lens 2: Questions &amp; Problems (90d)</option>
              <option value="Lens 3: Competitor Gap">Lens 3: Competitor Gap (7d)</option>
              <option value="Lens 4: Category Functionality">Lens 4: Category Functionality (30d)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic title or points..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Export Topic Bank to JSON"
            >
              <Download className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-modal-scroll" data-studio-scroll="true">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
              <Database className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Topic Bank abhi khali hai</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Simulator mein "Trigger" dabayein ya uper "+ Add Manual Topic" par click karein taake naye topics auto-save hon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map(topic => {
                const isStale = topic.expiresAt !== 'evergreen' && (topic.status === 'stale' || (topic.expiresAt.includes('5') && topic.status === 'saved'));

                return (
                  <div
                    key={topic.id}
                    className={`rounded-2xl border p-4.5 space-y-3 transition-all flex flex-col justify-between ${
                      topic.status === 'in_production'
                        ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                        : topic.status === 'published'
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : isStale
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-mono text-[10px] font-bold">
                            Score: {topic.score}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
                            {topic.lens}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                            Cat {topic.categoryId} • {topic.aspectRatio}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isStale && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                              Stale — Re-check
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            topic.duplicateVerdict === 'exact'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : topic.duplicateVerdict === 'partial'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {topic.duplicateVerdict}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            topic.status === 'in_production'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : topic.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {topic.status}
                          </span>
                        </div>
                      </div>

                      {/* Title & Hook */}
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-cyan-300/90 font-mono mt-1 line-clamp-2">
                          "{topic.hook}"
                        </p>
                      </div>

                      {/* Key Points */}
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Points to Cover:</span>
                        {topic.keyPoints.map((kp, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-cyan-400 font-bold shrink-0">•</span>
                            <span className="leading-tight">{kp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Competitor Gap & Sources */}
                      <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                        {topic.gapLine && (
                          <div className="flex items-start gap-1 text-slate-300">
                            <strong className="text-amber-400 font-medium shrink-0">Gap We Fill:</strong>
                            <span className="line-clamp-2">{topic.gapLine}</span>
                          </div>
                        )}
                        {topic.sources.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-slate-500">Sources:</span>
                            {topic.sources.map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                {s.name} ({s.date || 'verified'})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRecheck(topic)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                          title="Re-verify duplicate check and freshness"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDiscard(topic.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                          title="Discard topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleProduceNow(topic)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          topic.status === 'in_production'
                            ? 'bg-cyan-500 text-slate-950 font-extrabold shadow'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{topic.status === 'in_production' ? 'In Production' : 'Produce Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual Add Topic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Add Topic Manually to Bank ({channelName})
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Video Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Google Chrome Secret Flags for 2X Speed"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Spoken Roman Urdu Hook:</label>
                <input
                  type="text"
                  value={newHook}
                  onChange={(e) => setNewHook(e.target.value)}
                  placeholder="e.g. Chrome slow ho gaya hai? Sirf yeh 1 run setting enable karein..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category ID:</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-xs"
                  >
                    <option value={1}>1. AI &amp; Smart Tech</option>
                    <option value={2}>2. AI Chatbots &amp; Workflows</option>
                    <option value={3}>3. AI Prompt Hacks</option>
                    <option value={4}>4. PC &amp; Windows Hacks</option>
                    <option value={5}>5. New Tech &amp; Launches</option>
                    <option value={6}>6. Future Tech</option>
                    <option value={7}>7. Secrets (16 Apps)</option>
                    <option value={8}>8. Income &amp; Skills</option>
                    <option value={9}>9. YT Automation</option>
                    <option value={10}>10. Custom Search</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Aspect Ratio:</label>
                  <select
                    value={newAspectRatio}
                    onChange={(e) => setNewAspectRatio(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-xs"
                  >
                    <option value="9:16">9:16 Vertical Shorts</option>
                    <option value="16:9">16:9 Widescreen Long</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Key Sub-Points / Secrets (One per line):</label>
                <textarea
                  rows={3}
                  value={newKeyPointsText}
                  onChange={(e) => setNewKeyPointsText(e.target.value)}
                  placeholder="Point 1: Where to find setting&#10;Point 2: Step-by-step activation&#10;Point 3: Before/After result"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Source Name (Optional):</label>
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="e.g. Official Google Blog"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Source URL (Optional):</label>
                  <input
                    type="text"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualTopic}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Save Topic to Bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backfill Analysis Modal */}
      {showBackfillModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col custom-modal-scroll" data-studio-scroll="true">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Analyze Existing Stories (Backfill Covered Points)
                </h4>
                <p className="text-xs text-slate-400">
                  {channelName} ki {library.length} stories ke specific tricks aur secrets auto-extract kar ke duplicate check ke liye lock karein.
                </p>
              </div>
              <button onClick={() => setShowBackfillModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!backfillResult ? (
              <div className="space-y-4 py-4 text-xs text-slate-300">
                <p>
                  Yeh process library ki har story ko scan karta hai aur uske sub-points ("covered_points") nikal kar list banata hai. Iske baad Smarter Duplicate Check title ke bajaye inhi sub-points par chalega.
                </p>
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-300">Waqar Majeed Safety Guarantee:</span>
                  <p className="text-slate-400 text-[11px]">
                    Aap ki koi purani story delete ya overwrite nahi hogi. Result pehle aapko review ke liye dikhaya jayega.
                  </p>
                </div>
                <button
                  onClick={handleRunBackfill}
                  disabled={backfilling}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {backfilling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Stories Analyze Ho Rahi Hain...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Analyzing {library.length} Stories</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto custom-modal-scroll" data-studio-scroll="true">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">
                    ✓ {backfillResult.length} Stories Analyzed! Niche review karein:
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    User custom edits are strictly preserved.
                  </span>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {backfillResult.slice(0, 30).map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">#{item.id} {item.title}</strong>
                        <span className="text-[10px] text-cyan-400 font-mono">{item.source}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 font-mono">
                        {(item.covered_points || []).map((cp: string, cIdx: number) => (
                          <div key={cIdx} className="text-cyan-200/90">• {cp}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {backfillResult.length > 30 && (
                    <div className="text-center text-xs text-slate-500 py-1">
                      + {backfillResult.length - 30} more stories covered
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => { setBackfillResult(null); setShowBackfillModal(false); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyBackfill}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve &amp; Save Covered Points to Library</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
