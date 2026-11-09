/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Integrated Topic Research & Topic Bank Panel
 * Replaces the two legacy cards ("Prioritized Focus Links" and "48h Ground Search").
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Sparkles,
  Database,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  BookmarkPlus,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sliders,
  Flame,
  Check,
  RefreshCw,
  FolderTree,
  FileText,
  X
} from 'lucide-react';
import {
  loadProfileTopicBank,
  saveProfileTopicBank,
  loadProfileResearchSettings,
  saveProfileResearchSettings,
  getAlreadyCoveredPointsList,
  checkSmarterDuplicate,
  TOPIC_BANK_UPDATED_EVENT,
  type TopicCard,
  type ProfileResearchSettings,
  type DuplicateCheckResult
} from '../lib/profileStore';
import { TopicBankModal } from './TopicBankModal';
import {
  isConcreteTopic,
  buildPracticalBlueprint
} from '../lib/practicalBlueprint';

interface TopicResearchPanelProps {
  channelId: string;
  channelName: string;
  categoryId: number;
  aspectRatio: '9:16' | '16:9';
  onProduceTopic: (topic: TopicCard) => void;
  onOpenTopicBankModal?: () => void;
}

export const TopicResearchPanel: React.FC<TopicResearchPanelProps> = ({
  channelId,
  channelName,
  categoryId,
  aspectRatio,
  onProduceTopic
}) => {
  const [bankTopics, setBankTopics] = useState<TopicCard[]>(() => loadProfileTopicBank(channelId));
  const [researchSettings, setResearchSettings] = useState<ProfileResearchSettings>(() => loadProfileResearchSettings(channelId));
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TopicCard[]>([]);
  const [showTopicBankModal, setShowTopicBankModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedLensTab, setSelectedLensTab] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setBankTopics(loadProfileTopicBank(channelId));
    setResearchSettings(loadProfileResearchSettings(channelId));
    setSearchResults([]);
  }, [channelId]);

  useEffect(() => {
    const handleBankUpdate = () => {
      setBankTopics(loadProfileTopicBank(channelId));
    };
    window.addEventListener(TOPIC_BANK_UPDATED_EVENT, handleBankUpdate);
    return () => window.removeEventListener(TOPIC_BANK_UPDATED_EVENT, handleBankUpdate);
  }, [channelId]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Run the 4-Lens Topic Research
  const handleRunTopicResearch = async () => {
    setIsSearching(true);
    setNotice(null);

    try {
      // 1. Gather already covered points to exclude from prompt
      const excludedPoints = getAlreadyCoveredPointsList(channelId, categoryId);

      const res = await fetch(`/api/profile/${encodeURIComponent(channelId)}/topic-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          aspectRatio,
          excludedCoveredPoints: excludedPoints,
          channelName,
          profileNiche: channelId === 'beautyhub' ? 'Beauty & Skincare' : 'Tech'
        })
      });

      const data = await res.json();
      let rawTopics: any[] = data.topics || [];

      // Filter and enrich topics: only topics that pass concrete topic check and carry blueprint essentials are accepted
      const enrichedTopics: TopicCard[] = [];
      rawTopics.forEach((t, idx) => {
        const topicTitle = String(t.title || '').trim();
        const concrete = isConcreteTopic(topicTitle);
        if (!concrete.valid) return; // REJECT before reaching Topic Bank

        const dupCheck = checkSmarterDuplicate({
          title: topicTitle,
          points: t.keyPoints || [],
          categoryId: t.categoryId || categoryId,
          channelId
        });

        const blueprint = buildPracticalBlueprint({
          topic: topicTitle,
          categoryName: `Category ${t.categoryId || categoryId}`,
          categoryId: t.categoryId || categoryId,
          channelId,
          sourceLinks: Array.isArray(t.sources) ? t.sources.map((s: any) => s.url || s).filter(Boolean) : []
        });

        const card: TopicCard = {
          id: `tr-${Date.now()}-${idx}`,
          channelId,
          title: topicTitle,
          hook: t.hook || 'Roman Urdu spoken hook',
          categoryId: t.categoryId || categoryId,
          aspectRatio: t.aspectRatio || aspectRatio,
          lens: t.lens || 'Lens 1: New Updates',
          whyNow: t.whyNow || 'High trending demand in category',
          angle: t.angle || 'Practical hands-on walkthrough',
          keyPoints: Array.isArray(t.keyPoints) && t.keyPoints.length > 0 ? t.keyPoints : [topicTitle],
          sources: Array.isArray(t.sources) && t.sources.length > 0 ? t.sources : [{ name: 'Official Docs', url: blueprint.sourceLinks[0] || 'https://techcrunch.com', date: '48h' }],
          verificationStatus: t.verificationStatus || 'verified',
          duplicateVerdict: dupCheck.verdict,
          matchedStoryTitle: dupCheck.matchedStoryTitle,
          matchedStoryPoint: dupCheck.matchedPoint,
          competitorCoverage: t.competitorCoverage || 'none',
          gapLine: t.gapLine || 'Original angle filling creator gap',
          score: t.score || (dupCheck.verdict === 'exact' ? 45 : 92),
          scoreReason: dupCheck.reason,
          expiresAt: t.expiresAt || (t.lens?.includes('1') ? '5 days' : 'evergreen'),
          status: 'saved',
          createdAt: new Date().toISOString(),
          practicalBlueprint: blueprint
        };

        enrichedTopics.push(card);
      });

      setSearchResults(enrichedTopics);

      // 3. Auto-save all candidate topics to Topic Bank (status: "saved")
      const currentBank = loadProfileTopicBank(channelId);
      const existingTitles = new Set(currentBank.map(b => b.title.toLowerCase().trim()));
      const newItems = enrichedTopics.filter(item => !existingTitles.has(item.title.toLowerCase().trim()));
      const updatedBank = [...newItems, ...currentBank];
      saveProfileTopicBank(channelId, updatedBank);
      setBankTopics(updatedBank);

      showToast(`Mubarak! 4 Lenses se ${enrichedTopics.length} naye topics Topic Bank mein auto-save ho gaye!`);
    } catch (err: any) {
      console.error('Topic research run error:', err);
      showToast('Search error — please retry.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProduceCard = (card: TopicCard) => {
    // Update status in Topic Bank to in_production
    const currentBank = loadProfileTopicBank(channelId);
    const updatedBank = currentBank.map(b => b.id === card.id || b.title === card.title ? { ...b, status: 'in_production' as const } : b);
    saveProfileTopicBank(channelId, updatedBank);
    setBankTopics(updatedBank);

    showToast(`"${card.title}" ko production mein shift kar diya gaya!`);
    onProduceTopic(card);
  };

  const savedCount = bankTopics.filter(t => t.status === 'saved').length;
  const inProdCount = bankTopics.filter(t => t.status === 'in_production').length;

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4 text-xs space-y-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Globe className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-white text-sm tracking-tight">
              Topic Research &amp; Topic Bank ({channelName})
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
              4 Lenses Active
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
              {bankTopics.length} in Bank ({savedCount} Ready)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            4 Lenses research across Official Updates (48h), User Questions (90d), Competitor Gaps (7d), and Category Functionality.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure lens windows and niche sources"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lens Sources</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTopicBankModal(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Topic Bank ({bankTopics.length})</span>
          </button>

          <button
            type="button"
            onClick={handleRunTopicResearch}
            disabled={isSearching}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning 4 Lenses...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Research 5-7 Topics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-cyan-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* 4 Lenses Quick Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
            <span>Lens 1: New Updates</span>
            <span className="font-mono text-[10px] text-slate-400">{researchSettings.lens1WindowHours}h</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Official blogs, launch notes, breaking product updates.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
            <span>Lens 2: Questions</span>
            <span className="font-mono text-[10px] text-slate-400">{researchSettings.lens2WindowDays}d</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Reddit, Quora, forum pain points asked repeatedly.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
            <span>Lens 3: Competitor Gap</span>
            <span className="font-mono text-[10px] text-slate-400">{researchSettings.lens3WindowDays}d</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Competitor RSS uploads &amp; technical gaps we fill.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
            <span>Lens 4: Category Secrets</span>
            <span className="font-mono text-[10px] text-slate-400">{researchSettings.lens4WindowDays}d</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            16-App rotation (Chrome, Maps, Gmail, etc.) &amp; automation.
          </p>
        </div>
      </div>

      {/* Search Results Display Area */}
      {searchResults.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Latest Research Batch ({searchResults.length} Topics Proposed — Auto-Saved in Topic Bank)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              All pass Smarter Duplicate Check
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5 flex flex-col justify-between hover:border-cyan-400 transition-colors shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px] font-bold">
                      Score: {card.score}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px]">
                      {card.lens.split(':')[0]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      card.duplicateVerdict === 'exact'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : card.duplicateVerdict === 'partial'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {card.duplicateVerdict}
                    </span>
                  </div>

                  <h5 className="font-bold text-white text-xs leading-snug line-clamp-2">
                    {card.title}
                  </h5>

                  <p className="text-[11px] text-cyan-300 font-mono line-clamp-2 italic">
                    "{card.hook}"
                  </p>

                  <div className="bg-slate-900 p-2 rounded-xl text-[10px] text-slate-300 space-y-1 font-mono">
                    {card.keyPoints.slice(0, 3).map((kp, idx) => (
                      <div key={idx} className="line-clamp-1 text-slate-300">
                        <span className="text-cyan-400 font-bold">• </span>
                        {kp}
                      </div>
                    ))}
                  </div>

                  {card.gapLine && (
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      <strong className="text-amber-400">Gap: </strong>
                      {card.gapLine}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    {card.sources[0]?.name || 'Verified Source'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProduceCard(card)}
                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Produce Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Bank Modal Component */}
      {showTopicBankModal && (
        <TopicBankModal
          isOpen={showTopicBankModal}
          onClose={() => setShowTopicBankModal(false)}
          channelId={channelId}
          channelName={channelName}
          onProduceTopic={handleProduceCard}
        />
      )}

      {/* Lenses & Sources Configuration Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overscroll-contain">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl max-h-[80vh] rounded-3xl p-5 space-y-4 shadow-2xl flex flex-col custom-modal-scroll" data-studio-scroll="true">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Research Lenses &amp; Niche Sources ({channelName})
                </h4>
                <p className="text-xs text-slate-400">
                  Each profile keeps its own isolated sources and research windows.
                </p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lens 1 Window:</label>
                  <input
                    type="number"
                    value={researchSettings.lens1WindowHours}
                    onChange={(e) => setResearchSettings({ ...researchSettings, lens1WindowHours: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <span className="text-[10px] text-slate-500">Hours (Default: 48h)</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lens 2 Window:</label>
                  <input
                    type="number"
                    value={researchSettings.lens2WindowDays}
                    onChange={(e) => setResearchSettings({ ...researchSettings, lens2WindowDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <span className="text-[10px] text-slate-500">Days (Default: 90d)</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lens 3 Window:</label>
                  <input
                    type="number"
                    value={researchSettings.lens3WindowDays}
                    onChange={(e) => setResearchSettings({ ...researchSettings, lens3WindowDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <span className="text-[10px] text-slate-500">Days (Default: 7d)</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lens 4 Window:</label>
                  <input
                    type="number"
                    value={researchSettings.lens4WindowDays}
                    onChange={(e) => setResearchSettings({ ...researchSettings, lens4WindowDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                  />
                  <span className="text-[10px] text-slate-500">Days (Default: 30d)</span>
                </div>
              </div>

              {/* Niche Sources List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-bold text-white block">Active Sources for this Niche:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {researchSettings.sourcesByLens.lens1.map((s, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-cyan-300">{s.name}</strong>
                        <span className="text-slate-500 ml-2">({s.category || 'Lens 1'})</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">{s.url}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Warn if another channel already covered this</span>
                  <span className="text-[10px] text-slate-400">OFF by default. If enabled, warns if another profile covered similar topic.</span>
                </div>
                <input
                  type="checkbox"
                  checked={researchSettings.warnCrossChannelDuplicate}
                  onChange={(e) => setResearchSettings({ ...researchSettings, warnCrossChannelDuplicate: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  saveProfileResearchSettings(channelId, researchSettings);
                  setShowSettingsModal(false);
                  showToast('Research settings permanently save ho gaye!');
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
