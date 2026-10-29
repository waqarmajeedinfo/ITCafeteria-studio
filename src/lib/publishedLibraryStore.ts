/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Published Videos Library & Dynamic Duplicate Defense Store
 * Merges static 58 YouTube catalog videos with dynamically published platform stories.
 */

import { PUBLISHED_VIDEOS, type PublishedVideo } from '../data/channelData';
import { loadPendingQueue, type PendingStoryRecord } from './pendingQueueStore';
import type { GeneratedStory } from '../components/StoryPackageView';

export const PUBLISHED_LIBRARY_STORAGE_KEY = 'itcafeteria_published_library_v1';
export const LIBRARY_UPDATED_EVENT = 'itcafeteria_published_library_updated';

export interface DynamicPublishedStory extends PublishedVideo {
  sourceRecordId?: string;
  storyPackage?: GeneratedStory;
  isPlatformGenerated?: boolean;
  publishedAt?: string;
  youtubeUrl?: string;
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
 * Gets all published videos:
 * 1. Dynamic published stories from pendingQueueStore (status === 'published')
 * 2. Standalone custom published stories from PUBLISHED_LIBRARY_STORAGE_KEY
 * 3. Base 58 catalog videos from channelData.ts
 * Returns sorted list with newly published videos at the TOP.
 */
export function getAllPublishedVideos(): DynamicPublishedStory[] {
  const dynamicList: DynamicPublishedStory[] = [];
  const seenTitles = new Set<string>();

  // 1. From PendingQueueStore (published stories)
  try {
    const pendingQueue = loadPendingQueue();
    const publishedInQueue = pendingQueue.filter((item) => item.status === 'published');

    publishedInQueue.forEach((record, index) => {
      const normTitle = record.title.trim().toLowerCase();
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        const sceneCount = record.storyPackage?.sceneCount || record.storyPackage?.scenes?.length || 6;
        dynamicList.push({
          id: 58 + dynamicList.length + 1,
          title: record.title,
          length: formatSceneDuration(sceneCount),
          tool: record.storyPackage?.idea?.title || record.category || 'AI & Tech Shorts',
          points: record.storyPackage?.idea?.points || record.targetSlotReason || 'Full 6-scene Roman Urdu script with Google Flow directing layer.',
          series: record.storyPackage?.playlist || record.category || 'Shorts Series',
          published: record.publishedAt
            ? new Date(record.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : record.scheduledDate || 'Recent',
          publishedAt: record.publishedAt || record.createdAt,
          sourceRecordId: record.id,
          storyPackage: record.storyPackage,
          isPlatformGenerated: true,
          viewsEstimate: 0
        });
      }
    });
  } catch (e) {
    console.warn('Could not read published from pendingQueue', e);
  }

  // 2. From standalone custom published library
  try {
    const customList = loadCustomPublishedStories();
    customList.forEach((item) => {
      const normTitle = item.title.trim().toLowerCase();
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        dynamicList.push({
          ...item,
          id: 58 + dynamicList.length + 1
        });
      }
    });
  } catch (e) {
    console.warn('Could not read custom published library', e);
  }

  // 3. Static 58 catalog entries
  const staticVideos: DynamicPublishedStory[] = PUBLISHED_VIDEOS.map((v) => ({
    ...v,
    isPlatformGenerated: false
  }));

  // Combine: dynamic live published at top, followed by static catalog
  return [...dynamicList, ...staticVideos];
}

/**
 * Publishes a story immediately from anywhere in the app:
 * 1. Upserts into pendingQueue with status 'published'
 * 2. Adds to published library store
 * 3. Fires broadcast events
 */
export function publishStoryDirectly(
  story: GeneratedStory,
  existingRecordId?: string
): DynamicPublishedStory {
  const nowIso = new Date().toISOString();
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const sceneCount = story.sceneCount || story.scenes?.length || 6;
  const recordId = existingRecordId || `pub-${Date.now()}`;

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('itcafeteria_pending_queue_v2', JSON.stringify(nextQueue));
    }
  } catch (e) {
    console.error('Error syncing direct publish into pending queue', e);
  }

  // 2. Add to custom published storage
  const newEntry: DynamicPublishedStory = {
    id: 58 + 1,
    title: story.title,
    length: formatSceneDuration(sceneCount),
    tool: story.idea?.title || story.categoryName || 'AI & Tech Shorts',
    points: story.idea?.points || story.hook || 'Directly published video package.',
    series: story.playlist || story.categoryName || 'IT Cafeteria Shorts',
    published: todayLabel,
    publishedAt: nowIso,
    sourceRecordId: recordId,
    storyPackage: story,
    isPlatformGenerated: true
  };

  const currentCustom = loadCustomPublishedStories();
  const filtered = currentCustom.filter((item) => item.title.toLowerCase() !== story.title.toLowerCase());
  const updatedCustom = [newEntry, ...filtered];
  saveCustomPublishedStories(updatedCustom);

  // Broadcast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itcafeteria_story_published', { detail: newEntry }));
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT, { detail: getAllPublishedVideos() }));
  }

  return newEntry;
}

/**
 * Checks duplicates against ALL published videos (static 58 + dynamic published stories).
 */
export function checkDuplicateAcrossEntireLibrary(toolInput: string, featureInput: string): {
  isDuplicate: boolean;
  isPartial: boolean;
  matches: DynamicPublishedStory[];
  message: string;
} {
  const allVideos = getAllPublishedVideos();
  const cleanTool = toolInput.trim().toLowerCase();
  const cleanFeature = featureInput.trim().toLowerCase();

  if (!cleanTool && !cleanFeature) {
    return { isDuplicate: false, isPartial: false, matches: [], message: '' };
  }

  // Exact match on tool AND feature
  const matched = allVideos.filter((v) => {
    const matchTool = cleanTool && v.tool.toLowerCase().includes(cleanTool);
    const matchFeature = cleanFeature && (
      v.points.toLowerCase().includes(cleanFeature) ||
      v.title.toLowerCase().includes(cleanFeature)
    );
    return matchTool && matchFeature;
  });

  if (matched.length > 0) {
    return {
      isDuplicate: true,
      isPartial: false,
      matches: matched,
      message: `Pehle cover ho chuka hai! (Found in ${matched.length} published library entries)`
    };
  }

  // Tool only matches
  const toolOnly = allVideos.filter((v) => cleanTool && v.tool.toLowerCase().includes(cleanTool));
  if (toolOnly.length > 0) {
    return {
      isDuplicate: false,
      isPartial: true,
      matches: toolOnly,
      message: `Tool pehle use hua hai (${toolOnly.length} videos mein), lekin yeh specific feature naya hai.`
    };
  }

  return {
    isDuplicate: false,
    isPartial: false,
    matches: [],
    message: 'Naya Topic! (Poori library aur published videos mein koi duplicate nahi mila)'
  };
}
