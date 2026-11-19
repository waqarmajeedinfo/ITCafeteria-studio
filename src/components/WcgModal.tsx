import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Film,
  Palette,
  Search,
  Check,
  ExternalLink,
  Layers,
  Server,
  Loader2,
  Copy,
  Music,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DEFAULT_WCG_CARD_DATA,
  WCG_MUSIC_PRESETS,
  WCG_TEMPLATES,
  findWcgMusicPreset,
  getDefaultMusicForCategory,
  type WcgCardData,
  type WcgCardPartAnalysis,
  type WcgCustomSongItem,
  type WcgCustomTemplateItem,
  type WcgEventCategory,
  type WcgPartCount,
  type WcgPartFilter,
  type WcgPatchBlendMode,
  type WcgRenderQuality,
  type WcgRenderResult,
  type WcgStylingConfig,
  type WcgTemplateSpec,
  type WcgTransitionStyle,
  type WcgTrendSuggestion,
} from '../lib/wcgTemplates';
import { WCGUploadManager } from './WCGUploadManager';

interface WcgModalProps {
  onClose: () => void;
}

const EVENT_FILTERS: WcgEventCategory[] = ['All', 'Mehndi', 'Barat', 'Walima', 'Nikah'];
const PART_FILTERS: Array<{ value: WcgPartFilter; label: string; hint: string }> = [
  { value: 'all', label: 'All Parts', hint: 'Sab Types' },
  { value: '1', label: '1-Part (All-in-One)', hint: 'Ek Hi Card' },
  { value: '2', label: '2-Part Suite', hint: '2 Pages' },
  { value: '3', label: '3-Part Trio', hint: 'Mehndi · Barat · Walima' },
];

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawArchitecturalBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  styling: WcgStylingConfig,
  archStyle: WcgTemplateSpec['archStyle']
) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 30, w * 0.5, h * 0.5, h * 0.72);
  grad.addColorStop(0, styling.primaryColor);
  grad.addColorStop(1, styling.secondaryColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle royal borders
  ctx.strokeStyle = styling.accentColor;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.42;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  // Mughal Jharokha / Floral Arch silhouette
  ctx.beginPath();
  if (archStyle === 'mughal-dome' || archStyle === 'floral-arch') {
    ctx.moveTo(52, h - 55);
    ctx.lineTo(52, 220);
    ctx.quadraticCurveTo(56, 130, 145, 108);
    ctx.quadraticCurveTo(w / 2, 52, w - 145, 108);
    ctx.quadraticCurveTo(w - 56, 130, w - 52, 220);
    ctx.lineTo(w - 52, h - 55);
    ctx.closePath();
  } else {
    ctx.rect(52, 82, w - 104, h - 164);
  }
  ctx.globalAlpha = 0.34;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Corner diamonds
  const corners: Array<[number, number]> = [
    [30, 30],
    [w - 30, 30],
    [30, h - 30],
    [w - 30, h - 30],
  ];
  ctx.fillStyle = styling.accentColor;
  ctx.globalAlpha = 0.82;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

interface DrawTextBlock {
  text: string;
  slotY: number; // Normalized 0..1 inside safeRect
  size: number;
  isAccent?: boolean;
  isScript?: boolean;
  bold?: boolean;
  startSec: number;
  typeSec: number;
  boxBorder?: boolean;
}

interface SafeRectPx {
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawTypedBlocks(
  ctx: CanvasRenderingContext2D,
  safeRect: SafeRectPx,
  localT: number,
  blocks: DrawTextBlock[],
  styling: WcgStylingConfig
) {
  const spacing = Math.max(0.85, Math.min(1.16, styling.spacingScale || 1));
  const padX = Math.max(8, safeRect.w * 0.08);
  const padY = Math.max(10, safeRect.h * 0.075);
  const innerW = Math.max(90, safeRect.w - padX * 2);
  const innerH = Math.max(110, safeRect.h - padY * 2);
  const centerX = safeRect.x + safeRect.w / 2;
  const minY = safeRect.y + padY;
  const maxY = safeRect.y + safeRect.h - padY;

  const boxScale = Math.min(1.14, Math.max(0.58, Math.min(innerW / 180, innerH / 254)));

  // Pre-measure full-text vertical footprint inside safeRect so long copy auto-compresses cleanly
  const nonEmpty = blocks.filter((b) => String(b.text || '').trim().length > 0);
  const preMeasured = nonEmpty.map((b) => {
    const fs = Math.max(6.2, b.size * boxScale);
    const fontFamily = b.isScript ? styling.scriptFont : styling.displayFont;
    const weight = b.bold ? '700' : '600';
    ctx.font = `${weight} ${fs}px "${fontFamily}", Georgia, serif`;
    const fullLines = wrapCanvasText(ctx, String(b.text || ''), innerW);
    const lineH = fs * 1.18 * spacing;
    return { b, fs, fullLinesCount: fullLines.length, lineH };
  });

  const sumHeights = preMeasured.reduce((acc, m) => acc + m.fullLinesCount * m.lineH + m.fs * 0.25, 0);
  const compress = sumHeights > innerH * 0.96 ? (innerH * 0.94) / sumHeights : 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const m of preMeasured) {
    const { b } = m;
    if (localT < b.startSec) continue;
    const progress = Math.min(1, (localT - b.startSec) / Math.max(0.25, b.typeSec));
    const full = String(b.text || '');
    const visibleCount = Math.max(1, Math.ceil(full.length * progress));
    const shown = full.slice(0, visibleCount);
    const alpha = Math.min(1, (localT - b.startSec) / 0.28);

    const fs = Math.max(5.6, m.fs * compress);
    const lineH = fs * 1.16 * spacing;

    ctx.save();
    ctx.globalAlpha = alpha;
    const fontFamily = b.isScript ? styling.scriptFont : styling.displayFont;
    const weight = b.bold ? '700' : '600';
    ctx.font = `${weight} ${fs}px "${fontFamily}", Georgia, serif`;
    ctx.fillStyle = b.isAccent ? styling.accentColor : styling.textColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.62)';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 1.5;

    const lines = wrapCanvasText(ctx, shown, innerW);
    const halfBlockH = ((lines.length - 1) * lineH) / 2;
    const rawCenterY = minY + b.slotY * (maxY - minY);
    const centerY = Math.max(
      minY + halfBlockH + fs * 0.5,
      Math.min(maxY - halfBlockH - fs * 0.5, rawCenterY)
    );
    const firstY = centerY - halfBlockH;

    if (b.boxBorder && progress > 0.1) {
      const boxW = Math.min(safeRect.w * 0.92, innerW + 10);
      const boxH = Math.max(24, lines.length * lineH + 10);
      ctx.save();
      ctx.strokeStyle = styling.accentColor;
      ctx.lineWidth = 1.4;
      ctx.fillStyle = 'rgba(6, 20, 14, 0.34)';
      ctx.beginPath();
      ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    lines.forEach((line, idx) => {
      ctx.fillText(line, centerX, firstY + idx * lineH);
    });
    ctx.restore();
  }
}

export const WcgModal: React.FC<WcgModalProps> = ({ onClose }) => {
  const [activeView, setActiveView] = useState<'studio' | 'deploy'>('studio');
  const [categoryFilter, setCategoryFilter] = useState<WcgEventCategory>('All');
  const [partFilter, setPartFilter] = useState<WcgPartFilter>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WcgTemplateSpec>(WCG_TEMPLATES[0]);
  const [partCount, setPartCount] = useState<WcgPartCount>(WCG_TEMPLATES[0].partCount || 2);
  const [card, setCard] = useState<WcgCardData>({ ...DEFAULT_WCG_CARD_DATA });
  const [styling, setStyling] = useState<WcgStylingConfig>({ ...WCG_TEMPLATES[0].styling });
  const [durationSeconds, setDurationSeconds] = useState<number>(19);
  const [showSafeGuide, setShowSafeGuide] = useState<boolean>(false);
  const [isAnalyzingCard, setIsAnalyzingCard] = useState<boolean>(false);
  const [analyzeStatusMsg, setAnalyzeStatusMsg] = useState<string>('');
  const [analyzeErrorMsg, setAnalyzeErrorMsg] = useState<string>('');

  // Trend Verifier state
  const [trendQuery, setTrendQuery] = useState<string>('Pakistani Mehndi & Rasm-e-Hina traditional wedding card 2026');
  const [isCheckingTrends, setIsCheckingTrends] = useState<boolean>(false);
  const [trendResult, setTrendResult] = useState<WcgTrendSuggestion | null>(null);
  const [trendsAppliedMsg, setTrendsAppliedMsg] = useState<string>('');

  // Music & HD Quality state
  const [musicId, setMusicId] = useState<string>('mehndi-laga-ke-rakhna');
  const [musicVolume, setMusicVolume] = useState<number>(0.78);
  const [previewingMusicId, setPreviewingMusicId] = useState<string | null>(null);
  const [quality, setQuality] = useState<WcgRenderQuality>('1080p');

  // Permanent Server Library state (custom templates + custom 30s songs)
  const [customTemplates, setCustomTemplates] = useState<WcgCustomTemplateItem[]>([]);
  const [customSongs, setCustomSongs] = useState<WcgCustomSongItem[]>([]);
  const [activeCustomTemplate, setActiveCustomTemplate] = useState<WcgCustomTemplateItem | null>(null);

  // Render & Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderElapsedSec, setRenderElapsedSec] = useState<number>(0);
  const [renderError, setRenderError] = useState<string>('');
  const [renderResult, setRenderResult] = useState<WcgRenderResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgS1Ref = useRef<HTMLImageElement | null>(null);
  const imgS2Ref = useRef<HTMLImageElement | null>(null);
  const customImg1Ref = useRef<HTMLImageElement | null>(null);
  const customImg2Ref = useRef<HTMLImageElement | null>(null);
  const customImg3Ref = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [imagesReady, setImagesReady] = useState<boolean>(false);
  const [customImagesRev, setCustomImagesRev] = useState<number>(0);
  const mountedRef = useRef<boolean>(true);
  const renderRunIdRef = useRef<number>(0);

  useEffect(() => {
    mountedRef.current = true;
    fetch('/api/wcg/library')
      .then((r) => r.json())
      .then((json) => {
        if (!mountedRef.current || !json?.ok) return;
        if (Array.isArray(json.templates)) setCustomTemplates(json.templates);
        if (Array.isArray(json.songs)) setCustomSongs(json.songs);
      })
      .catch(() => {});

    return () => {
      mountedRef.current = false;
      renderRunIdRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Preload active custom uploaded card images (up to 3 parts) for live canvas preview
  useEffect(() => {
    if (!activeCustomTemplate) {
      customImg1Ref.current = null;
      customImg2Ref.current = null;
      customImg3Ref.current = null;
      return;
    }
    let alive = true;
    const i1 = new Image();
    const i2 = new Image();
    const i3 = new Image();
    const bump = () => {
      if (alive) setCustomImagesRev((v) => v + 1);
    };
    i1.onload = bump;
    i2.onload = bump;
    i3.onload = bump;
    i1.src = activeCustomTemplate.part1Url;
    i2.src = activeCustomTemplate.part2Url || activeCustomTemplate.part1Url;
    i3.src = activeCustomTemplate.part3Url || activeCustomTemplate.part2Url || activeCustomTemplate.part1Url;
    customImg1Ref.current = i1;
    customImg2Ref.current = i2;
    customImg3Ref.current = i3;
    return () => {
      alive = false;
    };
  }, [activeCustomTemplate]);

  // Preload s1 & s2 high-res uploaded assets for instant smooth 60fps canvas rendering
  useEffect(() => {
    let mounted = true;
    const s1 = new Image();
    const s2 = new Image();
    let loaded = 0;
    const mark = () => {
      loaded += 1;
      if (loaded >= 2 && mounted) setImagesReady(true);
    };
    s1.onload = mark;
    s2.onload = mark;
    s1.onerror = mark;
    s2.onerror = mark;
    s1.src = '/assets/aistudio/s1_0b0de8d4.jpeg';
    s2.src = '/assets/aistudio/s2_610b836e.jpeg';
    imgS1Ref.current = s1;
    imgS2Ref.current = s2;
    return () => {
      mounted = false;
    };
  }, []);

  // Playback animation timer
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        return next >= durationSeconds ? 0 : next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, durationSeconds]);

  // Draw live crisp 720x1280 9:16 preview onto canvas (supports 1-part, 2-part, 3-part modes & all 17 transitions)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 360;
    const h = 640;
    const sx = canvas.width / w;
    const sy = canvas.height / h;
    const xfadeDur = 0.85;
    const segDur = durationSeconds / partCount;

    const getBlocksForPart = (part: 1 | 2 | 3): DrawTextBlock[] => {
      const st = segDur / 9.5;
      if (partCount === 1) {
        const s1 = durationSeconds / 18;
        return [
          { text: card.invocation, slotY: 0.05, size: 7.5, isAccent: true, bold: true, startSec: 0.25 * s1, typeSec: 0.8 * s1 },
          { text: `${card.hostLine1}  &  ${card.hostLine2}`, slotY: 0.145, size: 10.6, bold: true, startSec: 0.9 * s1, typeSec: 1.1 * s1 },
          { text: 'Invite you to Celebrate the Wedding of', slotY: 0.24, size: 8.6, startSec: 1.9 * s1, typeSec: 0.9 * s1 },
          { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.345, size: 19, isScript: true, isAccent: true, startSec: 2.7 * s1, typeSec: 1.0 * s1 },
          { text: card.eventTitle, slotY: 0.465, size: 19.5, isAccent: true, bold: true, startSec: 3.6 * s1, typeSec: 0.9 * s1 },
          { text: card.eventSubtitle, slotY: 0.56, size: 10.2, startSec: 4.4 * s1, typeSec: 0.8 * s1 },
          { text: `Programme  ·  ${card.weddingDate}`, slotY: 0.655, size: 10.8, isAccent: true, bold: true, startSec: 5.1 * s1, typeSec: 0.95 * s1 },
          { text: card.timing1, slotY: 0.735, size: 9.8, startSec: 5.9 * s1, typeSec: 0.8 * s1 },
          { text: card.timing2, slotY: 0.80, size: 9.8, startSec: 6.6 * s1, typeSec: 0.8 * s1 },
          { text: card.venueName, slotY: 0.885, size: 12.8, isAccent: true, bold: true, startSec: 7.3 * s1, typeSec: 0.85 * s1 },
          { text: card.venueAddress, slotY: 0.96, size: 8.4, startSec: 8.0 * s1, typeSec: 1.0 * s1 },
        ];
      }

      if (partCount === 3) {
        if (part === 1) {
          return [
            { text: card.invocation, slotY: 0.06, size: 7.5, isAccent: true, bold: true, startSec: 0.2 * st, typeSec: 0.75 * st },
            { text: `${card.hostLine1} & ${card.hostLine2}`, slotY: 0.17, size: 10.4, bold: true, startSec: 0.85 * st, typeSec: 0.95 * st },
            { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.30, size: 17.5, isScript: true, isAccent: true, startSec: 1.7 * st, typeSec: 0.9 * st },
            { text: `FUNCTION 1  ·  ${card.func1Title}`, slotY: 0.45, size: 19, isAccent: true, bold: true, startSec: 2.5 * st, typeSec: 0.9 * st },
            { text: card.func1Subtitle, slotY: 0.57, size: 10.5, startSec: 3.3 * st, typeSec: 0.85 * st },
            { text: card.func1Date, slotY: 0.69, size: 11.4, isAccent: true, bold: true, startSec: 4.1 * st, typeSec: 0.85 * st },
            { text: card.func1Timing, slotY: 0.80, size: 10, startSec: 4.9 * st, typeSec: 0.85 * st },
            { text: card.func1Venue, slotY: 0.92, size: 10, isAccent: true, bold: true, startSec: 5.7 * st, typeSec: 0.9 * st, boxBorder: true },
          ];
        }
        if (part === 2) {
          return [
            { text: 'FUNCTION 2  ·  ROYAL CEREMONY', slotY: 0.08, size: 8.8, isAccent: true, bold: true, startSec: 0.2 * st, typeSec: 0.75 * st },
            { text: card.func2Title, slotY: 0.24, size: 25, isScript: true, isAccent: true, startSec: 0.9 * st, typeSec: 0.95 * st },
            { text: card.func2Subtitle, slotY: 0.40, size: 11.5, startSec: 1.8 * st, typeSec: 0.9 * st },
            { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.54, size: 13, isAccent: true, bold: true, startSec: 2.6 * st, typeSec: 0.85 * st },
            { text: card.func2Date, slotY: 0.68, size: 12, isAccent: true, bold: true, startSec: 3.4 * st, typeSec: 0.9 * st },
            { text: card.func2Timing, slotY: 0.79, size: 10.4, startSec: 4.2 * st, typeSec: 0.9 * st },
            { text: card.func2Venue, slotY: 0.92, size: 10.4, isAccent: true, bold: true, startSec: 5.0 * st, typeSec: 0.95 * st, boxBorder: true },
          ];
        }
        return [
          { text: 'FUNCTION 3  ·  GRAND RECEPTION', slotY: 0.08, size: 8.8, isAccent: true, bold: true, startSec: 0.2 * st, typeSec: 0.75 * st },
          { text: card.func3Title, slotY: 0.24, size: 25, isScript: true, isAccent: true, startSec: 0.9 * st, typeSec: 0.95 * st },
          { text: card.func3Subtitle, slotY: 0.40, size: 11.5, startSec: 1.8 * st, typeSec: 0.9 * st },
          { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.54, size: 13, isAccent: true, bold: true, startSec: 2.6 * st, typeSec: 0.85 * st },
          { text: card.func3Date, slotY: 0.68, size: 12, isAccent: true, bold: true, startSec: 3.4 * st, typeSec: 0.9 * st },
          { text: card.func3Timing, slotY: 0.79, size: 10.4, startSec: 4.2 * st, typeSec: 0.9 * st },
          { text: card.func3Venue, slotY: 0.92, size: 10.4, isAccent: true, bold: true, startSec: 5.0 * st, typeSec: 0.95 * st, boxBorder: true },
        ];
      }

      // Default 2-Part Suite
      if (part === 1) {
        return [
          { text: card.invocation, slotY: 0.06, size: 7.5, isAccent: true, bold: true, startSec: 0.25 * st, typeSec: 0.85 * st },
          { text: card.hostLine1, slotY: 0.19, size: 13.4, bold: true, startSec: 0.95 * st, typeSec: 1.0 * st },
          { text: card.relationLine1, slotY: 0.33, size: 9.2, startSec: 1.85 * st, typeSec: 1.15 * st },
          { text: card.hostLine2, slotY: 0.49, size: 13.4, isAccent: true, bold: true, startSec: 2.9 * st, typeSec: 1.0 * st },
          { text: card.relationLine2, slotY: 0.63, size: 9.2, startSec: 3.8 * st, typeSec: 1.1 * st },
          { text: `${card.groomName}  &  ${card.brideName}`, slotY: 0.77, size: 17.5, isScript: true, isAccent: true, startSec: 4.8 * st, typeSec: 0.95 * st },
          { text: `${card.specialTitle}: ${card.specialNames}`, slotY: 0.92, size: 8.8, startSec: 5.7 * st, typeSec: 1.05 * st, boxBorder: true },
        ];
      }
      return [
        { text: card.part2Blessing, slotY: 0.06, size: 12.6, isAccent: true, bold: true, startSec: 0.25 * st, typeSec: 0.75 * st },
        { text: card.part2Intro, slotY: 0.15, size: 8.2, startSec: 0.9 * st, typeSec: 0.85 * st },
        { text: card.eventTitle, slotY: 0.28, size: 25, isScript: true, isAccent: true, startSec: 1.65 * st, typeSec: 0.9 * st },
        { text: card.eventSubtitle, slotY: 0.40, size: 11, startSec: 2.45 * st, typeSec: 0.85 * st },
        { text: `Programme  ·  ${card.weddingDate}`, slotY: 0.53, size: 11.2, isAccent: true, bold: true, startSec: 3.2 * st, typeSec: 1.05 * st },
        { text: card.timing1, slotY: 0.64, size: 10.2, startSec: 4.15 * st, typeSec: 0.85 * st },
        { text: card.timing2, slotY: 0.72, size: 10.2, startSec: 4.9 * st, typeSec: 0.85 * st },
        { text: card.venueName, slotY: 0.84, size: 13, isAccent: true, bold: true, startSec: 5.65 * st, typeSec: 0.85 * st },
        { text: card.venueAddress, slotY: 0.94, size: 8.6, startSec: 6.4 * st, typeSec: 1.1 * st },
      ];
    };

    const renderScenePart = (
      part: 1 | 2 | 3,
      localT: number,
      alpha: number,
      offsetX = 0,
      offsetY = 0,
      extraScale = 1,
      extraRot = 0
    ) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
      if (extraRot !== 0) ctx.rotate(extraRot);
      if (extraScale !== 1) ctx.scale(extraScale, extraScale);
      ctx.translate(-w / 2, -h / 2);

      const isCustom = Boolean(activeCustomTemplate);
      const isBuiltinMultipart = !isCustom && selectedTemplate.id === 'pakistani-emerald-mehndi-multipart';
      const img = isCustom
        ? (part === 1 ? customImg1Ref.current : part === 2 ? customImg2Ref.current : customImg3Ref.current)
        : isBuiltinMultipart
          ? (part === 2 ? imgS2Ref.current : imgS1Ref.current)
          : null;

      const partAnalysis: WcgCardPartAnalysis | null = isCustom
        ? (part === 1
            ? activeCustomTemplate?.part1Analysis
            : part === 2
              ? activeCustomTemplate?.part2Analysis || activeCustomTemplate?.part1Analysis
              : activeCustomTemplate?.part3Analysis || activeCustomTemplate?.part2Analysis || activeCustomTemplate?.part1Analysis) || null
        : isBuiltinMultipart
          ? (part === 2 ? selectedTemplate.part2Analysis : selectedTemplate.part1Analysis) || null
          : null;

      let safeRect: SafeRectPx = {
        x: w * 0.14,
        y: h * 0.17,
        w: w * 0.72,
        h: h * 0.66,
      };

      const patchMode: WcgPatchBlendMode = styling.patchMode || 'seamless';

      if ((isCustom || isBuiltinMultipart) && img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.filter = 'blur(18px) brightness(0.62)';
        ctx.drawImage(img, -20, -20, w + 40, h + 40);
        ctx.restore();

        const baseScale = Math.min(w / img.naturalWidth, (h * 0.76) / img.naturalHeight);
        const zoom = 1 + Math.min(0.025, localT * 0.0025);
        const cardW = img.naturalWidth * baseScale * zoom;
        const cardH = img.naturalHeight * baseScale * zoom;
        const cardX = (w - cardW) / 2;
        const cardY = (h - cardH) / 2;
        ctx.drawImage(img, cardX, cardY, cardW, cardH);

        const sb = partAnalysis?.safeBox || { x: 0.22, y: 0.22, w: 0.56, h: 0.48 };
        const hbs = partAnalysis?.hideBoxes || [sb];
        const pColor = partAnalysis?.patchColor || (part === 2 ? styling.secondaryColor : styling.primaryColor);

        safeRect = {
          x: cardX + sb.x * cardW,
          y: cardY + sb.y * cardH,
          w: sb.w * cardW,
          h: sb.h * cardH,
        };

        // Cover all pre-existing sample text & calligraphy smoothly with sampled card background
        if (styling.cleanSampleText && patchMode !== 'direct') {
          ctx.save();
          ctx.fillStyle = pColor;
          ctx.shadowColor = pColor;
          ctx.shadowBlur = 14;
          for (const hb of hbs) {
            ctx.beginPath();
            ctx.roundRect(
              cardX + hb.x * cardW,
              cardY + hb.y * cardH,
              hb.w * cardW,
              hb.h * cardH,
              10
            );
            ctx.fill();
            ctx.fill(); // second soft pass deepens opacity in center while keeping feathered edge
          }
          ctx.restore();
        }

        // Optional adaptive frosted/tinted plaque fitted strictly to safeRect
        if (patchMode === 'plaque') {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.88;
          ctx.fillStyle = pColor;
          ctx.strokeStyle = styling.accentColor;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(safeRect.x + 2, safeRect.y + 2, safeRect.w - 4, safeRect.h - 4, 12);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Preview-only Safe Overlay Guide toggle
        if (showSafeGuide) {
          ctx.save();
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(safeRect.x, safeRect.y, safeRect.w, safeRect.h);
          ctx.restore();
        }
      } else {
        drawArchitecturalBackdrop(ctx, w, h, styling, selectedTemplate.archStyle);
      }

      ctx.save();
      ctx.fillStyle = styling.accentColor;
      for (let i = 0; i < 12; i += 1) {
        const px = ((Math.sin(i * 73.1 + localT * 0.35) + 1) * 0.5) * w;
        const py = ((Math.cos(i * 41.7 + localT * 0.22) + 1) * 0.5) * h;
        const r = 1.2 + (i % 3) * 0.55;
        ctx.globalAlpha = Math.max(0, alpha) * (0.2 + 0.35 * Math.abs(Math.sin(localT * 1.4 + i)));
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawTypedBlocks(ctx, safeRect, localT, getBlocksForPart(part), styling);
      ctx.restore();
    };

    const drawTransition = (fromPart: 1 | 2, toPart: 2 | 3, p: number, toLocalT: number) => {
      const tr: WcgTransitionStyle = styling.transitionStyle;
      if (tr === 'fade_black') {
        if (p < 0.5) renderScenePart(fromPart, currentTime, 1 - p * 2);
        else renderScenePart(toPart, toLocalT, (p - 0.5) * 2);
      } else if (tr === 'lightleak') {
        renderScenePart(fromPart, currentTime, 1 - p);
        renderScenePart(toPart, toLocalT, p);
        ctx.save();
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.55;
        ctx.fillStyle = '#FFF3D1';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      } else if (tr === 'slideup' || tr === 'wipeup') {
        renderScenePart(fromPart, currentTime, 1 - p, 0, -p * h * 0.32);
        renderScenePart(toPart, toLocalT, p, 0, (1 - p) * h * 0.32);
      } else if (tr === 'slidedown' || tr === 'wipedown') {
        renderScenePart(fromPart, currentTime, 1 - p, 0, p * h * 0.32);
        renderScenePart(toPart, toLocalT, p, 0, -(1 - p) * h * 0.32);
      } else if (tr === 'slideleft' || tr === 'wipeleft') {
        renderScenePart(fromPart, currentTime, 1 - p, -p * w * 0.45, 0);
        renderScenePart(toPart, toLocalT, p, (1 - p) * w * 0.45, 0);
      } else if (tr === 'slideright' || tr === 'wiperight') {
        renderScenePart(fromPart, currentTime, 1 - p, p * w * 0.45, 0);
        renderScenePart(toPart, toLocalT, p, -(1 - p) * w * 0.45, 0);
      } else if (tr === 'zoomin') {
        renderScenePart(fromPart, currentTime, 1 - p, 0, 0, 1 + p * 0.14);
        renderScenePart(toPart, toLocalT, p, 0, 0, 0.88 + p * 0.12);
      } else if (tr === 'zoomout') {
        renderScenePart(fromPart, currentTime, 1 - p, 0, 0, 1 - p * 0.12);
        renderScenePart(toPart, toLocalT, p, 0, 0, 1.14 - p * 0.14);
      } else if (tr === 'spin') {
        renderScenePart(fromPart, currentTime, 1 - p, 0, 0, 1 - p * 0.15, p * 0.18);
        renderScenePart(toPart, toLocalT, p, 0, 0, 0.85 + p * 0.15, -(1 - p) * 0.18);
      } else {
        renderScenePart(fromPart, currentTime, 1 - p);
        renderScenePart(toPart, toLocalT, p);
      }
    };

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(sx, sy);

    if (partCount === 1) {
      renderScenePart(1, currentTime, 1);
    } else if (partCount === 2) {
      const boundary = segDur;
      if (currentTime >= boundary - xfadeDur / 2 && currentTime <= boundary + xfadeDur / 2) {
        const p = (currentTime - (boundary - xfadeDur / 2)) / xfadeDur;
        drawTransition(1, 2, p, Math.max(0, currentTime - (boundary - xfadeDur / 2)));
      } else if (currentTime < boundary) {
        renderScenePart(1, currentTime, 1);
      } else {
        renderScenePart(2, currentTime - boundary, 1);
      }
    } else {
      const b1 = segDur;
      const b2 = segDur * 2;
      if (currentTime >= b1 - xfadeDur / 2 && currentTime <= b1 + xfadeDur / 2) {
        const p = (currentTime - (b1 - xfadeDur / 2)) / xfadeDur;
        drawTransition(1, 2, p, Math.max(0, currentTime - (b1 - xfadeDur / 2)));
      } else if (currentTime >= b2 - xfadeDur / 2 && currentTime <= b2 + xfadeDur / 2) {
        const p = (currentTime - (b2 - xfadeDur / 2)) / xfadeDur;
        drawTransition(2, 3, p, Math.max(0, currentTime - (b2 - xfadeDur / 2)));
      } else if (currentTime < b1) {
        renderScenePart(1, currentTime, 1);
      } else if (currentTime < b2) {
        renderScenePart(2, currentTime - b1, 1);
      } else {
        renderScenePart(3, currentTime - b2, 1);
      }
    }
    ctx.restore();
  }, [currentTime, card, styling, selectedTemplate, activeCustomTemplate, partCount, durationSeconds, imagesReady, customImagesRev, showSafeGuide]);

  const filteredTemplates = useMemo(
    () =>
      WCG_TEMPLATES.filter((t) => {
        const catOk = categoryFilter === 'All' || t.category === categoryFilter;
        const partOk = partFilter === 'all' || String(t.partCount) === partFilter;
        return catOk && partOk;
      }),
    [categoryFilter, partFilter]
  );

  const handleSelectTemplate = (tpl: WcgTemplateSpec) => {
    setActiveCustomTemplate(null);
    setSelectedTemplate(tpl);
    setPartCount(tpl.partCount || 2);
    setStyling({ ...tpl.styling });
    setAnalyzeStatusMsg('');
    setAnalyzeErrorMsg('');
    setCard((prev) => ({
      ...prev,
      eventTitle: tpl.defaultEventTitle,
      eventSubtitle: tpl.defaultEventSubtitle,
      timing1: tpl.defaultTiming1,
      timing2: tpl.defaultTiming2,
    }));
    setMusicId(getDefaultMusicForCategory(tpl.category));
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSelectCustomTemplate = (customTpl: WcgCustomTemplateItem) => {
    setActiveCustomTemplate(customTpl);
    const matchingBuiltin =
      WCG_TEMPLATES.find((t) => t.category === customTpl.category) || WCG_TEMPLATES[0];
    setSelectedTemplate(matchingBuiltin);
    const customParts =
      customTpl.partCount || (customTpl.part3Url ? 3 : customTpl.part2Url ? 2 : 1);
    setPartCount(customParts);
    setAnalyzeErrorMsg('');
    if (customTpl.part1Analysis) {
      setStyling((prev) => ({
        ...prev,
        primaryColor: customTpl.part1Analysis?.patchColor || prev.primaryColor,
        textColor: customTpl.part1Analysis?.suggestedTextColor || prev.textColor,
        accentColor: customTpl.part1Analysis?.suggestedAccentColor || prev.accentColor,
        cleanSampleText: true,
        patchMode: prev.patchMode || 'seamless',
      }));
      setAnalyzeStatusMsg(customTpl.part1Analysis.summaryRomanUrdu || 'AI card safe zone applied.');
    } else {
      setAnalyzeStatusMsg('');
    }
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleAnalyzeActiveCard = async () => {
    const targetId = activeCustomTemplate
      ? activeCustomTemplate.id
      : selectedTemplate.id === 'pakistani-emerald-mehndi-multipart'
        ? selectedTemplate.id
        : null;
    if (!targetId) return;

    const activePart: 1 | 2 | 3 =
      partCount === 1
        ? 1
        : partCount === 2
          ? currentTime < durationSeconds / 2
            ? 1
            : 2
          : currentTime < durationSeconds / 3
            ? 1
            : currentTime < (durationSeconds * 2) / 3
              ? 2
              : 3;

    setIsAnalyzingCard(true);
    setAnalyzeErrorMsg('');
    setAnalyzeStatusMsg('');
    try {
      const res = await fetch('/api/wcg/analyze-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: targetId,
          part: activePart,
          requireVision: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok || !json.analysis) {
        setAnalyzeErrorMsg(json?.error || 'AI Vision card analysis fail ho gayi.');
        return;
      }

      const analysis: WcgCardPartAnalysis = json.analysis;
      if (activeCustomTemplate) {
        const updated: WcgCustomTemplateItem = {
          ...activeCustomTemplate,
          ...(activePart === 1
            ? { part1Analysis: analysis }
            : activePart === 2
              ? { part2Analysis: analysis }
              : { part3Analysis: analysis }),
        };
        setActiveCustomTemplate(updated);
        setCustomTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        setSelectedTemplate((prev) => ({
          ...prev,
          ...(activePart === 2 ? { part2Analysis: analysis } : { part1Analysis: analysis }),
        }));
      }

      setStyling((prev) => ({
        ...prev,
        primaryColor: activePart === 1 ? analysis.patchColor : prev.primaryColor,
        secondaryColor: activePart === 2 ? analysis.patchColor : prev.secondaryColor,
        textColor: analysis.suggestedTextColor || prev.textColor,
        accentColor: analysis.suggestedAccentColor || prev.accentColor,
        cleanSampleText: true,
      }));
      setAnalyzeStatusMsg(analysis.summaryRomanUrdu || 'Part region AI Vision se refine ho gaya hai.');
    } catch (err: any) {
      setAnalyzeErrorMsg(err?.message || 'Analyze API connect nahi ho saki.');
    } finally {
      setIsAnalyzingCard(false);
    }
  };

  const stopAudioPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPreviewingMusicId(null);
  };

  const handleToggleMusicPreview = (presetId: string, customAudioUrl?: string) => {
    if (previewingMusicId === presetId) {
      stopAudioPreview();
      return;
    }
    const preset = findWcgMusicPreset(presetId);
    const customSong = customSongs.find((s) => s.id === presetId);
    const resolvedUrl = customAudioUrl || customSong?.audioUrl || preset?.audioUrl;
    if (!resolvedUrl) {
      stopAudioPreview();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPreviewingMusicId(null);
    }
    audioRef.current.pause();
    audioRef.current.src = resolvedUrl;
    audioRef.current.volume = musicVolume;
    audioRef.current.loop = true;
    audioRef.current.play().catch(() => {});
    setPreviewingMusicId(presetId);
    setMusicId(presetId);
  };

  const handleVerifyTrends = async () => {
    setIsCheckingTrends(true);
    setTrendsAppliedMsg('');
    try {
      const res = await fetch('/api/wcg/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trendQuery,
          category: selectedTemplate.category,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.trend) {
        setTrendResult(json.trend);
      }
    } catch {
      // Ignore network hiccup
    } finally {
      setIsCheckingTrends(false);
    }
  };

  const handleApplyTrendStyling = () => {
    if (!trendResult?.recommendedStyling) return;
    setStyling((prev) => ({
      ...prev,
      ...trendResult.recommendedStyling,
    }));
    setTrendsAppliedMsg('Adaptive AI trend styling canvas aur export config par apply ho gayi hai.');
  };

  const handleRenderVideo = async () => {
    const runId = ++renderRunIdRef.current;
    stopAudioPreview();
    setIsRendering(true);
    setRenderElapsedSec(0);
    setRenderError('');
    setRenderResult(null);

    const startedMs = Date.now();
    const timerInterval = window.setInterval(() => {
      if (!mountedRef.current || renderRunIdRef.current !== runId) return;
      setRenderElapsedSec(Math.max(1, Math.round((Date.now() - startedMs) / 1000)));
    }, 1000);

    try {
      const res = await fetch('/api/wcg/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: activeCustomTemplate ? activeCustomTemplate.id : selectedTemplate.id,
          partCount,
          durationSeconds,
          quality,
          musicId,
          musicVolume,
          card,
          styling,
        }),
      });
      const json = await res.json();
      if (!mountedRef.current || renderRunIdRef.current !== runId) return;

      if (!res.ok || !json?.ok) {
        setRenderError(json?.error || 'Video render complete nahi ho saka.');
        return;
      }

      if (json.status === 'completed' || json.videoUrl) {
        setRenderResult(json);
        return;
      }

      if (json.status === 'rendering' && json.jobId) {
        const jobId = String(json.jobId);
        const maxWaitMs = 310_000;
        while (mountedRef.current && renderRunIdRef.current === runId) {
          if (Date.now() - startedMs > maxWaitMs) {
            setRenderError('Server render limit exceeded. Quality selector ko 720x1280 Fast HD par switch karke dobara render karein.');
            return;
          }
          await new Promise((r) => setTimeout(r, 1500));
          if (!mountedRef.current || renderRunIdRef.current !== runId) return;

          const pollRes = await fetch(`/api/wcg/jobs/${encodeURIComponent(jobId)}`);
          const pollJson = await pollRes.json();
          if (!mountedRef.current || renderRunIdRef.current !== runId) return;

          if (typeof pollJson?.elapsedSec === 'number') {
            setRenderElapsedSec(pollJson.elapsedSec);
          }

          if (pollJson?.status === 'completed' && pollJson.videoUrl) {
            setRenderResult(pollJson);
            return;
          }
          if (!pollRes.ok || pollJson?.status === 'failed') {
            setRenderError(pollJson?.error || 'Video render complete nahi ho saka.');
            return;
          }
        }
        return;
      }

      setRenderError('Unexpected render response received from server.');
    } catch (err: any) {
      if (mountedRef.current && renderRunIdRef.current === runId) {
        setRenderError(err?.message || 'Render API connection fail ho gaya.');
      }
    } finally {
      window.clearInterval(timerInterval);
      if (mountedRef.current && renderRunIdRef.current === runId) {
        setIsRendering(false);
      }
    }
  };

  const copyCommand = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {}
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl bg-[#0b1120] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>WCG — Wedding Card Generator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              9:16 Vertical MP4 · 1 / 2 / 3-Part Multi-Function Typewriter Engine · Adaptive Trend Verifier
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveView('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap ${
                activeView === 'studio'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Studio & Preview
            </button>
            <button
              onClick={() => setActiveView('deploy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeView === 'deploy'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Python & Assets</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close WCG Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 custom-modal-scroll">
          {activeView === 'deploy' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Multi-Part Template Assets Folder</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Uploaded Pakistani Mehndi templates (`s1.jpeg` aur `s2.jpeg`) both React frontend aur Python OnRender backend (`backend_wcg/assets/`) mein sync hain.
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed">
{`backend_wcg/
├── main.py              # FastAPI (/render, /download/{filename}, /health)
├── renderer.py          # MoviePy + Pillow 1080x1920 typewriter engine
├── requirements.txt     # fastapi, moviepy, pillow, numpy, imageio-ffmpeg
├── README.md            # OnRender Python setup guide
└── assets/
    ├── s1.jpeg          # Part 1: Hosts, Families & Special Guests
    └── s2.jpeg          # Part 2: Event Title, Programme & Venue`}
                </pre>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="border border-slate-800 rounded-xl p-2 bg-slate-950/60">
                    <div className="text-xs font-medium text-slate-300 mb-1.5">Part 1 · s1.jpeg</div>
                    <img
                      src="/assets/aistudio/s1_0b0de8d4.jpeg"
                      alt="Part 1 Template"
                      className="w-full h-36 object-cover rounded-lg border border-slate-800"
                    />
                  </div>
                  <div className="border border-slate-800 rounded-xl p-2 bg-slate-950/60">
                    <div className="text-xs font-medium text-slate-300 mb-1.5">Part 2 · s2.jpeg</div>
                    <img
                      src="/assets/aistudio/s2_610b836e.jpeg"
                      alt="Part 2 Template"
                      className="w-full h-36 object-cover rounded-lg border border-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>OnRender Python Service & Requirements</span>
                </h3>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-300">requirements.txt</span>
                    <button
                      onClick={() =>
                        copyCommand(
                          'req',
                          'fastapi>=0.115.0\nuvicorn[standard]>=0.30.0\nmoviepy>=1.0.3,<2.0.0\npillow>=10.4.0\nnumpy>=1.26.0\npydantic>=2.7.0\npython-multipart>=0.0.9\nimageio>=2.34.0\nimageio-ffmpeg>=0.5.1'
                        )
                      }
                      className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'req' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'req' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto">
{`fastapi>=0.115.0
uvicorn[standard]>=0.30.0
moviepy>=1.0.3,<2.0.0
pillow>=10.4.0
numpy>=1.26.0
pydantic>=2.7.0
python-multipart>=0.0.9
imageio>=2.34.0
imageio-ffmpeg>=0.5.1`}
                  </pre>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="font-semibold text-amber-300">OnRender Build & Start Commands</div>
                    <div className="font-mono text-slate-200">Root Directory: backend_wcg</div>
                    <div className="font-mono text-slate-200">Build: pip install -r requirements.txt</div>
                    <div className="font-mono text-slate-200">Start: uvicorn main:app --host 0.0.0.0 --port $PORT</div>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Node app ke `.env` mein <span className="font-mono text-cyan-300">WCG_PYTHON_URL</span> set karne par Express automatically MoviePy backend ko route karta hai; warna built-in FFmpeg + LibASS 9:16 engine seedha preview mein real MP4 render karta hai.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: AI Trends + 12 Templates + Dynamic Fields */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Adaptive AI Trend Verifier */}
                <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-cyan-400" />
                      <span>Adaptive AI & Online Trend Verifier</span>
                    </h3>
                    <span className="text-xs text-slate-400">Live Google Grounding</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={trendQuery}
                      onChange={(e) => setTrendQuery(e.target.value)}
                      placeholder="e.g. Pakistani Mehndi floral & Mughal foil trends 2026"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleVerifyTrends}
                      disabled={isCheckingTrends}
                      className="px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {isCheckingTrends ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isCheckingTrends ? 'Searching Trends...' : 'Verify Trends Online'}</span>
                    </button>
                  </div>

                  {trendResult && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                      <p className="text-slate-200 leading-relaxed">{trendResult.trendSummaryRomanUrdu}</p>
                      {trendResult.designHighlights.length > 0 && (
                        <ul className="space-y-1 text-slate-400">
                          {trendResult.designHighlights.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {trendResult.sources.length > 0 && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {trendResult.sources.slice(0, 3).map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-xs text-emerald-400">{trendsAppliedMsg}</span>
                        <button
                          onClick={handleApplyTrendStyling}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                        >
                          Apply Adaptive Styling
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. Multi-Part (1-Part, 2-Part, 3-Part) Template Gallery */}
                <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Wedding Card Templates ({WCG_TEMPLATES.length} Suites · 1 / 2 / 3 Parts)
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {EVENT_FILTERS.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                            categoryFilter === cat
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3-Category Part Structure Filter */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {PART_FILTERS.map((pf) => (
                      <button
                        key={pf.value}
                        type="button"
                        onClick={() => setPartFilter(pf.value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          partFilter === pf.value
                            ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{pf.label}</div>
                        <div className="text-[10px] opacity-80 truncate">{pf.hint}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1 custom-modal-scroll">
                    {filteredTemplates.map((tpl) => {
                      const active = !activeCustomTemplate && selectedTemplate.id === tpl.id;
                      const partLabel =
                        tpl.partCount === 1
                          ? '1-Part · All-in-One'
                          : tpl.partCount === 3
                            ? '3-Part · Mehndi/Barat/Walima'
                            : '2-Part Suite';
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-3 ${
                            active
                              ? 'bg-cyan-950/40 border-cyan-500/60'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {tpl.part1Image && tpl.part2Image ? (
                            <div className="flex items-center -space-x-2 shrink-0">
                              <img
                                src={tpl.part1Image}
                                alt="s1"
                                className="w-8 h-12 object-cover rounded border border-amber-400/50"
                              />
                              <img
                                src={tpl.part2Image}
                                alt="s2"
                                className="w-8 h-12 object-cover rounded border border-amber-400/50"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-14 h-12 rounded border shrink-0 flex flex-col items-center justify-center text-[10px] font-serif leading-tight"
                              style={{
                                background: `linear-gradient(135deg, ${tpl.styling.primaryColor}, ${tpl.styling.secondaryColor})`,
                                borderColor: tpl.styling.accentColor,
                                color: tpl.styling.accentColor,
                              }}
                            >
                              <span className="text-xs font-bold">{tpl.partCount}P</span>
                              <span>{tpl.category.slice(0, 4)}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">{tpl.name}</div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tpl.category} · {partLabel}
                            </div>
                          </div>
                          {active && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2B. Permanent Custom Template & 30-Sec Song Library Manager */}
                <WCGUploadManager
                  customTemplates={customTemplates}
                  customSongs={customSongs}
                  activeCustomTemplateId={activeCustomTemplate?.id || null}
                  selectedMusicId={musicId}
                  previewingMusicId={previewingMusicId}
                  onSelectCustomTemplate={handleSelectCustomTemplate}
                  onSelectBuiltinMultipart={() => handleSelectTemplate(WCG_TEMPLATES[0])}
                  onUploadedTemplate={(tpl) => {
                    setCustomTemplates((prev) => [tpl, ...prev]);
                    handleSelectCustomTemplate(tpl);
                  }}
                  onDeletedTemplate={(id) => {
                    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
                    if (activeCustomTemplate?.id === id) {
                      handleSelectTemplate(WCG_TEMPLATES[0]);
                    }
                  }}
                  onSelectSong={(id) => setMusicId(id)}
                  onUploadedSong={(song) => {
                    setCustomSongs((prev) => [song, ...prev]);
                    setMusicId(song.id);
                  }}
                  onDeletedSong={(id) => {
                    setCustomSongs((prev) => prev.filter((s) => s.id !== id));
                    if (musicId === id) {
                      stopAudioPreview();
                      setMusicId('mehndi-laga-ke-rakhna');
                    }
                  }}
                  onTogglePreviewMusic={handleToggleMusicPreview}
                />

                {/* 3. Dynamic Event & Family Details (Adapts to 1-Part, 2-Part, or 3-Part Mode) */}
                <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {partCount === 1
                        ? 'All-in-One Single Card Inputs (Complete Details)'
                        : partCount === 3
                          ? '3-Function Invitation Inputs (Mehndi · Barat · Walima)'
                          : '2-Part Invitation Inputs (Part 1 Hosts · Part 2 Event & Venue)'}
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      {([1, 2, 3] as WcgPartCount[]).map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setPartCount(cnt);
                            setCurrentTime(0);
                            setIsPlaying(true);
                          }}
                          className={`px-2 py-1 rounded font-medium cursor-pointer ${
                            partCount === cnt
                              ? 'bg-amber-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {cnt}-Part
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Host Family 1</label>
                      <input
                        value={card.hostLine1}
                        onChange={(e) => setCard({ ...card, hostLine1: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Host Family 2</label>
                      <input
                        value={card.hostLine2}
                        onChange={(e) => setCard({ ...card, hostLine2: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Groom Name</label>
                      <input
                        value={card.groomName}
                        onChange={(e) => setCard({ ...card, groomName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Bride Name</label>
                      <input
                        value={card.brideName}
                        onChange={(e) => setCard({ ...card, brideName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>

                  {partCount === 3 ? (
                    <div className="space-y-3 pt-1 text-xs">
                      {/* Function 1: Mehndi */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                        <div className="font-semibold text-emerald-300">Part 1 · Function 1 (e.g. Mehndi)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={card.func1Title}
                            onChange={(e) => setCard({ ...card, func1Title: e.target.value })}
                            placeholder="Mehndi"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func1Subtitle}
                            onChange={(e) => setCard({ ...card, func1Subtitle: e.target.value })}
                            placeholder='"Rasm-e-Hina" & Dholki'
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func1Date}
                            onChange={(e) => setCard({ ...card, func1Date: e.target.value })}
                            placeholder="Date"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func1Timing}
                            onChange={(e) => setCard({ ...card, func1Timing: e.target.value })}
                            placeholder="Timing"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func1Venue}
                            onChange={(e) => setCard({ ...card, func1Venue: e.target.value })}
                            placeholder="Venue"
                            className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Function 2: Barat */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
                        <div className="font-semibold text-amber-300">Part 2 · Function 2 (e.g. Barat)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={card.func2Title}
                            onChange={(e) => setCard({ ...card, func2Title: e.target.value })}
                            placeholder="Barat"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func2Subtitle}
                            onChange={(e) => setCard({ ...card, func2Subtitle: e.target.value })}
                            placeholder="Istiqbal-e-Barat & Rukhsati"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func2Date}
                            onChange={(e) => setCard({ ...card, func2Date: e.target.value })}
                            placeholder="Date"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func2Timing}
                            onChange={(e) => setCard({ ...card, func2Timing: e.target.value })}
                            placeholder="Timing"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func2Venue}
                            onChange={(e) => setCard({ ...card, func2Venue: e.target.value })}
                            placeholder="Venue"
                            className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Function 3: Walima */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-2">
                        <div className="font-semibold text-cyan-300">Part 3 · Function 3 (e.g. Walima)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={card.func3Title}
                            onChange={(e) => setCard({ ...card, func3Title: e.target.value })}
                            placeholder="Walima"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func3Subtitle}
                            onChange={(e) => setCard({ ...card, func3Subtitle: e.target.value })}
                            placeholder="Sunnat-e-Walima Reception"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func3Date}
                            onChange={(e) => setCard({ ...card, func3Date: e.target.value })}
                            placeholder="Date"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func3Timing}
                            onChange={(e) => setCard({ ...card, func3Timing: e.target.value })}
                            placeholder="Timing"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                          <input
                            value={card.func3Venue}
                            onChange={(e) => setCard({ ...card, func3Venue: e.target.value })}
                            placeholder="Venue"
                            className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {partCount === 2 && (
                        <>
                          <div>
                            <label className="block text-slate-400 mb-1">Relation Line 1</label>
                            <input
                              value={card.relationLine1}
                              onChange={(e) => setCard({ ...card, relationLine1: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Relation Line 2</label>
                            <input
                              value={card.relationLine2}
                              onChange={(e) => setCard({ ...card, relationLine2: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Special Box Title</label>
                            <input
                              value={card.specialTitle}
                              onChange={(e) => setCard({ ...card, specialTitle: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Special Guests Names</label>
                            <input
                              value={card.specialNames}
                              onChange={(e) => setCard({ ...card, specialNames: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-slate-400 mb-1">Event Title</label>
                        <input
                          value={card.eventTitle}
                          onChange={(e) => setCard({ ...card, eventTitle: e.target.value })}
                          placeholder="Mehndi, Barat, Walima"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Event Subtitle</label>
                        <input
                          value={card.eventSubtitle}
                          onChange={(e) => setCard({ ...card, eventSubtitle: e.target.value })}
                          placeholder='"Rasm-e-Hina"'
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Wedding Date</label>
                        <input
                          value={card.weddingDate}
                          onChange={(e) => setCard({ ...card, weddingDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Venue Title</label>
                        <input
                          value={card.venueName}
                          onChange={(e) => setCard({ ...card, venueName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Programme Timing 1</label>
                        <input
                          value={card.timing1}
                          onChange={(e) => setCard({ ...card, timing1: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Programme Timing 2</label>
                        <input
                          value={card.timing2}
                          onChange={(e) => setCard({ ...card, timing2: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1">Venue Full Address</label>
                        <input
                          value={card.venueAddress}
                          onChange={(e) => setCard({ ...card, venueAddress: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 4. Styling & Video Motion */}
                <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Typography, Colors & Transition Timing</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Primary Color</label>
                      <input
                        type="color"
                        value={styling.primaryColor}
                        onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })}
                        className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 p-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Gold / Accent</label>
                      <input
                        type="color"
                        value={styling.accentColor}
                        onChange={(e) => setStyling({ ...styling, accentColor: e.target.value })}
                        className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 p-1 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-400 mb-1">Transition</label>
                      <select
                        value={styling.transitionStyle}
                        onChange={(e) => setStyling({ ...styling, transitionStyle: e.target.value as any })}
                        className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-100"
                      >
                        <optgroup label="Basic & Smooth">
                          <option value="crossfade">Crossfade (Smooth Fade)</option>
                          <option value="dissolve">Dissolve</option>
                          <option value="fade_black">Fade to Black</option>
                        </optgroup>
                        <optgroup label="Camera & Motion">
                          <option value="slideup">Slide Up</option>
                          <option value="slidedown">Slide Down</option>
                          <option value="slideleft">Slide Left</option>
                          <option value="slideright">Slide Right</option>
                          <option value="zoomin">Zoom In (CapCut Style)</option>
                          <option value="zoomout">Zoom Out</option>
                          <option value="spin">Spin / Rotate</option>
                        </optgroup>
                        <optgroup label="Wipes & Directional">
                          <option value="wipeup">Wipe Up</option>
                          <option value="wipedown">Wipe Down</option>
                          <option value="wipeleft">Wipe Left</option>
                          <option value="wiperight">Wipe Right</option>
                        </optgroup>
                        <optgroup label="Effects & Glitch">
                          <option value="glitch">Glitch Effect</option>
                          <option value="blur">Motion Blur</option>
                          <option value="lightleak">Light Leak</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-slate-400 mb-1">Display Font Style (Live Preview)</label>
                      <div
                        className="mb-2 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center overflow-hidden"
                        style={{ fontFamily: styling.displayFont || 'Cormorant Garamond' }}
                      >
                        <span className="text-xs text-slate-400 block mb-1">Preview:</span>
                        <span className="text-xl text-amber-300 tracking-wide">
                          Save the Wedding Date
                        </span>
                      </div>
                      <select
                        value={styling.displayFont}
                        onChange={(e) => setStyling({ ...styling, displayFont: e.target.value as any })}
                        className="w-full h-10 bg-slate-950 border border-slate-800 rounded-lg px-3 text-slate-100 focus:border-amber-500 focus:outline-none transition-all"
                      >
                        <optgroup label="Elegant & Luxury Serif">
                          <option value="Cormorant Garamond" style={{ fontFamily: 'Cormorant Garamond' }}>Cormorant Garamond</option>
                          <option value="Cinzel" style={{ fontFamily: 'Cinzel' }}>Cinzel (Classic Royal)</option>
                          <option value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                          <option value="Great Vibes" style={{ fontFamily: 'Great Vibes' }}>Great Vibes (Script)</option>
                          <option value="Alex Brush" style={{ fontFamily: 'Alex Brush' }}>Alex Brush (Smooth Script)</option>
                          <option value="Pinyon Script" style={{ fontFamily: 'Pinyon Script' }}>Pinyon Script (Cursive)</option>
                        </optgroup>
                        <optgroup label="Traditional & Calligraphy">
                          <option value="Amiri" style={{ fontFamily: 'Amiri' }}>Amiri (Arabic Classic)</option>
                          <option value="Scheherazade New" style={{ fontFamily: 'Scheherazade New' }}>Scheherazade (Traditional)</option>
                          <option value="Reem Kufi" style={{ fontFamily: 'Reem Kufi' }}>Reem Kufi (Modern Arabic)</option>
                          <option value="Noto Nastaliq Urdu" style={{ fontFamily: 'Noto Nastaliq Urdu' }}>Noto Nastaliq Urdu</option>
                        </optgroup>
                        <optgroup label="Modern & Minimal">
                          <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                          <option value="Poppins" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                          <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
                          <option value="Lora" style={{ fontFamily: 'Lora' }}>Lora Serif</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={styling.cleanSampleText}
                          onChange={(e) => setStyling({ ...styling, cleanSampleText: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-950"
                        />
                        <span>Hide pre-existing text & calligraphy (Adaptive Patch)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Duration:</span>
                        {[18, 19, 20].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setDurationSeconds(sec)}
                            className={`px-2.5 py-1 rounded-lg border tabular-nums cursor-pointer ${
                              durationSeconds === sec
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-semibold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Adaptive Card Patch & AI Safe-Zone Panel */}
                    <div className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">Patch Fit Mode:</span>
                          <select
                            value={styling.patchMode || 'seamless'}
                            onChange={(e) => setStyling({ ...styling, patchMode: e.target.value as WcgPatchBlendMode })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                          >
                            <option value="seamless">Seamless Background Match</option>
                            <option value="plaque">Fitted Plaque + Gold Border</option>
                            <option value="direct">Direct Text Only</option>
                          </select>
                        </div>

                        {(activeCustomTemplate || selectedTemplate.id === 'pakistani-emerald-mehndi-multipart') && (
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showSafeGuide}
                                onChange={(e) => setShowSafeGuide(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-950"
                              />
                              <span>Safe Guide</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAnalyzeActiveCard}
                              disabled={isAnalyzingCard}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isAnalyzingCard ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              <span>{isAnalyzingCard ? 'Analyzing...' : 'AI Analyze Region'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {analyzeStatusMsg && (
                        <div className="text-[11px] text-emerald-300 leading-relaxed">
                          {analyzeStatusMsg}
                        </div>
                      )}
                      {analyzeErrorMsg && (
                        <div className="text-[11px] text-rose-300 leading-relaxed">
                          {analyzeErrorMsg}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 5. Bollywood & Pakistani Shaadi Background Music Library (12 Presets) */}
                <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-amber-400" />
                      <span>Shaadi & Bollywood Music Presets (12 Tracks)</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => {
                          stopAudioPreview();
                          setMusicId('none');
                        }}
                        className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer ${
                          musicId === 'none'
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>No Music</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2">
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300 shrink-0">Music Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                    <span className="font-mono text-cyan-300 w-9 text-right tabular-nums">
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-modal-scroll">
                    {WCG_MUSIC_PRESETS.map((preset) => {
                      const active = musicId === preset.id;
                      const previewing = previewingMusicId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setMusicId(preset.id)}
                          className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-amber-500/15 border-amber-500/60'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">{preset.title}</div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {preset.category} · {preset.vibe} · {preset.bpm} BPM
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMusicPreview(preset.id);
                            }}
                            className={`px-2 py-1.5 rounded-lg border text-xs flex items-center gap-1 shrink-0 cursor-pointer ${
                              previewing
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                            title={previewing ? 'Stop Preview' : 'Preview Track'}
                          >
                            {previewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{previewing ? 'Stop' : 'Listen'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right Column: Live 9:16 Multi-Part Video Canvas & HD MP4 Render Export */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold text-white">
                      Live 9:16 ·{' '}
                      {partCount === 1
                        ? '1-Part All-in-One Card'
                        : partCount === 3
                          ? currentTime < durationSeconds / 3
                            ? `Part 1 (${card.func1Title || 'Mehndi'})`
                            : currentTime < (durationSeconds * 2) / 3
                              ? `Part 2 (${card.func2Title || 'Barat'})`
                              : `Part 3 (${card.func3Title || 'Walima'})`
                          : currentTime < durationSeconds / 2
                            ? 'Part 1 (Hosts)'
                            : 'Part 2 (Event)'}
                    </span>
                    <span className="font-mono text-amber-300 tabular-nums">
                      {currentTime.toFixed(1)}s / {durationSeconds.toFixed(1)}s
                    </span>
                  </div>

                  <div className="w-[260px] sm:w-[290px] aspect-[9/16] rounded-xl overflow-hidden border border-slate-700 bg-black shadow-xl">
                    <canvas
                      ref={canvasRef}
                      width={720}
                      height={1280}
                      className="w-full h-full block"
                    />
                  </div>

                  {/* Playback Controls */}
                  <div className="w-full mt-3 space-y-2.5">
                    <input
                      type="range"
                      min={0}
                      max={durationSeconds}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setCurrentTime(parseFloat(e.target.value));
                      }}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? 'Pause' : 'Play'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTime(0);
                            setIsPlaying(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                          title="Restart"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {partCount === 1 ? (
                          <button
                            onClick={() => {
                              setCurrentTime(0.3);
                              setIsPlaying(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          >
                            Full Card
                          </button>
                        ) : partCount === 2 ? (
                          <>
                            <button
                              onClick={() => {
                                setCurrentTime(0.4);
                                setIsPlaying(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              Part 1
                            </button>
                            <button
                              onClick={() => {
                                setCurrentTime(durationSeconds / 2 + 0.5);
                                setIsPlaying(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              Part 2
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setCurrentTime(0.3);
                                setIsPlaying(true);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              1. {card.func1Title || 'Mehndi'}
                            </button>
                            <button
                              onClick={() => {
                                setCurrentTime(durationSeconds / 3 + 0.5);
                                setIsPlaying(true);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              2. {card.func2Title || 'Barat'}
                            </button>
                            <button
                              onClick={() => {
                                setCurrentTime((durationSeconds * 2) / 3 + 0.5);
                                setIsPlaying(true);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              3. {card.func3Title || 'Walima'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quality Selector & MP4 Render Button */}
                  <div className="w-full mt-4 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setQuality('1080p')}
                        disabled={isRendering}
                        className={`py-1.5 px-2.5 rounded-lg border font-medium cursor-pointer ${
                          quality === '1080p'
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        1080x1920 Full HD
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuality('720p')}
                        disabled={isRendering}
                        className={`py-1.5 px-2.5 rounded-lg border font-medium cursor-pointer ${
                          quality === '720p'
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        720x1280 Fast HD
                      </button>
                    </div>

                    <button
                      onClick={handleRenderVideo}
                      disabled={isRendering}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isRendering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            Rendering {quality === '1080p' ? '1080p Full HD' : '720p HD'} {durationSeconds}s MP4{renderElapsedSec > 0 ? ` (${renderElapsedSec}s)` : '...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Film className="w-4 h-4" />
                          <span>Render {quality === '1080p' ? 'Full HD' : 'HD'} 9:16 Video ({durationSeconds}s MP4)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {renderError && (
                    <div className="w-full mt-3 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
                      {renderError}
                    </div>
                  )}

                  {renderResult && (
                    <div className="w-full mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-emerald-300">
                        <span className="font-semibold">Video Ready ({renderResult.resolution})</span>
                        <span className="font-mono tabular-nums">{renderResult.durationSeconds}s · {renderResult.engine}</span>
                      </div>
                      <video
                        src={renderResult.videoUrl}
                        controls
                        className="w-full max-h-56 rounded-lg bg-black border border-slate-800"
                      />
                      <a
                        href={renderResult.downloadUrl}
                        download={renderResult.filename}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Video ({renderResult.filename})</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
