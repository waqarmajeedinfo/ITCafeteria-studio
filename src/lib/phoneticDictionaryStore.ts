/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Living Roman Urdu Phonetic Rules Dictionary Store
 * Manages test-verified spellings to prevent Google Flow voice engine mispronunciations.
 * Supports dynamic user additions and persists across reloads.
 */

import { PHONETIC_DICTIONARY as BASE_PHONETIC_DICTIONARY } from '../data/channelData';

export interface PhoneticRule {
  word: string;
  fix: string;
  reason: string;
  isCustom?: boolean;
  createdAt?: string;
}

const STORAGE_KEY = 'itcafeteria_phonetic_dictionary_v2';
export const PHONETIC_UPDATED_EVENT = 'itcafeteria_phonetic_dictionary_updated';

// Default initial dictionary with Waqar Majeed's verified replacements (including bary, hal, etc.)
const INITIAL_RULES: PhoneticRule[] = [
  ...BASE_PHONETIC_DICTIONARY.map(r => ({ ...r, isCustom: false })),
  {
    word: 'bade / badey / bary',
    fix: 'barra / barri / barray',
    reason: 'Flow reads "bary" as English berry or soft slur; use double "rr" (barra / barray) for crisp retroflex flap',
    isCustom: true
  },
  {
    word: 'hal',
    fix: 'tareeqa / solution / hal-l',
    reason: 'Flow reads "hal" as "haal" (condition); use "tareeqa", "solution", or double consonant "hal-l"',
    isCustom: true
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
    }
  } catch (e) {
    console.error('Error saving phonetic dictionary', e);
  }
}

export function addPhoneticRule(rule: { word: string; fix: string; reason: string }): PhoneticRule[] {
  const current = getPhoneticDictionary();
  const cleanWord = rule.word.trim();
  if (!cleanWord) return current;

  const existingIdx = current.findIndex(
    r => r.word.toLowerCase() === cleanWord.toLowerCase()
  );

  const newRule: PhoneticRule = {
    word: cleanWord,
    fix: rule.fix.trim(),
    reason: rule.reason.trim() || 'Custom pronunciation rule added by creator',
    isCustom: true,
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
  const updated = current.filter(r => r.word.toLowerCase() !== word.toLowerCase());
  savePhoneticDictionary(updated);
  return updated;
}

export function resetPhoneticDictionaryToDefault(): PhoneticRule[] {
  savePhoneticDictionary(INITIAL_RULES);
  return INITIAL_RULES;
}

/**
 * Apply phonetic rules directly to a text string, replacing mispronounced words
 */
export function applyPhoneticFixes(text: string): string {
  if (!text) return text;
  const rules = getPhoneticDictionary();
  let result = text;
  for (const rule of rules) {
    if (!rule.word || !rule.fix) continue;
    // Simple case-insensitive boundary replacement where applicable
    try {
      const regex = new RegExp(`\\b${rule.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, rule.fix);
    } catch {}
  }
  return result;
}
