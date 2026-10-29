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
  10: 'As a cinematic director, visualize this scene with an impactful center-frame slow push-in, cinematic warm bokeh, and an animated 3D subscriber bell & milestone badge with clear visual punch'
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
