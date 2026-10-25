/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Vote
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [showDictionary, setShowDictionary] = useState(false);

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

        {/* Multi-Section Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 pt-1 border-t border-slate-800/40 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2.5 font-medium border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
        <p>IT Cafeteria Full-Stack Studio • Built for Waqar Majeed • Lahore, Pakistan • Roman Urdu Protocol</p>
      </footer>
    </div>
  );
}
