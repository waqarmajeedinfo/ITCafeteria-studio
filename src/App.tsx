/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Bot, 
  ShieldAlert, 
  Rocket, 
  ListTodo, 
  BookOpen, 
  Youtube, 
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Music,
  Globe2,
  Box,
  MessageSquare,
  Layers,
  X,
  Calendar as CalendarIcon,
  Users,
  Vote,
  ChevronDown,
  Menu,
  Check,
  BadgeCheck,
  Activity,
  Cpu,
  Radio,
  Camera,
  Sliders,
  RotateCcw,
  Upload,
  Clock
} from 'lucide-react';

import { ChannelAnalytics } from './components/ChannelAnalytics';
import { LiveInsights, type OAuthNotice } from './components/LiveInsights';
import { AgentSimulator } from './components/AgentSimulator';
import { AutopilotManager } from './components/AutopilotManager';
import { DuplicateChecker } from './components/DuplicateChecker';
import { UpscalingRoadmap } from './components/UpscalingRoadmap';
import { MasterListTracker } from './components/MasterListTracker';
import { AiChatbot } from './components/AiChatbot';
import { SearchGroundingStudio } from './components/SearchGroundingStudio';
import { VideoStudio } from './components/VideoStudio';
import { ImageThumbnailStudio } from './components/ImageThumbnailStudio';
import { AudioTranscriber } from './components/AudioTranscriber';
import { MusicStudio } from './components/MusicStudio';
import { ThreeStudio } from './components/ThreeStudio';
import { GrowthSignals } from './components/GrowthSignals';
import { ContentCalendar } from './components/ContentCalendar';
import { CompetitorBenchmarking } from './components/CompetitorBenchmarking';
import { CommunityPollWidget } from './components/CommunityPollWidget';
import { StudioAssistant } from './components/StudioAssistant';
import { HolographicBackground, type HolographicTheme, HOLOGRAPHIC_THEMES } from './components/HolographicBackground';
import { PendingQueueTracker } from './components/PendingQueueTracker';
import { PHONETIC_DICTIONARY } from './data/channelData';

type TabType = 
  | 'analytics'
  | 'pending'
  | 'autopilot'
  | 'live'
  | 'signals'
  | 'calendar'
  | 'community'
  | 'benchmarking'
  | 'simulator' 
  | 'chat'
  | 'search'
  | 'video'
  | 'image'
  | 'transcribe'
  | 'music'
  | '3d'
  | 'duplicates' 
  | 'roadmap' 
  | 'masterlist';

export type { TabType };

interface LaunchState {
  tab: TabType;
  notice: OAuthNotice | null;
}

function readLaunchState(): LaunchState {
  if (typeof window === 'undefined') return { tab: 'analytics', notice: null };
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('integration');
  const notice: OAuthNotice | null =
    provider === 'youtube' || provider === 'tiktok'
      ? {
          provider,
          status: params.get('status') === 'connected' ? 'connected' : 'error',
          message: params.get('message') || undefined,
        }
      : null;
  return {
    tab: params.get('tab') === 'live' ? 'live' : 'analytics',
    notice,
  };
}

export default function App() {
  const [launch] = useState<LaunchState>(readLaunchState);
  const [activeTab, setActiveTab] = useState<TabType>(launch.tab);
  const [oauthNotice, setOauthNotice] = useState<OAuthNotice | null>(launch.notice);
  const [showDictionary, setShowDictionary] = useState(false);
  const [openMenu, setOpenMenu] = useState<'core' | 'ai' | 'management' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Banner customization state
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('itc_custom_banner') || '/brand/banner.jpg';
    }
    return '/brand/banner.jpg';
  });
  const [bannerOverlayStyle, setBannerOverlayStyle] = useState<'cinematic' | 'cyber' | 'contrast' | 'minimal'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('itc_banner_overlay') as any) || 'cinematic';
    }
    return 'cinematic';
  });
  const [bannerHeight, setBannerHeight] = useState<'auto' | 'spacious' | 'standard' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('itc_banner_height') as any) || 'auto';
    }
    return 'auto';
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Holographic background theme & animation states
  const [holoTheme, setHoloTheme] = useState<HolographicTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('itc_holo_theme') as HolographicTheme) || 'cyber-matrix';
    }
    return 'cyber-matrix';
  });
  const [holoOpacity, setHoloOpacity] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('itc_holo_opacity');
      return saved ? parseFloat(saved) : 0.6;
    }
    return 0.6;
  });
  const [holoSpeed, setHoloSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('itc_holo_speed');
      return saved ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });

  const updateBannerUrl = (url: string) => {
    setBannerUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_custom_banner', url);
    }
  };

  const updateOverlayStyle = (style: 'cinematic' | 'cyber' | 'contrast' | 'minimal') => {
    setBannerOverlayStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_banner_overlay', style);
    }
  };

  const updateBannerHeight = (height: 'auto' | 'spacious' | 'standard' | 'compact') => {
    setBannerHeight(height);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_banner_height', height);
    }
  };

  const updateHoloTheme = (theme: HolographicTheme) => {
    setHoloTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_holo_theme', theme);
    }
  };

  const updateHoloOpacity = (op: number) => {
    setHoloOpacity(op);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_holo_opacity', op.toString());
    }
  };

  const updateHoloSpeed = (sp: number) => {
    setHoloSpeed(sp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_holo_speed', sp.toString());
    }
  };

  const cycleNextHoloTheme = () => {
    const idx = HOLOGRAPHIC_THEMES.findIndex((t) => t.id === holoTheme);
    const nextIdx = (idx + 1) % HOLOGRAPHIC_THEMES.length;
    updateHoloTheme(HOLOGRAPHIC_THEMES[nextIdx].id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateBannerUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBannerDefaults = () => {
    updateBannerUrl('/brand/banner.jpg');
    updateOverlayStyle('cinematic');
    updateBannerHeight('auto');
    updateHoloTheme('cyber-matrix');
    updateHoloOpacity(0.6);
    updateHoloSpeed(1.0);
    setCustomUrlInput('');
  };

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; group: 'core' | 'ai' | 'management' }[] = [
    // Core Channel Tabs
    { id: 'analytics', label: 'Channel Diagnostics', icon: <BarChart3 className="w-4 h-4" />, group: 'core' },
    { id: 'pending', label: 'Pending Stories & Target Queue', icon: <Clock className="w-4 h-4 text-amber-400" />, group: 'core' },
    { id: 'autopilot', label: 'Autopilot Coordinator', icon: <Cpu className="w-4 h-4 text-cyan-400" />, group: 'core' },
    { id: 'simulator', label: 'Agent Flow Simulator', icon: <Bot className="w-4 h-4" />, group: 'core' },
    { id: 'calendar', label: 'Content Calendar', icon: <CalendarIcon className="w-4 h-4 text-emerald-400" />, group: 'core' },
    { id: 'live', label: 'Live Insights (YouTube + TikTok)', icon: <Activity className="w-4 h-4 text-emerald-400" />, group: 'core' },
    { id: 'signals', label: 'Growth Signals & Anomalies', icon: <Rocket className="w-4 h-4 text-amber-400" />, group: 'core' },
    { id: 'community', label: 'Community Polls', icon: <Vote className="w-4 h-4 text-rose-400" />, group: 'core' },
    { id: 'benchmarking', label: 'Competitor Benchmarks', icon: <Users className="w-4 h-4 text-indigo-400" />, group: 'core' },
    
    // AI Studios
    { id: 'chat', label: 'AI Script Chatbot', icon: <MessageSquare className="w-4 h-4" />, group: 'ai' },
    { id: 'search', label: 'Search Grounding', icon: <Globe2 className="w-4 h-4" />, group: 'ai' },
    { id: 'video', label: 'Omni Flash Video', icon: <Video className="w-4 h-4" />, group: 'ai' },
    { id: 'image', label: 'Thumbnails (Nano Banana)', icon: <ImageIcon className="w-4 h-4" />, group: 'ai' },
    { id: 'transcribe', label: 'Voice Dictation', icon: <Mic className="w-4 h-4" />, group: 'ai' },
    { id: 'music', label: 'Music Generator', icon: <Music className="w-4 h-4" />, group: 'ai' },
    { id: '3d', label: '3D Virtual Studio', icon: <Box className="w-4 h-4" />, group: 'ai' },

    // Management & Roadmap
    { id: 'duplicates', label: 'Duplicate Checker (58)', icon: <ShieldAlert className="w-4 h-4" />, group: 'management' },
    { id: 'roadmap', label: 'Upscaling (v3.42+)', icon: <Rocket className="w-4 h-4" />, group: 'management' },
    { id: 'masterlist', label: 'Master List', icon: <ListTodo className="w-4 h-4" />, group: 'management' },
  ];

  const groups: { id: 'core' | 'ai' | 'management'; label: string; icon: React.ReactNode }[] = [
    { id: 'core', label: 'Core Channel', icon: <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'ai', label: 'AI Studios', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'management', label: 'Management', icon: <Layers className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  const activeGroup = tabs.find((t) => t.id === activeTab)?.group;
  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  const selectTab = (id: TabType) => {
    setActiveTab(id);
    setOpenMenu(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen app-shell-bg text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Fixed Full-Page Animated Holographic Background (Stays fixed during scroll, visible between blocks) */}
      <HolographicBackground theme={holoTheme} opacity={holoOpacity} speed={holoSpeed} />

      {/* Top Header — YouTube Channel Showcase with Integrated Glass Overlay */}
      <header className="relative w-full bg-slate-950/80 backdrop-blur-sm z-30">
        {/* Full-Height Channel Banner with Auto-Resize and Overlay */}
        <div className={`relative w-full overflow-hidden bg-slate-950 border-b border-slate-800/80 transition-all duration-500 ease-out ${
          bannerHeight === 'compact' 
            ? 'h-64 sm:h-72 md:h-80' 
            : bannerHeight === 'spacious' 
            ? 'h-96 sm:h-[460px] md:h-[520px]' 
            : bannerHeight === 'standard'
            ? 'h-80 sm:h-96 md:h-[420px]'
            : 'aspect-[21/9] sm:aspect-[16/6] md:aspect-[16/5.2] min-h-[280px] max-h-[480px] w-full'
        }`}>
          {/* Banner Graphic Image */}
          <img
            src={bannerUrl}
            alt="IT Cafeteria channel banner"
            className="w-full h-full object-cover object-center transition-transform duration-700"
          />

          {/* User-selected Overlay Design FX */}
          {bannerOverlayStyle === 'cyber' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/70 via-indigo-950/50 to-pink-950/30 mix-blend-color-dodge pointer-events-none" />
          )}
          {bannerOverlayStyle === 'contrast' && (
            <div className="absolute inset-0 bg-black/45 pointer-events-none" />
          )}
          {bannerOverlayStyle === 'minimal' ? (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20 pointer-events-none" />
          )}

          {/* Top-Right: Holographic Mode Switcher + Edit Banner Floating Buttons */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-2">
            <button
              onClick={cycleNextHoloTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/40 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:border-cyan-300 hover:shadow-cyan-500/20"
              title="Click to Cycle Holographic Moving Background (6 Themes)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Holo BG:</span>
              <span>{HOLOGRAPHIC_THEMES.find((t) => t.id === holoTheme)?.name.split(' ')[0]}</span>
            </button>

            <button
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:border-cyan-400/60 hover:text-cyan-300"
              title="Customize Banner, Auto-Resize & Hologram Overlay"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Banner</span>
            </button>
          </div>

          {/* Bottom Side of Banner: Integrated Branding & 3 Action Buttons */}
          <div className="absolute bottom-0 inset-x-0 z-20 pb-4 pt-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
              {/* Left: Avatar with green pulsing dot + IT Cafeteria Title & Subs (NO paragraph!) */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src="/brand/logo.jpeg"
                    alt="IT Cafeteria logo"
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full object-cover bg-slate-900 ring-2 sm:ring-3 ring-cyan-400/60 shadow-xl shadow-cyan-500/25"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full ring-2 ring-slate-950 flex items-center justify-center"
                    title="Active Creator Studio"
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-extrabold text-white text-lg sm:text-2xl md:text-3xl tracking-tight drop-shadow-md">
                      IT Cafeteria
                    </h1>
                    <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" aria-label="Verified channel" />
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 backdrop-blur-sm">
                      Official Studio
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 mt-0.5 flex-wrap drop-shadow">
                    <a
                      href="https://www.youtube.com/@itcafeteria"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 font-semibold hover:text-cyan-200 hover:underline flex items-center gap-1"
                    >
                      @itcafeteria
                    </a>
                    <span className="text-slate-500">•</span>
                    <span className="text-white font-medium">1,348 Subscribers</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">58+ Shorts</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 italic hidden sm:inline">Better Content • Bigger Dreams</span>
                  </div>
                </div>
              </div>

              {/* Right: The 3 Action Buttons with UNIFIED identical dark glass styling */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
                {/* 1. Go Live Voice Co-Pilot Button (Identical dark glass style) */}
                <button
                  onClick={() => setIsLiveActive((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer backdrop-blur-md shadow-md ${
                    isLiveActive
                      ? 'bg-rose-950/90 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/30'
                      : 'bg-slate-900/85 hover:bg-slate-800/90 border-slate-700/80 text-slate-200 hover:text-white'
                  }`}
                  title="Go Live: Real-time Hands-Free Voice Co-Pilot"
                >
                  <Radio className={`w-4 h-4 ${isLiveActive ? 'text-rose-400 animate-pulse' : 'text-rose-500'}`} />
                  <span>{isLiveActive ? 'Live Voice ON' : '🔴 Go Live'}</span>
                </button>

                {/* 2. Phonetic Rules Dictionary */}
                <button
                  onClick={() => setShowDictionary(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-md"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Phonetic Dictionary</span>
                </button>

                {/* 3. YouTube Channel Link (Identical dark glass style) */}
                <a
                  href="https://www.youtube.com/@itcafeteria"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-md"
                >
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>YouTube Channel</span>
                </a>

                {/* Quick Edit Overlay / Banner & Background Setting */}
                <button
                  onClick={() => setShowBannerModal(true)}
                  className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-md"
                  title="Banner, Auto-Resize & Hologram Settings"
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Section Menu Navigation (Website Style) — Sticky during scroll */}
        <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-black/40" ref={navRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Menu Bar */}
            <div className="hidden md:flex items-center gap-1 py-1 text-xs">
              {groups.map((group) => {
                const isGroupActive = activeGroup === group.id;
                const isOpen = openMenu === group.id;
                const groupTabs = tabs.filter((t) => t.group === group.id);
                return (
                  <div key={group.id} className="relative">
                    <button
                      onClick={() => setOpenMenu(isOpen ? null : group.id)}
                      className={`px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                        isOpen || isGroupActive
                          ? 'text-cyan-300 bg-cyan-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {group.icon}
                      <span>{group.label}</span>
                      <span className="text-[9px] font-mono text-slate-500">({groupTabs.length})</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/60 py-1.5 z-50">
                        {groupTabs.map((tab) => {
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => selectTab(tab.id)}
                              className={`w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-cyan-500/10 text-cyan-300'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <span className="shrink-0">{tab.icon}</span>
                              <span className="flex-1">{tab.label}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="hidden lg:inline">Abhi khula:</span>
                <span className="text-slate-300 font-medium">{activeTabMeta?.label}</span>
              </div>
            </div>

            {/* Mobile Menu Bar */}
            <div className="md:hidden flex items-center justify-between py-2 text-xs">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 cursor-pointer"
              >
                <Menu className="w-4 h-4 text-cyan-400" />
                <span>Menu</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <span className="text-slate-400 truncate max-w-[55%]">{activeTabMeta?.label}</span>
            </div>

            {/* Mobile Expanded Panel */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-slate-800/60 py-2 space-y-3">
                {groups.map((group) => (
                  <div key={group.id}>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      {group.icon}
                      {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {tabs.filter((t) => t.group === group.id).map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => selectTab(tab.id)}
                            className={`px-2.5 py-2 rounded-lg flex items-center gap-2 text-left text-[11px] transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : 'text-slate-300 bg-slate-800/50 hover:bg-slate-800'
                            }`}
                          >
                            <span className="shrink-0">{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'analytics' && <ChannelAnalytics />}
        {activeTab === 'pending' && <PendingQueueTracker onNavigateTab={(tab) => selectTab(tab as TabType)} />}
        {activeTab === 'autopilot' && <AutopilotManager onNavigateTab={(tab) => selectTab(tab as TabType)} />}
        {activeTab === 'live' && (
          <LiveInsights
            oauthNotice={oauthNotice}
            onDismissOauthNotice={() => setOauthNotice(null)}
          />
        )}
        {activeTab === 'signals' && <GrowthSignals onNavigateTab={(tab) => selectTab(tab as TabType)} />}
        {activeTab === 'calendar' && <ContentCalendar />}
        {activeTab === 'community' && <CommunityPollWidget />}
        {activeTab === 'benchmarking' && <CompetitorBenchmarking />}
        {activeTab === 'simulator' && <AgentSimulator />}
        {activeTab === 'chat' && <AiChatbot />}
        {activeTab === 'search' && <SearchGroundingStudio />}
        {activeTab === 'video' && <VideoStudio />}
        {activeTab === 'image' && <ImageThumbnailStudio />}
        {activeTab === 'transcribe' && <AudioTranscriber />}
        {activeTab === 'music' && <MusicStudio />}
        {activeTab === '3d' && <ThreeStudio />}
        {activeTab === 'duplicates' && <DuplicateChecker />}
        {activeTab === 'roadmap' && <UpscalingRoadmap />}
        {activeTab === 'masterlist' && <MasterListTracker />}
      </main>

      {/* Phonetic Dictionary Modal */}
      {showDictionary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Roman Urdu Phonetic Living List (Section 7)</h3>
              </div>
              <button 
                onClick={() => setShowDictionary(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs divide-y divide-slate-800/60">
              <p className="text-slate-400 text-xs pb-2">
                Flow voice engine ke mispronunciations ko rokne ke liye test-verified spellings:
              </p>
              {PHONETIC_DICTIONARY.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300 font-semibold">{item.word}</span>
                    <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      Write: {item.fix}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{item.reason}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowDictionary(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium"
              >
                Theek Hai (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Customizer & Overlay Editor Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-950/40">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Banner & Design Overlay Editor</h3>
                  <p className="text-xs text-slate-400">بینر کی تصویر، ہائٹ اور ڈیزائن اوورلے اپنی مرضی سے سیٹ کریں</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBannerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Live Preview Card */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Live Banner Preview
                </label>
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
                  <img
                    src={bannerUrl}
                    alt="Preview"
                    className="w-full h-full object-cover object-center"
                  />
                  {bannerOverlayStyle === 'cyber' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/70 via-indigo-950/50 to-pink-950/30 mix-blend-color-dodge pointer-events-none" />
                  )}
                  {bannerOverlayStyle === 'contrast' && (
                    <div className="absolute inset-0 bg-black/45 pointer-events-none" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      IT Cafeteria
                    </span>
                    <span className="text-[10px] text-slate-300 bg-black/40 px-2 py-0.5 rounded-full border border-slate-700">
                      {bannerHeight.toUpperCase()} • {bannerOverlayStyle.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Preset Banners
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => updateBannerUrl('/brand/banner.jpg')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      bannerUrl === '/brand/banner.jpg'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">Official IT Cafeteria</div>
                    <div className="text-[10px] text-slate-400">Default Studio Banner</div>
                  </button>

                  <button
                    onClick={() => updateBannerUrl('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2560&q=80')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      bannerUrl.includes('photo-1550751827-4bd374c3f58b')
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">Cyber Grid</div>
                    <div className="text-[10px] text-slate-400">Futuristic Matrix FX</div>
                  </button>

                  <button
                    onClick={() => updateBannerUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2560&q=80')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      bannerUrl.includes('photo-1518770660439-4636190af475')
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">AI Hardware</div>
                    <div className="text-[10px] text-slate-400">High-Tech Microchip</div>
                  </button>
                </div>
              </div>

              {/* Upload or Custom URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Upload from Device
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 hover:border-cyan-500/50 text-slate-300 cursor-pointer transition-colors text-xs font-medium">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Choose Banner Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Custom Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          updateBannerUrl(customUrlInput.trim());
                        }
                      }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Overlay Design Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Banner Overlay Design Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cinematic', label: 'Cinematic', desc: 'Bottom Vignette' },
                    { id: 'cyber', label: 'Cyberpunk', desc: 'Cyan/Indigo FX' },
                    { id: 'contrast', label: 'Dark Contrast', desc: 'Darkened Tint' },
                    { id: 'minimal', label: 'Minimal', desc: 'Light Vignette' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateOverlayStyle(style.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bannerOverlayStyle === style.id
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{style.label}</div>
                      <div className="text-[10px] text-slate-400">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Height & Auto-Resize Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Banner Height & Auto-Resize
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'auto', label: 'Auto-Resize', size: 'Smart Aspect (Rec)' },
                    { id: 'compact', label: 'Compact', size: '280px Fixed' },
                    { id: 'standard', label: 'Standard', size: '380px Balanced' },
                    { id: 'spacious', label: 'Spacious', size: '480px Cinematic' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => updateBannerHeight(h.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bannerHeight === h.id
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>{h.label}</span>
                        {h.id === 'auto' && <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono">AUTO</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{h.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated Holographic Moving Background Section (6 Themes) */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Animated Holographic Background (6 Themes)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      فل پیج کے بیک گراؤنڈ پر اینیمیٹڈ ہولوگرافک موومنٹ جو بلاکس کے درمیان مستقل دکھائی دیتی ہے
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2.5">
                  {HOLOGRAPHIC_THEMES.map((t) => {
                    const isSelected = holoTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateHoloTheme(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 ring-1 ring-cyan-400 shadow-lg shadow-cyan-950/50'
                            : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${t.previewColor} shrink-0 animate-pulse`} />
                          <span className="font-semibold text-xs truncate">{t.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Opacity & Speed Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-slate-800/60">
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>Hologram Intensity / Opacity:</span>
                      <span className="text-cyan-300 font-mono font-semibold">{Math.round(holoOpacity * 100)}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.3, 0.55, 0.75, 0.95].map((op) => (
                        <button
                          key={op}
                          onClick={() => updateHoloOpacity(op)}
                          className={`py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                            Math.abs(holoOpacity - op) < 0.05
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {Math.round(op * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>Motion Speed:</span>
                      <span className="text-cyan-300 font-mono font-semibold">{holoSpeed}x</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 1.0, 1.5, 2.0].map((sp) => (
                        <button
                          key={sp}
                          onClick={() => updateHoloSpeed(sp)}
                          className={`py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                            Math.abs(holoSpeed - sp) < 0.05
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={resetBannerDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Default</span>
              </button>

              <button
                onClick={() => setShowBannerModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <StudioAssistant
        currentTab={activeTab}
        currentTabLabel={activeTabMeta?.label || ''}
        onNavigate={(tab) => setActiveTab(tab)}
        isLiveActive={isLiveActive}
        onToggleLive={(active) => setIsLiveActive(active)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
        <p>IT Cafeteria Full-Stack Studio • Built for Waqar Majeed • Lahore, Pakistan • Roman Urdu Protocol</p>
        <p className="mt-1.5 flex items-center justify-center gap-3 text-[11px]">
          <a href="/terms.html" target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition-colors">Terms of Service</a>
          <span className="text-slate-700">•</span>
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition-colors">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}
