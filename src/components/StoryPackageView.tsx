import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Sparkles,
  Tag,
  Youtube,
  Edit3,
  RotateCcw,
  Wand2,
  Save,
  X,
  RefreshCw,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { resolveThumbnailSpec } from '../lib/thumbnailMaster';
import { StoryThumbnailPanel } from './StoryThumbnailPanel';
import {
  ensureFlowCinematicScript,
  buildFlowCinematicScript,
  upgradeStoryScenesToCinematic
} from '../lib/flowPromptBuilder';

export interface StoryIdea {
  title: string;
  hook: string;
  angle: string;
  points: string;
  whyFresh?: string;
}

export interface StoryScene {
  num: number;
  duration: string;
  purpose: string;
  isCTA: boolean;
  words: number;
  visual: string;
  dialogue: string;
  script: string;
}

export interface GeneratedStory {
  title: string;
  hook: string;
  channelName: string;
  presenter: string;
  categoryName: string;
  playlist: string;
  characterTag: string;
  dateLabel: string;
  sceneCount: number;
  scenes: StoryScene[];
  hashtags: string[];
  description: string;
  tags: string[];
  tiktokCaption: string;
  thumbnailHeadline: string;
  thumbnailSubBadge: string;
  thumbnailPrompt: string;
  thumbnailLine1?: string;
  thumbnailLine2?: string;
  thumbnailHologram?: string;
  seriesPlan: string;
  memoryBlock: string;
  idea: StoryIdea;
  discussionNotes: string;
  modelUsed?: string;
}

export function buildStoryPackageText(story: GeneratedStory): string {
  const upgradedStory = upgradeStoryScenesToCinematic(story);
  const thumbnail = resolveThumbnailSpec({
    channelName: upgradedStory.channelName,
    presenter: upgradedStory.presenter,
    title: upgradedStory.title,
    ideaTitle: upgradedStory.idea?.title,
    headline: upgradedStory.thumbnailHeadline,
    line1: upgradedStory.thumbnailLine1,
    line2: upgradedStory.thumbnailLine2,
    subBanner: upgradedStory.thumbnailSubBadge,
    hologram: upgradedStory.thumbnailHologram,
    characterTag: upgradedStory.characterTag,
  });

  const scenesText = upgradedStory.scenes
    .map((scene) => {
      const ensured = ensureFlowCinematicScript(scene, {
        characterTag: upgradedStory.characterTag,
        channelName: upgradedStory.channelName,
        presenter: upgradedStory.presenter,
        storyTitle: upgradedStory.title,
      });
      return `Scene ${ensured.num} — ${ensured.duration} [${ensured.purpose}]${ensured.isCTA ? ' — CTA' : ''} (${ensured.words} words)
Visual: ${ensured.visual || '—'}
Dialogue: "${ensured.dialogue}"
Flow Script:
${ensured.script}`;
    })
    .join('\n\n');

  return `Story Package — ${upgradedStory.channelName}
Date: ${upgradedStory.dateLabel}
Category: ${upgradedStory.categoryName} | Playlist: ${upgradedStory.playlist}
Title: ${upgradedStory.title}
Hook: ${upgradedStory.hook}
Character Tag: ${upgradedStory.characterTag}
Length: ${upgradedStory.sceneCount} scenes (${upgradedStory.sceneCount * 10}s)
Duplicate Check: PASSED
Thumbnail: ${thumbnail.line1}${thumbnail.line2 ? ` / ${thumbnail.line2}` : ''} (Sub-banner: ${thumbnail.subBanner})
Hashtags: ${upgradedStory.hashtags.join(' ')}

SCENE-BY-SCENE STORY (Google Flow Cinematic Scripts):
${scenesText}

5-ITEM UPLOAD PACKAGE
1. YouTube Title: ${upgradedStory.title} ${upgradedStory.hashtags.join(' ')}
2. Description:
${upgradedStory.description}
3. Tags: ${upgradedStory.tags.join(', ')}
4. TikTok Block: ${upgradedStory.tiktokCaption}
5. Thumbnail Prompt (Master Thumbnail Agent v3.45):
${thumbnail.prompt}

Memory Block (v3.41):
${upgradedStory.memoryBlock}

Series Plan: ${upgradedStory.seriesPlan || '—'}`;
}

export function buildScenesOnlyText(story: GeneratedStory): string {
  const upgradedStory = upgradeStoryScenesToCinematic(story);
  const scenesText = upgradedStory.scenes
    .map((scene) => {
      const ensured = ensureFlowCinematicScript(scene, {
        characterTag: upgradedStory.characterTag,
        channelName: upgradedStory.channelName,
        presenter: upgradedStory.presenter,
        storyTitle: upgradedStory.title,
      });
      return `Scene ${ensured.num} — ${ensured.duration} [${ensured.purpose}]${ensured.isCTA ? ' — CTA' : ''} (${ensured.words} words)
Visual: ${ensured.visual || '—'}
Dialogue: "${ensured.dialogue}"
Flow Script:
${ensured.script}`;
    })
    .join('\n\n');

  return `STORY SCRIPT (${upgradedStory.scenes.length} SCENES) — ${upgradedStory.title}
Hook: ${upgradedStory.hook}
Presenter: ${upgradedStory.presenter} (${upgradedStory.characterTag})
Category: ${upgradedStory.categoryName}

${scenesText}`;
}

export function buildYouTubePackageOnlyText(story: GeneratedStory): string {
  const thumbnail = resolveThumbnailSpec({
    channelName: story.channelName,
    presenter: story.presenter,
    title: story.title,
    ideaTitle: story.idea?.title,
    headline: story.thumbnailHeadline,
    line1: story.thumbnailLine1,
    line2: story.thumbnailLine2,
    subBanner: story.thumbnailSubBadge,
    hologram: story.thumbnailHologram,
    characterTag: story.characterTag,
  });

  return `YOUTUBE UPLOAD PACKAGE — ${story.title}
1. Video Title: ${story.title} ${story.hashtags.join(' ')}

2. Description:
${story.description}

3. Search Tags:
${story.tags.join(', ')}

4. TikTok Block:
${story.tiktokCaption}

5. Master Thumbnail Prompt:
${thumbnail.prompt}
Headline: ${thumbnail.line1} ${thumbnail.line2 || ''} (Sub-banner: ${thumbnail.subBanner})

Memory Block:
${story.memoryBlock}`;
}

export interface StoryPackageViewProps {
  story: GeneratedStory;
  publishStatus?: 'pending' | 'published' | 'draft' | 'overdue';
  onTogglePublish?: () => void;
  onUpdateStory?: (updatedStory: GeneratedStory) => void;
}

export const StoryPackageView: React.FC<StoryPackageViewProps> = ({
  story,
  publishStatus,
  onTogglePublish,
  onUpdateStory,
}) => {
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-Place Scene Editing State
  const [editingSceneNum, setEditingSceneNum] = useState<number | null>(null);
  const [sceneDraft, setSceneDraft] = useState<{
    visual: string;
    dialogue: string;
    purpose: string;
    script: string;
  }>({ visual: '', dialogue: '', purpose: '', script: '' });

  // Story Details Editing Modal State
  const [showStoryEditModal, setShowStoryEditModal] = useState(false);
  const [storyDraft, setStoryDraft] = useState({
    title: story.title,
    hook: story.hook,
    characterTag: story.characterTag,
    description: story.description,
    hashtags: story.hashtags.join(' '),
    tags: story.tags.join(', '),
    tiktokCaption: story.tiktokCaption,
  });

  // Story Refresh / AI Directives Modal State
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [customDirectives, setCustomDirectives] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Clipboard par copy ho gaya!');
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const copyScene = (scene: StoryScene) => {
    const ensured = ensureFlowCinematicScript(scene, {
      characterTag: story.characterTag,
      channelName: story.channelName,
      presenter: story.presenter,
      storyTitle: story.title,
    });
    navigator.clipboard.writeText(ensured.script);
    setCopiedScene(scene.num);
    showToast(`Scene ${scene.num} Flow Cinematic Script Copy Ho Gaya!`);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  // Start Editing a Scene
  const handleStartEditScene = (scene: StoryScene) => {
    const ensured = ensureFlowCinematicScript(scene, {
      characterTag: story.characterTag,
      channelName: story.channelName,
      presenter: story.presenter,
      storyTitle: story.title,
    });
    setEditingSceneNum(scene.num);
    setSceneDraft({
      visual: ensured.visual,
      dialogue: ensured.dialogue,
      purpose: ensured.purpose,
      script: ensured.script,
    });
  };

  // Auto re-generate Flow script for the scene being edited
  const handleAutoFormatDraftScript = (scene: StoryScene) => {
    const formatted = buildFlowCinematicScript({
      sceneNum: scene.num,
      duration: scene.duration,
      purpose: sceneDraft.purpose || scene.purpose,
      isCTA: scene.isCTA,
      visual: sceneDraft.visual,
      dialogue: sceneDraft.dialogue,
      characterTag: story.characterTag,
      channelName: story.channelName,
      presenter: story.presenter,
      storyTitle: story.title,
    });
    setSceneDraft((prev) => ({ ...prev, script: formatted }));
    showToast('Cinematic Flow Script auto-generate ho gaya!');
  };

  // Save Scene Edits
  const handleSaveScene = (sceneNum: number) => {
    const updatedScenes = story.scenes.map((scene) => {
      if (scene.num === sceneNum) {
        const computedWords = sceneDraft.dialogue
          ? sceneDraft.dialogue.split(/\s+/).filter(Boolean).length
          : scene.words;
        return {
          ...scene,
          visual: sceneDraft.visual.trim(),
          dialogue: sceneDraft.dialogue.trim(),
          purpose: sceneDraft.purpose.trim() || scene.purpose,
          words: computedWords,
          script: sceneDraft.script.trim(),
        };
      }
      return scene;
    });

    const updatedStory: GeneratedStory = {
      ...story,
      scenes: updatedScenes,
    };

    onUpdateStory?.(updatedStory);
    setEditingSceneNum(null);
    showToast(`Scene ${sceneNum} ki tabdeeli mehfooz ho gayi!`);
  };

  // Save Full Story Metadata Edits
  const handleSaveStoryDraft = () => {
    const cleanHashtags = storyDraft.hashtags
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const cleanTags = storyDraft.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedStory: GeneratedStory = {
      ...story,
      title: storyDraft.title.trim() || story.title,
      hook: storyDraft.hook.trim() || story.hook,
      characterTag: storyDraft.characterTag.trim() || story.characterTag,
      description: storyDraft.description.trim() || story.description,
      hashtags: cleanHashtags.length ? cleanHashtags : story.hashtags,
      tags: cleanTags.length ? cleanTags : story.tags,
      tiktokCaption: storyDraft.tiktokCaption.trim() || story.tiktokCaption,
    };

    onUpdateStory?.(updatedStory);
    setShowStoryEditModal(false);
    showToast('Story details kamyabi se update ho gayi!');
  };

  // 1-Click Instant Upgrade of all scenes to cinematic scripts
  const handleUpgradeAllCinematic = () => {
    const upgraded = upgradeStoryScenesToCinematic(story);
    onUpdateStory?.(upgraded);
    showToast('Tamam scenes ko Cinematic Flow Prompts mein tabdeel kar diya gaya!');
  };

  // Call Server to Refresh / Re-generate story with custom directives
  const handleRunAiRefresh = async () => {
    setRefreshLoading(true);
    setRefreshError('');
    try {
      const todayLabel = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const response = await fetch('/api/ai/refresh-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          customDirectives: customDirectives.trim(),
          verifyDate: todayLabel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Refresh fail ho gaya');
      }
      if (data.story) {
        onUpdateStory?.(data.story);
        setShowRefreshModal(false);
        setCustomDirectives('');
        showToast('Story naye facts aur aapki directives ke sath refresh ho gayi!');
      }
    } catch (err: any) {
      setRefreshError(err.message || 'Story refresh nahi ho saki');
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-950 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Main Story Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-400" /> AI GENERATED STORY
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {story.channelName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {story.categoryName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                {story.characterTag}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {story.dateLabel}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-2 flex items-center gap-2 flex-wrap">
              <span>{story.title}</span>
            </h3>

            <p className="text-xs text-slate-300 mt-1">
              Hook: <span className="text-cyan-300 font-medium">{story.hook}</span>
              <span className="text-slate-500"> • </span>
              {story.sceneCount} scenes ({story.sceneCount * 10}s)
              <span className="text-slate-500"> • </span>
              Thumbnail: <span className="text-amber-300 font-semibold">{story.thumbnailHeadline}</span>
              {story.thumbnailSubBadge ? ` — ${story.thumbnailSubBadge}` : ''}
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap sm:flex-col items-stretch gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyText(buildStoryPackageText(story), 'all')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all cursor-pointer"
                title="Copy all scenes, dialogue, visuals, and YouTube package"
              >
                {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'all' ? 'Copied!' : 'Copy Full Story Package'}</span>
              </button>

              <button
                onClick={() => {
                  setStoryDraft({
                    title: story.title,
                    hook: story.hook,
                    characterTag: story.characterTag,
                    description: story.description,
                    hashtags: story.hashtags.join(' '),
                    tags: story.tags.join(', '),
                    tiktokCaption: story.tiktokCaption,
                  });
                  setShowStoryEditModal(true);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                title="Edit Story Details (Title, Hook, Tags)"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => setShowRefreshModal(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                title="Refresh / Verify Story with AI or Custom Directives"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => copyText(buildScenesOnlyText(story), 'scenes')}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                title="Copy only scene flow scripts and dialogue"
              >
                {copiedKey === 'scenes' ? <Check className="w-3 h-3 text-emerald-400" /> : <Film className="w-3 h-3" />}
                <span>{copiedKey === 'scenes' ? 'Copied!' : 'Scenes Only'}</span>
              </button>

              <button
                onClick={() => copyText(buildYouTubePackageOnlyText(story), 'yt')}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                title="Copy only YouTube title, tags, description and thumbnail prompt"
              >
                {copiedKey === 'yt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Youtube className="w-3 h-3" />}
                <span>{copiedKey === 'yt' ? 'Copied!' : 'YouTube Only'}</span>
              </button>
            </div>
          </div>
        </div>

        {story.idea?.title && (
          <p className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
            Story idea: <strong className="text-slate-200">{story.idea.title}</strong>
            {story.idea.angle ? <span className="text-slate-500"> — {story.idea.angle}</span> : null}
            {story.discussionNotes ? (
              <span className="block mt-1 text-fuchsia-300/90">Discussion notes: {story.discussionNotes}</span>
            ) : null}
          </p>
        )}
      </div>

      {/* Scene-By-Scene Story Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            Scene-by-Scene Story ({story.scenes.length} scenes • 10s per scene)
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgradeAllCinematic}
              className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Ensure all scenes have the rich cinematic camera directions and quoted dialogue"
            >
              <Wand2 className="w-3 h-3 text-cyan-400" />
              <span>Ensure Cinematic Prompts</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              10s / scene • 22–25 words
            </span>
          </div>
        </div>

        {story.scenes.map((rawScene) => {
          // Ensure prompt is in full cinematic director format
          const scene = ensureFlowCinematicScript(rawScene, {
            characterTag: story.characterTag,
            channelName: story.channelName,
            presenter: story.presenter,
            storyTitle: story.title,
          });

          const isEditingThisScene = editingSceneNum === scene.num;

          return (
            <div
              key={scene.num}
              className="bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(2,6,23,0.25)] hover:border-cyan-500/40 transition-colors"
            >
              {/* Scene Card Header */}
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-base">
                    Scene {scene.num} — {scene.duration} [{scene.purpose}]{scene.isCTA ? ' — CTA' : ''}
                  </span>
                  {scene.isCTA && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                      SAVE CTA
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({scene.words} words • ~2.7 w/s)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEditScene(scene)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors border cursor-pointer ${
                      isEditingThisScene
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Scene mein tabdeeli karein (Visual, Dialogue, Script)"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isEditingThisScene ? 'Editing...' : 'Edit Scene'}</span>
                  </button>

                  <button
                    onClick={() => copyScene(scene)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                    title="Copy full cinematic Google Flow prompt for this scene"
                  >
                    {copiedScene === scene.num ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Scene
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Normal View vs In-Place Edit Form */}
              {isEditingThisScene ? (
                <div className="space-y-3 p-4 bg-slate-900 border border-blue-500/40 rounded-xl text-xs">
                  <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      Scene {scene.num} Edit Mode
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAutoFormatDraftScript(scene)}
                      className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded-lg flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                      title="Generate fresh cinematic Flow script from dialogue & visual"
                    >
                      <Wand2 className="w-3 h-3 text-cyan-400" />
                      <span>Auto-Generate Flow Script</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Scene Role / Purpose:</label>
                      <input
                        type="text"
                        value={sceneDraft.purpose}
                        onChange={(e) => setSceneDraft({ ...sceneDraft, purpose: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-400"
                        placeholder="e.g. Curiosity Shock Hook"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Visual Direction & Props:</label>
                      <input
                        type="text"
                        value={sceneDraft.visual}
                        onChange={(e) => setSceneDraft({ ...sceneDraft, visual: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-400"
                        placeholder="e.g. Chrome icon cracking open to reveal dark engine"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">
                      Spoken Dialogue (Roman Urdu — 22 to 25 words):
                    </label>
                    <textarea
                      rows={2}
                      value={sceneDraft.dialogue}
                      onChange={(e) => setSceneDraft({ ...sceneDraft, dialogue: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-fuchsia-200 text-xs font-mono focus:outline-none focus:border-fuchsia-400"
                      placeholder="Spoken words in natural Roman Urdu..."
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold flex items-center justify-between">
                      <span>Flow — Copy-Paste Script (Cinematic Director Format):</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Google Flow Ready</span>
                    </label>
                    <textarea
                      rows={5}
                      value={sceneDraft.script}
                      onChange={(e) => setSceneDraft({ ...sceneDraft, script: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-blue-400"
                      placeholder="[DIRECTOR CAMERA & LIGHTING]: ...&#10;[SCENE VISUAL & PROPS]: ...&#10;[PRESENTER & ACTION]: ...&#10;DIALOGUE: ..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingSceneNum(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveScene(scene.num)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Scene</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {scene.visual && (
                    <p className="text-xs text-slate-400 mb-2.5">
                      <span className="text-slate-500 uppercase font-mono text-[10px] mr-1">Visual:</span>
                      {scene.visual}
                    </p>
                  )}

                  {scene.dialogue && (
                    <p className="text-sm text-fuchsia-200/90 bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-lg px-3.5 py-2.5 mb-2.5">
                      <span className="text-fuchsia-400/80 uppercase font-mono text-[10px] mr-1">Dialogue:</span>
                      “{scene.dialogue}”
                    </p>
                  )}

                  <div className="text-xs text-blue-400/80 font-mono mb-1.5 flex items-center justify-between">
                    <span>Flow — Copy-Paste Script (Director Instructions + Props + Dialogue)</span>
                    <span className="text-[10px] text-cyan-400/70 font-mono">9:16 Vertical HD</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-4 sm:p-5 rounded-xl border border-slate-800/60 selection:bg-blue-600 selection:text-white whitespace-pre-wrap">
                    {scene.script}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <StoryThumbnailPanel key={`${story.characterTag}-${story.title}`} story={story} />

      {/* Post-Story Upload Package */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Post-Story Upload Package (5 Items + Memory Block)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-cyan-300 uppercase flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5" /> Item 1: YouTube Title + Hashtags
            </span>
            <p className="text-white font-medium text-sm leading-snug">{story.title}</p>
            <p className="text-cyan-300 font-mono text-xs">{story.hashtags.join(' ')}</p>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-300 uppercase flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Item 5: Thumbnail
            </span>
            <p className="text-amber-200 font-semibold text-sm leading-snug">{story.thumbnailHeadline}</p>
            <p className="text-amber-100/70 text-xs">
              Sub-banner: {story.thumbnailSubBadge || '—'} • 9:16 • Master v3.45
            </p>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Item 3: YouTube Tags
            </span>
            <p className="text-indigo-100/85 font-mono text-xs leading-relaxed">{story.tags.join(', ')}</p>
          </div>

          <div className="bg-fuchsia-950/20 border border-fuchsia-500/30 p-4 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold text-fuchsia-300 uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Item 4: TikTok Block
            </span>
            <p className="text-fuchsia-100/90 text-[13px] leading-relaxed">{story.tiktokCaption}</p>
          </div>
        </div>

        <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-blue-300 uppercase flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Item 2: YouTube Description
          </span>
          <p className="text-slate-200 text-xs whitespace-pre-line leading-relaxed font-mono">
            {story.description}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1.5 text-slate-300 text-xs font-mono">
          <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Story Memory Block (Channel Learning v3.41)
          </span>
          <p className="whitespace-pre-line text-slate-400 leading-relaxed text-[11px]">
            {story.memoryBlock}
          </p>
        </div>
      </div>

      {/* Modal 1: Edit Story Metadata (Title, Hook, Tags, Description) */}
      {showStoryEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Story Details & Metadata
              </h3>
              <button
                onClick={() => setShowStoryEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Story Title:</label>
                <input
                  type="text"
                  value={storyDraft.title}
                  onChange={(e) => setStoryDraft({ ...storyDraft, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Opening Hook:</label>
                <input
                  type="text"
                  value={storyDraft.hook}
                  onChange={(e) => setStoryDraft({ ...storyDraft, hook: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Character Tag Variant:</label>
                <input
                  type="text"
                  value={storyDraft.characterTag}
                  onChange={(e) => setStoryDraft({ ...storyDraft, characterTag: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. @WM25-1"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={storyDraft.description}
                  onChange={(e) => setStoryDraft({ ...storyDraft, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Hashtags:</label>
                <input
                  type="text"
                  value={storyDraft.hashtags}
                  onChange={(e) => setStoryDraft({ ...storyDraft, hashtags: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tags (Comma-separated):</label>
                <input
                  type="text"
                  value={storyDraft.tags}
                  onChange={(e) => setStoryDraft({ ...storyDraft, tags: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowStoryEditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStoryDraft}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Story Refresh & AI Directives (ری فریش اور تصدیق) */}
      {showRefreshModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Refresh & Verify Story (تصدیق اور ترمیم)
              </h3>
              <button
                onClick={() => setShowRefreshModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Date & Fact Verification:</strong>
                  <span>
                    Yeh story aaj ki tareekh ke sath verify hogi aur tamam scenes ke Google Flow scripts mein dynamic camera direction, props aur quoted dialogue add ho jayenge.
                  </span>
                </div>
              </div>

              {refreshError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{refreshError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-200 font-semibold block mb-1">
                  Custom Directives / تبدیلیاں (Optional):
                </label>
                <textarea
                  rows={4}
                  value={customDirectives}
                  onChange={(e) => setCustomDirectives(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:border-emerald-400"
                  placeholder="Agar aap is story mein koi nayi cheez add karwana chahte hain, jaise koi naya tool feature, naya angle ya specific dialogue change, to yahan likhein..."
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Khali chorne par AI mojooda story ke content ko barkarar rakhte hue sirf flow prompts aur facts verify karega.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Instant Local Upgrade</span>
                  <span className="text-[10px] text-slate-400">Bina internet/AI call ke tamam scenes ko fori upgrade karein</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleUpgradeAllCinematic();
                    setShowRefreshModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Instant Upgrade
                </button>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRefreshModal(false)}
                disabled={refreshLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAiRefresh}
                disabled={refreshLoading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
              >
                {refreshLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Refresh Ho Raha Hai...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run AI Refresh & Verify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
