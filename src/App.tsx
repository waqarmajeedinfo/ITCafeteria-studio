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
  User,
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
  Plus,
  Trash2,
  Search,
  Globe,
  Brain,
  Edit3,
  Database,
  Terminal
} from 'lucide-react';

import { ChannelAnalytics } from './components/ChannelAnalytics';
import { LiveInsights, type OAuthNotice } from './components/LiveInsights';
import { AgentSimulator } from './components/AgentSimulator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AutopilotManager } from './components/AutopilotManager';
import { DiagnosticMessageBox } from './components/DiagnosticMessageBox';
import { DuplicateChecker } from './components/DuplicateChecker';
import { UpscalingRoadmap } from './components/UpscalingRoadmap';
import { MasterListTracker } from './components/MasterListTracker';
import { TopicBankModal } from './components/TopicBankModal';
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
import {
  getPhoneticDictionary,
  addPhoneticRule,
  editPhoneticRule,
  deletePhoneticRule,
  syncPhoneticDictionaryFromServer,
  PHONETIC_UPDATED_EVENT,
  type PhoneticRule
} from './lib/phoneticDictionaryStore';
import { 
  ThemeCustomizerModal, 
  type StudioThemeConfig, 
  DEFAULT_THEME_CONFIG,
  ACCENT_COLORS
} from './components/ThemeCustomizerModal';
import { GroundLevelSearchDashboard } from './components/GroundLevelSearchDashboard';
import { CompanionMemoryModal } from './components/CompanionMemoryModal';
import { GoLiveCoPilotModal } from './components/GoLiveCoPilotModal';
import {
  MenuBarCustomizerModal,
  loadMenuConfig,
  DEFAULT_MENU_STATE,
  type MenuCustomizerState
} from './components/MenuBarCustomizerModal';
import { dirtyManager, type DirtyRecord } from './lib/dirtyStore';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { ChannelManagerModal } from './components/ChannelManagerModal';
import { TagManagerModal } from './components/TagManagerModal';
import { loadAllChannels, type ExtendedChannelProfile } from './lib/channelStore';
import { getAllPublishedVideos } from './lib/publishedLibraryStore';
import { CATEGORIES_IT_CAFETERIA, CHANNEL_PROFILES } from './data/channelData';
import { MultiUserManagerModal } from './components/MultiUserManagerModal';
import { AgentManagementModal } from './components/AgentManagementModal';
import { userAuthManager, USER_AUTH_UPDATED_EVENT, type UserSessionProfile } from './lib/userAuthStore';
import { AuthGate } from './components/AuthGate';


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
  const [showChannelManager, setShowChannelManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showMultiUserModal, setShowMultiUserModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserSessionProfile | null>(() => userAuthManager.getUser());
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>('itcafeteria');
  const [characterTag, setCharacterTag] = useState<string>('@WM25-1');
  const [activeCategoryId, setActiveCategoryId] = useState<number>(4);
  const [publishedCount, setPublishedCount] = useState<number>(() => getAllPublishedVideos().length);
  const [liveAnalytics, setLiveAnalytics] = useState<{
    subscribers: string;
    views: string;
    videos: number;
    searchTraffic: string;
    avgRetention: string;
    isLinked: boolean;
  }>({
    subscribers: '142.4K',
    views: '18.2M',
    videos: 58,
    searchTraffic: '79.1%',
    avgRetention: '38.8%',
    isLinked: false
  });
  const [decisionNote, setDecisionNote] = useState<{
    title: string;
    hook: string;
    confidence: string;
  }>({
    title: 'Trigger dabayein',
    hook: 'Pending',
    confidence: 'Pending'
  });

  useEffect(() => {
    const handleLibUpdate = () => {
      setPublishedCount(getAllPublishedVideos().length);
    };
    window.addEventListener('itcafeteria_published_library_updated', handleLibUpdate);
    window.addEventListener('itcafeteria_story_published', handleLibUpdate);

    try {
      const raw = localStorage.getItem('itcafeteria_latest_story');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.title) {
          setDecisionNote({
            title: parsed.title.slice(0, 48),
            hook: parsed.hook ? parsed.hook.slice(0, 36) + '...' : 'Verified',
            confidence: '94%'
          });
        }
      }
    } catch {}

    fetch('/api/integrations/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.integrations?.youtube?.configured) {
          fetch('/api/integrations/youtube/insights')
            .then((r) => (r.ok ? r.json() : null))
            .then((insights) => {
              if (insights?.channel) {
                setLiveAnalytics((prev) => ({
                  ...prev,
                  subscribers: insights.channel.subscriberCount ? `${(Number(insights.channel.subscriberCount) / 1000).toFixed(1)}K` : '142.4K',
                  views: insights.channel.viewCount ? `${(Number(insights.channel.viewCount) / 1000000).toFixed(1)}M` : '18.2M',
                  videos: insights.channel.videoCount ? Number(insights.channel.videoCount) : getAllPublishedVideos().length,
                  isLinked: true
                }));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    const handlePhoneticUpdate = (e: any) => {
      setPhoneticRules(e.detail || getPhoneticDictionary());
    };
    window.addEventListener(PHONETIC_UPDATED_EVENT, handlePhoneticUpdate);

    // Initial server-side phonetic dictionary sync so user custom words are always restored
    syncPhoneticDictionaryFromServer().then((rules) => {
      if (Array.isArray(rules) && rules.length > 0) {
        setPhoneticRules(rules);
      }
    });

    const handleOpenTopic = (e: any) => {
      setActiveTab('simulator');
      if (e.detail?.tool || e.detail?.title) {
        try {
          localStorage.setItem('itcafeteria_prefill_topic', JSON.stringify(e.detail));
        } catch {}
      }
    };
    window.addEventListener('itcafeteria_open_simulator_for_topic', handleOpenTopic);

    const handleAuthChange = (e: any) => {
      setCurrentUserProfile(e.detail || userAuthManager.getUser());
    };
    window.addEventListener(USER_AUTH_UPDATED_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener('itcafeteria_published_library_updated', handleLibUpdate);
      window.removeEventListener('itcafeteria_story_published', handleLibUpdate);
      window.removeEventListener(PHONETIC_UPDATED_EVENT, handlePhoneticUpdate);
      window.removeEventListener('itcafeteria_open_simulator_for_topic', handleOpenTopic);
      window.removeEventListener(USER_AUTH_UPDATED_EVENT, handleAuthChange);
    };
  }, []);

  // Phonetic Living List state
  const [phoneticRules, setPhoneticRules] = useState<PhoneticRule[]>(getPhoneticDictionary);
  const [newRuleWord, setNewRuleWord] = useState('');
  const [newRuleFix, setNewRuleFix] = useState('');
  const [newRuleReason, setNewRuleReason] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);

  // Phonetic Rule Edit State
  const [editingRuleWord, setEditingRuleWord] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editFix, setEditFix] = useState('');
  const [editReason, setEditReason] = useState('');

  const [diagnosticGuidance, setDiagnosticGuidance] = useState<{
    tab?: TabType;
    label: string;
    stepNumber?: number;
    description?: string;
  } | null>(null);
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
  const [showGroundCriteriaModal, setShowGroundCriteriaModal] = useState(false);
  const [showCompanionMemoryModal, setShowCompanionMemoryModal] = useState(false);
  const [showLiveCoPilotModal, setShowLiveCoPilotModal] = useState(false);
  const [showTopicBankModal, setShowTopicBankModal] = useState(false);
  const [showAgentManagement, setShowAgentManagement] = useState(false);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  // Live Co-Pilot Session Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isLiveActive) {
      interval = setInterval(() => {
        setLiveElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setLiveElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveActive]);

  // Dirty State Management: Tab-Switch Unsaved Changes Guard
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [activeDirtyRecord, setActiveDirtyRecord] = useState<DirtyRecord | null>(() => dirtyManager.getDirty());

  useEffect(() => {
    return dirtyManager.subscribe((record) => {
      setActiveDirtyRecord(record);
    });
  }, []);

  // Prevent full-page scroll when Banner, Dictionary or Unsaved modal is open
  useEffect(() => {
    if (showDictionary || showBannerModal || showUnsavedModal) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [showDictionary, showBannerModal, showUnsavedModal]);


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

  // Direct reactive holo opacity from themeConfig (HolographicBackground handles internal activity boost with zero React re-renders)
  const activeHoloOpacity = themeConfig.holoOpacity;

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

    const handleDiagnosticHighlight = (e: any) => {
      if (e.detail) {
        setDiagnosticGuidance(e.detail);
        if (e.detail.tab) {
          selectTab(e.detail.tab);
        }
        setTimeout(() => {
          setDiagnosticGuidance((curr) => (curr?.label === e.detail.label ? null : curr));
        }, 7000);
      }
    };
    const handleChannelsUpdated = (e: any) => {
      const updated = e.detail || loadAllChannels();
      setChannels(updated);
    };
    window.addEventListener('itcafeteria_channels_updated', handleChannelsUpdated);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('itcafeteria_open_dictionary', openDictHandler);
      window.removeEventListener('itcafeteria_open_theme_customizer', openCustomizerHandler);
      window.removeEventListener('itcafeteria_open_banner_modal', openBannerHandler);
      window.removeEventListener('itcafeteria_open_menu_customizer', openMenuCustomizerHandler);
      window.removeEventListener('itcafeteria_menu_customizer_updated', handleMenuCustomizerUpdated);
      window.removeEventListener('itcafeteria_diagnostic_highlight', handleDiagnosticHighlight);
      window.removeEventListener('itcafeteria_channels_updated', handleChannelsUpdated);
    };
  }, []);

  // Instant, GPU-accelerated entrance animation for snappy tab switching (zero blur rasterization lag)
  const tabContentVariants = {
    hidden: {
      opacity: 0,
      y: 6,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut' as const,
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
      const scrolled = currentY > 90;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));

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
        const stickyThreshold = 520;
        if (window.scrollY > stickyThreshold) {
          window.scrollTo({
            top: stickyThreshold,
            behavior: 'instant' as ScrollBehavior,
          });
        }
      }

      isSwitchingTabRef.current = false;
    };

    const rafId = requestAnimationFrame(restorePosition);
    return () => cancelAnimationFrame(rafId);
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

  // Permission Gate: Standard users only see tabs that are granted in their permissions!
  const isTabPermitted = (tabId: TabType): boolean => {
    // Admins have access to everything
    if (!currentUserProfile || currentUserProfile.role === 'admin') return true;
    const perms = currentUserProfile.permissions;
    if (!perms) return true;

    switch (tabId) {
      case 'analytics': return perms.canAccessAnalytics !== false;
      case 'live': return Boolean(perms.canAccessLive);
      case 'signals': return Boolean(perms.canAccessSignals);
      case 'benchmarking': return Boolean(perms.canAccessBenchmarking);
      case 'autopilot': return Boolean(perms.canUseAutopilot);
      case 'simulator': return Boolean(perms.canAccessSimulator);
      case 'community': return Boolean(perms.canAccessCommunity);
      case 'pending': return Boolean(perms.canAccessPending);
      case 'calendar': return Boolean(perms.canAccessCalendar);
      case 'duplicates': return Boolean(perms.canAccessDuplicates);
      case 'masterlist': return Boolean(perms.canAccessMasterlist);
      case 'roadmap': return Boolean(perms.canAccessRoadmap);
      case 'chat': return Boolean(perms.canAccessChat);
      case 'search': return Boolean(perms.canAccessSearch);
      case 'video': return Boolean(perms.canAccessVideo);
      case 'image': return Boolean(perms.canUseThumbnailStudio);
      case 'transcribe': return Boolean(perms.canAccessTranscribe);
      case 'music': return Boolean(perms.canAccessMusic);
      case '3d': return Boolean(perms.canAccess3D);
      default: return true;
    }
  };

  // Dynamically generated tabs and groups filtered by user permissions
  const tabs = menuConfig.items
    .filter((item) => isTabPermitted(item.id))
    .map((item) => {
      let label = item.label;
      if (item.id === 'duplicates') {
        label = `Duplicate Checker (${publishedCount})`;
      }
      return {
        id: item.id,
        label,
        icon: TAB_ICONS[item.id] || <Sparkles className="w-4 h-4" />,
        group: item.groupId
      };
    });

  const groups = menuConfig.groups
    .map((g) => {
      const count = tabs.filter((t) => t.group === g.id).length;
      return {
        id: g.id,
        label: g.label,
        icon: GROUP_ICONS[g.id] || <Layers className="w-4 h-4 text-cyan-400" />,
        count
      };
    })
    .filter((g) => g.count > 0);

  const activeGroup = tabs.find((t) => t.id === activeTab)?.group || groups[0]?.id || 'core';
  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Auto-switch to first allowed tab if activeTab is revoked for standard user
  useEffect(() => {
    if (!isTabPermitted(activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [currentUserProfile, activeTab]);

  const selectTab = (id: TabType) => {
    if (id === activeTab) {
      setOpenMenu(null);
      setMobileMenuOpen(false);
      return;
    }

    // Dirty State Guard: Check if user has unsaved changes before switching tabs!
    if (dirtyManager.isDirty()) {
      setPendingTab(id);
      setActiveDirtyRecord(dirtyManager.getDirty());
      setShowUnsavedModal(true);
      setOpenMenu(null);
      setMobileMenuOpen(false);
      return;
    }

    proceedWithTabSwitch(id);
  };

  const proceedWithTabSwitch = (id: TabType) => {
    // Cache leaving tab's scroll position before navigation
    scrollPositionsRef.current[activeTab] = window.scrollY;
    isSwitchingTabRef.current = true;

    setActiveTab(id);
    setOpenMenu(null);
    setMobileMenuOpen(false);
  };

  const handleConfirmSaveAndSwitch = async () => {
    const current = activeDirtyRecord || dirtyManager.getDirty();
    if (current?.onSave) {
      try {
        await current.onSave();
      } catch (e) {
        console.error('Error during auto-save before tab switch:', e);
      }
    }
    dirtyManager.clearDirty();
    setShowUnsavedModal(false);
    if (pendingTab) {
      proceedWithTabSwitch(pendingTab);
      setPendingTab(null);
    }
  };

  const handleDiscardAndSwitch = () => {
    const current = activeDirtyRecord || dirtyManager.getDirty();
    if (current?.onDiscard) {
      current.onDiscard();
    }
    dirtyManager.clearDirty();
    setShowUnsavedModal(false);
    if (pendingTab) {
      proceedWithTabSwitch(pendingTab);
      setPendingTab(null);
    }
  };

  const handleCancelTabSwitch = () => {
    setShowUnsavedModal(false);
    setPendingTab(null);
  };


  if (!currentUserProfile) {
    return <AuthGate onAuthenticated={(user) => setCurrentUserProfile(user)} />;
  }

  return (
    <div className="min-h-screen app-shell-bg text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Fixed Full-Page Animated Holographic Background (Stays fixed during scroll, visible between blocks) */}
      <HolographicBackground
        theme={effectiveHoloTheme}
        opacity={activeHoloOpacity}
        speed={themeConfig.holoSpeed}
        activityReactive={themeConfig.activityReactiveHolo}
      />

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

          {/* Top Bar Floating Header */}
          <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-slate-950/98 via-slate-950/90 to-transparent px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/60 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-3">
              
              {/* Top Left: Phonetic Rules Dictionary, Manage Channels, Topic Bank, Go Live */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                {/* 1. Phonetic Rules Dictionary */}
                <button
                  onClick={() => setShowDictionary(true)}
                  className="h-9 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Phonetic Rules Dictionary</span>
                </button>

                {/* 2. Manage Channels */}
                <button
                  onClick={() => setShowChannelManager(true)}
                  className="h-9 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Manage Channels</span>
                </button>

                {/* 3. Topic Bank */}
                <button
                  onClick={() => setShowTopicBankModal(true)}
                  className="h-9 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-xs sm:text-sm font-medium text-emerald-200 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                  title="Profile Topic Bank, Backfill Covered Points, & Smarter Duplicate Radar"
                >
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Topic Bank</span>
                </button>

                {/* 4. Go Live */}
                <button
                  onClick={() => setShowLiveCoPilotModal(true)}
                  className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    isLiveActive
                      ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/70 text-rose-300 shadow-rose-950/50 animate-pulse'
                      : 'bg-slate-900/85 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-400 text-slate-200 hover:text-white'
                  }`}
                  title="Go Live Co-Pilot with Real-Time Adaptive Guidance"
                >
                  <Radio className={`w-4 h-4 shrink-0 ${isLiveActive ? 'text-rose-400 animate-pulse' : 'text-rose-500'}`} />
                  <span>{isLiveActive ? '🔴 On Air (Live)' : 'Go Live'}</span>
                  {isLiveActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold">
                      {Math.floor(liveElapsedSeconds / 60)}:{(liveElapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </button>

                {/* 5. Agent Management */}
                <button
                  onClick={() => setShowAgentManagement(true)}
                  className="h-9 px-3.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-xs sm:text-sm font-medium text-cyan-200 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
                  title="Review, edit, monitor, modify, delete, or add functions and actions for the back-end agent"
                >
                  <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Agent Management</span>
                </button>
              </div>

              {/* Right Side: Top Administrative Buttons + Statistics Box Directly Below */}
              <div className="flex flex-col items-end gap-2 shrink-0 self-end lg:self-start">
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Edit Banner */}
                  <button
                    onClick={() => setShowBannerModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-md transition-all cursor-pointer hover:border-cyan-400/60 hover:text-cyan-300"
                    title="Customize Banner, Height & Image"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Banner</span>
                  </button>

                  {/* Theme Customizer */}
                  <button
                    onClick={() => setShowThemeCustomizer(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-md transition-all cursor-pointer hover:border-cyan-400/60 hover:text-cyan-300"
                    title="Theme & Studio Customizer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Theme</span>
                  </button>

                  {/* Holo BG */}
                  <button
                    onClick={cycleNextHoloTheme}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-md transition-all cursor-pointer hover:border-cyan-300"
                    title="Cycle Holographic Moving Background"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Holo BG</span>
                  </button>

                  {/* Multi-User Profile & RBAC Switcher */}
                  <button
                    onClick={() => setShowMultiUserModal(true)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-md transition-all cursor-pointer ${
                      currentUserProfile?.role === 'admin'
                        ? 'bg-purple-950/80 border-purple-500/50 text-purple-200 hover:border-purple-300'
                        : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 hover:border-cyan-300'
                    }`}
                    title="Multi-User Profiles, RBAC & Dedicated Directory GitHub Sync"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentUserProfile?.role === 'admin' ? '👑 Admin' : '👤 User'}: {currentUserProfile?.username || 'Profile'}</span>
                  </button>
                </div>

                {/* Statistics Box Directly Below Administrative Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-800/80 shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Published:</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">{publishedCount}+ Videos</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-800/80 shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Search:</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">{liveAnalytics.searchTraffic}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-800/80 shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Retention:</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">{liveAnalytics.avgRetention}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-slate-800/80 shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Subs:</span>
                    <span className="text-xs font-bold text-purple-300 font-mono">{liveAnalytics.subscribers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Main Menu Navigation (Takes over top position on scroll, remains locked while scrolling) */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-slate-950/98 backdrop-blur-2xl border-cyan-500/40 shadow-2xl shadow-cyan-950/60 py-1'
            : 'bg-slate-950/95 backdrop-blur-md border-slate-800/80 shadow-lg shadow-black/40 py-1.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navbar with 4 Interactive Dropdown Menus + Clean Unified Action Cluster */}
          <div className="hidden md:flex items-center justify-between gap-3 py-0.5">
            {/* Left: 4 Group Dropdown Menus with Precise Uniform Dimensions */}
            <div className="flex items-center gap-2 shrink-0">
              {groups.map((group) => {
                const isGroupActive = activeGroup === group.id;
                const isMenuOpen = openMenu === group.id;
                const groupTabs = tabs.filter((t) => t.group === group.id);

                return (
                  <div key={group.id} className="relative shrink-0">
                    <button
                      onClick={() => setOpenMenu(isMenuOpen ? null : group.id)}
                      className={`h-10 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer border whitespace-nowrap select-none ${
                        isMenuOpen || isGroupActive
                          ? 'text-cyan-300 bg-cyan-950/50 border-cyan-500/60 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/30'
                          : 'text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
                      }`}
                      aria-expanded={isMenuOpen}
                    >
                      <span className="shrink-0">{group.icon}</span>
                      <span className="whitespace-nowrap">{group.label}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-mono font-medium shrink-0">
                        ({group.count})
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
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
            </div>

            {/* Right: Unified Navigation Controls Cluster (Single precise baseline & height) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active Tab Indicator (Precise h-10 with truncated label) */}
              <div className="h-10 px-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-2 shadow-inner whitespace-nowrap shrink-0">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold hidden xl:inline">Open:</span>
                <span className="shrink-0">{activeTabMeta?.icon}</span>
                <span className="font-semibold text-xs text-cyan-300 whitespace-nowrap max-w-[130px] sm:max-w-[160px] truncate">
                  {activeTabMeta?.label}
                </span>
              </div>

              {/* Unified Quick Actions Group (Exact same height h-10, rounded-xl, balanced alignment) */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-sm shrink-0">
                {/* Menu Bar Settings */}
                <button
                  onClick={() => setShowMenuCustomizer(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 border border-slate-800/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shadow-sm group shrink-0"
                  title="Menu Settings (Rename, Shift/Move Items, Lock/Unlock)"
                >
                  <FolderTree className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform shrink-0" />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                {/* 48-Hour Ground Search Criteria Dashboard */}
                <button
                  onClick={() => setShowGroundCriteriaModal(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:border-cyan-500/40 border border-slate-800/60 text-cyan-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shadow-sm group shrink-0"
                  title="48-Hour Ground-Level Search Criteria & Sources Dashboard"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform shrink-0" />
                  <span className="hidden sm:inline">48h Search</span>
                </button>

                {/* AI Companion Memory */}
                <button
                  onClick={() => setShowCompanionMemoryModal(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:border-purple-500/40 border border-slate-800/60 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shadow-sm group shrink-0"
                  title="AI Companion Permanent Memory & Rules Engine"
                >
                  <Brain className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="hidden sm:inline">AI Memory</span>
                </button>

                {/* Topic Bank */}
                <button
                  onClick={() => setShowTopicBankModal(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-800/60 text-emerald-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shadow-sm group shrink-0"
                  title="Topic Bank & Smarter Duplicate Radar"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="hidden sm:inline">Topic Bank</span>
                </button>

                {/* Scroll To Top Jump Button */}
                {isScrolled && (
                  <button
                    onClick={scrollToTop}
                    className="h-9 px-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm group shrink-0"
                    title="Upar Jayein / Header Dekhein"
                  >
                    <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    <span className="hidden sm:inline text-[11px]">Top</span>
                  </button>
                )}
              </div>
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative">
        {/* Diagnostic Visual Guidance Floating Banner */}
        {diagnosticGuidance && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-between gap-3 text-xs text-white animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                {diagnosticGuidance.stepNumber || 1}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-cyan-300 flex items-center gap-2 truncate">
                  <span>🎯 Diagnostic Visual Guidance:</span>
                  <span className="text-white font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {diagnosticGuidance.label}
                  </span>
                </div>
                {diagnosticGuidance.description && (
                  <p className="text-slate-300 text-[11px] truncate mt-0.5">
                    {diagnosticGuidance.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDiagnosticGuidance(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0 cursor-pointer"
              title="Dismiss Guidance Highlight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          className={`w-full transition-all duration-300 rounded-2xl ${
            diagnosticGuidance
              ? 'ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-950 p-1.5 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
              : ''
          }`}
        >
          {activeTab === 'analytics' && <ChannelAnalytics />}
          {activeTab === 'pending' && <PendingQueueTracker onNavigateTab={(tab) => selectTab(tab as TabType)} />}
          {activeTab === 'autopilot' && (
            <ErrorBoundary fallbackTitle="Autopilot Engine Error Auto-Recovered">
              <AutopilotManager onNavigateTab={(tab) => selectTab(tab as TabType)} />
            </ErrorBoundary>
          )}
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
          {activeTab === 'simulator' && (
            <ErrorBoundary fallbackTitle="Agent Simulator Error Recovered">
              <AgentSimulator />
            </ErrorBoundary>
          )}
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

      {/* Phonetic Dictionary Modal (Interactive Living List with Add/Delete & Flow Engine Sync) */}
      {showDictionary && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] h-full sm:h-auto flex flex-col overflow-hidden overscroll-contain shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Roman Urdu Phonetic Living List (Section 7)</h3>
                  <p className="text-[11px] text-slate-400">Flow voice engine ke mispronunciations ko rokne ke liye test-verified living rules</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDictionary(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Band karein"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Toolbar: Search + Add Rule Toggle + Reset */}
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lafz ya rule talash karein..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRuleForm(!showAddRuleForm);
                    setEditingRuleWord(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddRuleForm ? 'Cancel' : '+ Add Word Rule'}</span>
                </button>
              </div>
            </div>

            {/* Feedback Message */}
            {ruleSaveMessage && (
              <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2 shrink-0 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{ruleSaveMessage}</span>
              </div>
            )}

            {/* Inline Add Word Rule Form */}
            {showAddRuleForm && (
              <div className="p-4 bg-slate-950 border-b border-cyan-500/40 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span>Naya Phonetic Word Rule Shamil Karein</span>
                  <span className="text-[10px] text-slate-400 font-normal">Google Flow AI Voice ke liye</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Target Word / Slur Pattern
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. bary ya kharaabi"
                      value={newRuleWord}
                      onChange={(e) => setNewRuleWord(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Flow Phonetic Fix (Write As)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. barray ya khraabi"
                      value={newRuleFix}
                      onChange={(e) => setNewRuleFix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Pronunciation Reason / Audio Logic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flow voice slurs single r into berry, double rr creates sharp Urdu retroflex flap"
                    value={newRuleReason}
                    onChange={(e) => setNewRuleReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddRuleForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newRuleWord.trim() || !newRuleFix.trim()) {
                        setRuleSaveMessage('Word aur Fix dono fields lazmi hain.');
                        return;
                      }
                      const updated = addPhoneticRule({
                        word: newRuleWord.trim(),
                        fix: newRuleFix.trim(),
                        reason: newRuleReason.trim()
                      });
                      setPhoneticRules(updated);
                      setNewRuleWord('');
                      setNewRuleFix('');
                      setNewRuleReason('');
                      setShowAddRuleForm(false);
                      setRuleSaveMessage(`Rule "${newRuleWord.trim()}" kamyabi se save ho gaya!`);
                      setTimeout(() => setRuleSaveMessage(null), 3000);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Word Rule</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="p-4 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll space-y-2.5 text-xs divide-y divide-slate-800/60">
              {(() => {
                const filtered = phoneticRules.filter((r) => {
                  const q = ruleSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.word.toLowerCase().includes(q) ||
                    r.fix.toLowerCase().includes(q) ||
                    r.reason.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500">
                      Koi phonetic rule nahi mila. "+ Add Word Rule" daba kar naya rule banayein.
                    </div>
                  );
                }

                return filtered.map((item, idx) => {
                  const isEditing = editingRuleWord === item.word;
                  if (isEditing) {
                    return (
                      <div key={idx} className="p-3.5 bg-slate-950 border border-cyan-500/60 rounded-xl space-y-2.5 my-1 shadow-lg shadow-cyan-950/20">
                        <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                          <span>Phonetic Rule Edit Karein</span>
                          <span className="text-[10px] text-slate-400 font-mono">Original: "{item.word}"</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Word</label>
                            <input
                              type="text"
                              value={editWord}
                              onChange={(e) => setEditWord(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Flow Phonetic Fix (Write As)</label>
                            <input
                              type="text"
                              value={editFix}
                              onChange={(e) => setEditFix(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pronunciation Reason / Audio Logic</label>
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingRuleWord(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editWord.trim() || !editFix.trim()) {
                                setRuleSaveMessage('Word aur Fix dono fields lazmi hain.');
                                return;
                              }
                              const updated = editPhoneticRule(editingRuleWord, {
                                word: editWord.trim(),
                                fix: editFix.trim(),
                                reason: editReason.trim()
                              });
                              setPhoneticRules(updated);
                              setEditingRuleWord(null);
                              setRuleSaveMessage(`Rule "${editWord.trim()}" kamyabi se update aur save ho gaya!`);
                              setTimeout(() => setRuleSaveMessage(null), 3000);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="pt-2.5 first:pt-0 flex flex-col gap-1.5 group">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-white font-semibold text-xs">{item.word}</span>
                          {item.source === 'story_edit' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase flex items-center gap-1">
                              ⚡ Auto-Learned (Story Edit)
                            </span>
                          ) : item.isCustom ? (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold uppercase">
                              Custom
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-bold uppercase">
                              Verified Standard
                            </span>
                          )}
                          {item.updatedAt && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono">
                              Edited
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40 text-xs">
                            Write: {item.fix}
                          </span>

                          {/* Edit Rule Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRuleWord(item.word);
                              setEditWord(item.word);
                              setEditFix(item.fix);
                              setEditReason(item.reason);
                              setShowAddRuleForm(false);
                            }}
                            className="p-1 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Rule edit karein"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {(item.isCustom || item.source === 'story_edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = deletePhoneticRule(item.word);
                                setPhoneticRules(updated);
                                setRuleSaveMessage(`Rule "${item.word}" delete ho gaya.`);
                                setTimeout(() => setRuleSaveMessage(null), 2500);
                              }}
                              className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Rule delete karein"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="text-slate-400 text-[11px] leading-relaxed">{item.reason}</span>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-right shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Total: {phoneticRules.length} Verified Rules
              </span>
              <button
                onClick={() => setShowDictionary(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              >
                Theek Hai (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Customizer & Overlay Editor Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] h-full sm:h-auto flex flex-col overflow-hidden overscroll-contain shadow-2xl shadow-cyan-950/40">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Banner & Design Overlay Editor</h3>
                  <p className="text-xs text-slate-400">Customize banner image, height, and visual overlay settings</p>
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
            <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll space-y-4 text-xs">
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
                      Dynamic holographic animation rendering behind blocks across the viewport
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

      {/* 48-Hour Ground-Level Search Criteria & Sources Dashboard Modal */}
      <GroundLevelSearchDashboard
        isOpen={showGroundCriteriaModal}
        onClose={() => setShowGroundCriteriaModal(false)}
      />

      {/* AI Companion Persistent Memory Engine Modal */}
      <CompanionMemoryModal
        isOpen={showCompanionMemoryModal}
        onClose={() => setShowCompanionMemoryModal(false)}
      />

      {/* Go Live Co-Pilot & Streaming Companion Modal */}
      <GoLiveCoPilotModal
        isOpen={showLiveCoPilotModal}
        onClose={() => setShowLiveCoPilotModal(false)}
        isLiveActive={isLiveActive}
        onToggleLive={setIsLiveActive}
        elapsedSeconds={liveElapsedSeconds}
      />

      {/* Multi-Channel MCN Manager Modal */}
      <ChannelManagerModal
        isOpen={showChannelManager}
        onClose={() => setShowChannelManager(false)}
        onChannelsUpdated={(updated) => setChannels(updated)}
      />

      {/* Tag Manager Modal (+ Add / Upload Tag) */}
      <TagManagerModal
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
        channelId={activeChannelId}
        onTagAdded={(newTagVal) => {
          const updated = loadAllChannels();
          setChannels(updated);
          setCharacterTag(newTagVal);
        }}
      />

      {/* Dirty State Guard: Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        dirtyRecord={activeDirtyRecord}
        targetTabName={tabs.find((t) => t.id === pendingTab)?.label || 'Agla Tab'}
        onConfirmSaveAndSwitch={handleConfirmSaveAndSwitch}
        onDiscardAndSwitch={handleDiscardAndSwitch}
        onCancel={handleCancelTabSwitch}
      />

      {/* Backend Multi-User Authentication & Storage Isolation Modal */}
      <MultiUserManagerModal
        isOpen={showMultiUserModal}
        onClose={() => setShowMultiUserModal(false)}
      />

      {/* Topic Bank Hub Modal */}
      <TopicBankModal
        isOpen={showTopicBankModal}
        onClose={() => setShowTopicBankModal(false)}
        channelId={activeChannelId}
        channelName={channels[activeChannelId]?.name || 'IT Cafeteria'}
        onProduceTopic={(topic) => {
          setActiveTab('simulator');
          try {
            localStorage.setItem('itcafeteria_prefill_topic', JSON.stringify({
              title: topic.title,
              tool: topic.title.split(' ')[0],
              points: (topic.keyPoints || []).join('\n'),
              hookAngle: topic.angle || topic.hook
            }));
          } catch {}
          setShowTopicBankModal(false);
        }}
      />

      {/* Back-End Agent Management Modal */}
      <AgentManagementModal
        isOpen={showAgentManagement}
        onClose={() => setShowAgentManagement(false)}
        currentUserRole={currentUserProfile?.role}
      />

      <DiagnosticMessageBox />

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
