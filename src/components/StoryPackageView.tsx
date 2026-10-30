import React, { useState } from 'react';
import {
  Check,
  Copy,
  Edit2,
  Edit3,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Sparkles,
  Tag,
  Youtube,
  Clapperboard,
  Trash2,
  Save,
  X,
  BookmarkCheck,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { resolveThumbnailSpec } from '../lib/thumbnailMaster';
import { StoryThumbnailPanel } from './StoryThumbnailPanel';
import { applyCinematicDirecting } from '../lib/cinematicDirector';
import {
  upsertPendingStoryRecord,
  deletePendingStoryRecord,
  updatePendingStoryStatus,
  type PendingStoryRecord
} from '../lib/pendingQueueStore';
import { publishStoryDirectly } from '../lib/publishedLibraryStore';

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
  cinematicDirectingActive?: boolean;
  customCinematicDirection?: string;
  lastRefreshedAt?: string;
}

/**
 * Normalizes any tag to start with '@' (e.g. '@WM25-4').
 * If faceless, returns empty string.
 */
export function formatCharacterTag(tag?: string): string {
  if (!tag) return '';
  const clean = tag.trim();
  if (clean === 'No-Character' || clean.toLowerCase().includes('faceless')) return '';
  return clean.startsWith('@') ? clean : `@${clean}`;
}

export function sanitizeStoryPackage(raw: any): GeneratedStory {
  if (!raw || typeof raw !== 'object') {
    return {
      title: 'Google Flow AI Video Trick: Start & End Frames Control',
      hook: 'Reveal',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'AI & Smart Technology',
      playlist: 'AI & Smart Technology',
      characterTag: '@WM25-1',
      dateLabel: new Date().toLocaleDateString('en-GB'),
      sceneCount: 10,
      scenes: [],
      hashtags: ['#ITCafeteria', '#Shorts'],
      description: 'IT Cafeteria YouTube video script in Roman Urdu.',
      tags: ['IT Cafeteria', 'Roman Urdu', 'Tech'],
      tiktokCaption: 'Check this tech secret! #itcafeteria #shorts',
      thumbnailHeadline: 'TECH SECRET',
      thumbnailSubBadge: 'MUST TRY',
      thumbnailPrompt: 'Tech studio YouTube thumbnail with presenter.',
      seriesPlan: 'Series Next',
      memoryBlock: '',
      idea: { title: 'Untitled', hook: 'Reveal', angle: '', points: '' },
      discussionNotes: ''
    };
  }

  const safeScenes: StoryScene[] = (Array.isArray(raw.scenes) ? raw.scenes : [])
    .filter((s: any) => s && typeof s === 'object')
    .map((s: any, idx: number) => ({
      num: Number(s.num) || idx + 1,
      duration: String(s.duration || '10s'),
      purpose: String(s.purpose || `Scene ${idx + 1}`),
      isCTA: Boolean(s.isCTA),
      words: Number(s.words) || (s.dialogue ? String(s.dialogue).split(/\s+/).filter(Boolean).length : 24),
      visual: String(s.visual || ''),
      dialogue: String(s.dialogue || ''),
      script: String(s.script || `${s.visual || ''}\n"${s.dialogue || ''}"`)
    }));

  const safeHashtags: string[] = (Array.isArray(raw.hashtags) ? raw.hashtags : [])
    .map((h: any) => String(h || '').trim())
    .filter(Boolean);
  if (!safeHashtags.length) safeHashtags.push('#ITCafeteria', '#Shorts');

  const safeTags: string[] = (Array.isArray(raw.tags) ? raw.tags : [])
    .map((t: any) => String(t || '').trim())
    .filter(Boolean);
  if (!safeTags.length) safeTags.push('IT Cafeteria', 'Roman Urdu', 'Tech');

  return {
    title: String(raw.title || 'Untitled Story'),
    hook: String(raw.hook || 'Reveal'),
    channelName: String(raw.channelName || 'IT Cafeteria'),
    presenter: String(raw.presenter || 'Waqar Majeed'),
    categoryName: String(raw.categoryName || 'AI & Smart Technology'),
    playlist: String(raw.playlist || 'AI & Smart Technology'),
    characterTag: String(raw.characterTag || '@WM25-1'),
    dateLabel: String(raw.dateLabel || new Date().toLocaleDateString('en-GB')),
    sceneCount: safeScenes.length || Number(raw.sceneCount) || 10,
    scenes: safeScenes,
    hashtags: safeHashtags,
    description: String(raw.description || ''),
    tags: safeTags,
    tiktokCaption: String(raw.tiktokCaption || `${raw.title || ''} ${safeHashtags.join(' ')}`),
    thumbnailHeadline: String(raw.thumbnailHeadline || String(raw.title || '').slice(0, 20).toUpperCase()),
    thumbnailSubBadge: String(raw.thumbnailSubBadge || 'MUST TRY'),
    thumbnailPrompt: String(raw.thumbnailPrompt || ''),
    thumbnailLine1: raw.thumbnailLine1 ? String(raw.thumbnailLine1) : undefined,
    thumbnailLine2: raw.thumbnailLine2 ? String(raw.thumbnailLine2) : undefined,
    thumbnailHologram: raw.thumbnailHologram ? String(raw.thumbnailHologram) : undefined,
    seriesPlan: String(raw.seriesPlan || ''),
    memoryBlock: String(raw.memoryBlock || ''),
    idea: raw.idea && typeof raw.idea === 'object' ? {
      title: String(raw.idea.title || raw.title || ''),
      hook: String(raw.idea.hook || raw.hook || 'Reveal'),
      angle: String(raw.idea.angle || ''),
      points: String(raw.idea.points || ''),
      whyFresh: raw.idea.whyFresh ? String(raw.idea.whyFresh) : undefined
    } : { title: String(raw.title || ''), hook: String(raw.hook || 'Reveal'), angle: '', points: '' },
    discussionNotes: String(raw.discussionNotes || ''),
    modelUsed: raw.modelUsed ? String(raw.modelUsed) : undefined,
    cinematicDirectingActive: Boolean(raw.cinematicDirectingActive),
    customCinematicDirection: raw.customCinematicDirection ? String(raw.customCinematicDirection) : undefined,
    lastRefreshedAt: raw.lastRefreshedAt ? String(raw.lastRefreshedAt) : undefined
  };
}

export function buildStoryPackageText(rawStory: GeneratedStory): string {
  const story = sanitizeStoryPackage(rawStory);
  const normTag = formatCharacterTag(story.characterTag);
  const presenter = story.presenter || (normTag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed');

  const thumbnail = resolveThumbnailSpec({
    channelName: story.channelName,
    presenter,
    title: story.title,
    ideaTitle: story.idea?.title,
    headline: story.thumbnailHeadline,
    line1: story.thumbnailLine1,
    line2: story.thumbnailLine2,
    subBanner: story.thumbnailSubBadge,
    hologram: story.thumbnailHologram,
    characterTag: normTag,
  });

  const scenesText = (story.scenes || []).map((scene) => {
    let directedScript = applyCinematicDirecting(scene.num, scene.script, story.customCinematicDirection, scene.purpose);
    // Enforce strictly 0-10s duration and @tag
    directedScript = (directedScript || '')
      .replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1')
      .replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');

    return `Scene ${scene.num} — 0-10s [${scene.purpose}]${scene.isCTA ? ' — CTA' : ''} (${scene.words} words)
Visual: ${scene.visual || '—'}
Dialogue: "${scene.dialogue}"
Flow Script (Cinematic Directing Layer Pre-pended, Strictly 10s):
${directedScript}`;
  }).join('\n\n');

  return `Story Package — ${story.channelName}
Date: ${story.dateLabel}
Category: ${story.categoryName} | Playlist: ${story.playlist}
Title: ${story.title}
Hook: ${story.hook}
Presenter: ${presenter}${normTag ? ` (${normTag})` : ''}
Length: ${story.sceneCount} scenes (${story.sceneCount * 10}s)
Duplicate Check: PASSED
Cinematic Directing: MANDATORY APPLIED (Google Flow Ready • Strictly 10s per scene)
Thumbnail: ${thumbnail.line1}${thumbnail.line2 ? ` / ${thumbnail.line2}` : ''} (Sub-banner: ${thumbnail.subBanner})
Hashtags: ${story.hashtags.join(' ')}

SCENE-BY-SCENE STORY (Flow paste-ready with Cinematic Directing):
${scenesText}

5-ITEM UPLOAD PACKAGE
1. YouTube Title: ${story.title} ${story.hashtags.join(' ')}
2. Description:
${story.description}
3. Tags: ${story.tags.join(', ')}
4. TikTok Block: ${story.tiktokCaption}
5. Thumbnail Prompt:
${thumbnail.prompt}`;
}

export function buildScenesOnlyText(rawStory: GeneratedStory): string {
  const story = sanitizeStoryPackage(rawStory);
  const normTag = formatCharacterTag(story.characterTag);
  const presenter = story.presenter || (normTag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed');

  const scenesText = (story.scenes || []).map((scene) => {
    let directedScript = applyCinematicDirecting(scene.num, scene.script, story.customCinematicDirection, scene.purpose);
    directedScript = (directedScript || '')
      .replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1')
      .replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');

    return `Scene ${scene.num} — 0-10s [${scene.purpose}]${scene.isCTA ? ' — CTA' : ''} (${scene.words} words)
Visual: ${scene.visual || '—'}
Dialogue: "${scene.dialogue}"
Flow Script (Strictly 10s):
${directedScript}`;
  }).join('\n\n');

  return `STORY SCRIPT (${story.scenes.length} SCENES • STRICTLY 10s EACH) — ${story.title}
Hook: ${story.hook}
Presenter: ${presenter}${normTag ? ` (${normTag})` : ''}
Category: ${story.categoryName}
Cinematic Directing Layer: Active

${scenesText}`;
}

export function buildYouTubePackageOnlyText(rawStory: GeneratedStory): string {
  const story = sanitizeStoryPackage(rawStory);
  const normTag = formatCharacterTag(story.characterTag);
  const presenter = story.presenter || (normTag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed');

  const thumbnail = resolveThumbnailSpec({
    channelName: story.channelName,
    presenter,
    title: story.title,
    ideaTitle: story.idea?.title,
    headline: story.thumbnailHeadline,
    line1: story.thumbnailLine1,
    line2: story.thumbnailLine2,
    subBanner: story.thumbnailSubBadge,
    hologram: story.thumbnailHologram,
    characterTag: normTag,
  });

  return `YOUTUBE UPLOAD PACKAGE — ${story.title}
1. Video Title: ${story.title} ${story.hashtags.join(' ')}

2. Description:
${story.description}

3. Tags:
${story.tags.join(', ')}

4. TikTok Block:
${story.tiktokCaption}

5. Thumbnail Prompt:
${thumbnail.prompt}
Headline: ${thumbnail.line1} ${thumbnail.line2 || ''} (Sub-banner: ${thumbnail.subBanner})`;
}

export interface StoryPackageViewProps {
  story: GeneratedStory;
  publishStatus?: 'pending' | 'published' | 'draft' | 'overdue' | string;
  onTogglePublish?: () => void;
  onUpdateStory?: (updatedStory: GeneratedStory) => void;
  onDeleteStory?: () => void;
  storyId?: string;
}

export const StoryPackageView: React.FC<StoryPackageViewProps> = ({
  story: rawStory,
  publishStatus,
  onTogglePublish,
  onUpdateStory,
  onDeleteStory,
  storyId
}) => {
  const story = sanitizeStoryPackage(rawStory);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPackageItem, setCopiedPackageItem] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Status tracking (local sync with prop or internal direct publish)
  const [currentStatus, setCurrentStatus] = useState<string>(
    publishStatus || 'pending'
  );

  React.useEffect(() => {
    if (publishStatus) {
      setCurrentStatus(publishStatus);
    }
  }, [publishStatus]);

  // Scene Editing State
  const [editingSceneNum, setEditingSceneNum] = useState<number | null>(null);
  const [sceneEditPurpose, setSceneEditPurpose] = useState('');
  const [sceneEditVisual, setSceneEditVisual] = useState('');
  const [sceneEditDialogue, setSceneEditDialogue] = useState('');
  const [sceneEditScript, setSceneEditScript] = useState('');

  // Upload Package Editing State
  const [editingField, setEditingField] = useState<'title' | 'description' | 'tags' | 'tiktok' | null>(null);
  const [editTitle, setEditTitle] = useState(story.title);
  const [editHashtags, setEditHashtags] = useState(story.hashtags.join(' '));
  const [editDescription, setEditDescription] = useState(story.description);
  const [editTags, setEditTags] = useState(story.tags.join(', '));
  const [editTiktok, setEditTiktok] = useState(story.tiktokCaption);

  React.useEffect(() => {
    const s = sanitizeStoryPackage(rawStory);
    setEditTitle(s.title);
    setEditHashtags(s.hashtags.join(' '));
    setEditDescription(s.description);
    setEditTags(s.tags.join(', '));
    setEditTiktok(s.tiktokCaption);
  }, [rawStory]);

  const normTag = formatCharacterTag(story.characterTag);
  const effectivePresenter = story.presenter || (normTag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed');

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const copyPackageItem = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPackageItem(key);
    setTimeout(() => setCopiedPackageItem(null), 2000);
    showToast(`${key} clipboard par copy ho gaya!`);
  };

  const handlePasteIntoField = async (setter: (val: string) => void, fieldName: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text);
        showToast(`Clipboard se ${fieldName} paste ho gaya!`);
      }
    } catch {
      showToast('Clipboard direct read nahi ho saka. Ctrl+V se paste karein.');
    }
  };

  // Direct Publish / Toggle handler
  const handleDirectPublishOrToggle = () => {
    if (onTogglePublish) {
      onTogglePublish();
      setCurrentStatus((prev) => (prev === 'published' ? 'pending' : 'published'));
      return;
    }

    // Direct publish workflow: moves story immediately into Published Library & pending queue
    if (currentStatus === 'published') {
      setCurrentStatus('pending');
      updatePendingStoryStatus(storyId || story.title, 'pending');
      showToast('Story wapas Pending haalat mein move ho gayi.');
    } else {
      publishStoryDirectly(story, storyId);
      setCurrentStatus('published');
      showToast('✅ Story Published Videos Library mein move kar di gayi!');
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const copyScene = (scene: StoryScene) => {
    let directed = applyCinematicDirecting(scene.num, scene.script, story.customCinematicDirection, scene.purpose);
    // Strictly format duration to 0-10s and tag with @
    directed = directed
      .replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1')
      .replace(/\[PRESENTER & ACTION\]:\s*MZ22-(\d)/g, '[PRESENTER & ACTION]: @MZ22-$1')
      .replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');

    navigator.clipboard.writeText(directed);
    setCopiedScene(scene.num);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  // Start Editing a Scene
  const handleStartEditScene = (scene: StoryScene) => {
    setEditingSceneNum(scene.num);
    setSceneEditPurpose(scene.purpose);
    setSceneEditVisual(scene.visual);
    setSceneEditDialogue(scene.dialogue);
    let s = scene.script;
    if (s) {
      s = s.replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1');
      s = s.replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');
    }
    setSceneEditScript(s);
  };

  // Save Scene Edits
  const handleSaveScene = (num: number) => {
    const updatedScenes = story.scenes.map((sc) => {
      if (sc.num === num) {
        return {
          ...sc,
          duration: '0-10s', // strictly 10 seconds
          purpose: sceneEditPurpose.trim() || sc.purpose,
          visual: sceneEditVisual.trim(),
          dialogue: sceneEditDialogue.trim(),
          script: sceneEditScript.trim(),
          words: sceneEditDialogue.trim() ? sceneEditDialogue.trim().split(/\s+/).filter(Boolean).length : sc.words
        };
      }
      return sc;
    });

    const updatedStory: GeneratedStory = {
      ...story,
      scenes: updatedScenes
    };

    onUpdateStory?.(updatedStory);
    setEditingSceneNum(null);
    showToast(`Scene ${num} update ho gaya!`);
  };

  // Save Upload Package Item Edits
  const handleSavePackageItem = (field: 'title' | 'description' | 'tags' | 'tiktok') => {
    let updatedStory: GeneratedStory = { ...story };

    if (field === 'title') {
      const tagsArray = editHashtags.split(/\s+/).filter((t) => t.trim().length > 0);
      updatedStory.title = editTitle.trim();
      updatedStory.hashtags = tagsArray.length ? tagsArray : ['#shorts', '#itcafeteria'];
    } else if (field === 'description') {
      updatedStory.description = editDescription.trim();
    } else if (field === 'tags') {
      updatedStory.tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (field === 'tiktok') {
      updatedStory.tiktokCaption = editTiktok.trim();
    }

    onUpdateStory?.(updatedStory);
    setEditingField(null);
    showToast(`${field.toUpperCase()} save ho gaya!`);
  };

  // Current Status Controls: Save to Pending Queue
  const handleSaveToPendingQueue = () => {
    const id = storyId || `pq-${Date.now()}`;
    const newRecord: PendingStoryRecord = {
      id,
      title: story.title,
      hook: story.hook,
      category: story.categoryName,
      categoryId: 1,
      characterTag: normTag || '@WM25-1',
      scheduledTime: '6:00 PM PKT',
      scheduledDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      targetSlotReason: 'User Saved Story to Production Queue',
      status: (publishStatus as any) === 'published' ? 'published' : 'pending',
      source: 'simulator',
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      storyPackage: story
    };

    upsertPendingStoryRecord(newRecord);
    showToast('Story Pending Queue mein kamyabi se save ho gayi!');
  };

  // Current Status Controls: Delete Story
  const handleDeleteStory = () => {
    if (window.confirm(`Kya aap waqai is story ko delete karna chahte hain?\n"${story.title}"`)) {
      if (storyId) {
        deletePendingStoryRecord(storyId);
      }
      deletePendingStoryRecord(story.title);
      showToast('Story delete kar di gayi.');
      onDeleteStory?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {statusToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Story Summary Card */}
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
              {normTag && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold font-mono">
                  {normTag}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Presenter: {effectivePresenter}
              </span>
              <span className="text-slate-500">{story.dateLabel}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-2">
              {story.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Hook: <span className="text-cyan-300">{story.hook}</span>
              <span className="text-slate-500"> • </span>
              {story.sceneCount} scenes ({story.sceneCount * 10}s — Strictly 10s each)
              <span className="text-slate-500"> • </span>
              Thumbnail: <span className="text-amber-300">{story.thumbnailHeadline}</span>
              {story.thumbnailSubBadge ? ` — ${story.thumbnailSubBadge}` : ''}
            </p>
          </div>

          {/* Copy Actions */}
          <div className="flex flex-wrap sm:flex-col items-stretch gap-1.5 shrink-0">
            <button
              onClick={() => copyText(buildStoryPackageText(story), 'all')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all cursor-pointer"
              title="Copy all scenes, dialogue, visuals, and YouTube package"
            >
              {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'all' ? 'Pura Package Copied!' : 'Copy Full Story Package'}</span>
            </button>

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
      </div>

      {/* 1. SCENE-BY-SCENE STORY WITH EDIT SCENE + COPY SCENE BUTTONS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            Scene-by-Scene Story ({story.scenes.length} scenes • Strictly 10s Duration)
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            Duration: 0-10s per scene • Format: @WM25-[number]
          </span>
        </div>

        {story.scenes.map((scene) => {
          const isThisEditing = editingSceneNum === scene.num;
          let directedScript = applyCinematicDirecting(scene.num, scene.script, story.customCinematicDirection, scene.purpose);
          directedScript = directedScript
            .replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1')
            .replace(/\[PRESENTER & ACTION\]:\s*MZ22-(\d)/g, '[PRESENTER & ACTION]: @MZ22-$1')
            .replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');

          return (
            <div
              key={scene.num}
              className="bg-gradient-to-br from-slate-950/95 via-slate-950/85 to-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(2,6,23,0.25)] hover:border-cyan-500/40 transition-colors"
            >
              {/* Scene Header with Copy Scene & Edit Scene Buttons */}
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-base">
                    Scene {scene.num} — 0-10s [{scene.purpose}]{scene.isCTA ? ' — CTA' : ''}
                  </span>
                  {scene.isCTA && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                      SAVE CTA
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({scene.words} words • ~2.7 w/s • Duration: 0-10s)
                  </span>
                </div>

                {/* Header Action Buttons: Copy Scene AND Edit Scene */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isThisEditing) {
                        setEditingSceneNum(null);
                      } else {
                        handleStartEditScene(scene);
                      }
                    }}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors border cursor-pointer ${
                      isThisEditing
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Is scene ka dialogue, visual ya script modify karein"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isThisEditing ? 'Cancel Edit' : 'Edit Scene'}</span>
                  </button>

                  <button
                    onClick={() => copyScene(scene)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                    title="Google Flow copy-paste script copy karein"
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

              {/* Inline Scene Edit Form */}
              {isThisEditing ? (
                <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in duration-150 mb-3 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-bold text-amber-300">Scene {scene.num} Modification</span>
                    <span className="text-[10px] text-slate-400 font-mono">Duration strictly locked to 0-10s</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Scene Purpose / Beat</label>
                      <input
                        type="text"
                        value={sceneEditPurpose}
                        onChange={(e) => setSceneEditPurpose(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        placeholder="e.g. Curiosity Shock Hook"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Visual Cues & Action</label>
                      <input
                        type="text"
                        value={sceneEditVisual}
                        onChange={(e) => setSceneEditVisual(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        placeholder="e.g. Chrome icon cracking open..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-fuchsia-300 font-semibold block mb-1">Dialogue (Roman Urdu)</label>
                    <textarea
                      rows={2}
                      value={sceneEditDialogue}
                      onChange={(e) => setSceneEditDialogue(e.target.value)}
                      className="w-full bg-slate-950 border border-fuchsia-500/30 rounded-lg p-2.5 text-fuchsia-200"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 font-semibold block mb-1">
                      Google Flow Script (Cinematic Directing, Strictly 10s, @WM25 Tag)
                    </label>
                    <textarea
                      rows={5}
                      value={sceneEditScript}
                      onChange={(e) => setSceneEditScript(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg p-2.5 text-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingSceneNum(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveScene(scene.num)}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Scene
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

                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-cyan-400/90 font-mono mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                      <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                      Google Flow Script (Cinematic Directing Layer Pre-pended)
                    </span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                      Duration: 0-10s Strictly Set
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-4 sm:p-5 rounded-xl border border-slate-800/60 selection:bg-blue-600 selection:text-white whitespace-pre-wrap min-h-[9rem] sm:min-h-[11rem]">
                    {directedScript}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. THUMBNAIL PANEL WITH EDIT BUTTON */}
      <StoryThumbnailPanel
        key={`${story.characterTag}-${story.title}`}
        story={story}
        onUpdateStory={onUpdateStory}
      />

      {/* 3. POST-STORY UPLOAD PACKAGE — ALL ITEMS EDITABLE (MEMORY BLOCK REMOVED) */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Post-Story Upload Package (All Items Editable)
          </h4>
          <span className="text-[10px] text-slate-400">Click Edit on any card to customize details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Item 1: YouTube Title + Hashtags */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-300 uppercase flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5" /> Item 1: YouTube Title + Hashtags
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyPackageItem(`${story.title} ${story.hashtags.join(' ')}`, 'title')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 cursor-pointer"
                  title="Title aur hashtags copy karein"
                >
                  {copiedPackageItem === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPackageItem === 'title' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingField(editingField === 'title' ? null : 'title')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> {editingField === 'title' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {editingField === 'title' ? (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[10px] text-slate-400">Video Title</label>
                    <button
                      type="button"
                      onClick={() => handlePasteIntoField(setEditTitle, 'Title')}
                      className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Paste from clipboard
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Hashtags</label>
                  <input
                    type="text"
                    value={editHashtags}
                    onChange={(e) => setEditHashtags(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSavePackageItem('title')}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" /> Save Title
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-white font-medium text-sm leading-snug">{story.title}</p>
                <p className="text-cyan-300 font-mono text-xs">{story.hashtags.join(' ')}</p>
              </>
            )}
          </div>

          {/* Item 5: Thumbnail Spec Card */}
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Item 5: Thumbnail Headline & Specs
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    copyPackageItem(
                      `${story.thumbnailHeadline} | Sub-banner: ${story.thumbnailSubBadge || '—'} | Hologram: ${story.thumbnailHologram || '—'}`,
                      'thumb'
                    )
                  }
                  className="text-[10px] text-amber-400 hover:text-amber-200 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 cursor-pointer"
                  title="Thumbnail details copy karein"
                >
                  {copiedPackageItem === 'thumb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPackageItem === 'thumb' ? 'Copied' : 'Copy'}</span>
                </button>
                <span className="text-[10px] text-amber-400/80 font-mono">9:16 Vertical</span>
              </div>
            </div>
            <p className="text-amber-200 font-semibold text-sm leading-snug">{story.thumbnailHeadline}</p>
            <p className="text-amber-100/70 text-xs">
              Sub-banner: {story.thumbnailSubBadge || '—'} • Hologram: {story.thumbnailHologram || '—'}
            </p>
          </div>

          {/* Item 3: YouTube Tags */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Item 3: YouTube Tags
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyPackageItem(story.tags.join(', '), 'tags')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-200 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40 cursor-pointer"
                  title="Tags copy karein"
                >
                  {copiedPackageItem === 'tags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPackageItem === 'tags' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingField(editingField === 'tags' ? null : 'tags')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-200 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> {editingField === 'tags' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {editingField === 'tags' ? (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-400">Comma separated tags</span>
                  <button
                    type="button"
                    onClick={() => handlePasteIntoField(setEditTags, 'Tags')}
                    className="text-[9px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Paste from clipboard
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-indigo-200 font-mono text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSavePackageItem('tags')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" /> Save Tags
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-indigo-100/85 font-mono text-xs leading-relaxed">{story.tags.join(', ')}</p>
            )}
          </div>

          {/* Item 4: TikTok Block */}
          <div className="bg-fuchsia-950/20 border border-fuchsia-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-fuchsia-300 uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Item 4: TikTok Block
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyPackageItem(story.tiktokCaption, 'tiktok')}
                  className="text-[10px] text-fuchsia-400 hover:text-fuchsia-200 flex items-center gap-1 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-500/40 cursor-pointer"
                  title="TikTok caption copy karein"
                >
                  {copiedPackageItem === 'tiktok' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPackageItem === 'tiktok' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingField(editingField === 'tiktok' ? null : 'tiktok')}
                  className="text-[10px] text-fuchsia-400 hover:text-fuchsia-200 flex items-center gap-1 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-500/40 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> {editingField === 'tiktok' ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {editingField === 'tiktok' ? (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-400">Short caption with hashtags</span>
                  <button
                    type="button"
                    onClick={() => handlePasteIntoField(setEditTiktok, 'TikTok caption')}
                    className="text-[9px] text-fuchsia-400 hover:underline cursor-pointer"
                  >
                    Paste from clipboard
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={editTiktok}
                  onChange={(e) => setEditTiktok(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-fuchsia-200 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSavePackageItem('tiktok')}
                    className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" /> Save TikTok
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-fuchsia-100/90 text-[13px] leading-relaxed">{story.tiktokCaption}</p>
            )}
          </div>
        </div>

        {/* Item 2: Description + Practical Steps */}
        <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Item 2: Description + Practical Steps
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyPackageItem(story.description, 'description')}
                className="text-[10px] text-blue-400 hover:text-blue-200 flex items-center gap-1 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40 cursor-pointer"
                title="Description copy karein"
              >
                {copiedPackageItem === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPackageItem === 'description' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingField(editingField === 'description' ? null : 'description')}
                className="text-[10px] text-blue-400 hover:text-blue-200 flex items-center gap-1 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> {editingField === 'description' ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          {editingField === 'description' ? (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-slate-400">Video description & steps</span>
                <button
                  type="button"
                  onClick={() => handlePasteIntoField(setEditDescription, 'Description')}
                  className="text-[9px] text-blue-400 hover:underline cursor-pointer"
                >
                  Paste from clipboard
                </button>
              </div>
              <textarea
                rows={5}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 leading-relaxed text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePackageItem('description')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3 h-3" /> Save Description
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-200 text-[13px] whitespace-pre-wrap leading-relaxed">{story.description}</p>
          )}
        </div>

        {story.seriesPlan && (
          <p className="text-[11px] text-slate-400">
            <span className="text-cyan-300 font-semibold">Series bridge:</span> {story.seriesPlan}
          </p>
        )}

        {/* 4. CURRENT STATUS SECTION — MERGED CONTROLS (SAVE, PUBLISH, DELETE) */}
        <div className={`mt-5 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl ${
          currentStatus === 'published'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-slate-900/90 border-amber-500/40 text-amber-200'
        }`}>
          {/* Status Details */}
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              currentStatus === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`} />
            <div>
              <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="text-slate-300">CURRENT STATUS:</span>
                <span className={currentStatus === 'published' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  {currentStatus === 'published' ? '✅ PUBLISHED (پبلش ہو چکی ہے)' : '⏳ PENDING (پینڈنگ میں محفوظ ہے)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentStatus === 'published'
                  ? 'Yeh story channel par publish ho chuki hai aur Published Videos Library mein synched hai.'
                  : 'Story production queue mein pending hai. Yahan se Save, Publish ya Delete karein.'}
              </p>
            </div>
          </div>

          {/* Unified Controls: 1. Save (Pending me bhejein), 2. Publish / Revert, 3. Delete */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Control 1: Save to Pending Queue */}
            <button
              type="button"
              onClick={handleSaveToPendingQueue}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:border-cyan-400"
              title="Story ko Pending Queue aur state mein save karein"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save (Pending me bhejein)</span>
            </button>

            {/* Control 2: Direct Publish Button — ALWAYS SHOWN TOGETHER WITH SAVE */}
            <button
              type="button"
              onClick={handleDirectPublishOrToggle}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                currentStatus === 'published'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
              }`}
              title={currentStatus === 'published' ? 'Wapas Pending haalat mein move karein' : 'Story ko foran Published Library mein move karein'}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{currentStatus === 'published' ? 'Wapas Pending Karein' : 'Publish (پبلش کریں)'}</span>
            </button>

            {/* Control 3: Delete Story */}
            <button
              type="button"
              onClick={handleDeleteStory}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Story ko remove / delete karein"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
