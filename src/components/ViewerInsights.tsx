import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Globe2, 
  Smartphone, 
  Monitor, 
  Users, 
  Sparkles, 
  ArrowUpRight, 
  BarChart3, 
  Flame, 
  Layers, 
  Info,
  CheckCircle2,
  Tv,
  Tablet
} from 'lucide-react';

export const ViewerInsights: React.FC = () => {
  const [retentionMode, setRetentionMode] = useState<'standard' | 'viralLoop'>('standard');
  const [hoveredHour, setHoveredHour] = useState<number | null>(18); // Default 6 PM PKT
  const [hoveredRetentionSec, setHoveredRetentionSec] = useState<number | null>(null);

  // Retention Data (0 to 60 seconds)
  // Standard 45s Short: Avg View Duration 34s, 66.2% stayed
  const standardRetentionPoints = [
    { sec: 0, pct: 100, label: '0s (Hook Start)' },
    { sec: 3, pct: 66.2, label: '3s (Swipe-Away Cliff: 33.8% swiped)' },
    { sec: 10, pct: 61.5, label: '10s (Scene 1 Transition)' },
    { sec: 20, pct: 56.0, label: '20s (Scene 2 Core Demo)' },
    { sec: 30, pct: 50.8, label: '30s (Scene 3 Indian Dropoff Point)' },
    { sec: 40, pct: 45.4, label: '40s (Episodic Bridge / CTA)' },
    { sec: 45, pct: 41.0, label: '45s (Video End)' },
    { sec: 50, pct: 32.0, label: '50s (Long-form wrap)' }
  ];

  // Viral Loop 104.7% Short (ChatGPT Voice Mode 1:06s)
  const viralLoopPoints = [
    { sec: 0, pct: 100, label: '0s (Curiosity Hook)' },
    { sec: 3, pct: 88.5, label: '3s (Only 11.5% swiped away)' },
    { sec: 15, pct: 82.0, label: '15s (Pakistani Urdu Voice Demo)' },
    { sec: 30, pct: 78.4, label: '30s (Mid-video Shock Reveal)' },
    { sec: 45, pct: 76.0, label: '45s (Seamless Context Loop)' },
    { sec: 60, pct: 84.5, label: '60s (Loop Replay Trigger)' },
    { sec: 66, pct: 104.7, label: '66s (104.7% Replay Watch Velocity!)' }
  ];

  const activeRetentionData = retentionMode === 'standard' ? standardRetentionPoints : viralLoopPoints;

  // 24-Hour Active Audience Concurrency in Lahore PKT
  const hourlyData = [
    { hour: 0, label: '12 AM', viewers: 180, level: 'late-night' },
    { hour: 1, label: '1 AM', viewers: 140, level: 'late-night' },
    { hour: 2, label: '2 AM', viewers: 60, level: 'low' },
    { hour: 3, label: '3 AM', viewers: 35, level: 'low' },
    { hour: 4, label: '4 AM', viewers: 25, level: 'low' },
    { hour: 5, label: '5 AM', viewers: 40, level: 'low' },
    { hour: 6, label: '6 AM', viewers: 80, level: 'morning' },
    { hour: 7, label: '7 AM', viewers: 110, level: 'morning' },
    { hour: 8, label: '8 AM', viewers: 150, level: 'morning' },
    { hour: 9, label: '9 AM', viewers: 210, level: 'office' },
    { hour: 10, label: '10 AM', viewers: 240, level: 'office' },
    { hour: 11, label: '11 AM', viewers: 270, level: 'office' },
    { hour: 12, label: '12 PM', viewers: 320, level: 'lunch' },
    { hour: 13, label: '1 PM', viewers: 300, level: 'lunch' },
    { hour: 14, label: '2 PM', viewers: 290, level: 'office' },
    { hour: 15, label: '3 PM', viewers: 340, level: 'office' },
    { hour: 16, label: '4 PM', viewers: 410, level: 'desktop-rush' },
    { hour: 17, label: '5 PM', viewers: 460, level: 'desktop-rush' },
    { hour: 18, label: '6 PM', viewers: 575, level: 'prime-peak' }, // PRIME OVERLAP PEAK
    { hour: 19, label: '7 PM', viewers: 510, level: 'evening-relax' },
    { hour: 20, label: '8 PM', viewers: 480, level: 'evening-relax' },
    { hour: 21, label: '9 PM', viewers: 420, level: 'evening-relax' },
    { hour: 22, label: '10 PM', viewers: 350, level: 'late-night' },
    { hour: 23, label: '11 PM', viewers: 260, level: 'late-night' }
  ];

  const maxHourlyViewers = 575;

  // Geographic Retention Disparity Data
  const geoData = [
    { country: 'India', flag: '🇮🇳', pct: 37.9, avd: '0:32s', behavior: 'Fast swipe, needs 1.5s visual hook & 25s mid-scene anchor' },
    { country: 'Pakistan', flag: '🇵🇰', pct: 7.0, avd: '0:49s', behavior: '53% Longer retention! Deeply connects with Roman Urdu delivery' },
    { country: 'United States', flag: '🇺🇸', pct: 3.4, avd: '0:38s', behavior: 'High-intent English search queries for Excel & AI Tools' },
    { country: 'Bangladesh', flag: '🇧🇩', pct: 2.8, avd: '0:35s', behavior: 'Similar South Asian tech problem solver demographics' },
    { country: 'UAE & Gulf', flag: '🇦🇪', pct: 2.4, avd: '0:44s', behavior: 'Pakistani diaspora office workers searching productivity hacks' },
    { country: 'Others (45+ countries)', flag: '🌐', pct: 46.5, avd: '0:31s', behavior: 'Global organic search traffic across YouTube index' }
  ];

  // Device Split Data
  const deviceData = [
    { device: 'Mobile Phones', pct: 68.9, icon: <Smartphone className="w-4 h-4 text-cyan-400" />, color: 'bg-cyan-500' },
    { device: 'Desktop Computers', pct: 29.1, icon: <Monitor className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-500' },
    { device: 'TV & Connected Screens', pct: 1.3, icon: <Tv className="w-4 h-4 text-purple-400" />, color: 'bg-purple-500' },
    { device: 'Tablets', pct: 0.7, icon: <Tablet className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500' }
  ];

  // Demographics
  const ageData = [
    { age: '18–24 years', pct: 31.2, note: 'College students, early coders, prompt engineers' },
    { age: '25–34 years', pct: 48.7, note: 'Core audience: Workplace professionals, corporate analysts' },
    { age: '35–44 years', pct: 15.1, note: 'Managers, senior office staff using Excel & Power Automate' },
    { age: '45+ years', pct: 5.0, note: 'General tech learners & computer utility enthusiasts' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-mono uppercase font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Advanced Audience Analytics
            </span>
            <span className="text-xs text-slate-400 font-mono">28-Day Verified Telemetry</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Viewer Insights & Audience Retention Engine
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
            Second-by-second watch curves, peak viewing hours (PKT / IST), aur Lahore vs. India retention differences ka mukammal graphical tajziya.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[10px] text-slate-400">Avg Retention</div>
            <div className="font-bold text-cyan-400 text-sm">66.2% Stayed</div>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div className="text-[10px] text-slate-400">Peak Overlap</div>
            <div className="font-bold text-amber-400 text-sm">6:00 PM PKT</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE RETENTION CURVE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Second-by-Second Retention Curve
            </h4>
            <p className="text-xs text-slate-400">Dekhein kahan viewers swipe away karte hain aur kahan loop replay trigger hota hai</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setRetentionMode('standard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                retentionMode === 'standard'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standard Short (66.2% Stayed)
            </button>
            <button
              onClick={() => setRetentionMode('viralLoop')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                retentionMode === 'viralLoop'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ★ Viral Loop (104.7% Peak)
            </button>
          </div>
        </div>

        {/* SVG Retention Graph */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
          <div className="h-56 w-full relative flex items-end">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[10px] font-mono text-slate-400">
              <div className="border-b border-dashed border-slate-600 flex justify-between"><span>100% (Baseline Start)</span></div>
              <div className="border-b border-dashed border-slate-600 flex justify-between"><span>75% (High Engagement Zone)</span></div>
              <div className="border-b border-dashed border-slate-600 flex justify-between"><span>50% (Average Drop-off)</span></div>
              <div className="border-b border-dashed border-slate-600 flex justify-between"><span>25% (Swipe Away Limit)</span></div>
              <div className="border-b border-slate-700 flex justify-between"><span>0%</span></div>
            </div>

            {/* SVG Interactive Line Chart */}
            <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={retentionMode === 'standard' ? '#06b6d4' : '#f59e0b'} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={retentionMode === 'standard' ? '#06b6d4' : '#f59e0b'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              {retentionMode === 'standard' ? (
                <path
                  d="M 0 0 L 35 67.6 L 140 77 L 280 88 L 420 98.4 L 560 109.2 L 630 118 L 700 136 L 700 200 L 0 200 Z"
                  fill="url(#curveGradient)"
                />
              ) : (
                <path
                  d="M 0 0 L 35 23 L 175 36 L 350 43.2 L 525 48 L 630 31 L 700 -9 L 700 200 L 0 200 Z"
                  fill="url(#curveGradient)"
                />
              )}

              {/* Stroke Line */}
              {retentionMode === 'standard' ? (
                <path
                  d="M 0 0 Q 35 67.6 140 77 T 280 88 T 420 98.4 T 560 109.2 T 630 118 T 700 136"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M 0 0 Q 35 23 175 36 T 350 43.2 T 525 48 T 630 31 T 700 -9"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {activeRetentionData.map((pt, idx) => {
                const x = (idx / (activeRetentionData.length - 1)) * 700;
                const y = 200 - (pt.pct / 110) * 200;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={Math.max(10, y)}
                    r={hoveredRetentionSec === pt.sec ? 7 : 4.5}
                    fill={retentionMode === 'standard' ? '#22d3ee' : '#f59e0b'}
                    stroke="#070a13"
                    strokeWidth="2"
                    className="cursor-pointer transition-all hover:scale-150"
                    onMouseEnter={() => setHoveredRetentionSec(pt.sec)}
                  />
                );
              })}
            </svg>
          </div>

          {/* X-Axis Timeline Labels */}
          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>0s (Hook)</span>
            <span>10s</span>
            <span>20s</span>
            <span>30s (Mid-Scene)</span>
            <span>40s</span>
            <span>45s (CTA)</span>
            <span>{retentionMode === 'viralLoop' ? '66s (Loop Replay)' : '60s+'}</span>
          </div>

          {/* Interactive Inspection Detail Bar */}
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-cyan-400 font-bold">Key Insight:</span>
              <span className="text-slate-300">
                {retentionMode === 'standard' 
                  ? 'First 3 seconds decision cliff: 33.8% swipe away. Jo viewers 3s cross kar lete hain woh aage 34 seconds tak rukte hain!'
                  : 'ChatGPT Voice Short (1:06s) ne 104.7% retention achieve ki kyunke video ke end par loop seamless tha aur viewers ne repeat dekha!'}
              </span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold shrink-0">
              {retentionMode === 'standard' ? 'Goal: Cut swipe-away to < 20%' : '104.7% Loop Proven'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: 24-HOUR AUDIENCE CONCURRENCY PEAK CHART */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> 24-Hour Active Viewership Peak (PKT Concurrency)
            </h4>
            <p className="text-xs text-slate-400">Hourly live audience volume based on Lahore & India concurrent sessions</p>
          </div>

          <div className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-lg">
            ★ Optimal Upload: 6:00 PM PKT (575 Active Viewers)
          </div>
        </div>

        {/* 24-Hour Bar Chart */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6">
            {hourlyData.map((item) => {
              const heightPct = Math.round((item.viewers / maxHourlyViewers) * 100);
              const isPrime = item.hour === 18; // 6 PM
              const isDesktopRush = item.hour === 16 || item.hour === 17;
              const isHovered = hoveredHour === item.hour;

              return (
                <div
                  key={item.hour}
                  onMouseEnter={() => setHoveredHour(item.hour)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip on hover or prime */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-slate-900 border border-cyan-400 text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap">
                      <div>{item.label} PKT: <strong className="text-cyan-300">{item.viewers} viewers</strong></div>
                      <div className="text-[9px] text-amber-300">{isPrime ? '★ PRIME VIRAL OVERLAP' : isDesktopRush ? 'Desktop Office Surge' : 'Active Traffic'}</div>
                    </div>
                  )}

                  {/* The Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isPrime 
                        ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30'
                        : isDesktopRush
                        ? 'bg-gradient-to-t from-cyan-600 to-teal-400'
                        : isHovered
                        ? 'bg-blue-400'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                  
                  {/* Hour Label */}
                  <span className={`text-[9px] font-mono mt-1.5 transition-colors ${
                    isPrime ? 'text-amber-400 font-bold' : isHovered ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                  }`}>
                    {item.hour % 3 === 0 ? item.label.replace(' ', '') : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-800 inline-block" /> Low Activity (12am-6am)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" /> 4pm Desktop Spike (Office Closing)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> 6pm Prime Viral Overlap</span>
            </div>
            <span className="text-cyan-400">Hover bar to inspect concurrency</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: GEOGRAPHIC RETENTION DISPARITY & DEVICE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Geographic Comparison (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Geographic Watch-Time & Retention Disparity
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              Pak Retention +53% Longer
            </span>
          </div>

          <div className="space-y-3">
            {geoData.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <span className="font-bold text-white">{item.country}</span>
                    <span className="text-[11px] font-mono text-cyan-400">({item.pct}% Traffic)</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                    AVD: {item.avd}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.country === 'Pakistan' ? 'bg-emerald-400' : item.country === 'India' ? 'bg-cyan-400' : 'bg-slate-600'}`} 
                    style={{ width: `${item.pct * 2}%` }} 
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                  {item.behavior}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Demographics Split (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Device Split */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device Split</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Desktop 29.1%!</span>
            </div>

            <div className="space-y-2.5">
              {deviceData.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {d.icon}
                      <span>{d.device}</span>
                    </span>
                    <span className="font-mono font-bold text-white">{d.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${d.color} h-full rounded-full`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              29.1% Desktop users is exceptionally high for a Shorts channel! It proves heavy demand for desktop Excel and Windows utilities.
            </p>
          </div>

          {/* Age Demographics */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Age Demographics</h4>
              </div>
              <span className="text-[10px] font-mono text-purple-300">25–34 Peak</span>
            </div>

            <div className="space-y-2">
              {ageData.map((a, i) => (
                <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-white font-semibold">{a.age}</span>
                    <span className="font-bold text-cyan-400">{a.pct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{a.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TACTICAL GROWTH TAKEAWAYS */}
      <div className="p-4 bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 rounded-xl space-y-2">
        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 Data-Driven Optimization Rules for Waqar Majeed:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold">1. Fix 1.5s Swipe Decision:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              First 1.5 seconds mein face gesture ya screen cursor animation dalna zaroori hai taake initial 33.8% swipe-away rate kam ho sake.
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold">2. Retain Indian Viewers at 25s:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              India ka average watch duration 32 seconds hai. Theek 25th second par ek naya visual surprise ya text change karein taake woh video poori dekhein.
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold">3. Capitalize on Desktop 29.1%:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Excel aur Windows 11 shortcuts laptop par try karne wale hazaron log hain; description mein exact keyboard keys zaroor provide karein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
