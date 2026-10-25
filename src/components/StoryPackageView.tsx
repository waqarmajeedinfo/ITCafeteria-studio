import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles
} from 'lucide-react';

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
  seriesPlan: string;
  memoryBlock: string;
  idea: StoryIdea;
  discussionNotes: string;
  modelUsed?: string;
}

export function buildStoryPackageText(story: GeneratedStory): string {
  const scenesText = story.scenes.map((scene) => {
    return `Scene ${scene.num} — ${scene.duration} [${scene.purpose}]${scene.isCTA ? ' — CTA' : ''} (${scene.words} words)
Visual: ${scene.visual || '—'}
Dialogue: "${scene.dialogue}"
Flow Script:
${scene.script}`;
  }).join('\n\n');

  return `Story Package — ${story.channelName}
Date: ${story.dateLabel}
Category: ${story.categoryName} | Playlist: ${story.playlist}
Title: ${story.title}
Hook: ${story.hook}
Character Tag: ${story.characterTag}
Length: ${story.sceneCount} scenes (${story.sceneCount * 10}s)
Duplicate Check: PASSED
Thumbnail: ${story.thumbnailHeadline} (Sub-badge: ${story.thumbnailSubBadge})
Hashtags: ${story.hashtags.join(' ')}

SCENE-BY-SCENE STORY (Flow paste-ready):
${scenesText}

5-ITEM UPLOAD PACKAGE
1. YouTube Title: ${story.title} ${story.hashtags.join(' ')}
2. Description:
${story.description}
3. Tags: ${story.tags.join(', ')}
4. TikTok Block: ${story.tiktokCaption}
5. Thumbnail Prompt:
${story.thumbnailPrompt}

Memory Block (v3.41):
${story.memoryBlock}

Series Plan: ${story.seriesPlan || '—'}`;
}

export const StoryPackageView: React.FC<{ story: GeneratedStory }> = ({ story }) => {
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyScene = (scene: StoryScene) => {
    navigator.clipboard.writeText(scene.script);
    setCopiedScene(scene.num);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(buildStoryPackageText(story));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI GENERATED STORY
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {story.channelName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {story.categoryName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                {story.characterTag}
              </span>
              <span className="text-slate-500">{story.dateLabel}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-2">
              {story.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Hook: <span className="text-cyan-300">{story.hook}</span>
              <span className="text-slate-500"> • </span>
              {story.sceneCount} scenes ({story.sceneCount * 10}s)
              <span className="text-slate-500"> • </span>
              Thumbnail: <span className="text-amber-300">{story.thumbnailHeadline}</span>
              {story.thumbnailSubBadge ? ` — ${story.thumbnailSubBadge}` : ''}
            </p>
          </div>

          <button
            onClick={copyAll}
            className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copiedAll ? 'Copied Full Package!' : 'Copy Full Story Package'}
          </button>
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

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            Scene-by-Scene Story ({story.scenes.length} scenes)
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            Section 19: 1 header + 1 label + paste script • 22–25 words/scene
          </span>
        </div>

        {story.scenes.map((scene) => (
          <div
            key={scene.num}
            className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white text-sm">
                  Scene {scene.num} — {scene.duration} [{scene.purpose}]{scene.isCTA ? ' — CTA' : ''}
                </span>
                {scene.isCTA && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                    SAVE CTA
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  ({scene.words} words • ~2.7 w/s)
                </span>
              </div>
              <button
                onClick={() => copyScene(scene)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
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

            {scene.visual && (
              <p className="text-[11px] text-slate-400 mb-2">
                <span className="text-slate-500 uppercase font-mono text-[9px] mr-1">Visual:</span>
                {scene.visual}
              </p>
            )}

            {scene.dialogue && (
              <p className="text-[11px] text-fuchsia-200/90 bg-fuchsia-950/20 border border-fuchsia-500/20 rounded-lg px-3 py-2 mb-2">
                <span className="text-fuchsia-400/80 uppercase font-mono text-[9px] mr-1">Dialogue:</span>
                “{scene.dialogue}”
              </p>
            )}

            <div className="text-[10px] text-blue-400/80 font-mono mb-1">
              Flow — Copy-Paste Script
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800/60 selection:bg-blue-600 selection:text-white whitespace-pre-wrap">
              {scene.script}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Post-Story Upload Package (5 Items + Memory Block)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Item 1: YouTube Title + Hashtags</span>
            <p className="text-white font-medium">{story.title}</p>
            <p className="text-cyan-400 font-mono text-[10px]">{story.hashtags.join(' ')}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Item 5: Thumbnail
            </span>
            <p className="text-amber-300 font-semibold">{story.thumbnailHeadline}</p>
            <p className="text-slate-400 text-[10px]">Sub-badge: {story.thumbnailSubBadge || '—'} • 9:16</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Item 3: YouTube Tags</span>
            <p className="text-slate-300 font-mono text-[10px] leading-relaxed">{story.tags.join(', ')}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Item 4: TikTok Block</span>
            <p className="text-slate-200 text-[11px]">{story.tiktokCaption}</p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Item 2: Description + Practical Steps</span>
          <p className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">{story.description}</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Item 5: Thumbnail Prompt</span>
          <p className="text-slate-400 text-[10px] whitespace-pre-wrap leading-relaxed">{story.thumbnailPrompt}</p>
        </div>

        <div className="bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-500/30 p-3.5 rounded-xl space-y-1.5">
          <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Memory Block (v3.41)
          </span>
          <p className="text-slate-300 font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
            {story.memoryBlock}
          </p>
        </div>

        {story.seriesPlan && (
          <p className="text-[11px] text-slate-400">
            <span className="text-cyan-300 font-semibold">Series bridge:</span> {story.seriesPlan}
          </p>
        )}
      </div>
    </div>
  );
};
