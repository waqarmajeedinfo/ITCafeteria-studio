/**
 * Cinematic Directing Engine for IT Cafeteria & Multi-Channel Studio
 * Prepend mandatory visual direction instructions to all scene scripts for Google Flow.
 */

export interface CinematicDirectionProfile {
  styleName: string;
  cameraMovement: string;
  visualAtmosphere: string;
  promptPrefix: string;
}

export const CINEMATIC_STAGE_DIRECTIONS: Record<number, string> = {
  1: 'As a cinematic director, visualize this scene with a dynamic crash zoom-in, dramatic cyber-studio rim lighting, and a high-tech glowing holographic headline floating in 3D space',
  2: 'As a cinematic director, visualize this scene with a low-angle dutch-tilt camera movement, subtle lens flare, and animated glitch alert diagnostics on transparent glass screens',
  3: 'As a cinematic director, visualize this scene with an over-the-shoulder right-angle panning shot, crisp depth-of-field focusing on live tactile workstation controls and interactive floating UI widgets',
  4: 'As a cinematic director, visualize this scene with a smooth dolly track-in, hyper-detailed volumetric neon lighting, and high-contrast dual-tone cyber accents',
  5: 'As a cinematic director, visualize this scene with a wide establishing panoramic angle, fluid particle simulations, and vivid cyan-emerald data visualizations in motion',
  6: 'As a cinematic director, visualize this scene with an intimate medium-close shot, shallow depth-of-field, and crisp focal transition revealing hidden workflow mechanics',
  7: 'As a cinematic director, visualize this scene with an orbital camera sweep, 8K octane render clarity, and vibrant 3D holographic wireframes revolving around the anchor',
  8: 'As a cinematic director, visualize this scene with a rapid rack focus from presenter to futuristic glass terminal screen, highlighting actionable step-by-step milestones',
  9: 'As a cinematic director, visualize this scene with a confident center-framed steady-cam push-in, rich cinematic bokeh in the background, and glowing warning/takeaway callouts',
  10: 'As a cinematic director, visualize this scene with an impactful center-frame slow push-in, cinematic warm bokeh, and an animated 3D subscriber bell & milestone badge with clear visual punch',
  11: 'As a cinematic director, visualize this scene with a crane jib overhead angle descending into the workstation with pulsating cyan circuitry',
  12: 'As a cinematic director, visualize this scene with a tight extreme close-up macro lens on cursor execution and instant holographic feedback triggers',
  13: 'As a cinematic director, visualize this scene with a dynamic 45-degree angle profile shot, neon edge lighting, and floating multi-layer timeline nodes',
  14: 'As a cinematic director, visualize this scene with a rapid whip-pan transition into a split screen illustrating real-time speed benchmarking',
  15: 'As a cinematic director, visualize this scene with an anamorphic lens flare sweep across a floating glass tablet interface with tactile interaction',
  16: 'As a cinematic director, visualize this scene with an eye-level steady tracking shot as the presenter walks toward a glowing 3D command dashboard',
  17: 'As a cinematic director, visualize this scene with dramatic chiaroscuro high-contrast lighting highlighting the breakthrough automation result',
  18: 'As a cinematic director, visualize this scene with an isometric 3D architectural wireframe perspective exploding the hidden software layer',
  19: 'As a cinematic director, visualize this scene with a smooth vertical pedestal reveal, showing the finished asset rendered in ultra-sharp 8K detail',
  20: 'As a cinematic director, visualize this scene with a 180-degree semicircular tracking rotation focusing on the single-click shortcut execution',
  21: 'As a cinematic director, visualize this scene with ambient volumetric atmospheric smoke, soft amber key light, and floating floating numeric badges',
  22: 'As a cinematic director, visualize this scene with a high-angle top-down glass table perspective displaying synchronized dual-cloud pipelines',
  23: 'As a cinematic director, visualize this scene with an energetic snap zoom highlighting critical parameters and mistake prevention warning rings',
  24: 'As a cinematic director, visualize this scene with a sweeping low-slung dolly shot emphasizing authority, precision, and frictionless workflow speed',
  25: 'As a cinematic director, visualize this scene with a soft-focus background transition to crystal-clear foreground interface verification',
  26: 'As a cinematic director, visualize this scene with a dual-camera split-perspective framing the anchor on the left and dynamic live execution on the right',
  27: 'As a cinematic director, visualize this scene with a slow-motion particle dissipation effect transitioning into the executive summary',
  28: 'As a cinematic director, visualize this scene with an intense cinematic push-in onto the anchor delivering the decisive strategic insight',
  29: 'As a cinematic director, visualize this scene with a vibrant glowing holographic countdown timer leading directly into the climax demonstration',
  30: 'As a cinematic director, visualize this scene with a grand final cinematic pullback, ultra-crisp studio lighting, and animated 3D follow/subscribe badge with magnetic loop closure'
};

export const CINEMATIC_PRESETS = [
  {
    id: 'cyber_hologram',
    label: 'Cybernetic 3D Hologram (IT Cafeteria Signature)',
    prefix: 'As a cinematic director, visualize this scene with cybernetic 3D holographic projection, neon cyan-blue volumetric rim lights, and smooth camera track:'
  },
  {
    id: 'anamorphic_wide',
    label: 'Anamorphic 2.39:1 Cinematic Film',
    prefix: 'As a cinematic director, visualize this scene with 2.39:1 anamorphic widescreen framing, warm cinematic flare, shallow depth-of-field, and deliberate push-in:'
  },
  {
    id: 'high_energy_viral',
    label: 'High-Energy TikTok Viral (Crash Zoom & Speed Ramping)',
    prefix: 'As a cinematic director, visualize this scene with high-energy crash zooms, dynamic speed-ramping, kinetic camera motion, and vivid RGB split accents:'
  },
  {
    id: 'minimal_studio',
    label: 'Clean Minimalist Tech Studio',
    prefix: 'As a cinematic director, visualize this scene with ultra-clean studio lighting, centered symmetrical framing, soft diffuse glow, and subtle micro-movements:'
  }
];

/**
 * Prepend mandatory cinematic directing layer to a scene script.
 */
export function applyCinematicDirecting(
  sceneNum: number,
  rawScript: string,
  customDirection?: string,
  purpose?: string
): string {
  const cleanScript = (rawScript || '').trim();

  // If already starts with "As a cinematic director", strip or normalize
  const strippedScript = cleanScript.replace(/^As a cinematic director,?\s*visualize this scene with[^\n:]*[:.]\s*/i, '').trim();

  let directionInstruction = '';

  if (customDirection && customDirection.trim()) {
    const cleanCustom = customDirection.trim();
    if (cleanCustom.toLowerCase().startsWith('as a cinematic director')) {
      directionInstruction = cleanCustom.endsWith(':') ? cleanCustom : `${cleanCustom}:`;
    } else {
      directionInstruction = `As a cinematic director, visualize this scene with ${cleanCustom}:`;
    }
  } else {
    const defaultForNum = CINEMATIC_STAGE_DIRECTIONS[sceneNum] || CINEMATIC_STAGE_DIRECTIONS[((sceneNum - 1) % 10) + 1];
    directionInstruction = `${defaultForNum}:`;
  }

  return `${directionInstruction}\n${strippedScript}`;
}

/**
 * Ensure every scene in a GeneratedStory package has the mandatory Cinematic Directing layer.
 */
export function enforceCinematicStoryPackage(
  story: any,
  customDirection?: string
): any {
  if (!story || !Array.isArray(story.scenes)) return story;

  const updatedScenes = story.scenes.map((scene: any, idx: number) => {
    const sceneNum = scene.num || idx + 1;
    const currentScript = scene.script || `${scene.visual || ''}\n"${scene.dialogue || ''}"`;
    const directedScript = applyCinematicDirecting(sceneNum, currentScript, customDirection, scene.purpose);

    return {
      ...scene,
      script: directedScript
    };
  });

  return {
    ...story,
    scenes: updatedScenes,
    cinematicDirectingActive: true,
    customCinematicDirection: customDirection || undefined,
    lastRefreshedAt: new Date().toISOString()
  };
}
