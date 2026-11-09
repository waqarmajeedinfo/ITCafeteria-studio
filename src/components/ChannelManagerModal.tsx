import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Tv,
  Edit2,
  Check,
  RotateCcw,
  Undo2,
  Sparkles,
  User,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sliders,
  Cpu
} from 'lucide-react';
import {
  loadAllChannels,
  saveOrUpdateChannel,
  deleteChannel,
  undoLastChannelAction,
  resetChannelsToDefault,
  getEngineConfigForChannel,
  saveEngineConfigForChannel,
  getDefaultEngineConfig,
  type ExtendedChannelProfile,
  type ChannelEngineConfig
} from '../lib/channelStore';
import { CATEGORIES_IT_CAFETERIA } from '../data/channelData';
import { dirtyManager } from '../lib/dirtyStore';
import {
  saveProfileResearchSettings,
  saveProfileCompetitors,
  saveProfileTopicBank,
  saveProfileLibrary,
  type CompetitorItem
} from '../lib/profileStore';

function parseCategoriesInput(input: string): Array<{ id: number; name: string; playlist: string; details?: string; special?: string }> {
  let rawList: string[] = [];
  if (input.includes('\n')) {
    rawList = input
      .split('\n')
      .map((s) => s.trim().replace(/^[\d+.-]+\s*/, ''))
      .filter((s) => s.length > 0);
  } else if (input.includes(';')) {
    rawList = input
      .split(';')
      .map((s) => s.trim().replace(/^[\d+.-]+\s*/, ''))
      .filter((s) => s.length > 0);
  } else {
    // Comma-separated, but strictly preserve commas inside parentheses () or brackets []
    const tokens: string[] = [];
    let current = '';
    let parenDepth = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '(' || char === '[') parenDepth++;
      else if (char === ')' || char === ']') parenDepth = Math.max(0, parenDepth - 1);

      if (char === ',' && parenDepth === 0) {
        if (current.trim()) tokens.push(current.trim().replace(/^[\d+.-]+\s*/, ''));
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) tokens.push(current.trim().replace(/^[\d+.-]+\s*/, ''));
    rawList = tokens;
  }

  return rawList.map((name, i) => {
    // Check if name matches any standard IT Cafeteria category to preserve rich metadata
    const standard = CATEGORIES_IT_CAFETERIA.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() || (c.id === i + 1 && name.startsWith(c.name.slice(0, 15)))
    );
    return {
      id: i + 1,
      name,
      playlist: standard?.playlist || (name.length > 30 ? (name.split('(')[0].trim() || name) : name),
      details: standard?.details,
      special: standard?.special
    };
  });
}

interface ChannelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelsUpdated: (channels: Record<string, ExtendedChannelProfile>) => void;
}

export const ChannelManagerModal: React.FC<ChannelManagerModalProps> = ({
  isOpen,
  onClose,
  onChannelsUpdated
}) => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>({});
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [presenter, setPresenter] = useState('');
  const [niche, setNiche] = useState('');
  const [hasCharacterTag, setHasCharacterTag] = useState(false);
  const [tag, setTag] = useState('');
  const [platform, setPlatform] = useState('Multi-Platform MCN (YouTube Shorts + TikTok + Reels)');
  const [sceneCount, setSceneCount] = useState(10);
  const [categoriesText, setCategoriesText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');

  // Channel-Specific Engine Configuration State
  const [dialectTone, setDialectTone] = useState('formal');
  const [flowPromptFormat, setFlowPromptFormat] = useState('cinematic_3d');
  const [duplicateStrictness, setDuplicateStrictness] = useState('balanced');
  const [autonomousPriority, setAutonomousPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('HIGH');
  const [presenterPersona, setPresenterPersona] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [nicheKeywordsText, setNicheKeywordsText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const autoDraftEngineRules = () => {
    const chName = name.trim() || 'Custom Channel';
    const chPresenter = presenter.trim() || 'Presenter';
    const chNiche = niche.trim() || 'Content';
    const isBeauty =
      chNiche.toLowerCase().includes('beauty') ||
      chNiche.toLowerCase().includes('skin') ||
      chNiche.toLowerCase().includes('groom') ||
      chName.toLowerCase().includes('beauty');

    if (isBeauty) {
      setDialectTone('beauty_friendly');
      setFlowPromptFormat('aesthetic_soft_glam');
      setDuplicateStrictness('balanced');
      setPresenterPersona(`${chPresenter} (${chName}) — Friendly beauty & skincare advisor, warm conversational Roman Urdu tone.`);
      setTargetAudience('Daily skincare routines, makeup beginners, and bridal grooming enthusiasts');
      setNicheKeywordsText('skincare, makeup hacks, hair routines, bridal glow, affordable beauty');
      setCustomInstructions(`Warm, friendly sisterly tone in natural conversational Urdu/English mix for ${chName}. Structure: Relatable daily beauty mistake/problem hook (0-10s), Root skin/hair cause, 3-step easy home fix or routine, Before/After proof, Pro tip, Audience question in comments, Subscribe CTA.`);
    } else {
      setDialectTone('lahori_conversational');
      setFlowPromptFormat('split_screen');
      setDuplicateStrictness('deep');
      setPresenterPersona(`${chPresenter} (${chName}) — Practical expert creator in ${chNiche}, clear and engaging in Roman Urdu.`);
      setTargetAudience(`Audience interested in ${chNiche}`);
      setNicheKeywordsText(`${chNiche.toLowerCase()}, tips, shortcuts, workflows, tutorial 2026`);
      setCustomInstructions(`Channel rules for ${chName} (${chNiche}) in Roman Urdu. Structure: High-impact hook (0-10s), problem/topic breakdown, practical step-by-step points, clear takeaways, audience question in comment CTA, subscribe outro.`);
    }
    showStatus('Engine rules & persona template smart draft ho gaya!');
  };

  // AI Suggestion states
  const [suggestingMeta, setSuggestingMeta] = useState(false);
  const [suggestedNiches, setSuggestedNiches] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  // Wizard Proposal State (New Channel Setup Wizard)
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [wizardProposal, setWizardProposal] = useState<{
    niche: string;
    categories: Array<{ id: number; name: string; playlist?: string; details?: string }>;
    sourcesByLens: {
      lens1: Array<{ name: string; url?: string; category?: string }>;
      lens2: Array<{ name: string; url?: string; category?: string }>;
      lens3: Array<{ name: string; url?: string; category?: string }>;
      lens4: Array<{ name: string; focus?: string; category?: string }>;
    };
    competitors: Array<{ id?: string; name: string; channelIdOrUrl: string; group: 'local' | 'global' | 'aspirational'; notes?: string }>;
  } | null>(null);

  // Centralized useEffect hook monitoring editingChannelId / active channel context to clear local niche, category, and tag state arrays upon change, preventing cross-channel data pollution.
  useEffect(() => {
    setSuggestedNiches([]);
    setSuggestedCategories([]);
    setWizardProposal(null);
    if (!editingChannelId) {
      setNiche('');
      setTag('');
      setCategoriesText('');
      setAspectRatio('9:16');
    }
  }, [editingChannelId]);

  // Automatically trigger AI niche suggestion engine when channel name meets minimum length requirement (>= 3 chars) or on blur
  useEffect(() => {
    if (!showForm || !name.trim() || name.trim().length < 3) return;
    const timer = setTimeout(() => {
      void handleFetchAiSuggestions();
    }, 600);
    return () => clearTimeout(timer);
  }, [name]);

  // Automatically trigger AI category lookup when niche is selected or changed, and reset category selection for consistency
  useEffect(() => {
    if (!showForm || !niche.trim() || niche.trim().length < 3) return;
    setCategoriesText(''); // Reset category selection when niche changes
    const timer = setTimeout(() => {
      void handleFetchCategoriesForNiche(niche.trim());
    }, 600);
    return () => clearTimeout(timer);
  }, [niche]);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const resetFormFields = () => {
    setName('');
    setPresenter('');
    setNiche('');
    setHasCharacterTag(false);
    setTag('');
    setPlatform('Multi-Platform MCN (YouTube Shorts + TikTok + Reels)');
    setSceneCount(10);
    setCategoriesText('');
    setSuggestedNiches([]);
    setSuggestedCategories([]);
    setWizardProposal(null);
    setAspectRatio('9:16');
    setDialectTone('formal');
    setFlowPromptFormat('cinematic_3d');
    setDuplicateStrictness('balanced');
    setAutonomousPriority('HIGH');
    setPresenterPersona('');
    setTargetAudience('');
    setNicheKeywordsText('');
    setCustomInstructions('');
    setEditingChannelId(null);
    setShowForm(false);
  };

  const handleRunWizard = async () => {
    if (!name.trim()) {
      showStatus('Channel ka naam darj karein taake wizard shuru ho sake.');
      return;
    }
    setLoadingWizard(true);
    setWizardProposal(null);
    try {
      const res = await fetch('/api/profile/wizard-propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          presenter: presenter.trim() || 'Presenter',
          tags: hasCharacterTag ? (tag.trim() || '@Custom-Tag') : 'No-Character',
          niche: niche.trim() || name.trim()
        })
      });
      const data = await res.json();
      if (data && data.ok) {
        setWizardProposal(data);
        if (data.categories && Array.isArray(data.categories)) {
          setCategoriesText(data.categories.map((c: any, i: number) => `${i + 1}. ${c.name}`).join('\n'));
        }
        showStatus(`✨ Wizard ne "${data.niche || niche}" ke mutabiq 7-10 categories, 4 lenses aur competitors propose kar diye hain!`);
      } else {
        showStatus('Wizard proposal generate nahi ho saki: ' + (data?.error || 'Unknown error'));
      }
    } catch (err: any) {
      showStatus('Wizard server request failed.');
    } finally {
      setLoadingWizard(false);
    }
  };

  const handleApproveWizardProposal = () => {
    if (!wizardProposal || !name.trim()) return;

    const channelId = editingChannelId || name.toLowerCase().replace(/[^a-z0-9]/g, '') || `channel_${Date.now()}`;
    const cleanTag = hasCharacterTag ? (tag.trim() || '@Custom-Tag') : 'No-Character';

    // 1. Initialize safe categories
    const safeCats = wizardProposal.categories.map((c, i) => ({
      id: i + 1,
      name: c.name,
      playlist: c.playlist || c.name,
      details: c.details
    }));

    // 2. Save isolated profile research settings (Zero tech bleed)
    saveProfileResearchSettings(channelId, {
      lens1WindowHours: 48,
      lens2WindowDays: 90,
      lens3WindowDays: 7,
      lens4WindowDays: 30,
      warnCrossChannelDuplicate: false,
      sourcesByLens: {
        lens1: (wizardProposal.sourcesByLens.lens1 || []).map((s, idx) => ({
          id: `lens1-${channelId}-${idx}`,
          name: s.name,
          url: s.url || '',
          enabled: true,
          category: s.category || 'Updates'
        })),
        lens2: (wizardProposal.sourcesByLens.lens2 || []).map((s, idx) => ({
          id: `lens2-${channelId}-${idx}`,
          name: s.name,
          url: s.url || '',
          enabled: true,
          category: s.category || 'Questions'
        })),
        lens3: (wizardProposal.sourcesByLens.lens3 || []).map((s, idx) => ({
          id: `lens3-${channelId}-${idx}`,
          name: s.name,
          url: s.url || '',
          enabled: true,
          category: s.category || 'Competitors'
        })),
        lens4: (wizardProposal.sourcesByLens.lens4 || []).map((s, idx) => ({
          id: `lens4-${channelId}-${idx}`,
          name: s.name,
          url: '',
          enabled: true,
          category: s.focus || s.category || 'Technique'
        }))
      }
    });

    // 3. Save isolated competitor groups
    const competitorList: CompetitorItem[] = (wizardProposal.competitors || []).map((c, idx) => ({
      id: `comp-${channelId}-${idx + 1}`,
      channelId,
      name: c.name,
      channelIdOrUrl: c.channelIdOrUrl || '',
      group: c.group || 'local',
      notes: c.notes || ''
    }));
    saveProfileCompetitors(channelId, competitorList);

    // 4. Initialize empty isolated Topic Bank and Library for this profile
    saveProfileTopicBank(channelId, []);
    saveProfileLibrary(channelId, []);

    // 5. Build and save engine config
    const engineConfigToSave: ChannelEngineConfig = {
      channelId,
      baselineTag: cleanTag,
      defaultSceneCount: sceneCount,
      duplicateStrictness,
      dialectTone: dialectTone || (niche.toLowerCase().includes('beauty') ? 'beauty_friendly' : 'lahori_conversational'),
      lockPersonaAcrossScenes: true,
      autoQueueSync: true,
      flowPromptFormat: flowPromptFormat || (niche.toLowerCase().includes('beauty') ? 'aesthetic_soft_glam' : 'cinematic_3d'),
      customInstructions: `Channel rules for ${name.trim()} (${niche.trim()}) in Roman Urdu. Structure: High-impact hook (0-10s), problem/topic breakdown, practical step-by-step points, clear takeaways, audience question in comment CTA, subscribe outro.`,
      presenterPersonaPrompt: presenterPersona.trim() || `${presenter.trim() || 'Presenter'} (${name.trim()})`,
      targetAudience: targetAudience.trim() || `Audience interested in ${niche.trim()}`,
      nicheKeywords: nicheKeywordsText ? nicheKeywordsText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : [niche.toLowerCase()],
      autonomousPriority,
      aspectRatio,
      searchGroundingRules: `Prioritize latest trends, viral hooks, and verified practices in ${niche.trim()}.`
    };
    saveEngineConfigForChannel(channelId, engineConfigToSave);

    // 6. Save channel profile
    const channelProfileToSave: ExtendedChannelProfile = {
      id: channelId as any,
      name: name.trim(),
      presenter: presenter.trim() || 'Anchor Presenter',
      niche: niche.trim() || wizardProposal.niche || 'Content',
      platform,
      hasCharacterTag,
      aspectRatio,
      engineConfig: engineConfigToSave,
      tags: hasCharacterTag
        ? [{ value: cleanTag, label: `${cleanTag} (Character Tag)` }]
        : [{ value: 'No-Character', label: 'Faceless / AI Storyboard (No Character)' }],
      categories: safeCats,
      rotationCategoryIds: safeCats.map((c) => c.id),
      defaultTag: cleanTag,
      defaultCategoryId: safeCats[0]?.id || 1,
      durations: [
        { value: 10, label: '10 Scenes (100s — Standard Short)' },
        { value: 12, label: '12 Scenes (120s — Extended)' },
        { value: 7, label: '7 Scenes (70s — Minimal Threshold)' }
      ],
      defaultSceneCount: sceneCount,
      sampleNotes: {
        1: { title: `${name} Episode 1`, hook: 'Story Reveal' }
      },
      isCustom: true
    };

    const updated = saveOrUpdateChannel(channelProfileToSave);
    setChannels(updated);
    onChannelsUpdated(updated);
    dirtyManager.clearDirty('channel_manager');
    showStatus(`✅ Naya Channel Profile "${name}" apni isolated categories, 4-lens sources aur competitors ke sath save ho gaya!`);
    resetFormFields();
  };

  const handleOpenAddForm = () => {
    resetFormFields();
    setShowForm(true);
  };

  const handleFetchAiSuggestions = async () => {
    const currentName = name.trim();
    if (!currentName || currentName.length < 2) {
      return;
    }
    setSuggestingMeta(true);
    setSuggestedNiches([]);
    setSuggestedCategories([]);
    try {
      const res = await fetch('/api/ai/suggest-channel-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: currentName })
      });
      const data = await res.json();
      if (data && data.niches) {
        setSuggestedNiches(data.niches || []);
        setSuggestedCategories(data.categories || []);
        showStatus(`AI ne "${currentName}" ke liye smart Niche aur Categories suggest kar di hain!`);
      }
    } catch {
      showStatus('AI suggestions load nahi ho sake.');
    }
    setSuggestingMeta(false);
  };

  const handleFetchCategoriesForNiche = async (targetNiche: string) => {
    setSuggestingMeta(true);
    setSuggestedCategories([]);
    try {
      const res = await fetch('/api/ai/suggest-categories-for-niche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: targetNiche })
      });
      const data = await res.json();
      if (data && data.categories) {
        setSuggestedCategories(data.categories || []);
        showStatus(`AI ne "${targetNiche}" ke liye 5-10 contextually relevant categories suggest kar di hain!`);
      }
    } catch {
      showStatus('Category suggestions load nahi ho sake.');
    }
    setSuggestingMeta(false);
  };

  const handleStartEdit = (channel: ExtendedChannelProfile) => {
    setEditingChannelId(channel.id);
    setName(channel.name);
    setPresenter(channel.presenter);
    setNiche(channel.niche);
    setHasCharacterTag(Boolean(channel.hasCharacterTag));
    setTag(channel.defaultTag || (channel.tags && channel.tags[0]?.value) || '');
    setPlatform(channel.platform || 'Multi-Platform MCN (YouTube Shorts + TikTok + Reels)');
    setSceneCount(channel.defaultSceneCount || 10);
    setCategoriesText(channel.categories.map((c, i) => `${i + 1}. ${c.name}`).join('\n'));
    setAspectRatio(channel.aspectRatio || '9:16');
    setSuggestedNiches([]);
    setSuggestedCategories([]);

    // Load channel-specific engine configuration
    const eng = getEngineConfigForChannel(channel.id);
    setDialectTone(eng.dialectTone || 'formal');
    setFlowPromptFormat(eng.flowPromptFormat || 'cinematic_3d');
    setDuplicateStrictness(eng.duplicateStrictness || 'balanced');
    setAutonomousPriority((eng.autonomousPriority as any) || 'HIGH');
    setPresenterPersona(eng.presenterPersonaPrompt || `${channel.presenter} (${channel.name})`);
    setTargetAudience(eng.targetAudience || '');
    setNicheKeywordsText((eng.nicheKeywords || []).join(', '));
    setCustomInstructions(eng.customInstructions || '');

    setShowForm(true);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCategories = parseCategoriesInput(categoriesText);

    const safeCategories = parsedCategories.length
      ? parsedCategories
      : [{ id: 1, name: 'Main Category', playlist: 'Main' }];

    const channelId = editingChannelId || name.toLowerCase().replace(/[^a-z0-9]/g, '') || `channel_${Date.now()}`;
    const cleanTag = hasCharacterTag ? (tag.trim() || '@Custom-Tag') : 'No-Character';

    const existing = channels[channelId];

    // Build and save channel-specific engine configuration
    const engineConfigToSave: ChannelEngineConfig = {
      channelId,
      baselineTag: cleanTag,
      defaultSceneCount: sceneCount,
      duplicateStrictness,
      dialectTone,
      lockPersonaAcrossScenes: true,
      autoQueueSync: true,
      flowPromptFormat,
      customInstructions:
        customInstructions.trim() ||
        `Channel rules for ${name.trim()} (${niche.trim()}) in Roman Urdu. Structure: High-impact hook (0-10s), problem/topic breakdown, practical step-by-step points, clear takeaways, audience question in comment CTA, subscribe outro.`,
      presenterPersonaPrompt: presenterPersona.trim() || `${presenter.trim()} (${name.trim()})`,
      targetAudience: targetAudience.trim() || `Audience interested in ${niche.trim()}`,
      nicheKeywords: nicheKeywordsText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      autonomousPriority,
      aspectRatio,
      searchGroundingRules: `Prioritize latest trends, viral hooks, and verified practices in ${niche.trim()}.`
    };

    saveEngineConfigForChannel(channelId, engineConfigToSave);

    const channelProfileToSave: ExtendedChannelProfile = {
      id: channelId as any,
      name: name.trim(),
      presenter: presenter.trim() || 'Anchor Presenter',
      niche: niche.trim() || 'Content & Tech',
      platform,
      hasCharacterTag,
      aspectRatio,
      engineConfig: engineConfigToSave,
      tags: hasCharacterTag
        ? [{ value: cleanTag, label: `${cleanTag} (Character Tag)` }]
        : [{ value: 'No-Character', label: 'Faceless / AI Storyboard (No Character)' }],
      categories: safeCategories,
      rotationCategoryIds: safeCategories.map((c) => c.id),
      defaultTag: cleanTag,
      defaultCategoryId: safeCategories[0]?.id || 1,
      durations: existing?.durations || [
        { value: 10, label: '10 Scenes (100s — Standard Short)' },
        { value: 12, label: '12 Scenes (120s — Extended)' },
        { value: 7, label: '7 Scenes (70s — Minimal Threshold)' }
      ],
      defaultSceneCount: sceneCount,
      sampleNotes: existing?.sampleNotes || {
        1: { title: `${name} Episode 1`, hook: 'Story Reveal' }
      },
      isCustom: existing?.isCustom ?? (channelId !== 'itcafeteria' && channelId !== 'beautyhub')
    };

    const updated = saveOrUpdateChannel(channelProfileToSave);
    setChannels(updated);
    onChannelsUpdated(updated);
    dirtyManager.clearDirty('channel_manager');
    showStatus(
      editingChannelId
        ? `Channel "${name}" aur iski dedicated Engine Configuration save ho gayi!`
        : `Naya Channel "${name}" apni dedicated Engine Configuration ke sath create ho gaya!`
    );
    resetFormFields();
  };

  const handleDelete = (channelId: string) => {
    const target = channels[channelId];
    if (!target) return;
    if (window.confirm(`Kya aap waqai channel "${target.name}" ko remove karna chahte hain?`)) {
      const updated = deleteChannel(channelId);
      setChannels(updated);
      onChannelsUpdated(updated);
      dirtyManager.clearDirty('channel_manager');
      showStatus(`Channel "${target.name}" remove ho gaya. (Aap Undo button se wapis la sakte hain)`);
      if (editingChannelId === channelId) {
        resetFormFields();
      }
    }
  };

  const handleUndo = () => {
    const reverted = undoLastChannelAction();
    if (reverted) {
      setChannels(reverted);
      onChannelsUpdated(reverted);
      dirtyManager.clearDirty('channel_manager');
      showStatus('Pichla step Undo ho gaya — channels pehli halat me wapis aa gaye.');
    } else {
      showStatus('Peeche jane ke liye koi previous state nahi mili.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kya aap tamam channels ko default setting (IT Cafeteria & Beauty Hub) par reset karna chahte hain?')) {
      const restored = resetChannelsToDefault();
      setChannels(restored);
      onChannelsUpdated(restored);
      dirtyManager.clearDirty('channel_manager');
      showStatus('Tamam default channels restore ho gaye.');
      resetFormFields();
    }
  };

  const channelList = Object.values(channels);

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-hidden animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-3xl max-h-[80vh] h-full sm:h-auto flex flex-col shadow-2xl shadow-emerald-950/80 overflow-hidden text-slate-100"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Channel Manager & Multi-Channel Studio</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  {channelList.length} Active Channels
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Default aur custom channels ko modify karein, naya channel create karein ya delete karein.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Band Karein"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg animate-in fade-in duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Content Body — Scrollable only within modal */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-modal-scroll p-4 sm:p-5 space-y-4">
          {/* Channel Cards Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">

                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Configured Channels ({channelList.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Pichli tabdili ko wapis layein"
                >
                  <Undo2 className="w-3 h-3 text-cyan-400" />
                  <span>Undo Step</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Tamam channels ko default par reset karein"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Restore Defaults</span>
                </button>
                {!showForm && (
                  <button
                    type="button"
                    onClick={handleOpenAddForm}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-emerald-950"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Channel</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {channelList.map((ch, idx) => {
                const isSelectedForEdit = editingChannelId === ch.id;
                return (
                  <div
                    key={ch.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelectedForEdit
                        ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-bold text-white text-sm truncate">
                            {idx + 1}. {ch.name}
                          </h5>
                          {ch.isCustom ? (
                            <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                              Custom
                            </span>
                          ) : (
                            <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          Presenter: <span className="text-slate-200">{ch.presenter}</span> • Niche:{' '}
                          <span className="text-slate-200">{ch.niche}</span>
                        </p>
                      </div>

                      {/* Action buttons: Edit & Delete for EVERY channel as requested */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ch)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="Is Channel ko Modify / Edit karein"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ch.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Channel ko Delete karein"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Tag:{' '}
                        <span className="text-cyan-300 font-mono">
                          {ch.hasCharacterTag
                            ? ch.defaultTag || ch.tags?.[0]?.value || 'Active'
                            : 'Faceless / AI Story'}
                        </span>
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ch.categories.length} Categories
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ch.defaultSceneCount || 10} Scenes
                      </span>
                      {ch.platform && (
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {ch.platform}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit / Add Channel Form */}
          {showForm && (
            <div className="border border-emerald-500/40 bg-slate-950/90 rounded-2xl p-4 sm:p-5 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    {editingChannelId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {editingChannelId ? `Channel Modify Karein (${name || 'Channel'})` : 'Naye Channel Ki Configuration'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {editingChannelId
                        ? 'Details update karke Save Changes dabayein'
                        : 'Channel ka naam, presenter aur settings darj karein'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetFormFields}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveChannel} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Channel Ka Naam <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => {
                        if (name.trim().length >= 3) {
                          void handleFetchAiSuggestions();
                        }
                      }}
                      placeholder="e.g. IT Cafeteria Shorts ya Waqar Tech AI"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Host / Presenter Ka Naam
                    </label>
                    <input
                      type="text"
                      value={presenter}
                      onChange={(e) => setPresenter(e.target.value)}
                      placeholder="e.g. Waqar Majeed ya Mehr Zadi"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* AI Meta Suggestion Trigger, Ratio Buttons & Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Aspect Ratio (Auto-Saved):</span>
                    <button
                      type="button"
                      onClick={() => setAspectRatio('9:16')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        aspectRatio === '9:16'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="9:16 Vertical Ratio (Shorts / Reels / TikTok)"
                    >
                      9:16
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio('16:9')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        aspectRatio === '16:9'
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="16:9 Landscape Ratio (YouTube Longform)"
                    >
                      16:9
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchAiSuggestions}
                    disabled={suggestingMeta || !name.trim()}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-[11px] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {suggestingMeta ? <Sparkles className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-cyan-200" />}
                    <span>✨ AI se Niche aur Categories Suggest Karwayein</span>
                  </button>
                </div>

                {/* Suggested Niche & Categories Pills */}
                {(suggestedNiches.length > 0 || suggestedCategories.length > 0) && (
                  <div className="p-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-2.5">
                    {suggestedNiches.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-1">Suggested Niches (Click to select):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedNiches.map((sNiche, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setNiche(sNiche)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
                            >
                              + {sNiche}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestedCategories.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-1">Suggested Categories (Click to add):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedCategories.map((sCat, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const currentLines = categoriesText
                                  .split('\n')
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                if (!currentLines.some((l) => l.toLowerCase().includes(sCat.toLowerCase()))) {
                                  currentLines.push(`${currentLines.length + 1}. ${sCat}`);
                                  setCategoriesText(currentLines.join('\n'));
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-[11px] transition-colors cursor-pointer"
                            >
                              + {sCat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Niche / Topic</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. AI & Tech Workflows, Daily Hacks"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Character Tag Feature: Conditional Toggle for Character-based story generation */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <label className="text-slate-200 font-semibold text-xs">
                          Character-Based Story Generation
                        </label>
                      </div>

                      {/* Stylish Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={hasCharacterTag}
                        onClick={() => {
                          const next = !hasCharacterTag;
                          setHasCharacterTag(next);
                          if (next && !tag) setTag('@WM25-Live');
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          hasCharacterTag ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            hasCharacterTag ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      {hasCharacterTag
                        ? 'Active: Yeh channel character anchor tag use karega. Tag field niche active hai.'
                        : 'Disabled: Faceless / voiceover format ke liye tag ki zaroorat nahi hai.'}
                    </p>

                    {hasCharacterTag ? (
                      <div className="pt-1">
                        <label className="text-[11px] font-semibold text-cyan-300 block mb-1">
                          Default Character Tag (Google Flow) <span className="text-cyan-400 font-mono">*</span>
                        </label>
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => setTag(e.target.value)}
                          placeholder="e.g. @WM25-Live ya @CharacterTag"
                          className="w-full bg-slate-950 border border-cyan-500/60 rounded-lg px-3 py-1.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-slate-950/70 border border-dashed border-slate-800 rounded-lg px-3 py-2 text-slate-400 italic text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        <span>Faceless Storyboard Mode — Tag input disabled for non-character format</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Target Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Multi-Platform MCN (YouTube Shorts + TikTok + Reels)">
                        Multi-Platform MCN (YouTube Shorts + TikTok + Reels)
                      </option>
                      <option value="YouTube Shorts Only (9:16 Vertical)">
                        YouTube Shorts Only (9:16 Vertical)
                      </option>
                      <option value="TikTok Viral Short (9:16 Vertical)">
                        TikTok Viral Short (9:16 Vertical)
                      </option>
                      <option value="Instagram Reels (9:16 Vertical)">
                        Instagram Reels (9:16 Vertical)
                      </option>
                      <option value="Facebook Reels (9:16 Vertical)">
                        Facebook Reels (9:16 Vertical)
                      </option>
                      <option value="LinkedIn Video (1:1 / 4:5 Vertical)">
                        LinkedIn Video (1:1 / 4:5 Vertical)
                      </option>
                      <option value="YouTube Longform (16:9 Landscape)">
                        YouTube Longform (16:9 Landscape)
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold text-xs">Default Scene Count (7–30)</label>
                      <span className="text-[10px] text-cyan-300 font-mono font-bold">{sceneCount} Scenes ({sceneCount * 10}s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSceneCount(Math.max(7, sceneCount - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={7}
                        max={30}
                        value={sceneCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setSceneCount(Math.max(7, Math.min(30, val)));
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setSceneCount(Math.min(30, sceneCount + 1))}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[7, 10, 12, 15, 20, 25, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSceneCount(num)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                            sceneCount === num
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {num}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- New Channel Setup Wizard Section --- */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h5 className="font-bold text-white text-xs">New Channel Setup Wizard (One-Click Isolated Configuration)</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Channel name aur niche ke mutabiq 7-10 categories, 4-lens sources (Zero tech bleed), aur competitor groups propose karein.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunWizard}
                      disabled={loadingWizard || !name.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950 shrink-0 self-start sm:self-center"
                    >
                      {loadingWizard ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-200" />}
                      <span>✨ Run Setup Wizard</span>
                    </button>
                  </div>

                  {/* Display Wizard Proposal when loaded */}
                  {wizardProposal && (
                    <div className="p-3 bg-slate-950/90 border border-emerald-500/50 rounded-xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-emerald-300 text-xs">Proposed Architecture for "{wizardProposal.niche || niche}"</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                          Zero Tech Bleed Guaranteed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                        {/* Proposed Categories */}
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-cyan-400" />
                            <span>Categories ({wizardProposal.categories.length})</span>
                          </div>
                          <ul className="space-y-1 text-slate-300 max-h-36 overflow-y-auto pr-1">
                            {wizardProposal.categories.map((c, i) => (
                              <li key={i} className="truncate">• {c.name}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Proposed 4-Lens Sources */}
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>4-Lens Sources (Isolated)</span>
                          </div>
                          <div className="space-y-1 text-slate-300 text-[10px] max-h-36 overflow-y-auto pr-1">
                            <div><span className="text-slate-400 font-mono">L1 (48h):</span> {(wizardProposal.sourcesByLens.lens1 || []).map(s => s.name).slice(0, 2).join(', ')}</div>
                            <div><span className="text-slate-400 font-mono">L2 (90d):</span> {(wizardProposal.sourcesByLens.lens2 || []).map(s => s.name).slice(0, 2).join(', ')}</div>
                            <div><span className="text-slate-400 font-mono">L3 (7d):</span> {(wizardProposal.sourcesByLens.lens3 || []).map(s => s.name).slice(0, 2).join(', ')}</div>
                            <div><span className="text-slate-400 font-mono">L4 (30d):</span> {(wizardProposal.sourcesByLens.lens4 || []).map(s => s.name).slice(0, 2).join(', ')}</div>
                          </div>
                        </div>

                        {/* Proposed Competitors */}
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-purple-400" />
                            <span>Competitor Radar ({wizardProposal.competitors.length})</span>
                          </div>
                          <ul className="space-y-1 text-slate-300 max-h-36 overflow-y-auto pr-1">
                            {wizardProposal.competitors.map((c, i) => (
                              <li key={i} className="truncate">• {c.name} <span className="text-[9px] text-slate-500 font-mono">({c.group})</span></li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
                        <span className="text-[11px] text-slate-400">
                          Ek click mein in categories, sources aur competitors ko is profile ke configuration ke tor par save karein.
                        </span>
                        <button
                          type="button"
                          onClick={handleApproveWizardProposal}
                          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>✅ Approve & Initialize Profile</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs sm:text-sm">
                      Channel Categories (Har category nayi line me likhein)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Safe Parentheses Support
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={categoriesText}
                    onChange={(e) => setCategoriesText(e.target.value)}
                    placeholder={'1. AI & Smart Technology\n2. AI Chatbots, Workflows & AI Tools\n3. PC & Windows Hacks\n4. Secrets (WhatsApp, Google, Windows, ChatGPT, etc.)'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Har category ko alag line par likhein. Parentheses <code>(...)</code> ke andar ke commas safe rahenge aur alag category nahi banenge.
                  </p>
                </div>

                {/* --- Dedicated Channel Engine Configuration Section --- */}
                <div className="p-4 bg-slate-950/90 border border-indigo-500/30 rounded-xl space-y-3.5 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                          <Bot className="w-3.5 h-3.5" />
                        </span>
                        <h5 className="font-bold text-white text-xs">
                          {name.trim() || 'Channel'} Engine Configuration (Profile-Wise Identity)
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Yeh setting sirf is channel ke liye hogi taake har channel ka apna voice, style aur rules hon.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={autoDraftEngineRules}
                      className="px-3 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm self-start sm:self-center"
                      title="Niche aur name ke mutabiq engine configuration smart draft karein"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      <span>✨ Auto-Draft Engine Profile</span>
                    </button>
                  </div>

                  {/* Engine Dialect & Visual Style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Engine Dialect &amp; Cadence Tone
                      </label>
                      <select
                        value={dialectTone}
                        onChange={(e) => setDialectTone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="lahori_conversational">Lahori Conversational (Pakistani Tech YouTuber)</option>
                        <option value="formal">Natural Tech Urdu (Semi-formal)</option>
                        <option value="beauty_friendly">Beauty &amp; Grooming Sisterly Advice (Warm Roman Urdu)</option>
                        <option value="fast_paced">Fast-Paced Energetic (TikTok Viral Style)</option>
                        <option value="documentary">Deep-Dive Documentary Explainer (Authoritative)</option>
                        <option value="brotherly">Casual Senior Brotherly / Bhai Advice (Trustworthy)</option>
                        <option value="workshop">Step-by-Step Hands-On Workshop (Instructor pace)</option>
                        <option value="lifestyle_advisor">Lifestyle &amp; Wellness Advisor (Relaxing Urdu)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        AI stories likhte waqt is channel ki khas bolchal aur tone follow karega.
                      </p>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Visual Directing / Google Flow Style
                      </label>
                      <select
                        value={flowPromptFormat}
                        onChange={(e) => setFlowPromptFormat(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="cinematic_3d">Cinematic 3D Hologram + Anchor Split</option>
                        <option value="split_screen">Live Split-Screen Hands-On Demo &amp; Facecam</option>
                        <option value="aesthetic_soft_glam">Aesthetic Soft Glam Studio &amp; Macro Product (Beauty)</option>
                        <option value="motion_graphics">Minimalist Clean Motion Graphics &amp; Code Screencast</option>
                        <option value="kinetic">Kinetic Typography &amp; Dynamic Zoom Cutaways</option>
                        <option value="standard">Standard YouTube Studio Desk</option>
                        <option value="minimal">Minimal Prompt</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Flow scenes aur visual prompts ka camera &amp; lighting format.
                      </p>
                    </div>
                  </div>

                  {/* Duplicate Tolerance & Autonomous Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Duplicate Check Strictness
                      </label>
                      <select
                        value={duplicateStrictness}
                        onChange={(e) => setDuplicateStrictness(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="deep">Deep Sub-Point &amp; Feature Verification (Recommended)</option>
                        <option value="balanced">Balanced (Allows fresh angles on previously covered tools)</option>
                        <option value="strict">Strict (0-Tolerance against catalog videos)</option>
                        <option value="relaxed">Relaxed (Experimental / Broad variations)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Autopilot Priority
                      </label>
                      <select
                        value={autonomousPriority}
                        onChange={(e) => setAutonomousPriority(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="HIGH">HIGH (Active Primary Rotation)</option>
                        <option value="URGENT">URGENT (Accelerated Replenishment)</option>
                        <option value="NORMAL">NORMAL (Standard Secondary Buffer)</option>
                      </select>
                    </div>
                  </div>

                  {/* Presenter Persona & Target Audience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Presenter Persona &amp; Voice Tone
                      </label>
                      <input
                        type="text"
                        value={presenterPersona}
                        onChange={(e) => setPresenterPersona(e.target.value)}
                        placeholder={`e.g. ${presenter || 'Host'} — Expert advisor in ${niche || 'topic'}`}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g. Youth, professionals, beginners, students"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Niche Grounding Keywords */}
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Search Radar &amp; Grounding Keywords (Commas se alag karein)
                    </label>
                    <input
                      type="text"
                      value={nicheKeywordsText}
                      onChange={(e) => setNicheKeywordsText(e.target.value)}
                      placeholder="e.g. windows 11, ai shortcuts, chatgpt hacks, data tools"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Autopilot aur Grounding engine is channel ke liye in keywords se viral news aur research fetch karenge.
                    </p>
                  </div>

                  {/* Custom Prompt Instructions for Channel */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold text-xs">
                        Channel Engine System Prompt &amp; Script Rules
                      </label>
                      <span className="text-[10px] font-mono text-indigo-400">
                        {customInstructions.length} characters
                      </span>
                    </div>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Channel-specific prompt rules that AI script writer will strictly follow..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Script format, hook guidelines aur outro CTAs jo is channel ke har short ke andar lazmi follow honge.
                    </p>
                  </div>

                  {/* Practical Blueprint Configuration */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                      <h6 className="font-bold text-white text-xs">
                        Practical Blueprint Architecture (No Stories Without Concrete Steps/Facts)
                      </h6>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Har channel ke liye Practical Blueprint enforce hota hai: Cooking channels ke liye exact ingredients aur cooking steps; Beauty channels ke liye exact products aur skin application steps; Tech channels ke liye exact UI buttons aur commands.
                    </p>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono">
                      ✓ Zero Vague Placeholders Guarantee • Scene-by-Scene Step Matching • YouTube Description Step Binding
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons: Distinct Save Changes vs Channel Creation buttons! */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetFormFields}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingChannelId ? 'Save Changes' : 'Channel Create Karein'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Naye aur modified channels Agent Simulator aur Calendar me foran sync ho jate hain.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
