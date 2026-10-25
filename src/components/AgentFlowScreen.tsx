import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { PUBLISHED_VIDEOS, type ChannelProfile } from '../data/channelData';
import { StoryPackageView, type GeneratedStory, type StoryIdea, type StoryScene } from './StoryPackageView';

export interface AgentTriggerSelection {
  channelId: ChannelProfile['id'];
  tag: string;
  categoryId: number;
  sceneCount: number;
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
  source: 'Catalog' | 'Session Memory';
  id: string;
  title: string;
  tool: string;
  points: string;
  matchedKeywords: string[];
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
  onClose: () => void;
  onOutcome: (outcome: AgentTriggerOutcome) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

type Phase = 'checking' | 'duplicate' | 'idea-input' | 'ideas' | 'discuss' | 'generating' | 'complete' | 'error';
type CheckStage = 'initial' | 'idea';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'you', 'how', 'what', 'why', 'when', 'where',
  'into', 'over', 'under', 'without', 'before', 'after', 'about', 'video', 'videos', 'short', 'shorts',
  'windows', 'window', 'hidden', 'trick', 'tricks', 'secret', 'secrets', 'tip', 'tips', 'feature', 'features',
  'guide', 'tutorial', 'explained', 'using', 'use', 'uses', 'used', 'make', 'makes', 'made', 'new', 'best',
  'top', 'easy', 'quick', 'simple', 'full', 'part', 'karein', 'karin', 'karna', 'kaise', 'kya', 'mein', 'hai',
  'hain', 'nahi', 'aur', 'ke', 'ki', 'ka', 'ko', 'se', 'ab', 'aik', 'ek', 'liye', 'aap', 'aapka', 'aapki',
  'aapke', 'yeh', 'woh', 'jo', 'par', 'tha', 'thi', 'bhi', 'sirf', 'koi', 'kuch', 'bilkul', 'baad', 'pehle',
  'ai', 'app', 'apps', 'tool', 'tools', 'tech', 'technology'
]);

function normalizeDuplicateText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function stemWord(word: string) {
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenizeForMatch(text: string) {
  return Array.from(new Set(
    normalizeDuplicateText(text)
      .split(' ')
      .filter(Boolean)
      .map(stemWord)
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
  ));
}

function findDuplicateMatches(
  title: string,
  points: string,
  channelId: ChannelProfile['id'],
  memoryRecords: AgentMemoryRecord[]
) {
  const candidateTokens = tokenizeForMatch(`${title} ${points}`);
  if (!candidateTokens.length) return [] as DuplicateMatch[];

  const catalogRecords: DuplicateMatch[] = (channelId === 'itcafeteria' ? PUBLISHED_VIDEOS : []).map((video) => ({
    source: 'Catalog',
    id: `#${video.id}`,
    title: video.title,
    tool: video.tool,
    points: video.points,
    matchedKeywords: []
  }));

  const memoryMatches: DuplicateMatch[] = memoryRecords
    .filter((record) => record.channelId === channelId)
    .map((record) => ({
      source: 'Session Memory',
      id: record.id,
      title: record.title,
      tool: record.tool,
      points: record.points,
      matchedKeywords: []
    }));

  const results: DuplicateMatch[] = [];
  for (const record of [...catalogRecords, ...memoryMatches]) {
    const recordTokens = new Set(tokenizeForMatch(`${record.title} ${record.tool} ${record.points}`));
    const matchedKeywords = candidateTokens.filter((token) => recordTokens.has(token));
    const normalizedCandidate = normalizeDuplicateText(title);
    const exactPhrase = normalizedCandidate.length >= 10 &&
      normalizeDuplicateText(`${record.title} ${record.tool} ${record.points}`).includes(normalizedCandidate);
    // Shared generic words (e.g. excel, report) alone should not block a fresh angle;
    // require either 3+ overlapping keywords or 2 with strong keyword density.
    const density = matchedKeywords.length / candidateTokens.length;

    if (exactPhrase || matchedKeywords.length >= 3 || (matchedKeywords.length === 2 && density >= 0.34)) {
      results.push({ ...record, matchedKeywords });
    }
  }

  return results
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length)
    .slice(0, 5);
}

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
  onClose,
  onOutcome
}) => {
  const category = profile.categories.find((item) => item.id === selection.categoryId) ?? profile.categories[0];
  const isSearch = category.id === 10;
  const initialNote = profile.sampleNotes[category.id] ?? { title: category.name, hook: 'Reveal' };
  const channelHashtag = profile.id === 'itcafeteria' ? '#ITCafeteria' : '#BeautyHub';

  const [phase, setPhase] = useState<Phase>('checking');
  const [checkStage, setCheckStage] = useState<CheckStage>('initial');
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
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

  const onOutcomeRef = useRef(onOutcome);
  const onCloseRef = useRef(onClose);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const duplicateTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const catalogCount = profile.id === 'itcafeteria' ? PUBLISHED_VIDEOS.length : 0;

  function initialIdea(): StoryIdea {
    return {
      title: initialNote.title,
      hook: initialNote.hook,
      angle: `${category.id}. ${category.name} category ka fresh, research-backed angle`,
      points: '',
      whyFresh: ''
    };
  }

  function buildExcludedTitles(extra: string[] = []) {
    const titles = new Set<string>([
      ...PUBLISHED_VIDEOS.map((video) => video.title),
      ...memoryRecords.filter((record) => record.channelId === profile.id).map((record) => record.title),
      ...duplicates.map((match) => match.title),
      ...extra
    ]);
    return Array.from(titles).filter(Boolean).slice(0, 80);
  }

  async function fetchIdeas(seed: string, mode: 'search' | 'duplicate') {
    if (!mountedRef.current) return;
    setIdeasLoading(true);
    setIdeasError('');
    if (mode === 'search') setPhase('ideas');
    try {
      const data = await postJson('/api/ai/story-ideas', {
        channelName: profile.name,
        presenter: profile.presenter,
        niche: profile.niche,
        category: `${category.id}. ${category.name}`,
        seedTopic: seed,
        excludeTitles: buildExcludedTitles([seed]),
        count: mode === 'duplicate' ? 4 : 3
      }, abortRef.current?.signal);

      const rawIdeas: StoryIdea[] = (Array.isArray(data.ideas) ? data.ideas : [])
        .map((idea: any) => ({
          title: String(idea?.title || '').trim(),
          hook: String(idea?.hook || '').trim(),
          angle: String(idea?.angle || '').trim(),
          points: String(idea?.points || '').trim(),
          whyFresh: String(idea?.whyFresh || '').trim()
        }))
        .filter((idea: StoryIdea) => idea.title);

      const freshIdeas = rawIdeas.filter(
        (idea) => findDuplicateMatches(idea.title, idea.points, profile.id, memoryRecords).length === 0
      );
      const finalIdeas = freshIdeas.length ? freshIdeas : rawIdeas;

      if (!finalIdeas.length) {
        throw new Error('AI ne koi fresh idea return nahi kiya');
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
        excludeTitles: buildExcludedTitles([idea.title])
      }, abortRef.current?.signal);

      const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
      const scenes: StoryScene[] = rawScenes
        .filter((scene: any) => scene && (scene.script || scene.dialogue))
        .map((scene: any, index: number) => {
          const dialogue = String(scene.dialogue || '').trim();
          const visual = String(scene.visual || '').trim();
          const script = String(scene.script || '').trim() || `${selection.tag} — ${visual}\nHe says: "${dialogue}"`;
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
        modelUsed: data.modelUsed
      };

      if (!mountedRef.current) return;
      setStory(generatedStory);
      setPhase('complete');
      onOutcomeRef.current({
        status: 'generated',
        selection,
        title: generatedStory.title,
        hook: generatedStory.hook,
        duplicates: [],
        topic: idea.title,
        discussionNotes: notes || undefined,
        matchContext: checkStage,
        story: generatedStory,
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

  function runDuplicateCheck(idea: StoryIdea, stage: CheckStage) {
    if (!mountedRef.current) return;
    setCheckStage(stage);
    setDuplicates([]);
    setIdeas([]);
    setIdeasError('');
    setPhase('checking');
    if (duplicateTimerRef.current) window.clearTimeout(duplicateTimerRef.current);

    duplicateTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      const matches = findDuplicateMatches(idea.title, idea.points, profile.id, memoryRecords);

      if (matches.length > 0) {
        setDuplicates(matches);
        setSelectedIdea(null);
        setPhase('duplicate');
        onOutcomeRef.current({
          status: 'duplicate',
          selection,
          title: idea.title,
          hook: idea.hook,
          duplicates: matches,
          idea,
          discussionNotes: idea.points || undefined,
          matchContext: stage
        });
        void fetchIdeas(idea.title, 'duplicate');
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
    }, 900);
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

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-white shadow-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-sm">Trigger Flow — {profile.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                  v3.42 AI Story Engine
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isSearch ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {isSearch ? 'Category 10 — Idea + Discuss' : 'Category 1–9 — AI Direct Story'}
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
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Channel: <strong className="text-white">{profile.name}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
            Tag: <strong className="text-cyan-300">{selection.tag}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Category: <strong className="text-white">{category.id}. {category.name}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            Duration: <strong className="text-white">{selection.sceneCount * 10}s</strong> ({selection.sceneCount} scenes)
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {phase === 'checking' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <p className="flex items-center gap-2 text-cyan-200 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {checkStage === 'idea' ? 'Selected idea ka duplicate check chal raha hai...' : 'Duplicate Check chal raha hai...'}
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
                  <span className="text-slate-300">Catalog scan — {catalogCount} published videos</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Application memory scan — {memoryRecords.length} records</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Title + points keyword matching</span>
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
                <button
                  onClick={() => { setPhase('idea-input'); setIdeasError(''); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Idea Badlein
                </button>
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

          {phase === 'duplicate' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5">
                <p className="font-semibold text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Duplicate mila — lekin flow yahin nahi rukta.
                </p>
                <p className="text-[11px] text-rose-200/80 mt-1">
                  “{selectedIdea?.title || initialNote.title}” pehle cover ho chuka hai. Neeche AI ke fresh ideas ya apna naya topic use karke story generate karein.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Duplicate matches ({duplicates.length})
                </p>
                {duplicates.map((match) => (
                  <div key={`${match.source}-${match.id}`} className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/25 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                        {match.source}
                      </span>
                      <span className="text-xs font-semibold text-white">{match.id} {match.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Tool: {match.tool}</p>
                    <p className="text-[10px] text-slate-400">{match.points}</p>
                    {match.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {match.matchedKeywords.map((keyword) => (
                          <span key={keyword} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-amber-300 font-mono">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-cyan-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Fresh Story Ideas — inhi par generation chalao
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
            <StoryPackageView story={story} />
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
                  Idea aur discussion mehfooz hain. Neeche se dobara try karein.
                </p>
              </div>
              <button
                onClick={handleRetryGenerate}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-opacity cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Dobara Try Karein
              </button>
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
    </div>
  );
};
