import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Flame,
  Gauge,
  Heart,
  Info,
  Link2,
  Loader2,
  MessageSquare,
  Music2,
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Unplug,
  Users,
  Youtube,
  Zap,
} from 'lucide-react';
import {
  deriveYouTube,
  prettySource,
  scoreTikTok,
  scoreYouTube,
  type GrowthAction,
  type GrowthComponent,
  type GrowthScoreResult,
  type TikTokInsights,
  type YouTubeDerived,
  type YouTubeInsights,
} from '../lib/growthScore';

export interface OAuthNotice {
  provider: 'youtube' | 'tiktok';
  status: 'connected' | 'error';
  message?: string;
}

interface LiveInsightsProps {
  oauthNotice?: OAuthNotice | null;
  onDismissOauthNotice?: () => void;
}

interface ConnectedAccount {
  id: string;
  name: string;
  avatar: string;
  subscribers?: number | null;
  followers?: number | null;
  connectedAt: string;
}

interface IntegrationStatus {
  appUrl: string;
  appUrlConfigured: boolean;
  redirectUris: { youtube: string; tiktok: string };
  configured: { youtube: boolean; tiktok: boolean; tokenStorage: boolean };
  connected: { youtube: ConnectedAccount | null; tiktok: ConnectedAccount | null };
}

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function toApiError(err: any): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(err?.message || 'Request fail ho gayi. Dobara try karein.');
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
  });
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Request fail ho gayi (${response.status}).`,
      response.status,
      payload?.code
    );
  }
  return payload;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return numberFormat.format(Math.round(Number(value)));
}

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return compactFormat.format(Number(value));
}

function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}%`;
}

function formatDuration(seconds: number | null | undefined): string {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function formatHours(minutes: number | null | undefined): string {
  const hours = (Number(minutes) || 0) / 60;
  if (hours >= 1000) return `${compactFormat.format(hours)} hrs`;
  return `${hours.toFixed(1)} hrs`;
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return '—';
  const seconds = Math.max(1, Math.round((Date.now() - parsed) / 1000));
  if (seconds < 60) return `${seconds}s pehle`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m pehle`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h pehle`;
  return `${Math.round(hours / 24)}d pehle`;
}

const DEVICE_LABELS: Record<string, string> = {
  MOBILE: 'Mobile',
  DESKTOP: 'Desktop',
  TV: 'TV',
  TABLET: 'Tablet',
  GAME_CONSOLE: 'Game console',
  UNKNOWN_PLATFORM: 'Unknown',
};

const CONTENT_LABELS: Record<string, string> = {
  SHORTS: 'Shorts',
  VIDEO_ON_DEMAND: 'Long-form',
  LIVE_STREAM: 'Live stream',
  STORY: 'Story',
  UNSPECIFIED: 'Unspecified',
};

const COUNTRY_LABELS: Record<string, string> = {
  PK: 'Pakistan',
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  SA: 'Saudi Arabia',
  AE: 'UAE',
  BD: 'Bangladesh',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
};

const YOUTUBE_DAYS = [7, 28, 90];

function sourceColor(source: string): string {
  const value = String(source || '').toUpperCase();
  if (value.includes('SHORTS')) return 'bg-cyan-400';
  if (value.includes('SEARCH')) return 'bg-amber-400';
  if (value === 'BROWSE' || value.includes('SUGGEST')) return 'bg-indigo-400';
  if (value.includes('CHANNEL')) return 'bg-fuchsia-400';
  return 'bg-slate-500';
}

function componentColor(component: GrowthComponent): string {
  if (component.score === null) return 'bg-slate-700';
  const ratio = component.score / component.max;
  if (ratio >= 0.75) return 'bg-emerald-400';
  if (ratio >= 0.5) return 'bg-cyan-400';
  if (ratio >= 0.3) return 'bg-amber-400';
  return 'bg-rose-400';
}

const TONE_HEX: Record<GrowthScoreResult['tone'], string> = {
  emerald: '#34d399',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  rose: '#fb7185',
};

const TONE_TEXT: Record<GrowthScoreResult['tone'], string> = {
  emerald: 'text-emerald-300',
  cyan: 'text-cyan-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
};

const PRIORITY_STYLES: Record<GrowthAction['priority'], string> = {
  P1: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  P2: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  P3: 'bg-slate-700/40 text-slate-300 border-slate-600/60',
};

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-[0_12px_40px_rgba(2,6,23,0.25)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-300">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'text-cyan-300',
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3.5">
      <div className="flex items-center justify-between gap-2 text-slate-400">
        <span className="text-xs">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-1.5 text-xl font-bold text-white tracking-tight">{value}</div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500 truncate">{sub || ''}</span>
        {delta !== null && delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold ${
              delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ result, provider }: { result: GrowthScoreResult; provider: 'youtube' | 'tiktok' }) {
  const platformName = provider === 'youtube' ? 'YouTube' : 'TikTok';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - result.total / 100);
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {provider === 'youtube' ? (
              <Youtube className="w-4 h-4 text-red-400" />
            ) : (
              <Music2 className="w-4 h-4 text-cyan-300" />
            )}
            <h3 className="text-sm font-semibold text-white">{platformName} Growth Score</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">7–8 live signals ka weighted formula</p>
        </div>
        <span className="text-[11px] rounded-full border border-slate-600 bg-slate-800/80 px-2 py-1 text-slate-300">
          Confidence: {result.confidence}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 mt-5">
        <div className="relative w-36 h-36 shrink-0">
          <svg viewBox="0 0 140 140" className="w-36 h-36 -rotate-90">
            <circle cx="70" cy="70" r={radius} stroke="#1e293b" strokeWidth="12" fill="none" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={TONE_HEX[result.tone]}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white leading-none">{result.total}</span>
            <span className="text-[11px] text-slate-500 mt-1">/ 100</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${TONE_TEXT[result.tone]}`}>{result.grade}</span>
            <span className="text-sm font-medium text-slate-200">{result.gradeLabel}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Available {result.availablePoints} points mein se score nikala gaya hai. Jahan API data available
            nahi tha, woh component formula se bahar hai.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-1 text-slate-300">
              Data: {result.confidence}
            </span>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-1 text-slate-300">
              Not official ranking
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {result.components.map((component) => {
          const width = component.score === null ? 0 : (component.score / component.max) * 100;
          return (
            <div key={component.key}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 font-medium">{component.label}</span>
                <span className="text-slate-400 font-mono">
                  {component.score === null ? 'N/A' : `${component.score}/${component.max}`}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${componentColor(component)}`}
                  style={{ width: `${Math.min(100, width)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>{component.value}</span>
                <span className="text-right">{component.benchmark}</span>
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-4 group">
        <summary className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none">
          Formula aur benchmarks kaise bane?
        </summary>
        <div className="mt-2 rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
          <p>
            Score = available components ke earned points ÷ available points × 100. Ye ek heuristic hai —
            YouTube/TikTok ka official ranking score nahi.
          </p>
          {result.components.map((component) => (
            <p key={component.key}>
              <span className="text-slate-300">{component.label}:</span> {component.hint}
            </p>
          ))}
        </div>
      </details>
    </Panel>
  );
}

function ConnectionCard({
  provider,
  status,
  connected,
  isLoading,
  error,
  disconnecting,
  onConnect,
  onDisconnect,
  onRetry,
  onOpenSetup,
}: {
  provider: 'youtube' | 'tiktok';
  status: IntegrationStatus;
  connected: ConnectedAccount | null;
  isLoading: boolean;
  error?: ApiError;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetry: () => void;
  onOpenSetup: () => void;
}) {
  const isYouTube = provider === 'youtube';
  const configured = isYouTube ? status.configured.youtube : status.configured.tiktok;
  const name = isYouTube ? 'YouTube' : 'TikTok';
  const accent = isYouTube ? 'red' : 'cyan';
  const isConnected = Boolean(connected);
  const reconnect = error?.code === 'reconnect' || error?.code === 'not_connected';
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 bg-gradient-to-br ${
        isYouTube
          ? 'from-red-950/30 via-slate-900 to-slate-900 border-red-500/25'
          : 'from-cyan-950/30 via-slate-900 to-slate-900 border-cyan-500/25'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isYouTube
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
          >
            {isYouTube ? <Youtube className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{name}</h3>
              {isConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-300">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
              {!isConnected && configured && (
                <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                  Not connected
                </span>
              )}
              {!isConnected && !configured && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] text-amber-300">
                  Setup needed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isYouTube ? 'Data API v3 + Analytics API' : 'Display API (profile + video stats)'}
            </p>
          </div>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/50 border border-slate-800 p-3 min-h-[78px]">
        {connected ? (
          <div className="flex items-center gap-3">
            {connected.avatar ? (
              <img
                src={connected.avatar}
                alt={`${connected.name} avatar`}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Users className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{connected.name}</p>
              <p className="text-[11px] text-slate-400">
                {isYouTube
                  ? `${formatCompact(connected.subscribers)} subscribers`
                  : `${formatCompact(connected.followers)} followers`}
                <span className="mx-1.5 text-slate-600">•</span>
                Connected {timeAgo(connected.connectedAt)}
              </p>
            </div>
          </div>
        ) : configured ? (
          <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
            <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${accent === 'red' ? 'text-red-300' : 'text-cyan-300'}`} />
            <p>
              Official OAuth se apna {name} account connect karein. Password app ko nahi milta — sirf
              revocable permission token milta hai.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[11px] text-amber-200/90 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
            <p>
              {name} OAuth keys Render environment mein missing hain. Neeche setup steps aur exact redirect
              URI copy karein.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-[11px] text-rose-200 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {connected ? (
          <>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh data
            </button>
            {reconnect && (
              <button
                type="button"
                onClick={onConnect}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/25"
              >
                <Link2 className="w-3.5 h-3.5" /> Reconnect
              </button>
            )}
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-300 hover:border-rose-500/30 disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
              Disconnect
            </button>
          </>
        ) : configured ? (
          <button
            type="button"
            onClick={onConnect}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white ${
              isYouTube ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> Connect {name}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/25"
          >
            <ChevronDown className="w-3.5 h-3.5" /> Setup steps dekhein
          </button>
        )}
      </div>
    </div>
  );
}

function SetupCard({
  provider,
  status,
  copied,
  onCopy,
  onConnect,
}: {
  provider: 'youtube' | 'tiktok';
  status: IntegrationStatus;
  copied: string;
  onCopy: (key: string, value: string) => void;
  onConnect: () => void;
}) {
  const isYouTube = provider === 'youtube';
  const configured = isYouTube ? status.configured.youtube : status.configured.tiktok;
  const redirectUri = status.redirectUris[provider];
  const envKeys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'INTEGRATION_SECRET', 'APP_URL'];
  return (
    <Panel
      className={`p-5 bg-gradient-to-br ${
        isYouTube ? 'from-slate-900 via-slate-900 to-red-950/20' : 'from-slate-900 via-slate-900 to-cyan-950/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isYouTube ? <Youtube className="w-4 h-4 text-red-400" /> : <Music2 className="w-4 h-4 text-cyan-300" />}
          <h3 className="text-sm font-semibold text-white">{isYouTube ? 'YouTube' : 'TikTok'} setup</h3>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] border ${
            configured
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}
        >
          {configured ? 'Keys configured' : 'Keys pending'}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Authorized redirect URI</span>
          <button
            type="button"
            onClick={() => onCopy(`${provider}-redirect`, redirectUri)}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
          >
            {copied === `${provider}-redirect` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === `${provider}-redirect` ? 'Copied' : 'Copy'}
          </button>
        </div>
        <code className="mt-1.5 block break-all font-mono text-[11px] text-slate-200">{redirectUri}</code>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {envKeys.map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => onCopy(`${provider}-${key}`, key)}
            className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 font-mono text-[11px] text-slate-300 hover:border-cyan-500/40"
            title="Copy variable name"
          >
            {key}
          </button>
        ))}
      </div>

      <ol className="mt-4 space-y-2 text-[11px] text-slate-400 leading-relaxed list-decimal list-inside">
        {isYouTube ? (
          <>
            <li>
              Google Cloud Console mein project banayein, phir <strong className="text-slate-200">YouTube Data API v3</strong> aur{' '}
              <strong className="text-slate-200">YouTube Analytics API</strong> enable karein.
            </li>
            <li>
              OAuth consent screen External rakhein, apna Google account Test user mein add karein aur{' '}
              <span className="text-slate-200">youtube.readonly</span> + <span className="text-slate-200">yt-analytics.readonly</span>{' '}
              scopes add karein.
            </li>
            <li>
              Credentials → Create OAuth client ID → Web application. Upar wala exact redirect URI paste karein.
            </li>
            <li>Client ID/secret Render environment mein daalein, redeploy ke baad Connect dabayein.</li>
          </>
        ) : (
          <>
            <li>TikTok for Developers par app banayein aur Login Kit + Display API products add karein.</li>
            <li>
              Scopes: <span className="text-slate-200">user.info.basic</span>,{' '}
              <span className="text-slate-200">user.info.stats</span>, <span className="text-slate-200">video.list</span>.
            </li>
            <li>Redirect URI exact wahi rakhein jo upar dikh raha hai. Client key/secret Render env mein daalein.</li>
            <li>App review se pehle sandbox/test mode mein apne target account se connect karke test karein.</li>
          </>
        )}
      </ol>

      {isYouTube && (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200/90 leading-relaxed">
          Google Cloud app “Testing” mode mein refresh token 7 din baad expire hota hai. Is liye har hafte
          Reconnect karna pad sakta hai. Published/verified app mein ye long-lived hota hai.
        </p>
      )}
      {!status.configured.tokenStorage && (
        <p className="mt-2 rounded-lg border border-rose-500/25 bg-rose-500/10 p-2.5 text-[11px] text-rose-200 leading-relaxed">
          INTEGRATION_SECRET set nahi hai — tokens encrypt ho kar save nahi ho sakte. 32+ random characters
          ka secret Render environment mein add karein.
        </p>
      )}
      {!status.appUrlConfigured && (
        <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200/90 leading-relaxed">
          APP_URL Render env mein set karein (e.g. https://itcafeteria-studio.onrender.com). Abhi request host
          fallback use ho raha hai.
        </p>
      )}

      <button
        type="button"
        onClick={onConnect}
        disabled={!configured}
        className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
          isYouTube ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'
        }`}
      >
        <Link2 className="w-3.5 h-3.5" />
        {configured ? `Connect ${isYouTube ? 'YouTube' : 'TikTok'}` : 'Pehle Render keys add karein'}
      </button>
    </Panel>
  );
}

function ViewsChart({ data, derived }: { data: YouTubeInsights; derived: YouTubeDerived }) {
  const current = data.daily;
  const previous = data.previousDaily;
  if (!current.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
        Is range ka daily data available nahi hai.
      </div>
    );
  }
  const width = 720;
  const height = 210;
  const padLeft = 44;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const allValues = [...current.map((row) => row.views), ...previous.map((row) => row.views)];
  const maxValue = Math.max(1, ...allValues);
  const x = (index: number, length: number) =>
    padLeft + (length <= 1 ? plotWidth / 2 : (index / (length - 1)) * plotWidth);
  const y = (value: number) => padTop + (1 - value / maxValue) * plotHeight;
  const linePath = (rows: typeof current) =>
    rows
      .map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index, rows.length).toFixed(1)} ${y(row.views).toFixed(1)}`)
      .join(' ');
  const areaPath = `${linePath(current)} L ${x(current.length - 1, current.length).toFixed(1)} ${(
    padTop + plotHeight
  ).toFixed(1)} L ${padLeft} ${(padTop + plotHeight).toFixed(1)} Z`;
  const gridValues = [0, maxValue / 2, maxValue];
  const labelIndexes = Array.from(
    new Set(current.length > 2 ? [0, Math.floor((current.length - 1) / 2), current.length - 1] : [0, current.length - 1])
  );
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-cyan-300">
            <span className="w-3 h-1.5 rounded-full bg-cyan-400" /> Current {data.days}d
          </span>
          {previous.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-1.5 rounded-full bg-slate-500" /> Previous {data.days}d
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500">
          Total: <span className="text-slate-300 font-semibold">{formatNumber(data.summary.views)}</span> views
        </span>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52" role="img" aria-label="Daily views chart">
          <defs>
            <linearGradient id="liveYtArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridValues.map((value, index) => (
            <g key={index}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y(value)}
                y2={y(value)}
                stroke="#1e293b"
                strokeDasharray="4 4"
              />
              <text x={padLeft - 8} y={y(value) + 3.5} textAnchor="end" fill="#94a3b8" fontSize="11">
                {formatCompact(value)}
              </text>
            </g>
          ))}
          {previous.length > 0 && (
            <path d={linePath(previous)} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 5" />
          )}
          <path d={areaPath} fill="url(#liveYtArea)" />
          <path d={linePath(current)} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" />
          {labelIndexes.map((index) => (
            <text
              key={index}
              x={x(index, current.length)}
              y={height - 8}
              textAnchor={index === 0 ? 'start' : index === current.length - 1 ? 'end' : 'middle'}
              fill="#94a3b8"
              fontSize="11"
            >
              {formatShortDate(current[index]?.date)}
            </text>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Range {formatShortDate(data.range.startDate)} – {formatShortDate(data.range.endDate)}. Momentum{' '}
        {derived.momentumPct === null ? 'ke liye previous data nahi.' : `${derived.momentumPct >= 0 ? '+' : ''}${derived.momentumPct}% previous period vs.`}
      </p>
    </div>
  );
}

function TrafficPanel({ data, derived }: { data: YouTubeInsights; derived: YouTubeDerived }) {
  const rows = derived.traffic.slice(0, 7);
  const diagnosis =
    derived.shortsFeedShare !== null && derived.shortsFeedShare < 20
      ? {
          tone: 'amber',
          title: 'Shorts Feed bottleneck',
          text: `Shorts feed sirf ${derived.shortsFeedShare}% traffic de raha hai. Hook/loop par focus karein.`,
        }
      : derived.searchShare !== null && derived.searchShare > 65
        ? {
            tone: 'amber',
            title: 'Search dependency high',
            text: `Search ${derived.searchShare}% hai. Feed distribution barhane ke liye curiosity-first packaging test karein.`,
          }
        : {
            tone: 'emerald',
            title: 'Discovery mix theek hai',
            text: 'Traffic sources mein healthy spread hai. Jo source sabse strong hai, usi format ko repeat karein.',
          };
  return (
    <Panel className="p-5">
      <SectionTitle
        icon={<BarChart3 className="w-4 h-4" />}
        title="Traffic Sources"
        subtitle="Views kis surface se aa rahe hain"
        right={
          <span className="text-[11px] text-slate-400">
            Top: <span className="text-slate-200">{derived.topSource?.label || '—'}</span>
          </span>
        }
      />
      {rows.length ? (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.source}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300">{row.label}</span>
                <span className="text-slate-400 font-mono">
                  {row.share}% <span className="text-slate-600">·</span> {formatCompact(row.views)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${sourceColor(row.source)}`} style={{ width: `${row.share}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Traffic source breakdown available nahi hai.</p>
      )}
      <div
        className={`mt-4 rounded-xl border p-3 text-[11px] leading-relaxed ${
          diagnosis.tone === 'amber'
            ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
        }`}
      >
        <span className="font-semibold">{diagnosis.title}: </span>
        {diagnosis.text}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Shorts feed {derived.shortsFeedShare ?? '—'}% · Search {derived.searchShare ?? '—'}% · Browse/suggested{' '}
        {derived.browseSuggestedShare ?? '—'}%
      </p>
    </Panel>
  );
}

function AudiencePanel({ data, derived }: { data: YouTubeInsights; derived: YouTubeDerived }) {
  const newShare = derived.newViewerShare;
  const returningShare = derived.returningShare;
  const countryRows = data.countries.slice(0, 5);
  const deviceRows = data.devices.slice(0, 4);
  const deviceTotal = data.devices.reduce((sum, row) => sum + row.views, 0);
  const countryTotal = data.countries.reduce((sum, row) => sum + row.views, 0);
  return (
    <Panel className="p-5">
      <SectionTitle icon={<Users className="w-4 h-4" />} title="Audience Quality" subtitle="Viewer type (views), device aur geography" />
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">New vs returning (views)</span>
          <span className="text-slate-400">
            {returningShare === null ? 'Data unavailable' : `${returningShare}% of views`}
          </span>
        </div>
        {returningShare !== null && newShare !== null ? (
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="bg-cyan-400" style={{ width: `${newShare}%` }} />
            <div className="bg-fuchsia-400" style={{ width: `${returningShare}%` }} />
          </div>
        ) : (
          <div className="mt-2 h-3 rounded-full bg-slate-800" />
        )}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> New {newShare ?? '—'}%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400" /> Returning {returningShare ?? '—'}%
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Devices</p>
          <div className="space-y-2">
            {deviceRows.length ? (
              deviceRows.map((row) => {
                const share = deviceTotal ? (row.views / deviceTotal) * 100 : 0;
                return (
                  <div key={row.device}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{DEVICE_LABELS[row.device] || row.device}</span>
                      <span className="text-slate-400">{share.toFixed(1)}%</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-500">Device data nahi.</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Top countries</p>
          <div className="space-y-1.5">
            {countryRows.length ? (
              countryRows.map((row) => {
                const share = countryTotal ? (row.views / countryTotal) * 100 : 0;
                return (
                  <div key={row.country} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-300">
                      {COUNTRY_LABELS[row.country] || row.country}
                      <span className="text-slate-600 ml-1">({row.country})</span>
                    </span>
                    <span className="text-slate-400 font-mono">{share.toFixed(1)}%</span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-500">Country data nahi.</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function FormatPanel({ data, derived }: { data: YouTubeInsights; derived: YouTubeDerived }) {
  const total = data.contentTypes.reduce((sum, row) => sum + row.views, 0);
  return (
    <Panel className="p-5">
      <SectionTitle icon={<FilmIcon />} title="Format Mix" subtitle="Shorts vs long-form views" />
      {data.contentTypes.length ? (
        <div className="space-y-3">
          {data.contentTypes.map((row) => {
            const share = total ? (row.views / total) * 100 : 0;
            return (
              <div key={row.type}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">{CONTENT_LABELS[row.type] || row.type}</span>
                  <span className="text-slate-400 font-mono">
                    {share.toFixed(1)}% · {formatCompact(row.views)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${/SHORTS/i.test(row.type) ? 'bg-cyan-400' : 'bg-indigo-400'}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Format split available nahi hai.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
          <p className="text-[11px] text-slate-500">Shorts views</p>
          <p className="text-sm font-bold text-cyan-300">{derived.shortsViewShare === null ? '—' : `${derived.shortsViewShare}%`}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
          <p className="text-[11px] text-slate-500">Avg view duration</p>
          <p className="text-sm font-bold text-white">{formatDuration(data.summary.avgViewDuration)}</p>
        </div>
      </div>
    </Panel>
  );
}

function FilmIcon() {
  return <Eye className="w-4 h-4" />;
}

function TopVideos({ data }: { data: YouTubeInsights }) {
  return (
    <Panel className="p-5">
      <SectionTitle
        icon={<Play className="w-4 h-4" />}
        title="Top Videos"
        subtitle="Is range mein views ke hisaab se top 10"
        right={<span className="text-[11px] text-slate-500">{data.topVideos.length} videos</span>}
      />
      {data.topVideos.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                <th className="pb-2 font-medium">Video</th>
                <th className="pb-2 font-medium">Views</th>
                <th className="pb-2 font-medium">Avg viewed</th>
                <th className="pb-2 font-medium">Engagement</th>
                <th className="pb-2 font-medium">Likes / comments</th>
                <th className="pb-2 font-medium">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {data.topVideos.map((video, index) => (
                <tr key={video.id} className="text-slate-300 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5 min-w-[260px]">
                      <span className="text-[11px] text-slate-500 w-4 shrink-0">{index + 1}</span>
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt=""
                          className="w-16 h-9 rounded object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {video.id ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white font-medium hover:text-cyan-300 line-clamp-1"
                          >
                            {video.title}
                          </a>
                        ) : (
                          <span className="text-white font-medium">{video.title}</span>
                        )}
                        <div className="text-[11px] text-slate-500">
                          {formatDuration(video.durationSeconds)} · {formatCompact(video.minutesWatched)} min watched
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-cyan-300">{formatNumber(video.views)}</td>
                  <td className="py-2.5 pr-3">{formatPercent(video.avgViewPercentage)}</td>
                  <td className="py-2.5 pr-3">{formatPercent(video.engagementRate, 2)}</td>
                  <td className="py-2.5 pr-3 text-slate-400">
                    {formatCompact(video.likes)} / {formatCompact(video.comments)}
                  </td>
                  <td className="py-2.5 text-slate-500 whitespace-nowrap">
                    {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Is range mein top video data available nahi hai.</p>
      )}
    </Panel>
  );
}

function YouTubeSection({ data, derived }: { data: YouTubeInsights; derived: YouTubeDerived }) {
  const summary = data.summary;
  return (
    <Panel className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/15 border-red-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/25 overflow-hidden flex items-center justify-center">
            {data.channel.avatar ? (
              <img src={data.channel.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Youtube className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{data.channel.title}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Live API
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatNumber(data.channel.subscribers)} subscribers · {formatShortDate(data.range.startDate)} –{' '}
              {formatShortDate(data.range.endDate)} · Updated {timeAgo(data.fetchedAt)}
              {data.cached ? ' · cached' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-slate-300">
            {data.days}-day window
          </span>
          {data.channel.customUrl && (
            <a
              href={`https://www.youtube.com/${data.channel.customUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-slate-300 hover:text-white"
            >
              Channel <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Views"
          value={formatNumber(summary.views)}
          sub={`Previous ${formatCompact(data.previousSummary.views)}`}
          icon={<Eye className="w-4 h-4" />}
          accent="text-cyan-300"
          delta={derived.momentumPct}
        />
        <StatCard
          label="Watch time"
          value={formatHours(summary.minutesWatched)}
          sub={`${formatCompact(summary.minutesWatched)} minutes`}
          icon={<Clock3 className="w-4 h-4" />}
          accent="text-indigo-300"
        />
        <StatCard
          label="Avg viewed"
          value={formatPercent(summary.avgViewPercentage)}
          sub={`Avg ${formatDuration(summary.avgViewDuration)} per view`}
          icon={<Gauge className="w-4 h-4" />}
          accent="text-emerald-300"
        />
        <StatCard
          label="Net subscribers"
          value={`${summary.netSubscribers >= 0 ? '+' : ''}${formatNumber(summary.netSubscribers)}`}
          sub={`${formatNumber(summary.subscribersGained)} gained · ${formatNumber(summary.subscribersLost)} lost`}
          icon={<Users className="w-4 h-4" />}
          accent="text-fuchsia-300"
        />
        <StatCard
          label="Engagement"
          value={formatPercent(summary.engagementRate, 2)}
          sub={`${formatNumber(summary.interactions)} interactions`}
          icon={<Heart className="w-4 h-4" />}
          accent="text-rose-300"
        />
        <StatCard
          label="Sub conversion"
          value={`${summary.subscribersPer1kViews} / 1K`}
          sub="Net subs per 1,000 views"
          icon={<Target className="w-4 h-4" />}
          accent="text-amber-300"
        />
        <StatCard
          label="Uploads"
          value={formatNumber(summary.uploads)}
          sub={`${derived.uploadsPerWeek} per week`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="text-cyan-300"
        />
        <StatCard
          label="Returning-view share"
          value={derived.returningShare === null ? '—' : formatPercent(derived.returningShare)}
          sub={derived.newViewerShare === null ? 'Split unavailable' : `${derived.newViewerShare}% new viewers`}
          icon={<Users className="w-4 h-4" />}
          accent="text-fuchsia-300"
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-300" /> Daily Views Trend
        </h3>
        <ViewsChart data={data} derived={derived} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TrafficPanel data={data} derived={derived} />
        <AudiencePanel data={data} derived={derived} />
        <FormatPanel data={data} derived={derived} />
        <Panel className="p-5">
          <SectionTitle icon={<Sparkles className="w-4 h-4" />} title="Quick Diagnosis" subtitle="Live numbers se seedhe signals" />
          <div className="space-y-2.5 text-[11px]">
            <DiagnosisRow
              ok={summary.avgViewPercentage >= 50}
              label="Retention"
              text={
                summary.avgViewPercentage >= 50
                  ? `${summary.avgViewPercentage}% average viewed — content pakad raha hai.`
                  : `${summary.avgViewPercentage}% average viewed — pehle 2 seconds par kaam karein.`
              }
            />
            <DiagnosisRow
              ok={summary.engagementRate >= 3}
              label="Engagement"
              text={
                summary.engagementRate >= 3
                  ? `${summary.engagementRate}% engagement healthy range mein hai.`
                  : `${summary.engagementRate}% engagement — end CTA aur question add karein.`
              }
            />
            <DiagnosisRow
              ok={(derived.shortsFeedShare || 0) >= 20}
              label="Discovery"
              text={
                (derived.shortsFeedShare || 0) >= 20
                  ? `Shorts feed ${derived.shortsFeedShare}% traffic de raha hai.`
                  : `Shorts feed ${derived.shortsFeedShare ?? 0}% — discovery surface weak hai.`
              }
            />
            <DiagnosisRow
              ok={(derived.returningShare || 0) >= 15}
              label="Loyalty"
              text={
                (derived.returningShare || 0) >= 15
                  ? `${derived.returningShare}% views returning viewers se aa rahe hain.`
                  : `${derived.returningShare ?? 0}% returning-view share — series bridge aur next-episode tease add karein.`
              }
            />
            <DiagnosisRow
              ok={summary.uploads >= Math.max(3, Math.round((data.days / 7) * 3))}
              label="Cadence"
              text={`${summary.uploads} uploads in ${data.days} days (${derived.uploadsPerWeek}/week).`}
            />
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <TopVideos data={data} />
      </div>

      {data.notes.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
          <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" /> Data notes
          </p>
          <ul className="space-y-1 text-[11px] text-slate-500 list-disc list-inside">
            {data.notes.slice(0, 4).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function DiagnosisRow({ ok, label, text }: { ok: boolean; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
      <span
        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`}
        aria-hidden="true"
      />
      <div>
        <span className="font-medium text-slate-200">{label}: </span>
        <span className="text-slate-400">{text}</span>
      </div>
    </div>
  );
}

function TikTokSection({ data }: { data: TikTokInsights }) {
  const summary = data.summary;
  const topVideos = [...data.videos].sort((a, b) => b.views - a.views).slice(0, 6);
  return (
    <Panel className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 border-cyan-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 overflow-hidden flex items-center justify-center">
            {data.profile.avatar ? (
              <img src={data.profile.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Music2 className="w-6 h-6 text-cyan-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{data.profile.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Live API
              </span>
              {data.profile.verified && (
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300">
                  Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatNumber(data.profile.followers)} followers · {formatNumber(data.profile.videoCount)} videos ·
              Updated {timeAgo(data.fetchedAt)}
              {data.cached ? ' · cached' : ''}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-200">
          Lifetime counts — official date-range API nahi
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="Followers"
          value={formatNumber(data.profile.followers)}
          sub={data.profile.statsAvailable ? 'Profile stats live' : 'Stats scope unavailable'}
          icon={<Users className="w-4 h-4" />}
          accent="text-cyan-300"
        />
        <StatCard
          label="Profile likes"
          value={formatNumber(data.profile.likes)}
          sub="Lifetime total"
          icon={<Heart className="w-4 h-4" />}
          accent="text-rose-300"
        />
        <StatCard
          label="Avg views / video"
          value={formatCompact(summary.averageViews)}
          sub={`Median ${formatCompact(summary.medianViews)}`}
          icon={<Play className="w-4 h-4" />}
          accent="text-cyan-300"
        />
        <StatCard
          label="Engagement"
          value={formatPercent(summary.engagementRate, 2)}
          sub={`${formatNumber(summary.interactions)} interactions`}
          icon={<Heart className="w-4 h-4" />}
          accent="text-fuchsia-300"
        />
        <StatCard
          label="Share rate"
          value={formatPercent(summary.shareRate, 2)}
          sub={`${formatCompact(summary.totalShares)} shares`}
          icon={<Share2 className="w-4 h-4" />}
          accent="text-emerald-300"
        />
        <StatCard
          label="Posting cadence"
          value={`${summary.postsPerWeek}/wk`}
          sub={`${summary.videosAnalyzed} videos analyzed`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="text-amber-300"
        />
      </div>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-100/90 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-cyan-300 mt-0.5" />
        <p>
          TikTok Display API sirf profile aur public video counts deta hai. Watch-time, retention curve,
          traffic source aur demographics official API mein available nahi hain — is liye TikTok score in
          signals par nahi banta.
        </p>
      </div>

      <div className="mt-5">
        <SectionTitle
          icon={<Flame className="w-4 h-4" />}
          title="Top Videos (Recent 20)"
          subtitle="Views ke hisaab se top 6"
          right={<span className="text-[11px] text-slate-500">Lifetime views</span>}
        />
        {topVideos.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {topVideos.map((video) => (
              <a
                key={video.id}
                href={video.url || undefined}
                target={video.url ? '_blank' : undefined}
                rel={video.url ? 'noreferrer' : undefined}
                className="group flex gap-3 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3 hover:border-cyan-500/40 transition-colors"
              >
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                  {video.cover ? (
                    <img
                      src={video.cover}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Play className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-cyan-200">{video.title}</p>
                  <p className="mt-1 text-lg font-bold text-cyan-300">{formatCompact(video.views)}</p>
                  <p className="text-[11px] text-slate-500">views · {formatDuration(video.duration)}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {formatCompact(video.likes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {formatCompact(video.comments)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> {formatCompact(video.shares)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {video.engagementRate}% engagement ·{' '}
                    {video.createdAt
                      ? new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Recent videos available nahi hain ya video.list scope missing hai.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] text-slate-500">Avg likes / video</p>
          <p className="text-sm font-bold text-rose-300">{formatCompact(summary.averageLikes)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] text-slate-500">Like-to-follower ratio</p>
          <p className="text-sm font-bold text-fuchsia-300">
            {summary.likeFollowerRatio === null ? '—' : `${summary.likeFollowerRatio}%`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] text-slate-500">Comment rate</p>
          <p className="text-sm font-bold text-amber-300">{summary.commentRate}%</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
        <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" /> API limitations
        </p>
        <ul className="space-y-1 text-[11px] text-slate-500 list-disc list-inside">
          {data.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function CompareSection({ yt, tt }: { yt: YouTubeInsights; tt: TikTokInsights }) {
  const ytUploads = Math.max(1, yt.summary.uploads);
  const rows = [
    {
      label: 'Engagement rate',
      youtube: formatPercent(yt.summary.engagementRate, 2),
      tiktok: formatPercent(tt.summary.engagementRate, 2),
      ytValue: yt.summary.engagementRate,
      ttValue: tt.summary.engagementRate,
    },
    {
      label: 'Posts per week',
      youtube: `${(yt.summary.uploads / Math.max(1, yt.days)) * 7 > 0 ? ((yt.summary.uploads / yt.days) * 7).toFixed(1) : '0.0'}`,
      tiktok: tt.summary.postsPerWeek.toFixed(1),
      ytValue: (yt.summary.uploads / Math.max(1, yt.days)) * 7,
      ttValue: tt.summary.postsPerWeek,
    },
    {
      label: 'Avg views per post',
      youtube: formatCompact(yt.summary.views / ytUploads),
      tiktok: formatCompact(tt.summary.averageViews),
      ytValue: yt.summary.views / ytUploads,
      ttValue: tt.summary.averageViews,
    },
    {
      label: 'Interactions per post',
      youtube: formatCompact(yt.summary.interactions / ytUploads),
      tiktok: formatCompact(tt.summary.videosAnalyzed ? tt.summary.interactions / tt.summary.videosAnalyzed : 0),
      ytValue: yt.summary.interactions / ytUploads,
      ttValue: tt.summary.videosAnalyzed ? tt.summary.interactions / tt.summary.videosAnalyzed : 0,
    },
  ];
  return (
    <Panel className="p-5">
      <SectionTitle
        icon={<BarChart3 className="w-4 h-4" />}
        title="YouTube vs TikTok"
        subtitle="Available signals ka side-by-side comparison"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-500">
              <th className="pb-2 text-left font-medium">Metric</th>
              <th className="pb-2 text-right font-medium text-red-300">
                <span className="inline-flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </span>
              </th>
              <th className="pb-2 text-right font-medium text-cyan-300">
                <span className="inline-flex items-center gap-1">
                  <Music2 className="w-3.5 h-3.5" /> TikTok
                </span>
              </th>
              <th className="pb-2 text-right font-medium">Aage kaun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((row) => {
              const winner =
                Math.abs(row.ytValue - row.ttValue) < 0.001
                  ? 'Tie'
                  : row.ytValue > row.ttValue
                    ? 'YouTube'
                    : 'TikTok';
              return (
                <tr key={row.label} className="text-slate-300">
                  <td className="py-2.5">{row.label}</td>
                  <td className={`py-2.5 text-right font-mono ${winner === 'YouTube' ? 'text-emerald-300 font-bold' : ''}`}>
                    {row.youtube}
                  </td>
                  <td className={`py-2.5 text-right font-mono ${winner === 'TikTok' ? 'text-emerald-300 font-bold' : ''}`}>
                    {row.tiktok}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] border ${
                        winner === 'Tie'
                          ? 'border-slate-600 bg-slate-800 text-slate-300'
                          : winner === 'YouTube'
                            ? 'border-red-500/25 bg-red-500/10 text-red-300'
                            : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'
                      }`}
                    >
                      {winner}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        Note: YouTube numbers selected {yt.days}-day window ke hain, TikTok numbers recent 20 videos ke
        lifetime counts hain. Direct winner ko platform strategy ka final answer na samjhein — format aur
        audience intent alag hota hai.
      </p>
    </Panel>
  );
}

function ActionPlan({ actions }: { actions: GrowthAction[] }) {
  return (
    <Panel className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
      <SectionTitle
        icon={<Zap className="w-4 h-4 text-amber-300" />}
        title="Next 7 Days — Action Plan"
        subtitle="Live score ke rules se generated, priority order mein"
        right={<span className="text-[11px] text-slate-500">P1 = sabse pehle</span>}
      />
      {actions.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {actions.map((action) => (
            <div key={`${action.platform}-${action.id}`} className="rounded-xl border border-slate-700/70 bg-slate-950/45 p-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${PRIORITY_STYLES[action.priority]}`}>
                  {action.priority}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  {action.platform === 'youtube' ? (
                    <Youtube className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Music2 className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                  {action.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-white">{action.title}</h4>
              <p className="mt-1 text-[11px] text-amber-200/80">{action.evidence}</p>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{action.action}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Action plan ke liye pehle koi channel connect karein.</p>
      )}
    </Panel>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-40 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-52 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
        <div className="h-52 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
      </div>
    </div>
  );
}

export function LiveInsights({ oauthNotice, onDismissOauthNotice }: LiveInsightsProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);
  const [days, setDays] = useState(28);
  const daysRef = useRef(days);
  daysRef.current = days;
  const [yt, setYt] = useState<YouTubeInsights | null>(null);
  const [tt, setTt] = useState<TikTokInsights | null>(null);
  const [loading, setLoading] = useState<{ youtube: boolean; tiktok: boolean }>({
    youtube: false,
    tiktok: false,
  });
  const [errors, setErrors] = useState<{ youtube?: ApiError; tiktok?: ApiError }>({});
  const [notice, setNotice] = useState<OAuthNotice | null>(oauthNotice || null);
  const [copied, setCopied] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState<'youtube' | 'tiktok' | null>(null);
  const [setupOpen, setSetupOpen] = useState(true);

  useEffect(() => {
    if (!oauthNotice) return;
    setNotice(oauthNotice);
    onDismissOauthNotice?.();
  }, [oauthNotice, onDismissOauthNotice]);

  const loadStatus = useCallback(async (): Promise<IntegrationStatus | null> => {
    setStatusLoading(true);
    setStatusError('');
    try {
      const data = (await fetchJson('/api/integrations/status')) as IntegrationStatus;
      setStatus(data);
      return data;
    } catch (err: any) {
      setStatusError(toApiError(err).message);
      return null;
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadYoutube = useCallback(
    async (force = false, dayOverride?: number) => {
      const requestedDays = dayOverride ?? daysRef.current;
      setLoading((prev) => ({ ...prev, youtube: true }));
      setErrors((prev) => ({ ...prev, youtube: undefined }));
      try {
        const data = (await fetchJson(
          `/api/integrations/youtube/insights?days=${requestedDays}${force ? '&fresh=1' : ''}`
        )) as YouTubeInsights;
        setYt(data);
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, youtube: toApiError(err) }));
        setYt(null);
      } finally {
        setLoading((prev) => ({ ...prev, youtube: false }));
      }
    },
    []
  );

  const loadTiktok = useCallback(async (force = false) => {
    setLoading((prev) => ({ ...prev, tiktok: true }));
    setErrors((prev) => ({ ...prev, tiktok: undefined }));
    try {
      const data = (await fetchJson(
        `/api/integrations/tiktok/insights${force ? '?fresh=1' : ''}`
      )) as TikTokInsights;
      setTt(data);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, tiktok: toApiError(err) }));
      setTt(null);
    } finally {
      setLoading((prev) => ({ ...prev, tiktok: false }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await loadStatus();
      if (!active || !data) return;
      await Promise.all([
        data.connected.youtube ? loadYoutube(false) : Promise.resolve(setYt(null)),
        data.connected.tiktok ? loadTiktok(false) : Promise.resolve(setTt(null)),
      ]);
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadStatus, loadYoutube, loadTiktok]);

  const ytDerived = useMemo(() => (yt ? deriveYouTube(yt) : null), [yt]);
  const ytScore = useMemo(() => (yt && ytDerived ? scoreYouTube(yt, ytDerived) : null), [yt, ytDerived]);
  const ttScore = useMemo(() => (tt ? scoreTikTok(tt) : null), [tt]);

  const actions = useMemo(() => {
    const combined = [...(ytScore?.actions || []), ...(ttScore?.actions || [])];
    const order: Record<GrowthAction['priority'], number> = { P1: 0, P2: 1, P3: 2 };
    return combined.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 7);
  }, [ytScore, ttScore]);

  const ytConnected = Boolean(status?.connected.youtube);
  const ttConnected = Boolean(status?.connected.tiktok);
  const hasAnyConnection = ytConnected || ttConnected;
  const needsSetup = Boolean(status && (!status.connected.youtube || !status.connected.tiktok));

  const handleConnect = (provider: 'youtube' | 'tiktok') => {
    window.location.href = `/api/integrations/oauth/${provider}/start`;
  };

  const handleDaysChange = (value: number) => {
    if (value === days) return;
    setDays(value);
    if (!ytConnected) return;
    setYt(null);
    void loadYoutube(false, value);
  };

  const handleRefresh = async () => {
    if (!status) return;
    setRefreshing(true);
    try {
      await Promise.all([
        ytConnected ? loadYoutube(true) : Promise.resolve(),
        ttConnected ? loadTiktok(true) : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async (provider: 'youtube' | 'tiktok') => {
    if (provider === 'youtube') await loadYoutube(true);
    else await loadTiktok(true);
  };

  const handleDisconnect = async (provider: 'youtube' | 'tiktok') => {
    const label = provider === 'youtube' ? 'YouTube' : 'TikTok';
    if (!window.confirm(`${label} disconnect karein? Tokens is browser se delete ho jayenge.`)) return;
    setDisconnecting(provider);
    try {
      await fetchJson(`/api/integrations/disconnect/${provider}`, { method: 'POST' });
      if (provider === 'youtube') {
        setYt(null);
        setErrors((prev) => ({ ...prev, youtube: undefined }));
      } else {
        setTt(null);
        setErrors((prev) => ({ ...prev, tiktok: undefined }));
      }
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              connected: {
                ...prev.connected,
                [provider]: null,
              },
            }
          : prev
      );
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [provider]: toApiError(err) }));
    } finally {
      setDisconnecting(null);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  if (statusLoading && !status) return <LoadingState />;

  if (statusError && !status) {
    return (
      <Panel className="p-6 border-rose-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-white">Live insights status load nahi hua</h2>
            <p className="text-xs text-slate-400 mt-1">{statusError}</p>
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-red-950/40 via-slate-900 to-cyan-950/40 p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                <Activity className="w-3.5 h-3.5" /> Live Insights
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2.5 py-1 text-[11px] text-slate-300">
                Official YouTube + TikTok APIs
              </span>
              {hasAnyConnection && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {ytConnected && ttConnected ? 'Both connected' : ytConnected ? 'YouTube connected' : 'TikTok connected'}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Live Channel Intelligence</h1>
            <p className="mt-1.5 max-w-3xl text-sm text-slate-300 leading-relaxed">
              YouTube Analytics aur TikTok Display API se seedha data. Growth Score, traffic leaks, top videos
              aur next-7-days action plan — sab ek dashboard mein.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 p-1">
              {YOUTUBE_DAYS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleDaysChange(value)}
                  disabled={loading.youtube}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    days === value ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {value}d
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing || !hasAnyConnection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh all
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-start justify-between gap-3 ${
            notice.status === 'connected'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-100'
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.status === 'connected' ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-300 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
            )}
            <span>
              {notice.status === 'connected'
                ? `${notice.provider === 'youtube' ? 'YouTube' : 'TikTok'} connect ho gaya. Live data load ho raha hai.`
                : notice.message || 'Connection complete nahi hua. Dobara try karein.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] underline decoration-transparent hover:decoration-current opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {status && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ConnectionCard
              provider="youtube"
              status={status}
              connected={status.connected.youtube}
              isLoading={loading.youtube}
              error={errors.youtube}
              disconnecting={disconnecting === 'youtube'}
              onConnect={() => handleConnect('youtube')}
              onDisconnect={() => void handleDisconnect('youtube')}
              onRetry={() => void handleRetry('youtube')}
              onOpenSetup={() => setSetupOpen(true)}
            />
            <ConnectionCard
              provider="tiktok"
              status={status}
              connected={status.connected.tiktok}
              isLoading={loading.tiktok}
              error={errors.tiktok}
              disconnecting={disconnecting === 'tiktok'}
              onConnect={() => handleConnect('tiktok')}
              onDisconnect={() => void handleDisconnect('tiktok')}
              onRetry={() => void handleRetry('tiktok')}
              onOpenSetup={() => setSetupOpen(true)}
            />
          </div>

          {!status.configured.tokenStorage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
              <span>
                INTEGRATION_SECRET Render env mein missing hai. Iske bina OAuth tokens encrypt nahi honge aur
                connection save nahi hoga.
              </span>
            </div>
          )}

          {needsSetup && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Connection Setup</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sirf ek baar ka kaam. Client secrets sirf Render environment mein daalein — GitHub par kabhi
                    na upload karein.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupOpen((value) => !value)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
                  {setupOpen ? 'Hide steps' : 'Show steps'}
                </button>
              </div>
              {setupOpen && (
                <div className="max-w-2xl">
                  <SetupCard
                    provider="youtube"
                    status={status}
                    copied={copied}
                    onCopy={(key, value) => void handleCopy(key, value)}
                    onConnect={() => handleConnect('youtube')}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading.youtube && !yt && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" /> YouTube Analytics data aa raha hai...
        </div>
      )}
      {loading.tiktok && !tt && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" /> TikTok Display API data aa raha hai...
        </div>
      )}

      {(ytScore || ttScore) && (
        <div className={`grid grid-cols-1 gap-4 ${ytScore && ttScore ? 'xl:grid-cols-2' : ''}`}>
          {ytScore && <ScoreCard result={ytScore} provider="youtube" />}
          {ttScore && <ScoreCard result={ttScore} provider="tiktok" />}
        </div>
      )}

      {yt && ytDerived && <YouTubeSection data={yt} derived={ytDerived} />}
      {tt && <TikTokSection data={tt} />}
      {yt && tt && <CompareSection yt={yt} tt={tt} />}
      {(yt || tt) && <ActionPlan actions={actions} />}

      {!hasAnyConnection && status && (
        <Panel className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connect karte hi kya milega?</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                YouTube se daily views, watch-time, retention, traffic sources, subscriber gains, top videos
                aur Shorts vs long-form split. TikTok se profile stats, recent videos ke views/likes/comments/
                shares aur posting cadence. Dono par growth score + action plan.
              </p>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="p-4">
        <div className="flex flex-wrap items-start gap-3 text-[11px] text-slate-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="flex-1 min-w-[240px]">
            Tokens AES-256-GCM se encrypted HttpOnly cookie mein rehte hain; password kabhi store nahi hota.
            Disconnect se turant delete ho jate hain. Growth Score ek heuristic hai, official platform score
            nahi. YouTube data 1–2 din delayed ho sakta hai; server refresh 5 minute cache karta hai.
          </p>
          <div className="flex gap-3">
            <a
              href="https://developers.google.com/youtube/analytics"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300"
            >
              YouTube API docs <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://developers.tiktok.com/doc/display-api-overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300"
            >
              TikTok API docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}
