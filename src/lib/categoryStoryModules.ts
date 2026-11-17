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
  continuity_lock_rules?: Record<string, any>;
}

/**
 * Returns the exact fixed CONTINUITY LOCK prompt text for the selected character tag.
 */
export function getContinuityLockText(characterTag?: string): string {
  const rawTag = (characterTag || '@WM25-1').trim();
  const effectiveTag = rawTag.startsWith('@') ? rawTag : `@${rawTag}`;
  return `CONTINUITY LOCK: Use the character selected in Flow for tag ${effectiveTag} exactly as set. Do not restyle or alter the character in any way. Use the same character voice as set in Flow, identical in every scene. Keep the same studio look as set in Flow. Do not move the scene to a different room.`;
}

export function appendContinuityLockToPresenterAction(presenterAction: string, characterTag?: string): string {
  if (!presenterAction) return '';
  if (presenterAction.includes('CONTINUITY LOCK:')) return presenterAction;
  const lock = getContinuityLockText(characterTag);
  return `${presenterAction.trim()} ${lock}`;
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
 * Resolves visual description and camera direction adaptively for tutorial demo & proof scenes.
 * Adheres strictly to Mode A (screen only) vs Mode B (presenter + screen) and zoom rules.
 */
function resolveTutorialDemoVisualAndCamera(params: {
  sceneNum: number;
  beatPurpose: string;
  visual: string;
  dialogue: string;
  lightingVariation: string;
  presenter: string;
}): { cameraAndLighting: string; sceneVisualAndProps: string } {
  const combined = `${params.visual} ${params.dialogue}`;
  const lower = combined.toLowerCase();

  // Mode B: use ONLY for a small item, such as a single shortcut or one key combination.
  // Rule of thumb: small item = Mode B, software/setting/dialog/multi-step = Mode A.
  const isComplexOrSoftware = /cleanmgr|compact\.exe|dism\.exe|powercfg|\.exe|terminal|cmd|command line|checkbox|temporary files|update cleanup|thumbnails|tick|dialog|progress|purging|purge|storage sense|settings >|context menu|right click|new folder|folder|guid|explorer|this pc|c-drive|c drive|toggle switch|install|multi|browser|sheet/i.test(combined);

  const shortcutMatch = combined.match(/\b(Win\s*\+\s*[A-Z0-9]|Windows\s*key\s*plus\s*[A-Z0-9]|Ctrl\s*\+\s*[A-Z0-9]|Alt\s*\+\s*[A-Z0-9]|Win\s*plus\s*[A-Z0-9])\b/i);

  if (!isComplexOrSoftware && shortcutMatch) {
    const shortcutText = shortcutMatch[0];
    return {
      cameraAndLighting: `Medium shot of presenter at workstation, stable framing with crisp focal depth. ${params.lightingVariation}. Large readable on-screen shortcut text "${shortcutText}" rendered clearly on studio back wall and floating hologram.`,
      sceneVisualAndProps: `Mode B (Presenter + Screen): ${params.presenter} stays on screen. The shortcut "${shortcutText}" is shown as large readable text on the back wall above/behind the presenter and on a crisp hologram screen in front of the presenter.`
    };
  }

  // Extract command name if present for large on-screen text
  const cmdMatch = combined.match(/(cleanmgr[^\s,."']+|compact\.exe[^\s,."']+|dism\.exe[^\s,."']+|powercfg[^\s,."']+|[a-z0-9_-]+\.exe[^\s,."']*)/i);
  const extractedCmd = cmdMatch ? cmdMatch[0] : '';

  // Mode A: camera direction describes actual scene action (Run box zoom, checkbox ticking, progress bar, File Explorer)
  if (/run box|run dialog|win\s*\+\s*r|win\s*plus\s*r/i.test(lower)) {
    return {
      cameraAndLighting: `Screen capture showing full desktop briefly for context, then camera zooms in smoothly to focus tightly on the Run dialog box so it fills the frame and is easy to read. High-contrast focus on text input cursor. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Full-screen desktop briefly for context, then camera zooms in and focuses on the Run box filling the frame. Visible cursor types "${extractedCmd || 'command'}" with separate large readable on-screen command text.`
    };
  }

  if (/checkbox|temporary files|update cleanup|thumbnails|tick|ticking/i.test(lower)) {
    return {
      cameraAndLighting: `Macro screen recording executing a tight zoom on the configuration dialog checkbox list. Camera follows the cursor ticking each option in sequence with vibrant highlight focus. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Configuration dialog filling frame. Visible cursor ticks each required checkbox with clear highlight borders, then clicks OK. One action executed cleanly.`
    };
  }

  if (/progress bar|sagerun|purging|purge|cleaning|clean|freeing/i.test(lower)) {
    return {
      cameraAndLighting: `High-contrast screen recording focusing directly on the active execution progress bar and system status indicators as the cleanup executes smoothly in real-time. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Run dialog and active progress bar purging accumulated system cache. Large readable on-screen command text "${extractedCmd || 'Executing cleanup'}" with visible status indicators.`
    };
  }

  if (/file explorer|this pc|storage bar|c-drive|c drive|proof|result|before vs after|gb free/i.test(lower)) {
    return {
      cameraAndLighting: `Screen capture focused directly on File Explorer and the C-Drive storage capacity bar, tracking the bar as it transitions from red to healthy cyan with large legible freed-capacity readout. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). File Explorer window displaying This PC. Camera zooms in on the C-Drive storage bar showing verified freed capacity and healthy cyan status indicator.`
    };
  }

  if (/storage sense|settings >|system > storage|toggle switch/i.test(lower)) {
    return {
      cameraAndLighting: `Clean Windows Settings screen capture with smooth cursor tracking. Camera zooms in on the Storage Sense toggle switch and cleanup interval dropdown with crisp focus. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Windows Settings Storage page. Visible cursor toggles Storage Sense to ON and sets cleanup frequency with clear highlight border.`
    };
  }

  if (/terminal|cmd|command prompt|admin/i.test(lower)) {
    return {
      cameraAndLighting: `Terminal window zoomed in to fill the frame for maximum legibility. High-contrast focus on text cursor and command input line. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Windows Terminal interface filling frame. Visible cursor enters "${extractedCmd || 'command'}" with separate large readable on-screen command text.`
    };
  }

  if (/folder|context menu|right click|god mode|guid/i.test(lower)) {
    return {
      cameraAndLighting: `High-resolution desktop screen recording. Camera zooms in tightly on the context menu and newly created folder icon, focusing sharply as the folder name text field is edited. ${params.lightingVariation}.`,
      sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Desktop screencast showing right-click context menu and folder creation. Visible cursor pastes code with large on-screen text overlay.`
    };
  }

  return {
    cameraAndLighting: `Full-screen screen recording with smooth cursor movement tracking the exact action on screen. Camera zooms in on active UI element so it fills the frame and is easy to read. ${params.lightingVariation}.`,
    sceneVisualAndProps: `Mode A (Screen only): Presenter is NOT visible (voiceover only). Full-screen interface showing the real step clearly with visible cursor and highlight on the item being clicked or configured. Large readable on-screen text for the command.`
  };
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
        const cat2CameraShots = [
          `Over-shoulder perspective focusing on workflow bottleneck. ${lightingVariation}. Camera drifts inward toward display.`,
          `High-contrast UI screen focus. Smooth cursor tracking navigating toward webhook settings.`,
          `Tight macro zoom on configuration parameter toggle. Crisp cursor click with subtle focal breathing.`,
          `Split-view workspace framing. Cursor links trigger logic to execution branch seamlessly.`,
          `Full interface overview displaying real-time execution status and green validation indicators.`,
          `Dynamic 15-degree angled screen perspective highlighting the pro automation shortcut.`,
          `Clear steady framing with amber warning boundary around credential safety rules.`,
          `Clean medium pullback shot framing completed workflow architecture on dual displays.`
        ];
        cameraAndLighting = cat2CameraShots[(sceneNum - 2) % cat2CameraShots.length];
        presenterAction = `Full-screen software interface walkthrough with clear ${tag} voiceover. Zero robotic cadence.`;
        sceneVisualAndProps = `Screen Demo: ${sceneVisualAndProps} Live mouse cursor moves with precision to toggle settings. (Holograms strictly disabled).`;
      }
      break;

    case 3: // AI Prompt Hacks & Shortcuts
      if (isHook || isCTA) {
        cameraAndLighting = `Crisp eye-level shot at minimal creator desk. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) compares two prompt outputs side-by-side, nodding with approval.`;
      } else {
        const cat3CameraShots = [
          `Split-view display layout. Static framing with high legibility for prompt text on left and generated output on right.`,
          `Macro zoom-in focusing on flawed generic prompt tokens with subtle desaturation on weak output.`,
          `Centered high-contrast view of system persona prompt being typed in real-time.`,
          `Side-by-side comparative pan from weak generic output to structured tabular result.`,
          `Tight focal punch-in on temperature slider and delimiter tokens in parameter panel.`,
          `Over-the-shoulder view observing immediate generation response with zero conversational fluff.`,
          `Clean dual-pane display with green checkmark badge highlighting production-ready markdown code.`
        ];
        cameraAndLighting = cat3CameraShots[(sceneNum - 2) % cat3CameraShots.length];
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
      } else if (/Demo\s*[1-3]|Proof/i.test(beatPurpose) || (sceneNum >= 4 && sceneNum <= 7)) {
        const demoPlan = resolveTutorialDemoVisualAndCamera({
          sceneNum,
          beatPurpose,
          visual: sceneVisualAndProps,
          dialogue,
          lightingVariation,
          presenter
        });
        cameraAndLighting = demoPlan.cameraAndLighting;
        sceneVisualAndProps = demoPlan.sceneVisualAndProps;
        presenterAction = `Full-screen Windows walkthrough with authoritative ${tag} voiceover. Clear pace, careful safety guidance.`;
      } else if (sceneNum === 2 || /problem/i.test(beatPurpose)) {
        cameraAndLighting = `Over-shoulder angle at Windows 11 desktop. ${lightingVariation}. Smooth glide towards screen highlighting lag or bottleneck.`;
        presenterAction = `${tag} (${presenter}) points to system lag with concerned expression.`;
        sceneVisualAndProps = `Problem & Bottleneck: ${sceneVisualAndProps}`;
      } else if (sceneNum === 3 || /reveal/i.test(beatPurpose)) {
        cameraAndLighting = `Dynamic focal transition from workspace to high-contrast desktop reveal. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) gestures toward the screen with confident reveal posture.`;
        sceneVisualAndProps = `Reveal: ${sceneVisualAndProps}`;
      } else if (sceneNum === 8 || /benefit/i.test(beatPurpose)) {
        cameraAndLighting = `Clean workstation camera framing with responsive performance metrics overlay. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) smiles with satisfied expression at workstation.`;
        sceneVisualAndProps = `Benefit & Speedup: ${sceneVisualAndProps}`;
      } else {
        cameraAndLighting = `Medium shot at creator desk with glowing shortcut graphic on side. ${lightingVariation}.`;
        presenterAction = `${tag} (${presenter}) gestures with curiosity toward next trick.`;
        sceneVisualAndProps = `Curiosity Loop: ${sceneVisualAndProps}`;
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
        const cat7CameraShots = [
          `Vertical 9:16 mobile capture framing app main feed with animated tap circles.`,
          `Macro zoom-in on settings navigation bar with subtle cyan edge illumination.`,
          `Tight focus on the unadvertised privacy toggle switch flipping from default to active.`,
          `Side-by-side dual phone screencast verifying sender ticks remain grey during active read.`,
          `Dynamic pan tracking gesture navigation across the newly unlocked app submenu.`,
          `Close-up on mobile display showing instant verification without notification banner.`,
          `Steady framing with caution overlay explaining group chat receipt boundaries.`,
          `Clean medium shot with smartphone held steady displaying final completed feature.`
        ];
        cameraAndLighting = cat7CameraShots[(sceneNum - 2) % cat7CameraShots.length];
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

  // Final assembly - STRICTLY compliant with Google Flow format with CONTINUITY LOCK
  const rawTag = (tag || '@WM25-1').trim();
  const effectiveTag = rawTag.startsWith('@') ? rawTag : `@${rawTag}`;
  const continuityLock = getContinuityLockText(effectiveTag);
  const fullPresenterAction = presenterAction.includes('CONTINUITY LOCK:')
    ? presenterAction
    : `${presenterAction.trim()} ${continuityLock}`;

  return `[DIRECTOR CAMERA & LIGHTING]: ${cameraAndLighting} Duration: 0-10s.
[SCENE VISUAL & PROPS]: ${sceneVisualAndProps}
[PRESENTER & ACTION]: ${fullPresenterAction}
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
