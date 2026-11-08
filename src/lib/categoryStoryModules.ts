/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Category Story Modules & Flow Script Engine
 * Single Source of Truth for Per-Category Story Generation and Google Flow Directing.
 * Backed by /public/assets/aistudio/category_story_modules_e99f6e60.json.
 */

import categoryModulesData from '../data/category_story_modules.json';

export interface CategoryFlowScriptRules {
  camera: string;
  lighting_and_set: string;
  presenter_action: string;
  hologram: string;
}

export interface CategoryStoryModule {
  id: number;
  name: string;
  short_name?: string;
  type: 'standard_tutorial' | 'ongoing_series' | 'ideas_only' | 'lecture_series' | 'custom' | string;
  in_daily_rotation: boolean;
  aspect_ratio: '9:16' | '16:9' | string;
  story_angle: string;
  topic_sources: string[];
  story_beats: string[] | string;
  visual_mode: string;
  flow_script_rules: CategoryFlowScriptRules | string;
  dialogue_tone: string;
  hook_style?: string;
  cta_style?: string;
  thumbnail_style?: string;
  duplicate_check_scope?: string;
  series?: any;
  open_item?: string;
}

export interface GlobalStoryRules {
  language: string;
  scene_duration_seconds: number;
  default_scenes: number;
  dialogue_words_per_scene: string;
  dialogue_style: string[];
  no_invented_numbers: string;
  free_first: string;
  ai_disclosure: string;
  upload_package_after_final_scene: string[];
}

export interface VisualSignature {
  storyId?: string;
  title: string;
  categoryId: number;
  timestamp: number;
  cameraMovement: string;
  lightingScheme: string;
  backgroundSet: string;
  hologramUsed: 'yes' | 'no';
  presenterPose: string;
  openingLine: string;
}

export const GLOBAL_RULES: GlobalStoryRules = categoryModulesData.global_rules as GlobalStoryRules;
export const ANTI_REPETITION_CONFIG = categoryModulesData.anti_repetition;
export const CATEGORY_MODULES: CategoryStoryModule[] = categoryModulesData.categories as CategoryStoryModule[];

export const SECRETS_16_APPS = [
  'WhatsApp',
  'Google Chrome',
  'Google Maps',
  'Gmail',
  'Google Drive',
  'Google Play Store',
  'YouTube',
  'Instagram',
  'Facebook',
  'TikTok',
  'Telegram',
  'Windows',
  'ChatGPT',
  'Google Gemini',
  'CapCut',
  'Google'
];

/**
 * Loads a category module strictly by numeric ID (1-10).
 * Never parses or splits category names on commas.
 */
export function getCategoryModule(categoryId: number | string): CategoryStoryModule {
  const numericId = typeof categoryId === 'number' ? categoryId : parseInt(String(categoryId).replace(/\D/g, ''), 10) || 1;
  const found = CATEGORY_MODULES.find((c) => c.id === numericId);
  if (found) return found;

  // Fallback if ID > 10 or invalid
  return CATEGORY_MODULES[0];
}

/**
 * Resolves effective module for Category 10 (Custom) by matching seed topic to Categories 1-8.
 */
export function resolveEffectiveCategory(categoryId: number | string, seedTopic = ''): CategoryStoryModule {
  const baseModule = getCategoryModule(categoryId);
  if (baseModule.id !== 10) return baseModule;

  const lower = seedTopic.toLowerCase();
  let matchId = 1;
  if (lower.includes('chatgpt') || lower.includes('claude') || lower.includes('bot') || lower.includes('workflow')) matchId = 2;
  else if (lower.includes('prompt') || lower.includes('shortcut')) matchId = 3;
  else if (lower.includes('windows') || lower.includes('pc') || lower.includes('cmd') || lower.includes('powershell')) matchId = 4;
  else if (lower.includes('launch') || lower.includes('product') || lower.includes('review')) matchId = 5;
  else if (lower.includes('future') || lower.includes('breakthrough') || lower.includes('quantum')) matchId = 6;
  else if (lower.includes('secret') || lower.includes('hidden') || SECRETS_16_APPS.some((app) => lower.includes(app.toLowerCase()))) matchId = 7;
  else if (lower.includes('income') || lower.includes('earn') || lower.includes('skill')) matchId = 8;

  const matched = getCategoryModule(matchId);
  return {
    ...baseModule,
    story_beats: matched.story_beats,
    flow_script_rules: matched.flow_script_rules,
    visual_mode: matched.visual_mode,
    dialogue_tone: matched.dialogue_tone,
  };
}

/**
 * Builds the ordered sequence of story beats for any duration / scene count.
 * Keeps Hook (beat 0) first and CTA (last beat) last.
 */
export function getBeatsForCategory(categoryId: number, totalScenes = 10, seedTopic = ''): string[] {
  const mod = resolveEffectiveCategory(categoryId, seedTopic);
  const rawBeats = Array.isArray(mod.story_beats) ? mod.story_beats : [];
  if (rawBeats.length === 0) {
    return Array.from({ length: totalScenes }, (_, i) =>
      i === 0 ? 'Hook' : i === totalScenes - 1 ? 'CTA' : `Step ${i}`
    );
  }

  const hookBeat = rawBeats[0];
  const ctaBeat = rawBeats[rawBeats.length - 1];
  const middleBeats = rawBeats.slice(1, -1);

  if (totalScenes <= 2) {
    return [hookBeat, ctaBeat].slice(0, totalScenes);
  }

  if (totalScenes === rawBeats.length) {
    return [...rawBeats];
  }

  const targetMiddleCount = totalScenes - 2;
  const resultMiddles: string[] = [];

  if (targetMiddleCount <= middleBeats.length) {
    // Subsample middle beats evenly
    for (let i = 0; i < targetMiddleCount; i++) {
      const idx = Math.floor((i * middleBeats.length) / targetMiddleCount);
      resultMiddles.push(middleBeats[idx]);
    }
  } else {
    // Stretch middle beats
    for (let i = 0; i < targetMiddleCount; i++) {
      const idx = i % middleBeats.length;
      const count = Math.floor(i / middleBeats.length) + 1;
      const base = middleBeats[idx];
      resultMiddles.push(count > 1 ? `${base} (Part ${count})` : base);
    }
  }

  return [hookBeat, ...resultMiddles, ctaBeat];
}

/**
 * Rotates apps for Category 7 (Secrets) so it never repeats the same app consecutively
 * and never defaults to WhatsApp.
 */
export function getNextSecretsApp(recentTitles: string[] = []): string {
  const recentLower = recentTitles.map((t) => t.toLowerCase()).join(' ');

  // Find apps that have NOT been covered recently
  for (const app of SECRETS_16_APPS) {
    // Skip WhatsApp if it was covered recently
    if (app === 'WhatsApp' && recentLower.includes('whatsapp')) continue;
    if (!recentLower.includes(app.toLowerCase())) {
      return app;
    }
  }

  // If all covered, pick the one least recently mentioned or second app in list
  return SECRETS_16_APPS[1]; // 'Google Chrome'
}

/**
 * Builds a clean, category-specific Flow script for a single scene without any boilerplate.
 * Incorporates camera, lighting_and_set, presenter_action, and hologram from category rules.
 */
export function buildCategoryFlowScript(params: {
  categoryId: number;
  sceneNum: number;
  totalScenes: number;
  beatPurpose?: string;
  visual?: string;
  dialogue?: string;
  tag?: string;
  presenter?: string;
  seedTopic?: string;
  variationIndex?: number; // Used for anti-repetition regeneration
}): string {
  const {
    categoryId,
    sceneNum,
    totalScenes,
    beatPurpose = `Scene ${sceneNum}`,
    visual = 'Tech demonstration on screen.',
    dialogue = '',
    tag = '@WM25-1',
    presenter = 'Waqar Majeed',
    seedTopic = '',
    variationIndex = 0,
  } = params;

  const mod = resolveEffectiveCategory(categoryId, seedTopic);
  const rules = typeof mod.flow_script_rules === 'object' ? mod.flow_script_rules : {
    camera: 'Smooth tracking camera with clear focal framing.',
    lighting_and_set: 'Modern clean studio with subtle ambient edge glow.',
    presenter_action: 'Natural explaining gestures.',
    hologram: 'Not used.'
  };

  const isHook = sceneNum === 1;
  const isCTA = sceneNum === totalScenes;
  const isFaceless = !tag || tag === 'No-Character' || tag.toLowerCase().includes('faceless');

  // Variations to satisfy anti-repetition when regenerating
  const cameraAngleVariations = [
    'Front-facing medium shot with subtle focal breathing',
    'Eye-level 15-degree side framing with crisp focus on demonstration',
    'Over-shoulder perspective angled towards the active display',
    'Slight low-angle dynamic shot highlighting clarity and precision',
    'Centered stable anchor framing with soft depth of field'
  ];
  const cameraVariation = cameraAngleVariations[(sceneNum + variationIndex) % cameraAngleVariations.length];

  // Lighting variations
  const lightingVariations = [
    'Clean high-CRI key light with soft monitor fill',
    'Natural warm studio ambient light with subtle cool edge separation',
    'Balanced 5600K creator desk illumination with dark accent backdrop',
    'Crisp daylight key lighting with minimal shadow contrast',
    'Subtle amber and cyan dual-tone studio lighting'
  ];
  const lightingVariation = lightingVariations[(sceneNum + variationIndex) % lightingVariations.length];

  let cameraAndLighting = '';
  let presenterAction = '';
  let sceneVisualAndProps = visual.trim();

  // Category-specific directing logic adhering strictly to flow_script_rules & visual_mode
  switch (mod.id) {
    case 2: // AI Chatbots, Workflows & AI Tools (Demonstration mode)
      if (isHook) {
        cameraAndLighting = `Medium shot framing ${tag} at clean desk setup with dual monitors. ${lightingVariation}. Camera executes a gentle snap to monitor screen.`;
        presenterAction = `${tag} (${presenter}) points forward toward the primary display, speaking with enthusiastic curiosity.`;
        sceneVisualAndProps = `${sceneVisualAndProps} On screen: High-speed workflow timer showing drastic time-saving metric.`;
      } else if (isCTA) {
        cameraAndLighting = `Medium shot of ${tag} at creator workstation. ${lightingVariation}. Smooth slow pullback revealing complete workspace.`;
        presenterAction = `${tag} (${presenter}) delivers friendly closing invitation with open-hand gesture, asking comment question.`;
        sceneVisualAndProps = `${sceneVisualAndProps} Animated follow & bookmark reminder card pinned on side.`;
      } else {
        cameraAndLighting = `Full-screen screen-recording framing with high-contrast UI focus. Smooth cursor zoom-in tracking the exact configuration button.`;
        presenterAction = `Full-screen software interface walkthrough with clear ${tag} voiceover. Zero robotic cadence.`;
        sceneVisualAndProps = `Screen Demo: ${sceneVisualAndProps} Live mouse cursor moves with precision to toggle settings. (Holograms strictly disabled).`;
      }
      break;

    case 3: // AI Prompt Hacks & Shortcuts
      if (isHook || isCTA) {
        cameraAndLighting = `Crisp eye-level shot at minimal creator desk. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) compares two prompt outputs side-by-side, nodding with approval.`;
      } else {
        cameraAndLighting = `Split-view display layout. Static framing with high legibility for prompt text on left and generated output on right.`;
        presenterAction = `Voiceover by ${tag} (${presenter}) explaining the prompt syntax difference clearly.`;
        sceneVisualAndProps = `Split screen: Weak prompt vs. optimized prompt formula. Output visual renders in real-time.`;
      }
      break;

    case 4: // PC & Windows Hacks
      if (isHook) {
        cameraAndLighting = `Practical PC desk setup with mechanical keyboard and ultrawide monitor. ${lightingVariation}. Camera glides in from front-right.`;
        presenterAction = `${tag} (${presenter}) gestures toward the screen highlighting a relatable PC bottleneck.`;
      } else if (isCTA) {
        cameraAndLighting = `Medium eye-level shot at workstation. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) gives confident thumbs-up with next part teaser.`;
      } else {
        cameraAndLighting = `Full-screen Windows 11 screen recording. Smooth macro zoom-in on terminal / PowerShell / settings dialog with magnified text cursor.`;
        presenterAction = `Full-screen Windows walkthrough with authoritative ${tag} voiceover. Clear pace, careful safety guidance.`;
        sceneVisualAndProps = `Windows Interface: ${sceneVisualAndProps} Live execution shown step-by-step with zero fluff.`;
      }
      break;

    case 7: // Secrets (16 Apps)
      if (isHook) {
        cameraAndLighting = `Casual bright desk, smartphone held prominently in hand. ${lightingVariation}. Camera executes quick rack focus from presenter to phone screen.`;
        presenterAction = `${tag} (${presenter}) holds phone displaying instant secret preview, leaning in with insider secret energy.`;
        sceneVisualAndProps = `Instant Phone-Screen Proof: Live phone display showing the hidden menu reveal in real-time.`;
      } else if (isCTA) {
        cameraAndLighting = `Approachable medium close-up of ${tag} holding phone at desk. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) smiles warmly and asks high-engagement comment question while tapping phone screen.`;
      } else {
        cameraAndLighting = `Vertical 9:16 mobile phone screen recording with animated glowing circular finger tap highlights. Quick zoom into exact hidden submenu.`;
        presenterAction = `App walkthrough with ${tag} voiceover. Natural conversational Urdu, zero pause.`;
        sceneVisualAndProps = `Mobile App Interface: ${sceneVisualAndProps} Clear step-by-step navigation path highlighted with tap rings.`;
      }
      break;

    case 8: // Income & Skills: Tools That Earn (Ideas Only)
      cameraAndLighting = `Warm medium shot in friendly studio. ${lightingVariation}. Soft depth of field with clean creator background.`;
      presenterAction = `${tag} (${presenter}) uses conversational, encouraging gestures, explaining practical skills realistically without income guarantees.`;
      sceneVisualAndProps = `Presenter-led storytelling. Clean graphic idea card appears smoothly on side displaying: ${sceneVisualAndProps}`;
      break;

    case 9: // YT Automation (Lecture Series)
      cameraAndLighting = `Stable 16:9 widescreen instructor framing. Bright classroom or lecture studio setting with whiteboard / slide display area.`;
      presenterAction = `${tag} (${presenter}) stands as professional instructor, pointing toward structured lecture slides.`;
      sceneVisualAndProps = `Lecture Slide & Demo: ${sceneVisualAndProps} Clear bullet points and tool diagrams.`;
      break;

    default: // Cat 1, 5, 6, 10
      if (isHook || isCTA) {
        cameraAndLighting = `${cameraVariation}. ${lightingVariation}. Aspect ratio: ${mod.aspect_ratio}.`;
        presenterAction = `${tag} (${presenter}) in modern tech studio, engaged posture and natural explaining gestures.`;
      } else {
        cameraAndLighting = `Dynamic focal transition between ${tag} and active concept visual. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) gestures toward the display, delivering clear step-by-step insight.`;
      }
      break;
  }

  // Final assembly - STRICTLY compliant with Google Flow format, NO old boilerplate sentence
  return `[DIRECTOR CAMERA & LIGHTING]: ${cameraAndLighting} Duration: 0-10s.
[SCENE VISUAL & PROPS]: ${sceneVisualAndProps}
[PRESENTER & ACTION]: ${presenterAction}
DIALOGUE: "${dialogue.trim()}"`;
}

/**
 * Extracts a 6-field visual signature from a story for anti-repetition auditing.
 */
export function extractVisualSignature(story: any, categoryId: number): VisualSignature {
  const scenes = Array.isArray(story.scenes) ? story.scenes : [];
  const firstScene = scenes[0] || {};
  const firstScript = String(firstScene.script || '');

  // Extract camera movement
  const cameraMatch = firstScript.match(/\[DIRECTOR CAMERA & LIGHTING\]:\s*([^.\n]+)/i);
  const cameraMovement = cameraMatch ? cameraMatch[1].trim().slice(0, 50) : 'Standard medium shot';

  // Extract lighting
  let lightingScheme = 'Balanced studio light';
  if (firstScript.toLowerCase().includes('monitor glow')) lightingScheme = 'Monitor glow & clean fill';
  else if (firstScript.toLowerCase().includes('amber')) lightingScheme = 'Amber and warm studio fill';
  else if (firstScript.toLowerCase().includes('high-cri') || firstScript.toLowerCase().includes('daylight')) lightingScheme = 'Crisp daylight key lighting';
  else if (firstScript.toLowerCase().includes('5600k')) lightingScheme = 'Balanced 5600K creator desk';

  // Extract background / set
  let backgroundSet = 'Clean creator workstation';
  if (categoryId === 7 || firstScript.toLowerCase().includes('phone')) backgroundSet = 'Casual bright desk with smartphone';
  else if (categoryId === 4 || firstScript.toLowerCase().includes('pc desk')) backgroundSet = 'PC desk with ultrawide display';
  else if (categoryId === 9 || firstScript.toLowerCase().includes('classroom')) backgroundSet = 'Classroom lecture studio';
  else if (categoryId === 8 || firstScript.toLowerCase().includes('warm')) backgroundSet = 'Warm friendly studio';

  // Check hologram usage
  const hologramUsed: 'yes' | 'no' = firstScript.toLowerCase().includes('hologram') && !firstScript.toLowerCase().includes('hologram: not used') ? 'yes' : 'no';

  // Extract presenter pose
  let presenterPose = 'Natural conversational hand gestures';
  if (firstScript.toLowerCase().includes('lean-in') || firstScript.toLowerCase().includes('phone held')) presenterPose = 'Holding phone close, leaning in';
  else if (firstScript.toLowerCase().includes('points forward') || firstScript.toLowerCase().includes('points toward')) presenterPose = 'Pointing forward toward screen';
  else if (firstScript.toLowerCase().includes('compares two prompt')) presenterPose = 'Comparing two prompt outputs';
  else if (firstScript.toLowerCase().includes('thumbs-up')) presenterPose = 'Confident thumbs-up gesture';

  // Extract opening line of Flow script (first 8 words)
  const openingWords = firstScript.replace(/\[DIRECTOR CAMERA & LIGHTING\]:\s*/i, '').split(/\s+/).slice(0, 8).join(' ');

  return {
    storyId: story.id || `story-${Date.now()}`,
    title: story.title || 'Untitled Story',
    categoryId,
    timestamp: Date.now(),
    cameraMovement,
    lightingScheme,
    backgroundSet,
    hologramUsed,
    presenterPose,
    openingLine: openingWords || 'Director prompt opening line',
  };
}

/**
 * Checks if a new signature differs from each of the last 3 in at least 3 of the 6 fields.
 */
export function checkAntiRepetition(
  newSig: VisualSignature,
  history: VisualSignature[]
): { passes: boolean; diffDetails: Array<{ index: number; diffCount: number; failing: boolean }> } {
  const recent3 = history.slice(-3);
  if (recent3.length === 0) {
    return { passes: true, diffDetails: [] };
  }

  const diffDetails = recent3.map((prev, index) => {
    let diffCount = 0;
    if (newSig.cameraMovement.toLowerCase() !== prev.cameraMovement.toLowerCase()) diffCount++;
    if (newSig.lightingScheme.toLowerCase() !== prev.lightingScheme.toLowerCase()) diffCount++;
    if (newSig.backgroundSet.toLowerCase() !== prev.backgroundSet.toLowerCase()) diffCount++;
    if (newSig.hologramUsed !== prev.hologramUsed) diffCount++;
    if (newSig.presenterPose.toLowerCase() !== prev.presenterPose.toLowerCase()) diffCount++;
    if (newSig.openingLine.toLowerCase() !== prev.openingLine.toLowerCase()) diffCount++;

    return {
      index,
      diffCount,
      failing: diffCount < 3,
    };
  });

  const passes = diffDetails.every((d) => !d.failing);
  return { passes, diffDetails };
}

const STORAGE_KEY_VISUAL_HISTORY = 'itcafeteria_story_visual_signatures_v1';

export function loadVisualSignatureHistory(): VisualSignature[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISUAL_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(-5);
    }
  } catch {}
  return [];
}

export function saveVisualSignatureToHistory(sig: VisualSignature): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const history = loadVisualSignatureHistory();
    history.push(sig);
    const trimmed = history.slice(-5);
    localStorage.setItem(STORAGE_KEY_VISUAL_HISTORY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Validates and transforms a story package, enforcing category Flow rules and anti-repetition.
 */
export function processAndEnforceCategoryStory(
  story: any,
  categoryId: number,
  tag = '@WM25-1',
  presenter = 'Waqar Majeed'
): { story: any; signature: VisualSignature; passesAntiRepetition: boolean } {
  const totalScenes = Array.isArray(story.scenes) ? story.scenes.length : 10;
  const history = loadVisualSignatureHistory();

  let variation = 0;
  let rebuiltScenes = (story.scenes || []).map((s: any, idx: number) => {
    const script = buildCategoryFlowScript({
      categoryId,
      sceneNum: idx + 1,
      totalScenes,
      beatPurpose: s.purpose || `Scene ${idx + 1}`,
      visual: s.visual || '',
      dialogue: s.dialogue || '',
      tag,
      presenter,
      seedTopic: story.title,
      variationIndex: variation,
    });
    return {
      ...s,
      duration: '10s',
      script,
    };
  });

  let candidateStory = {
    ...story,
    scenes: rebuiltScenes,
  };

  let sig = extractVisualSignature(candidateStory, categoryId);
  let check = checkAntiRepetition(sig, history);

  // If failing against any of the last 3 stories, vary the Flow blocks until passes
  while (!check.passes && variation < 5) {
    variation++;
    rebuiltScenes = (story.scenes || []).map((s: any, idx: number) => {
      const script = buildCategoryFlowScript({
        categoryId,
        sceneNum: idx + 1,
        totalScenes,
        beatPurpose: s.purpose || `Scene ${idx + 1}`,
        visual: s.visual || '',
        dialogue: s.dialogue || '',
        tag,
        presenter,
        seedTopic: story.title,
        variationIndex: variation,
      });
      return {
        ...s,
        duration: '10s',
        script,
      };
    });

    candidateStory = {
      ...story,
      scenes: rebuiltScenes,
    };
    sig = extractVisualSignature(candidateStory, categoryId);
    check = checkAntiRepetition(sig, history);
  }

  saveVisualSignatureToHistory(sig);

  return {
    story: candidateStory,
    signature: sig,
    passesAntiRepetition: check.passes || history.length === 0,
  };
}
