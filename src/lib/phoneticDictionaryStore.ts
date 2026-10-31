/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Living Roman Urdu Phonetic Rules Dictionary Store
 * Manages test-verified spellings to prevent Google Flow voice engine mispronunciations.
 * Supports dynamic user additions, auto-learning from dialogue edits, and persists across reloads.
 */

import { PHONETIC_DICTIONARY as BASE_PHONETIC_DICTIONARY } from '../data/channelData';

export interface PhoneticRule {
  word: string;
  fix: string;
  reason: string;
  isCustom?: boolean;
  createdAt?: string;
  source?: 'base' | 'manual' | 'story_edit';
}

export interface LearnedWordEdit {
  id: string;
  originalWord: string;
  newWord: string;
  sceneNum?: number;
  storyTitle?: string;
  timestamp: string;
  appliedCount: number;
}

const STORAGE_KEY = 'itcafeteria_phonetic_dictionary_v2';
const LEARNED_EDITS_KEY = 'itcafeteria_phonetic_learned_edits_v1';
export const PHONETIC_UPDATED_EVENT = 'itcafeteria_phonetic_dictionary_updated';

// Default initial dictionary with Waqar Majeed's verified replacements (including bary, hal, etc.)
const INITIAL_RULES: PhoneticRule[] = [
  ...BASE_PHONETIC_DICTIONARY.map((r) => ({ ...r, isCustom: false, source: 'base' as const })),
  {
    word: 'bade / badey / bary',
    fix: 'barra / barri / barray',
    reason: 'Flow reads "bary" as English berry or soft slur; use double "rr" (barra / barray) for crisp retroflex flap',
    isCustom: true,
    source: 'manual'
  },
  {
    word: 'hal',
    fix: 'tareeqa / solution / hal-l',
    reason: 'Flow reads "hal" as "haal" (condition); use "tareeqa", "solution", or double consonant "hal-l"',
    isCustom: true,
    source: 'manual'
  },
  {
    word: 'ghalati',
    fix: 'ghalti',
    reason: 'Flow pronounces ghalati with unnatural pause; ghalti sounds fluent',
    isCustom: true,
    source: 'manual'
  },
  {
    word: 'fastly',
    fix: 'tezi se / 2x fast',
    reason: 'Proper Urdu cadence instead of broken English suffix',
    isCustom: true,
    source: 'manual'
  }
];

export function getPhoneticDictionary(): PhoneticRule[] {
  if (typeof window === 'undefined') return INITIAL_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RULES));
      return INITIAL_RULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading phonetic dictionary', e);
  }
  return INITIAL_RULES;
}

export function savePhoneticDictionary(rules: PhoneticRule[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      window.dispatchEvent(new CustomEvent(PHONETIC_UPDATED_EVENT, { detail: rules }));
      window.dispatchEvent(new CustomEvent('storage'));
    }
  } catch (e) {
    console.error('Error saving phonetic dictionary', e);
  }
}

export function addPhoneticRule(rule: {
  word: string;
  fix: string;
  reason?: string;
  source?: 'base' | 'manual' | 'story_edit';
}): PhoneticRule[] {
  const current = getPhoneticDictionary();
  const cleanWord = rule.word.trim();
  const cleanFix = rule.fix.trim();
  if (!cleanWord || !cleanFix) return current;

  const existingIdx = current.findIndex(
    (r) => r.word.toLowerCase() === cleanWord.toLowerCase()
  );

  const newRule: PhoneticRule = {
    word: cleanWord,
    fix: cleanFix,
    reason: rule.reason?.trim() || 'Custom pronunciation rule added by creator',
    isCustom: true,
    source: rule.source || 'manual',
    createdAt: new Date().toISOString()
  };

  let updated: PhoneticRule[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...newRule };
  } else {
    updated = [newRule, ...current];
  }

  savePhoneticDictionary(updated);
  return updated;
}

export function deletePhoneticRule(word: string): PhoneticRule[] {
  const current = getPhoneticDictionary();
  const updated = current.filter((r) => r.word.toLowerCase() !== word.toLowerCase());
  savePhoneticDictionary(updated);
  return updated;
}

export function resetPhoneticDictionaryToDefault(): PhoneticRule[] {
  savePhoneticDictionary(INITIAL_RULES);
  return INITIAL_RULES;
}

export function getLearnedEdits(): LearnedWordEdit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEARNED_EDITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading learned edits', e);
  }
  return [];
}

export function saveLearnedEdits(edits: LearnedWordEdit[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEARNED_EDITS_KEY, JSON.stringify(edits));
    }
  } catch (e) {
    console.error('Error saving learned edits', e);
  }
}

/**
 * Automatically captures when a user edits dialogue in a scene.
 * If words or phrases are modified, it records them in learned edits
 * and automatically integrates them into the active phonetic rules!
 */
export function recordDialogueEdit(
  originalDialogue: string,
  newDialogue: string,
  meta?: { sceneNum?: number; storyTitle?: string }
): { addedRule?: PhoneticRule; learnedEdit?: LearnedWordEdit } | null {
  const origClean = (originalDialogue || '').trim();
  const newClean = (newDialogue || '').trim();
  if (!origClean || !newClean || origClean === newClean) return null;

  const origWords = origClean.split(/\s+/);
  const newWords = newClean.split(/\s+/);

  // Simple diff finding: Find the primary changed word or phrase
  let diffOld = '';
  let diffNew = '';

  for (let i = 0; i < Math.max(origWords.length, newWords.length); i++) {
    const wOld = origWords[i] || '';
    const wNew = newWords[i] || '';
    if (wOld.toLowerCase() !== wNew.toLowerCase() && wOld && wNew) {
      // Clean punctuation
      const cleanWOld = wOld.replace(/^[^\w\s]+|[^\w\s]+$/g, '');
      const cleanWNew = wNew.replace(/^[^\w\s]+|[^\w\s]+$/g, '');
      if (cleanWOld.length >= 2 && cleanWNew.length >= 2 && cleanWOld.toLowerCase() !== cleanWNew.toLowerCase()) {
        diffOld = cleanWOld;
        diffNew = cleanWNew;
        break;
      }
    }
  }

  if (!diffOld || !diffNew) return null;

  // Record in Learned Edits list
  const learnedList = getLearnedEdits();
  const existingLearnedIdx = learnedList.findIndex(
    (l) => l.originalWord.toLowerCase() === diffOld.toLowerCase()
  );

  const editItem: LearnedWordEdit = {
    id: `learn-${Date.now()}`,
    originalWord: diffOld,
    newWord: diffNew,
    sceneNum: meta?.sceneNum,
    storyTitle: meta?.storyTitle,
    timestamp: new Date().toISOString(),
    appliedCount: existingLearnedIdx >= 0 ? (learnedList[existingLearnedIdx].appliedCount || 1) + 1 : 1
  };

  let updatedLearned: LearnedWordEdit[];
  if (existingLearnedIdx >= 0) {
    updatedLearned = [...learnedList];
    updatedLearned[existingLearnedIdx] = editItem;
  } else {
    updatedLearned = [editItem, ...learnedList].slice(0, 100);
  }
  saveLearnedEdits(updatedLearned);

  // Automatically save as custom phonetic rule!
  const addedRules = addPhoneticRule({
    word: diffOld,
    fix: diffNew,
    reason: `Auto-learned from Scene ${meta?.sceneNum || 1} edit in "${meta?.storyTitle?.slice(0, 24) || 'Story'}"`,
    source: 'story_edit'
  });

  const rule = addedRules.find((r) => r.word.toLowerCase() === diffOld.toLowerCase());
  return { addedRule: rule, learnedEdit: editItem };
}

/**
 * Apply phonetic rules directly to a text string, replacing mispronounced words
 * with prioritized longest-match ordering and slash-split support.
 */
export function applyPhoneticFixes(text: string): string {
  if (!text) return text;
  const rules = getPhoneticDictionary();
  let result = text;

  // Flatten slash rules (e.g. "bade / badey / bary" -> ["bade", "badey", "bary"])
  const individualRules: { word: string; fix: string }[] = [];
  for (const rule of rules) {
    if (!rule.word || !rule.fix) continue;
    const parts = rule.word.split(/\s*[\/,|]\s*/).map((p) => p.trim()).filter(Boolean);
    const targetFix = rule.fix.split(/\s*[\/,|]\s*/)[0]?.trim() || rule.fix.trim();
    for (const part of parts) {
      if (part.length > 0) {
        individualRules.push({ word: part, fix: targetFix });
      }
    }
  }

  // Sort longest words first so compound words are matched before single words
  individualRules.sort((a, b) => b.word.length - a.word.length);

  for (const item of individualRules) {
    try {
      const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      result = result.replace(regex, item.fix);
    } catch {}
  }

  return result;
}
