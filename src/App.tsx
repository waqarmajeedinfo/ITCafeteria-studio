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
  Check
} from 'lucide-react';

import { ChannelAnalytics } from './components/ChannelAnalytics';
import { AgentSimulator } from './components/AgentSimulator';
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
import { PHONETIC_DICTIONARY } from './data/channelData';

type TabType = 
  | 'analytics' 
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [showDictionary, setShowDictionary] = useState(false);
  const [openMenu, setOpenMenu] = useState<'core' | 'ai' | 'management' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

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
    { id: 'signals', label: 'Growth Signals & Anomalies', icon: <Rocket className="w-4 h-4 text-amber-400" />, group: 'core' },
    { id: 'calendar', label: 'Content Calendar', icon: <CalendarIcon className="w-4 h-4 text-emerald-400" />, group: 'core' },
    { id: 'community', label: 'Community Polls', icon: <Vote className="w-4 h-4 text-rose-400" />, group: 'core' },
    { id: 'benchmarking', label: 'Competitor Benchmarks', icon: <Users className="w-4 h-4 text-indigo-400" />, group: 'core' },
    { id: 'simulator', label: 'Agent Flow Simulator', icon: <Bot className="w-4 h-4" />, group: 'core' },
    
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
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400 font-black tracking-tighter text-sm">
                ITC
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-base tracking-tight">IT Cafeteria</h1>
                <span className="text-[10px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  Full-Stack AI Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Waqar Majeed • Google Flow Omni Flash & Interactions API Suite
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDictionary(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phonetic Rules Dictionary</span>
            </button>

            <a
              href="https://www.youtube.com/@itcafeteria"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs text-red-300 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Channel</span>
            </a>
          </div>
        </div>

        {/* Multi-Section Menu Navigation (Website Style) */}
        <nav className="relative border-t border-slate-800/40 bg-slate-950/60" ref={navRef}>
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
        {activeTab === 'signals' && <GrowthSignals />}
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

      {/* Floating AI Assistant (Chrome Gemini Style) */}
      <StudioAssistant
        currentTab={activeTab}
        currentTabLabel={activeTabMeta?.label || ''}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
        <p>IT Cafeteria Full-Stack Studio • Built for Waqar Majeed • Lahore, Pakistan • Roman Urdu Protocol</p>
      </footer>
    </div>
  );
}
