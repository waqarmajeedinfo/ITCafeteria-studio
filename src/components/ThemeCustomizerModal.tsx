import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Layout, 
  Type, 
  RotateCcw, 
  X, 
  Check, 
  Sun, 
  Moon, 
  Sunset, 
  Compass, 
  Activity, 
  Sliders, 
  Zap, 
  Layers, 
  Radio, 
  TrendingUp, 
  Eye, 
  ShieldCheck,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { HOLOGRAPHIC_THEMES, type HolographicTheme } from './HolographicBackground';

export type AccentPreset = 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose';
export type SurfaceTone = 'obsidian' | 'slate' | 'cyber';
export type CardRadius = 'sharp' | 'standard' | 'pill';
export type LayoutDensity = 'compact' | 'normal' | 'spacious';

export interface StudioThemeConfig {
  accent: AccentPreset;
  surfaceTone: SurfaceTone;
  cardRadius: CardRadius;
  layoutDensity: LayoutDensity;
  glassGlow: 'low' | 'medium' | 'high';
  
  // Top bar physical space modules
  showTopBarStats: boolean;
  showTopBarTicker: boolean;
  showTopBarShortcuts: boolean;
  topAnnouncementText: string;
  showTopLiveBadge: boolean;
  
  // Auto-theme & Hologram
  autoThemeByTime: boolean;
  activityReactiveHolo: boolean;
  holoTheme: HolographicTheme;
  holoOpacity: number;
  holoSpeed: number;
  
  // Brand identity
  channelTagline: string;
  showTagline: boolean;
  showStudioBadge: boolean;
}

export const DEFAULT_THEME_CONFIG: StudioThemeConfig = {
  accent: 'cyan',
  surfaceTone: 'obsidian',
  cardRadius: 'standard',
  layoutDensity: 'normal',
  glassGlow: 'high',
  
  showTopBarStats: true,
  showTopBarTicker: true,
  showTopBarShortcuts: true,
  topAnnouncementText: '🚀 LIVE STUDIO • Waqar Majeed: AI, Deep Learning & Automation Series',
  showTopLiveBadge: true,
  
  autoThemeByTime: true,
  activityReactiveHolo: true,
  holoTheme: 'cyber-matrix',
  holoOpacity: 0.65,
  holoSpeed: 1.0,
  
  channelTagline: 'Better Content • Bigger Dreams',
  showTagline: true,
  showStudioBadge: true,
};

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StudioThemeConfig;
  onChange: (updated: StudioThemeConfig) => void;
  onReset: () => void;
}

export const ACCENT_COLORS: { id: AccentPreset; name: string; hex: string; bg: string; border: string; glow: string }[] = [
  { id: 'cyan', name: 'Cyber Cyan', hex: '#06b6d4', bg: 'bg-cyan-500', border: 'border-cyan-400', glow: 'shadow-cyan-500/30' },
  { id: 'emerald', name: 'Neon Emerald', hex: '#10b981', bg: 'bg-emerald-500', border: 'border-emerald-400', glow: 'shadow-emerald-500/30' },
  { id: 'purple', name: 'Electric Purple', hex: '#a855f7', bg: 'bg-purple-500', border: 'border-purple-400', glow: 'shadow-purple-500/30' },
  { id: 'amber', name: 'Sunset Amber', hex: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-400', glow: 'shadow-amber-500/30' },
  { id: 'rose', name: 'Hyper Rose', hex: '#f43f5e', bg: 'bg-rose-500', border: 'border-rose-400', glow: 'shadow-rose-500/30' },
];

export function ThemeCustomizerModal({
  isOpen,
  onClose,
  config,
  onChange,
  onReset,
}: ThemeCustomizerModalProps) {
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<'palette' | 'autotheme' | 'topbar' | 'structure' | 'branding'>('palette');

  React.useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const update = <K extends keyof StudioThemeConfig>(key: K, value: StudioThemeConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overscroll-contain overflow-hidden animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[80vh] h-full sm:h-auto bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-cyan-500/20"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Customizer Header (WordPress Style Live Theme Studio) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-950">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white tracking-wide">
                  WordPress Theme & Studio Customizer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full theme, color palette, auto hologram mode, top bar and layout settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customizer Body: Left Tab Sidebar + Right Control Canvas (WP Style) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-60 bg-slate-900/70 border-b md:border-b-0 md:border-r border-slate-800/90 p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => setActiveCustomizerTab('palette')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCustomizerTab === 'palette'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Color Scheme & Palette</span>
            </button>

            <button
              onClick={() => setActiveCustomizerTab('autotheme')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCustomizerTab === 'autotheme'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Auto-Theme & Hologram</span>
            </button>

            <button
              onClick={() => setActiveCustomizerTab('topbar')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCustomizerTab === 'topbar'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layout className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Top Bar Space Modules</span>
            </button>

            <button
              onClick={() => setActiveCustomizerTab('structure')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCustomizerTab === 'structure'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Block Structure & Radius</span>
            </button>

            <button
              onClick={() => setActiveCustomizerTab('branding')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activeCustomizerTab === 'branding'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Type className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Identity & Tagline</span>
            </button>
          </div>

          {/* Right Main Settings Area */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain custom-modal-scroll space-y-6 bg-slate-950/60">

            {/* 1. COLOR SCHEME & PALETTE */}
            {activeCustomizerTab === 'palette' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Global Accent Color Palette</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select primary color for buttons, highlights, and holographic glow:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3">
                    {ACCENT_COLORS.map((col) => {
                      const isSel = config.accent === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => update('accent', col.id)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            isSel
                              ? `${col.border} bg-slate-800/90 ring-2 ${col.glow}`
                              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full ${col.bg} shadow-md flex items-center justify-center text-white`}>
                            {isSel && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium text-slate-200">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Base Dark Surface Tone */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-sm font-semibold text-white">Dark Base Tone (Surface Canvas)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Studio background depth:</p>
                  <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                    {[
                      { id: 'obsidian', label: 'Obsidian Void', desc: 'Deep Pitch Black #020617' },
                      { id: 'slate', label: 'Space Slate', desc: 'Midnight Slate #060a14' },
                      { id: 'cyber', label: 'Cyber Navy', desc: 'Electric Indigo #04091a' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => update('surfaceTone', tone.id as SurfaceTone)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          config.surfaceTone === tone.id
                            ? 'border-cyan-400 bg-cyan-950/30 text-white ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-semibold">{tone.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tone.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glassmorphism & Card Glow Intensity */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-sm font-semibold text-white">Glassmorphism & Neon Glow</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Glass and background blur intensity:</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => update('glassGlow', level)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize cursor-pointer transition-all text-center ${
                          config.glassGlow === level
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {level === 'low' ? 'Subtle Glow' : level === 'medium' ? 'Balanced Studio' : 'Cyber Intense Glow'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. AUTO-THEME & TIME/ACTIVITY ENGINE */}
            {activeCustomizerTab === 'autotheme' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Auto-Theme Mode (Time of Day Engine)</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Holographic theme adjusts automatically based on morning, noon, evening, and night
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoThemeByTime}
                        onChange={(e) => update('autoThemeByTime', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {config.autoThemeByTime && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-purple-500/20 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                          <Sun className="w-3.5 h-3.5" />
                          <span>Morning (6am-12pm)</span>
                        </div>
                        <span className="text-[11px] text-cyan-300">Cosmic Aurora Waves</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                          <Compass className="w-3.5 h-3.5" />
                          <span>Afternoon (12-5pm)</span>
                        </div>
                        <span className="text-[11px] text-blue-300">Hexagon Quantum</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
                          <Sunset className="w-3.5 h-3.5" />
                          <span>Sunset (5-8pm)</span>
                        </div>
                        <span className="text-[11px] text-rose-300">Floating Orbs FX</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                          <Moon className="w-3.5 h-3.5" />
                          <span>Night (8pm-6am)</span>
                        </div>
                        <span className="text-[11px] text-indigo-300">Cyber Matrix Grid</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Reactive Holographic Opacity Engine */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <Activity className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">User Activity Level Reactive Opacity</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Hologram stays responsive and vibrant during activity, smoothly dimming to ambient mode when idle
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.activityReactiveHolo}
                        onChange={(e) => update('activityReactiveHolo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>

                {/* Manual Holographic Theme Selector */}
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Manual Holographic Canvas Themes</span>
                    <span className="text-xs font-mono text-cyan-400">{HOLOGRAPHIC_THEMES.length} Available</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2.5">
                    {HOLOGRAPHIC_THEMES.map((t) => {
                      const isSel = config.holoTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => update('holoTheme', t.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSel
                              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-100 ring-1 ring-cyan-400'
                              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${t.previewColor}`} />
                            <span className="font-semibold text-xs truncate">{t.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Opacity & Speed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Base Hologram Intensity:</span>
                      <span className="font-mono text-cyan-300 font-bold">{Math.round(config.holoOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={config.holoOpacity}
                      onChange={(e) => update('holoOpacity', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Holographic Wave Speed:</span>
                      <span className="font-mono text-cyan-300 font-bold">{config.holoSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={config.holoSpeed}
                      onChange={(e) => update('holoSpeed', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. TOP BAR SPACE COVERAGE & MODULES */}
            {activeCustomizerTab === 'topbar' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-amber-400" />
                    <span>Top Bar Space Modules</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure live status badges, breaking news tickers, or fast shortcuts to make the top bar productive and balanced:
                  </p>
                </div>

                {/* Module 1: Live Stats Ticker */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Live Channel Metrics & Subscriber Bar</p>
                      <p className="text-[11px] text-slate-400">142K+ Subs • 18.4M Views • 340+ Videos • 98.4% Ratio</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showTopBarStats}
                    onChange={(e) => update('showTopBarStats', e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {/* Module 2: Breaking News / Custom Announcement Bar */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Live Breaking Announcement Ticker</p>
                        <p className="text-[11px] text-slate-400">Display breaking news ticker or new video release alert in top header</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showTopBarTicker}
                      onChange={(e) => update('showTopBarTicker', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>

                  {config.showTopBarTicker && (
                    <div className="pt-2 border-t border-slate-800">
                      <label className="text-[11px] text-slate-300 font-medium">Custom Ticker Message:</label>
                      <input
                        type="text"
                        value={config.topAnnouncementText}
                        onChange={(e) => update('topAnnouncementText', e.target.value)}
                        placeholder="Live announcement text..."
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Module 3: Quick Action Launch Hub */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Quick Action Shortcuts Hub</p>
                      <p className="text-[11px] text-slate-400">Quick access panel shortcuts (AI Script, Voice, Duplicate Checker) in header</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showTopBarShortcuts}
                    onChange={(e) => update('showTopBarShortcuts', e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {/* Module 4: Live Badge Indicator */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Streaming Live Badge in Top Header</p>
                      <p className="text-[11px] text-slate-400">Display live radio status badge in top header</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showTopLiveBadge}
                    onChange={(e) => update('showTopLiveBadge', e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 4. BLOCK STRUCTURE & RADIUS */}
            {activeCustomizerTab === 'structure' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Block Structure, Density & Corner Radii</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Adjust corner radius, density, and spacing across studio cards:
                  </p>
                </div>

                {/* Corner Radius Controls */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">Card Corner Style:</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { id: 'sharp', label: 'Cyber Crisp', desc: 'Sharper 6px borders' },
                      { id: 'standard', label: 'Studio Smooth', desc: 'Modern 16px curve' },
                      { id: 'pill', label: 'Ultra Organic', desc: 'Curved 24px pill flow' },
                    ].map((rad) => (
                      <button
                        key={rad.id}
                        onClick={() => update('cardRadius', rad.id as CardRadius)}
                        className={`p-3 border text-left cursor-pointer transition-all ${
                          rad.id === 'sharp' ? 'rounded-md' : rad.id === 'standard' ? 'rounded-xl' : 'rounded-3xl'
                        } ${
                          config.cardRadius === rad.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-semibold">{rad.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rad.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Density */}
                <div className="pt-4 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-300">UI Spacing & Density:</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { id: 'compact', label: 'Compact Studio', desc: 'More data on screen' },
                      { id: 'normal', label: 'Standard Balance', desc: 'Clean balanced gaps' },
                      { id: 'spacious', label: 'Spacious Breath', desc: 'Airy cinematic layout' },
                    ].map((den) => (
                      <button
                        key={den.id}
                        onClick={() => update('layoutDensity', den.id as LayoutDensity)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          config.layoutDensity === den.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400'
                            : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <p className="text-xs font-semibold">{den.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{den.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. IDENTITY & BRANDING */}
            {activeCustomizerTab === 'branding' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Type className="w-4 h-4 text-rose-400" />
                    <span>Channel Identity & Tagline Handling</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Channel tagline, verified badges, and header customization:
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Channel Tagline Text:</label>
                    <input
                      type="text"
                      value={config.channelTagline}
                      onChange={(e) => update('channelTagline', e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-white">Show Tagline in Top Bar</p>
                      <p className="text-[10px] text-slate-400">Show channel tagline below banner</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showTagline}
                      onChange={(e) => update('showTagline', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-white">Official Studio Verification Badge</p>
                      <p className="text-[10px] text-slate-400">Show verified creator badge in header</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showStudioBadge}
                      onChange={(e) => update('showStudioBadge', e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customizer Footer (Save & Close, Reset to Defaults) */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-400 hidden sm:inline flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-time Live Sync Active</span>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Save & Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
