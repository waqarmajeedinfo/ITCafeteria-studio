import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  Clapperboard,
  Copy,
  Download,
  FileCode2,
  Film,
  FolderOpen,
  Layers,
  Loader2,
  Mic,
  Palette,
  Play,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_UGC_SETTINGS,
  UGC_AD_FORMATS,
  type UgcAdFormat,
  type UgcAspectRatio,
  type UgcCampaignGoal,
  type UgcCampaignSettings,
  type UgcCaptionMode,
  type UgcLanguage,
  type UgcModelAnalysis,
  type UgcProductAnalysis,
  type UgcSavedCampaign,
  type UgcScenePlan,
  type UgcSceneVisualFocus,
  type UgcStoryboardResult,
} from '../lib/ugcTypes';

interface UgcDashboardProps {
  onClose: () => void;
}

interface UgcRenderResult {
  ok: boolean;
  engine: string;
  filename: string;
  videoUrl: string;
  downloadUrl: string;
  durationSec: number;
  hasVoiceover: boolean;
  voiceoverScenesRendered: number;
  voiceoverWarning?: string;
}

type OutputTab = 'scenes' | 'json' | 'campaigns';

async function fileToResizedDataUrl(file: File, maxDim = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image file read nahi ho saki.'));
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawUrl);
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h || (w <= maxDim && h <= maxDim)) {
          resolve(rawUrl);
          return;
        }
        const scale = Math.min(maxDim / w, maxDim / h);
        const tw = Math.max(2, Math.round(w * scale));
        const th = Math.max(2, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, tw, th);
        const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outMime, 0.92));
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

function rebuildFormattedScenePrompt(scene: UgcScenePlan): string {
  const promptBody = `[Cinematic Movement: ${scene.cameraMovement}] [Voiceover: "${scene.voiceoverLine || 'None / Pure sound design'}"] [Character Actions: ${scene.characterAction}] [Product Interaction: ${scene.productInteraction}] [Camera Style: ${scene.cameraMovement}] [Lighting: ${scene.lightingStyle}] [Negative Constraints: ${scene.negativeConstraints}]`;
  return `**SCENE ${scene.sceneNumber} (${scene.durationSec.toFixed(1)}s | ${scene.timeRange})**\nGoogle Omni / Veo 3 Prompt: ${promptBody}`;
}

export const UgcDashboard: React.FC<UgcDashboardProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<UgcCampaignSettings>(() => ({ ...DEFAULT_UGC_SETTINGS }));
  const [productImageDataUrl, setProductImageDataUrl] = useState<string>('');
  const [secondaryImageDataUrl, setSecondaryImageDataUrl] = useState<string>('');
  const [modelImageDataUrl, setModelImageDataUrl] = useState<string>('');

  const [productAnalysis, setProductAnalysis] = useState<UgcProductAnalysis | null>(null);
  const [modelAnalysis, setModelAnalysis] = useState<UgcModelAnalysis | null>(null);
  const [storyboard, setStoryboard] = useState<UgcStoryboardResult | null>(null);
  const [renderResult, setRenderResult] = useState<UgcRenderResult | null>(null);

  const [savedCampaigns, setSavedCampaigns] = useState<UgcSavedCampaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [clientNameInput, setClientNameInput] = useState<string>('');

  const [outputTab, setOutputTab] = useState<OutputTab>('scenes');
  const [busyStep, setBusyStep] = useState<
    null | 'product' | 'model' | 'avatar_gen' | 'storyboard' | 'render' | 'pipeline' | 'save'
  >(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const productFileRef = useRef<HTMLInputElement>(null);
  const secondaryFileRef = useRef<HTMLInputElement>(null);
  const modelFileRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<number | null>(null);

  const loadCampaigns = async () => {
    try {
      const resp = await fetch('/api/ugc/campaigns');
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data?.campaigns)) {
          setSavedCampaigns(data.campaigns);
        }
      }
    } catch {
      // ignore initial fetch error
    }
  };

  useEffect(() => {
    loadCampaigns();
    return () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const updateSetting = <K extends keyof UgcCampaignSettings>(key: K, val: UgcCampaignSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isSecondary = false) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMessage('');
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400);
      if (isSecondary) {
        setSecondaryImageDataUrl(dataUrl);
      } else {
        setProductImageDataUrl(dataUrl);
        setProductAnalysis(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Product image upload failed.');
    }
  };

  const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMessage('');
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400);
      setModelImageDataUrl(dataUrl);
      setModelAnalysis(null);
      updateSetting('modelMode', 'upload');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Model image upload failed.');
    }
  };

  // Stage 1: Product Reality Lock
  const runProductAnalysis = async (imgOverride?: string): Promise<UgcProductAnalysis | null> => {
    const targetImg = imgOverride || productImageDataUrl;
    if (!targetImg) {
      setErrorMessage('Stage 1 ke liye pehle Product Image upload karein.');
      return null;
    }
    setErrorMessage('');
    setStatusMessage('Stage 1: Product category, material, branding & hex palette lock ho raha hai...');
    try {
      const resp = await fetch('/api/ugc/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageDataUrl: targetImg,
          secondaryImageDataUrl,
          brandHint: settings.brandName,
          productDetails: settings.productDetails,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok || !data.analysis) {
        throw new Error(data?.error || 'Product Vision Analysis fail ho gayi.');
      }
      const analysis = data.analysis as UgcProductAnalysis;
      setProductAnalysis(analysis);
      setSettings((prev) => ({
        ...prev,
        brandName: prev.brandName || analysis.brandName || '',
        productDetails: prev.productDetails || analysis.productName || '',
      }));
      setStatusMessage('Stage 1 Complete: Product Reality Lock activate ho gaya.');
      return analysis;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Product analyze karte waqt error aaya.');
      return null;
    }
  };

  // Stage 2: Model / Avatar Identity Lock
  const runModelAnalysis = async (imgOverride?: string): Promise<UgcModelAnalysis | null> => {
    const targetImg = imgOverride || modelImageDataUrl;
    if (!targetImg) {
      setErrorMessage('Stage 2 ke liye pehle Model / Avatar image upload ya generate karein.');
      return null;
    }
    setErrorMessage('');
    setStatusMessage('Stage 2: Skin realism, fabric physics & Face Identity Lock analyze ho raha hai...');
    try {
      const resp = await fetch('/api/ugc/analyze-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImageDataUrl: targetImg,
          productCategory: productAnalysis?.category || settings.productDetails,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok || !data.analysis) {
        throw new Error(data?.error || 'Model Vision Analysis fail ho gayi.');
      }
      const analysis = data.analysis as UgcModelAnalysis;
      setModelAnalysis(analysis);
      setStatusMessage('Stage 2 Complete: Model Face Identity Lock tayar hai.');
      return analysis;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Model analyze karte waqt error aaya.');
      return null;
    }
  };

  // AI Avatar Image Generation (reuses server.ts /api/ai/generate-image)
  const handleGenerateAiAvatar = async () => {
    setErrorMessage('');
    setBusyStep('avatar_gen');
    setStatusMessage('AI Avatar studio portrait generate ho raha hai...');
    try {
      const prompt = `${settings.avatarPromptSpec}. Presenting commercial campaign for ${
        settings.brandName || productAnalysis?.brandName || 'lifestyle brand'
      } (${productAnalysis?.category || settings.productDetails || 'consumer product'}). Ultra-photoreal DSLR portrait, visible natural skin pores, authentic hair strands, natural indoor lighting, no text or watermarks.`;
      const resp = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: settings.aspectRatio,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.imageUrl) {
        throw new Error(data?.error || 'AI Avatar generate nahi ho saka.');
      }
      setModelImageDataUrl(data.imageUrl);
      setModelAnalysis(null);
      setStatusMessage('AI Avatar generated. Ab Face Identity Lock analyze ho raha hai...');
      await runModelAnalysis(data.imageUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'AI Avatar generation failed.');
    } finally {
      setBusyStep(null);
    }
  };

  // Stage 3 & 4: Generate Storyboard + Veo 3 Prompts
  const runStoryboardGeneration = async (
    prodOverride?: UgcProductAnalysis | null,
    modOverride?: UgcModelAnalysis | null
  ): Promise<UgcStoryboardResult | null> => {
    setErrorMessage('');
    setStatusMessage('Stage 3 & 4: Scene-by-scene Veo 3 Prompts & Fast-Assembly JSON generate ho rahe hain...');
    try {
      const resp = await fetch('/api/ugc/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          productAnalysis: prodOverride !== undefined ? prodOverride : productAnalysis,
          modelAnalysis: modOverride !== undefined ? modOverride : modelAnalysis,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok || !data.storyboard) {
        throw new Error(data?.error || 'Storyboard generate nahi ho saka.');
      }
      setStoryboard(data.storyboard as UgcStoryboardResult);
      setOutputTab('scenes');
      setStatusMessage('Stage 4 Complete: Veo 3 Scene Prompts tayar hain. Ab aap Video Render kar sakte hain.');
      return data.storyboard as UgcStoryboardResult;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Storyboard generation fail ho gayi.');
      return null;
    }
  };

  // Render Complete MP4 Video (with async job polling if >8s)
  const pollRenderJob = async (jobId: string): Promise<UgcRenderResult> => {
    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const resp = await fetch(`/api/ugc/jobs/${encodeURIComponent(jobId)}`);
          const data = await resp.json();
          if (data?.status === 'completed' && data.filename) {
            resolve(data as UgcRenderResult);
            return;
          }
          if (data?.status === 'failed' || !resp.ok) {
            reject(new Error(data?.error || 'UGC Video Render fail ho gaya.'));
            return;
          }
          setStatusMessage(`MP4 Commercial Render chal raha hai (${data?.elapsedSec || 0}s)...`);
          pollTimerRef.current = window.setTimeout(tick, 1800);
        } catch (err: any) {
          reject(err);
        }
      };
      pollTimerRef.current = window.setTimeout(tick, 1500);
    });
  };

  const runVideoRender = async (sbOverride?: UgcStoryboardResult | null): Promise<UgcRenderResult | null> => {
    const activeStoryboard = sbOverride || storyboard;
    if (!activeStoryboard || activeStoryboard.scenes.length === 0) {
      setErrorMessage('Video render karne se pehle Storyboard generate karein.');
      return null;
    }
    if (!productImageDataUrl && !modelImageDataUrl) {
      setErrorMessage('Video render karne ke liye kam az kam Product ya Model image upload karein.');
      return null;
    }
    setErrorMessage('');
    setStatusMessage('FFmpeg + Gemini TTS ke sath multi-scene HD MP4 video render ho raha hai...');
    try {
      const resp = await fetch('/api/ugc/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageDataUrl,
          modelImageDataUrl: settings.modelMode === 'product_only' ? '' : modelImageDataUrl,
          settings,
          storyboard: activeStoryboard,
          productAnalysis,
        }),
      });
      const data = await resp.json();
      if (!resp.ok && data?.status !== 'rendering') {
        throw new Error(data?.error || 'MP4 video render fail ho gaya.');
      }

      let finalResult: UgcRenderResult;
      if (data?.status === 'rendering' && data.jobId) {
        finalResult = await pollRenderJob(data.jobId);
      } else {
        finalResult = data as UgcRenderResult;
      }

      setRenderResult(finalResult);
      setStatusMessage(
        `HD MP4 Video Render Complete (${finalResult.durationSec}s · Voiceover Scenes: ${finalResult.voiceoverScenesRendered}).`
      );
      return finalResult;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Video rendering failed.');
      return null;
    }
  };

  // One-Click Run Full 4-Stage Pipeline
  const handleRunFullPipeline = async () => {
    if (!productImageDataUrl && !modelImageDataUrl) {
      setErrorMessage('Kam az kam Stage 1 Product Image upload karein taake pipeline run ho sake.');
      return;
    }
    setBusyStep('pipeline');
    setErrorMessage('');
    try {
      let lockedProd = productAnalysis;
      if (productImageDataUrl && !lockedProd) {
        lockedProd = await runProductAnalysis();
        if (!lockedProd) return;
      }

      let lockedModel = modelAnalysis;
      if (settings.modelMode !== 'product_only' && modelImageDataUrl && !lockedModel) {
        lockedModel = await runModelAnalysis();
      }

      const generatedSb = await runStoryboardGeneration(lockedProd, lockedModel);
      if (!generatedSb) return;

      await runVideoRender(generatedSb);
    } finally {
      setBusyStep(null);
    }
  };

  // Inline Scene Editing Helpers
  const updateSceneField = (
    idx: number,
    field: 'title' | 'voiceoverLine' | 'onScreenHook' | 'visualFocus' | 'cameraMovement',
    value: string
  ) => {
    setStoryboard((prev) => {
      if (!prev) return prev;
      const updatedScenes = prev.scenes.map((sc, sIdx) => {
        if (sIdx !== idx) return sc;
        const nextScene: UgcScenePlan = { ...sc, [field]: value as any };
        nextScene.veo3PromptFormatted = rebuildFormattedScenePrompt(nextScene);
        return nextScene;
      });
      return {
        ...prev,
        scenes: updatedScenes,
        fullFormattedOutput: updatedScenes.map((s) => s.veo3PromptFormatted).join('\n\n'),
      };
    });
  };

  const handleSaveCampaign = async () => {
    setBusyStep('save');
    setErrorMessage('');
    try {
      const resp = await fetch('/api/ugc/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCampaignId || undefined,
          title: storyboard?.campaignTitle || settings.brandName || 'Client UGC Campaign',
          clientName: clientNameInput.trim() || settings.brandName || 'Client Brand',
          settings,
          productAnalysis,
          modelAnalysis,
          storyboard,
          lastVideoUrl: renderResult?.videoUrl,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || 'Campaign save nahi ho saki.');
      }
      setActiveCampaignId(data.campaign.id);
      await loadCampaigns();
      setStatusMessage(`Client Campaign "${data.campaign.title}" server par save ho gayi.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Save campaign error.');
    } finally {
      setBusyStep(null);
    }
  };

  const handleLoadCampaign = (camp: UgcSavedCampaign) => {
    setActiveCampaignId(camp.id);
    setClientNameInput(camp.clientName || '');
    setSettings({ ...DEFAULT_UGC_SETTINGS, ...(camp.settings || {}) });
    setProductAnalysis(camp.productAnalysis || null);
    setModelAnalysis(camp.modelAnalysis || null);
    setStoryboard(camp.storyboard || null);
    setRenderResult(
      camp.lastVideoUrl
        ? {
            ok: true,
            engine: 'saved-render',
            filename: camp.lastVideoUrl.split('/').pop() || 'ugc_video.mp4',
            videoUrl: camp.lastVideoUrl,
            downloadUrl: `${camp.lastVideoUrl}?download=1`,
            durationSec: camp.storyboard?.totalDurationSec || camp.settings.totalDurationSec || 15,
            hasVoiceover: Boolean(camp.settings?.enableVoiceover),
            voiceoverScenesRendered: 0,
          }
        : null
    );
    setOutputTab('scenes');
    setStatusMessage(`Loaded client campaign: ${camp.title}`);
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await fetch(`/api/ugc/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (activeCampaignId === id) setActiveCampaignId(null);
      await loadCampaigns();
    } catch {
      // ignore
    }
  };

  const handleResetWorkspace = () => {
    setActiveCampaignId(null);
    setClientNameInput('');
    setSettings({ ...DEFAULT_UGC_SETTINGS });
    setProductImageDataUrl('');
    setSecondaryImageDataUrl('');
    setModelImageDataUrl('');
    setProductAnalysis(null);
    setModelAnalysis(null);
    setStoryboard(null);
    setRenderResult(null);
    setErrorMessage('');
    setStatusMessage('');
  };

  const downloadTextFile = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedFormatMeta = UGC_AD_FORMATS.find((f) => f.id === settings.adFormat) || UGC_AD_FORMATS[0];
  const isBusy = busyStep !== null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-white text-slate-900 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Top White-Screen Agency Workspace Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 bg-slate-950 text-white flex items-center justify-center shrink-0">
            <Clapperboard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950 truncate">
                UGC Ad Engine
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                White-Label Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden md:block">
              Product Reality Lock · Face Identity Lock · Veo 3 Storyboard Prompts · Multi-Scene MP4 Renderer
            </p>
          </div>
        </div>

        {/* 4-Stage Readiness Strip (Desktop) */}
        <div className="hidden xl:flex items-center gap-4 text-xs font-medium text-slate-500 border border-slate-200 bg-[#F8FAFC] px-3.5 py-1.5">
          <span className={productAnalysis ? 'text-emerald-700 font-semibold' : ''}>
            01 Product {productAnalysis ? '✓' : '·'}
          </span>
          <span className="text-slate-300">/</span>
          <span className={modelAnalysis || settings.modelMode === 'product_only' ? 'text-emerald-700 font-semibold' : ''}>
            02 Model {modelAnalysis ? '✓' : settings.modelMode === 'product_only' ? 'Macro' : '·'}
          </span>
          <span className="text-slate-300">/</span>
          <span className={settings.brandName || settings.productDetails ? 'text-slate-900 font-semibold' : ''}>
            03 Brief ({settings.totalDurationSec}s)
          </span>
          <span className="text-slate-300">/</span>
          <span className={storyboard ? 'text-emerald-700 font-semibold' : ''}>
            04 Veo 3 {storyboard ? `(${storyboard.scenes.length} Scenes)` : '·'}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveCampaign}
            disabled={isBusy}
            className="h-9 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            title="Save campaign brief & prompts to server library"
          >
            {busyStep === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save Campaign</span>
          </button>
          <button
            type="button"
            onClick={handleResetWorkspace}
            disabled={isBusy}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            title="Clear current campaign and start fresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Brief</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Split Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Stages 1, 2, 3 Configuration */}
        <aside className="lg:col-span-5 h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-[#F8FAFC] p-5 space-y-5">
          {/* STAGE 1: Product Reality Lock */}
          <section className="bg-white border border-slate-200 p-4 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                  Stage 01 · Product Reality Lock
                </div>
                <h2 className="text-sm font-bold text-slate-950 mt-0.5">
                  Source-of-Truth Product Analysis
                </h2>
              </div>
              {productAnalysis && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Primary Product Upload */}
              <div>
                <input
                  ref={productFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleProductFileChange(e, false)}
                />
                <button
                  type="button"
                  onClick={() => productFileRef.current?.click()}
                  className="w-full h-32 border border-dashed border-slate-300 hover:border-slate-900 bg-[#F8FAFC] hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer transition-colors overflow-hidden relative"
                >
                  {productImageDataUrl ? (
                    <img
                      src={productImageDataUrl}
                      alt="Primary Product"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-800">Primary Product *</span>
                      <span className="text-[11px] text-slate-500">PNG / JPG / WebP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Angle / Packaging / Logo */}
              <div>
                <input
                  ref={secondaryFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleProductFileChange(e, true)}
                />
                <button
                  type="button"
                  onClick={() => secondaryFileRef.current?.click()}
                  className="w-full h-32 border border-dashed border-slate-300 hover:border-slate-900 bg-[#F8FAFC] hover:bg-slate-50 flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer transition-colors overflow-hidden"
                >
                  {secondaryImageDataUrl ? (
                    <img
                      src={secondaryImageDataUrl}
                      alt="Secondary Label"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">Angle / Brand Label</span>
                      <span className="text-[11px] text-slate-500">Optional Reference</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => updateSetting('brandName', e.target.value)}
                  placeholder="e.g. Aura Botanicals"
                  className="w-full h-9 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Client / Project Name
                </label>
                <input
                  type="text"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="e.g. Q4 TikTok Launch"
                  className="w-full h-9 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                Product Name & Physical Details
              </label>
              <input
                type="text"
                value={settings.productDetails}
                onChange={(e) => updateSetting('productDetails', e.target.value)}
                placeholder="e.g. 50ml Vitamin C Glass Dropper Serum, matte amber glass"
                className="w-full h-9 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                Key Offer / USP
              </label>
              <input
                type="text"
                value={settings.uspOffer}
                onChange={(e) => updateSetting('uspOffer', e.target.value)}
                placeholder="e.g. 7-day visible glow, 25% launch discount + free delivery"
                className="w-full h-9 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="button"
              disabled={isBusy || !productImageDataUrl}
              onClick={async () => {
                setBusyStep('product');
                try {
                  await runProductAnalysis();
                } finally {
                  setBusyStep(null);
                }
              }}
              className="w-full h-9 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {busyStep === 'product' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Analyze & Lock Product Reality (Vision AI)</span>
            </button>

            {productAnalysis && (
              <div className="border border-slate-200 bg-[#F8FAFC] p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">
                    {productAnalysis.productName} ({productAnalysis.category})
                  </span>
                  <div className="flex items-center gap-1" title={productAnalysis.colorNames}>
                    {productAnalysis.colorPalette.map((hex, i) => (
                      <span
                        key={`${hex}_${i}`}
                        className="w-4 h-4 border border-slate-300 inline-block"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-slate-600">
                  <strong className="text-slate-800">Material:</strong> {productAnalysis.material}
                </div>
                <div className="text-slate-600">
                  <strong className="text-slate-800">Locked Branding:</strong> {productAnalysis.brandingAndText}
                </div>
                <div className="text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2 font-medium">
                  {productAnalysis.summaryRomanUrdu}
                </div>
              </div>
            )}
          </section>

          {/* STAGE 2: Model / Avatar Integration */}
          <section className="bg-white border border-slate-200 p-4 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Stage 02 · Model / Avatar Integration
                </div>
                <h2 className="text-sm font-bold text-slate-950 mt-0.5">
                  Creator Identity & Skin / Fabric Lock
                </h2>
              </div>
              {modelAnalysis && settings.modelMode !== 'product_only' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Face Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 border border-slate-200 bg-[#F8FAFC] p-1 gap-1 text-xs font-semibold">
              {[
                { id: 'upload', label: 'Upload Model' },
                { id: 'ai_generate', label: 'AI Avatar' },
                { id: 'product_only', label: 'Product Only' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateSetting('modelMode', m.id as UgcCampaignSettings['modelMode'])}
                  className={`py-1.5 text-center cursor-pointer transition-colors ${
                    settings.modelMode === m.id
                      ? 'bg-white text-slate-950 border border-slate-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {settings.modelMode === 'product_only' ? (
              <div className="border border-slate-200 bg-[#F8FAFC] p-3 text-xs text-slate-600 leading-relaxed">
                <strong>Product-Only Macro Mode:</strong> Koi creator face generate nahi hoga. Video aur prompts
                extreme macro product shots, sole drop / liquid ribbons, aur subtle human hands ya lower-leg wear physics par focus kareinge.
              </div>
            ) : (
              <>
                <input
                  ref={modelFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModelFileChange}
                />

                {settings.modelMode === 'ai_generate' && (
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      AI Avatar Prompt Specification (Skin Pores, Hair, Wardrobe)
                    </label>
                    <textarea
                      rows={3}
                      value={settings.avatarPromptSpec}
                      onChange={(e) => updateSetting('avatarPromptSpec', e.target.value)}
                      className="w-full p-2.5 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleGenerateAiAvatar}
                      className="w-full h-9 border border-slate-900 bg-white hover:bg-slate-950 hover:text-white text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {busyStep === 'avatar_gen' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Generate AI Avatar Image</span>
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => modelFileRef.current?.click()}
                    className="w-28 h-28 shrink-0 border border-dashed border-slate-300 hover:border-slate-900 bg-[#F8FAFC] flex flex-col items-center justify-center gap-1 p-1.5 text-center cursor-pointer overflow-hidden"
                  >
                    {modelImageDataUrl ? (
                      <img
                        src={modelImageDataUrl}
                        alt="Model / Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-slate-500" />
                        <span className="text-[11px] font-semibold text-slate-700">Upload Photo</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Model ki reference photo upload karein taake Vision AI natural skin pores, hair strands, fabric folds aur Face Identity Lock kare.
                    </p>
                    <button
                      type="button"
                      disabled={isBusy || !modelImageDataUrl}
                      onClick={async () => {
                        setBusyStep('model');
                        try {
                          await runModelAnalysis();
                        } finally {
                          setBusyStep(null);
                        }
                      }}
                      className="h-8 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {busyStep === 'model' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Lock Model Face Identity</span>
                    </button>
                  </div>
                </div>

                {modelAnalysis && (
                  <div className="border border-slate-200 bg-[#F8FAFC] p-3 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900">{modelAnalysis.subjectType}</div>
                    <div className="text-slate-600">
                      <strong className="text-slate-800">Skin Realism:</strong> {modelAnalysis.skinToneAndRealism}
                    </div>
                    <div className="text-slate-600">
                      <strong className="text-slate-800">Identity Rule:</strong> {modelAnalysis.faceIdentityLockRule}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* STAGE 3: Campaign Settings & Flexible Duration */}
          <section className="bg-white border border-slate-200 p-4 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Stage 03 · Campaign Settings & Duration
              </div>
              <h2 className="text-sm font-bold text-slate-950 mt-0.5">
                Format Architecture, Voiceover & Timing
              </h2>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                Creative Ad Format (PDF Playbook)
              </label>
              <select
                value={settings.adFormat}
                onChange={(e) => {
                  const fmt = e.target.value as UgcAdFormat;
                  const meta = UGC_AD_FORMATS.find((f) => f.id === fmt);
                  setSettings((prev) => ({
                    ...prev,
                    adFormat: fmt,
                    totalDurationSec: meta ? meta.defaultDuration : prev.totalDurationSec,
                  }));
                }}
                className="w-full h-9 px-2.5 border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {UGC_AD_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                <strong className="text-slate-700">Signature Opening:</strong> {selectedFormatMeta.openingRule}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Campaign Goal
                </label>
                <select
                  value={settings.campaignGoal}
                  onChange={(e) => updateSetting('campaignGoal', e.target.value as UgcCampaignGoal)}
                  className="w-full h-9 px-2.5 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="Conversion & Direct Sales">Conversion & Direct Sales</option>
                  <option value="Product Launch Reveal">Product Launch Reveal</option>
                  <option value="TikTok / Reels Viral Hook">TikTok / Reels Viral Hook</option>
                  <option value="Brand Awareness & Trust">Brand Awareness & Trust</option>
                  <option value="Client Agency Pitch Demo">Client Agency Pitch Demo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Script & Voiceover Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value as UgcLanguage)}
                  className="w-full h-9 px-2.5 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="Roman Urdu (Pakistani Creator)">Roman Urdu (Pakistani Creator)</option>
                  <option value="English (Global Commercial)">English (Global Commercial)</option>
                  <option value="Urdu + English Mix">Urdu + English Mix</option>
                  <option value="Arabic (Gulf Luxury)">Arabic (Gulf Luxury)</option>
                </select>
              </div>
            </div>

            {/* Aspect Ratio & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 border border-slate-300 bg-[#F8FAFC] p-0.5 gap-0.5 text-xs font-semibold">
                  {(['9:16', '16:9', '1:1'] as UgcAspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => updateSetting('aspectRatio', ratio)}
                      className={`py-1.5 font-mono cursor-pointer transition-colors ${
                        settings.aspectRatio === ratio
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  <span>Flexible Duration</span>
                  <span className="font-mono tabular-nums text-slate-950 font-bold">
                    {settings.totalDurationSec}s
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={45}
                  step={1}
                  value={settings.totalDurationSec}
                  onChange={(e) => updateSetting('totalDurationSec', Number(e.target.value))}
                  className="w-full accent-slate-950 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[8, 10, 12, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('totalDurationSec', sec)}
                  className={`px-2.5 py-1 border text-xs font-mono tabular-nums cursor-pointer transition-colors ${
                    settings.totalDurationSec === sec
                      ? 'bg-slate-950 text-white border-slate-950 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Environment / Set
                </label>
                <input
                  type="text"
                  value={settings.desiredEnvironment}
                  onChange={(e) => updateSetting('desiredEnvironment', e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                  Call To Action (CTA)
                </label>
                <input
                  type="text"
                  value={settings.callToAction}
                  onChange={(e) => updateSetting('callToAction', e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Audio & Caption Controls */}
            <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer mb-1.5">
                  <input
                    type="checkbox"
                    checked={settings.enableVoiceover}
                    onChange={(e) => updateSetting('enableVoiceover', e.target.checked)}
                    className="accent-slate-950"
                  />
                  <span>AI Voiceover (TTS)</span>
                </label>
                <select
                  disabled={!settings.enableVoiceover}
                  value={settings.voiceName}
                  onChange={(e) => updateSetting('voiceName', e.target.value as UgcCampaignSettings['voiceName'])}
                  className="w-full h-8 px-2 border border-slate-300 bg-white text-xs text-slate-900 disabled:bg-slate-100"
                >
                  <option value="Kore">Kore (Female UGC)</option>
                  <option value="Zephyr">Zephyr (Crisp Presenter)</option>
                  <option value="Puck">Puck (Energetic Male)</option>
                  <option value="Fenrir">Fenrir (Bold Commercial)</option>
                  <option value="Charon">Charon (Deep Luxury)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1.5">
                  Caption Overlay
                </label>
                <select
                  value={settings.captionMode}
                  onChange={(e) => updateSetting('captionMode', e.target.value as UgcCaptionMode)}
                  className="w-full h-8 px-2 border border-slate-300 bg-white text-xs text-slate-900"
                >
                  <option value="bold_hook">Bold Hook + Subtitles</option>
                  <option value="clean_subtitles">Clean Minimal Subtitles</option>
                  <option value="no_text">Clean Visual (No Text)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1.5">
                  Audio Bed Mood
                </label>
                <select
                  value={settings.audioBedMood}
                  onChange={(e) =>
                    updateSetting('audioBedMood', e.target.value as UgcCampaignSettings['audioBedMood'])
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-white text-xs text-slate-900"
                >
                  <option value="upbeat_ugc">Upbeat UGC Pulse</option>
                  <option value="luxury_minimal">Luxury Minimal</option>
                  <option value="kinetic_bass">Kinetic Bass</option>
                  <option value="none">Voiceover / Silent Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                Negative Constraints Lock
              </label>
              <textarea
                rows={2}
                value={settings.customNegativeConstraints}
                onChange={(e) => updateSetting('customNegativeConstraints', e.target.value)}
                className="w-full p-2 border border-slate-300 bg-white text-xs text-slate-700 font-mono focus:outline-none focus:border-slate-900"
              />
            </div>
          </section>
        </aside>

        {/* RIGHT COLUMN: Pipeline Execution, MP4 Preview, Veo 3 Scene Prompts & JSON */}
        <main className="lg:col-span-7 h-full overflow-y-auto bg-white p-5 sm:p-6 space-y-6">
          {/* Action Toolbar */}
          <div className="border border-slate-200 bg-[#F8FAFC] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Stage 04 · Production Engine
                </div>
                <div className="text-sm font-bold text-slate-950">
                  Generate Google Omni / Veo 3 Prompts & Render HD MP4
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={async () => {
                    setBusyStep('storyboard');
                    try {
                      await runStoryboardGeneration();
                    } finally {
                      setBusyStep(null);
                    }
                  }}
                  className="h-10 px-4 border border-slate-900 bg-white hover:bg-slate-50 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {busyStep === 'storyboard' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>1. Generate Veo 3 Prompts</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy || !storyboard}
                  onClick={async () => {
                    setBusyStep('render');
                    try {
                      await runVideoRender();
                    } finally {
                      setBusyStep(null);
                    }
                  }}
                  className="h-10 px-4 border border-emerald-700 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {busyStep === 'render' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Film className="w-4 h-4" />
                  )}
                  <span>2. Render Full MP4 Ad</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleRunFullPipeline}
                  className="h-10 px-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {busyStep === 'pipeline' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>One-Click Run All</span>
                </button>
              </div>
            </div>

            {statusMessage && !errorMessage && (
              <div className="border-t border-slate-200 pt-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800">
                {isBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 text-red-800 p-3 flex items-start gap-2.5 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Rendered Video Output Card (when available) */}
          {renderResult && (
            <section className="border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                    Rendered Commercial Video · Ready
                  </div>
                  <h3 className="text-sm font-bold text-slate-950">
                    {storyboard?.campaignTitle || settings.brandName || 'UGC Ad Master Cut'}
                  </h3>
                </div>
                <a
                  href={renderResult.downloadUrl}
                  download={renderResult.filename}
                  className="h-9 px-4 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download HD MP4</span>
                </a>
              </div>

              <div className="bg-slate-950 border border-slate-200 flex items-center justify-center p-3">
                <video
                  key={renderResult.videoUrl}
                  src={renderResult.videoUrl}
                  controls
                  playsInline
                  className="max-h-[420px] w-auto max-w-full bg-black"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums pt-1">
                <span>Duration: {renderResult.durationSec}s · Ratio: {settings.aspectRatio}</span>
                <span>
                  Voiceover Clips: {renderResult.voiceoverScenesRendered} · Engine: {renderResult.engine}
                </span>
              </div>
              {renderResult.voiceoverWarning && (
                <div className="border border-amber-200 bg-amber-50 text-amber-800 p-2.5 text-xs">
                  Note: {renderResult.voiceoverWarning}
                </div>
              )}
            </section>
          )}

          {/* Output Tabs Navigation */}
          <div className="border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {[
                { id: 'scenes', label: 'Scene-By-Scene Veo 3 Prompts', icon: <Layers className="w-3.5 h-3.5" /> },
                { id: 'json', label: 'Fast-Assembly JSON', icon: <FileCode2 className="w-3.5 h-3.5" /> },
                {
                  id: 'campaigns',
                  label: `Saved Campaigns (${savedCampaigns.length})`,
                  icon: <FolderOpen className="w-3.5 h-3.5" />,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOutputTab(t.id as OutputTab)}
                  className={`px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px cursor-pointer transition-colors ${
                    outputTab === t.id
                      ? 'border-slate-950 text-slate-950'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {storyboard && outputTab === 'scenes' && (
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => handleCopy('all_prompts', storyboard.fullFormattedOutput)}
                  className="h-7 px-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'all_prompts' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'all_prompts' ? 'Copied All' : 'Copy All Prompts'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      storyboard.fullFormattedOutput,
                      `${(settings.brandName || 'ugc_ad').replace(/\s+/g, '_').toLowerCase()}_veo3_prompts.txt`
                    )
                  }
                  className="h-7 px-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>.TXT</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: Scene-By-Scene Veo 3 Prompts */}
          {outputTab === 'scenes' && (
            <div className="space-y-4">
              {!storyboard ? (
                <div className="border border-slate-200 bg-[#F8FAFC] p-8 text-center space-y-2">
                  <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center mx-auto">
                    <Palette className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Stage 4 Storyboard & Veo 3 Prompts Ready to Generate
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Left panel mein apna Product upload karke Stage 1 lock karein, Model aur Campaign settings select karein, phir upar <strong>1. Generate Veo 3 Prompts</strong> ya <strong>One-Click Run All</strong> par click karein.
                  </p>
                </div>
              ) : (
                <>
                  <div className="border border-slate-200 bg-[#F8FAFC] p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-950">
                        {storyboard.campaignTitle}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-slate-700 font-semibold">
                        {storyboard.scenes.length} Scenes · {storyboard.totalDurationSec}s Total · {storyboard.aspectRatio}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-900">Opening Signature:</strong> {storyboard.openingSignature}
                    </p>
                    {storyboard.strategyNotesRomanUrdu && (
                      <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5">
                        {storyboard.strategyNotesRomanUrdu}
                      </p>
                    )}
                  </div>

                  {storyboard.scenes.map((scene, idx) => (
                    <div key={scene.sceneNumber} className="border border-slate-200 bg-white p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 bg-slate-950 text-white text-xs font-mono font-bold tabular-nums">
                            SCENE {scene.sceneNumber}
                          </span>
                          <input
                            type="text"
                            value={scene.title}
                            onChange={(e) => updateSceneField(idx, 'title', e.target.value)}
                            className="text-sm font-bold text-slate-950 border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none bg-transparent"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono tabular-nums text-slate-500">
                            {scene.durationSec.toFixed(1)}s ({scene.timeRange})
                          </span>
                          <select
                            value={scene.visualFocus}
                            onChange={(e) =>
                              updateSceneField(idx, 'visualFocus', e.target.value as UgcSceneVisualFocus)
                            }
                            className="h-7 px-2 border border-slate-300 bg-[#F8FAFC] text-[11px] font-semibold text-slate-800"
                          >
                            <option value="product_hero">Product Hero</option>
                            <option value="product_macro">Product Macro</option>
                            <option value="model_avatar">Model / Creator</option>
                            <option value="split_model_product">Split Model + Product</option>
                            <option value="reveal_lockup">Brand Lockup</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleCopy(`scene_${scene.sceneNumber}`, scene.veo3PromptFormatted)}
                            className="h-7 px-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `scene_${scene.sceneNumber}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedKey === `scene_${scene.sceneNumber}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            <Mic className="w-3 h-3" />
                            <span>Spoken Voiceover ({settings.language})</span>
                          </label>
                          <textarea
                            rows={2}
                            value={scene.voiceoverLine}
                            onChange={(e) => updateSceneField(idx, 'voiceoverLine', e.target.value)}
                            className="w-full p-2 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                            On-Screen Hook Text (MP4 Caption)
                          </label>
                          <textarea
                            rows={2}
                            value={scene.onScreenHook}
                            onChange={(e) => updateSceneField(idx, 'onScreenHook', e.target.value)}
                            className="w-full p-2 border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-slate-200 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                          Production-Ready Veo 3 / Google Omni Prompt
                        </div>
                        <pre className="whitespace-pre-wrap text-xs text-slate-800 font-mono leading-relaxed">
                          {scene.veo3PromptFormatted}
                        </pre>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB 2: Fast-Assembly Pure JSON */}
          {outputTab === 'json' && (
            <div className="space-y-3">
              {!storyboard?.fastAssemblyJson ? (
                <div className="border border-slate-200 bg-[#F8FAFC] p-8 text-center text-xs text-slate-600">
                  Pehle Stage 4 Storyboard generate karein taake pure Fast-Assembly JSON specification tayar ho sake.
                </div>
              ) : (
                <div className="border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">
                        Veo 3 Fast-Assembly Reveal JSON Specification
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pure JSON structured prompt ready for direct Veo 3 / JSON video pipelines.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy('json_spec', JSON.stringify(storyboard.fastAssemblyJson, null, 2))
                        }
                        className="h-8 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === 'json_spec' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'json_spec' ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadTextFile(
                            JSON.stringify(storyboard.fastAssemblyJson, null, 2),
                            'ugc_fast_assembly_veo3.json',
                            'application/json'
                          )
                        }
                        className="h-8 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.JSON</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 bg-[#F8FAFC] border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto leading-relaxed">
                    {JSON.stringify(storyboard.fastAssemblyJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Client Campaigns */}
          {outputTab === 'campaigns' && (
            <div className="space-y-3">
              {savedCampaigns.length === 0 ? (
                <div className="border border-slate-200 bg-[#F8FAFC] p-8 text-center text-xs text-slate-600">
                  Abhi koi client campaign save nahi hui. Upar <strong>Save Campaign</strong> button se apna brief aur Veo 3 prompts save karein.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {savedCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-950 truncate">{camp.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">
                          Client: {camp.clientName} · {camp.settings?.totalDurationSec || 15}s ·{' '}
                          {camp.settings?.aspectRatio || '9:16'} ·{' '}
                          {new Date(camp.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadCampaign(camp)}
                          className="h-8 px-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Load Brief
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="h-8 w-8 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-700 flex items-center justify-center cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
