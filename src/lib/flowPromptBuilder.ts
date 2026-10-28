/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Google Flow Cinematic Script Builder
 * Builds rich, production-grade director prompts for Google Flow AI Video Generator.
 * Combines camera angles, cinematic lighting, props, 3D holograms, presenter directing, and quoted dialogue.
 */

import type { StoryScene, GeneratedStory } from '../components/StoryPackageView';

export interface FlowPromptContext {
  characterTag?: string;
  channelName?: string;
  presenter?: string;
  categoryName?: string;
  storyTitle?: string;
}

/**
 * Checks if a script already has full director/cinematic sections.
 */
export function isAlreadyCinematicFlowScript(script: string): boolean {
  if (!script) return false;
  return (
    (script.includes('[DIRECTOR') || script.includes('Director:')) &&
    (script.includes('[SCENE') || script.includes('Visual:')) &&
    script.includes('DIALOGUE:')
  );
}

/**
 * Selects an intelligent, natural cinematic camera angle and lighting based on scene number and role.
 */
function getCameraAndLightingDirection(sceneNum: number, purpose: string = '', isCTA: boolean = false): string {
  const p = purpose.toLowerCase();

  if (sceneNum === 1 || p.includes('hook') || p.includes('curiosity') || p.includes('shock')) {
    return 'Master Cinematic 9:16 vertical 4K direction. Dynamic medium-close front angle with a smooth 10s dramatic slow push-in zoom (0.8x to 1.1x). Cyber dark navy studio background with vibrant neon cyan and amber volumetric rim lights, ultra-crisp shallow depth of field.';
  }

  if (p.includes('problem') || p.includes('agitate') || p.includes('warning') || p.includes('mistake')) {
    return 'Cinematic 15-degree side-angle transitioning to eye-level front. Dramatic high-contrast split lighting with subtle amber warning accents. Subtle handheld organic camera breathing for tension and realism.';
  }

  if (p.includes('reveal') || p.includes('solution') || p.includes('magic') || p.includes('secret')) {
    return 'Dynamic tracking camera with eye-level perspective. High-key modern tech studio lighting, bright cyan edge-glow. Quick smooth pan tracking the presenter gesturing towards the active visual reveal.';
  }

  if (p.includes('step') || p.includes('demo') || p.includes('shortcut') || p.includes('workflow')) {
    return 'Split-screen or 3/4 perspective with presenter beside full-scale screen display. Camera smoothly zooms in on screen action while keeping presenter visible in corner PIP or side anchor. Balanced 5600K studio fill light.';
  }

  if (p.includes('proof') || p.includes('result') || p.includes('speed') || p.includes('test')) {
    return 'Centered hero angle with a crisp snap-zoom punch into verified test results. Glowing emerald and cyan holographic confirmation badges, triumphant rim lighting, ultra-sharp focus on the winning metric.';
  }

  if (isCTA || p.includes('cta') || p.includes('subscribe') || p.includes('outro') || p.includes('call to action')) {
    return 'Warm, approachable eye-level medium shot. Friendly direct eye contact with camera. Smooth slow pull-out to reveal studio workspace, floating animated subscribe bell and social handle badges, warm golden studio backlight.';
  }

  // Default sequential camera angle
  const angleVariations = [
    'Dynamic front-facing medium shot, eye-level cinematic lens, balanced studio key and fill lighting.',
    'Slight isometric 25-degree angle, slow horizontal dolly pan, crisp neon rim light separation.',
    'Medium close-up shot with smooth vertical tilt, focused on presenter expression and visual display.',
    'Split-focus shot balancing presenter in foreground and high-res screen display in mid-ground.'
  ];
  return angleVariations[(sceneNum - 1) % angleVariations.length];
}

/**
 * Extracts and enhances scene visuals, props, and holographic 3D elements.
 */
function getVisualSceneAndProps(visual: string, purpose: string = '', storyTitle: string = ''): string {
  const cleanVisual = visual?.trim() || 'Tech demonstration on high-resolution display with floating UI metrics.';
  
  // If the visual already describes props or holograms, enrich it
  let extraProps = '';
  const lower = (cleanVisual + ' ' + purpose + ' ' + storyTitle).toLowerCase();

  if (lower.includes('chrome') || lower.includes('browser')) {
    extraProps = ' Floating 3D Google Chrome Chromium mechanical engine gear prop, glowing neon data pipeline trails, cracked shell texture with metallic reflections.';
  } else if (lower.includes('windows') || lower.includes('pc') || lower.includes('temp') || lower.includes('clean')) {
    extraProps = ' Floating Windows 11 Fluent UI holographic disk cleaner widget, glowing cache deletion particle trails, animated gigabyte counter.';
  } else if (lower.includes('whatsapp') || lower.includes('chat')) {
    extraProps = ' 3D floating emerald WhatsApp message bubbles, biometric fingerprint lock hologram with neon green verification ripple.';
  } else if (lower.includes('automate') || lower.includes('flow')) {
    extraProps = ' Interactive nodal workflow canvas, animated logic connecting lines glowing with pulsing data packets.';
  } else if (lower.includes('gemini') || lower.includes('chatgpt') || lower.includes('ai')) {
    extraProps = ' Floating 3D holographic neural network sphere, pulsing neon energy trails, real-time code token streams.';
  } else if (lower.includes('excel') || lower.includes('sheets')) {
    extraProps = ' 3D floating spreadsheet grid with glowing green formula bars, auto-calculating data cells.';
  } else {
    extraProps = ' Floating 3D tech hologram data cards, modern UI interface HUD with glowing cyber accents.';
  }

  return `${cleanVisual}.${extraProps}`;
}

/**
 * Builds the complete Google Flow cinematic prompt for a single scene.
 */
export function buildFlowCinematicScript(params: {
  sceneNum: number;
  duration?: string;
  purpose?: string;
  isCTA?: boolean;
  visual?: string;
  dialogue?: string;
  characterTag?: string;
  channelName?: string;
  presenter?: string;
  storyTitle?: string;
}): string {
  const tag = params.characterTag || '@WM25-1';
  const presenter = params.presenter || (tag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed');
  const duration = params.duration || '10s';
  const purpose = params.purpose || `Scene ${params.sceneNum}`;
  const isCTA = Boolean(params.isCTA);
  const dialogue = params.dialogue ? params.dialogue.trim() : '';

  const cameraAndLighting = getCameraAndLightingDirection(params.sceneNum, purpose, isCTA);
  const visualAndProps = getVisualSceneAndProps(params.visual || '', purpose, params.storyTitle || '');

  const presenterDirection = `${tag} (${presenter}) in modern tech creator studio. Professional, engaged posture, natural hand gestures explaining the concept with confidence. Natural warm Pakistani tech YouTuber conversational cadence, zero robotic pauses or repetitive syllables.`;

  return `[DIRECTOR CAMERA & LIGHTING]: ${cameraAndLighting} Duration: ${duration}.
[SCENE VISUAL & PROPS]: ${visualAndProps}
[PRESENTER & ACTION]: ${presenterDirection}
DIALOGUE: "${dialogue}"`;
}

/**
 * Ensures a scene's script is in full cinematic director format.
 * If already formatted, returns as is. Otherwise transforms it.
 */
export function ensureFlowCinematicScript(
  scene: StoryScene,
  context: FlowPromptContext = {}
): StoryScene {
  if (isAlreadyCinematicFlowScript(scene.script)) {
    return scene;
  }

  const enhancedScript = buildFlowCinematicScript({
    sceneNum: scene.num,
    duration: scene.duration,
    purpose: scene.purpose,
    isCTA: scene.isCTA,
    visual: scene.visual,
    dialogue: scene.dialogue,
    characterTag: context.characterTag,
    channelName: context.channelName,
    presenter: context.presenter,
    storyTitle: context.storyTitle
  });

  return {
    ...scene,
    script: enhancedScript
  };
}

/**
 * Upgrades all scenes of a GeneratedStory to complete cinematic director scripts.
 */
export function upgradeStoryScenesToCinematic(story: GeneratedStory): GeneratedStory {
  if (!story || !Array.isArray(story.scenes)) return story;

  const upgradedScenes = story.scenes.map((scene) =>
    ensureFlowCinematicScript(scene, {
      characterTag: story.characterTag,
      channelName: story.channelName,
      presenter: story.presenter,
      categoryName: story.categoryName,
      storyTitle: story.title
    })
  );

  return {
    ...story,
    scenes: upgradedScenes
  };
}
