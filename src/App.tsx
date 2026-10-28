/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Clock,
  ArrowUp,
  FolderTree,
  Square,
  Pause,
  Play
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
import { DiagnosticVisualGuidance } from './components/DiagnosticVisualGuidance';
import { PHONETIC_DICTIONARY } from './data/channelData';
import { 
  ThemeCustomizerModal, 
  type StudioThemeConfig, 
  DEFAULT_THEME_CONFIG,
  ACCENT_COLORS
} from './components/ThemeCustomizerModal';
import {
  MenuBarCustomizerModal,
  loadMenuConfig,
  saveMenuConfig,
  DEFAULT_MENU_STATE,
  type MenuCustomizerState
} from './components/MenuBarCustomizerModal';

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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
      return (localStorage.getItem('itc_banner_height') as any) || 'spacious';
    }
    return 'spacious';
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Theme Customizer & Studio WP-Style Configuration
  const [themeConfig, setThemeConfig] = useState<StudioThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('itc_studio_theme_config');
      if (saved) {
        try {
          return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(saved) };
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_THEME_CONFIG;
  });
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);

  // Menu Bar Customizer Configuration State (WordPress Style Menu Manager)
  const [menuConfig, setMenuConfig] = useState<MenuCustomizerState>(loadMenuConfig);
  const [showMenuCustomizer, setShowMenuCustomizer] = useState(false);
  const [draggedNavbarGroupId, setDraggedNavbarGroupId] = useState<string | null>(null);
  const [dragOverNavbarGroupId, setDragOverNavbarGroupId] = useState<string | null>(null);

  useEffect(() => {
    const handleMenuUpdate = (e: any) => {
      if (e.detail) {
        setMenuConfig(e.detail);
      }
    };
    window.addEventListener('itcafeteria_menu_customizer_updated', handleMenuUpdate);
    return () => window.removeEventListener('itcafeteria_menu_customizer_updated', handleMenuUpdate);
  }, []);

  // Holographic background theme & animation states
  const [holoTheme, setHoloTheme] = useState<HolographicTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('itc_holo_theme') as HolographicTheme) || themeConfig.holoTheme || 'cyber-matrix';
    }
    return themeConfig.holoTheme || 'cyber-matrix';
  });
  const [holoOpacity, setHoloOpacity] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('itc_holo_opacity');
      return saved ? parseFloat(saved) : themeConfig.holoOpacity || 0.65;
    }
    return themeConfig.holoOpacity || 0.65;
  });
  const [holoSpeed, setHoloSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('itc_holo_speed');
      return saved ? parseFloat(saved) : themeConfig.holoSpeed || 1.0;
    }
    return themeConfig.holoSpeed || 1.0;
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

  const updateThemeConfig = (updated: StudioThemeConfig) => {
    setThemeConfig(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('itc_studio_theme_config', JSON.stringify(updated));
    }
    updateHoloTheme(updated.holoTheme);
    updateHoloOpacity(updated.holoOpacity);
    updateHoloSpeed(updated.holoSpeed);
  };

  const resetThemeConfig = () => {
    updateThemeConfig(DEFAULT_THEME_CONFIG);
  };

  // Time-of-day Auto Theme Engine
  const [effectiveHoloTheme, setEffectiveHoloTheme] = useState<HolographicTheme>(themeConfig.holoTheme);

  useEffect(() => {
    if (!themeConfig.autoThemeByTime) {
      setEffectiveHoloTheme(themeConfig.holoTheme);
      return;
    }
    const updateTimeTheme = () => {
      const hour = new Date().getHours();
      let target: HolographicTheme = 'cyber-matrix';
      if (hour >= 6 && hour < 12) {
        target = 'holographic-aurora';
      } else if (hour >= 12 && hour < 17) {
        target = 'hex-nexus';
      } else if (hour >= 17 && hour < 20) {
        target = 'quantum-orbs';
      } else {
        target = 'cyber-matrix';
      }
      setEffectiveHoloTheme(target);
    };
    updateTimeTheme();
    const interval = setInterval(updateTimeTheme, 60000);
    return () => clearInterval(interval);
  }, [themeConfig.autoThemeByTime, themeConfig.holoTheme]);

  // User activity-level reactive opacity sensor
  const [userActive, setUserActive] = useState(false);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!themeConfig.activityReactiveHolo) {
      setUserActive(false);
      return;
    }
    const handleActivity = () => {
      setUserActive(true);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      activityTimerRef.current = setTimeout(() => {
        setUserActive(false);
      }, 6000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [themeConfig.activityReactiveHolo]);

  const activeHoloOpacity = themeConfig.activityReactiveHolo
    ? (userActive ? Math.min(1.0, themeConfig.holoOpacity + 0.16) : Math.max(0.25, themeConfig.holoOpacity * 0.75))
    : themeConfig.holoOpacity;

  const cycleNextHoloTheme = () => {
    const idx = HOLOGRAPHIC_THEMES.findIndex((t) => t.id === effectiveHoloTheme);
    const nextIdx = (idx + 1) % HOLOGRAPHIC_THEMES.length;
    const nextTheme = HOLOGRAPHIC_THEMES[nextIdx].id;
    updateThemeConfig({
      ...themeConfig,
      autoThemeByTime: false,
      holoTheme: nextTheme,
    });
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
    updateHoloOpacity(0.65);
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

    const openDictHandler = () => setShowDictionary(true);
    const openCustomizerHandler = () => setShowThemeCustomizer(true);
    const openBannerHandler = () => setShowBannerModal(true);
    const openMenuCustomizerHandler = () => setShowMenuCustomizer(true);

    window.addEventListener('itcafeteria_open_dictionary', openDictHandler);
    window.addEventListener('itcafeteria_open_theme_customizer', openCustomizerHandler);
    window.addEventListener('itcafeteria_open_banner_modal', openBannerHandler);
    window.addEventListener('itcafeteria_open_menu_customizer', openMenuCustomizerHandler);

    const handleMenuCustomizerUpdated = (e: any) => {
      if (e.detail) {
        setMenuConfig(e.detail);
      } else {
        setMenuConfig(loadMenuConfig());
      }
    };
    window.addEventListener('itcafeteria_menu_customizer_updated', handleMenuCustomizerUpdated);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('itcafeteria_open_dictionary', openDictHandler);
      window.removeEventListener('itcafeteria_open_theme_customizer', openCustomizerHandler);
      window.removeEventListener('itcafeteria_open_banner_modal', openBannerHandler);
      window.removeEventListener('itcafeteria_open_menu_customizer', openMenuCustomizerHandler);
      window.removeEventListener('itcafeteria_menu_customizer_updated', handleMenuCustomizerUpdated);
    };
  }, []);

  // Framer-motion entrance animation variants for seamless tab transitions
  const tabContentVariants = {
    hidden: {
      opacity: 0,
      y: 16,
      filter: 'blur(3px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.35,
        ease: 'easeOut' as const,
        staggerChildren: 0.07,
        delayChildren: 0.03,
      },
    },
  };

  // Track window scroll to smoothly elevate sticky navigation when scrolling down
  const [isScrolled, setIsScrolled] = useState(false);

  // Per-tab individual scroll position memory to preserve user focus points in long-form components
  const scrollPositionsRef = useRef<Partial<Record<TabType, number>>>({});
  const isSwitchingTabRef = useRef<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 90);

      // Record scroll position continuously for the active tab while reading
      if (!isSwitchingTabRef.current) {
        scrollPositionsRef.current[activeTab] = currentY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  // Restore remembered scroll position when switching tabs
  useEffect(() => {
    const targetScroll = scrollPositionsRef.current[activeTab];

    const restorePosition = () => {
      if (typeof targetScroll === 'number') {
        window.scrollTo({
          top: targetScroll,
          behavior: 'instant' as ScrollBehavior,
        });
      } else {
        // First visit to this tab:
        // If sticky nav is already locked (isScrolled), smoothly anchor right below the sticky navigation
        const stickyThreshold = 520;
        if (window.scrollY > stickyThreshold) {
          window.scrollTo({
            top: stickyThreshold,
            behavior: 'instant' as ScrollBehavior,
          });
        }
      }

      setTimeout(() => {
        isSwitchingTabRef.current = false;
      }, 50);
    };

    const rafId = requestAnimationFrame(() => {
      restorePosition();
    });
    const timerId = setTimeout(() => {
      restorePosition();
    }, 40);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [activeTab]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  type TabGroup = string;

  const TAB_ICONS: Record<TabType, React.ReactNode> = {
    analytics: <BarChart3 className="w-4 h-4 text-cyan-400" />,
    live: <Activity className="w-4 h-4 text-emerald-400" />,
    signals: <Rocket className="w-4 h-4 text-amber-400" />,
    benchmarking: <Users className="w-4 h-4 text-indigo-400" />,
    autopilot: <Cpu className="w-4 h-4 text-emerald-400" />,
    simulator: <Bot className="w-4 h-4 text-cyan-400" />,
    community: <Vote className="w-4 h-4 text-rose-400" />,
    pending: <Clock className="w-4 h-4 text-amber-400" />,
    calendar: <CalendarIcon className="w-4 h-4 text-cyan-400" />,
    duplicates: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    masterlist: <ListTodo className="w-4 h-4 text-slate-300" />,
    roadmap: <Rocket className="w-4 h-4 text-purple-400" />,
    chat: <MessageSquare className="w-4 h-4 text-cyan-300" />,
    search: <Globe2 className="w-4 h-4 text-emerald-300" />,
    video: <Video className="w-4 h-4 text-blue-400" />,
    image: <ImageIcon className="w-4 h-4 text-amber-400" />,
    transcribe: <Mic className="w-4 h-4 text-fuchsia-400" />,
    music: <Music className="w-4 h-4 text-pink-400" />,
    '3d': <Box className="w-4 h-4 text-violet-400" />
  };

  const GROUP_ICONS: Record<string, React.ReactNode> = {
    core: <BarChart3 className="w-4 h-4 text-cyan-400" />,
    automation: <Cpu className="w-4 h-4 text-emerald-400" />,
    management: <Layers className="w-4 h-4 text-indigo-400" />,
    ai: <Sparkles className="w-4 h-4 text-amber-400" />
  };

  // Dynamically generated tabs and groups from Menu Customizer Configuration
  const tabs = menuConfig.items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: TAB_ICONS[item.id] || <Sparkles className="w-4 h-4" />,
    group: item.groupId
  }));

  const groups = menuConfig.groups.map((g) => {
    const count = tabs.filter((t) => t.group === g.id).length;
    return {
      id: g.id,
      label: g.label,
      icon: GROUP_ICONS[g.id] || <Layers className="w-4 h-4 text-cyan-400" />,
      count,
      isLocked: g.isLocked
    };
  });

  const handleNavbarGroupDragStart = (e: React.DragEvent, groupId: string, isLocked: boolean) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedNavbarGroupId(groupId);
    e.dataTransfer.setData('text/plain', `navgroup:${groupId}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNavbarGroupDrop = (e: React.DragEvent, targetGroupId: string, targetLocked: boolean) => {
    e.preventDefault();
    if (!draggedNavbarGroupId || draggedNavbarGroupId === targetGroupId) {
      setDraggedNavbarGroupId(null);
      setDragOverNavbarGroupId(null);
      return;
    }
    if (targetLocked) {
      setDraggedNavbarGroupId(null);
      setDragOverNavbarGroupId(null);
      return;
    }

    const fromIndex = menuConfig.groups.findIndex((g) => g.id === draggedNavbarGroupId);
    const toIndex = menuConfig.groups.findIndex((g) => g.id === targetGroupId);
    if (fromIndex !== -1 && toIndex !== -1) {
      const newGroups = [...menuConfig.groups];
      const [moved] = newGroups.splice(fromIndex, 1);
      newGroups.splice(toIndex, 0, moved);
      const updated = { ...menuConfig, groups: newGroups };
      setMenuConfig(updated);
      saveMenuConfig(updated);
    }

    setDraggedNavbarGroupId(null);
    setDragOverNavbarGroupId(null);
  };

  const activeGroup = tabs.find((t) => t.id === activeTab)?.group || 'core';
  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  const selectTab = (id: TabType) => {
    if (id === activeTab) {
      setOpenMenu(null);
      setMobileMenuOpen(false);
      return;
    }

    // Cache leaving tab's scroll position before navigation
    scrollPositionsRef.current[activeTab] = window.scrollY;
    isSwitchingTabRef.current = true;

    setActiveTab(id);
    setOpenMenu(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen app-shell-bg text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Fixed Full-Page Animated Holographic Background (Stays fixed during scroll, visible between blocks) */}
      <HolographicBackground theme={effectiveHoloTheme} opacity={activeHoloOpacity} speed={themeConfig.holoSpeed} />

      {/* Top Header — YouTube Channel Showcase with Full-Height Banner */}
      <header className="relative w-full bg-slate-950/80 backdrop-blur-sm z-30">
        {/* Full-Height Channel Banner with Height Control and object-top to prevent clipping */}
        <div className={`relative w-full overflow-hidden bg-slate-950 transition-all duration-500 ease-out ${
          bannerHeight === 'compact' 
            ? 'h-80 sm:h-96 md:h-[420px]' 
            : bannerHeight === 'spacious' 
            ? 'h-[480px] sm:h-[560px] md:h-[640px]' 
            : bannerHeight === 'standard'
            ? 'h-96 sm:h-[450px] md:h-[520px]'
            : 'h-[440px] sm:h-[520px] md:h-[600px] w-full'
        }`}>
          {/* Banner Graphic Image — object-top ensures Waqar's head/neck and logo artwork are fully preserved without clipping */}
          <img
            src={bannerUrl}
            alt="IT Cafeteria channel banner"
            className="w-full h-full object-cover object-top transition-transform duration-700"
          />

          {/* User-selected Overlay Design FX */}
          {bannerOverlayStyle === 'cyber' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/70 via-indigo-950/50 to-pink-950/30 mix-blend-color-dodge pointer-events-none" />
          )}
          {bannerOverlayStyle === 'contrast' && (
            <div className="absolute inset-0 bg-black/45 pointer-events-none" />
          )}
          {bannerOverlayStyle === 'minimal' ? (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
          )}

          {/* Top Bar Floating Header: Covers previously empty space with Live Status, Breaking Ticker & Quick Actions */}
          <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800/40 backdrop-blur-[2px]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Brand Identity, Tagline & Live Indicator */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-md shadow-cyan-950 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white tracking-wide">IT CAFETERIA</span>
                    {themeConfig.showStudioBadge && (
                      <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    {/* Interactive Autopilot / Live Manual Control Pill */}
                    {isLiveActive ? (
                      <div className="flex items-center gap-1">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-[10px] font-bold text-rose-300 tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          LIVE ACTIVE
                        </span>
                        <button
                          onClick={() => {
                            setIsLiveActive(false);
                            window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition-all shadow-md shadow-rose-950"
                          title="Click to STOP Live Autopilot immediately"
                        >
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>STOP</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-semibold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          AUTOPILOT: STOPPED
                        </span>
                        <button
                          onClick={() => {
                            setIsLiveActive(true);
                            window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_start_all'));
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                          title="Click to Start Autopilot Manually"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Start</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {themeConfig.showTagline && (
                    <p className="text-[10px] text-slate-400 hidden sm:block">{themeConfig.channelTagline}</p>
                  )}
                </div>
              </div>

              {/* Center: Live Stats Ticker or Announcement Bar */}
              <div className="flex-1 max-w-2xl hidden lg:flex items-center justify-center gap-3">
                {themeConfig.showTopBarTicker && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 shadow-inner backdrop-blur-md">
                    <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider">Broadcast:</span>
                    <span className="text-[11px] text-slate-200 truncate max-w-md">{themeConfig.topAnnouncementText}</span>
                  </div>
                )}

                {themeConfig.showTopBarStats && !themeConfig.showTopBarTicker && (
                  <div className="flex items-center gap-3 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-300 backdrop-blur-md">
                    <span className="flex items-center gap-1 text-cyan-300 font-semibold"><span className="text-slate-400 font-normal">Subs:</span> 142.4K</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-emerald-300 font-semibold"><span className="text-slate-400 font-normal">Views:</span> 18.2M</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-purple-300 font-semibold"><span className="text-slate-400 font-normal">Videos:</span> 348</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-amber-300 font-semibold"><span className="text-slate-400 font-normal">Score:</span> 98.4%</span>
                  </div>
                )}
              </div>

              {/* Right: Holographic Mode Switcher + Edit Banner Floating Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={cycleNextHoloTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/40 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:border-cyan-300 hover:shadow-cyan-500/20"
                  title="Click to Cycle Holographic Moving Background"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Holo BG:</span>
                  <span>{HOLOGRAPHIC_THEMES.find((t) => t.id === effectiveHoloTheme)?.name.split(' ')[0]}</span>
                </button>

                {/* Edit Banner Button (Works exactly as before, untouched) */}
                <button
                  onClick={() => setShowBannerModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:border-cyan-400/60 hover:text-cyan-300"
                  title="Customize Banner, Height & Image"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Banner</span>
                </button>
              </div>
            </div>

            {/* Optional Quick Action Bar under Top Header if enabled */}
            {themeConfig.showTopBarShortcuts && (
              <div className="max-w-7xl mx-auto mt-2 pt-1.5 border-t border-slate-800/40 hidden md:flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Quick Hub:</span>
                  <button onClick={() => selectTab('chat')} className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-cyan-300 cursor-pointer transition-colors border border-slate-800">💬 AI Script</button>
                  <button onClick={() => selectTab('transcribe')} className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-purple-300 cursor-pointer transition-colors border border-slate-800">🎙️ Voice Dictation</button>
                  <button onClick={() => selectTab('duplicates')} className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-rose-300 cursor-pointer transition-colors border border-slate-800">🛡️ Duplicate Guard</button>
                  <button onClick={() => selectTab('autopilot')} className="px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-emerald-300 cursor-pointer transition-colors border border-slate-800">⚡ Autopilot</button>
                </div>

                {themeConfig.showTopBarStats && themeConfig.showTopBarTicker && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span><strong className="text-cyan-300">142.4K</strong> Subs</span>
                    <span>•</span>
                    <span><strong className="text-emerald-300">18.2M</strong> Views</span>
                    <span>•</span>
                    <span><strong className="text-purple-300">348</strong> Videos</span>
                    <span>•</span>
                    <span><strong className="text-amber-300">98.4%</strong> Positive</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub-Header Action Bar — blended seamlessly with tabs background, duplicate logo & branding removed */}
        <div className="w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* The 3 Action Buttons with identical subtle dark glass styling as Phonetic Dictionary */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* 1. Channel Button */}
              <a
                href="https://www.youtube.com/@itcafeteria"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-md"
              >
                <Youtube className="w-4 h-4 text-red-500" />
                <span>Channel</span>
              </a>

              {/* 2. Phonetic Rules Dictionary */}
              <button
                onClick={() => setShowDictionary(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-md"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Phonetic Rules Dictionary</span>
              </button>

              {/* 3. Go Live Voice Co-Pilot Manual Control Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = !isLiveActive;
                    setIsLiveActive(next);
                    if (!next) {
                      window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
                    } else {
                      window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_start_all'));
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md shadow-md ${
                    isLiveActive
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-rose-950/70'
                      : 'bg-slate-900/85 hover:bg-slate-800/90 border-slate-700/80 text-slate-200 hover:text-white'
                  }`}
                  title={isLiveActive ? 'Live Voice is Active. Click to STOP' : 'Click to Go Live (Voice Co-Pilot)'}
                >
                  <Radio className={`w-4 h-4 ${isLiveActive ? 'text-rose-400 animate-pulse' : 'text-rose-500'}`} />
                  <span>{isLiveActive ? 'Live Active' : 'Go Live'}</span>
                </button>

                {isLiveActive && (
                  <button
                    onClick={() => {
                      setIsLiveActive(false);
                      window.dispatchEvent(new CustomEvent('itcafeteria_autopilot_stop_all'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950 cursor-pointer transition-all"
                    title="Stop Live Co-Pilot & Autopilot immediately"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* WordPress Theme & Studio Customizer Button (Circled in user screenshot) */}
            <button
              onClick={() => setShowThemeCustomizer(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md shrink-0 flex items-center gap-2 hover:border-cyan-500/60 group"
              title="WordPress-style Theme & Studio Customizer"
            >
              <Sliders className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Theme Customizer</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Main Menu Navigation (Takes over top position on scroll, remains locked while scrolling) */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-slate-950/98 backdrop-blur-2xl border-cyan-500/40 shadow-2xl shadow-cyan-950/60 py-1'
            : 'bg-slate-950/95 backdrop-blur-md border-slate-800/80 shadow-lg shadow-black/40 py-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navbar with 4 Interactive Dropdown Menus */}
          <div className="hidden md:flex items-center gap-3 py-2.5">
            {groups.map((group) => {
              const isGroupActive = activeGroup === group.id;
              const isMenuOpen = openMenu === group.id;
              const groupTabs = tabs.filter((t) => t.group === group.id);
              const isNavDragOver = dragOverNavbarGroupId === group.id;

              return (
                <div
                  key={group.id}
                  draggable={!group.isLocked}
                  onDragStart={(e) => handleNavbarGroupDragStart(e, group.id, group.isLocked)}
                  onDragOver={(e) => {
                    if (draggedNavbarGroupId && !group.isLocked) {
                      e.preventDefault();
                      setDragOverNavbarGroupId(group.id);
                    }
                  }}
                  onDrop={(e) => handleNavbarGroupDrop(e, group.id, group.isLocked)}
                  onDragEnd={() => {
                    setDraggedNavbarGroupId(null);
                    setDragOverNavbarGroupId(null);
                  }}
                  className={`relative transition-all ${
                    isNavDragOver ? 'ring-2 ring-cyan-400 rounded-xl scale-105 shadow-lg shadow-cyan-950' : ''
                  }`}
                >
                  <button
                    onClick={() => setOpenMenu(isMenuOpen ? null : group.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all border ${
                      !group.isLocked ? 'cursor-grab active:cursor-grabbing hover:border-cyan-400' : 'cursor-pointer'
                    } ${
                      isMenuOpen || isGroupActive
                        ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-950/50'
                        : 'text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                    aria-expanded={isMenuOpen}
                    title={
                      !group.isLocked
                        ? `UNLOCKED: Drag karke navbar tabs ki sequence badlein (Left-to-Right)`
                        : `${group.label} (Click karke menu dekhein)`
                    }
                  >
                    <span className="shrink-0">{group.icon}</span>
                    <span>{group.label}</span>
                    <span className="text-xs text-slate-400 font-mono font-normal">({group.count})</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isMenuOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>

                  {/* Floating Dropdown Popup Menu */}
                  {isMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-[#0c1427]/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                      {groupTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            data-guide-target={`tab-${tab.id}`}
                            onClick={() => selectTab(tab.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-cyan-950/60 text-cyan-300 font-medium border border-cyan-500/30 shadow-sm'
                                : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="shrink-0">{tab.icon}</span>
                              <span className="truncate text-sm">{tab.label}</span>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active Tab Indicator & Top Scroll Jump on the right */}
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden lg:inline text-slate-400 text-xs">Currently Open:</span>
              <div className="text-cyan-300 font-medium px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-inner">
                {activeTabMeta?.icon}
                <span className="font-semibold text-xs sm:text-sm">{activeTabMeta?.label}</span>
              </div>

              {/* Menu Bar Handler / Customizer Button (Right-side corner of menu bar) */}
              <button
                onClick={() => setShowMenuCustomizer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all shadow-md group shrink-0"
                title="Menu Settings (Rename, Shift/Move Items, Lock/Unlock)"
              >
                <FolderTree className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline text-xs font-semibold text-slate-200">Settings</span>
              </button>

              {/* Scroll To Top Jump Button when Scrolled */}
              {isScrolled && (
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-xs font-semibold cursor-pointer transition-all shadow-md group ml-1"
                  title="Upar Jayein / Header Dekhein"
                >
                  <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="hidden sm:inline text-[11px]">Top</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Bar */}
          <div className="md:hidden flex items-center justify-between py-2 text-xs">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span>Navigation Menu</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-medium truncate max-w-[36vw] flex items-center gap-1.5">
                {activeTabMeta?.icon} {activeTabMeta?.label}
              </span>
              <button
                onClick={() => setShowMenuCustomizer(true)}
                className="p-1 rounded-md bg-slate-900 border border-slate-700 text-cyan-400 hover:text-white cursor-pointer"
                title="Menu Settings"
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
              {isScrolled && (
                <button
                  onClick={scrollToTop}
                  className="p-1 rounded-md bg-slate-900 border border-slate-700 text-cyan-400 cursor-pointer"
                  title="Scroll to Top"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Expanded Panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800/60 py-2.5 space-y-3">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    {group.icon}
                    <span>{group.label}</span>
                    <span className="text-slate-500 font-mono">({group.count})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    {tabs.filter((t) => t.group === group.id).map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => selectTab(tab.id)}
                          className={`px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'text-slate-300 bg-slate-900/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{tab.icon}</span>
                            <span className="truncate">{tab.label}</span>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
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

      {/* Main Container with Staggered Entrance Animation */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
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
        </motion.div>
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

      {/* WordPress-style Theme & Studio Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
        config={themeConfig}
        onChange={updateThemeConfig}
        onReset={resetThemeConfig}
      />

      {/* WordPress-style Menu Bar Customizer & Hierarchy Modal */}
      <MenuBarCustomizerModal
        isOpen={showMenuCustomizer}
        onClose={() => setShowMenuCustomizer(false)}
        config={menuConfig}
        onSave={(updated) => setMenuConfig(updated)}
        onReset={() => {
          setMenuConfig(DEFAULT_MENU_STATE);
          localStorage.removeItem('itcafeteria_menu_customizer_config');
        }}
      />

      <DiagnosticVisualGuidance />

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
