import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Youtube, 
  Video, 
  Zap, 
  Globe2, 
  Bookmark,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  X,
  Download,
  Tag,
  MessageSquare,
  ExternalLink,
  Image as ImageIcon,
  Eye,
  Send,
  Layers,
  Bot,
  FileText,
  Film,
  BookOpen,
  Grid,
  List,
  CheckSquare,
  Edit2
} from 'lucide-react';
import { PUBLISHED_VIDEOS, CATEGORIES_IT_CAFETERIA, type PublishedVideo } from '../data/channelData';
import { updatePendingStoryStatus, loadPendingQueue, upsertPendingStoryRecord, type PendingStoryRecord } from '../lib/pendingQueueStore';
import { publishStoryDirectly, getAllPublishedVideos, type DynamicPublishedStory } from '../lib/publishedLibraryStore';
import type { GeneratedStory, StoryScene } from './StoryPackageView';
import { generateTopicAccurateStoryPackage, isStoryPackageMismatched } from '../lib/storyTopicGenerator';

export interface ScheduledPost {
  id: string;
  title: string;
  category: string;
  categoryNumber: number;
  scheduledTime: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
  platform: 'YouTube + TikTok' | 'YouTube Only';
  reason: string;
  storyPackage?: GeneratedStory;
  catalogVideoId?: number;
}

export interface VerificationInfo {
  status: 'already_published' | 'pending_queue' | 'draft_ready';
  catalogVideo?: DynamicPublishedStory;
  queueRecord?: PendingStoryRecord;
  message: string;
  isPublished: boolean;
}

interface PublishPackage {
  optimizedTitle: string;
  description: string;
  tags: string[];
  pinnedComment: string;
  thumbnailHeadline: string;
  thumbnailSubBadge: string;
  thumbnailAccentColor: 'cyan' | 'amber' | 'emerald' | 'purple';
  thumbnailPrompt: string;
  tiktokCaption: string;
  episodicBridge: string;
  scenes?: StoryScene[];
}

interface AiChatDraft {
  id: string;
  title: string;
  category: string;
  sourceLabel: string;
  sourceSnippet: string;
  model: string;
  optimizedTitle: string;
  description: string;
  tags: string[];
  pinnedComment: string;
  thumbnailHeadline: string;
  thumbnailSubBadge: string;
  thumbnailAccentColor: 'cyan' | 'amber' | 'emerald' | 'purple';
  thumbnailPrompt: string;
  tiktokCaption: string;
  episodicBridge: string;
}

/**
 * Robust verification helper to check if a scheduled post is:
 * 1. Already published in the 58-video IT Cafeteria catalog or dynamically published library
 * 2. In the active Pending Queue
 * 3. Or a draft/upcoming story
 */
export function verifyPostStoryStatus(post: ScheduledPost): VerificationInfo {
  const publishedCatalog = getAllPublishedVideos();
  const cleanPostTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const catalogMatch = publishedCatalog.find((v) => {
    const cleanVTitle = v.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanPostTitle.includes(cleanVTitle) || cleanVTitle.includes(cleanPostTitle);
  });

  if (catalogMatch || post.status === 'published') {
    return {
      status: 'already_published',
      catalogVideo: catalogMatch,
      isPublished: true,
      message: catalogMatch
        ? `✓ Verified: This video is already published in IT Cafeteria catalog as Video #${catalogMatch.id} (${catalogMatch.published || 'Published'})!`
        : `✓ Verified: This video is marked in IT Cafeteria published library.`
    };
  }

  const queue = loadPendingQueue();
  const queueMatch = queue.find(
    (q) => q.id === post.id || q.title.toLowerCase().trim() === post.title.toLowerCase().trim()
  );

  if (queueMatch) {
    const isPub = queueMatch.status === 'published';
    return {
      status: isPub ? 'already_published' : 'pending_queue',
      queueRecord: queueMatch,
      isPublished: isPub,
      message: isPub
        ? `✓ Verified: Published in pending queue and synchronized with library.`
        : `⏰ Verified: Active in pending queue, target slot: ${queueMatch.scheduledTime} (${queueMatch.scheduledDate})`
    };
  }

  return {
    status: 'draft_ready',
    isPublished: false,
    message: `📝 Verified: Draft / Scheduled post. Complete 10-scene package ready for review and publishing.`
  };
}

/**
 * Synthesizes or retrieves a full 10-Scene Story Package for any scheduled post.
 */
export function createFull10SceneStoryPackage(
  post: ScheduledPost,
  verification?: VerificationInfo
): GeneratedStory {
  // If post already has a package and it matches the title, prefer it
  if (post.storyPackage && post.storyPackage.scenes && post.storyPackage.scenes.length >= 6) {
    if (!isStoryPackageMismatched(post.title, post.storyPackage)) {
      return post.storyPackage;
    }
  }

  // If matched in pending queue and matches the title, use queue package
  if (verification?.queueRecord?.storyPackage && verification.queueRecord.storyPackage.scenes?.length) {
    if (!isStoryPackageMismatched(post.title, verification.queueRecord.storyPackage)) {
      return verification.queueRecord.storyPackage;
    }
  }

  // If matched in catalog and has dynamic storyPackage, use it
  if (verification?.catalogVideo?.storyPackage && verification.catalogVideo.storyPackage.scenes?.length) {
    if (!isStoryPackageMismatched(post.title, verification.catalogVideo.storyPackage)) {
      return verification.catalogVideo.storyPackage;
    }
  }

  return generateTopicAccurateStoryPackage({
    id: post.id,
    title: post.title,
    category: post.category,
    characterTag: '@WM25-1',
    scheduledTime: post.scheduledTime,
    scheduledDate: post.date,
    presenter: 'Waqar Majeed',
    channelName: 'IT Cafeteria'
  });
}

export const ContentCalendar: React.FC = () => {
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('6:00 PM PKT');
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'published' | 'draft'>('all');

  const DEFAULT_POSTS: ScheduledPost[] = [
    {
      id: 'sp-1',
      title: 'Google Flow AI Video Trick: Start & End Frames',
      category: 'AI Chatbots, Workflows & Tools',
      categoryNumber: 2,
      scheduledTime: '6:00 PM PKT',
      date: '18 Oct 2026',
      status: 'published',
      platform: 'YouTube + TikTok',
      reason: 'Published on peak weekend tech engagement slot (Catalog Video #6)',
      catalogVideoId: 6
    },
    {
      id: 'sp-2',
      title: 'Gemini Notebook AI Research Trick: Ghanton Ka Kaam Seconds Mein!',
      category: 'AI & Smart Technology',
      categoryNumber: 1,
      scheduledTime: '6:00 PM PKT',
      date: '16 Oct 2026',
      status: 'published',
      platform: 'YouTube + TikTok',
      reason: 'Captured 60 views in first 48 hours realtime (Catalog Video #1)',
      catalogVideoId: 1
    },
    {
      id: 'sp-3',
      title: 'Chrome vs Chromium Secrets (Browser Architecture)',
      category: 'Secrets',
      categoryNumber: 7,
      scheduledTime: '7:00 PM PKT',
      date: '24 Oct 2026',
      status: 'published',
      platform: 'YouTube + TikTok',
      reason: 'Category 7 Custom Story (Memory Block N1)'
    },
    {
      id: 'sp-4',
      title: 'Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!',
      category: 'PC & Windows Hacks',
      categoryNumber: 4,
      scheduledTime: '5:00 PM PKT',
      date: '24 Oct 2026',
      status: 'scheduled',
      platform: 'YouTube + TikTok',
      reason: 'High desktop utility slot before evening commute'
    },
    {
      id: 'sp-5',
      title: 'YT Automation Chapter 11: B-Roll Mastery & Generative Visuals',
      category: 'YT Automation (16:9)',
      categoryNumber: 9,
      scheduledTime: '6:30 PM PKT',
      date: '25 Oct 2026',
      status: 'draft',
      platform: 'YouTube Only',
      reason: 'Long-form lecture series prime weekend window'
    }
  ];

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    try {
      const stored = localStorage.getItem('itcafeteria_scheduled_posts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_POSTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('itcafeteria_scheduled_posts', JSON.stringify(scheduledPosts));
    } catch {}
  }, [scheduledPosts]);

  // Sync scheduled posts with pendingQueueStore to ensure live synchronization
  const syncWithPendingQueue = () => {
    try {
      const queue = loadPendingQueue();
      const existingIds = new Set(scheduledPosts.map(p => p.id));
      const newItems: ScheduledPost[] = [];

      queue.forEach(item => {
        if (!existingIds.has(item.id)) {
          newItems.push({
            id: item.id,
            title: item.title,
            category: item.category,
            categoryNumber: item.categoryId || 4,
            scheduledTime: item.scheduledTime || '6:00 PM PKT',
            date: item.scheduledDate || '26 Oct 2026',
            status: item.status === 'published' ? 'published' : item.status === 'draft' ? 'draft' : 'scheduled',
            platform: 'YouTube + TikTok',
            reason: item.targetSlotReason || 'Imported from Pending Queue',
            storyPackage: item.storyPackage
          });
        }
      });

      if (newItems.length > 0) {
        setScheduledPosts(prev => [...newItems, ...prev]);
        showToast(`✓ Synced ${newItems.length} stories from Pending Queue into Calendar!`);
      } else {
        showToast(`✓ Calendar is already synced with live queue.`);
      }
    } catch (e) {
      console.warn('Queue sync error:', e);
    }
  };

  // Optimal Slots Definition based on IT Cafeteria's real analytics
  const optimalSlots = [
    {
      time: '6:00 PM PKT (6:30 PM IST)',
      rating: 'Prime Viral Peak (Recommended)',
      type: 'All Categories / General Breakout',
      concurrency: 'Maximum India (37.9%) + Pakistan (7.0%) Audience Overlap',
      rationale: 'Indian and Pakistani audiences are concurrently active on YouTube Shorts during this post-work window. Real analytics prove highest view velocity occurs when uploaded before this hour.',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300'
    },
    {
      time: '5:00 PM PKT (5:30 PM IST)',
      rating: 'Desktop PC / Office Workflow Window',
      type: 'Category 4 (PC & Windows Hacks) & Power Automate',
      concurrency: 'Workplace PC Users & Tech Students',
      rationale: '29.1% of channel watch time is on Desktop computers! Office workers searching for productivity shortcuts and spreadsheet automations are actively seated at laptops during this time.',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-cyan-300'
    },
    {
      time: '7:00 PM – 7:30 PM PKT',
      rating: 'Mobile Smartphone Leisure Window',
      type: 'Category 7 (Secrets: WhatsApp, Chrome, Maps, Instagram)',
      concurrency: 'Mobile Phone Users (68.9% of Audience)',
      rationale: 'Evening relaxation period when mobile users browse social messaging tips. Secrets and daily mobile apps perform with lower swipe-away percentages in this slot.',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300'
    },
    {
      time: '11:30 PM PKT (0:00 AM TikTok Peak)',
      rating: 'Late-Night Algorithm Boost Slot',
      type: 'TikTok Cross-Posting & Night Algorithm',
      concurrency: 'Young Adult Mobile Audience (25-34 yrs: 48.7%)',
      rationale: 'TikTok analytics explicitly flagged that viewers were most active between 0:00 AM and 1:00 AM. Cross-posting an automated private draft at this hour leverages nocturnal viewer surges.',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300'
    }
  ];

  // Quick Scheduler Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('PC & Windows Hacks');
  const [newPostTime, setNewPostTime] = useState('6:00 PM PKT');
  const [newPostDate, setNewPostDate] = useState('26 Oct 2026');

  // Dedicated Open Story Verification Modal State
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [activeStoryPost, setActiveStoryPost] = useState<ScheduledPost | null>(null);
  const [activeStoryPackage, setActiveStoryPackage] = useState<GeneratedStory | null>(null);
  const [activeStoryVerification, setActiveStoryVerification] = useState<VerificationInfo | null>(null);
  const [storyModalTab, setStoryModalTab] = useState<'script' | 'youtube' | 'thumbnail' | 'tiktok'>('script');

  // Quick Publish Automation Suite State (Secondary specs wizard)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activePublishPost, setActivePublishPost] = useState<ScheduledPost | null>(null);
  const [automationStep, setAutomationStep] = useState<number>(0);
  const [automationLoading, setAutomationLoading] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<PublishPackage | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [publishSubTab, setPublishSubTab] = useState<'story' | 'youtube' | 'thumbnail' | 'tiktok'>('story');

  // Draft Auto-Fill State
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [autoFillFeedback, setAutoFillFeedback] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<AiChatDraft[]>([]);

  const showToast = (msg: string) => {
    setAutoFillFeedback(msg);
    setTimeout(() => setAutoFillFeedback(null), 3500);
  };

  // Body scroll lock effect when story modal or publish modal is open
  useEffect(() => {
    if (isStoryModalOpen || isPublishModalOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isStoryModalOpen, isPublishModalOpen]);

  // Load drafts
  const loadDrafts = () => {
    const list: AiChatDraft[] = [];
    try {
      const stored = localStorage.getItem('itcafeteria_latest_ai_draft');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.text) {
          list.push({
            id: 'draft-live',
            title: 'Live Chatbot Session Draft',
            category: 'AI Chatbots, Workflows & Tools',
            sourceLabel: 'Live Session • AI Copilot',
            sourceSnippet: parsed.text.slice(0, 140) + '...',
            model: parsed.model || 'gemini-3.8-flash',
            optimizedTitle: 'AI Copilot Secret: Ghanton Ka Kaam Seconds Mein! #shorts #itcafeteria',
            description: `Dekhein AI Copilot ki yeh zabardast trick:\n\n${parsed.text.slice(0, 180)}...\n\nChannel ko subscribe karein agle episode ke liye!\n#itcafeteria #shorts #pakistanitech`,
            tags: ['itcafeteria', 'shorts', 'gemini ai', 'flow studio', 'waqar majeed', 'pakistan tech', 'urdu tech'],
            pinnedComment: 'Kiya aapne yeh AI prompt pehle test kiya hai? Comment zaroor karein! 👇',
            thumbnailHeadline: 'AI COPILOT SECRET',
            thumbnailSubBadge: '100% WORKING',
            thumbnailAccentColor: 'cyan',
            thumbnailPrompt: 'Vertical 9:16 high-tech YouTube Shorts thumbnail cover, deep cyber navy background #070a13, 3D embossed yellow bold text "AI COPILOT SECRET", neon cyan glow frame, ultra-sharp 8k graphics',
            tiktokCaption: 'Unbelievable AI trick you need right now! 🔥 #itcafeteria #tech #shorts',
            episodicBridge: 'Agli video mein hum iska direct automated workflow test karenge!'
          });
        }
      }
    } catch (e) {
      console.error('Error loading stored draft', e);
    }

    list.push(
      {
        id: 'draft-sheets-smartfill',
        title: 'Google Sheets Smart Fill AI Trick',
        category: 'Google Workspace',
        sourceLabel: 'Chatbot Draft • Category F (Master List)',
        sourceSnippet: 'Scene 1: Manual data entry chor dein! Google Sheets ka Smart Fill ab generative AI pattern detection ke sath pura column khud fill karta hai bina kisi formula ke...',
        model: 'gemini-3.8-flash',
        optimizedTitle: 'Google Sheets AI Magic: Smart Fill Trick #shorts #itcafeteria #sheets',
        description: 'Google Sheets mein manual data entry band karein! Smart Fill AI feature se poora data column seconds mein auto-fill ho jata hai.\n\nKey Shortcut: Ctrl + Shift + Y\n\nChannel subscribe karein agli episode ke liye!\n#itcafeteria #shorts #pakistanitech #googlesheets',
        tags: ['google sheets', 'smart fill', 'sheets ai', 'itcafeteria', 'excel tips', 'waqar majeed', 'pakistan tech', 'data entry automation'],
        pinnedComment: 'Aap Google Sheets zyada use karte hain ya Excel? Comments mein zaroor batayein! 👇',
        thumbnailHeadline: 'GOOGLE SHEETS AI',
        thumbnailSubBadge: 'ZERO FORMULA',
        thumbnailAccentColor: 'emerald',
        thumbnailPrompt: 'Vertical 9:16 YouTube Shorts thumbnail cover, cyber dark theme, vibrant emerald green neon grid, 3D bold yellow text "GOOGLE SHEETS AI", green spreadsheet spreadsheet badge, 8k crisp resolution',
        tiktokCaption: 'Stop manual typing in Sheets! 📊 #googlesheets #productivity #techtok',
        episodicBridge: 'Agli episode mein hum Google Docs ki live voice typing automate karenge!'
      },
      {
        id: 'draft-win11-clean',
        title: 'Windows 11 Secret Temp File Cleaner',
        category: 'PC & Windows Hacks',
        sourceLabel: 'Chatbot Draft • Category 4 (Desktop Spike)',
        sourceSnippet: 'Scene 1: PC lag ho raha hai? Third-party clean apps mat install karein! Windows 11 ki built-in Storage Sense aur automated temp cleanup command...',
        model: 'gemini-3.8-flash',
        optimizedTitle: 'Windows 11 Speed Boost: Clean Temp Files in Seconds! #shorts #itcafeteria',
        description: 'Bina kisi software ke apna PC 2X fast karein! Windows 11 ka hidden Storage Sense aur temporary cache cleanup shortcut.\n\nPress Win + R -> Type %temp% -> Delete.\n\nFollow IT Cafeteria for daily PC hacks!\n#itcafeteria #windows11 #pctricks #waqarmajeed',
        tags: ['windows 11', 'pc speed up', 'clean temp files', 'itcafeteria', 'computer tips', 'waqar majeed', 'urdu tech tutorials'],
        pinnedComment: 'Yeh trick run karne ke baad aapke laptop ki kitni GB space free hui? 👇',
        thumbnailHeadline: 'CLEAN TEMP FILES',
        thumbnailSubBadge: '5 SECONDS FIX',
        thumbnailAccentColor: 'cyan',
        thumbnailPrompt: 'High-contrast 9:16 vertical YouTube Shorts thumbnail, dark slate-950 cyber background, neon cyan and electric blue borders, 3D yellow extruded text "CLEAN TEMP FILES", glowing Windows logo, ultra-clean design',
        tiktokCaption: 'Make your PC lightning fast in 5 seconds! ⚡ #pc #windows11 #techtips',
        episodicBridge: 'Part 2 mein hum Windows startup apps ko 1-click disable karna seekhein ge!'
      }
    );

    setAvailableDrafts(list);
  };

  useEffect(() => {
    loadDrafts();
  }, [isPublishModalOpen, isStoryModalOpen]);

  /**
   * Primary action requested by User:
   * Clicking "Open Story" opens the full story verification modal for any post item.
   */
  const handleOpenStory = (post: ScheduledPost) => {
    const verification = verifyPostStoryStatus(post);
    const storyPkg = createFull10SceneStoryPackage(post, verification);

    setActiveStoryPost(post);
    setActiveStoryVerification(verification);
    setActiveStoryPackage(storyPkg);
    setStoryModalTab('script');
    setIsStoryModalOpen(true);
  };

  /**
   * Mark as published directly from Open Story Verification modal
   */
  const handlePublishFromStoryModal = () => {
    if (!activeStoryPost || !activeStoryPackage) return;
    const isCurrentlyPublished = activeStoryPost.status === 'published';
    const newStatus: 'published' | 'scheduled' = isCurrentlyPublished ? 'scheduled' : 'published';

    // 1. Update local post state
    setScheduledPosts(prev => prev.map(p => 
      p.id === activeStoryPost.id 
        ? { ...p, status: newStatus, storyPackage: activeStoryPackage }
        : p
    ));

    // 2. Sync to Pending Queue
    updatePendingStoryStatus(activeStoryPost.id, newStatus === 'published' ? 'published' : 'pending');

    // 3. Sync to Published Videos Library Store
    if (newStatus === 'published') {
      publishStoryDirectly(activeStoryPackage, activeStoryPost.id);
      showToast(`✓ "${activeStoryPost.title.slice(0, 32)}..." Published Library mein verify aur live ho gayi!`);
    } else {
      showToast(`"${activeStoryPost.title.slice(0, 32)}..." wapas Scheduled Queue mein shift ho gayi.`);
    }

    // Refresh active modal state
    setActiveStoryPost({ ...activeStoryPost, status: newStatus });
    setActiveStoryVerification(verifyPostStoryStatus({ ...activeStoryPost, status: newStatus }));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const newPost: ScheduledPost = {
      id: `sp-${Date.now()}`,
      title: newPostTitle.trim(),
      category: newPostCategory,
      categoryNumber: 4,
      scheduledTime: newPostTime,
      date: newPostDate,
      status: 'scheduled',
      platform: 'YouTube + TikTok',
      reason: 'Scheduled using optimal peak engagement window'
    };

    setScheduledPosts([newPost, ...scheduledPosts]);
    setNewPostTitle('');
    showToast(`✓ Post "${newPost.title.slice(0, 24)}..." scheduled successfully!`);
  };

  // Secondary Quick Publish Automation Suite Trigger
  const triggerQuickPublish = async (targetPost?: ScheduledPost) => {
    const postToProcess = targetPost || scheduledPosts[0];
    const verification = verifyPostStoryStatus(postToProcess);
    const storyPkg = createFull10SceneStoryPackage(postToProcess, verification);

    setActivePublishPost(postToProcess);
    setPublishSubTab('youtube');
    setIsPublishModalOpen(true);
    setAutomationLoading(false);

    setGeneratedPackage({
      optimizedTitle: storyPkg.title,
      description: storyPkg.description,
      tags: storyPkg.tags,
      pinnedComment: storyPkg.discussionNotes?.replace('Pinned Comment: ', '') || 'Aapko yeh shortcut kaisa laga? Comment karein! 👇',
      thumbnailHeadline: storyPkg.thumbnailHeadline || postToProcess.title.slice(0, 18).toUpperCase(),
      thumbnailSubBadge: storyPkg.thumbnailSubBadge || '100% WORKING',
      thumbnailAccentColor: 'cyan',
      thumbnailPrompt: storyPkg.thumbnailPrompt,
      tiktokCaption: storyPkg.tiktokCaption,
      episodicBridge: storyPkg.seriesPlan,
      scenes: storyPkg.scenes
    });
  };

  // Filter posts based on tab
  const filteredPosts = useMemo(() => {
    if (filterStatus === 'all') return scheduledPosts;
    return scheduledPosts.filter(p => p.status === filterStatus);
  }, [scheduledPosts, filterStatus]);

  // Calendar days generation for October 2026 grid view
  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; posts: ScheduledPost[] }[] = [];
    for (let d = 1; d <= 31; d++) {
      const dateStr = `${d} Oct 2026`;
      const postsForDay = scheduledPosts.filter(p => {
        const cleanDate = p.date.trim();
        return cleanDate.startsWith(`${d} `) || cleanDate.startsWith(`0${d} `) || cleanDate === dateStr;
      });
      days.push({ day: d, dateStr, posts: postsForDay });
    }
    return days;
  }, [scheduledPosts]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Upload Cadence Protocol */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" /> Upload Velocity & Cadence
              </span>
              <span className="text-xs text-slate-400">Section 9 Master Schedule Protocol</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              IT Cafeteria Content Calendar & Verification Studio
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Tamam scheduled posts ki mukammal kahani (10 scenes, dialogues, Flow directing layer, thumbnail) review karein. Har post ke sath <strong>"Open Story"</strong> button mojood hai taake aap verify kar sakein ke content pehle upload ho chuka hai ya abhi publish karna hai.
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-center shrink-0 w-full md:w-auto min-w-[250px] shadow-lg">
            <div className="text-[11px] text-slate-400 font-mono">Next Recommended Upload</div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">Today • 6:00 PM PKT</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" /> Prime Viral Overlap Slot
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  const target = scheduledPosts.find(p => p.status !== 'published') || scheduledPosts[0];
                  if (target) handleOpenStory(target);
                }}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all cursor-pointer transform active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Next Story</span>
              </button>

              <button
                onClick={syncWithPendingQueue}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                title="Sync Live Stories from Pending Queue & Catalog"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Toast for Auto-Fill & Status changes */}
      {autoFillFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{autoFillFeedback}</span>
        </div>
      )}

      {/* Optimal Timing Engine Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Optimal Publishing Slots (Data-Grounded Recommendations)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Based on Lahore + India Viewership Data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {optimalSlots.map((slot, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-gradient-to-br ${slot.color} bg-slate-900/90 space-y-2 flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start gap-1 mb-1">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-white font-bold border border-slate-700/60">
                    {slot.time}
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    ★ Slot #{idx + 1}
                  </span>
                </div>
                <div className="font-bold text-white text-xs mt-1.5">{slot.rating}</div>
                <div className="text-[11px] font-mono text-cyan-300 mt-0.5">{slot.type}</div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{slot.rationale}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate">{slot.concurrency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Publishing Timeline & Scheduler Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scheduled Posts Timeline Column */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Recent Publishing History & Pipeline</span>
                <span className="text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full font-mono">
                  {filteredPosts.length} items
                </span>
              </h3>
              <p className="text-xs text-slate-400">Click "Open Story" on any post below to verify full 10 scenes before publishing</p>
            </div>

            {/* View Switcher & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-[11px]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({scheduledPosts.length})
                </button>
                <button
                  onClick={() => setFilterStatus('scheduled')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === 'scheduled' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏰ Scheduled ({scheduledPosts.filter(p => p.status === 'scheduled').length})
                </button>
                <button
                  onClick={() => setFilterStatus('published')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === 'published' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✓ Published ({scheduledPosts.filter(p => p.status === 'published').length})
                </button>
                <button
                  onClick={() => setFilterStatus('draft')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterStatus === 'draft' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📝 Drafts ({scheduledPosts.filter(p => p.status === 'draft').length})
                </button>
              </div>

              {/* View Toggle: List vs Month Grid */}
              <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
                <button
                  onClick={() => setCalendarViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    calendarViewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    calendarViewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
                  }`}
                  title="Month Calendar Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: TIMELINE LIST VIEW */}
          {calendarViewMode === 'list' ? (
            <div className="space-y-3">
              {filteredPosts.map((post) => {
                const verification = verifyPostStoryStatus(post);

                return (
                  <div 
                    key={post.id}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {post.category}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          post.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : post.status === 'scheduled'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {post.status === 'published' ? '✓ Published' : post.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                        </span>

                        {/* Real-time Verification Badge */}
                        {verification.status === 'already_published' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {verification.catalogVideo ? `Library Video #${verification.catalogVideo.id}` : 'Live in Library'}
                          </span>
                        ) : verification.status === 'pending_queue' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-cyan-400" /> Queue Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Script Ready
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          {post.platform}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight">{post.title}</h4>
                      <p className="text-[11px] text-slate-400">{post.reason}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-white font-mono">{post.scheduledTime}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{post.date}</div>
                      </div>

                      {/* Post Actions: Prominent Open Story Button + Quick Publish */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* THE REQUIRED OPEN STORY BUTTON */}
                        <button
                          onClick={() => handleOpenStory(post)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-400/60 text-cyan-300 shadow-md shadow-cyan-950/50 hover:border-cyan-300 hover:text-white"
                          title="Open full 10-scene story package, scripts & Flow prompts for verification"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open Story</span>
                        </button>

                        {/* Quick Publish / Specs button */}
                        <button
                          onClick={() => triggerQuickPublish(post)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            post.status !== 'published'
                              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {post.status !== 'published' ? (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                              <span>Quick Publish</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>Specs</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: MONTHLY CALENDAR GRID VIEW */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
                <span className="font-bold text-white">October 2026 Production Calendar</span>
                <span>Click "Open Story" on any scheduled day slot to inspect content</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
                {calendarDays.map((dayObj) => {
                  const hasPosts = dayObj.posts.length > 0;
                  return (
                    <div
                      key={dayObj.day}
                      className={`p-3 rounded-xl border flex flex-col justify-between min-h-[120px] transition-all ${
                        hasPosts
                          ? 'bg-slate-950/80 border-cyan-500/40 shadow-sm'
                          : 'bg-slate-950/30 border-slate-800/60 opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          hasPosts ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                        }`}>
                          Oct {dayObj.day}
                        </span>
                        {hasPosts && (
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            {dayObj.posts.length} post{dayObj.posts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {hasPosts ? (
                        <div className="space-y-2 my-auto">
                          {dayObj.posts.map(p => (
                            <div key={p.id} className="space-y-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                              <div className="text-[11px] font-bold text-white line-clamp-1">{p.title}</div>
                              <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-400">
                                <span>{p.scheduledTime}</span>
                                <span className={p.status === 'published' ? 'text-emerald-400' : 'text-cyan-400'}>
                                  {p.status === 'published' ? '✓ Live' : '⏰ Queued'}
                                </span>
                              </div>

                              {/* Open Story button on Calendar Day Slot card */}
                              <button
                                onClick={() => handleOpenStory(p)}
                                className="w-full mt-1 px-2 py-1 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                              >
                                <BookOpen className="w-3 h-3 text-cyan-400" />
                                <span>Open Story</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600 font-mono text-center my-auto">
                          Slot Open
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Next Short Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <form onSubmit={handleAddPost} className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Schedule Next Short</h3>
                </div>
                {availableDrafts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = availableDrafts[0];
                      setNewPostTitle(d.title);
                      setNewPostCategory(d.category);
                      showToast(`✓ Auto-filled draft "${d.title}" into form!`);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                    title="Fill from AI Chatbot Draft"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Fill from AI</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Plan a story into your YouTube Studio scheduling pipeline with full 10-scene verification
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Video Title / Hook</label>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="e.g. Windows 11 Secret Key to Boost PC Speed..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Category (1-8 Rotation)</label>
              <select
                value={newPostCategory}
                onChange={(e) => setNewPostCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {CATEGORIES_IT_CAFETERIA.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.id}. {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Slot</label>
                <select
                  value={newPostTime}
                  onChange={(e) => setNewPostTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="6:00 PM PKT">6:00 PM PKT (Prime)</option>
                  <option value="5:00 PM PKT">5:00 PM PKT (Office)</option>
                  <option value="7:00 PM PKT">7:00 PM PKT (Mobile)</option>
                  <option value="11:30 PM PKT">11:30 PM PKT (Night)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Date</label>
                <input
                  type="text"
                  value={newPostDate}
                  onChange={(e) => setNewPostDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Scheduled Queue</span>
            </button>
          </form>

          {/* YouTube Studio Schedule Instruction */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube Studio Schedule Protocol:
            </span>
            <p className="text-slate-400 leading-relaxed">
              Upload video as <strong>Schedule</strong> setting time to <strong>6:00 PM PKT</strong>. YouTube backend gets 1-2 hours to process 1080p encoding, captions, and copyright checks before public release.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FULL STORY VERIFICATION & INSPECTION MODAL (REQUESTED BY USER)
          ========================================================================= */}
      {isStoryModalOpen && activeStoryPost && activeStoryPackage && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/10">
            {/* Modal Header with Verification Badges */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-start gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-xl shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white text-base sm:text-lg">
                      Story Package Verification & Publishing Studio
                    </h3>
                    <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full font-mono font-bold">
                      10 Scenes • Flow Ready
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      {activeStoryPost.scheduledTime} ({activeStoryPost.date})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Topic: <strong className="text-cyan-300">{activeStoryPost.title}</strong> • Category: {activeStoryPost.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* VERIFICATION ALERT BANNER (Directly answers user's need to know if published or unworked) */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/90">
              {activeStoryVerification?.status === 'already_published' ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-300">
                        {activeStoryVerification.catalogVideo
                          ? `✓ Already Published in IT Cafeteria Catalog (Video #${activeStoryVerification.catalogVideo.id})`
                          : `✓ Published in IT Cafeteria Library`}
                      </div>
                      <p className="text-[11px] text-emerald-400/90 mt-0.5">
                        {activeStoryVerification.message}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 text-[10px] font-mono font-bold shrink-0">
                    LIVE ON YOUTUBE
                  </span>
                </div>
              ) : activeStoryVerification?.status === 'pending_queue' ? (
                <div className="p-3 bg-cyan-950/60 border border-cyan-500/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-cyan-300">
                        ⏰ Active in Pending Upload Queue
                      </div>
                      <p className="text-[11px] text-cyan-400/90 mt-0.5">
                        {activeStoryVerification.message}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/60 text-[10px] font-mono font-bold shrink-0">
                    QUEUE VERIFIED
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-amber-300">
                        📝 Scheduled Draft — Full Story Generated for Verification
                      </div>
                      <p className="text-[11px] text-amber-400/90 mt-0.5">
                        {activeStoryVerification?.message}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60 text-[10px] font-mono font-bold shrink-0">
                    DRAFT STAGE
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setStoryModalTab('script')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  storyModalTab === 'script'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-4 h-4 text-cyan-400" />
                <span>Story Script (All 10 Scenes)</span>
              </button>

              <button
                onClick={() => setStoryModalTab('youtube')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  storyModalTab === 'youtube'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-400" />
                <span>YouTube 5-Item Specs</span>
              </button>

              <button
                onClick={() => setStoryModalTab('thumbnail')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  storyModalTab === 'thumbnail'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>9:16 Thumbnail Card & Prompt</span>
              </button>

              <button
                onClick={() => setStoryModalTab('tiktok')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  storyModalTab === 'tiktok'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-4 h-4 text-purple-400" />
                <span>TikTok & Series Bridge</span>
              </button>
            </div>

            {/* Modal Body Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: 10 SCENES STORY SCRIPT */}
              {storyModalTab === 'script' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-cyan-400" />
                        Complete Scene-by-Scene Script ({activeStoryPackage.scenes.length} Scenes • Strictly 10s Each)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Presenter: <strong>{activeStoryPackage.presenter}</strong> ({activeStoryPackage.characterTag}) • Total Duration: {activeStoryPackage.scenes.length * 10}s
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const scenesText = activeStoryPackage.scenes.map(s => 
                            `Scene ${s.num} — ${s.duration} [${s.purpose}]\nVisual: ${s.visual}\nDialogue: "${s.dialogue}"\nFlow Script:\n${s.script}`
                          ).join('\n\n');
                          copyToClipboard(scenesText, 'allScenes');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedField === 'allScenes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'allScenes' ? 'Copied All Scenes!' : 'Copy All 10 Scenes'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Scene Cards List */}
                  <div className="space-y-3">
                    {activeStoryPackage.scenes.map((scene) => (
                      <div 
                        key={scene.num}
                        className="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2.5 transition-all"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                              Scene {scene.num}
                            </span>
                            <span className="font-semibold text-white">
                              {scene.purpose}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                              {scene.duration}
                            </span>
                            {scene.isCTA && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                                CTA Outro
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span>{scene.words} words</span>
                            <button
                              onClick={() => copyToClipboard(`Scene ${scene.num} Flow Script:\n${scene.script}`, `sc-${scene.num}`)}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === `sc-${scene.num}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              <span>{copiedField === `sc-${scene.num}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Camera Prompt */}
                        <div className="text-[11px] text-slate-300 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">Visual & Camera Direction:</span>
                          <p className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-slate-300 leading-relaxed">
                            {scene.visual}
                          </p>
                        </div>

                        {/* Spoken Roman Urdu Dialogue */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-cyan-500 uppercase font-mono font-semibold block">Roman Urdu Voiceover:</span>
                          <div className="p-3 bg-gradient-to-r from-blue-950/30 to-slate-900 rounded-lg border border-cyan-900/40 text-xs text-white font-medium italic leading-relaxed">
                            "{scene.dialogue}"
                          </div>
                        </div>

                        {/* Google Flow Directing Prompt Snippet */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">Google Flow Directing Layer:</span>
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {scene.script}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: YOUTUBE SHORTS PACKAGE */}
              {storyModalTab === 'youtube' && (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5" /> 1. Video Title (Hook + Hashtags)
                      </label>
                      <button
                        onClick={() => copyToClipboard(activeStoryPackage.title, 'modalTitle')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      >
                        {copiedField === 'modalTitle' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalTitle' ? 'Copied!' : 'Copy Title'}</span>
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-white bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      {activeStoryPackage.title}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5" /> 2. High-Retention Description
                      </label>
                      <button
                        onClick={() => copyToClipboard(activeStoryPackage.description, 'modalDesc')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      >
                        {copiedField === 'modalDesc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalDesc' ? 'Copied!' : 'Copy Description'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {activeStoryPackage.description}
                    </pre>
                  </div>

                  {/* Search Tags & Pinned Comment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tags */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Tag className="w-3.5 h-3.5" /> 3. Search SEO Tags ({activeStoryPackage.tags.length})
                        </label>
                        <button
                          onClick={() => copyToClipboard(activeStoryPackage.tags.join(', '), 'modalTags')}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                        >
                          {copiedField === 'modalTags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'modalTags' ? 'Copied CSV' : 'Copy CSV'}</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                        {activeStoryPackage.tags.map((t, i) => (
                          <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pinned Comment */}
                    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <MessageSquare className="w-3.5 h-3.5" /> 4. Pinned Engagement Comment
                        </label>
                        <button
                          onClick={() => copyToClipboard(activeStoryPackage.discussionNotes, 'modalPinned')}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                        >
                          {copiedField === 'modalPinned' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'modalPinned' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
                        {activeStoryPackage.discussionNotes}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: 9:16 VERTICAL THUMBNAIL */}
              {storyModalTab === 'thumbnail' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left: Visual 9:16 Card */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="w-full max-w-[240px] aspect-[9/16] bg-slate-950 rounded-2xl border-2 border-cyan-400/50 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-cyan-500/20">
                      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                      <div className="relative z-10 flex justify-between items-center">
                        <span className="text-[10px] font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow">
                          SHORTS
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-slate-900/90 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                          IT CAFETERIA
                        </span>
                      </div>

                      <div className="relative z-10 text-center my-auto space-y-2">
                        <div className="inline-block px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-md tracking-wider shadow-lg transform -rotate-1">
                          {activeStoryPackage.thumbnailSubBadge || '100% WORKING'}
                        </div>
                        <div className="text-xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] border-y border-cyan-500/40 py-2 bg-slate-950/70 backdrop-blur-sm">
                          {activeStoryPackage.thumbnailHeadline || activeStoryPost.title.slice(0, 18).toUpperCase()}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300 tracking-wide font-bold">
                          100% FREE • SECONDS MEIN!
                        </div>
                      </div>

                      <div className="relative z-10 pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                        <span>WAQAR MAJEED ({activeStoryPackage.characterTag})</span>
                        <span className="text-amber-400 font-bold">★ 6:00 PM PKT</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 mt-2 font-mono">
                      9:16 Aspect Ratio Visual Blueprint
                    </span>
                  </div>

                  {/* Right: Nano Banana 2.1 Prompt Spec */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Nano Banana 2.1 Prompt (Section 19.1.2)
                        </span>
                        <button
                          onClick={() => copyToClipboard(activeStoryPackage.thumbnailPrompt, 'modalThumbPrompt')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                        >
                          {copiedField === 'modalThumbPrompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'modalThumbPrompt' ? 'Copied Prompt' : 'Copy Prompt'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                        {activeStoryPackage.thumbnailPrompt}
                      </p>
                    </div>

                    <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                      <div className="font-bold text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> High-CTR Contrast Rule
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Yellow badge text par black font aur deep cyber navy background (<code className="text-cyan-300">#070a13</code>) mobile screen scroll karte waqt viewer ki attention catch karne ke liye verified hai.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TIKTOK & REELS */}
              {storyModalTab === 'tiktok' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Video className="w-3.5 h-3.5" /> TikTok & Instagram Reels Caption
                      </label>
                      <button
                        onClick={() => copyToClipboard(activeStoryPackage.tiktokCaption, 'modalTikTok')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      >
                        {copiedField === 'modalTikTok' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalTikTok' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono leading-relaxed">
                      {activeStoryPackage.tiktokCaption}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Episodic Bridge (Subscriber Retention Solution)
                      </label>
                      <button
                        onClick={() => copyToClipboard(activeStoryPackage.seriesPlan, 'modalBridge')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      >
                        {copiedField === 'modalBridge' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalBridge' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                      {activeStoryPackage.seriesPlan}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const scenesBlock = activeStoryPackage.scenes.map(s => 
                      `Scene ${s.num} [${s.purpose}] (${s.duration}):\nVisual: ${s.visual}\nDialogue: "${s.dialogue}"\nFlow Script:\n${s.script}`
                    ).join('\n\n');
                    const fullText = `=== IT CAFETERIA FULL STORY PACKAGE ===\nTitle: ${activeStoryPackage.title}\nCategory: ${activeStoryPackage.categoryName}\nPresenter: ${activeStoryPackage.presenter} (${activeStoryPackage.characterTag})\nDate: ${activeStoryPackage.dateLabel}\n\n=== 10 SCENES STORY SCRIPT ===\n\n${scenesBlock}\n\n=== 5-ITEM YOUTUBE UPLOAD PACKAGE ===\n1. TITLE:\n${activeStoryPackage.title}\n\n2. DESCRIPTION:\n${activeStoryPackage.description}\n\n3. TAGS:\n${activeStoryPackage.tags.join(', ')}\n\n4. TIKTOK CAPTION:\n${activeStoryPackage.tiktokCaption}\n\n5. THUMBNAIL PROMPT:\n${activeStoryPackage.thumbnailPrompt}\n\nPINNED COMMENT:\n${activeStoryPackage.discussionNotes}\n\nSERIES PLAN:\n${activeStoryPackage.seriesPlan}`;
                    copyToClipboard(fullText, 'modalAllPackage');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {copiedField === 'modalAllPackage' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'modalAllPackage' ? 'Full Package Copied!' : 'Copy Full 10-Scene Story Package'}</span>
                </button>

                <button
                  onClick={() => {
                    const scenesBlock = activeStoryPackage.scenes.map(s => 
                      `Scene ${s.num} [${s.purpose}] (${s.duration}):\nVisual: ${s.visual}\nDialogue: "${s.dialogue}"`
                    ).join('\n\n');
                    copyToClipboard(scenesBlock, 'modalScenesShort');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === 'modalScenesShort' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Film className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'modalScenesShort' ? 'Copied!' : 'Dialogues Only'}</span>
                </button>
              </div>

              {/* Direct Publish / Toggle Status Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePublishFromStoryModal}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    activeStoryPost.status === 'published'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>
                    {activeStoryPost.status === 'published'
                      ? 'Return to Scheduled Queue'
                      : 'Publish Story Now'}
                  </span>
                </button>

                <button
                  onClick={() => setIsStoryModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* QUICK PUBLISH AUTOMATION MODAL (Secondary specs wizard) */}
      {isPublishModalOpen && activePublishPost && generatedPackage && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/10">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl">
                  <Zap className="w-5 h-5 text-amber-400 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">Quick Publish Automation Suite</h3>
                    <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full font-mono">
                      Section 19 Compliant
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: <span className="text-slate-200 font-semibold">{activePublishPost.title}</span> ({activePublishPost.category})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDraftSelector(!showDraftSelector)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 hover:from-blue-600/50 hover:to-cyan-500/50 border border-cyan-500/50 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Draft Auto-Fill</span>
                </button>

                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub Tab Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setPublishSubTab('youtube')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  publishSubTab === 'youtube'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-400" />
                <span>YouTube Shorts Package</span>
              </button>

              <button
                onClick={() => setPublishSubTab('thumbnail')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  publishSubTab === 'thumbnail'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>9:16 Thumbnail & Prompt</span>
              </button>

              <button
                onClick={() => setPublishSubTab('tiktok')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  publishSubTab === 'tiktok'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-4 h-4 text-purple-400" />
                <span>Cross-Platform & Series Bridge</span>
              </button>
            </div>

            {/* SubTab Contents */}
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              {publishSubTab === 'youtube' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        1. Video Title
                      </label>
                      <button
                        onClick={() => copyToClipboard(generatedPackage.optimizedTitle, 'qTitle')}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedField === 'qTitle' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-white bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      {generatedPackage.optimizedTitle}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        2. Description
                      </label>
                      <button
                        onClick={() => copyToClipboard(generatedPackage.description, 'qDesc')}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedField === 'qDesc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans">
                      {generatedPackage.description}
                    </pre>
                  </div>
                </div>
              )}

              {publishSubTab === 'thumbnail' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Nano Banana 2.1 Prompt Spec
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedPackage.thumbnailPrompt, 'qPrompt')}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedField === 'qPrompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Prompt</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                      {generatedPackage.thumbnailPrompt}
                    </p>
                  </div>
                </div>
              )}

              {publishSubTab === 'tiktok' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                        TikTok Caption
                      </label>
                      <button
                        onClick={() => copyToClipboard(generatedPackage.tiktokCaption, 'qTiktok')}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedField === 'qTiktok' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono">
                      {generatedPackage.tiktokCaption}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};
