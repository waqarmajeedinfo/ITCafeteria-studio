import type { ScriptProviderId } from './scriptModelProviders';

export type UgcAspectRatio = '9:16' | '16:9' | '1:1';

export type UgcAdFormat =
  | 'ugc_creator_haul'
  | 'skincare_liquid_formation'
  | 'footwear_sole_drop'
  | 'luxury_watch_macro'
  | 'restaurant_menu_3d'
  | 'fast_assembly_reveal';

export type UgcLanguage =
  | 'Roman Urdu (Pakistani Creator)'
  | 'English (Global Commercial)'
  | 'Urdu + English Mix'
  | 'Arabic (Gulf Luxury)';

export type UgcCampaignGoal =
  | 'Conversion & Direct Sales'
  | 'Product Launch Reveal'
  | 'TikTok / Reels Viral Hook'
  | 'Brand Awareness & Trust'
  | 'Client Agency Pitch Demo';

export type UgcModelMode = 'upload' | 'ai_generate' | 'product_only';

export type UgcCaptionMode = 'bold_hook' | 'clean_subtitles' | 'no_text';

export interface UgcProductAnalysis {
  category: string;
  productName: string;
  brandName: string;
  material: string;
  colorPalette: string[];
  colorNames: string;
  brandingAndText: string;
  silhouetteAndProportions: string;
  keyVisualFeatures: string[];
  recommendedOpening: string;
  realityLockDirective: string;
  summaryRomanUrdu: string;
  analyzedAt: string;
}

export interface UgcModelAnalysis {
  subjectType: string;
  skinToneAndRealism: string;
  hairAndStyling: string;
  outfitAndFabricPhysics: string;
  poseAndFraming: string;
  compatibilityNotes: string;
  faceIdentityLockRule: string;
  summaryRomanUrdu: string;
  analyzedAt: string;
}

export type UgcSceneVisualFocus =
  | 'product_hero'
  | 'product_macro'
  | 'model_avatar'
  | 'split_model_product'
  | 'reveal_lockup';

export interface UgcScenePlan {
  sceneNumber: number;
  title: string;
  durationSec: number;
  timeRange: string;
  visualFocus: UgcSceneVisualFocus;
  cameraMovement: string;
  lightingStyle: string;
  characterAction: string;
  productInteraction: string;
  voiceoverLine: string;
  onScreenHook: string;
  negativeConstraints: string;
  veo3PromptFormatted: string;
}

export interface UgcFastAssemblyJson {
  description: string;
  style: string;
  camera: string;
  lighting: string;
  environment: string;
  elements: string[];
  motion: string;
  ending: string;
  text: string;
  keywords: string[];
}

export interface UgcStoryboardResult {
  campaignTitle: string;
  openingSignature: string;
  totalDurationSec: number;
  aspectRatio: UgcAspectRatio;
  language: UgcLanguage;
  scenes: UgcScenePlan[];
  fastAssemblyJson?: UgcFastAssemblyJson;
  fullFormattedOutput: string;
  masterNegativePrompt: string;
  strategyNotesRomanUrdu: string;
  providerUsed?: string;
  modelUsed?: string;
  failoverUsed?: boolean;
}

export interface UgcCampaignSettings {
  brandName: string;
  productDetails: string;
  uspOffer: string;
  desiredEnvironment: string;
  callToAction: string;
  campaignGoal: UgcCampaignGoal;
  adFormat: UgcAdFormat;
  language: UgcLanguage;
  totalDurationSec: number;
  aspectRatio: UgcAspectRatio;
  modelMode: UgcModelMode;
  avatarPromptSpec: string;
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon';
  voiceStyle: string;
  enableVoiceover: boolean;
  captionMode: UgcCaptionMode;
  audioBedMood: 'upbeat_ugc' | 'luxury_minimal' | 'kinetic_bass' | 'none';
  customNegativeConstraints: string;
  scriptProvider?: ScriptProviderId;
  scriptModel?: string;
  autoFailover?: boolean;
}

export interface UgcSavedCampaign {
  id: string;
  title: string;
  clientName: string;
  settings: UgcCampaignSettings;
  productAnalysis?: UgcProductAnalysis | null;
  modelAnalysis?: UgcModelAnalysis | null;
  storyboard?: UgcStoryboardResult | null;
  lastVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UgcFormatMeta {
  id: UgcAdFormat;
  label: string;
  openingRule: string;
  defaultDuration: number;
  hint: string;
}

export const UGC_AD_FORMATS: UgcFormatMeta[] = [
  {
    id: 'ugc_creator_haul',
    label: 'Creator UGC & Outfit/Product Haul',
    openingRule: 'Direct-to-camera energetic hook with product held naturally in frame',
    defaultDuration: 15,
    hint: 'Best for fashion hauls, beauty creators, TikTok/Reels & brand endorsements.',
  },
  {
    id: 'skincare_liquid_formation',
    label: 'Skincare Liquid Formation Reveal',
    openingRule: '2.5-3s Liquid Formation Effect materializing the exact serum/bottle',
    defaultDuration: 12,
    hint: 'Inspired by luxury cosmetic launches: fluid ribbons -> macro glass -> hero finish.',
  },
  {
    id: 'footwear_sole_drop',
    label: 'Footwear Sole Drop & Stride',
    openingRule: '1.5s Signature Sole Drop vertical impact -> macro weave -> forward stride',
    defaultDuration: 12,
    hint: 'Precision footwear campaign: sole compression, lace macro, and lower-leg stride.',
  },
  {
    id: 'luxury_watch_macro',
    label: 'Luxury Watch Hyper-Kinetic Macro',
    openingRule: 'Extreme macro push-in with whip-pan speed ramps & 3 strategic freezes',
    defaultDuration: 10,
    hint: 'Sharp dial/crown macro exploration, controlled motion blur, zero 360 spin.',
  },
  {
    id: 'restaurant_menu_3d',
    label: 'Restaurant Menu 3D Emergence',
    openingRule: 'Exact printed menu card -> 3D plated dishes emerge with physical steam/sheen',
    defaultDuration: 12,
    hint: 'Menu stays untouched underneath while 3-4 signature dishes rise in 3D realism.',
  },
  {
    id: 'fast_assembly_reveal',
    label: 'Fast-Assembly JSON Reveal Spot',
    openingRule: 'Magical fast-assembly build-up from empty space to final brand tableau',
    defaultDuration: 10,
    hint: 'Generates both Scene Prompts and pure JSON Veo 3 Fast-Assembly specification.',
  },
];

export const DEFAULT_UGC_SETTINGS: UgcCampaignSettings = {
  brandName: '',
  productDetails: '',
  uspOffer: '',
  desiredEnvironment: 'Modern sunlit lifestyle interior with soft architectural depth',
  callToAction: 'Shop Now · Limited Launch Offer',
  campaignGoal: 'Conversion & Direct Sales',
  adFormat: 'ugc_creator_haul',
  language: 'Roman Urdu (Pakistani Creator)',
  totalDurationSec: 15,
  aspectRatio: '9:16',
  modelMode: 'upload',
  avatarPromptSpec:
    'Realistic Gen-Z South Asian creator, natural skin texture with visible pores, authentic hair strands, studio-grade indoor daylight',
  voiceName: 'Kore',
  voiceStyle:
    'Energetic, authentic UGC brand creator speaking warmly in natural conversational tone, clear diction, high retention pacing',
  enableVoiceover: true,
  captionMode: 'bold_hook',
  audioBedMood: 'upbeat_ugc',
  customNegativeConstraints:
    'blurry, deformed hands, extra fingers, floating objects, warped fabric, distorted brand logo, redesigned product, plastic skin, watermark, unrelated text overlays',
  scriptProvider: 'auto',
  scriptModel: 'gemini-4-hydrogen',
  autoFailover: true,
};
