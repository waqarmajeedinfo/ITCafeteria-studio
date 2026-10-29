import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
  Copy,
  Check,
  Play,
  RotateCcw,
  Tag,
  Film,
  FileText,
  Youtube,
  Send,
  Layers,
  ArrowRight,
  Filter,
  Plus,
  Eye,
  Bot,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  ShieldAlert,
  Flame,
  Radio,
  Clapperboard,
  Camera,
  Wand2,
  Sliders,
  X,
  Loader2
} from 'lucide-react';

import {
  loadPendingQueue,
  savePendingQueue,
  getNextTargetStory,
  type PendingStoryRecord,
  type StoryPublishStatus
} from '../lib/pendingQueueStore';
import { StoryPackageView, buildStoryPackageText, type GeneratedStory } from './StoryPackageView';
import { resolveThumbnailSpec } from '../lib/thumbnailMaster';
import { CATEGORIES_IT_CAFETERIA } from '../data/channelData';
import {
  applyCinematicDirecting,
  enforceCinematicStoryPackage,
  CINEMATIC_PRESETS,
  CINEMATIC_STAGE_DIRECTIONS
} from '../lib/cinematicDirector';

interface PendingQueueTrackerProps {
  onNavigateTab?: (tab: string) => void;
}

export const PendingQueueTracker: React.FC<PendingQueueTrackerProps> = ({ onNavigateTab }) => {
  const [queue, setQueue] = useState<PendingStoryRecord[]>(loadPendingQueue);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(() => {
    const next = getNextTargetStory(loadPendingQueue());
    return next ? next.id : '';
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'draft' | 'published'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh Story & Cinematic Directing Modal State
  const [refreshTargetStory, setRefreshTargetStory] = useState<PendingStoryRecord | null>(null);
  const [refreshCustomDirection, setRefreshCustomDirection] = useState<string>('');
  const [refreshPreset, setRefreshPreset] = useState<string>('cyber_hologram');
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  // New Story Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('AI Chatbots, Workflows & Tools');
  const [newTime, setNewTime] = useState('6:00 PM PKT');
  const [newDate, setNewDate] = useState('Today');
  const [newTag, setNewTag] = useState('WM25-1');

  useEffect(() => {
    savePendingQueue(queue);
  }, [queue]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedRecord = queue.find((item) => item.id === selectedStoryId) || queue[0];
  const nextTarget = getNextTargetStory(queue);

  // Toggle Publish Status
  const togglePublishStatus = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStatus: StoryPublishStatus = item.status === 'published' ? 'pending' : 'published';
          const nowStr = new Date().toISOString();
          showToast(
            newStatus === 'published'
              ? `"${item.title.slice(0, 30)}..." ko Published mark kar diya gaya!`
              : `"${item.title.slice(0, 30)}..." wapas Pending mein shift ho gaya.`
          );
          return {
            ...item,
            status: newStatus,
            publishedAt: newStatus === 'published' ? nowStr : undefined,
          };
        }
        return item;
      })
    );
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Clipboard par copy ho gaya!');
  };

  const handleOpenRefreshModal = (item: PendingStoryRecord) => {
    setRefreshTargetStory(item);
    setRefreshCustomDirection(item.storyPackage.customCinematicDirection || '');
    setRefreshPreset('cyber_hologram');
  };

  const handleApplyCinematicRefresh = () => {
    if (!refreshTargetStory) return;
    const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const presetObj = CINEMATIC_PRESETS.find((p) => p.id === refreshPreset);
    const chosenDirection = refreshCustomDirection.trim() || presetObj?.prefix;

    const refreshedPackage = enforceCinematicStoryPackage(
      {
        ...refreshTargetStory.storyPackage,
        dateLabel: todayLabel
      },
      chosenDirection
    );

    const updatedQueue = queue.map((item) => {
      if (item.id === refreshTargetStory.id) {
        return {
          ...item,
          storyPackage: refreshedPackage
        };
      }
      return item;
    });

    setQueue(updatedQueue);
    savePendingQueue(updatedQueue);
    setRefreshTargetStory(null);
    showToast(`"${refreshTargetStory.title.slice(0, 30)}..." par Cinematic Directing layer refresh aur save ho gaya!`);
  };

  const handleFullAiReanalyze = async () => {
    if (!refreshTargetStory) return;
    setIsReanalyzing(true);

    const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const presetObj = CINEMATIC_PRESETS.find((p) => p.id === refreshPreset);
    const chosenDirection = refreshCustomDirection.trim() || presetObj?.prefix;

    await new Promise((r) => setTimeout(r, 1100));

    const refreshedPackage = enforceCinematicStoryPackage(
      {
        ...refreshTargetStory.storyPackage,
        dateLabel: todayLabel,
        hook: `[Fresh ${todayLabel}] ${refreshTargetStory.storyPackage.hook.replace(/^\[Fresh[^\]]*\]\s*/i, '')}`,
        description: `Verified for current date requirements (${todayLabel}).\n\n${refreshTargetStory.storyPackage.description.replace(/^Verified for current date requirements[^\n]*\n\n/i, '')}`
      },
      chosenDirection
    );

    const updatedQueue = queue.map((item) => {
      if (item.id === refreshTargetStory.id) {
        return {
          ...item,
          storyPackage: refreshedPackage
        };
      }
      return item;
    });

    setQueue(updatedQueue);
    savePendingQueue(updatedQueue);
    setIsReanalyzing(false);
    setRefreshTargetStory(null);
    showToast(`Story content date requirements ke sath re-analyze ho kar fresh cinematic directing ke sath update ho gayi!`);
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catObj = CATEGORIES_IT_CAFETERIA.find((c) => c.name === newCategory) || CATEGORIES_IT_CAFETERIA[0];
    const newRecord: PendingStoryRecord = {
      id: `pq-custom-${Date.now()}`,
      title: newTitle.trim(),
      hook: `Attention tech lovers: ${newTitle.trim()} ka secret shortcut!`,
      category: newCategory,
      categoryId: catObj.id,
      characterTag: newTag,
      scheduledTime: newTime,
      scheduledDate: newDate,
      targetSlotReason: 'Custom scheduled slot added by creator.',
      status: 'pending',
      source: 'manual',
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
      notes: 'Custom pending draft created for upcoming YouTube Shorts schedule.',
      storyPackage: {
        title: `${newTitle.trim()} #shorts #itcafeteria`,
        hook: `Aapko yeh trick kisi ne nahi batayi: ${newTitle.trim()}!`,
        channelName: 'IT Cafeteria',
        presenter: 'Waqar Majeed',
        categoryName: newCategory,
        playlist: 'IT Cafeteria Shorts Series',
        characterTag: newTag,
        dateLabel: `${newDate} • ${newTime}`,
        sceneCount: 6,
        hashtags: ['#shorts', '#itcafeteria', '#techurdu', '#pakistantech'],
        description: `${newTitle.trim()}\n\nPresenter: Waqar Majeed • IT Cafeteria.\nSubscribe for daily shortcuts!`,
        tags: ['it cafeteria', 'waqar majeed', 'tech shorts', 'urdu tech'],
        tiktokCaption: `${newTitle.trim()} 🔥⚡ #itcafeteria #tech #shorts`,
        thumbnailHeadline: newTitle.slice(0, 24).toUpperCase(),
        thumbnailSubBadge: '100% WORKING',
        thumbnailLine1: newTitle.slice(0, 18).toUpperCase(),
        thumbnailLine2: 'SECRET TRICK',
        thumbnailHologram: 'CONFIRMED HACK',
        thumbnailPrompt: `Vertical 9:16 high-tech YouTube Shorts thumbnail cover. Cyber navy background #070a13. Embossed text "${newTitle.slice(0, 24).toUpperCase()}". Glowing neon frame, ultra-sharp 8k.`,
        seriesPlan: 'Custom Production Series',
        memoryBlock: `Memory Block Custom — Category ${catObj.id}.`,
        idea: {
          title: newTitle.trim(),
          hook: 'Attention grabbing hook',
          angle: 'Productivity and viral utility',
          points: 'Step 1, Step 2, Step 3 execution'
        },
        discussionNotes: 'Ensure 6 scenes are recorded in Roman Urdu using Flow voice guidelines.',
        scenes: [
          {
            num: 1,
            duration: '0-10s',
            purpose: 'Disruptive Hook',
            isCTA: false,
            words: 22,
            visual: 'Close up screen demo with dramatic zoom.',
            dialogue: `Kya aap jante hain ke ${newTitle.trim()} aapka kitna qeemti waqt bacha sakta hai?`,
            script: `Kya aap jante hain ke ${newTitle.trim()} aapka kitna qeemti waqt bacha sakta hai?`
          },
          {
            num: 2,
            duration: '10-20s',
            purpose: 'Common Mistake',
            isCTA: false,
            words: 20,
            visual: 'Screen showing the wrong traditional slow way.',
            dialogue: 'Aksar log is kaam ke liye ghanton barbad karte hain kyunke unhein yeh setting pata nahi hoti.',
            script: 'Aksar log is kaam ke liye ghanton barbad karte hain kyunke unhein yeh setting pata nahi hoti.'
          },
          {
            num: 3,
            duration: '20-30s',
            purpose: 'Step 1 Direct Fix',
            isCTA: false,
            words: 24,
            visual: 'Direct mouse click on the secret feature with glowing green border.',
            dialogue: 'Pehla step: Apne browser ya software mein is hidden option ko on karein.',
            script: 'Pehla step: Apne browser ya software mein is hidden option ko on karein.'
          },
          {
            num: 4,
            duration: '30-40s',
            purpose: 'Step 2 Pro Execution',
            isCTA: false,
            words: 23,
            visual: 'Speed run showing task getting completed in 5 seconds.',
            dialogue: 'Doosra step: Yeh shortcut dabayein aur dekhein sara process khud-ba-khud complete ho gaya.',
            script: 'Doosra step: Yeh shortcut dabayein aur dekhein sara process khud-ba-khud complete ho gaya.'
          },
          {
            num: 5,
            duration: '40-50s',
            purpose: 'Proof & Results',
            isCTA: false,
            words: 21,
            visual: 'Before vs After comparison screen showing 10x speed boost.',
            dialogue: 'Yeh trick mobile aur PC dono par 100 fisad kaam karti hai aur totally free hai.',
            script: 'Yeh trick mobile aur PC dono par 100 fisad kaam karti hai aur totally free hai.'
          },
          {
            num: 6,
            duration: '50-60s',
            purpose: 'Call to Action',
            isCTA: true,
            words: 20,
            visual: 'Waqar Majeed studio outro with IT Cafeteria subscribe bell animation.',
            dialogue: 'Aisi daily tech tricks ke liye IT Cafeteria ko abhi subscribe karein aur video save kar lein!',
            script: 'Aisi daily tech tricks ke liye IT Cafeteria ko abhi subscribe karein aur video save kar lein!'
          }
        ]
      }
    };

    setQueue([newRecord, ...queue]);
    setSelectedStoryId(newRecord.id);
    setShowAddModal(false);
    setNewTitle('');
    showToast('Nayi Pending Story kamyabi se Queue mein add ho gayi!');
  };

  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const overdueCount = queue.filter((i) => i.status === 'overdue').length;
  const draftCount = queue.filter((i) => i.status === 'draft').length;
  const publishedCount = queue.filter((i) => i.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-950/80 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-indigo-950/80 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Production & Scheduled Queue Hub</span>
              </span>
              <span className="text-xs text-slate-400">
                Waqar Majeed Channel Operations • Roman Urdu Verified
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Pending Stories & Target Upload Queue</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Yahan aapka sara pended aur scheduled kaam sequence ke sath mehfooz hai. Har story ka mukammal 6-scenes Roman Urdu script, YouTube package, thumbnail aur publication status control ek jagah dastyab hai.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nayi Story Draft Karein</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Total Pending Stories</div>
            <div className="text-2xl font-bold text-cyan-400 mt-0.5">{pendingCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ready for recording/upload</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Next Target Slot</div>
            <div className="text-base font-bold text-amber-300 mt-0.5 truncate">
              {nextTarget?.scheduledTime || '6:00 PM PKT'}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Prime Viral Window</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Overdue / Action Needed</div>
            <div className={`text-2xl font-bold mt-0.5 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {overdueCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Missed schedule review</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Published & Synced</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{publishedCount}</div>
            <div className="text-[10px] text-emerald-500 mt-0.5">Verified on channel record</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Queue List | Right Side Full Story Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sequence Queue List (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: `All (${queue.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'overdue', label: `Overdue (${overdueCount})` },
                { id: 'draft', label: `Drafts (${draftCount})` },
                { id: 'published', label: `Published (${publishedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Items List */}
          <div className="space-y-3">
            {filteredQueue.map((item, index) => {
              const isSelected = item.id === selectedStoryId;
              const isPublished = item.status === 'published';
              const isOverdue = item.status === 'overdue';
              const isPending = item.status === 'pending';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedStoryId(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-900/95 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/60'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  {/* Status Strip on left */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isPublished
                        ? 'bg-emerald-500'
                        : isOverdue
                        ? 'bg-rose-500'
                        : 'bg-cyan-400'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="min-w-0 flex-1">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{index + 1}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                          {item.characterTag}
                        </span>

                        {isPublished ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>

                      {/* Story Title */}
                      <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </h4>

                      {/* Scheduled Time info */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300 font-medium">
                          {item.scheduledDate} • {item.scheduledTime}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{item.storyPackage.sceneCount || 6} Scenes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Refresh Story Option */}
                      <button
                        onClick={() => handleOpenRefreshModal(item)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                        title="Refresh Story & Cinematic Directing Re-analysis"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      {/* Toggle Button: Mark Published / Revert */}
                      <button
                        onClick={() => togglePublishStatus(item.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md ${
                          isPublished
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                        title={isPublished ? 'Click karein wapas Pending karne ke liye' : 'Click karein Published mark karne ke liye'}
                      >
                        {isPublished ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mark Pub</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQueue.length === 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Is filter mein koi story nahi mili.</p>
                <p className="text-xs text-slate-500 mt-1">"All" filter select karein ya nayi story draft karein.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Story Package Inspection & Actions (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRecord ? (
            <div className="space-y-4">
              {/* Target Story Top Status Header Bar */}
              <div
                className={`p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden shadow-xl ${
                  selectedRecord.status === 'published'
                    ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40'
                    : selectedRecord.status === 'overdue'
                    ? 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/40'
                    : 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border-cyan-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          selectedRecord.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : selectedRecord.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {selectedRecord.status === 'published' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PUBLISHED (پبلش ہو چکی ہے)</span>
                          </>
                        ) : selectedRecord.status === 'overdue' ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>OVERDUE / MISSED (اپلوڈ نہیں ہوئی)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>PENDING PUBLICATION (ابھی تک پبلش نہیں ہوئی)</span>
                          </>
                        )}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">
                        Slot: {selectedRecord.scheduledDate} • {selectedRecord.scheduledTime}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                      {selectedRecord.title}
                    </h3>

                    <p className="text-xs text-cyan-300/90 mt-1">
                      Target Strategy: {selectedRecord.targetSlotReason}
                    </p>
                  </div>

                  {/* Primary Publish Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleOpenRefreshModal(selectedRecord)}
                      className="px-3.5 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/50 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:border-cyan-400 group"
                      title="Refresh Story & Apply Cinematic Directing Layer"
                    >
                      <Clapperboard className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span>Refresh Story</span>
                    </button>

                    <button
                      onClick={() => togglePublishStatus(selectedRecord.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                        selectedRecord.status === 'published'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                      }`}
                    >
                      {selectedRecord.status === 'published' ? (
                        <>
                          <RotateCcw className="w-4 h-4 text-slate-400" />
                          <span>Revert to Pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Mark as Published</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const packageText = buildStoryPackageText(selectedRecord.storyPackage);
                        copyText(packageText, 'full-package');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Complete Flow Script & YouTube Package"
                    >
                      {copiedKey === 'full-package' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-cyan-400" />
                          <span>Copy Full Package</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Important Publication Policy Warning Notice */}
                {selectedRecord.status !== 'published' && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200/90 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-200">
                        Publication Policy Safeguard:
                      </p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Yeh story abhi tak draft/pending haalat mein hai. Jab tak aap isko video bana kar YouTube par upload na kar dein aur yahan "Mark as Published" na karein, tab tak yeh channel ke published records mein count nahi hogi.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Renders the Complete 6-Scene Story Package */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-1 overflow-hidden">
                <StoryPackageView
                  story={selectedRecord.storyPackage}
                  storyId={selectedRecord.id}
                  publishStatus={selectedRecord.status}
                  onTogglePublish={() => togglePublishStatus(selectedRecord.id)}
                  onDeleteStory={() => {
                    setQueue((prevQueue) => {
                      const updated = prevQueue.filter((item) => item.id !== selectedRecord.id);
                      savePendingQueue(updated);
                      if (selectedStoryId === selectedRecord.id) {
                        setSelectedStoryId(updated[0]?.id || '');
                      }
                      return updated;
                    });
                    showToast('Story delete kar di gayi!');
                  }}
                  onUpdateStory={(updatedStory: GeneratedStory) => {
                    setQueue((prevQueue) => {
                      const updated = prevQueue.map((item) => {
                        if (item.id === selectedRecord.id) {
                          return {
                            ...item,
                            title: updatedStory.title,
                            hook: updatedStory.hook,
                            characterTag: updatedStory.characterTag,
                            storyPackage: updatedStory,
                          };
                        }
                        return item;
                      });
                      savePendingQueue(updated);
                      return updated;
                    });
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Koi Story Select Nahi Ki Gayi</h3>
              <p className="text-xs text-slate-400 mt-1">Left side par kisi bhi pending ya scheduled story par click karein.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Draft Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Nayi Pending Story Queue Mein Shamil Karein</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Story Title / Topic:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Sheets Smart Fill AI Shortcut"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {CATEGORIES_IT_CAFETERIA.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Character Tag:</label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="WM25-1">WM25-1 (Desk & Mic Classic)</option>
                    <option value="WM25-2">WM25-2 (Standing Studio Presentation)</option>
                    <option value="WM25-3">WM25-3 (Deep Tech Cyber Glow)</option>
                    <option value="WM25-4">WM25-4 (Podcast Mic Closeup)</option>
                    <option value="WM25-5">WM25-5 (Neon Outline Holographic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Scheduled Time:</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="6:00 PM PKT">6:00 PM PKT (Prime Viral Peak)</option>
                    <option value="5:00 PM PKT">5:00 PM PKT (Office / Desktop Slot)</option>
                    <option value="7:00 PM PKT">7:00 PM PKT (Mobile Leisure Slot)</option>
                    <option value="11:30 PM PKT">11:30 PM PKT (TikTok Midnight Surge)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Date:</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. 29 Oct 2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-200/90 text-[11px]">
                💡 Nayi story khud-ba-khud 6 Scenes, Roman Urdu dialogue, YouTube description, hashtags aur thumbnail prompt ke sath create ho kar Queue mein top par add ho jayegi.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  Queue Mein Add Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refresh Story & Cinematic Directing Re-analysis Modal */}
      {refreshTargetStory &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100">
              {/* Modal Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                    <Clapperboard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Refresh Story & Cinematic Directing</h3>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                        Flow Directing Layer
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {refreshTargetStory.title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setRefreshTargetStory(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* 1. Date Requirements & Timeline Freshness Check */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Current Date Requirements Check
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Today: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Story ki date references, schedule validity aur channel timeline ko current date requirements ke mutabiq verify aur refresh kiya ja raha hai.
                  </p>
                </div>

                {/* 2. Mandatory Cinematic Directing Layer Selection */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      Cinematic Directing Preset
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">Google Flow Pre-pended</span>
                  </div>

                  <select
                    value={refreshPreset}
                    onChange={(e) => {
                      setRefreshPreset(e.target.value);
                      const p = CINEMATIC_PRESETS.find(x => x.id === e.target.value);
                      if (p) setRefreshCustomDirection(p.prefix);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 text-xs"
                  >
                    {CINEMATIC_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Custom Visual Directing Prompt (Prepends Every Scene):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRefreshCustomDirection('As a cinematic director, visualize this scene with a dynamic zoom-in and glowing right-angle hologram effect:');
                        }}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Reset Prompt
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={refreshCustomDirection || CINEMATIC_PRESETS.find(p => p.id === refreshPreset)?.prefix || ''}
                      onChange={(e) => setRefreshCustomDirection(e.target.value)}
                      placeholder="e.g. As a cinematic director, visualize this scene with a [zoom-in/right-angle/hologram] effect..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Yeh visual direction instruction scene ke script se pehle pre-pend ho kar Google Flow engine mein copy hogi.
                    </p>
                  </div>
                </div>

                {/* 3. Live Preview of Directed Scene 1 */}
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                      Scene 1 Live Directed Preview (Flow Copy-Ready)
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">10s</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                    {applyCinematicDirecting(
                      1,
                      refreshTargetStory.storyPackage.scenes[0]?.script || refreshTargetStory.title,
                      refreshCustomDirection || CINEMATIC_PRESETS.find(p => p.id === refreshPreset)?.prefix
                    )}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setRefreshTargetStory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isReanalyzing}
                    onClick={handleFullAiReanalyze}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer disabled:opacity-50"
                    title="Trigger AI Content Re-Analysis against current date"
                  >
                    {isReanalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Re-analyzing Date & Content...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Re-Analysis & Date Align</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyCinematicRefresh}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Directing & Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
