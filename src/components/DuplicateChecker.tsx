/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Smarter Duplicate Defense, Covered Points, and Published Library Hub
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Search,
  Database,
  Copy,
  Check,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  Filter,
  Eye,
  X,
  Sparkles,
  Film,
  Layers,
  ArrowRight,
  Download,
  Plus,
  Edit2,
  Trash2,
  FileText,
  RefreshCw
} from 'lucide-react';
import {
  getAllPublishedVideos,
  addManualStoryToLibrary,
  updateStoryInLibrary,
  deleteStoryFromLibrary,
  LIBRARY_UPDATED_EVENT,
  type DynamicPublishedStory
} from '../lib/publishedLibraryStore';
import {
  loadProfileLibrary,
  saveProfileLibrary,
  checkSmarterDuplicate,
  extractCoveredPointsFromStoryPackage,
  type DuplicateCheckResult
} from '../lib/profileStore';
import { StoryPackageView } from './StoryPackageView';
import { loadAllChannels } from '../lib/channelStore';

export const DuplicateChecker: React.FC = () => {
  const [channels] = useState(loadAllChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>('itcafeteria');
  const [videos, setVideos] = useState<DynamicPublishedStory[]>(() => loadProfileLibrary('itcafeteria'));
  const [searchQuery, setSearchQuery] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [reviewStory, setReviewStory] = useState<DynamicPublishedStory | null>(null);
  const [editingStory, setEditingStory] = useState<DynamicPublishedStory | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillPreview, setBackfillPreview] = useState<any[] | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Form fields for Add Story
  const [addTitle, setAddTitle] = useState('');
  const [addTool, setAddTool] = useState('');
  const [addPoints, setAddPoints] = useState('');
  const [addCoveredPointsText, setAddCoveredPointsText] = useState('');
  const [addSeries, setAddSeries] = useState('');
  const [addLength, setAddLength] = useState('1:10');

  // Form fields for Edit Story
  const [editTitle, setEditTitle] = useState('');
  const [editTool, setEditTool] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [editCoveredPointsText, setEditCoveredPointsText] = useState('');
  const [editSeries, setEditSeries] = useState('');

  // Reload videos when active channel changes
  useEffect(() => {
    setVideos(loadProfileLibrary(activeChannelId));
    setSearchQuery('');
    setSeriesFilter('all');
  }, [activeChannelId]);

  useEffect(() => {
    const refreshList = () => {
      setVideos(loadProfileLibrary(activeChannelId));
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, refreshList);
    window.addEventListener('itcafeteria_story_published', refreshList);
    window.addEventListener('storage', refreshList);

    return () => {
      window.removeEventListener(LIBRARY_UPDATED_EVENT, refreshList);
      window.removeEventListener('itcafeteria_story_published', refreshList);
      window.removeEventListener('storage', refreshList);
    };
  }, [activeChannelId]);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Centralized Sequel Launcher
  const handleLaunchSequel = (target: { tool: string; title: string; series?: string }) => {
    const topicData = {
      tool: target.tool,
      title: target.title,
      series: target.series,
      isSequel: true
    };
    try {
      localStorage.setItem('itcafeteria_prefill_topic', JSON.stringify(topicData));
    } catch {}
    window.dispatchEvent(
      new CustomEvent('itcafeteria_open_simulator_for_topic', {
        detail: topicData
      })
    );
    setReviewStory(null);
  };

  // Filtered Library
  const filteredVideos = videos.filter(video => {
    const coveredText = (video.covered_points || []).join(' ');
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.points.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coveredText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeries = seriesFilter === 'all' || video.series.toLowerCase().includes(seriesFilter.toLowerCase());
    return matchesSearch && matchesSeries;
  });

  // Smarter Duplicate Check Status (Level 1 App Screen + Level 2 Deep Content Check)
  const getSmarterDuplicateStatus = (): DuplicateCheckResult | null => {
    if (!toolInput.trim() && !featureInput.trim()) return null;

    const combinedTitle = `${toolInput.trim()} ${featureInput.trim()}`.trim();
    return checkSmarterDuplicate({
      title: combinedTitle,
      rawPointsText: featureInput.trim() || toolInput.trim(),
      channelId: activeChannelId
    }, { customLibrary: videos });
  };

  const duplicateResult = getSmarterDuplicateStatus();

  // Handle Add Story
  const handleSaveNewStory = () => {
    if (!addTitle.trim()) {
      showToast('Title lazmi enter karein.');
      return;
    }

    const coveredPoints = addCoveredPointsText
      .split(/[\n,;•]+/)
      .map(s => s.trim())
      .filter(Boolean);

    addManualStoryToLibrary(activeChannelId, {
      title: addTitle.trim(),
      tool: addTool.trim() || 'Custom Tool',
      points: addPoints.trim() || 'Manual entry',
      series: addSeries.trim() || 'Shorts Series',
      length: addLength.trim() || '1:10',
      covered_points: coveredPoints.length > 0 ? coveredPoints : [addPoints.trim() || addTitle.trim()]
    });

    setVideos(loadProfileLibrary(activeChannelId));
    setShowAddStoryModal(false);

    setAddTitle('');
    setAddTool('');
    setAddPoints('');
    setAddCoveredPointsText('');
    setAddSeries('');
    showToast(`Story #${videos.length + 1} "${addTitle}" library mein add ho gayi!`);
  };

  // Handle Edit Story
  const handleOpenEdit = (story: DynamicPublishedStory) => {
    setEditingStory(story);
    setEditTitle(story.title);
    setEditTool(story.tool);
    setEditPoints(story.points);
    setEditCoveredPointsText((story.covered_points || [story.points]).join('\n'));
    setEditSeries(story.series);
  };

  const handleSaveEdit = () => {
    if (!editingStory) return;

    const covered = editCoveredPointsText
      .split(/[\n,;•]+/)
      .map(s => s.trim())
      .filter(Boolean);

    updateStoryInLibrary(activeChannelId, editingStory.id, {
      title: editTitle.trim(),
      tool: editTool.trim(),
      points: editPoints.trim(),
      series: editSeries.trim(),
      covered_points: covered.length > 0 ? covered : [editPoints.trim()]
    });

    setVideos(loadProfileLibrary(activeChannelId));
    setEditingStory(null);
    showToast(`Story #${editingStory.id} successfully updated!`);
  };

  // Handle Delete Story
  const handleDeleteStory = (storyId: number | string, storyTitle: string) => {
    if (!window.confirm(`Kya aap waqai Story #${storyId} "${storyTitle}" ko library se delete karna chahte hain?`)) {
      return;
    }
    deleteStoryFromLibrary(activeChannelId, storyId);
    setVideos(loadProfileLibrary(activeChannelId));
    showToast(`Story #${storyId} library se delete ho gayi.`);
  };

  // Handle Backfill Analysis
  const handleStartBackfill = async () => {
    setBackfilling(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(activeChannelId)}/analyze-existing-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories: videos })
      });
      const data = await res.json();
      if (data && data.analyzedStories) {
        setBackfillPreview(data.analyzedStories);
      }
    } catch {
      // Local heuristic fallback
      const analyzed = videos.map(s => ({
        id: s.id,
        title: s.title,
        covered_points: s.covered_points && s.covered_points.length > 0
          ? s.covered_points
          : s.points.split(/[\n,;•]+/).map(p => p.trim()).filter(Boolean),
        source: 'local_fallback'
      }));
      setBackfillPreview(analyzed);
    } finally {
      setBackfilling(false);
    }
  };

  const handleApplyBackfillSave = () => {
    if (!backfillPreview) return;
    const map = new Map<string | number, string[]>();
    backfillPreview.forEach(item => {
      map.set(item.id, item.covered_points);
    });

    const updated = videos.map(s => {
      const found = map.get(s.id);
      return {
        ...s,
        covered_points: found || s.covered_points || [s.points || s.title]
      };
    });

    saveProfileLibrary(activeChannelId, updated);
    setVideos(updated);
    setShowBackfillModal(false);
    setBackfillPreview(null);
    showToast(`Mubarak! ${updated.length} stories ke covered points permanently update ho gaye!`);
  };

  const activeChannelName = channels[activeChannelId]?.name || 'Active Profile';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Smarter Duplicate Defense &amp; Published Library
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-semibold">
                Profile: {activeChannelName}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Level 1 (App Screen — never blocks) + Level 2 (Deep Sub-Points vs Covered Points). Aam lafz "WhatsApp" block nahi karega; sirf specific pehle se share hua trick duplicate hoga.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Channel Selector */}
            <select
              value={activeChannelId}
              onChange={(e) => setActiveChannelId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              {Object.values(channels).map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name} ({ch.presenter})
                </option>
              ))}
            </select>

            <a
              href="/api/backup/download-full"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Safety Backup JSON of all published stories"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Safety Backup</span>
            </a>

            <button
              onClick={() => setShowBackfillModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Analyze existing stories to backfill covered points"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analyze Existing Stories</span>
            </button>

            <button
              onClick={() => setShowAddStoryModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Story</span>
            </button>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {statusNotice}
          </span>
          <button onClick={() => setStatusNotice(null)} className="text-cyan-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Live Duplicate Checker Tester (Smarter Level 1 + Level 2) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-blue-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Live Smarter Duplicate Key Tester
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Checking against {videos.length} stories in {activeChannelName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Tool / App Name (e.g. WhatsApp, Power Automate, Windows, Chrome):
            </label>
            <input
              type="text"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              placeholder="e.g. WhatsApp"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Specific Feature / Secret to Cover (e.g. voice message speed, usernames, read receipts):
            </label>
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="e.g. usernames without phone number"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
        </div>

        {/* Quick Test Preset Buttons to Prove Acceptance Tests */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 text-[11px]">Test Smarter Scenarios:</span>
          <button
            onClick={() => { setToolInput('WhatsApp'); setFeatureInput('read receipts without blue ticks'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            WhatsApp + Read receipts (Exact Duplicate → Block)
          </button>
          <button
            onClick={() => { setToolInput('WhatsApp'); setFeatureInput('voice message transcription 2026'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            WhatsApp + Voice transcription (Partial → Allow!)
          </button>
          <button
            onClick={() => { setToolInput('WhatsApp'); setFeatureInput('usernames without phone numbers'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            WhatsApp + Usernames (Partial → Allow!)
          </button>
          <button
            onClick={() => { setToolInput('CapCut'); setFeatureInput('auto caption animated styling'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            CapCut + Animated captions (New → Allow!)
          </button>
        </div>

        {/* Smarter Verdict Result Box */}
        {duplicateResult && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            duplicateResult.verdict === 'exact'
              ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
              : duplicateResult.verdict === 'partial'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                {duplicateResult.verdict === 'exact' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : duplicateResult.verdict === 'partial' ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="uppercase tracking-wider font-extrabold">
                  VERDICT: {duplicateResult.verdict.toUpperCase()} {duplicateResult.verdict === 'exact' ? '(ROK DO - BLOCKED)' : '(IJAZAT - ALLOWED)'}
                </span>
              </div>
              <span className="font-mono text-[11px]">
                Confidence: {duplicateResult.confidence}%
              </span>
            </div>

            {/* Level 1 App Screen Notice */}
            {duplicateResult.level1AppDetected && (
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>
                  <strong>LEVEL 1 (Topic Screen — Never Blocks): </strong>
                  App/Topic "{duplicateResult.level1AppDetected.toUpperCase()}" library mein {duplicateResult.level1Count} baar cover ho chuki hai. Check what was shared:
                </span>
                <span className="text-cyan-400 font-mono text-[10px]">Level 1 Passed</span>
              </div>
            )}

            {/* Level 2 Deep Content Result */}
            <p className="leading-relaxed text-xs">
              <strong>LEVEL 2 (Deep Content Decision): </strong>
              {duplicateResult.reason}
            </p>

            {/* Show Matched Story & Matched Covered Point */}
            {duplicateResult.matchedStoryTitle && (
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-400 font-semibold">Matched Library Entry:</div>
                <div className="text-white font-medium">
                  Story #{duplicateResult.matchedStoryId}: {duplicateResult.matchedStoryTitle}
                </div>
                {duplicateResult.matchedPoint && (
                  <div className="text-rose-300 font-mono">
                    Matched Covered Point: "{duplicateResult.matchedPoint}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Searchable Published Videos Library */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-semibold text-white text-base">
              Published Videos Library ({activeChannelName})
            </h3>
            <p className="text-xs text-slate-400">
              Total {filteredVideos.length} matching stories displayed (Har story ke saath uske covered points permanently indexed hain).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, tool or covered point..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Series</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Power Automate">Power Automate</option>
              <option value="Windows">PC &amp; Windows Hacks</option>
              <option value="Secrets">Secrets</option>
              <option value="AI">AI Tools</option>
            </select>
          </div>
        </div>

        {/* Video Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium w-12">#</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Tool / Topic</th>
                <th className="pb-3 font-medium">Covered Points (Duplicate Defense)</th>
                <th className="pb-3 font-medium">Series</th>
                <th className="pb-3 font-medium w-16">Length</th>
                <th className="pb-3 font-medium text-right pr-2 w-64">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVideos.map((v) => {
                const isDynamic = Boolean(v.isPlatformGenerated || v.storyPackage);
                const coveredList = v.covered_points && v.covered_points.length > 0
                  ? v.covered_points
                  : [v.points || v.title];

                return (
                  <tr key={v.id} className={`hover:bg-slate-800/40 transition-colors ${isDynamic ? 'bg-emerald-950/15' : ''}`}>
                    <td className="py-2.5 font-mono text-slate-500">{v.id}</td>
                    <td className="py-2.5 font-medium text-white max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDynamic && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
                            Live Published
                          </span>
                        )}
                        <span>{v.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-cyan-300 font-mono">{v.tool}</td>
                    <td className="py-2.5 text-slate-300 text-[11px] max-w-sm">
                      <div className="space-y-1">
                        {coveredList.slice(0, 2).map((cp, idx) => (
                          <span key={idx} className="inline-block bg-slate-800 text-cyan-200/90 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1 border border-slate-700/60">
                            • {cp}
                          </span>
                        ))}
                        {coveredList.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{coveredList.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 text-[11px]">
                        {v.series}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-cyan-400">{v.length}</td>
                    <td className="py-2.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleLaunchSequel(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-300 hover:text-white transition-all cursor-pointer"
                          title="Generate sequel in simulator"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Sequel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewStory(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="Open story with covered points"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Open</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                          title="Edit story and covered points"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStory(v.id, v.title)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
                          title="Delete story"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Story Modal */}
      {reviewStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Published Story Details
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID #{reviewStory.id} • {reviewStory.series}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base sm:text-lg mt-1 line-clamp-1">
                  {reviewStory.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setReviewStory(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-modal-scroll" data-studio-scroll="true">
              {/* Covered Points Box */}
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Covered Points (Is video mein kya share hua):
                  </span>
                  <button
                    onClick={() => {
                      const currentStory = reviewStory;
                      setReviewStory(null);
                      handleOpenEdit(currentStory);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Points</span>
                  </button>
                </div>
                <div className="space-y-1.5 pt-1">
                  {(reviewStory.covered_points || [reviewStory.points]).map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold shrink-0">•</span>
                      <span className="font-mono">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviewStory.storyPackage ? (
                <StoryPackageView
                  story={reviewStory.storyPackage}
                  publishStatus="published"
                  storyId={reviewStory.sourceRecordId}
                />
              ) : (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Tool / Topic Covered:</span>
                    <span className="text-cyan-300 font-mono font-bold text-sm">{reviewStory.tool}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold block">Full Summary Points:</span>
                    <p className="text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                      {reviewStory.points}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setReviewStory(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Story Modal */}
      {editingStory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Edit Story #{editingStory.id} ({activeChannelName})
              </h4>
              <button onClick={() => setEditingStory(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Story Title:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tool / Topic:</label>
                <input
                  type="text"
                  value={editTool}
                  onChange={(e) => setEditTool(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Covered Points (One per line — Decides Duplicate Defense):</label>
                <textarea
                  rows={4}
                  value={editCoveredPointsText}
                  onChange={(e) => setEditCoveredPointsText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Series Playlist:</label>
                <input
                  type="text"
                  value={editSeries}
                  onChange={(e) => setEditSeries(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setEditingStory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Add Story Manually to Library ({activeChannelName})
              </h4>
              <button onClick={() => setShowAddStoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Story Title:</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. WhatsApp Screen Sharing with Audio in Call"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tool / Topic:</label>
                  <input
                    type="text"
                    value={addTool}
                    onChange={(e) => setAddTool(e.target.value)}
                    placeholder="e.g. WhatsApp"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Series:</label>
                  <input
                    type="text"
                    value={addSeries}
                    onChange={(e) => setAddSeries(e.target.value)}
                    placeholder="e.g. Secrets Part 5"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Covered Points (One per line — Decides Duplicate Defense):</label>
                <textarea
                  rows={3}
                  value={addCoveredPointsText}
                  onChange={(e) => setAddCoveredPointsText(e.target.value)}
                  placeholder="Secret 1: Screen share in video call&#10;Secret 2: Share device audio with media&#10;Secret 3: Landscape mode presentation"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddStoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewStory}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Add Story to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backfill Covered Points Modal */}
      {showBackfillModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col custom-modal-scroll" data-studio-scroll="true">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Analyze Existing Stories (Backfill Covered Points)
                </h4>
                <p className="text-xs text-slate-400">
                  {activeChannelName} ki {videos.length} stories ke specific tricks auto-extract karein.
                </p>
              </div>
              <button onClick={() => setShowBackfillModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!backfillPreview ? (
              <div className="space-y-4 py-4 text-xs text-slate-300">
                <p>
                  Yeh process library ki har story ko scan karta hai aur uske sub-points ("covered_points") nikal kar list banata hai. Iske baad Smarter Duplicate Check title ke bajaye inhi sub-points par chalega.
                </p>
                <button
                  onClick={handleStartBackfill}
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
                      <span>Start Analyzing {videos.length} Stories</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto custom-modal-scroll" data-studio-scroll="true">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">
                    ✓ {backfillPreview.length} Stories Analyzed! Niche review karein:
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    User edits are preserved.
                  </span>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {backfillPreview.slice(0, 30).map((item, idx) => (
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
                  {backfillPreview.length > 30 && (
                    <div className="text-center text-xs text-slate-500 py-1">
                      + {backfillPreview.length - 30} more stories covered
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => { setBackfillPreview(null); setShowBackfillModal(false); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyBackfillSave}
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
    </div>
  );
};
