/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria & Multi-Channel Studio
 * Cinematic Directing Engine — Category-Driven Flow Directing without boilerplate
 */

/**
 * Strips any legacy boilerplate phrase like "As a cinematic director, visualize this scene with..."
 */
export function stripLegacyBoilerplate(script: string): string {
  if (!script) return '';
  return script
    .replace(/^As a cinematic director,?\s*visualize this scene with[^\n:]*[:.]\s*/gi, '')
    .trim();
}

/**
 * Applies custom directing if explicitly provided by the user, or preserves the pristine category script.
 * Never prepends hardcoded "As a cinematic director..." boilerplate.
 */
export function applyCinematicDirecting(
  sceneNum: number,
  rawScript: string,
  customDirection?: string,
  purpose?: string
): string {
  const cleanScript = stripLegacyBoilerplate(rawScript || '');

  // If the user provided custom direction in the modal / story editor, apply it
  if (customDirection && customDirection.trim()) {
    const cleanCustom = customDirection.trim();
    const prefix = cleanCustom.endsWith(':') ? cleanCustom : `${cleanCustom}:`;

    // If script already has [DIRECTOR CAMERA & LIGHTING], augment the camera line
    if (cleanScript.includes('[DIRECTOR CAMERA & LIGHTING]:')) {
      return cleanScript.replace(
        /\[DIRECTOR CAMERA & LIGHTING\]:\s*/i,
        `[DIRECTOR CAMERA & LIGHTING]: ${cleanCustom}. `
      );
    }
    return `${prefix}\n${cleanScript}`;
  }

  // Without custom user override, return the category's authentic script directly
  return cleanScript;
}

/**
 * Ensures every scene in a GeneratedStory package is clean and free of legacy boilerplate.
 */
export function enforceCinematicStoryPackage(
  story: any,
  customDirection?: string
): any {
  if (!story || !Array.isArray(story.scenes)) return story;

  const updatedScenes = story.scenes.map((scene: any, idx: number) => {
    const sceneNum = scene.num || idx + 1;
    const currentScript = scene.script || '';
    const directedScript = applyCinematicDirecting(sceneNum, currentScript, customDirection, scene.purpose);

    return {
      ...scene,
      num: sceneNum,
      duration: '0-10s',
      script: directedScript
    };
  });

  return {
    ...story,
    scenes: updatedScenes,
    customCinematicDirection: customDirection || story.customCinematicDirection || ''
  };
}
