/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Google Flow Cinematic Script Builder
 * Builds rich, category-specific director prompts for Google Flow AI Video Generator.
 * Powered by category_story_modules.json as single source of truth.
 */

import type { StoryScene, GeneratedStory } from '../components/StoryPackageView';
import {
  buildCategoryFlowScript,
  getCategoryModule,
  processAndEnforceCategoryStory,
  resolveEffectiveCategory
} from './categoryStoryModules';
import { stripLegacyBoilerplate } from './cinematicDirector';

export interface FlowPromptContext {
  characterTag?: string;
  channelName?: string;
  presenter?: string;
  categoryName?: string;
  categoryId?: number;
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
 * Builds the complete Google Flow prompt for a single scene using the category module.
 */
export function buildFlowCinematicScript(params: {
  sceneNum: number;
  totalScenes?: number;
  categoryId?: number;
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
  const catId = params.categoryId || 1;
  const rawTag = (params.characterTag || '@WM25-1').trim();
  const isFaceless = !rawTag || rawTag === 'No-Character' || rawTag.toLowerCase().includes('faceless');
  const normalizedTag = isFaceless ? '' : rawTag.startsWith('@') ? rawTag : `@${rawTag}`;

  return buildCategoryFlowScript({
    categoryId: catId,
    sceneNum: params.sceneNum,
    totalScenes: params.totalScenes || 10,
    beatPurpose: params.purpose,
    visual: params.visual,
    dialogue: params.dialogue,
    tag: normalizedTag,
    presenter: params.presenter || (normalizedTag.startsWith('@MZ') ? 'Mehr Zadi' : 'Waqar Majeed'),
    seedTopic: params.storyTitle || '',
  });
}

/**
 * Ensures a scene's script is in full category-driven director format.
 */
export function ensureFlowCinematicScript(
  scene: StoryScene,
  context: FlowPromptContext = {}
): StoryScene {
  const stripped = stripLegacyBoilerplate(scene.script || '');

  if (isAlreadyCinematicFlowScript(stripped)) {
    const normalizedScript = stripped
      .replace(/\[PRESENTER & ACTION\]:\s*WM25-(\d)/g, '[PRESENTER & ACTION]: @WM25-$1')
      .replace(/\[PRESENTER & ACTION\]:\s*MZ22-(\d)/g, '[PRESENTER & ACTION]: @MZ22-$1')
      .replace(/Duration:\s*[\d\w\s-]+[.]/i, 'Duration: 0-10s.');

    return {
      ...scene,
      duration: '0-10s',
      script: normalizedScript
    };
  }

  const enhancedScript = buildFlowCinematicScript({
    sceneNum: scene.num,
    totalScenes: 10,
    categoryId: context.categoryId || 1,
    duration: '0-10s',
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
    duration: '0-10s',
    script: enhancedScript
  };
}

/**
 * Upgrades all scenes of a GeneratedStory to category-driven Flow scripts and checks anti-repetition.
 */
export function upgradeStoryScenesToCinematic(story: GeneratedStory): GeneratedStory {
  if (!story || !Array.isArray(story.scenes)) return story;

  const categoryId = story.categoryId || (story.categoryName ? parseInt(story.categoryName.replace(/\D/g, ''), 10) : 1) || 1;
  const processed = processAndEnforceCategoryStory(
    story,
    categoryId,
    story.characterTag || '@WM25-1',
    story.presenter || 'Waqar Majeed'
  );

  return processed.story as GeneratedStory;
}
