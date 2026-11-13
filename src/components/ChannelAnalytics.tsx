import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Eye, 
  Users, 
  Clock, 
  AlertTriangle, 
  Globe2, 
  CheckCircle2, 
  Smartphone, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Flame,
  BarChart3
} from 'lucide-react';
import { GrowthSignals } from './GrowthSignals';
import { EngagementHeatmap } from './EngagementHeatmap';
import { ViewerInsights } from './ViewerInsights';
import { ScrollReveal, TrafficEngineDiagram } from './MotionPrimitives';

export const ChannelAnalytics: React.FC = () => {
  const [subView, setSubView] = useState<'diagnostics' | 'insights' | 'heatmap' | 'signals'>('diagnostics');

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <ScrollReveal direction="down">
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                IT Cafeteria — Live Audit
              </span>
              <span className="text-xs text-slate-400">Snapshot: Sep 21 – Oct 18, 2026 (28 Days)</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              IT Cafeteria Channel Diagnostics & Growth Leaks
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Real analytics se sabut milta hai ke content quality aur watch-duration solid hai, lekin discovery aur returning audience mein do ahem bottlenecks hain jo channel ki exponential growth ko roke hue hain.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-center">
              <div className="text-xs text-slate-400">Subscribers</div>
              <div className="text-xl font-bold text-white">1,348</div>
              <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +8 (+300%)
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-center">
              <div className="text-xs text-slate-400">Total Views</div>
              <div className="text-xl font-bold text-cyan-400">1,803</div>
              <div className="text-[11px] text-cyan-400">7.9 hrs (+195%)</div>
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Sub-view Navigation Toggle */}
      <ScrollReveal direction="left" delay={0.05}>
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setSubView('diagnostics')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            subView === 'diagnostics'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Channel Diagnostics & Leaks</span>
        </button>

        <button
          onClick={() => setSubView('insights')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            subView === 'insights'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-300" />
          <span>Viewer Insights (Charts)</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.5 rounded-full font-mono font-bold">
            Retention & Geo
          </span>
        </button>

        <button
          onClick={() => setSubView('heatmap')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            subView === 'heatmap'
              ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-300" />
          <span>Audience Retention Heatmap</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.5 rounded-full font-mono font-bold">
            6 PM Peak
          </span>
        </button>

        <button
          onClick={() => setSubView('signals')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            subView === 'signals'
              ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Growth Signals & Viral Triggers</span>
          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 px-1.5 py-0.5 rounded-full font-mono">
            5 Signals
          </span>
        </button>
      </div>
      </ScrollReveal>

      {subView === 'signals' ? (
        <GrowthSignals />
      ) : subView === 'insights' ? (
        <ViewerInsights />
      ) : subView === 'heatmap' ? (
        <EngagementHeatmap />
      ) : (
        <>
          {/* Living Channel Distribution Diagram */}
          <ScrollReveal direction="up" delay={0.08}>
            <TrafficEngineDiagram />
          </ScrollReveal>

          {/* Two Critical Leaks Identified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Leak 1: Traffic Source Disparity */}
        <ScrollReveal direction="left" delay={0.06}>
        <div className="h-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Critical Leak #1: Traffic Source Imbalance</h3>
                <p className="text-xs text-amber-300">YouTube Search 79.0% vs Shorts Feed 9.4%</p>
              </div>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
              High Priority
            </span>
          </div>

          <div className="space-y-3">
            {/* Visual Bar Comparison */}
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>YouTube Search (High Intent, Slow Scale)</span>
                <span className="font-bold text-amber-400">79.0%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full" style={{ width: '79%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Shorts Feed (Algorithm Viral Distribution)</span>
                <span className="font-bold text-red-400">9.4% (Severe Bottleneck)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full" style={{ width: '9.4%' }} />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Channel pages: 6.6%</span>
              <span>Browse: 1.9%</span>
              <span>External: 1.8%</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-medium text-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              Iska Matlab Aur Hal (What this means):
            </div>
            <p>
              Aap ke titles bohot ache search-optimized hain (isliye Power Automate, Windows shortcuts search se log dhoond rahe hain). Lekin YouTube Shorts ka asli algorithm <strong className="text-white">Shorts Feed</strong> par chalta hai. Agar feed 10% se kam hai, toh video viral breakout nahi kar sakti.
            </p>
            <p className="text-amber-300 font-medium">
              👉 Agent Enhancement: Scene 1 ke pehle 2 seconds mein "Search Title" bolne ke bajaye ek visual pattern-interrupt / curiosity gap shock introduce karein taake swipe-away 33% se gir kar 20% par aa jaye.
            </p>
          </div>
        </div>
        </ScrollReveal>

        {/* Leak 2: Returning Audience Deficit */}
        <ScrollReveal direction="right" delay={0.12}>
        <div className="h-full bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Critical Leak #2: Returning Viewers Gap</h3>
                <p className="text-xs text-rose-300">Regular Viewers 0.2% vs New Viewers 97.2%</p>
              </div>
            </div>
            <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
              Subscriber Leak
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>New Viewers (Har baar naye log aate hain)</span>
                <span className="font-bold text-cyan-400">97.2% (559 Viewers)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full" style={{ width: '97.2%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Casual Viewers</span>
                <span className="font-bold text-indigo-400">2.6% (15 Viewers)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full" style={{ width: '2.6%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Regular / Loyal Returning Audience</span>
                <span className="font-bold text-rose-400">0.2% (Only ~1-2 Viewers!)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full" style={{ width: '2%' }} />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-medium text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Iska Matlab Aur Hal (What this means):
            </div>
            <p>
              Log aap ka ek short dekh kar chale jate hain aur agle episode par wapas nahi aate. Subscriber conversion rate 0.44% hai (+8 subs on 1,803 views).
            </p>
            <p className="text-rose-300 font-medium">
              👉 Agent Enhancement: "Series Binge Bridges" add karein. Har Short ke aakhir mein sirf generic CTA ("Follow for more") ke bajaye: "Agli video mein main iska secret formula bataunga jo 90% log nahi jante—abhi save kar lein aur notification daba dein!"
            </p>
          </div>
        </div>
        </ScrollReveal>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stayed to watch */}
        <ScrollReveal direction="left" delay={0.04}>
        <div className="h-full bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Viewed vs Swiped</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">66.2%</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Stayed to watch (Good!)
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Swiped away: 33.8%</div>
        </div>
        </ScrollReveal>

        {/* Audience Retention Avg */}
        <ScrollReveal direction="up" delay={0.08}>
        <div className="h-full bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg View Duration</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">0:34s</div>
          <div className="text-xs text-blue-400 mt-1">Average across all Shorts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Top video (Voice Mode): 1:06s (104%)</div>
        </div>
        </ScrollReveal>

        {/* Mobile Dominance */}
        <ScrollReveal direction="down" delay={0.12}>
        <div className="h-full bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Device Type</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">68.9%</div>
          <div className="text-xs text-purple-400 mt-1">Mobile Phone view time</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Desktop: 29.1% | TV: 1.3%</div>
        </div>
        </ScrollReveal>

        {/* Geographic Split */}
        <ScrollReveal direction="right" delay={0.16}>
        <div className="h-full bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Top Geography</span>
            <Globe2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">India 37.9%</div>
          <div className="text-xs text-cyan-400 mt-1">Pakistan: 7.0%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pak avg watch: 0:49 vs India 0:32</div>
        </div>
        </ScrollReveal>
      </div>

      {/* Graphical Viewer Insights Component (Retention, Hourly Peaks, Geography) */}
      <ScrollReveal direction="up" delay={0.05}>
        <ViewerInsights />
      </ScrollReveal>

      {/* Visual Engagement Heatmap Component */}
      <ScrollReveal direction="left" delay={0.05}>
        <EngagementHeatmap />
      </ScrollReveal>

      {/* Top 6 Performing Content Matrix */}
      <ScrollReveal direction="right" delay={0.05}>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white text-base">Top Performing Content Breakdown (Real Evidence)</h3>
            <p className="text-xs text-slate-400">Yeh topics sabit karte hain ke audience kis cheez par rukti hai</p>
          </div>
          <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
            Niche Validation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium"># Title & Topic</th>
                <th className="pb-3 font-medium">Views</th>
                <th className="pb-3 font-medium">Retention / Duration</th>
                <th className="pb-3 font-medium">Category Pattern</th>
                <th className="pb-3 font-medium">Why It Worked (Algorithm Signal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">1</span>
                  Automate Daily Reports in Power Automate
                </td>
                <td className="py-3 text-cyan-400 font-bold">137</td>
                <td className="py-3">51.5% (0:28)</td>
                <td className="py-3 text-slate-400">Automation Workflows</td>
                <td className="py-3 text-emerald-400">Direct office pain point; high search volume</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">2</span>
                  Gemini Notebook AI Research Trick
                </td>
                <td className="py-3 text-cyan-400 font-bold">117</td>
                <td className="py-3">33.4% (0:23)</td>
                <td className="py-3 text-slate-400">AI Tools & Research</td>
                <td className="py-3 text-emerald-400">"Ghanton ka kaam seconds mein" hook promise</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">3</span>
                  ChatGPT Voice Mode Big Update
                </td>
                <td className="py-3 text-cyan-400 font-bold">107</td>
                <td className="py-3 text-emerald-400 font-bold">104.7% (1:06)</td>
                <td className="py-3 text-slate-400">AI Chatbots</td>
                <td className="py-3 text-emerald-400">Over-100% loop! Viewer watched till end & replayed</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">4</span>
                  OpenAI Launched GPT-6 Astra
                </td>
                <td className="py-3 text-cyan-400 font-bold">87</td>
                <td className="py-3">48.1% (0:32)</td>
                <td className="py-3 text-slate-400">Future Tech / News</td>
                <td className="py-3 text-emerald-400">Brand curiosity and breakthrough hype</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">5</span>
                  Browser Ka Kaam Auto Mode Par
                </td>
                <td className="py-3 text-cyan-400 font-bold">81</td>
                <td className="py-3">47.2% (0:37)</td>
                <td className="py-3 text-slate-400">Web Agents</td>
                <td className="py-3 text-emerald-400">Visual screen demo of browser auto-filling forms</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 font-medium text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">6</span>
                  WhatsApp 3 New Mind-Blowing Features
                </td>
                <td className="py-3 text-cyan-400 font-bold">65</td>
                <td className="py-3">48.0% (0:58)</td>
                <td className="py-3 text-slate-400">Secrets / Daily Apps</td>
                <td className="py-3 text-emerald-400">Broad appeal (every mobile user has WhatsApp)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </ScrollReveal>

      {/* Strategic Takeaways Box */}
      <ScrollReveal direction="up" delay={0.06}>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/20 rounded-2xl p-5">
        <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-400" />
          Waqar Bhai Ke Liye Channel Scaling Ka Summary Formula:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="font-semibold text-cyan-400 mb-1">1. Double Down on Automation</div>
            <p className="text-slate-400">
              Power Automate aur No-Code workflows YouTube aur TikTok dono jagah top queries mein hain. Is category ke videos ko prioritize karein.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="font-semibold text-cyan-400 mb-1">2. Over-1-Minute Format Win</div>
            <p className="text-slate-400">
              ChatGPT Voice Mode (1:06s) ne 104% retention di! Is se prove hota hai ke 10-15 scenes (60-100s) format viewer ko retain karta hai.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <div className="font-semibold text-cyan-400 mb-1">3. Language & Geography Alignment</div>
            <p className="text-slate-400">
              Pakistan mein avg watch duration 49s hai (India mein 32s). Roman Urdu script aur delivery Pakistani tech community mein deeply connect kar rahi hai.
            </p>
          </div>
          </div>
        </div>
      </ScrollReveal>
        </>
      )}
    </div>
  );
};

