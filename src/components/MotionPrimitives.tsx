import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type RevealDirection = 'left' | 'right' | 'up' | 'down';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  distance?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  distance = 40,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div data-sr-managed="true" className={className}>
        {children}
      </div>
    );
  }

  const initialOffset =
    direction === 'left'
      ? { x: -distance, y: 0 }
      : direction === 'right'
        ? { x: distance, y: 0 }
        : direction === 'down'
          ? { x: 0, y: -distance }
          : { x: 0, y: distance };

  return (
    <motion.div
      data-sr-managed="true"
      initial={{ opacity: 0, scale: 0.985, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.56,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ============================================================================
   1. LIVING TRAFFIC ENGINE DIAGRAM (ChannelAnalytics)
   Continuous rotating orbital rings + flowing energy lines across Search -> Feed -> Loop
   ============================================================================ */
export const TrafficEngineDiagram: React.FC = () => {
  return (
    <div
      data-sr-managed="true"
      className="interactive-block bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 overflow-hidden relative"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Channel Growth Flow & Algorithm Distribution Engine
          </h3>
          <p className="text-xs text-slate-400">
            Search traffic se Shorts Feed breakout aur returning binge loop tak ka live signal flow
          </p>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 tabular-nums">
          Target: 9.4% → 40%+ Feed Share
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 920 210"
          className="w-full min-w-[660px] h-48 select-none"
          role="img"
          aria-label="Channel Traffic and Hook Optimization Flow Diagram"
        >
          <defs>
            <linearGradient id="flowCyanAmber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="nodeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Background Subtle Grid Lines */}
          <line x1="40" y1="105" x2="880" y2="105" stroke="#1e293b" strokeWidth="1" />

          {/* Flowing Energy Conduits */}
          <path
            d="M 195 105 C 245 105, 255 60, 315 60"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
          />
          <path
            d="M 195 105 C 245 105, 255 60, 315 60"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-energy-flow"
          />

          <path
            d="M 195 105 C 245 105, 255 150, 315 150"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
          />
          <path
            d="M 195 105 C 245 105, 255 150, 315 150"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-energy-flow-reverse"
          />

          <path
            d="M 485 60 C 540 60, 540 105, 590 105"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <path
            d="M 485 60 C 540 60, 540 105, 590 105"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-energy-flow-fast"
          />

          <path
            d="M 485 150 C 540 150, 540 105, 590 105"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <path
            d="M 485 150 C 540 150, 540 105, 590 105"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-energy-flow"
          />

          <path
            d="M 700 105 L 760 105"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3.5"
          />
          <path
            d="M 700 105 L 760 105"
            fill="none"
            stroke="url(#flowCyanAmber)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-energy-flow-fast"
          />

          {/* Feedback Loop Return Arc */}
          <path
            d="M 835 148 C 835 194, 115 194, 115 150"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <path
            d="M 835 148 C 835 194, 115 194, 115 150"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-energy-flow"
          />

          {/* Node 1: Search Intent Core */}
          <g transform="translate(30, 65)">
            <rect
              width="165"
              height="80"
              rx="14"
              fill="url(#nodeGlow)"
              stroke="#f59e0b"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="40" r="10" fill="none" stroke="#f59e0b" strokeDasharray="4 3" className="animate-orbit-spin" />
            <circle cx="24" cy="40" r="4" fill="#fbbf24" className="animate-beacon-pulse" />
            <text x="44" y="34" fill="#fde68a" fontSize="11.5" fontWeight="700">
              YouTube Search
            </text>
            <text x="44" y="52" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
              79.0% Intent Base
            </text>
          </g>

          {/* Node 2A: 1.5s Visual Pattern Interrupt */}
          <g transform="translate(315, 22)">
            <rect
              width="170"
              height="74"
              rx="14"
              fill="url(#nodeGlow)"
              stroke="#22d3ee"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="37" r="11" fill="none" stroke="#22d3ee" strokeDasharray="6 4" className="animate-orbit-spin-reverse" />
            <circle cx="24" cy="37" r="4" fill="#22d3ee" className="animate-beacon-pulse" />
            <text x="44" y="32" fill="#cffafe" fontSize="11.5" fontWeight="700">
              1.5s Visual Hook
            </text>
            <text x="44" y="50" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
              Swipe-Away &lt; 25%
            </text>
          </g>

          {/* Node 2B: Infinite Loop Script */}
          <g transform="translate(315, 114)">
            <rect
              width="170"
              height="74"
              rx="14"
              fill="url(#nodeGlow)"
              stroke="#a855f7"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="37" r="11" fill="none" stroke="#c084fc" strokeDasharray="5 3" className="animate-orbit-spin" />
            <circle cx="24" cy="37" r="4" fill="#c084fc" className="animate-beacon-pulse" />
            <text x="44" y="32" fill="#e9d5ff" fontSize="11.5" fontWeight="700">
              Seam-Free Loop
            </text>
            <text x="44" y="50" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
              104.7% Replay Peak
            </text>
          </g>

          {/* Central Rotating Hub: Algorithm Multiplier */}
          <g transform="translate(645, 105)">
            <circle r="48" fill="#0f172a" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle
              r="42"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="10 6"
              className="animate-orbit-spin-slow"
            />
            <circle
              r="32"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="animate-orbit-spin-reverse"
            />
            <circle r="18" fill="#083344" stroke="#22d3ee" strokeWidth="1.5" className="animate-beacon-pulse" />
            <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
              SHORTS
            </text>
            <text x="0" y="10" textAnchor="middle" fill="#67e8f9" fontSize="9.5" fontFamily="monospace">
              FEED AI
            </text>
          </g>

          {/* Node 4: Returning Binge Audience */}
          <g transform="translate(760, 65)">
            <rect
              width="135"
              height="80"
              rx="14"
              fill="url(#nodeGlow)"
              stroke="#10b981"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="40" r="10" fill="none" stroke="#10b981" strokeDasharray="5 3" className="animate-orbit-spin" />
            <circle cx="24" cy="40" r="4" fill="#34d399" className="animate-beacon-pulse" />
            <text x="42" y="34" fill="#a7f3d0" fontSize="11.5" fontWeight="700">
              Binge Loop
            </text>
            <text x="42" y="52" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
              Subs &amp; 6 PM
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ============================================================================
   2. LIVING SIGNAL ORBIT DIAGRAM (GrowthSignals)
   ============================================================================ */
export const SignalOrbitDiagram: React.FC<{ viralScore: number }> = ({ viralScore }) => {
  return (
    <div
      data-sr-managed="true"
      className="interactive-block bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Viral Signal Radar & Telemetry Conduit
          </h3>
          <p className="text-xs text-slate-400">
            Search Surge, Loop Retention, aur Geo-Drop Signals ka continuous synchronization diagram
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
          Viral Potential: {viralScore}%
        </span>
      </div>

      <svg
        viewBox="0 0 860 170"
        className="w-full h-40 select-none"
        role="img"
        aria-label="Animated Signal Radar Diagram"
      >
        {/* Left Node: Search Surge */}
        <g transform="translate(20, 45)">
          <rect width="190" height="78" rx="14" fill="#0f172a" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1.5" />
          <text x="16" y="33" fill="#6ee7b7" fontSize="12" fontWeight="700">
            Power Automate Surge
          </text>
          <text x="16" y="53" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
            27.8% Search Share
          </text>
        </g>

        {/* Energy Beam Left -> Center */}
        <line x1="210" y1="84" x2="355" y2="84" stroke="#1e293b" strokeWidth="3" />
        <line x1="210" y1="84" x2="355" y2="84" stroke="#10b981" strokeWidth="2.5" className="animate-energy-flow-fast" />

        {/* Center Rotating Signal Core */}
        <g transform="translate(430, 84)">
          <circle r="66" fill="#090f1d" stroke="#f59e0b" strokeOpacity="0.22" strokeWidth="1.5" />
          <circle
            r="56"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="14 8"
            className="animate-orbit-spin"
          />
          <circle
            r="43"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            className="animate-orbit-spin-reverse"
          />
          <circle r="28" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1.5" className="animate-beacon-pulse" />
          <text x="0" y="-2" textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="800" fontFamily="monospace">
            {viralScore}%
          </text>
          <text x="0" y="13" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
            RADAR
          </text>
        </g>

        {/* Energy Beam Center -> Right */}
        <line x1="505" y1="84" x2="650" y2="84" stroke="#1e293b" strokeWidth="3" />
        <line x1="505" y1="84" x2="650" y2="84" stroke="#f59e0b" strokeWidth="2.5" className="animate-energy-flow" />

        {/* Right Node: Loop Retention */}
        <g transform="translate(650, 45)">
          <rect width="190" height="78" rx="14" fill="#0f172a" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.5" />
          <text x="16" y="33" fill="#67e8f9" fontSize="12" fontWeight="700">
            104.7% Loop Velocity
          </text>
          <text x="16" y="53" fill="#94a3b8" fontSize="10.5" fontFamily="monospace">
            6 PM PKT Peak Window
          </text>
        </g>
      </svg>
    </div>
  );
};

/* ============================================================================
   3. LIVING AUTOPILOT PIPELINE DIAGRAM (AutopilotManager & AgentSimulator)
   ============================================================================ */
export const AutopilotPipelineDiagram: React.FC<{ title?: string }> = ({
  title = 'Autonomous Production & Continuity Pipeline',
}) => {
  return (
    <div
      data-sr-managed="true"
      className="interactive-block bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">
            48h Ground Search → Zero-Duplicate Radar → @WM25-X Continuity Lock → 6 PM Slot
          </p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">
          Pipeline Synchronized
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 920 140"
          className="w-full min-w-[640px] h-32 select-none"
          role="img"
          aria-label="Autonomous Content Pipeline Diagram"
        >
          {/* Continuous Energy Bus Line */}
          <line x1="120" y1="70" x2="800" y2="70" stroke="#1e293b" strokeWidth="4" />
          <line
            x1="120"
            y1="70"
            x2="800"
            y2="70"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-energy-flow-fast"
          />

          {/* Stage 1: Trend & 48h Search */}
          <g transform="translate(20, 32)">
            <rect width="175" height="76" rx="14" fill="#0f172a" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="1.5" />
            <circle cx="24" cy="38" r="11" fill="none" stroke="#38bdf8" strokeDasharray="5 3" className="animate-orbit-spin" />
            <circle cx="24" cy="38" r="4" fill="#38bdf8" className="animate-beacon-pulse" />
            <text x="44" y="34" fill="#e0f2fe" fontSize="11.5" fontWeight="700">
              48h Ground Search
            </text>
            <text x="44" y="51" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              10+ Tech Sources
            </text>
          </g>

          {/* Stage 2: Duplicate Guard */}
          <g transform="translate(250, 32)">
            <rect width="175" height="76" rx="14" fill="#0f172a" stroke="#a855f7" strokeOpacity="0.45" strokeWidth="1.5" />
            <circle cx="24" cy="38" r="11" fill="none" stroke="#c084fc" strokeDasharray="6 4" className="animate-orbit-spin-reverse" />
            <circle cx="24" cy="38" r="4" fill="#c084fc" className="animate-beacon-pulse" />
            <text x="44" y="34" fill="#f3e8ff" fontSize="11.5" fontWeight="700">
              Duplicate Radar
            </text>
            <text x="44" y="51" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              0% Catalog Overlap
            </text>
          </g>

          {/* Stage 3: Flow Continuity Engine */}
          <g transform="translate(480, 32)">
            <rect width="185" height="76" rx="14" fill="#0f172a" stroke="#22d3ee" strokeOpacity="0.55" strokeWidth="1.5" />
            <circle cx="24" cy="38" r="12" fill="none" stroke="#22d3ee" strokeDasharray="5 3" className="animate-orbit-spin" />
            <circle cx="24" cy="38" r="5" fill="#22d3ee" className="animate-beacon-pulse" />
            <text x="44" y="34" fill="#cffafe" fontSize="11.5" fontWeight="700">
              Flow + Continuity
            </text>
            <text x="44" y="51" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              @WM25-X · 22–25w
            </text>
          </g>

          {/* Stage 4: Schedule & Queue */}
          <g transform="translate(720, 32)">
            <rect width="180" height="76" rx="14" fill="#0f172a" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.5" />
            <circle cx="24" cy="38" r="11" fill="none" stroke="#10b981" strokeDasharray="4 4" className="animate-orbit-spin-reverse" />
            <circle cx="24" cy="38" r="4" fill="#34d399" className="animate-beacon-pulse" />
            <text x="44" y="34" fill="#d1fae5" fontSize="11.5" fontWeight="700">
              Auto-Publish Queue
            </text>
            <text x="44" y="51" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              6:00 PM PKT Slot
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ============================================================================
   4. LIVING ROADMAP EVOLUTION DIAGRAM (UpscalingRoadmap)
   ============================================================================ */
export const RoadmapOrbitalDiagram: React.FC = () => {
  return (
    <div
      data-sr-managed="true"
      className="interactive-block bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Architecture Upgrade Loop (v3.41 → v3.42+)
          </h3>
          <p className="text-xs text-slate-400">
            Feed Hook, Binge Bridge, Memory Schema, aur Pacing Meter ke darmiyan live upgrade links
          </p>
        </div>
        <span className="text-[11px] font-mono text-cyan-300">6 Active Modules</span>
      </div>

      <svg
        viewBox="0 0 880 150"
        className="w-full h-36 select-none"
        role="img"
        aria-label="Roadmap Evolution Loop Diagram"
      >
        <path
          d="M 110 75 Q 275 18 440 75 T 770 75"
          fill="none"
          stroke="#1e293b"
          strokeWidth="3"
        />
        <path
          d="M 110 75 Q 275 18 440 75 T 770 75"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          className="animate-energy-flow"
        />
        <path
          d="M 110 75 Q 275 132 440 75 T 770 75"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2.5"
        />
        <path
          d="M 110 75 Q 275 132 440 75 T 770 75"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          className="animate-energy-flow-reverse"
        />

        {[
          { x: 110, label: 'Hook v2', sub: '<25% Swipe', color: '#f59e0b' },
          { x: 330, label: 'Binge CTA', sub: '0.2% → 15%', color: '#22d3ee' },
          { x: 550, label: 'Memory Key', sub: 'Duplicate-Proof', color: '#a855f7' },
          { x: 770, label: 'Pacing 2.7w/s', sub: 'Zero Phantom', color: '#10b981' },
        ].map((node) => (
          <g key={node.label} transform={`translate(${node.x}, 75)`}>
            <circle r="36" fill="#0f172a" stroke={node.color} strokeOpacity="0.45" strokeWidth="1.5" />
            <circle
              r="30"
              fill="none"
              stroke={node.color}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              className="animate-orbit-spin"
            />
            <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="700">
              {node.label}
            </text>
            <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {node.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
