/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Published Videos Library & Dynamic Duplicate Defense Store
 * Merges static 58 YouTube catalog videos with dynamically published platform stories.
 * Backed by per-profile isolation with covered_points for Smarter Duplicate Defense.
 */

import { PUBLISHED_VIDEOS, type PublishedVideo } from '../data/channelData';
import { loadPendingQueue, savePendingQueue, type PendingStoryRecord } from './pendingQueueStore';
import type { GeneratedStory } from '../components/StoryPackageView';
import {
  loadProfileLibrary,
  saveProfileLibrary,
  IT_CAFETERIA_CATALOG_COVERED_POINTS,
  extractCoveredPointsFromStoryPackage,
  checkSmarterDuplicate,
  type DuplicateCheckResult
} from './profileStore';
import { pushStudioStatePatch, isHydratingRemoteState } from './studioSyncStore';

export const PUBLISHED_LIBRARY_STORAGE_KEY = 'itcafeteria_published_library_v1';
export const LIBRARY_UPDATED_EVENT = 'itcafeteria_published_library_updated';

export interface DynamicPublishedStory extends PublishedVideo {
  sourceRecordId?: string;
  storyPackage?: GeneratedStory;
  isPlatformGenerated?: boolean;
  publishedAt?: string;
  youtubeUrl?: string;
  covered_points?: string[];
  channelId?: string;
  isExternalVideo?: boolean;
  problem_signature?: any;
}

/**
 * Loads custom standalone published stories from localStorage.
 */
export function loadCustomPublishedStories(): DynamicPublishedStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PUBLISHED_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading custom published stories', e);
    return [];
  }
}

/**
 * Saves custom standalone published stories into localStorage.
 */
export function saveCustomPublishedStories(stories: DynamicPublishedStory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PUBLISHED_LIBRARY_STORAGE_KEY, JSON.stringify(stories));
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: stories }));
    if (!isHydratingRemoteState()) {
      pushStudioStatePatch({ publishedLibrary: stories }, 'published_library_updated');
    }
  } catch (e) {
    console.error('Error saving custom published stories', e);
  }
}

/**
 * Formats seconds into MM:SS (e.g. 60s -> "1:00")
 */
function formatSceneDuration(sceneCount: number): string {
  const totalSeconds = (sceneCount || 6) * 10;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Gets all published videos for a given channel profile (defaults to 'itcafeteria'):
 * 1. Reads from profile library store
 * 2. Augments with dynamic published queue stories if any
 * 3. Enforces covered_points on every story
 * Returns sorted list with newly published videos at the TOP.
 */
export function getAllPublishedVideos(channelId: string = 'itcafeteria'): DynamicPublishedStory[] {
  // If channel is itcafeteria, ensure custom published and pending queue are merged
  if (channelId === 'itcafeteria') {
    const profileLib = loadProfileLibrary('itcafeteria');
    const seenTitles = new Set<string>();
    const merged: DynamicPublishedStory[] = [];

    // 1. Live published from pending queue
    try {
      const pendingQueue = loadPendingQueue();
      const publishedInQueue = pendingQueue.filter((item) => item.status === 'published');

      publishedInQueue.forEach((record) => {
        const normTitle = record.title.trim().toLowerCase();
        if (!seenTitles.has(normTitle)) {
          seenTitles.add(normTitle);
          const sceneCount = record.storyPackage?.sceneCount || record.storyPackage?.scenes?.length || 6;
          const covered = record.storyPackage
            ? extractCoveredPointsFromStoryPackage(record.storyPackage)
            : [record.targetSlotReason || record.title];

          merged.push({
            id: 58 + merged.length + 1,
            title: record.title,
            length: formatSceneDuration(sceneCount),
            tool: record.storyPackage?.idea?.title || record.category || 'AI & Tech Shorts',
            points: record.storyPackage?.idea?.points || record.targetSlotReason || 'Full 10-scene Roman Urdu script with Google Flow directing layer.',
            series: record.storyPackage?.playlist || record.category || 'Shorts Series',
            published: record.publishedAt
              ? new Date(record.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : record.scheduledDate || 'Recent',
            publishedAt: record.publishedAt || record.createdAt,
            sourceRecordId: record.id,
            storyPackage: record.storyPackage,
            isPlatformGenerated: true,
            viewsEstimate: 0,
            channelId: 'itcafeteria',
            covered_points: covered
          });
        }
      });
    } catch (e) {
      console.warn('Could not read published from pendingQueue', e);
    }

    // 2. Custom published stories from legacy storage
    try {
      const customList = loadCustomPublishedStories();
      customList.forEach((item) => {
        const normTitle = item.title.trim().toLowerCase();
        if (!seenTitles.has(normTitle)) {
          seenTitles.add(normTitle);
          merged.push({
            ...item,
            id: 58 + merged.length + 1,
            channelId: 'itcafeteria',
            covered_points: item.covered_points || [item.points || item.title]
          });
        }
      });
    } catch (e) {
      console.warn('Could not read custom published library', e);
    }

    // 3. Existing profile library entries (including the 58 base catalog)
    profileLib.forEach((story) => {
      const normTitle = story.title.trim().toLowerCase();
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        merged.push({
          ...story,
          covered_points: story.covered_points || IT_CAFETERIA_CATALOG_COVERED_POINTS[story.id] || [story.points || story.title]
        });
      }
    });

    return merged;
  }

  // Non-IT Cafeteria channels: load strictly from their own profile library
  return loadProfileLibrary(channelId);
}

/**
 * Publishes a story immediately from anywhere in the app:
 * 1. Upserts into pendingQueue with status 'published'
 * 2. Adds to profile library store with covered_points
 * 3. Fires broadcast events
 */
export function publishStoryDirectly(
  story: GeneratedStory,
  existingRecordId?: string,
  channelId: string = 'itcafeteria'
): DynamicPublishedStory {
  const nowIso = new Date().toISOString();
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const sceneCount = story.sceneCount || story.scenes?.length || 6;
  const recordId = existingRecordId || `pub-${Date.now()}`;
  const coveredPoints = extractCoveredPointsFromStoryPackage(story);

  // 1. Sync into pendingQueueStore
  const pendingRecord: PendingStoryRecord = {
    id: recordId,
    title: story.title,
    hook: story.hook,
    category: story.categoryName || 'AI & Smart Tech',
    categoryId: 1,
    characterTag: story.characterTag || '@WM25-1',
    scheduledTime: 'Immediate Publication',
    scheduledDate: todayLabel,
    targetSlotReason: 'Published directly from Story Creator Hub.',
    status: 'published',
    source: 'manual',
    priority: 'HIGH',
    createdAt: nowIso,
    publishedAt: nowIso,
    storyPackage: {
      ...story,
      dateLabel: todayLabel
    }
  };

  try {
    const currentQueue = loadPendingQueue();
    const existingIdx = currentQueue.findIndex((i) => i.id === recordId || i.title.toLowerCase() === story.title.toLowerCase());
    let nextQueue: PendingStoryRecord[];
    if (existingIdx >= 0) {
      nextQueue = [...currentQueue];
      nextQueue[existingIdx] = {
        ...nextQueue[existingIdx],
        ...pendingRecord,
        status: 'published',
        publishedAt: nowIso
      };
    } else {
      nextQueue = [pendingRecord, ...currentQueue];
    }
    savePendingQueue(nextQueue);
  } catch (e) {
    console.error('Error syncing direct publish into pending queue', e);
  }

  // 2. Add to profile published library
  const currentLib = loadProfileLibrary(channelId);
  const newEntry: DynamicPublishedStory = {
    id: currentLib.length > 0 ? Math.max(...currentLib.map(v => v.id)) + 1 : 1,
    title: story.title,
    length: formatSceneDuration(sceneCount),
    tool: story.idea?.title || story.categoryName || 'Tech Shorts',
    points: story.idea?.points || story.hook || 'Directly published video package.',
    series: story.playlist || story.categoryName || 'Shorts',
    published: todayLabel,
    publishedAt: nowIso,
    sourceRecordId: recordId,
    storyPackage: story,
    isPlatformGenerated: true,
    covered_points: coveredPoints,
    channelId
  };

  const filtered = currentLib.filter((item) => item.title.toLowerCase() !== story.title.toLowerCase());
  const updatedLib = [newEntry, ...filtered];
  saveProfileLibrary(channelId, updatedLib);

  // Broadcast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itcafeteria_story_published', { detail: newEntry }));
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: getAllPublishedVideos(channelId) }));
  }

  return newEntry;
}

/**
 * Adds a story manually to the active profile's library.
 */
export function addManualStoryToLibrary(
  channelId: string,
  story: {
    title: string;
    tool: string;
    points: string;
    series: string;
    length?: string;
    published?: string;
    covered_points?: string[];
  }
): DynamicPublishedStory {
  const currentLib = loadProfileLibrary(channelId);
  const nextId = currentLib.length > 0 ? Math.max(...currentLib.map(s => s.id)) + 1 : 1;
  const nowIso = new Date().toISOString();
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const covered = story.covered_points && story.covered_points.length > 0
    ? story.covered_points
    : story.points.split(/[\n,;•]+/).map(s => s.trim()).filter(Boolean);

  const newStory: DynamicPublishedStory = {
    id: nextId,
    title: story.title.trim(),
    tool: story.tool.trim() || 'Custom Tool',
    points: story.points.trim() || 'Manual entry',
    series: story.series.trim() || 'Custom Series',
    length: story.length?.trim() || '1:10',
    published: story.published?.trim() || todayLabel,
    publishedAt: nowIso,
    isPlatformGenerated: false,
    covered_points: covered,
    channelId
  };

  const updated = [newStory, ...currentLib];
  saveProfileLibrary(channelId, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: updated }));
  }
  return newStory;
}

/**
 * Updates a story in the active profile's library (preserves ordering & other fields).
 */
export function updateStoryInLibrary(
  channelId: string,
  storyId: number | string,
  patch: Partial<DynamicPublishedStory>
): boolean {
  const currentLib = loadProfileLibrary(channelId);
  const idx = currentLib.findIndex(s => String(s.id) === String(storyId));
  if (idx === -1) return false;

  const updatedStory = { ...currentLib[idx], ...patch };
  const nextLib = [...currentLib];
  nextLib[idx] = updatedStory;

  saveProfileLibrary(channelId, nextLib);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: nextLib }));
  }
  return true;
}

/**
 * Deletes a story from the active profile's library.
 */
export function deleteStoryFromLibrary(channelId: string, storyId: number | string): boolean {
  const currentLib = loadProfileLibrary(channelId);
  const nextLib = currentLib.filter(s => String(s.id) !== String(storyId));
  if (nextLib.length === currentLib.length) return false;

  saveProfileLibrary(channelId, nextLib);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: nextLib }));
  }
  return true;
}

/**
 * Checks duplicates across the library using the Smarter Duplicate Check engine.
 */
export function checkDuplicateAcrossEntireLibrary(
  toolInput: string,
  featureInput: string,
  channelId: string = 'itcafeteria'
): {
  isDuplicate: boolean;
  isPartial: boolean;
  matches: DynamicPublishedStory[];
  message: string;
  result?: DuplicateCheckResult;
} {
  const res = checkSmarterDuplicate({
    title: `${toolInput} ${featureInput}`.trim(),
    rawPointsText: featureInput,
    channelId
  });

  const library = loadProfileLibrary(channelId);
  const matchedStories = res.matchedStoryId
    ? library.filter(s => String(s.id) === String(res.matchedStoryId))
    : [];

  return {
    isDuplicate: res.verdict === 'exact',
    isPartial: res.verdict === 'partial',
    matches: matchedStories,
    message: res.reason,
    result: res
  };
}
