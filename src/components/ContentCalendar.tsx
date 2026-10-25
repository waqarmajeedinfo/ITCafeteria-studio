import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { PUBLISHED_VIDEOS, CATEGORIES_IT_CAFETERIA } from '../data/channelData';

interface ScheduledPost {
  id: string;
  title: string;
  category: string;
  categoryNumber: number;
  scheduledTime: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
  platform: 'YouTube + TikTok' | 'YouTube Only';
  reason: string;
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

export const ContentCalendar: React.FC = () => {
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('6:00 PM PKT');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: 'sp-1',
      title: 'Google Flow AI Video Trick: Start & End Frames',
      category: 'AI Chatbots, Workflows & Tools',
      categoryNumber: 2,
      scheduledTime: '6:00 PM PKT',
      date: '18 Oct 2026',
      status: 'published',
      platform: 'YouTube + TikTok',
      reason: 'Published on peak weekend tech engagement slot'
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
      reason: 'Captured 60 views in first 48 hours realtime'
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
  ]);

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
  const [newPostDate, setNewPostDate] = useState('25 Oct 2026');

  // Quick Publish Automation Suite State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activePublishPost, setActivePublishPost] = useState<ScheduledPost | null>(null);
  const [automationStep, setAutomationStep] = useState<number>(0);
  const [automationLoading, setAutomationLoading] = useState<boolean>(false);
  const [generatedPackage, setGeneratedPackage] = useState<PublishPackage | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [publishSubTab, setPublishSubTab] = useState<'youtube' | 'thumbnail' | 'tiktok'>('youtube');

  // Draft Auto-Fill State
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [autoFillFeedback, setAutoFillFeedback] = useState<string | null>(null);
  const [availableDrafts, setAvailableDrafts] = useState<AiChatDraft[]>([]);

  // Load drafts from localStorage and pre-curated AI Script Chatbot sessions
  const loadDrafts = () => {
    const list: AiChatDraft[] = [];

    // Check localStorage for live saved draft from AiChatbot component
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

    // Curated AI Chatbot High-Yield Script Drafts (aligned with remaining Master List topics)
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
      },
      {
        id: 'draft-chatgpt-voice',
        title: 'ChatGPT Voice Mode Pakistani Accent Trick',
        category: 'AI & Smart Technology',
        sourceLabel: 'Chatbot Draft • 104.7% Retention Blueprint',
        sourceSnippet: 'Scene 1: ChatGPT ab Pakistani Urdu accent ko 100% natural conversational flow mein reply karta hai! Kese enable karein bina kisi special prompt ke...',
        model: 'gemini-3.8-flash',
        optimizedTitle: 'ChatGPT Urdu Voice Mode Real Trick! #shorts #itcafeteria #chatgpt',
        description: 'ChatGPT se Urdu mein real-time baat karein! Latest Voice Mode update ab Pakistani Urdu bolne walon ke accent ko bina kisi rukawat ke samajh raha hai.\n\nDekhein is video mein mukammal tareeqa.\n\n#itcafeteria #chatgpt #urduai #shorts #pakistanitech',
        tags: ['chatgpt voice', 'urdu voice ai', 'chatgpt update', 'itcafeteria', 'ai in urdu', 'pakistan tech', 'openai'],
        pinnedComment: 'Aapne ChatGPT Voice Mode test kiya? Kesa laga response? 👇',
        thumbnailHeadline: 'CHATGPT VOICE URDU',
        thumbnailSubBadge: '104% RETENTION LOOP',
        thumbnailAccentColor: 'amber',
        thumbnailPrompt: 'Vertical 9:16 YouTube Shorts thumbnail cover, futuristic cyber studio backdrop, glowing green sound waves, large bold yellow text "CHATGPT VOICE URDU", high contrast neon lighting, 8k render',
        tiktokCaption: 'ChatGPT is now speaking fluent Urdu! 🎙️ #chatgpt #ai #pakistan #shorts',
        episodicBridge: 'Agli episode mein hum dekhein ge ke Gemini Live aur ChatGPT Voice mein kaun behtar hai!'
      }
    );

    setAvailableDrafts(list);
  };

  useEffect(() => {
    loadDrafts();
  }, [isPublishModalOpen]);

  // Apply selected draft directly into the Quick Publish modal package
  const applyDraftToPackage = (draft: AiChatDraft) => {
    setGeneratedPackage({
      optimizedTitle: draft.optimizedTitle,
      description: draft.description,
      tags: draft.tags,
      pinnedComment: draft.pinnedComment,
      thumbnailHeadline: draft.thumbnailHeadline,
      thumbnailSubBadge: draft.thumbnailSubBadge,
      thumbnailAccentColor: draft.thumbnailAccentColor,
      thumbnailPrompt: draft.thumbnailPrompt,
      tiktokCaption: draft.tiktokCaption,
      episodicBridge: draft.episodicBridge
    });

    if (activePublishPost) {
      setActivePublishPost({
        ...activePublishPost,
        title: draft.title,
        category: draft.category
      });
    }

    setAutoFillFeedback(`✓ Successfully auto-filled: "${draft.title}"`);
    setShowDraftSelector(false);
    setTimeout(() => setAutoFillFeedback(null), 3500);
  };

  // Quick auto-fill for the Schedule Next Short sidebar form
  const handleAutoFillScheduler = (draft: AiChatDraft) => {
    setNewPostTitle(draft.title);
    setNewPostCategory(draft.category);
    setAutoFillFeedback(`✓ Filled "${draft.title}" into scheduler!`);
    setTimeout(() => setAutoFillFeedback(null), 3000);
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
  };

  // Trigger Quick Publish Automation Script
  const triggerQuickPublish = async (targetPost?: ScheduledPost) => {
    const postToProcess = targetPost || 
      scheduledPosts.find(p => p.status === 'scheduled') || 
      scheduledPosts.find(p => p.status === 'draft') || 
      scheduledPosts[0];

    setActivePublishPost(postToProcess);
    setIsPublishModalOpen(true);
    setAutomationLoading(true);
    setAutomationStep(1);

    try {
      // Step 1: Analyzing Search & Keywords
      await new Promise(r => setTimeout(r, 400));
      setAutomationStep(2);

      // Step 2: Call Gemini Quick Publish API
      const response = await fetch('/api/ai/quick-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postToProcess.title,
          category: postToProcess.category,
          scheduledTime: postToProcess.scheduledTime,
          date: postToProcess.date,
          platform: postToProcess.platform
        })
      });

      setAutomationStep(3);
      await new Promise(r => setTimeout(r, 400));

      if (response.ok) {
        const data = await response.json();
        setGeneratedPackage({
          optimizedTitle: data.optimizedTitle || `${postToProcess.title} #shorts #itcafeteria #techtips`,
          description: data.description || `Dekhein ${postToProcess.title}. Har roz aisi hi nayi tech updates ke liye IT Cafeteria ko follow karein!\n\n#itcafeteria #shorts #pakistanitech`,
          tags: Array.isArray(data.tags) ? data.tags : ['itcafeteria', 'shorts', 'pakistan tech', 'waqar majeed', 'techtips'],
          pinnedComment: data.pinnedComment || 'Aapko yeh feature kesa laga? Comments mein zaroor batayein! 👇',
          thumbnailHeadline: data.thumbnailHeadline || 'WINDOWS 11 TRICK',
          thumbnailSubBadge: data.thumbnailSubBadge || 'INSTANT FIX',
          thumbnailAccentColor: (data.thumbnailAccentColor as any) || 'cyan',
          thumbnailPrompt: data.thumbnailPrompt || `Modern high-tech YouTube Shorts vertical 9:16 thumbnail cover, cyber dark navy background #070a13, neon blue accent glow, bold yellow 3D text "${postToProcess.title.slice(0, 20).toUpperCase()}", ultra-crisp digital interface graphics, clean layout, 8k resolution`,
          tiktokCaption: data.tiktokCaption || `Mind blowing tech trick! 🔥 #itcafeteria #techtok #pakistan #shorts`,
          episodicBridge: data.episodicBridge || `Agli episode mein hum is tool ki mazeed advanced settings samjhein ge!`
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      // Instant robust fallback
      setGeneratedPackage({
        optimizedTitle: `${postToProcess.title} #shorts #itcafeteria #techtips`,
        description: `Is video mein dekhein ${postToProcess.title}.\nGhanton ka kaam ab seconds mein!\nChannel ko subscribe karein taake agli episode miss na ho.\n\n#itcafeteria #shorts #pakistanitech #waqarmajeed`,
        tags: ['itcafeteria', 'shorts', 'pakistan tech', 'waqar majeed', 'tech tricks', 'urdu tech', 'productivity hacks'],
        pinnedComment: 'Kiya aapko yeh trick pehle maloom thi? Comment zaroor karein! 👇',
        thumbnailHeadline: postToProcess.title.slice(0, 18).toUpperCase(),
        thumbnailSubBadge: '5 SECONDS FIX',
        thumbnailAccentColor: 'cyan',
        thumbnailPrompt: `Professional vertical 9:16 YouTube Shorts thumbnail cover, futuristic cyber dark theme (#070a13), 3D embossed yellow typography "${postToProcess.title.slice(0, 18).toUpperCase()}", neon cyan glow edges, crisp 8k render, no blurry text`,
        tiktokCaption: `Wait till you see this! 🔥 #itcafeteria #tech #learnontiktok`,
        episodicBridge: `Subscribe for Part 2 releasing tomorrow at 6:00 PM PKT!`
      });
    } finally {
      setAutomationLoading(false);
      setAutomationStep(4);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const markAsPublished = () => {
    if (!activePublishPost) return;
    setScheduledPosts(prev => prev.map(p => 
      p.id === activePublishPost.id 
        ? { ...p, status: 'published', reason: 'Quick-Published with final metadata & thumbnail package' }
        : p
    ));
    setIsPublishModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Publish Action */}
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
              IT Cafeteria Content Calendar & Optimal Upload Engine
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Publishing history track karein aur pichle engagement peaks (India 37.9% + Pakistan 7.0% concurrency, 68.9% mobile traffic, aur TikTok 0am surge) ke mutabiq agle upload ka behtareen waqt pick karein.
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-center shrink-0 w-full md:w-auto min-w-[240px] shadow-lg">
            <div className="text-[11px] text-slate-400 font-mono">Next Recommended Upload</div>
            <div className="text-xl font-bold text-cyan-400 mt-0.5">Today • 6:00 PM PKT</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" /> Prime Viral Overlap Slot
            </div>

            {/* Quick Publish Automation Button */}
            <button
              onClick={() => triggerQuickPublish()}
              className="w-full mt-3 px-3 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 transition-all cursor-pointer transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Quick Publish Next Short</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast for Auto-Fill */}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Recent Publishing History & Pipeline</h3>
              <p className="text-xs text-slate-400">Tracked against the 58-video library and Section 9 daily rotation</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
                Published: {scheduledPosts.filter(p => p.status === 'published').length}
              </span>
              <span className="px-2.5 py-1 bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 rounded-lg">
                Scheduled: {scheduledPosts.filter(p => p.status === 'scheduled').length}
              </span>
            </div>
          </div>

          {/* Posts List with Individual Quick Publish Triggers */}
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div 
                key={post.id}
                className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      post.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : post.status === 'scheduled'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {post.status === 'published' ? '✓ Published' : post.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                    </span>
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

                  {/* Quick Publish / View button */}
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
                        <span>Package Specs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                    onClick={() => handleAutoFillScheduler(availableDrafts[0])}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                    title="Fill from AI Chatbot Draft"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Fill from AI</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Plan a story into your YouTube Studio scheduling pipeline
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
              Upload video as <strong>Schedule</strong> setting time to <strong>6:00 PM</strong>. YouTube backend gets 1-2 hours to process 1080p encoding, captions, and checks before public release.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK PUBLISH AUTOMATION MODAL */}
      {isPublishModalOpen && activePublishPost && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
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

            {/* DRAFT AUTO-FILL SELECTOR DRAWER */}
            {showDraftSelector && (
              <div className="p-4 bg-slate-950 border-b border-cyan-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Auto-Fill from AI Script Chatbot Context ({availableDrafts.length} drafts ready)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Click any draft to auto-populate title, description, & tags</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {availableDrafts.map((draft) => (
                    <div 
                      key={draft.id}
                      className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl space-y-1.5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {draft.category}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{draft.model}</span>
                        </div>
                        <h5 className="font-bold text-white text-xs mt-1.5 line-clamp-1">{draft.title}</h5>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{draft.sourceSnippet}</p>
                      </div>

                      <button
                        onClick={() => applyDraftToPackage(draft)}
                        className="w-full mt-2 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3 h-3 fill-current" /> Auto-Fill Package
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation Progress Tracker */}
            {automationLoading ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    {automationStep === 1 && "Stage 1: Analyzing Category & High-Yield Search Keywords..."}
                    {automationStep === 2 && "Stage 2: Synthesizing YouTube SEO Package & Series Bridge..."}
                    {automationStep === 3 && "Stage 3: Rendering High-CTR 9:16 Vertical Thumbnail Card..."}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Leveraging Gemini 3.8 Flash • Optimizing for Pakistan & India Concurrency
                  </p>
                </div>
              </div>
            ) : generatedPackage ? (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Sub Tab Navigation */}
                <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-medium">
                  <button
                    onClick={() => setPublishSubTab('youtube')}
                    className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
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
                    className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
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
                    className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      publishSubTab === 'tiktok'
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShareIcon className="w-4 h-4 text-purple-400" />
                    <span>Cross-Platform & Series Bridge</span>
                  </button>
                </div>

                {/* SubTab Contents */}
                <div className="p-5 space-y-5 flex-1">
                  {publishSubTab === 'youtube' && (
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" /> 1. Video Title (Hook + Hashtags)
                          </label>
                          <button
                            onClick={() => copyToClipboard(generatedPackage.optimizedTitle, 'title')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          >
                            {copiedField === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'title' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-white bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-sans">
                          {generatedPackage.optimizedTitle}
                        </div>
                      </div>

                      {/* Description with Series Bridge */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5" /> 2. Description & Episodic Subscriber Hook
                          </label>
                          <button
                            onClick={() => copyToClipboard(generatedPackage.description, 'description')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          >
                            {copiedField === 'description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'description' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {generatedPackage.description}
                        </pre>
                      </div>

                      {/* Search Tags & Pinned Comment */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tags */}
                        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Tag className="w-3.5 h-3.5" /> 3. Search SEO Tags ({generatedPackage.tags.length})
                            </label>
                            <button
                              onClick={() => copyToClipboard(generatedPackage.tags.join(', '), 'tags')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                            >
                              {copiedField === 'tags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'tags' ? 'Copied CSV' : 'Copy CSV'}</span>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                            {generatedPackage.tags.map((t, i) => (
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
                              onClick={() => copyToClipboard(generatedPackage.pinnedComment, 'pinned')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                            >
                              {copiedField === 'pinned' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'pinned' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
                            {generatedPackage.pinnedComment}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {publishSubTab === 'thumbnail' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Left: 9:16 Vertical Thumbnail Preview Card */}
                      <div className="md:col-span-5 flex flex-col items-center">
                        <div className="w-full max-w-[240px] aspect-[9/16] bg-slate-950 rounded-2xl border-2 border-cyan-400/50 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-cyan-500/20 group">
                          {/* Ambient glow backgrounds */}
                          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                          {/* Top Badge */}
                          <div className="relative z-10 flex justify-between items-center">
                            <span className="text-[10px] font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow">
                              SHORTS
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-slate-900/90 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                              IT CAFETERIA
                            </span>
                          </div>

                          {/* Center High-Impact Typography Badge */}
                          <div className="relative z-10 text-center my-auto space-y-2">
                            <div className="inline-block px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-md tracking-wider shadow-lg transform -rotate-1">
                              {generatedPackage.thumbnailSubBadge}
                            </div>
                            <div className="text-xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] border-y border-cyan-500/40 py-2 bg-slate-950/70 backdrop-blur-sm">
                              {generatedPackage.thumbnailHeadline}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-300 tracking-wide font-bold">
                              100% FREE • SECONDS MEIN!
                            </div>
                          </div>

                          {/* Bottom Tech Watermark */}
                          <div className="relative z-10 pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                            <span>WAQAR MAJEED</span>
                            <span className="text-amber-400 font-bold">★ 6:00 PM PKT</span>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-400 mt-2 font-mono">
                          9:16 Aspect Ratio Visual Blueprint
                        </span>
                      </div>

                      {/* Right: Section 19.1.2 Nano Banana Prompt Spec */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Nano Banana 2.1 Prompt (Section 19.1.2)
                            </span>
                            <button
                              onClick={() => copyToClipboard(generatedPackage.thumbnailPrompt, 'thumbPrompt')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                            >
                              {copiedField === 'thumbPrompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'thumbPrompt' ? 'Copied Prompt' : 'Copy Prompt'}</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                            {generatedPackage.thumbnailPrompt}
                          </p>
                        </div>

                        <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                          <div className="font-bold text-cyan-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> High-CTR Contrast Rule
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            Yellow badge text par black font aur deep navy background (<code className="text-cyan-300">#070a13</code>) mobile screen scroll karte waqt viewer ki eye-catch karne ke liye algorithm-proven hai.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {publishSubTab === 'tiktok' && (
                    <div className="space-y-4">
                      {/* TikTok Cross-Posting Caption */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Video className="w-3.5 h-3.5" /> TikTok & Instagram Reels Caption
                          </label>
                          <button
                            onClick={() => copyToClipboard(generatedPackage.tiktokCaption, 'tiktok')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          >
                            {copiedField === 'tiktok' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'tiktok' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono leading-relaxed">
                          {generatedPackage.tiktokCaption}
                        </div>
                      </div>

                      {/* Episodic Bridge (Solving 0.2% Returning Viewer Leak) */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" /> Episodic Bridge (Subscriber Retention Solution)
                          </label>
                          <button
                            onClick={() => copyToClipboard(generatedPackage.episodicBridge, 'bridge')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          >
                            {copiedField === 'bridge' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'bridge' ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                          {generatedPackage.episodicBridge}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Yeh line video ke aakhri 5 seconds aur description ke top par rakhne se returning viewers (0.2%) ki conversion 15-20% barh jati hai.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const fullText = `=== YOUTUBE SHORTS PACKAGE ===\n\nTITLE:\n${generatedPackage.optimizedTitle}\n\nDESCRIPTION:\n${generatedPackage.description}\n\nTAGS:\n${generatedPackage.tags.join(', ')}\n\nPINNED COMMENT:\n${generatedPackage.pinnedComment}\n\nTHUMBNAIL PROMPT:\n${generatedPackage.thumbnailPrompt}`;
                        copyToClipboard(fullText, 'allPackage');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedField === 'allPackage' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'allPackage' ? 'All Package Copied!' : 'Copy Complete Package'}</span>
                    </button>

                    <button
                      onClick={() => triggerQuickPublish(activePublishPost)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Re-run AI Automation"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={markAsPublished}
                    className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Published & Archive</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon helper
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    width="16" 
    height="16" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);
