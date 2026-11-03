import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bot,
  RotateCcw,
  Check,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Film,
  MessageSquare,
  Wand2,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  Lock,
  Edit2,
  Edit3,
  Link,
  Tag,
  Save,
  AlertCircle
} from 'lucide-react';
import { dirtyManager } from '../lib/dirtyStore';
import { PUBLISHED_VIDEOS, CHANNEL_PROFILES } from '../data/channelData';
import {
  loadAllChannels,
  getEngineConfigForChannel,
  saveEngineConfigForChannel,
  resetEngineConfigForChannel,
  type ExtendedChannelProfile
} from '../lib/channelStore';

export interface ScenePresetItem {
  id: string;
  count: number;
  label: string;
}

export interface DialectPresetItem {
  id: string;
  label: string;
  description: string;
}

export interface StylePresetItem {
  id: string;
  label: string;
  description: string;
}

export interface ScriptPresetItem {
  id: string;
  title: string;
  subtitle: string;
  instructions: string;
}

export interface CategoryRuleItem {
  id: number | string;
  name: string;
  instructions: string;
  boundCategoryIds?: number[];
}

export interface SimulatorConfig {
  baselineTag: string;
  defaultSceneCount: number;
  duplicateStrictness: 'deep' | 'balanced' | 'strict' | 'relaxed' | string;
  dialectTone: string;
  lockPersonaAcrossScenes: boolean;
  autoQueueSync: boolean;
  flowPromptFormat: string;
  customInstructions: string;
  scenePresets?: ScenePresetItem[];
  dialectPresets?: DialectPresetItem[];
  stylePresets?: StylePresetItem[];
}

/**
 * Screenshot 1: Accurate Scene Counts (7, 10, 12, 15, 18, 30)
 */
export const DEFAULT_SCENE_PRESETS: ScenePresetItem[] = [
  { id: 'sc-7', count: 7, label: '7 Scenes (70s — 1m 10s)' },
  { id: 'sc-10', count: 10, label: '10 Scenes (100s — 1m 40s Standard Short)' },
  { id: 'sc-12', count: 12, label: '12 Scenes (120s — 2m 00s Video)' },
  { id: 'sc-15', count: 15, label: '15 Scenes (150s — 2m 30s Video)' },
  { id: 'sc-18', count: 18, label: '18 Scenes (180s — 3m 00s Video)' },
  { id: 'sc-30', count: 30, label: '30 Scenes (300s — 5m 00s Deep Dive)' }
];

/**
 * Screenshot 2: Duplicate Check Tolerance Options
 */
export const DUPLICATE_TOLERANCE_OPTIONS = [
  {
    id: 'deep',
    label: 'Deep Sub-Point & Secret Verification (Recommended)',
    desc: 'Main tool (e.g. WhatsApp / Power Automate) par duplicate mark nahi karega, balkay andar ke specific features aur points check karega (Part 1, 2, 3 allowed).'
  },
  {
    id: 'balanced',
    label: 'Balanced (Allows fresh angle on old topics)',
    desc: 'Allows fresh angle or distinct workflow on previously covered tools.'
  },
  {
    id: 'strict',
    label: 'Strict (0-Tolerance against 58 Videos)',
    desc: 'Zero duplication allowed against 58+ published catalog videos.'
  },
  {
    id: 'relaxed',
    label: 'Relaxed (Experimental / Broad check)',
    desc: 'Soft semantic threshold for testing viral variations of top videos.'
  }
];

/**
 * Screenshot 3: Accurate Dialect & Cadence Options
 */
export const DEFAULT_DIALECT_PRESETS: DialectPresetItem[] = [
  {
    id: 'lahori_conversational',
    label: 'Lahori Conversational (Pakistani Tech YouTuber)',
    description: 'Natural Lahori tech cadence with punchy hooks, relatable examples ("Bhai yeh check karein..."), and zero mid-story voice switching.'
  },
  {
    id: 'formal',
    label: 'Natural Tech Urdu (Semi-formal)',
    description: 'Clean, professional Urdu technical vocabulary suitable for enterprise workflows.'
  },
  {
    id: 'beauty_friendly',
    label: 'Beauty & Grooming Sisterly Advice (Warm Roman Urdu)',
    description: 'Warm, approachable, friendly elder sister / beauty consultant tone with relatable skincare and self-care tips.'
  },
  {
    id: 'fast_paced',
    label: 'Fast-Paced Energetic (TikTok Viral Style)',
    description: 'High-speed urgency, rapid pattern-interrupts, and aggressive retention hooks.'
  },
  {
    id: 'documentary',
    label: 'Deep-Dive Documentary Explainer (Authoritative)',
    description: 'Serious investigative tone, architectural deep-dives, authoritative presentation.'
  },
  {
    id: 'brotherly',
    label: 'Casual Senior Brotherly / Bhai Advice (Trustworthy)',
    description: 'Warm, trustworthy elder brother mentor advice with practical cautionary tips.'
  },
  {
    id: 'urgent_tech',
    label: 'High-Stakes Urgent Breaking Tech (Fast hook alert)',
    description: 'Urgent security and breakthrough tech warnings, rapid-fire pacing.'
  },
  {
    id: 'workshop',
    label: 'Step-by-Step Hands-On Workshop (Instructor pace)',
    description: 'Calm, patient instructor cadence walking through complex interface workflows click by click.'
  },
  {
    id: 'lifestyle_advisor',
    label: 'Lifestyle & Wellness Advisor (Relaxing Urdu)',
    description: 'Empathetic, reassuring lifestyle and wellness cadence focused on healthy habits and confidence.'
  }
];

/**
 * Screenshot 4: Flow Prompt Script Style Options
 */
export const DEFAULT_STYLE_PRESETS: StylePresetItem[] = [
  {
    id: 'cinematic_3d',
    label: 'Cinematic 3D Hologram + Anchor Split',
    description: 'Prepends visual cinematic directing (9:16 vertical, 8K, anamorphic lens, cyan/amber volumetric lighting, left anchor split with floating holographic UI).'
  },
  {
    id: 'split_screen',
    label: 'Live Split-Screen Hands-On Demo & Facecam Reaction',
    description: 'Dual-camera split with presenter facecam reaction on left and real-time screen capture demonstration on right.'
  },
  {
    id: 'aesthetic_soft_glam',
    label: 'Aesthetic Soft Glam Studio & Macro Product Close-Ups (Beauty)',
    description: 'Soft 5600K ring-light beauty studio, rose-gold accents, warm skin glow, macro close-ups of product textures and before/after comparisons.'
  },
  {
    id: 'motion_graphics',
    label: 'Minimalist Clean Motion Graphics & Code Screencast',
    description: 'Clean high-contrast vector motion graphics, code editor screencasts, and crisp syntax highlighting.'
  },
  {
    id: 'kinetic',
    label: 'Kinetic Typography & Dynamic Zoom Cutaways',
    description: 'Fast-paced kinetic animated subtitles, dynamic whip-pans, and rhythmic snap zooms.'
  },
  {
    id: 'standard',
    label: 'Standard YouTube Studio Setup',
    description: 'Centered anchor, crisp desk ring lights, and clean desktop screen recording cutaways.'
  },
  {
    id: 'minimal',
    label: 'Minimal Prompt',
    description: 'Compact prompt format focusing purely on dialogue and essential visual cues.'
  }
];

/**
 * Screenshot 5: Agent Script Rules & Prompt Instructions Presets
 */
export const IT_CAFETERIA_SCRIPT_RULE_PRESETS: ScriptPresetItem[] = [
  {
    id: '10_scene_short',
    title: '10-Scene Short',
    subtitle: 'Hook, Problem, Agitate, Reveal, Step 1, Step 2, Proof...',
    instructions: 'Strict 10-Scene Short format in Roman Urdu. Structure: Disruptive pattern-interrupt hook (0-10s), Problem breakdown, Agitate pain points, Instant secret reveal, Step-by-step practical execution, Proof and benchmarks, Curiosity loop, CTA outro with subscriber prompt.'
  },
  {
    id: 'whatsapp_secrets',
    title: 'WhatsApp & Tools Secrets',
    subtitle: 'Hook, Instant Teaser, Secret Hack 1, Secret Hack 2, Secr...',
    instructions: 'Category 7 Secrets & Daily Tools format in Roman Urdu. Structure: Teaser hook revealing hidden trick, Instant screen proof, Secret Shortcut 1, Secret Shortcut 2, Common mistake warning, Practical takeaway, High-engagement question in comment CTA.'
  },
  {
    id: 'power_automate',
    title: 'Power Automate & Long-f...',
    subtitle: 'Episode Context & Recap, Workplace Problem,...',
    instructions: 'Deep productivity and automation tutorial format. Structure: Episode context and recap, Workplace business problem, Architecture and trigger breakdown, Step-by-step logic nodes, Live testing and run execution, Speed boost proof, Next chapter teaser.'
  },
  {
    id: 'bug_security',
    title: 'Bug Alert & Security',
    subtitle: 'Shocking Tech Alert, Risk Proof, Root Cause, 1-Click...',
    instructions: 'High-stakes urgent tone in Roman Urdu. Structure: Shocking security/productivity warning or myth reveal, Live proof of why users are at risk, Root cause explanation, 1-Click fix & prevention step, Post-fix verification test, Interactive viewer question, Subscribe CTA.'
  }
];

export const BEAUTY_HUB_SCRIPT_PRESETS: ScriptPresetItem[] = [
  {
    id: 'beauty_10_scene',
    title: '10-Scene Beauty Short',
    subtitle: 'Hook, Skin Concern, Instant Teaser, Step 1, Step 2, Live Glow Proof...',
    instructions: 'Strict 10-Scene Beauty Short format in Roman Urdu. Structure: Disruptive visual hook (0-10s), Relatable skin or beauty concern, Teaser solution, Step 1 gentle technique, Step 2 key product or hack, Step 3 texture demonstration, Live before/after glow proof, Curiosity loop, CTA for daily skincare/makeup tips.'
  },
  {
    id: 'skincare_routine',
    title: 'Skincare Routine & Secrets',
    subtitle: 'Morning/Night Routine, Key Ingredients, Blending, Mistake Warning...',
    instructions: 'Skincare masterclass format in warm Roman Urdu. Structure: Morning vs night skin needs, Active ingredient safety (hyaluronic acid, niacinamide, sunscreen), Application order, Common mistake warning (harsh scrubbing), Glowing results timeline, Interactive viewer skin question in CTA.'
  },
  {
    id: 'makeup_soft_glam',
    title: 'Everyday Soft Glam Makeup',
    subtitle: '5-Minute Quick Glam, Foundation Shade, Concealer Hack, Long-Lasting Lock...',
    instructions: 'Everyday soft glam and beginner makeup tutorial format in friendly Urdu. Structure: Skin prep and hydration primer, Base matching without white cast, 2-minute eye and brow definition, Natural lip tint blending, Setting spray lock for Pakistani weather, Save this video CTA.'
  },
  {
    id: 'beauty_product_review',
    title: 'Product Review & Hacks',
    subtitle: 'Viral Product Test, Honest Pros/Cons, Budget Dupes, Final Verdict...',
    instructions: 'Honest beauty product review and budget alternatives. Structure: Viral product claim vs reality, Ingredient test, Live skin texture swatch, Honest pros and cons, Affordable local alternative, Final recommendation for dry/oily skin types.'
  }
];

export const SCRIPT_RULE_PRESETS = IT_CAFETERIA_SCRIPT_RULE_PRESETS;

export const IT_CAFETERIA_10_CATEGORY_RULES: CategoryRuleItem[] = [
  { id: 1, name: '1. AI & Smart Tech', instructions: 'Focus on latest AI breakthroughs, active memory/focus, multimodal live capabilities in Roman Urdu with pattern-interrupt hooks.', boundCategoryIds: [1] },
  { id: 2, name: '2. AI Workflows', instructions: 'Deep productivity and automation tutorial format. Structure: Business problem, Architecture and trigger breakdown, Step-by-step logic nodes, Live testing.', boundCategoryIds: [2] },
  { id: 3, name: '3. AI Prompt Hacks', instructions: 'Slash commands, prompt formulas for realistic images, reverse prompt engineering, and workflow productivity shortcuts.', boundCategoryIds: [3] },
  { id: 4, name: '4. PC & Windows Hacks', instructions: 'Extended format (10-15 scenes, 7-beat, 0.3s anchor). God mode, clipboard history (Win+V), graphics driver reset, speed boosts.', boundCategoryIds: [4] },
  { id: 5, name: '5. New Tech Tutorials', instructions: 'Step-by-step UI walkthrough, zero prior coding knowledge needed, practical product review.', boundCategoryIds: [5] },
  { id: 6, name: '6. Future Tech', instructions: 'Visionary tech breakthroughs, autonomous smart home agents, and positive future outlook.', boundCategoryIds: [6] },
  { id: 7, name: '7. Secrets (WhatsApp, etc.)', instructions: 'Show actual tool in title/topic, hidden shortcuts, date-wise chat search, biometric chat lock.', boundCategoryIds: [7] },
  { id: 8, name: '8. Income & Skills', instructions: 'Passive income ideas, store management, freelance skills, with strict reminder of no income guarantees.', boundCategoryIds: [8] },
  { id: 9, name: '9. YT Automation (16:9)', instructions: '16:9 format mandatory, multi-agent AI script systems, retention optimization, high-CTR storytelling.', boundCategoryIds: [9] },
  { id: 10, name: '10. Custom Search', instructions: 'User-driven search query and research grounding with prioritized external links and web insights.', boundCategoryIds: [10] }
];

export function getScriptRulePresetsForProfile(profile?: any): ScriptPresetItem[] {
  const niche = (profile?.niche || '').toLowerCase();
  const id = (profile?.id || '').toLowerCase();
  if (id.includes('beauty') || niche.includes('beauty') || niche.includes('grooming') || niche.includes('makeup')) {
    return BEAUTY_HUB_SCRIPT_PRESETS;
  }
  return IT_CAFETERIA_SCRIPT_RULE_PRESETS;
}

export function getCategoryRulesForProfile(profile?: any): CategoryRuleItem[] {
  if (!profile || !Array.isArray(profile.categories) || profile.categories.length === 0) {
    return IT_CAFETERIA_10_CATEGORY_RULES;
  }
  return profile.categories.map((cat: any) => {
    const existingRule = profile.categoryRules?.[cat.id];
    return {
      id: cat.id,
      name: `${cat.id}. ${cat.name}`,
      instructions: existingRule?.instructions || `Professional ${profile.name} tutorial on ${cat.name}. Structure: Engaging hook, practical demonstration, common mistakes warning, clear value delivery in Roman Urdu/English mix.`,
      boundCategoryIds: [cat.id]
    };
  });
}

export function loadCustomScriptPresets(channelId: string, profile?: any): ScriptPresetItem[] {
  const defaults = getScriptRulePresetsForProfile(profile);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(`itcafeteria_custom_script_presets_${channelId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaults;
}

export function saveCustomScriptPresets(channelId: string, presets: ScriptPresetItem[]) {
  try {
    localStorage.setItem(`itcafeteria_custom_script_presets_${channelId}`, JSON.stringify(presets));
  } catch {}
}

export function loadCustomCategoryRules(channelId: string, profile?: any): CategoryRuleItem[] {
  const defaults = getCategoryRulesForProfile(profile);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(`itcafeteria_custom_category_rules_${channelId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaults;
}

export function saveCustomCategoryRules(channelId: string, rules: CategoryRuleItem[]) {
  try {
    localStorage.setItem(`itcafeteria_custom_category_rules_${channelId}`, JSON.stringify(rules));
  } catch {}
}

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  baselineTag: 'Active',
  defaultSceneCount: 10,
  duplicateStrictness: 'deep',
  dialectTone: 'workshop',
  lockPersonaAcrossScenes: true,
  autoQueueSync: true,
  flowPromptFormat: 'split_screen',
  scenePresets: DEFAULT_SCENE_PRESETS,
  dialectPresets: DEFAULT_DIALECT_PRESETS,
  stylePresets: DEFAULT_STYLE_PRESETS,
  customInstructions:
    'High-stakes urgent tone in Roman Urdu. Structure: Shocking security/productivity warning or myth reveal, Live proof of why users are at risk, Root cause explanation, 1-Click fix & prevention step, Post-fix verification test, Interactive viewer question, Subscribe CTA.'
};

const STORAGE_KEY = 'itcafeteria_simulator_config_v5';
const LEGACY_STORAGE_KEY = 'itcafeteria_simulator_config_v4';

export function loadSimulatorConfig(): SimulatorConfig {
  if (typeof window === 'undefined') return DEFAULT_SIMULATOR_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SIMULATOR_CONFIG,
        ...parsed,
        dialectTone: parsed.dialectTone || 'workshop',
        flowPromptFormat: parsed.flowPromptFormat || 'split_screen',
        scenePresets: DEFAULT_SCENE_PRESETS,
        dialectPresets: DEFAULT_DIALECT_PRESETS,
        stylePresets: DEFAULT_STYLE_PRESETS
      };
    }
  } catch {}
  return DEFAULT_SIMULATOR_CONFIG;
}

export function saveSimulatorConfig(cfg: SimulatorConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('itcafeteria_simulator_config_updated', { detail: cfg }));
    }
  } catch {}
}

interface SimulatorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulatorConfig;
  onSave: (updated: SimulatorConfig) => void;
  onReset: () => void;
  activeChannelId?: string;
  onChannelChange?: (channelId: string) => void;
}

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  activeChannelId,
  onChannelChange
}) => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(activeChannelId || 'itcafeteria');
  const [local, setLocal] = useState<SimulatorConfig>(config);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [activeRulePattern, setActiveRulePattern] = useState<string>('bug_security');

  // Script Presets (Top row of 4)
  const currentProfile = channels[selectedChannelId] || channels['itcafeteria'];
  const [scriptPresets, setScriptPresets] = useState<ScriptPresetItem[]>(() =>
    loadCustomScriptPresets(selectedChannelId, currentProfile)
  );

  // Category Rules & Multi-Category Binds (Bottom rows)
  const [categoryRules, setCategoryRules] = useState<CategoryRuleItem[]>(() =>
    loadCustomCategoryRules(selectedChannelId, currentProfile)
  );

  // Modal Editing States
  const [editingPreset, setEditingPreset] = useState<ScriptPresetItem | null>(null);
  const [editPresetTitle, setEditPresetTitle] = useState('');
  const [editPresetSubtitle, setEditPresetSubtitle] = useState('');
  const [editPresetInstructions, setEditPresetInstructions] = useState('');

  const [editingCategoryRule, setEditingCategoryRule] = useState<CategoryRuleItem | null>(null);
  const [editCatRuleName, setEditCatRuleName] = useState('');
  const [editCatRuleInstructions, setEditCatRuleInstructions] = useState('');
  const [editCatRuleBoundIds, setEditCatRuleBoundIds] = useState<number[]>([]);

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleInstructions, setNewRuleInstructions] = useState('');
  const [newRuleBoundIds, setNewRuleBoundIds] = useState<number[]>([]);

  // Sync when activeChannelId or config changes
  useEffect(() => {
    const loadedChannels = loadAllChannels();
    setChannels(loadedChannels);
    const targetChannel = activeChannelId || selectedChannelId || 'itcafeteria';
    setSelectedChannelId(targetChannel);
    const eng = getEngineConfigForChannel(targetChannel);
    setLocal({
      ...config,
      baselineTag: eng.baselineTag || config.baselineTag || '@Active',
      defaultSceneCount: eng.defaultSceneCount || config.defaultSceneCount || 10,
      duplicateStrictness: eng.duplicateStrictness || config.duplicateStrictness || 'deep',
      dialectTone: eng.dialectTone || config.dialectTone || 'workshop',
      flowPromptFormat: eng.flowPromptFormat || config.flowPromptFormat || 'split_screen',
      customInstructions: eng.customInstructions || config.customInstructions || ''
    });

    const prof = loadedChannels[targetChannel] || loadedChannels['itcafeteria'];
    setScriptPresets(loadCustomScriptPresets(targetChannel, prof));
    setCategoryRules(loadCustomCategoryRules(targetChannel, prof));
  }, [activeChannelId, isOpen]);

  const handleChannelSelect = (chId: string) => {
    setSelectedChannelId(chId);
    if (onChannelChange) onChannelChange(chId);
    const eng = getEngineConfigForChannel(chId);
    const prof = channels[chId] || (CHANNEL_PROFILES as any)[chId];
    const isBeauty = chId.includes('beauty') || (prof?.niche || '').toLowerCase().includes('beauty');
    const defaultBeautyInstruction = BEAUTY_HUB_SCRIPT_PRESETS[0].instructions;
    const defaultTechInstruction = IT_CAFETERIA_SCRIPT_RULE_PRESETS[0].instructions;

    setLocal((prev) => ({
      ...prev,
      baselineTag: eng.baselineTag || (isBeauty ? '@MZ22-1' : '@Active'),
      defaultSceneCount: eng.defaultSceneCount || 10,
      duplicateStrictness: eng.duplicateStrictness || 'deep',
      dialectTone: eng.dialectTone || (isBeauty ? 'beauty_friendly' : 'workshop'),
      flowPromptFormat: eng.flowPromptFormat || (isBeauty ? 'aesthetic_soft_glam' : 'split_screen'),
      customInstructions: eng.customInstructions || (isBeauty ? defaultBeautyInstruction : defaultTechInstruction)
    }));
    setActiveRulePattern(isBeauty ? 'beauty_10_scene' : '10_scene_short');

    setScriptPresets(loadCustomScriptPresets(chId, prof));
    setCategoryRules(loadCustomCategoryRules(chId, prof));
  };

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      return () => {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  const updateField = <K extends keyof SimulatorConfig>(field: K, value: SimulatorConfig[K]) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
  };

  const handleSave = () => {
    onSave(local);
    saveSimulatorConfig(local);

    // Save dedicated configuration specifically for the selected channel
    saveEngineConfigForChannel(selectedChannelId, {
      baselineTag: local.baselineTag,
      defaultSceneCount: local.defaultSceneCount,
      duplicateStrictness: local.duplicateStrictness,
      dialectTone: local.dialectTone,
      flowPromptFormat: local.flowPromptFormat,
      customInstructions: local.customInstructions,
      lockPersonaAcrossScenes: local.lockPersonaAcrossScenes,
      autoQueueSync: local.autoQueueSync
    });

    setSavedToast('Settings saved successfully!');
    setTimeout(() => {
      setSavedToast(null);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    const fresh = resetEngineConfigForChannel(selectedChannelId);
    setLocal((prev) => ({
      ...prev,
      baselineTag: fresh.baselineTag,
      defaultSceneCount: fresh.defaultSceneCount,
      duplicateStrictness: fresh.duplicateStrictness,
      dialectTone: fresh.dialectTone,
      flowPromptFormat: fresh.flowPromptFormat,
      customInstructions: fresh.customInstructions
    }));
    onReset();
    saveSimulatorConfig(DEFAULT_SIMULATOR_CONFIG);

    const defaultPresets = getScriptRulePresetsForProfile(currentProfile);
    const defaultRules = getCategoryRulesForProfile(currentProfile);
    setScriptPresets(defaultPresets);
    setCategoryRules(defaultRules);
    saveCustomScriptPresets(selectedChannelId, defaultPresets);
    saveCustomCategoryRules(selectedChannelId, defaultRules);
    setSavedToast('Reset to system defaults!');
    setTimeout(() => setSavedToast(null), 2500);
  };

  const selectRulePattern = (preset: ScriptPresetItem) => {
    setActiveRulePattern(preset.id);
    updateField('customInstructions', preset.instructions);
  };

  // Handle Opening Preset Editor
  const startEditPreset = (preset: ScriptPresetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditPresetTitle(preset.title);
    setEditPresetSubtitle(preset.subtitle);
    setEditPresetInstructions(preset.instructions);
  };

  // Save Preset Edit
  const handleSavePresetEdit = () => {
    if (!editingPreset) return;
    const updated = scriptPresets.map((p) =>
      p.id === editingPreset.id
        ? {
            ...p,
            title: editPresetTitle.trim() || p.title,
            subtitle: editPresetSubtitle.trim() || p.subtitle,
            instructions: editPresetInstructions.trim() || p.instructions
          }
        : p
    );
    setScriptPresets(updated);
    saveCustomScriptPresets(selectedChannelId, updated);

    // If currently active preset was edited, update the prompt too!
    if (activeRulePattern === editingPreset.id) {
      updateField('customInstructions', editPresetInstructions.trim() || editingPreset.instructions);
    }

    setEditingPreset(null);
    setSavedToast(`Preset "${editPresetTitle}" saved!`);
    setTimeout(() => setSavedToast(null), 2500);
  };

  // Handle Opening Category Rule & Multi-Bind Editor
  const startEditCategoryRule = (rule: CategoryRuleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategoryRule(rule);
    setEditCatRuleName(rule.name);
    setEditCatRuleInstructions(rule.instructions);
    setEditCatRuleBoundIds(rule.boundCategoryIds && rule.boundCategoryIds.length > 0 ? [...rule.boundCategoryIds] : [Number(rule.id) || 1]);
  };

  // Toggle Category Binding in Multi-Select
  const toggleCategoryBinding = (catId: number) => {
    setEditCatRuleBoundIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId].sort((a, b) => a - b)
    );
  };

  // Save Category Rule Edit & Category Binds
  const handleSaveCategoryRuleEdit = () => {
    if (!editingCategoryRule) return;
    const updated = categoryRules.map((r) =>
      r.id === editingCategoryRule.id
        ? {
            ...r,
            name: editCatRuleName.trim() || r.name,
            instructions: editCatRuleInstructions.trim() || r.instructions,
            boundCategoryIds: editCatRuleBoundIds.length > 0 ? editCatRuleBoundIds : [Number(r.id) || 1]
          }
        : r
    );
    setCategoryRules(updated);
    saveCustomCategoryRules(selectedChannelId, updated);

    setEditingCategoryRule(null);
    setSavedToast(`Category rule & bindings saved for ${editCatRuleBoundIds.length} categories!`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  // Save New Custom Category Rule
  const handleSaveNewCategoryRule = () => {
    if (!newRuleName.trim()) return;
    const nextId = Date.now();
    const newRule: CategoryRuleItem = {
      id: nextId,
      name: newRuleName.trim(),
      instructions: newRuleInstructions.trim() || 'Custom instructions for target categories.',
      boundCategoryIds: newRuleBoundIds.length > 0 ? newRuleBoundIds : [1]
    };
    const updated = [...categoryRules, newRule];
    setCategoryRules(updated);
    saveCustomCategoryRules(selectedChannelId, updated);
    setShowAddRuleModal(false);
    setNewRuleName('');
    setNewRuleInstructions('');
    setNewRuleBoundIds([]);
    setSavedToast(`New rule "${newRule.name}" bound to categories: ${newRule.boundCategoryIds.join(', ')}`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  if (!isOpen) return null;

  const charCount = local.customInstructions.length;
  const wordCount = local.customInstructions.trim() ? local.customInstructions.trim().split(/\s+/).length : 0;
  const currentTolerance = DUPLICATE_TOLERANCE_OPTIONS.find((o) => o.id === local.duplicateStrictness) || DUPLICATE_TOLERANCE_OPTIONS[0];

  // Available categories list for binding
  const availableCategories: Array<{ id: number; name: string }> =
    currentProfile?.categories && Array.isArray(currentProfile.categories) && currentProfile.categories.length > 0
      ? currentProfile.categories
      : [
          { id: 1, name: 'AI & Smart Tech' },
          { id: 2, name: 'AI Workflows' },
          { id: 3, name: 'AI Prompt Hacks' },
          { id: 4, name: 'PC & Windows Hacks' },
          { id: 5, name: 'New Tech Tutorials' },
          { id: 6, name: 'Future Tech' },
          { id: 7, name: 'Secrets (WhatsApp, etc.)' },
          { id: 8, name: 'Income & Skills' },
          { id: 9, name: 'YT Automation (16:9)' },
          { id: 10, name: 'Custom Search' }
        ];

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-blue-950/80 overflow-hidden overscroll-contain text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">Channel Engine Configuration</h3>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  {local.baselineTag || 'Active'}
                </span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono">
                  {currentProfile?.name || 'Channel'} Profile
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Agent Story Engine ke rules, script presets, aur category binds har channel ke mutabiq alag save hote hain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Channel Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-indigo-500/40 shadow-inner">
              <span className="text-[11px] text-slate-400 font-semibold px-1">Channel:</span>
              <select
                value={selectedChannelId}
                onChange={(e) => handleChannelSelect(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {Object.values(channels).map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.presenter})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {savedToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {savedToast}
              </span>
              <button onClick={() => setSavedToast(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Baseline Tag Status */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-white text-xs">Baseline Tag Status</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Current active production baseline for the Multi-Channel Story Engine.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Active
              </span>
              <input
                type="text"
                value={local.baselineTag}
                onChange={(e) => updateField('baselineTag', e.target.value)}
                placeholder="Active"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-400 w-28"
              />
            </div>
          </div>

          {/* Story Generation Parameters */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                Story Generation Parameters
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Scene Count */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold block text-xs">
                    Default Scene Count
                  </label>
                  <span className="text-[11px] text-cyan-400 font-mono">10s / scene</span>
                </div>
                <select
                  value={local.defaultSceneCount}
                  onChange={(e) => updateField('defaultSceneCount', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DEFAULT_SCENE_PRESETS.map((p) => (
                    <option key={p.id} value={p.count}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculation: Har scene theek 10 second ka hai. 18 scenes = 3 min, 30 scenes = 5 min.
                </p>
              </div>

              {/* Duplicate Check Tolerance */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold block text-xs">
                    Duplicate Check Tolerance
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono">Sub-Point Verification</span>
                </div>
                <select
                  value={local.duplicateStrictness}
                  onChange={(e) => updateField('duplicateStrictness', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DUPLICATE_TOLERANCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {currentTolerance.desc}
                </p>
              </div>

              {/* Dialect & Cadence */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 text-xs">
                  Dialect &amp; Cadence
                </label>
                <select
                  value={local.dialectTone}
                  onChange={(e) => updateField('dialectTone', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DEFAULT_DIALECT_PRESETS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flow Prompt Script Style */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 text-xs">
                  Flow Prompt Script Style
                </label>
                <select
                  value={local.flowPromptFormat}
                  onChange={(e) => updateField('flowPromptFormat', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {DEFAULT_STYLE_PRESETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox: Auto-save to Queue & Calendar */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={local.autoQueueSync}
                  onChange={(e) => updateField('autoQueueSync', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 h-4 w-4 cursor-pointer"
                />
                <span className="text-xs">
                  Generate hote hi kahani ko Target Queue aur Content Calendar mein auto-save karein
                </span>
              </label>
            </div>
          </div>

          {/* Agent Script Rules & Prompt Instructions */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Agent Script Rules &amp; Prompt Instructions
                </h4>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">
                Click any preset to apply, or click Edit to modify prompts:
              </span>
            </div>

            {/* Row 1: 4 Script Presets with Individual Edit Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-[11px] font-semibold">
                  Script Presets (Click card to load • Click ✏️ Edit to modify):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {scriptPresets.map((preset) => {
                  const isActive = activeRulePattern === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => selectRulePattern(preset)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="font-bold text-white text-xs line-clamp-1 pr-1">{preset.title}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => startEditPreset(preset, e)}
                            className="p-1 rounded-md bg-slate-800/80 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
                            title={`Edit "${preset.title}" Preset`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{preset.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2 & 3: Category-Specific Script Rules & Multi-Category Binding */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {categoryRules.length} Category-Specific Script Rules &amp; Multi-Category Binds ({currentProfile?.name || 'Channel'}):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewRuleName('');
                      setNewRuleInstructions('');
                      setNewRuleBoundIds([1]);
                      setShowAddRuleModal(true);
                    }}
                    className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Custom Rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getCategoryRulesForProfile(currentProfile);
                      setCategoryRules(defaults);
                      saveCustomCategoryRules(selectedChannelId, defaults);
                      setSavedToast('Category rules reset to default mappings.');
                      setTimeout(() => setSavedToast(null), 2500);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset category rules and bindings to defaults"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset Binds</span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Click any card to apply prompt instructions. Click <strong>Edit &amp; Bind</strong> to modify the rule or bind 1 rule to multiple categories (e.g. 2, 3 or more categories ek sath bind karein).
              </p>

              {/* Grid of Category Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                {categoryRules.map((catRule) => {
                  const boundCount = catRule.boundCategoryIds?.length || 0;
                  const boundLabels = (catRule.boundCategoryIds || []).map((id) => `Cat ${id}`).join(', ');

                  return (
                    <div
                      key={catRule.id}
                      onClick={() => {
                        updateField('customInstructions', catRule.instructions);
                        setSavedToast(`Applied rule: "${catRule.name}" (Bound to: ${boundLabels || 'Category ' + catRule.id})`);
                        setTimeout(() => setSavedToast(null), 2500);
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 transition-all cursor-pointer text-left relative group flex flex-col justify-between"
                      title={`Click to apply rule: ${catRule.name}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="font-bold text-cyan-200 text-[11px] truncate">{catRule.name}</div>
                          <button
                            type="button"
                            onClick={(e) => startEditCategoryRule(catRule, e)}
                            className="p-1 rounded bg-slate-800/90 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-colors shrink-0 cursor-pointer"
                            title={`Edit rule and bind categories: ${catRule.name}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{catRule.instructions}</p>
                      </div>

                      {/* Bound Categories Strip */}
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px]">
                        <span className="font-mono text-indigo-300 truncate" title={`Bound: ${boundLabels}`}>
                          🔗 {boundCount > 1 ? `${boundCount} Binds (${boundLabels})` : boundLabels || `Cat ${catRule.id}`}
                        </span>
                        <span className="text-slate-500 group-hover:text-cyan-400 transition-colors font-semibold">
                          Apply
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Instructions Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400 font-mono">
                <span>Active Prompt Instructions for AI Story Engine:</span>
                <span>{charCount} chars • {wordCount} words</span>
              </div>
              <textarea
                value={local.customInstructions}
                onChange={(e) => updateField('customInstructions', e.target.value)}
                rows={4}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-cyan-400 resize-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Engine Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: Edit Script Preset (Row 1 of 4 Cards) */}
      {editingPreset && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white text-sm">Edit Script Preset ({editingPreset.title})</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Preset Title</label>
                <input
                  type="text"
                  value={editPresetTitle}
                  onChange={(e) => setEditPresetTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Subtitle / Quick Summary</label>
                <input
                  type="text"
                  value={editPresetSubtitle}
                  onChange={(e) => setEditPresetSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Prompt Instructions Template</label>
                <textarea
                  value={editPresetInstructions}
                  onChange={(e) => setEditPresetInstructions(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePresetEdit}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preset Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Edit Category Rule & Multi-Category Binding */}
      {editingCategoryRule && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-5 shadow-2xl space-y-4 text-xs text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Edit Rule &amp; Bind to Multiple Categories</h4>
                  <p className="text-[11px] text-slate-400">
                    Ek hi rule ko aap 2, 3 ya ziada categories ke sath bind kar sakte hain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategoryRule(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Name / Module Title</label>
                <input
                  type="text"
                  value={editCatRuleName}
                  onChange={(e) => setEditCatRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Prompt Instructions</label>
                <textarea
                  value={editCatRuleInstructions}
                  onChange={(e) => setEditCatRuleInstructions(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>

              {/* Multi-Category Binding Checklist */}
              <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bind this Rule to Categories (Select all that apply):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCatRuleBoundIds(availableCategories.map((c) => c.id))}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setEditCatRuleBoundIds([])}
                      className="text-[10px] text-slate-400 hover:text-white font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Currently bound to <strong>{editCatRuleBoundIds.length}</strong> categories. In categories par yeh rule auto-apply hoga:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                  {availableCategories.map((cat) => {
                    const isChecked = editCatRuleBoundIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => toggleCategoryBinding(cat.id)}
                        className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by label onClick
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 h-3.5 w-3.5"
                        />
                        <span className="font-mono text-cyan-300 font-bold shrink-0">#{cat.id}</span>
                        <span className="truncate text-xs">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 shrink-0">
              <span className="text-[10px] font-mono text-slate-400">
                Bound: {editCatRuleBoundIds.length > 0 ? editCatRuleBoundIds.map((id) => `#${id}`).join(', ') : 'None'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategoryRule(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategoryRuleEdit}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Rule &amp; Category Binds</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Add New Custom Category Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-5 shadow-2xl space-y-4 text-xs text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Naya Category Script Rule Shamil Karein</h4>
                  <p className="text-[11px] text-slate-400">
                    Naya rule banayein aur ek ya ziada categories ke sath bind karein.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. AI Video & Automation Master Rule"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Script &amp; Prompt Instructions</label>
                <textarea
                  placeholder="Detailed multi-scene instructions for this category group..."
                  value={newRuleInstructions}
                  onChange={(e) => setNewRuleInstructions(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                />
              </div>

              {/* Multi-Category Binding Selection */}
              <div className="p-3.5 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Categories to Bind:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRuleBoundIds(availableCategories.map((c) => c.id))}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setNewRuleBoundIds([])}
                      className="text-[10px] text-slate-400 hover:text-white font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
                  {availableCategories.map((cat) => {
                    const isChecked = newRuleBoundIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        onClick={() => {
                          setNewRuleBoundIds((prev) =>
                            prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id].sort((a, b) => a - b)
                          );
                        }}
                        className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400 h-3.5 w-3.5"
                        />
                        <span className="font-mono text-cyan-300 font-bold shrink-0">#{cat.id}</span>
                        <span className="truncate text-xs">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewCategoryRule}
                disabled={!newRuleName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create &amp; Bind Rule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
