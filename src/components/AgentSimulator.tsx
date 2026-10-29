import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Play,
  AlertTriangle,
  Loader2,
  Sparkles,
  Film,
  RefreshCw,
  Sliders,
  Plus,
  Settings
} from 'lucide-react';
import { CHANNEL_PROFILES, type ChannelProfile } from '../data/channelData';
import {
  AgentFlowScreen,
  type AgentMemoryRecord,
  type AgentTriggerOutcome,
  type AgentTriggerSelection
} from './AgentFlowScreen';
import { StoryPackageView, type GeneratedStory } from './StoryPackageView';
import { loadPendingQueue, savePendingQueue, getNextTargetStory, type PendingStoryRecord } from '../lib/pendingQueueStore';
import {
  SimulatorConfigModal,
  loadSimulatorConfig,
  DEFAULT_SIMULATOR_CONFIG,
  type SimulatorConfig
} from './SimulatorConfigModal';
import { ChannelManagerModal } from './ChannelManagerModal';
import { loadAllChannels, type ExtendedChannelProfile } from '../lib/channelStore';

const LATEST_STORY_KEY = 'itcafeteria_latest_story';
const MEMORY_RECORDS_KEY = 'itcafeteria_memory_records';
const ROTATION_STATE_KEY = 'itcafeteria_agent_rotation_v1';

type SavedRotation = Partial<Record<ChannelProfile['id'], { tag: string; categoryId: number }>>;

function loadRotationState(): SavedRotation {
  try {
    const raw = localStorage.getItem(ROTATION_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as SavedRotation : {};
  } catch {
    return {};
  }
}

function saveRotationForChannel(channelId: ChannelProfile['id'], tag: string, categoryId: number) {
  try {
    const state = loadRotationState();
    state[channelId] = { tag, categoryId };
    localStorage.setItem(ROTATION_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — rotation session ke andar phir bhi chalegi.
  }
}

function resolveSavedTag(profile: ChannelProfile, tag?: string) {
  return tag && profile.tags.some((item) => item.value === tag) ? tag : profile.defaultTag;
}

function resolveSavedCategory(profile: ChannelProfile, categoryId?: number) {
  return categoryId && profile.categories.some((item) => item.id === categoryId)
    ? categoryId
    : profile.defaultCategoryId;
}

function getNextTag(profile: ChannelProfile, currentTag: string) {
  const index = profile.tags.findIndex((item) => item.value === currentTag);
  if (index === -1) return profile.tags[0]?.value ?? profile.defaultTag;
  return profile.tags[(index + 1) % profile.tags.length].value;
}

function getNextCategoryId(profile: ChannelProfile, currentCategoryId: number) {
  const rotation = profile.rotationCategoryIds.length
    ? profile.rotationCategoryIds
    : profile.categories.map((item) => item.id);
  const index = rotation.indexOf(currentCategoryId);
  if (index === -1) return rotation[0] ?? profile.defaultCategoryId;
  return rotation[(index + 1) % rotation.length];
}

function loadLatestStory(): GeneratedStory | null {
  try {
    const raw = localStorage.getItem(LATEST_STORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.scenes) && parsed.title) return parsed as GeneratedStory;
    }
  } catch {}

  // Fallback to active Pending Queue target story so new logins NEVER see an empty screen!
  const nextTarget = getNextTargetStory();
  if (nextTarget && nextTarget.storyPackage && Array.isArray(nextTarget.storyPackage.scenes) && nextTarget.storyPackage.scenes.length > 0) {
    return nextTarget.storyPackage;
  }
  return null;
}

function loadMemoryRecords(): AgentMemoryRecord[] {
  try {
    const raw = localStorage.getItem(MEMORY_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (record) => record && record.channelId && record.title && record.id
    ) as AgentMemoryRecord[];
  } catch {
    return [];
  }
}

export const AgentSimulator: React.FC = () => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const [simulatorConfig, setSimulatorConfig] = useState<SimulatorConfig>(loadSimulatorConfig);
  const [showSimulatorConfig, setShowSimulatorConfig] = useState(false);
  const [showChannelManager, setShowChannelManager] = useState(false);

  const [initialRotation] = useState<SavedRotation>(loadRotationState);
  const [draftChannel, setDraftChannel] = useState<ChannelProfile['id']>('itcafeteria');
  const [draftTag, setDraftTag] = useState<string>(() =>
    resolveSavedTag(CHANNEL_PROFILES.itcafeteria, initialRotation.itcafeteria?.tag)
  );
  const [draftCategory, setDraftCategory] = useState<number>(() =>
    resolveSavedCategory(CHANNEL_PROFILES.itcafeteria, initialRotation.itcafeteria?.categoryId)
  );
  const [draftSceneCount, setDraftSceneCount] = useState<number>(
    () => simulatorConfig.defaultSceneCount || CHANNEL_PROFILES.itcafeteria.defaultSceneCount
  );
  const [appliedSelection, setAppliedSelection] = useState<AgentTriggerSelection | null>(null);
  const [triggerOutcome, setTriggerOutcome] = useState<AgentTriggerOutcome | null>(null);
  const [memoryRecords, setMemoryRecords] = useState<AgentMemoryRecord[]>(loadMemoryRecords);
  const [latestStory, setLatestStory] = useState<GeneratedStory | null>(loadLatestStory);
  const [flowOpen, setFlowOpen] = useState(false);

  const profilesMap = CHANNEL_PROFILES as unknown as Record<string, ChannelProfile>;
  const draftProfile = (channels[draftChannel] || profilesMap[draftChannel] || CHANNEL_PROFILES.itcafeteria) as ChannelProfile;
  const draftCategoryMeta = draftProfile.categories.find((cat) => cat.id === draftCategory) ?? draftProfile.categories[0];
  const nextDraftTagValue = getNextTag(draftProfile, draftTag);
  const nextDraftTagLabel = draftProfile.tags.find((tag) => tag.value === nextDraftTagValue)?.label ?? nextDraftTagValue;
  const nextDraftCategoryId = getNextCategoryId(draftProfile, draftCategory);
  const nextDraftCategoryMeta = draftProfile.categories.find((cat) => cat.id === nextDraftCategoryId) ?? draftProfile.categories[0];
  const appliedProfile = appliedSelection
    ? ((channels[appliedSelection.channelId] || profilesMap[appliedSelection.channelId] || CHANNEL_PROFILES.itcafeteria) as ChannelProfile)
    : null;
  const appliedCategory = appliedSelection && appliedProfile
    ? appliedProfile.categories.find((cat) => cat.id === appliedSelection.categoryId) ?? appliedProfile.categories[0]
    : null;

  const pendingChanges = !appliedSelection ||
    draftChannel !== appliedSelection.channelId ||
    draftTag !== appliedSelection.tag ||
    draftCategory !== appliedSelection.categoryId ||
    draftSceneCount !== appliedSelection.sceneCount;

  const appliedNote = appliedProfile && appliedCategory
    ? appliedProfile.sampleNotes[appliedSelection!.categoryId] ?? { title: appliedCategory.name, hook: 'Reveal' }
    : null;
  const outcomeStatus = triggerOutcome?.status;
  const decisionTitle = triggerOutcome?.story?.title || triggerOutcome?.idea?.title || triggerOutcome?.title || appliedNote?.title || 'Trigger dabayein';
  const decisionHook = triggerOutcome?.story?.hook || triggerOutcome?.idea?.hook || triggerOutcome?.hook || appliedNote?.hook || 'Pending';

  useEffect(() => {
    try {
      if (latestStory) {
        localStorage.setItem(LATEST_STORY_KEY, JSON.stringify(latestStory));
      }
    } catch {
      // Storage full ya private mode — UI phir bhi chalega.
    }
  }, [latestStory]);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_RECORDS_KEY, JSON.stringify(memoryRecords.slice(-80)));
    } catch {
      // Storage unavailable — session memory still works.
    }
  }, [memoryRecords]);

  useEffect(() => {
    saveRotationForChannel(draftChannel, draftTag, draftCategory);
  }, [draftChannel, draftTag, draftCategory]);

  useEffect(() => {
    const handleConfigUpdated = (e: any) => {
      if (e.detail) {
        setSimulatorConfig(e.detail);
        if (e.detail.defaultSceneCount) {
          setDraftSceneCount(e.detail.defaultSceneCount);
        }
      } else {
        setSimulatorConfig(loadSimulatorConfig());
      }
    };
    window.addEventListener('itcafeteria_simulator_config_updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('itcafeteria_simulator_config_updated', handleConfigUpdated);
    };
  }, []);

  const handleDraftChannelChange = (channelId: string) => {
    const nextProfile = (channels[channelId] || profilesMap[channelId] || CHANNEL_PROFILES.itcafeteria) as ChannelProfile;
    const saved = loadRotationState()[channelId as ChannelProfile['id']];
    setDraftChannel(channelId);
    setDraftTag(resolveSavedTag(nextProfile, saved?.tag));
    setDraftCategory(resolveSavedCategory(nextProfile, saved?.categoryId));
    setDraftSceneCount(simulatorConfig.defaultSceneCount || nextProfile.defaultSceneCount);
  };

  const handleTrigger = () => {
    setAppliedSelection({
      channelId: draftChannel,
      tag: draftTag,
      categoryId: draftCategory,
      sceneCount: draftSceneCount
    });
    setTriggerOutcome(null);
    setFlowOpen(true);
  };

  const handleFlowOutcome = (outcome: AgentTriggerOutcome) => {
    setTriggerOutcome(outcome);
    if (outcome.status !== 'generated' || !outcome.story) return;

    const generatedStory = outcome.story;
    const outcomeProfile = (channels[outcome.selection.channelId] || profilesMap[outcome.selection.channelId] || CHANNEL_PROFILES.itcafeteria) as ChannelProfile;
    setLatestStory(generatedStory);

    // Auto-save generated story into the unified Pending Stories Queue so it's tracked in the new tab!
    try {
      const currentQueue = loadPendingQueue();
      const exists = currentQueue.some((item) => item.title.toLowerCase() === generatedStory.title.toLowerCase());
      if (!exists) {
        const newQueueItem: PendingStoryRecord = {
          id: `pq-sim-${Date.now()}`,
          title: generatedStory.title,
          hook: generatedStory.hook,
          category: generatedStory.categoryName || outcomeProfile.categories[0]?.name || 'AI & Smart Technology',
          categoryId: outcome.selection.categoryId,
          characterTag: outcome.selection.tag,
          scheduledTime: '6:00 PM PKT',
          scheduledDate: 'Next Slot',
          targetSlotReason: 'Generated via Agent Flow Simulator — waiting for review and upload.',
          status: 'pending',
          source: 'simulator',
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
          storyPackage: generatedStory
        };
        savePendingQueue([newQueueItem, ...currentQueue]);
      }
    } catch (e) {
      console.error('Error syncing Simulator story to pending queue', e);
    }

    setMemoryRecords((records) => {
      const exists = records.some((record) =>
        record.channelId === outcome.selection.channelId &&
        record.title.toLowerCase() === generatedStory.title.toLowerCase()
      );
      if (exists) return records;

      const outcomeCategory = outcomeProfile.categories.find((cat) => cat.id === outcome.selection.categoryId);
      const idea = generatedStory.idea ?? outcome.idea;
      return [...records, {
        id: `MEM-${Date.now()}`,
        channelId: outcome.selection.channelId,
        title: generatedStory.title,
        tool: idea?.title || outcome.topic?.trim() || generatedStory.title,
        points: generatedStory.discussionNotes?.trim() || idea?.points?.trim() || `Category: ${outcomeCategory?.name ?? outcomeProfile.niche}`,
        source: 'Trigger Flow Memory'
      }].slice(-80);
    });

    const nextTag = getNextTag(outcomeProfile, outcome.selection.tag);
    const nextCategoryId = getNextCategoryId(outcomeProfile, outcome.selection.categoryId);
    if (draftChannel === outcome.selection.channelId) {
      setDraftTag(nextTag);
      setDraftCategory(nextCategoryId);
    } else {
      saveRotationForChannel(outcome.selection.channelId, nextTag, nextCategoryId);
    }
  };

  const decisionTone =
    outcomeStatus === 'duplicate' || outcomeStatus === 'error'
      ? 'bg-rose-950/30 border-rose-500/30'
      : outcomeStatus === 'generated'
      ? 'bg-emerald-950/20 border-emerald-500/25'
      : outcomeStatus === 'discussion'
      ? 'bg-fuchsia-950/20 border-fuchsia-500/25'
      : outcomeStatus === 'idea-pending' || outcomeStatus === 'ideas' || outcomeStatus === 'generating' || outcomeStatus === 'checking'
      ? 'bg-amber-950/20 border-amber-500/25'
      : 'bg-blue-950/40 border-blue-500/20';

  return (
    <div className="space-y-6">
      {/* Simulation Controls Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">
                  Multi-Channel Content Agent Studio
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-mono font-semibold">
                  {simulatorConfig.baselineTag || 'Active Baseline'}
                </span>
                <button
                  onClick={() => setShowSimulatorConfig(true)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-medium shadow-sm hover:border-cyan-500/40"
                  title="Configure Agent Simulator Engine (Baseline, Dialect, Prompts, Scene Count)"
                >
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  <span>Configure Engine</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Idea → duplicate check → discussion chat → AI scene-by-scene Roman Urdu story + Google Flow scripts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
              pendingChanges
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {!appliedSelection ? 'Not triggered yet' : pendingChanges ? 'Pending changes — Trigger dabayein' : 'Selections processed'}
            </span>
            <button
              onClick={handleTrigger}
              title="Selected category ke liye AI story flow chalayein"
              className="px-4 py-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Trigger
            </button>
          </div>
        </div>

        {/* Startup Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* Channel */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 block font-medium">Active Channel (Q1)</label>
              <button
                type="button"
                onClick={() => setShowChannelManager(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30"
                title="Manage channels or add a new channel"
              >
                <Plus className="w-3 h-3" />
                <span>+ Channel</span>
              </button>
            </div>
            <select
              value={draftChannel}
              onChange={(e) => handleDraftChannelChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              {Object.values(channels).map((ch, idx) => (
                <option key={ch.id} value={ch.id}>
                  {idx + 1}. {ch.name} ({ch.presenter})
                </option>
              ))}
            </select>
          </div>

          {/* Character Tag */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-400 mb-1">
              Character Tag Variant (Q3)
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide border ${
                draftProfile.tags?.[0]?.value === 'No-Character' || draftProfile.defaultTag === 'No-Character'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {draftProfile.tags?.[0]?.value === 'No-Character' || draftProfile.defaultTag === 'No-Character'
                  ? 'FACELESS'
                  : 'AUTO'}
              </span>
            </label>
            <select
              value={draftTag}
              onChange={(e) => setDraftTag(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {draftProfile.tags.map((tag) => (
                <option key={tag.value} value={tag.value}>{tag.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-400 mb-1">
              Category & Playlist (Section 9)
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[9px] font-semibold tracking-wide">
                AUTO
              </span>
            </label>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              {draftProfile.categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.id}. {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scene Count (Configurable Presets 7-30) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 block">Duration & Scenes</label>
              <button
                type="button"
                onClick={() => setShowSimulatorConfig(true)}
                className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                title="Configure scene presets"
              >
                Config ({draftSceneCount}s)
              </button>
            </div>
            <select
              value={draftSceneCount}
              onChange={(e) => setDraftSceneCount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
            >
              {(simulatorConfig.scenePresets || [
                { id: '1', count: 7, label: '7 Scenes (70s — Minimal Threshold)' },
                { id: '2', count: 10, label: '10 Scenes (100s — Standard Short)' },
                { id: '3', count: 12, label: '12 Scenes (120s — Extended)' },
                { id: '4', count: 15, label: '15 Scenes (150s — Deep Tutorial)' },
                { id: '5', count: 20, label: '20 Scenes (200s — Masterclass)' },
                { id: '6', count: 25, label: '25 Scenes (250s — Extended Series)' },
                { id: '7', count: 30, label: '30 Scenes (300s — Max Long-form Short)' }
              ]).map((sp) => (
                <option key={sp.id || sp.count} value={sp.count}>
                  {sp.label}
                </option>
              ))}
              {/* Fallback if current draftSceneCount is a custom number not in presets */}
              {!(simulatorConfig.scenePresets || []).some((sp) => sp.count === draftSceneCount) && (
                <option value={draftSceneCount}>{draftSceneCount} Scenes ({draftSceneCount * 10}s — Custom)</option>
              )}
            </select>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
            Auto-rotate ON
          </span>
          <span className="text-slate-500">—</span>
          <span className="text-slate-400">Successful story ke baad next:</span>
          <span className="font-mono text-cyan-300">{nextDraftTagLabel}</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-300">{nextDraftCategoryMeta.id}. {nextDraftCategoryMeta.name}</span>
          <span className="text-slate-500">(manual change bhi kar sakte hain)</span>
        </div>

        {draftCategoryMeta.id === 10 && (
          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-200">
            Category 10 — Search: Trigger ke baad pehle <strong>idea prompt</strong> aayega, phir AI ke <strong>3 fresh ideas</strong>, select par <strong>discussion chat</strong>, aur aakhir mein <strong>Final Story Generate</strong>.
          </div>
        )}

        {/* Trigger Decision Note (Step 4b) */}
        <div className={`mt-4 p-3 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs ${decisionTone}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-cyan-300 font-mono">Decision Note (Step 4b):</span>
            {!appliedSelection ? (
              <span className="text-slate-300">Title: "Trigger dabayein" | Hook: Pending | Confidence: Pending</span>
            ) : outcomeStatus === 'duplicate' ? (
              <span className="text-rose-100">Title: "{decisionTitle}" | Hook: {decisionHook} | Confidence: Blocked — fresh ideas ready</span>
            ) : outcomeStatus === 'generated' ? (
              <span className="text-emerald-100">Title: "{decisionTitle}" | Hook: {decisionHook} | Confidence: High</span>
            ) : outcomeStatus === 'idea-pending' ? (
              <span className="text-amber-100">Idea pending — flow screen mein topic likhein, phir 3 fresh ideas select karein | Confidence: Pending</span>
            ) : outcomeStatus === 'ideas' ? (
              <span className="text-amber-100">3 fresh ideas ready — flow screen mein aik idea select karein | Confidence: Pending</span>
            ) : outcomeStatus === 'discussion' ? (
              <span className="text-fuchsia-100">Title: "{decisionTitle}" | Hook: {decisionHook} | Confidence: Discussion mode — chat ke baad Final Generate</span>
            ) : outcomeStatus === 'generating' ? (
              <span className="text-amber-100">Title: "{decisionTitle}" | Scene-by-scene story generate ho rahi hai... | Confidence: Generating</span>
            ) : outcomeStatus === 'error' ? (
              <span className="text-rose-100">Title: "{decisionTitle}" | Confidence: Error — "Dobara Try Karein" dabayein</span>
            ) : (
              <span className="text-slate-200">
                {flowOpen ? 'Duplicate check + AI story generation chal raha hai...' : 'Flow band hua — dobara Trigger dabayein.'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {appliedProfile && appliedCategory && (
              <span className="px-2 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700 rounded text-[11px] font-mono">
                {appliedProfile.name} • {appliedCategory.id}. {appliedCategory.name}
              </span>
            )}
            {!appliedSelection ? (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[11px] font-medium">
                Duplicate Check: Pending
              </span>
            ) : outcomeStatus === 'duplicate' ? (
              <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Duplicate: {triggerOutcome?.duplicates.length ?? 0} match + fresh ideas
              </span>
            ) : outcomeStatus === 'generated' ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Duplicate Check: Naya (Passed)
              </span>
            ) : outcomeStatus === 'idea-pending' ? (
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium">
                Idea pending
              </span>
            ) : outcomeStatus === 'ideas' ? (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-medium">
                3 fresh ideas ready
              </span>
            ) : outcomeStatus === 'discussion' ? (
              <span className="px-2 py-0.5 bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 rounded text-[11px] font-medium">
                Discussion open
              </span>
            ) : outcomeStatus === 'error' ? (
              <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium">
                Generation error
              </span>
            ) : flowOpen ? (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[11px] font-medium">
                Not completed
              </span>
            )}
            <span className="text-slate-400 text-[11px]">Memory: {memoryRecords.length}</span>
          </div>
        </div>
      </div>

      {/* Latest Generated Story (replaces old static reference sample) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        {latestStory ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
              <div className="flex items-start sm:items-center gap-2 text-xs text-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong className="text-white">Latest AI-generated story</strong> — yeh aapki main story hai. Naya Trigger chalane par replace hogi.
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                Saved locally • {latestStory.sceneCount} scenes
              </span>
            </div>
            <StoryPackageView
              story={latestStory}
              onDeleteStory={() => setLatestStory(null)}
              onUpdateStory={(updated: GeneratedStory) => setLatestStory(updated)}
            />
          </>
        ) : (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Film className="w-7 h-7 text-cyan-300" />
            </div>
            <h3 className="text-base font-bold text-white">Aapki AI-generated story yahan aayegi</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Upar <strong className="text-cyan-300">Trigger</strong> dabayein. Category 1–9 seedha AI story generate karengi; Category 10 mein pehle idea, phir 3 fresh ideas, discussion aur Final Story Generate hoga.
            </p>
            <p className="text-[11px] text-slate-500">
              Purana Windows 11 reference sample hata diya gaya hai — ab yahan sirf aapki apni generated story dikhegi aur reload par bhi save rahegi.
            </p>
          </div>
        )}
      </div>

      {flowOpen && appliedSelection && (
        <AgentFlowScreen
          profile={appliedProfile || CHANNEL_PROFILES.itcafeteria}
          selection={appliedSelection}
          memoryRecords={memoryRecords}
          onClose={() => setFlowOpen(false)}
          onOutcome={handleFlowOutcome}
        />
      )}

      {/* Engine & Baseline Configuration Modal */}
      <SimulatorConfigModal
        isOpen={showSimulatorConfig}
        onClose={() => setShowSimulatorConfig(false)}
        config={simulatorConfig}
        onReset={() => setSimulatorConfig(DEFAULT_SIMULATOR_CONFIG)}
        onSave={(newCfg) => {
          setSimulatorConfig(newCfg);
          if (newCfg.defaultSceneCount) {
            setDraftSceneCount(newCfg.defaultSceneCount);
          }
        }}
      />

      {/* Multi-Channel Manager Modal (+ Add Channel) */}
      <ChannelManagerModal
        isOpen={showChannelManager}
        onClose={() => setShowChannelManager(false)}
        onChannelsUpdated={() => {
          const updated = loadAllChannels();
          setChannels(updated);
        }}
      />
    </div>
  );
};
