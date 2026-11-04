/**
 * Persistent Registry & Blacklist for Deleted Stories
 * 
 * Ensures that any story deleted by the user or admin is permanently blacklisted.
 * The autonomous agent and idea generators will NEVER search, propose, or regenerate
 * any topic, hook, or keywords associated with deleted stories.
 */

export interface DeletedStoryRecord {
  id: string;
  title: string;
  category?: string;
  hook?: string;
  deletedAt: string;
  blacklistedKeywords: string[];
}

const DELETED_STORIES_STORAGE_KEY = 'itcafeteria_deleted_stories_blacklist_v1';
export const DELETED_STORIES_UPDATED_EVENT = 'itcafeteria_deleted_stories_updated';

// Common stop words to exclude when extracting blacklisted keywords
const EXCLUDE_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'have', 'more',
  'what', 'when', 'where', 'which', 'will', 'about', 'into', 'over', 'after',
  'mein', 'karein', 'kare', 'hota', 'hoti', 'hote', 'hain', 'kaise', 'apna', 'apni',
  'sirf', 'shuru', 'khatam', 'pehle', 'baad', 'agar', 'aur', 'kisi', 'karna'
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[#@\(\)\[\]\{\}\:\,\.\!\?\-\_\/\\\+\*\=\"\']/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !EXCLUDE_WORDS.has(w));
}

export function loadDeletedStoryBlacklist(): DeletedStoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_STORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[DeletedStoryRegistry] Failed to load blacklist:', e);
  }
  return [];
}

export function saveDeletedStoryBlacklist(records: DeletedStoryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELETED_STORIES_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(DELETED_STORIES_UPDATED_EVENT, { detail: records }));
  } catch (e) {
    console.error('[DeletedStoryRegistry] Failed to persist blacklist:', e);
  }
}

/**
 * Permanently blacklists a deleted story.
 */
export function recordDeletedStory(id: string, title: string, category?: string, hook?: string): void {
  const current = loadDeletedStoryBlacklist();
  
  // Prevent duplicate blacklist entries
  const existingIndex = current.findIndex(
    (r) => r.id === id || r.title.toLowerCase() === title.trim().toLowerCase()
  );

  const keywords = Array.from(new Set([
    ...extractKeywords(title),
    ...(category ? extractKeywords(category) : []),
    ...(hook ? extractKeywords(hook) : [])
  ]));

  const newEntry: DeletedStoryRecord = {
    id: id || `del-${Date.now()}`,
    title: title.trim(),
    category: category?.trim(),
    hook: hook?.trim(),
    deletedAt: new Date().toISOString(),
    blacklistedKeywords: keywords
  };

  let updated: DeletedStoryRecord[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...newEntry };
  } else {
    updated = [newEntry, ...current];
  }

  saveDeletedStoryBlacklist(updated);
  console.info(`[DeletedStoryRegistry] Permanently blacklisted deleted story: "${title}" (${keywords.length} keywords locked)`);
}

/**
 * Checks whether a candidate title, concept, or prompt matches any blacklisted deleted story.
 * Returns match details if blacklisted, or null if clean.
 */
export function checkDeletedStoryBlacklist(candidateTitle: string, candidateDetails: string = ''): {
  isBlacklisted: boolean;
  matchedStoryTitle: string;
  reason: string;
} | null {
  const blacklist = loadDeletedStoryBlacklist();
  if (blacklist.length === 0) return null;

  const candidateCombined = `${candidateTitle} ${candidateDetails}`.toLowerCase().trim();
  const candidateWords = new Set(extractKeywords(candidateCombined));

  for (const deleted of blacklist) {
    const deletedCleanTitle = deleted.title.toLowerCase().trim();

    // 1. Exact or near-exact title match
    if (
      candidateCombined.includes(deletedCleanTitle) ||
      deletedCleanTitle.includes(candidateTitle.toLowerCase().trim())
    ) {
      return {
        isBlacklisted: true,
        matchedStoryTitle: deleted.title,
        reason: `Matched exact title of deleted story: "${deleted.title}"`
      };
    }

    // 2. High keyword density match (>= 3 matching high-value keywords)
    const matchingKeywords = deleted.blacklistedKeywords.filter((kw) => candidateWords.has(kw));
    if (matchingKeywords.length >= 3) {
      return {
        isBlacklisted: true,
        matchedStoryTitle: deleted.title,
        reason: `Shares multiple key concepts (${matchingKeywords.join(', ')}) with deleted story: "${deleted.title}"`
      };
    }
  }

  return null;
}
