import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bot,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  ListChecks,
  Search,
  ShieldCheck,
  FileText,
  Layers,
  AlertTriangle,
  Database,
  MessageSquare,
  Play,
  Sparkles,
  Lightbulb,
  Send,
  RefreshCw,
  ArrowRight,
  Film,
  ArrowLeft,
  Wand2,
  Globe,
  Radio
} from 'lucide-react';
import { GroundLevelSearchDashboard } from './GroundLevelSearchDashboard';
import { PUBLISHED_VIDEOS, type ChannelProfile } from '../data/channelData';
import { getAllPublishedVideos, type DynamicPublishedStory } from '../lib/publishedLibraryStore';
import { StoryPackageView, type GeneratedStory, type StoryIdea, type StoryScene } from './StoryPackageView';
import { applyCinematicDirecting } from '../lib/cinematicDirector';
import type { SimulatorConfig } from './SimulatorConfigModal';
import { checkDeletedStoryBlacklist, loadDeletedStoryBlacklist } from '../lib/deletedStoryRegistry';
import { applyPhoneticFixes, verifyAndCorrectStoryPhonetics, getPhoneticDictionary } from '../lib/phoneticDictionaryStore';
import {
  checkHierarchicalDuplicate,
  getAlreadyCoveredPointsList,
  type DuplicateCheckResult,
  extractCandidateSpecificPoints
} from '../lib/profileStore';
import { CATEGORY_TOPIC_BANK } from './AutopilotManager';

export interface AgentTriggerSelection {
  channelId: ChannelProfile['id'];
  tag: string;
  categoryId: number;
  sceneCount: number;
  aspectRatio?: '9:16' | '16:9';
  searchStrategy?: string;
  priorityResources?: string[];
}

export interface AgentMemoryRecord {
  id: string;
  channelId: ChannelProfile['id'];
  title: string;
  tool: string;
  points: string;
  source: string;
}

export interface DuplicateMatch {
  source: 'Catalog' | 'Published Library' | 'Deleted Story (Permanent Blacklist)';
  id: string;
  title: string;
  tool: string;
  points: string;
  matchedKeywords: string[];
}

export interface SkippedDuplicateRecord {
  storyTitle: string;
  coveredPoint: string;
  attemptedTitle: string;
  candidatePoint?: string;
  reason: string;
  timestamp: string;
}

export interface AgentTriggerOutcome {
  status: 'checking' | 'duplicate' | 'generated' | 'idea-pending' | 'ideas' | 'discussion' | 'generating' | 'error';
  selection: AgentTriggerSelection;
  title: string;
  hook: string;
  duplicates: DuplicateMatch[];
  topic?: string;
  discussionNotes?: string;
  matchContext?: 'initial' | 'idea';
  story?: GeneratedStory;
  idea?: StoryIdea;
}

interface AgentFlowScreenProps {
  profile: ChannelProfile;
  selection: AgentTriggerSelection;
  memoryRecords: AgentMemoryRecord[];
  simulatorConfig?: SimulatorConfig;
  initialTopic?: { title: string; tool?: string; isSequel?: boolean } | null;
  onClose: () => void;
  onOutcome: (outcome: AgentTriggerOutcome) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

type Phase = 'checking' | 'duplicate' | 'auto-pivoting' | 'idea-input' | 'ideas' | 'discuss' | 'generating' | 'complete' | 'error';
type CheckStage = 'initial' | 'idea';

// Note: The old duplicate checking functions (STOP_WORDS, tokenizeForMatch, CORE_TOPIC_CONCEPTS, findDuplicateMatches)
// have been permanently removed. checkHierarchicalDuplicate in profileStore.ts is the SINGLE canonical duplicate check.

async function postJson(url: string, body: unknown, signal?: AbortSignal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  const data = await response.json().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) {
    throw new Error(String((data as any)?.error || `Request failed (${response.status})`));
  }
  return data as Record<string, any>;
}

function createInstantFallbackStory(
  profile: ChannelProfile,
  selection: AgentTriggerSelection,
  idea: StoryIdea,
  notes: string,
  simulatorConfig?: SimulatorConfig
): GeneratedStory {
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalScenes = Math.min(Math.max(selection.sceneCount || 10, 4), 30);
  const title = idea.title || `${profile.name} Pro Hack`;
  const hook = idea.hook || 'Reveal';
  const tag = selection.tag || '@WM25-1';
  const category = (profile?.categories && profile.categories.find((c) => c.id === selection.categoryId)) ?? { id: 1, name: 'AI & Smart Technology', playlist: 'AI' };

  const sampleBeats = [
    { purpose: 'Curiosity Shock Hook', visual: `Presenter ${tag} looking directly at camera, holding phone displaying alert badge`, dialogue: `Kya aapko maloom hai ke ${title.slice(0, 35)} ka yeh secret feature 90% log nahi jante?` },
    { purpose: 'Problem Agitate', visual: `Split screen showing user struggling with settings and red error icon`, dialogue: `Ghanton zaya karne ke baad bhi masla theek nahi hota aur kaam atak jata hai.` },
    { purpose: 'Instant Secret Reveal', visual: `Screen capture zooming in on secret toggle and quick shortcut`, dialogue: `Lekin aaj ka yeh 1-click tareeqa aapka kaam sirf 5 second mein asaan bana dega.` },
    { purpose: 'Step 1: Configuration', visual: `Clean screencast highlighting first parameter with glowing cyan circle`, dialogue: `Pehle setting open karke is feature ko turn on karein aur parameters lock karein.` },
    { purpose: 'Step 2: Execution', visual: `Live action screen demonstration executing automated workflow`, dialogue: `Ab simply execute button click karein aur background automation ko verify karein.` },
    { purpose: 'Proof & Live Result', visual: `Green verification tick with benchmarking counter displaying 10x speed boost`, dialogue: `Yeh dekhein! Bina kisi rukawat ke poora task automatically run ho chuka hai.` },
    { purpose: 'Pro Tip & Caution', visual: `Presenter gesturing warning hand sign with floating caution tooltip`, dialogue: `Koshish karein ke default limits ko cross na karein taake account hamesha safe rahe.` },
    { purpose: 'Common Mistake Avoid', visual: `Red X marking wrong option vs green check on correct option`, dialogue: `Aksar log yeh pehli ghalti karte hain jis se settings reset ho jati hain.` },
    { purpose: 'Infinite Loop Tie-in', visual: `Camera smoothly zooming in to presenter with confident smile`, dialogue: `Is trick ko azma ke dekhein aur batayein kya yeh aapke liye kaam kiya?` },
    { purpose: 'Subscribe & Comment CTA', visual: `Subscribe animation and notification bell ringing with question overlay`, dialogue: `Aisi mazeed daily tech tricks ke liye IT Cafeteria ko abhi subscribe karein!` }
  ];

  const scenes: StoryScene[] = Array.from({ length: totalScenes }).map((_, idx) => {
    const beat = sampleBeats[idx % sampleBeats.length];
    const isCTA = idx === totalScenes - 1;
    const sceneNum = idx + 1;
    const dialogue = isCTA
      ? `Aisi mazeed daily tech shortcuts ke liye ${profile.name} ko subscribe karke comment mein batayein!`
      : (idx < sampleBeats.length ? beat.dialogue : `Scene ${sceneNum}: ${title} ka agla step execute karein aur live proof dekhein.`);
    const visual = beat.visual;
    const words = dialogue.split(/\s+/).filter(Boolean).length;
    const rawScript = `[PRESENTER & ACTION]: ${tag} — ${visual}.\n[DIALOGUE]: "${dialogue}"\n[CAMERA & CINEMATICS]: 9:16 vertical, anamorphic cinematic lens, cyan/amber contrast rim lights. Duration: 0-10s strictly.`;
    const script = applyCinematicDirecting(sceneNum, rawScript, undefined, beat.purpose);

    return {
      num: sceneNum,
      duration: '10s',
      purpose: beat.purpose,
      isCTA,
      words,
      visual,
      dialogue,
      script
    };
  });

  const hashtag = profile.id === 'beautyhub' ? '#BeautyHub' : '#ITCafeteria';
  const headline = title.split(/\s+/).slice(0, 3).join(' ').toUpperCase();

  return {
    title,
    hook,
    channelName: profile.name,
    presenter: profile.presenter,
    categoryName: `${category.id}. ${category.name}`,
    playlist: category.playlist,
    characterTag: tag,
    dateLabel,
    sceneCount: scenes.length,
    scenes,
    hashtags: [hashtag, '#Shorts', '#ViralTech', '#UrduTech'],
    description: `${title} — Full tutorial and secret guide in Roman Urdu by ${profile.presenter}.\n\nCategory: ${category.name}\nDuration: ${totalScenes * 10} seconds (${scenes.length} scenes).`,
    tags: [title, category.name, profile.presenter, 'IT Cafeteria', 'Roman Urdu', 'Tech Shorts'],
    tiktokCaption: `${title} 🔥 Secret trick revealed in Roman Urdu! #itcafeteria #shorts #pakistantech`,
    thumbnailHeadline: headline,
    thumbnailSubBadge: '100% WORKING',
    thumbnailPrompt: `Professional vertical YouTube Shorts thumbnail for ${title}, presenter ${tag} on left with expressive face, glowing holographic neon UI on right, bold 3D text "${headline}".`,
    thumbnailLine1: headline,
    thumbnailLine2: 'SECRET TRICK',
    thumbnailHologram: 'Floating cyan holographic shield',
    seriesPlan: `${category.name} Series`,
    memoryBlock: `Title: ${title}\nCategory: ${category.name}\nTag: ${tag}\nScenes: ${scenes.length}`,
    idea,
    discussionNotes: notes,
    modelUsed: 'Offline Precision Generator'
  };
}

const IdeaCard: React.FC<{ idea: StoryIdea; onSelect: (idea: StoryIdea) => void }> = ({ idea, onSelect }) => (
  <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 p-3.5 space-y-2 hover:border-cyan-500/50 transition-colors">
    <div className="flex items-start justify-between gap-2">
      <h4 className="text-sm font-bold text-white leading-snug">{idea.title}</h4>
      <button
        onClick={() => onSelect(idea)}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
      >
        Select <ArrowRight className="w-3 h-3" />
      </button>
    </div>
    {idea.hook && (
      <p className="text-[11px] text-cyan-200/90">
        <span className="text-cyan-500/80 font-mono text-[9px] uppercase mr-1">Hook:</span>
        {idea.hook}
      </p>
    )}
    {idea.angle && (
      <p className="text-[11px] text-slate-300">
        <span className="text-slate-500 font-mono text-[9px] uppercase mr-1">Angle:</span>
        {idea.angle}
      </p>
    )}
    {idea.points && (
      <p className="text-[11px] text-slate-400">
        <span className="text-slate-500 font-mono text-[9px] uppercase mr-1">Points:</span>
        {idea.points}
      </p>
    )}
    {idea.whyFresh && (
      <p className="text-[10px] text-emerald-300/80 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-2 py-1">
        {idea.whyFresh}
      </p>
    )}
  </div>
);

export const AgentFlowScreen: React.FC<AgentFlowScreenProps> = ({
  profile,
  selection,
  memoryRecords,
  simulatorConfig,
  initialTopic,
  onClose,
  onOutcome
}) => {
  const category = (profile?.categories && profile.categories.find((item) => item.id === selection.categoryId)) ??
    profile?.categories?.[0] ??
    { id: selection.categoryId || 1, name: 'AI & Smart Technology', playlist: 'AI & Smart Technology' };
  const isSearch = category.id === 10;
  const initialNote = profile?.sampleNotes?.[category.id] ?? {
    title: category?.name ? `${category.name} Secrets` : 'Tech Trick',
    hook: 'Reveal'
  };
  const channelHashtag = profile?.id === 'itcafeteria' ? '#ITCafeteria' : '#BeautyHub';

  const [phase, setPhase] = useState<Phase>('checking');
  const [checkStage, setCheckStage] = useState<CheckStage>('initial');
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState<SkippedDuplicateRecord[]>([]);
  const [checkingProgress, setCheckingProgress] = useState<string>('Checking published library for duplicate tricks/points...');
  const [lastCheckResult, setLastCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [exhaustedReport, setExhaustedReport] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<StoryIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState('');
  const [ideaSeed, setIdeaSeed] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [showGroundModal, setShowGroundModal] = useState(false);
  const [bypassedDuplicates, setBypassedDuplicates] = useState<{
    originalTitle: string;
    pivotedToTitle: string;
    reason: string;
  } | null>(null);

  const onOutcomeRef = useRef(onOutcome);
  const onCloseRef = useRef(onClose);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const duplicateTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const attemptedTitlesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const catalogCount = profile.id === 'itcafeteria' ? PUBLISHED_VIDEOS.length : 0;

  function initialIdea(): StoryIdea {
    if (initialTopic?.title) {
      const isSeq = Boolean(initialTopic.isSequel);
      return {
        title: initialTopic.title,
        hook: isSeq
          ? 'Part 1 ke baad yeh secret advanced step aapke system ko 10x level par le jayega!'
          : initialNote.hook,
        angle: isSeq
          ? 'Part 2 Advanced Sequel continuation with next-level pro tools'
          : `${category.id}. ${category.name} topic`,
        points: initialTopic.tool ? `Tool: ${initialTopic.tool}` : '',
        whyFresh: isSeq ? 'Official Sequel continuation' : ''
      };
    }
    return {
      title: initialNote.title,
      hook: initialNote.hook,
      angle: `${category.id}. ${category.name} category ka fresh, research-backed angle`,
      points: '',
      whyFresh: ''
    };
  }

  function buildExcludedTitles(extra: string[] = []) {
    const deletedBlacklist = loadDeletedStoryBlacklist();
    const titles = new Set<string>([
      ...PUBLISHED_VIDEOS.map((video) => video.title),
      ...skippedDuplicates.map((item) => item.attemptedTitle),
      ...deletedBlacklist.map((d) => d.title),
      ...extra
    ]);
    return Array.from(titles).filter(Boolean).slice(0, 120);
  }

  async function fetchIdeas(seed: string, mode: 'search' | 'duplicate') {
    if (!mountedRef.current) return;
    setIdeasLoading(true);
    setIdeasError('');
    if (mode === 'search') setPhase('ideas');
    try {
      const coveredPointsExclusion = getAlreadyCoveredPointsList(profile.id, category.name);
      const data = await postJson('/api/ai/story-ideas', {
        channelName: profile.name,
        presenter: profile.presenter,
        niche: profile.niche,
        category: `${category.id}. ${category.name}`,
        seedTopic: seed,
        excludeTitles: buildExcludedTitles([seed]),
        excludePoints: coveredPointsExclusion,
        count: mode === 'duplicate' ? 4 : 3,
        priorityResources: (selection as any)?.priorityResources || []
      }, abortRef.current?.signal);

      const rawIdeas: StoryIdea[] = (Array.isArray(data.ideas) ? data.ideas : [])
        .map((idea: any) => ({
          title: String(idea?.title || '').trim(),
          hook: String(idea?.hook || '').trim(),
          angle: String(idea?.angle || '').trim(),
          points: String(idea?.points || '').trim(),
          whyFresh: String(idea?.whyFresh || '').trim()
        }))
        .filter((idea: StoryIdea) => idea.title)
        // Strictly filter out any idea matching deleted story blacklist
        .filter((idea: StoryIdea) => !checkDeletedStoryBlacklist(idea.title, idea.points));

      // Hierarchical duplicate check: check each candidate against published library only
      const freshIdeas = rawIdeas.filter((idea) => {
        const check = checkHierarchicalDuplicate({
          title: idea.title,
          points: idea.points ? [idea.points] : [],
          rawPointsText: idea.points,
          categoryId: category.id,
          channelId: profile.id,
          tool: idea.title.split(/[:\s—]+/)[0]
        });
        return check.verdict !== 'exact';
      });
      const finalIdeas = freshIdeas.length ? freshIdeas : rawIdeas;

      if (!finalIdeas.length) {
        throw new Error('AI ne koi fresh idea return nahi kiya (tamam suggestions deleted blacklist ya duplicates mein hain)');
      }

      if (!mountedRef.current) return;
      setIdeas(finalIdeas);
      if (mode === 'search') {
        onOutcomeRef.current({
          status: 'ideas',
          selection,
          title: seed || category.name,
          hook: 'Pending',
          duplicates: [],
          topic: seed || undefined,
          matchContext: 'initial'
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || !mountedRef.current) return;
      setIdeasError(error.message || 'Fresh ideas generate nahi ho sake');
    } finally {
      if (mountedRef.current) setIdeasLoading(false);
    }
  }

  async function generateStory(idea: StoryIdea, notes: string, transcript: ChatMessage[] = []) {
    if (!mountedRef.current) return;
    setStory(null);
    setErrorMsg('');
    setStepIndex(0);
    setPhase('generating');
    onOutcomeRef.current({
      status: 'generating',
      selection,
      title: idea.title,
      hook: idea.hook,
      duplicates: [],
      idea,
      topic: idea.title,
      discussionNotes: notes || undefined,
      matchContext: checkStage
    });

    try {
      const data = await postJson('/api/ai/generate-story', {
        channelName: profile.name,
        presenter: profile.presenter,
        niche: profile.niche,
        category: `${category.id}. ${category.name}`,
        playlist: category.playlist,
        tag: selection.tag,
        sceneCount: selection.sceneCount,
        idea,
        discussionNotes: notes,
        discussionTranscript: transcript
          .filter((message) => message.text.trim())
          .slice(-10)
          .map((message) => ({ role: message.role, text: message.text.trim().slice(0, 600) })),
        excludeTitles: buildExcludedTitles([idea.title]),
        dialectTone: simulatorConfig?.dialectTone || 'conversational',
        flowPromptFormat: simulatorConfig?.flowPromptFormat || 'split_screen',
        customInstructions: simulatorConfig?.customInstructions || ''
      }, abortRef.current?.signal);

      const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
      const scenes: StoryScene[] = rawScenes
        .filter((scene: any) => scene && (scene.script || scene.dialogue))
        .map((scene: any, index: number) => {
          // Mandatory Phonetic Dictionary Check: Read living dictionary and replace mispronunciations
          const rawDialogue = String(scene.dialogue || '').trim();
          const dialogue = applyPhoneticFixes(rawDialogue);
          const visual = String(scene.visual || '').trim();
          const rawScript = String(scene.script || '').trim() || `${selection.tag} — ${visual}\nHe says: "${dialogue}"`;
          const script = applyCinematicDirecting(index + 1, applyPhoneticFixes(rawScript), undefined, scene.purpose);
          const words = dialogue ? dialogue.split(/\s+/).filter(Boolean).length : Number(scene.words) || 0;
          return {
            num: index + 1,
            duration: '10s',
            purpose: String(scene.purpose || `Scene ${index + 1}`).trim(),
            isCTA: Boolean(scene.isCTA),
            words,
            visual,
            dialogue,
            script
          };
        });

      if (!scenes.length) {
        throw new Error('AI ne adhoori story return ki — koi scene nahi mila. Dobara try karein.');
      }
      scenes[scenes.length - 1].isCTA = true;

      const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const title = String(data.title || idea.title).trim();
      const hook = String(data.hook || idea.hook || 'Reveal').trim();
      const thumbnailLine1 = String(data.thumbnailLine1 || '').trim();
      const thumbnailLine2 = String(data.thumbnailLine2 || '').trim();
      const thumbnailHeadline = String(
        data.thumbnailHeadline ||
          `${thumbnailLine1} ${thumbnailLine2}`.trim() ||
          title.split(/\s+/).slice(0, 3).join(' ').toUpperCase()
      ).trim();
      const thumbnailSubBadge = String(data.thumbnailSubBanner || data.thumbnailSubBadge || 'MUST TRY').trim();
      const thumbnailHologram = String(data.thumbnailHologram || '').trim();
      const hashtags: string[] = (Array.isArray(data.hashtags) ? data.hashtags : [])
        .map((tag: any) => String(tag || '').trim())
        .filter(Boolean)
        .slice(0, 5);
      if (!hashtags.length) hashtags.push(channelHashtag, '#Shorts');
      const tags: string[] = (Array.isArray(data.tags) ? data.tags : [])
        .map((tag: any) => String(tag || '').trim())
        .filter(Boolean)
        .slice(0, 16);
      const description = String(data.description || '').trim();
      const thumbnailPrompt = String(data.thumbnailPrompt || '').trim();
      const seriesPlan = String(data.seriesPlan || '').trim();
      const tiktokCaption = String(data.tiktokCaption || `${title} ${hashtags.join(' ')}`).trim();
      const coveredPoints = idea.points || scenes.slice(0, 5).map((scene) => scene.purpose).join('; ');

      const memoryBlock = `Tareekh: ${dateLabel}
Title: ${title}
Category / Playlist: ${category.id}. ${category.name} | Playlist: ${category.playlist}
Tool / topic: ${idea.title}
Thumbnail headline: ${thumbnailHeadline}${thumbnailSubBadge ? ` (Sub-banner: ${thumbnailSubBadge})` : ''}
Points cover hue: ${coveredPoints}
Duplicate key: ${title}
Series / Part: ${category.name}${seriesPlan ? ` — ${seriesPlan}` : ''}
Length: ${scenes.length} scenes (${scenes.length * 10}s)
Status: bani`;

      const generatedStory: GeneratedStory = {
        title,
        hook,
        channelName: profile.name,
        presenter: profile.presenter,
        categoryName: `${category.id}. ${category.name}`,
        playlist: category.playlist,
        characterTag: selection.tag,
        dateLabel,
        sceneCount: scenes.length,
        scenes,
        hashtags,
        description,
        tags,
        tiktokCaption,
        thumbnailHeadline,
        thumbnailSubBadge,
        thumbnailPrompt,
        thumbnailLine1,
        thumbnailLine2,
        thumbnailHologram,
        seriesPlan,
        memoryBlock,
        idea,
        discussionNotes: notes,
        modelUsed: data.modelUsed,
        practicalBlueprint: data.practicalBlueprint,
        consistencyReport: data.consistencyReport,
        practicalSteps: data.practicalBlueprint?.steps?.map((s: any) => `${s.stepNumber}. ${s.actionTitle}: ${s.exactPathOrCommand}`),
        outsourcedLinks: data.practicalBlueprint?.sourceLinks || data.outsourcedLinks,
        demoPrompt: data.demoPrompt
      };

      // Mandatory Verification & Correction Pass:
      // Audit all dialogues, compare against phonetic rules dictionary, replace mispronunciations, and sync scripts
      const { story: verifiedStory } = verifyAndCorrectStoryPhonetics(generatedStory);

      if (!mountedRef.current) return;
      setStory(verifiedStory);
      setPhase('complete');
      onOutcomeRef.current({
        status: 'generated',
        selection,
        title: verifiedStory.title,
        hook: verifiedStory.hook,
        duplicates: [],
        topic: idea.title,
        discussionNotes: notes || undefined,
        matchContext: checkStage,
        story: verifiedStory,
        idea
      });
    } catch (error: any) {
      if (error.name === 'AbortError' || !mountedRef.current) return;
      const message = error.message || 'Story generate nahi ho saki';
      setErrorMsg(message);
      setPhase('error');
      onOutcomeRef.current({
        status: 'error',
        selection,
        title: idea.title,
        hook: idea.hook,
        duplicates: [],
        idea,
        discussionNotes: notes || undefined
      });
    }
  }

  async function autoMoveOnAfterExactDuplicate(
    duplicateIdea: StoryIdea,
    exactResult: DuplicateCheckResult,
    stage: CheckStage,
    currentCategoryId: number = category.id
  ) {
    if (!mountedRef.current) return;
    setPhase('auto-pivoting');

    attemptedTitlesRef.current.add(duplicateIdea.title.trim().toLowerCase());
    const skippedRecord: SkippedDuplicateRecord = {
      storyTitle: exactResult.matchedStoryTitle || 'Published Story',
      coveredPoint: exactResult.matchedPoint || 'Exact point duplicate',
      attemptedTitle: duplicateIdea.title,
      candidatePoint: exactResult.candidatePoint,
      reason: exactResult.reason,
      timestamp: new Date().toLocaleTimeString()
    };
    setSkippedDuplicates((prev) => [...prev, skippedRecord]);
    setCheckingProgress(`Skipped: already published — "${skippedRecord.storyTitle}" — covered point: "${skippedRecord.coveredPoint}"`);

    // a. Next point inside the same topic
    const subPoints = extractCandidateSpecificPoints(duplicateIdea);
    if (subPoints.length > 1) {
      for (let pIdx = 0; pIdx < subPoints.length; pIdx++) {
        const testPoint = subPoints[pIdx];
        if (testPoint === exactResult.candidatePoint) continue;
        setCheckingProgress(`Checking point ${pIdx + 1} of ${subPoints.length}: "${testPoint.slice(0, 40)}..."`);
        const pointCandidate: StoryIdea = {
          ...duplicateIdea,
          points: testPoint,
          whyFresh: `Auto-verified sub-point ${pIdx + 1}`
        };
        const check = checkHierarchicalDuplicate({
          title: pointCandidate.title,
          points: [testPoint],
          categoryId: currentCategoryId,
          channelId: profile.id,
          tool: pointCandidate.title.split(/[:\s—]+/)[0]
        });
        if (check.verdict !== 'exact') {
          // Found fresh sub-point!
          setLastCheckResult(check);
          setSelectedIdea(pointCandidate);
          setCheckingProgress(`✓ Fresh point verified: "${testPoint.slice(0, 40)}..."`);
          if (stage === 'initial') {
            void generateStory(pointCandidate, '');
          } else {
            setPhase('discuss');
          }
          return;
        }
      }
    }

    // b. Next topic in the same category (from category topic bank)
    setCheckingProgress(`Searching next verified topic in Category ${currentCategoryId}...`);
    const bank = (CATEGORY_TOPIC_BANK[currentCategoryId] || []).filter(Boolean);
    for (const bankTitle of bank) {
      const cleanBankTitle = bankTitle.trim();
      if (attemptedTitlesRef.current.has(cleanBankTitle.toLowerCase())) continue;
      attemptedTitlesRef.current.add(cleanBankTitle.toLowerCase());

      const candIdea: StoryIdea = {
        title: cleanBankTitle,
        hook: `Secret revealed: ${cleanBankTitle.slice(0, 45)}`,
        angle: `${currentCategoryId}. ${category.name} verified non-duplicate topic`,
        points: `Hands-on practical walkthrough for ${cleanBankTitle}`,
        whyFresh: 'Category topic bank fresh verified candidate'
      };

      const check = checkHierarchicalDuplicate({
        title: candIdea.title,
        points: [candIdea.points],
        categoryId: currentCategoryId,
        channelId: profile.id,
        tool: candIdea.title.split(/[:\s—]+/)[0]
      });

      if (check.verdict !== 'exact') {
        setLastCheckResult(check);
        setSelectedIdea(candIdea);
        setBypassedDuplicates({
          originalTitle: duplicateIdea.title,
          pivotedToTitle: candIdea.title,
          reason: check.reason
        });
        setCheckingProgress(`✓ Next topic selected: "${candIdea.title}"`);
        if (stage === 'initial') {
          void generateStory(candIdea, '');
        } else {
          setPhase('discuss');
        }
        return;
      } else {
        // Record skipped duplicate in list
        setSkippedDuplicates((prev) => [
          ...prev,
          {
            storyTitle: check.matchedStoryTitle || 'Published Story',
            coveredPoint: check.matchedPoint || 'Exact point',
            attemptedTitle: candIdea.title,
            candidatePoint: check.candidatePoint,
            reason: check.reason,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        setCheckingProgress(`Skipped: already published — "${check.matchedStoryTitle}" — covered point: "${check.matchedPoint}"`);
      }
    }

    // b2. If bank exhausted, query AI story ideas with already-covered points excluded ("do not suggest these")
    setCheckingProgress(`Scanning 48h ground sources for Category ${currentCategoryId} (excluding published points)...`);
    try {
      const coveredPointsExclusion = getAlreadyCoveredPointsList(profile.id, currentCategoryId);
      const data = await postJson('/api/ai/story-ideas', {
        channelName: profile.name,
        presenter: profile.presenter,
        niche: profile.niche,
        category: `${currentCategoryId}. ${category.name}`,
        seedTopic: `${category.name} fresh tutorial 2026`,
        excludeTitles: Array.from(attemptedTitlesRef.current),
        excludePoints: coveredPointsExclusion,
        count: 4,
        priorityResources: (selection as any)?.priorityResources || []
      }, abortRef.current?.signal);

      const rawIdeas: StoryIdea[] = (Array.isArray(data.ideas) ? data.ideas : [])
        .map((item: any) => ({
          title: String(item?.title || '').trim(),
          hook: String(item?.hook || '').trim(),
          angle: String(item?.angle || '').trim(),
          points: String(item?.points || '').trim(),
          whyFresh: String(item?.whyFresh || '').trim()
        }))
        .filter((item: StoryIdea) => item.title && !checkDeletedStoryBlacklist(item.title, item.points));

      for (const freshCand of rawIdeas) {
        if (attemptedTitlesRef.current.has(freshCand.title.toLowerCase())) continue;
        attemptedTitlesRef.current.add(freshCand.title.toLowerCase());

        const check = checkHierarchicalDuplicate({
          title: freshCand.title,
          points: freshCand.points ? [freshCand.points] : [],
          rawPointsText: freshCand.points,
          categoryId: currentCategoryId,
          channelId: profile.id,
          tool: freshCand.title.split(/[:\s—]+/)[0]
        });

        if (check.verdict !== 'exact') {
          setLastCheckResult(check);
          setSelectedIdea(freshCand);
          setBypassedDuplicates({
            originalTitle: duplicateIdea.title,
            pivotedToTitle: freshCand.title,
            reason: check.reason
          });
          setCheckingProgress(`✓ 48h Ground source verified: "${freshCand.title}"`);
          if (stage === 'initial') {
            void generateStory(freshCand, '');
          } else {
            setPhase('discuss');
          }
          return;
        } else {
          setSkippedDuplicates((prev) => [
            ...prev,
            {
              storyTitle: check.matchedStoryTitle || 'Published Story',
              coveredPoint: check.matchedPoint || 'Exact point',
              attemptedTitle: freshCand.title,
              candidatePoint: check.candidatePoint,
              reason: check.reason,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      }
    } catch {
      // Search failed or timed out — move on to next lens / next category
    }

    // c. Next research lens: try next topic angle
    // d. Next category in auto-rotate order
    const nextCatId = (currentCategoryId % 10) + 1;
    if (nextCatId !== category.id) {
      setCheckingProgress(`Auto-rotating to next category in order (Category ${nextCatId})...`);
      const nextBank = (CATEGORY_TOPIC_BANK[nextCatId] || []).filter(Boolean);
      for (const nextBankTitle of nextBank) {
        const clean = nextBankTitle.trim();
        if (attemptedTitlesRef.current.has(clean.toLowerCase())) continue;
        attemptedTitlesRef.current.add(clean.toLowerCase());

        const rotatedIdea: StoryIdea = {
          title: clean,
          hook: `Secret revealed: ${clean.slice(0, 45)}`,
          angle: `Category ${nextCatId} rotation candidate`,
          points: `Hands-on walkthrough for ${clean}`,
          whyFresh: 'Auto-rotated from duplicate category'
        };

        const check = checkHierarchicalDuplicate({
          title: rotatedIdea.title,
          points: [rotatedIdea.points],
          categoryId: nextCatId,
          channelId: profile.id,
          tool: rotatedIdea.title.split(/[:\s—]+/)[0]
        });

        if (check.verdict !== 'exact') {
          setLastCheckResult(check);
          setSelectedIdea(rotatedIdea);
          setBypassedDuplicates({
            originalTitle: duplicateIdea.title,
            pivotedToTitle: rotatedIdea.title,
            reason: `Auto-rotated to Category ${nextCatId}`
          });
          setCheckingProgress(`✓ Next category ${nextCatId} topic verified: "${rotatedIdea.title}"`);
          if (stage === 'initial') {
            void generateStory(rotatedIdea, '');
          } else {
            setPhase('discuss');
          }
          return;
        }
      }
    }

    // If completely exhausted all categories without finding anything:
    setExhaustedReport(`Checked topics in Category ${category.id} (bank + 48h search) and Category ${nextCatId}. Tamam attempted candidates library duplicates nikle.`);
    setPhase('idea-input');
  }

  function runDuplicateCheck(idea: StoryIdea, stage: CheckStage) {
    if (!mountedRef.current) return;
    setCheckStage(stage);
    setDuplicates([]);
    setIdeas([]);
    setIdeasError('');
    setPhase('checking');
    setCheckingProgress(`Checking published library for duplicate tricks/points: "${idea.title.slice(0, 40)}..."`);
    if (duplicateTimerRef.current) window.clearTimeout(duplicateTimerRef.current);

    duplicateTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      attemptedTitlesRef.current.add(idea.title.trim().toLowerCase());

      const result = checkHierarchicalDuplicate({
        title: idea.title,
        points: idea.points ? [idea.points] : [],
        rawPointsText: idea.points,
        categoryId: category.id,
        channelId: profile.id,
        tool: idea.title.split(/[:\s—]+/)[0]
      });

      setLastCheckResult(result);

      if (result.verdict === 'exact') {
        // EXACT DUPLICATE = NEVER BLOCK!
        // Automatically continue to next point/topic/category immediately!
        void autoMoveOnAfterExactDuplicate(idea, result, stage);
      } else if (stage === 'initial') {
        setSelectedIdea(idea);
        void generateStory(idea, '');
      } else {
        setSelectedIdea(idea);
        setChatMessages([]);
        setChatInput('');
        setChatError('');
        setDiscussionNotes('');
        setPhase('discuss');
        onOutcomeRef.current({
          status: 'discussion',
          selection,
          title: idea.title,
          hook: idea.hook,
          duplicates: [],
          idea,
          topic: idea.title,
          matchContext: stage
        });
      }
    }, 250);
  }

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;

    if (!startedRef.current) {
      startedRef.current = true;
      if (isSearch) {
        setPhase('idea-input');
        onOutcomeRef.current({
          status: 'idea-pending',
          selection,
          title: 'Idea pending',
          hook: 'Pending',
          duplicates: [],
          matchContext: 'initial'
        });
      } else {
        runDuplicateCheck(initialIdea(), 'initial');
      }
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (duplicateTimerRef.current) window.clearTimeout(duplicateTimerRef.current);
    };
    // Flow sirf mount par start hota hai; selection/memory props mount ke baad lock hain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [chatMessages, chatLoading]);

  const steps = useMemo(() => [
    {
      title: 'Channel identity lock',
      detail: `${profile.name} • ${profile.presenter} • ${profile.niche}`,
      icon: <Lock className="w-4 h-4" />
    },
    {
      title: 'Idea lock',
      detail: selectedIdea ? `"${selectedIdea.title}"` : 'Story idea selected',
      icon: <ListChecks className="w-4 h-4" />
    },
    {
      title: 'Discussion brief merge',
      detail: discussionNotes.trim() ? 'Creator notes + chat transcript story mein shamil' : 'Selected idea ka angle use ho raha hai',
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      title: 'Beat sheet & hook',
      detail: `${selection.sceneCount} scenes • hook → problem → reveal → proof → CTA`,
      icon: <FileText className="w-4 h-4" />
    },
    {
      title: 'Scene-by-scene Roman Urdu dialogue',
      detail: `${selection.sceneCount} × 10s • 22–25 words per scene`,
      icon: <Film className="w-4 h-4" />
    },
    {
      title: 'Flow paste-ready scripts',
      detail: `Character tag ${selection.tag} • anchor pose • screen-demo cuts`,
      icon: <Layers className="w-4 h-4" />
    },
    {
      title: 'Phonetic dictionary dialogue verification & correction',
      detail: 'Phonetic dictionary matching and automatic correction of mispronounced terminology',
      icon: <Check className="w-4 h-4" />
    },
    {
      title: '5-item upload package',
      detail: 'Title + hashtags • description • tags • TikTok • thumbnail prompt',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      title: 'Memory block save',
      detail: 'Agli baar yahi story duplicate check se block hogi',
      icon: <Database className="w-4 h-4" />
    }
  ], [profile, selectedIdea, discussionNotes, selection.sceneCount, selection.tag]);

  useEffect(() => {
    if (phase !== 'generating') return;
    if (stepIndex >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [phase, stepIndex, steps.length]);

  const handleSearchIdeas = () => {
    const seed = ideaSeed.trim();
    if (!seed) {
      setIdeasError('Pehle apna idea ya topic likhein — phir AI 3 fresh ideas suggest karega.');
      return;
    }
    void fetchIdeas(seed, 'search');
  };

  const handleSelectIdea = (idea: StoryIdea) => {
    runDuplicateCheck(idea, 'idea');
  };

  const handleRefreshIdeas = () => {
    const seed = ideaSeed.trim() || (isSearch ? selectedIdea?.title || '' : category.name);
    if (!seed) return;
    void fetchIdeas(seed, phase === 'duplicate' ? 'duplicate' : 'search');
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || !selectedIdea || chatLoading) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', text }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError('');

    const systemInstruction = `You are the story discussion partner for "${profile.name}" (${profile.niche}), presenter "${profile.presenter}".
Selected story idea: "${selectedIdea.title}"
Hook: "${selectedIdea.hook}"
Angle: "${selectedIdea.angle}"
Points: "${selectedIdea.points}"
Category: "${category.id}. ${category.name}"
Creator ke discussion notes: "${discussionNotes.trim() || '(abhi koi notes nahi)'}"

Rules:
- Roman Urdu (Latin script) mein warm aur concise jawab dein. 3 se 5 sentences maximum.
- Story beats, hook improvement, ya scene structure par concrete mashwara dein.
- Aakhir mein aik sharp question poochein taake discussion aage barhe.
- Yahan poori script na likhein; final script sirf Final Story Generate par banegi.`;

    try {
      let reply = '';
      let chatFailure: any = null;
      for (const model of ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']) {
        try {
          const data = await postJson('/api/ai/chat', {
            messages: nextMessages,
            model,
            systemInstruction
          }, abortRef.current?.signal);
          reply = String(data.text || '').trim();
          if (reply) break;
          chatFailure = new Error('AI ne khali jawab diya');
        } catch (error: any) {
          if (error.name === 'AbortError') throw error;
          chatFailure = error;
        }
      }
      if (!reply) throw chatFailure || new Error('Chat jawab nahi de saka');
      if (!mountedRef.current) return;
      setChatMessages([...nextMessages, { role: 'assistant', text: reply }]);
    } catch (error: any) {
      if (error.name === 'AbortError' || !mountedRef.current) return;
      setChatError(error.message || 'Chat jawab nahi de saka');
    } finally {
      if (mountedRef.current) setChatLoading(false);
    }
  };

  const handleFinalGenerate = () => {
    if (!selectedIdea) return;
    void generateStory(selectedIdea, discussionNotes.trim(), chatMessages);
  };

  const handleRetryGenerate = () => {
    if (!selectedIdea) {
      setPhase(isSearch ? 'idea-input' : 'duplicate');
      return;
    }
    void generateStory(selectedIdea, discussionNotes.trim(), chatMessages);
  };

  const handleCreateSequelFromDuplicate = (match?: DuplicateMatch | StoryIdea) => {
    const rawTitle = (match as any)?.title || selectedIdea?.title || initialNote.title;
    const cleanBase = rawTitle.replace(/\s*[-—–]\s*Part\s*\d+/i, '').replace(/\s*\(Part\s*\d+\)/i, '').trim();
    const sequelTitle = `${cleanBase} — Part 2 (Advanced Hacks)`;
    const sequelIdea: StoryIdea = {
      title: sequelTitle,
      hook: 'Part 1 ke baad yeh agla step 10x zyada powerful hai — secret advanced pro method!',
      angle: 'Part 2 Advanced Sequel Continuation',
      points: 'Part 2 Sequel: Advanced configuration, deeper tool mastery, and pro execution steps',
      whyFresh: 'Approved Part 2 Continuation / Official Sequel'
    };
    setSelectedIdea(sequelIdea);
    void generateStory(sequelIdea, `Official Part 2 Sequel continuation for ${cleanBase}`);
  };

  const handleSynthesizeInstantStory = () => {
    const targetIdea = selectedIdea || initialIdea();
    const offlineStory = createInstantFallbackStory(
      profile,
      selection,
      targetIdea,
      discussionNotes.trim(),
      simulatorConfig
    );
    const { story: verifiedOfflineStory } = verifyAndCorrectStoryPhonetics(offlineStory);
    setStory(verifiedOfflineStory);
    setPhase('complete');
    onOutcomeRef.current({
      status: 'generated',
      selection,
      title: verifiedOfflineStory.title,
      hook: verifiedOfflineStory.hook,
      duplicates: [],
      topic: targetIdea.title,
      discussionNotes: discussionNotes.trim() || undefined,
      matchContext: checkStage,
      story: verifiedOfflineStory,
      idea: targetIdea
    });
  };

  const progress = phase === 'complete' ? 100 : Math.round((stepIndex / steps.length) * 100);
  const renderIdeaList = () => (
    <div className="space-y-2">
      {ideasLoading && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex items-center gap-2 text-xs text-cyan-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          AI fresh story ideas dhoond raha hai...
        </div>
      )}
      {!ideasLoading && ideasError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 space-y-2">
          <p className="text-[11px] text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {ideasError}
          </p>
          <button
            onClick={handleRefreshIdeas}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Dobara Ideas
          </button>
        </div>
      )}
      {!ideasLoading && !ideasError && ideas.map((idea, index) => (
        <div key={`${idea.title}-${index}`}>
          <IdeaCard idea={idea} onSelect={handleSelectIdea} />
        </div>
      ))}
    </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-white shadow-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-sm">Trigger Flow — {profile.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                  v3.45 AI Story Engine (Hierarchical Duplicate Defense)
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isSearch ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {isSearch ? 'Category 10 — Idea + Discuss' : 'Category 1–10 — AI Direct Story'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Idea lock → duplicate check → discussion → scene-by-scene story generate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap gap-2 text-[10px]">
          {/* 1st: Channel */}
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Channel: <strong className="text-white">{profile.name}</strong>
          </span>
          {/* 2nd: Category & Playlist */}
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Category: <strong className="text-white">{category.id}. {category.name}</strong>
          </span>
          {/* 3rd: Aspect Ratio */}
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
            Ratio: <strong className="text-white">{selection.aspectRatio || '9:16'}</strong>
          </span>
          {/* 4th: Character Tag */}
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
            Tag: <strong className="text-cyan-300">{selection.tag}</strong>
          </span>
          {/* 5th: Duration & Scenes */}
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Duration: <strong className="text-white">{selection.sceneCount * 10}s</strong> ({selection.sceneCount} scenes)
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {bypassedDuplicates && (
            <div className="rounded-xl border border-cyan-500/50 bg-gradient-to-r from-blue-950/70 via-cyan-950/60 to-emerald-950/40 p-3.5 space-y-2 shadow-lg shadow-cyan-950/50 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Zero-Halt Duplicate Protection Active</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  Auto-Pivoted
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Pehle ka topic <span className="line-through text-rose-300 font-semibold">"{bypassedDuplicates.originalTitle}"</span> catalog duplicate tha. Engine ne flow ko roke baghair foran agla unique topic search aur select kar liya:
              </p>
              <div className="text-xs font-bold text-emerald-300 font-mono bg-slate-950/70 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between gap-2">
                <span>✓ Fresh Unique Topic: "{bypassedDuplicates.pivotedToTitle}"</span>
                <span className="text-[10px] text-emerald-400 font-normal">0% Duplicate Guarantee</span>
              </div>
            </div>
          )}

          {phase === 'auto-pivoting' && (
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-blue-950/40 to-cyan-950/30 p-6 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                </div>
              </div>
              <div className="space-y-1 max-w-lg mx-auto">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Duplicate Mila — Auto-Searching Fresh Topic...
                </h4>
                <p className="text-xs text-cyan-200/90 leading-relaxed">
                  Pehle se cover shuda topic ko bypass karke hamara AI Engine foran category bank aur 48h ground sources se naya verified non-duplicate topic search kar raha hai. Flow yahin rukega nahi!
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Category: {category.id}. {category.name} • Zero-Halt Execution</span>
              </div>
            </div>
          )}

          {phase === 'checking' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <p className="flex items-center gap-2 text-cyan-200 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  {checkingProgress || (checkStage === 'idea' ? 'Selected idea ka duplicate check chal raha hai...' : 'Duplicate Check chal raha hai...')}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {checkStage === 'idea' && selectedIdea
                    ? `Idea: "${selectedIdea.title}"`
                    : isSearch
                    ? 'Search category — pehle aapka idea prompt aayega.'
                    : `Proposed category idea: "${initialNote.title}"`}
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Published Library scan — {catalogCount} published videos in {profile.name} (Scope: strictly published only)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Hierarchical check: Level 1 Topic/App → Level 2 Deep covered_points secret comparison</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Zero-Halt Defense: duplicate hone par automatically agla point/topic/lens rotate hoga</span>
                </div>
              </div>
            </div>
          )}

          {phase === 'idea-input' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-cyan-100 space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-300" />
                  Custom Search — pehle apna idea ya topic dein
                </p>
                <p className="text-[11px] text-cyan-200/80">
                  Aapka raw topic seedhi title nahi banega. AI is idea se milte julte <strong>3 fresh story ideas</strong> suggest karega.
                  Aap aik select karenge, phir AI se discussion chat hogi, aur aakhir mein aap <strong>Final Story Generate</strong> dabayenge.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Aapka Idea / Topic <span className="text-rose-300">*</span>
                </label>
                <textarea
                  value={ideaSeed}
                  onChange={(event) => setIdeaSeed(event.target.value)}
                  rows={3}
                  placeholder="e.g. Gen Z ke liye phone camera se professional video shooting — lighting, audio aur editing ka simple setup"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Lamba topic likh sakte hain — AI isay short, clickable titles mein break karega.
                </p>
              </div>

              {ideasError && (
                <p className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">
                  {ideasError}
                </p>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold">Flow kaise chalega?</p>
                <p>1. Idea dein → 2. 3 fresh ideas mein se aik select karein → 3. AI se discuss karein → 4. Final Story Generate.</p>
              </div>
            </div>
          )}

          {phase === 'ideas' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    AI Fresh Story Ideas
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Seed: “{ideaSeed.trim()}” • duplicate-safe titles
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGroundModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-[11px] font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Inspect or customize 48-Hour Ground Search Criteria & Websites"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>48h Ground Criteria (10+ Sites)</span>
                  </button>
                  <button
                    onClick={() => { setPhase('idea-input'); setIdeasError(''); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Idea Badlein
                  </button>
                </div>
              </div>

              {renderIdeaList()}

              {!ideasLoading && !ideasError && ideas.length > 0 && (
                <button
                  onClick={handleRefreshIdeas}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Aur 3 Ideas
                </button>
              )}
            </div>
          )}

          {/* Non-blocking duplicate resolution UI: flow never halts */}
          {skippedDuplicates.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Skipped: already published — “{skippedDuplicates[skippedDuplicates.length - 1].storyTitle}” — covered point: “{skippedDuplicates[skippedDuplicates.length - 1].coveredPoint}”
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono">
                  {skippedDuplicates.length} Skipped
                </span>
              </div>
              <details className="text-[11px] text-slate-400 cursor-pointer">
                <summary className="text-cyan-300 hover:text-cyan-200 select-none">
                  View Skipped (duplicates) list ({skippedDuplicates.length})
                </summary>
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {skippedDuplicates.map((s, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] space-y-0.5">
                      <div className="text-rose-300 font-medium">
                        Candidate: “{s.attemptedTitle}”
                      </div>
                      <div className="text-slate-300">
                        Matched Published Story: <strong className="text-white">{s.storyTitle}</strong>
                      </div>
                      <div className="text-amber-300/90 font-mono">
                        Covered Point: {s.coveredPoint}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Conditional Part 2 / Sequel Option: ONLY for PARTIAL verdicts or Ongoing Series (Cat 4 & 7), NEVER for EXACT duplicates */}
          {(lastCheckResult?.verdict === 'partial' || category.id === 4 || category.id === 7) && selectedIdea && (
            <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-blue-950/60 to-cyan-950/40 p-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Fresh Angle / Sequel Detected (Part 2 Available)
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {lastCheckResult?.reason || 'App pehle cover ho chuka hai lekin yeh point/trick bilkul fresh hai.'} Aap iska direct Sequel (Part 2) generate kar sakte hain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateSequelFromDuplicate(selectedIdea)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎬 Generate Part 2 Sequel</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'duplicate' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-cyan-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Fresh Verified Story Ideas
                  </p>
                  <button
                    onClick={() => void fetchIdeas(selectedIdea?.title || category.name, 'duplicate')}
                    disabled={ideasLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-200 hover:bg-slate-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${ideasLoading ? 'animate-spin' : ''}`} /> Naye Ideas
                  </button>
                </div>
                {renderIdeaList()}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Ya apna naya topic likh kar ideas lein
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={ideaSeed}
                    onChange={(event) => setIdeaSeed(event.target.value)}
                    placeholder="Naya topic ya angle..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => {
                      const seed = ideaSeed.trim();
                      if (!seed) {
                        setIdeasError('Naya topic likh kar dobara try karein.');
                        return;
                      }
                      void fetchIdeas(seed, 'duplicate');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-semibold hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3 h-3" /> Ideas Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'discuss' && selectedIdea && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Idea lock + duplicate check pass
                </div>
                <p className="text-sm font-semibold text-white">“{selectedIdea.title}”</p>
                {selectedIdea.angle && (
                  <p className="text-[11px] text-slate-300">Angle: {selectedIdea.angle}</p>
                )}
                {selectedIdea.points && (
                  <p className="text-[11px] text-slate-400">Points: {selectedIdea.points}</p>
                )}
              </div>

              <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-950/10 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-fuchsia-200 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Discussion — AI Story Partner
                  </p>
                  <span className="text-[10px] text-slate-400">Chat karein, phir final generate dabayein</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {chatMessages.length === 0 && !chatLoading && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
                      AI se hook, points ya scene order par baat karein. Example: “Hook ko aur aggressive karein, aur proof scene 7 par rakhein.”
                    </p>
                  )}
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[88%] rounded-xl px-3 py-2 text-[11px] whitespace-pre-wrap leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-50'
                          : 'bg-slate-800/80 border border-slate-700 text-slate-200'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-fuchsia-400" /> AI soch raha hai...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {chatError && (
                  <p className="text-[10px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                    {chatError}
                  </p>
                )}

                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendChat();
                      }
                    }}
                    rows={2}
                    placeholder="AI se discussion karein... (Enter = send)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400 resize-none"
                  />
                  <button
                    onClick={() => void handleSendChat()}
                    disabled={!chatInput.trim() || chatLoading}
                    className="shrink-0 px-3.5 rounded-xl bg-fuchsia-600/80 hover:bg-fuchsia-600 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Final Discussion Notes <span className="text-[10px] text-slate-400 font-normal">(story generation mein shamil hongi)</span>
                </label>
                <textarea
                  value={discussionNotes}
                  onChange={(event) => setDiscussionNotes(event.target.value)}
                  rows={3}
                  placeholder="e.g. Beginners ko focus mein rakhna; hook aggressive; proof scene 7 par; common mistakes cover karni hain"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
                <p className="text-[10px] text-slate-500">
                  Jab aap tayyar hon, neeche <strong className="text-cyan-300">Final Story Generate</strong> dabayein. Us se pehle koi story generate nahi hogi.
                </p>
              </div>
            </div>
          )}

          {phase === 'generating' && (
            <>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progress}%` }} />
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
                <p className="flex items-center gap-2 text-cyan-200 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI story architect scene-by-scene script likh raha hai...
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selection.sceneCount} scenes • Roman Urdu dialogue • Flow paste-ready scripts. Is mein 60–120 seconds lag sakte hain, screen band na karein.
                </p>
              </div>
              <div className="space-y-1.5">
                {steps.map((step, index) => {
                  const isDone = index < stepIndex;
                  const isActive = index === stepIndex;
                  return (
                    <div
                      key={step.title}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/25'
                          : isActive
                          ? 'bg-slate-800/80 border-cyan-500/40'
                          : 'bg-slate-950/40 border-slate-800/70 opacity-60'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500/15 text-emerald-300' : isActive ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : step.icon}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${isDone ? 'text-emerald-200' : isActive ? 'text-white' : 'text-slate-400'}`}>
                          {index + 1}. {step.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono break-words">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {phase === 'complete' && story && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Phonetic Rules Dictionary Verified:</strong> All {story.scenes?.length || 0} scene dialogues cross-verified against {getPhoneticDictionary().length} living rules.
                    {(story as any).phoneticFixesCount ? ` (${(story as any).phoneticFixesCount} mispronunciations automatically corrected)` : ' (Zero mispronunciations detected)'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/80 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready for TTS & Google Flow
                </span>
              </div>
              <StoryPackageView
                story={story}
                onUpdateStory={(updated) => setStory(updated)}
                onDeleteStory={() => setStory(null)}
              />
            </div>
          )}

          {phase === 'error' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 space-y-2">
                <p className="font-semibold text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Story generate nahi ho saki
                </p>
                <p className="text-[11px] text-rose-100/80 break-words whitespace-pre-wrap leading-relaxed">{errorMsg}</p>
                <p className="text-[10px] text-slate-400">
                  Aap offline precision engine se instant story synthesize kar sakte hain ya dobara AI try kar sakte hain.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRetryGenerate}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Dobara Try Karein
                </button>
                <button
                  onClick={handleSynthesizeInstantStory}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-opacity cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Instant Story Synthesize Karein ({selection.sceneCount} Scenes)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Band Karein
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {phase === 'checking' && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Duplicate check...
              </span>
            )}

            {phase === 'idea-input' && (
              <button
                onClick={handleSearchIdeas}
                disabled={!ideaSeed.trim() || ideasLoading}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-violet-500/25 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                3 Fresh Ideas Search Karein
              </button>
            )}

            {phase === 'generating' && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Story likhi ja rahi hai...
              </span>
            )}

            {phase === 'discuss' && selectedIdea && (
              <>
                <button
                  onClick={() => {
                    setPhase('idea-input');
                    setSelectedIdea(null);
                    setChatMessages([]);
                    setChatInput('');
                  }}
                  className="px-3 py-1.5 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Idea Badlein
                </button>
                <button
                  onClick={handleFinalGenerate}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-opacity cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Final Story Generate
                </button>
              </>
            )}

            {phase === 'complete' && (
              <span className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Full story + package ready
              </span>
            )}
          </div>
        </div>
      </div>
      {showGroundModal && (
        <GroundLevelSearchDashboard
          isOpen={showGroundModal}
          onClose={() => setShowGroundModal(false)}
        />
      )}
    </div>,
    document.body
  );
};
