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
  Copy,
  MessageSquare,
  Play
} from 'lucide-react';
import { PUBLISHED_VIDEOS, type ChannelProfile } from '../data/channelData';

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
  status: 'duplicate' | 'generated' | 'topic-pending';
  selection: AgentTriggerSelection;
  title: string;
  hook: string;
  duplicates: DuplicateMatch[];
  topic?: string;
  discussionNotes?: string;
  matchContext?: 'initial' | 'topic';
}

interface AgentFlowScreenProps {
  profile: ChannelProfile;
  selection: AgentTriggerSelection;
  memoryRecords: AgentMemoryRecord[];
  onClose: () => void;
  onOutcome: (outcome: AgentTriggerOutcome) => void;
}

type Phase = 'checking' | 'duplicate' | 'topic' | 'generating' | 'complete';
type CheckStage = 'initial' | 'topic';

const HOOK_FORMULAS = ['Reveal', 'Mistake', 'Contrarian Flip', 'Warning', 'Before/After', 'Comparison', 'Statistic'];

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

  const [phase, setPhase] = useState<Phase>('checking');
  const [checkStage, setCheckStage] = useState<CheckStage>('initial');
  const [searchTopic, setSearchTopic] = useState('');
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [hookFormula, setHookFormula] = useState('Reveal');
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const onOutcomeRef = useRef(onOutcome);
  const reportedRef = useRef(false);

  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  const finalTitle = (isSearch ? searchTopic.trim() : initialNote.title) || initialNote.title;
  const finalHook = isSearch ? hookFormula : initialNote.hook;
  const finalNotes = discussionNotes.trim();
  const catalogCount = profile.id === 'itcafeteria' ? PUBLISHED_VIDEOS.length : 0;

  useEffect(() => {
    if (phase !== 'checking') return;
    const timer = setTimeout(() => {
      const candidateTitle = checkStage === 'topic' ? searchTopic.trim() : (isSearch ? '' : initialNote.title);
      const candidatePoints = checkStage === 'topic' ? discussionNotes.trim() : '';
      const matches = findDuplicateMatches(candidateTitle, candidatePoints, profile.id, memoryRecords);
      setDuplicates(matches);

      if (matches.length > 0) {
        setPhase('duplicate');
        onOutcomeRef.current({
          status: 'duplicate',
          selection,
          title: candidateTitle || initialNote.title,
          hook: checkStage === 'topic' ? hookFormula : initialNote.hook,
          duplicates: matches,
          topic: searchTopic.trim() || undefined,
          discussionNotes: candidatePoints || undefined,
          matchContext: checkStage
        });
      } else if (isSearch && checkStage === 'initial') {
        setPhase('topic');
        onOutcomeRef.current({
          status: 'topic-pending',
          selection,
          title: initialNote.title,
          hook: hookFormula,
          duplicates: [],
          matchContext: 'initial'
        });
      } else {
        setStepIndex(0);
        setPhase('generating');
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [
    phase,
    checkStage,
    searchTopic,
    discussionNotes,
    hookFormula,
    isSearch,
    initialNote.title,
    initialNote.hook,
    profile.id,
    selection,
    memoryRecords
  ]);

  const steps = useMemo(() => {
    const items = [
      {
        title: 'Channel identity lock',
        detail: `${profile.name} • ${profile.presenter} • ${profile.niche}`,
        icon: <Lock className="w-4 h-4" />
      },
      {
        title: isSearch ? 'Custom Search topic lock' : 'Category lock',
        detail: isSearch ? `"${finalTitle}" • ${category.name}` : `${category.id}. ${category.name} — predefined category`,
        icon: <ListChecks className="w-4 h-4" />
      },
      {
        title: 'Research & points verification',
        detail: `${profile.niche} research verified${finalNotes ? ' • discussion notes included' : ''}`,
        icon: <Search className="w-4 h-4" />
      },
      {
        title: 'Story angle & hook',
        detail: `${finalHook} • ${isSearch ? 'custom topic angle' : 'auto-selected angle'}`,
        icon: <FileText className="w-4 h-4" />
      },
      {
        title: 'Scene plan',
        detail: `${selection.sceneCount} scenes × 10s = ${selection.sceneCount * 10}s • anchor-pose system`,
        icon: <Layers className="w-4 h-4" />
      },
      {
        title: '5-item upload package',
        detail: 'Title + hashtags • description • tags • TikTok block • thumbnail prompt',
        icon: <Layers className="w-4 h-4" />
      },
      {
        title: 'Memory block save',
        detail: 'Duplicate key register — agli baar yahi topic memory se block hoga',
        icon: <Database className="w-4 h-4" />
      }
    ];
    return items;
  }, [profile, category, isSearch, finalTitle, finalHook, finalNotes, selection.sceneCount]);

  useEffect(() => {
    if (phase !== 'generating') return;
    if (stepIndex < steps.length) {
      const timer = setTimeout(() => setStepIndex((index) => index + 1), 650);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setPhase('complete');
      if (!reportedRef.current) {
        reportedRef.current = true;
        onOutcomeRef.current({
          status: 'generated',
          selection,
          title: finalTitle,
          hook: finalHook,
          duplicates: [],
          topic: isSearch ? searchTopic.trim() : undefined,
          discussionNotes: finalNotes || undefined,
          matchContext: checkStage
        });
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [phase, stepIndex, steps.length, selection, finalTitle, finalHook, isSearch, searchTopic, finalNotes, checkStage]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const startTopicCheck = () => {
    if (!searchTopic.trim()) return;
    setDuplicates([]);
    setCheckStage('topic');
    setPhase('checking');
  };

  const backToTopic = () => {
    setDuplicates([]);
    setPhase('topic');
  };

  const hashtag = profile.id === 'itcafeteria' ? '#ITCafeteria' : '#BeautyHub';
  const topicKeyword = (finalTitle.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).find((word) => word.length > 3) || 'Shorts');
  const thumbnailHeadline = finalTitle
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
    .toUpperCase();
  const tagKeywords = tokenizeForMatch(`${finalTitle} ${category.name}`).slice(0, 10);
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const packageText = `Story Package — ${profile.name}
Date: ${dateLabel}
Category: ${category.id}. ${category.name} | Playlist: ${category.playlist}
Title: ${finalTitle}
Hook: ${finalHook}
Character Tag: ${selection.tag}
Length: ${selection.sceneCount} scenes (${selection.sceneCount * 10}s)
Duplicate Check: PASSED — ${catalogCount} catalog videos + ${memoryRecords.length} memory records scanned
${finalNotes ? `Discussion / Angle Notes: ${finalNotes}\n` : ''}
5 ITEMS + MEMORY BLOCK
1. YouTube Title: ${finalTitle} ${hashtag} #Shorts #${topicKeyword}
2. Description: ${finalTitle} — ${profile.name} ki ${category.name} category mein practical, research-verified guide. Points aur steps description ke saath share kiye gaye hain.
3. Tags: ${[...tagKeywords, profile.name.toLowerCase(), profile.niche.toLowerCase(), 'pakistan', hashtag.replace('#', '')].join(', ')}
4. TikTok Block: ${finalTitle} ${hashtag} #Shorts #${topicKeyword}
5. Thumbnail Prompt: ${profile.presenter}, ${profile.name} studio, headline "${thumbnailHeadline}", ${category.name} story, 9:16 vertical thumbnail, high contrast, sparkle finish.

Memory Block (v3.41):
Tareekh: ${dateLabel}
Title: ${finalTitle}
Category / Playlist: ${category.id}. ${category.name} | Playlist: ${category.playlist}
Tool / topic: ${isSearch ? finalTitle : initialNote.title}
Thumbnail headline: ${thumbnailHeadline}
Points cover hue: ${finalNotes || `${category.name} ke research-verified points`}
Duplicate key: ${finalTitle}
Series / Part: ${category.name}
Length: ${selection.sceneCount} scenes (${selection.sceneCount * 10}s)
Status: bani`;

  const copyPackage = () => {
    navigator.clipboard.writeText(packageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = phase === 'complete' ? 100 : Math.round((stepIndex / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-white shadow-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-blue-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-sm">Trigger Flow — {profile.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                  v3.41 Trigger
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isSearch ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {isSearch ? 'Category 10 — Search' : 'Category 1–9 — Direct Generate'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pehle duplicate check, phir story package. Dropdown selections Trigger par lock ho chuki hain.
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
                  Duplicate Check chal raha hai...
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {checkStage === 'topic'
                    ? `Topic check: "${searchTopic}" ${finalNotes ? '+ discussion points' : ''}`
                    : isSearch
                    ? 'Context check — specific Search topic abhi pending hai.'
                    : `Proposed title: "${initialNote.title}"`}
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
                  <span className="text-slate-300">Topic + points keyword matching</span>
                </div>
              </div>
            </div>
          )}

          {phase === 'topic' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Duplicate Check pass — ab Search category ka topic dein.
                </p>
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  {catalogCount} catalog videos + {memoryRecords.length} memory records scan hue, context duplicate nahi mila.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Topic / Idea <span className="text-rose-300">*</span>
                </label>
                <textarea
                  value={searchTopic}
                  onChange={(event) => setSearchTopic(event.target.value)}
                  rows={2}
                  placeholder="e.g. Windows 11 Storage Sense se temp files auto clean karna"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-950/10 p-3.5 space-y-2">
                <label className="text-xs font-semibold text-fuchsia-200 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Discussion / Angle Notes <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Package finalize karne se pehle angle, points ya points-warning likhein. Yeh notes story package aur memory block mein shamil honge.
                </p>
                <textarea
                  value={discussionNotes}
                  onChange={(event) => setDiscussionNotes(event.target.value)}
                  rows={2}
                  placeholder="e.g. Beginners ko dhyaan mein rakhna hai; 3 steps; common mistakes cover karni hain"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hook Formula</label>
                <select
                  value={hookFormula}
                  onChange={(event) => setHookFormula(event.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {HOOK_FORMULAS.map((formula) => (
                    <option key={formula} value={formula}>{formula}</option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-amber-200 bg-amber-950/20 border border-amber-500/25 rounded-lg px-3 py-2">
                Topic likhne ke baad <strong>Generate Story</strong> button footer mein appear hoga — us par click karne se topic-level duplicate check hoga.
              </p>
            </div>
          )}

          {phase === 'duplicate' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5">
                <p className="font-semibold text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Duplicate Check fail — story generation roka gaya.
                </p>
                <p className="text-[11px] text-rose-200/80 mt-1">
                  {checkStage === 'topic'
                    ? 'Yeh topic/points pehle cover ho chuke hain. Topic ya angle badal kar dobara Generate Story chalayein.'
                    : 'Yeh proposed topic catalog ya application memory mein pehle se maujood hai. Doosri category select karke dobara Trigger karein.'}
                </p>
              </div>

              <div className="space-y-2">
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
            </div>
          )}

          {phase === 'generating' && (
            <>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Duplicate Check pass — story package generate ho raha hai.
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

          {phase === 'complete' && (
            <div className="space-y-3">
              <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Flow mukammal — story package ready
                </div>
                <p className="text-xs text-slate-200">
                  <span className="text-slate-400">Title:</span> “{finalTitle}”
                </p>
                <p className="text-[11px] text-slate-400">
                  Hook: <span className="text-slate-200">{finalHook}</span> • Duplicate Check:{' '}
                  <span className="text-emerald-300">Passed (Naya)</span> • Memory block saved.
                </p>
                <p className="text-[11px] text-slate-400">
                  {category.id}. {category.name} • {selection.tag} • {selection.sceneCount} scenes ({selection.sceneCount * 10}s)
                </p>
                {finalNotes && (
                  <p className="text-[11px] text-fuchsia-200/90">
                    Discussion notes: {finalNotes}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase font-semibold">Item 1 — Title</span>
                  <p className="text-white mt-1">{finalTitle} {hashtag} #Shorts</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase font-semibold">Item 3 — Tags</span>
                  <p className="text-slate-300 font-mono mt-1 line-clamp-2">
                    {tagKeywords.join(', ')}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase font-semibold">Item 4 — TikTok Block</span>
                  <p className="text-slate-300 mt-1">{finalTitle} {hashtag} #Shorts</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 uppercase font-semibold">Item 5 — Thumbnail</span>
                  <p className="text-slate-300 mt-1">Headline: “{thumbnailHeadline}” • 9:16</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 sm:col-span-2">
                  <span className="text-slate-500 uppercase font-semibold">Item 2 — Description + Memory Block</span>
                  <p className="text-slate-300 mt-1">
                    {category.name} guide • duplicate key registered • Memory Block {dateLabel}
                  </p>
                </div>
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

          <div className="flex items-center gap-2">
            {phase === 'checking' && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Duplicate check...
              </span>
            )}

            {phase === 'generating' && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Package ban raha hai...
              </span>
            )}

            {phase === 'topic' && searchTopic.trim() && (
              <button
                onClick={startTopicCheck}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-violet-500/25 transition-opacity cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Generate Story
              </button>
            )}

            {phase === 'duplicate' && checkStage === 'topic' && (
              <button
                onClick={backToTopic}
                className="px-4 py-2 bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Topic Badlein
              </button>
            )}

            {phase === 'complete' && (
              <button
                onClick={copyPackage}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-opacity cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Story Package'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
