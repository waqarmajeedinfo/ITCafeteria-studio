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

const STORAGE_KEY = 'itcafeteria_phonetic_dictionary_v3';
const LEGACY_STORAGE_KEY = 'itcafeteria_phonetic_dictionary_v2';
const LEARNED_EDITS_KEY = 'itcafeteria_phonetic_learned_edits_v1';
export const PHONETIC_UPDATED_EVENT = 'itcafeteria_phonetic_dictionary_updated';

// Clean initial rules dictionary derived directly from BASE_PHONETIC_DICTIONARY
const INITIAL_RULES: PhoneticRule[] = [
  ...BASE_PHONETIC_DICTIONARY.map((r) => ({
    word: sanitizePhoneticText(r.word),
    fix: sanitizePhoneticText(r.fix),
    reason: r.reason,
    isCustom: false,
    source: 'base' as const
  }))
];

export function getPhoneticDictionary(): PhoneticRule[] {
  if (typeof window === 'undefined') return INITIAL_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy storage for user custom additions
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      let rulesToUse = INITIAL_RULES;
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed)) {
            const customOnly = legacyParsed
              .filter((r) => r.isCustom || r.source === 'manual' || r.source === 'story_edit')
              .map((r) => ({
                ...r,
                word: sanitizePhoneticText(r.word),
                fix: sanitizePhoneticText(r.fix)
              }));
            rulesToUse = [...INITIAL_RULES, ...customOnly];
          }
        } catch {}
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rulesToUse));
      return rulesToUse;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((r) => ({
        ...r,
        word: sanitizePhoneticText(r.word),
        fix: sanitizePhoneticText(r.fix)
      }));
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
 * Cleans UI notes in parentheses like "(masc)", "(feminine)", "(manner)" so only spoken text remains.
 */
export function sanitizePhoneticText(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Preserves the casing of the original word onto the replacement fix.
 */
function preserveWordCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Expands a rule into clean, individual word-to-fix pairs with pair-matching and bracket sanitization.
 */
function expandPhoneticRule(rule: PhoneticRule): Array<{ word: string; fix: string }> {
  if (!rule.word || !rule.fix) return [];
  const cleanWord = sanitizePhoneticText(rule.word);
  const cleanFix = sanitizePhoneticText(rule.fix);
  if (!cleanWord || !cleanFix) return [];

  const wordParts = cleanWord.split(/\s*[\/,|]\s*/).map((p) => p.trim()).filter(Boolean);
  const fixParts = cleanFix.split(/\s*[\/,|]\s*/).map((f) => f.trim()).filter(Boolean);

  const results: Array<{ word: string; fix: string }> = [];
  for (let i = 0; i < wordParts.length; i++) {
    const w = wordParts[i];
    // If pairwise fix exists for this index use it; otherwise use the first fix
    const f = fixParts[i] || fixParts[0];
    if (w && f) {
      results.push({ word: w, fix: f });
    }
  }
  return results;
}

/**
 * Apply phonetic rules directly to a text string, replacing mispronounced words
 * with prioritized longest-match ordering, parenthesis stripping, and case preservation.
 */
export function applyPhoneticFixes(text: string): string {
  if (!text) return text;
  const rules = getPhoneticDictionary();
  let result = text;

  // Flatten and expand all rules cleanly
  const individualRules: Array<{ word: string; fix: string }> = [];
  for (const rule of rules) {
    individualRules.push(...expandPhoneticRule(rule));
  }

  // Sort longest words first so phrases and compound words are matched before single words
  individualRules.sort((a, b) => b.word.length - a.word.length);

  for (const item of individualRules) {
    try {
      const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let regex: RegExp;

      // Special handling for "Chat": don't replace if it's already "ChatGPT", "Chat-G-P-T", or "Chatbot"
      if (item.word.toLowerCase() === 'chat') {
        regex = new RegExp(`\\b${escaped}\\b(?!\\s*[-]?\\s*(?:gpt|g-p-t|bot))`, 'gi');
      } else {
        regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      }

      result = result.replace(regex, (match) => {
        return preserveWordCase(match, item.fix);
      });
    } catch {}
  }

  return result;
}

export interface PhoneticFixOccurrence {
  sceneNum: number;
  field: 'dialogue' | 'script' | 'hook' | 'title' | 'description';
  originalText: string;
  fixedText: string;
}

export interface StoryPhoneticVerificationResult {
  story: any;
  verified: boolean;
  totalFixesApplied: number;
  occurrences: PhoneticFixOccurrence[];
  rulesCount: number;
  summaryMessage: string;
}

/**
 * Deep verification pass that audits every scene dialogue, script, hook, and title
 * against the phonetic rules dictionary, replaces mispronounced words, resynchronizes
 * script prompts, and recalculates exact word counts before the story is displayed.
 */
export function verifyAndCorrectStoryPhonetics(story: any): StoryPhoneticVerificationResult {
  if (!story || !Array.isArray(story.scenes)) {
    return {
      story,
      verified: true,
      totalFixesApplied: 0,
      occurrences: [],
      rulesCount: getPhoneticDictionary().length,
      summaryMessage: 'No scenes to verify'
    };
  }

  const occurrences: PhoneticFixOccurrence[] = [];
  const rules = getPhoneticDictionary();

  // Audit and correct each scene
  const updatedScenes = story.scenes.map((scene: any, idx: number) => {
    const origDialogue = String(scene.dialogue || '').trim();
    const fixedDialogue = applyPhoneticFixes(origDialogue);

    if (origDialogue !== fixedDialogue) {
      occurrences.push({
        sceneNum: scene.num || idx + 1,
        field: 'dialogue',
        originalText: origDialogue,
        fixedText: fixedDialogue
      });
    }

    // Keep Flow prompt script 100% in sync with the corrected dialogue
    let script = String(scene.script || '');
    if (origDialogue && script.includes(origDialogue)) {
      script = script.split(origDialogue).join(fixedDialogue);
    } else {
      script = applyPhoneticFixes(script);
    }

    const words = fixedDialogue ? fixedDialogue.split(/\s+/).filter(Boolean).length : (scene.words || 0);

    return {
      ...scene,
      dialogue: fixedDialogue,
      script,
      words
    };
  });

  const origHook = String(story.hook || '');
  const fixedHook = applyPhoneticFixes(origHook);
  if (origHook !== fixedHook) {
    occurrences.push({
      sceneNum: 1,
      field: 'hook',
      originalText: origHook,
      fixedText: fixedHook
    });
  }

  const origTitle = String(story.title || '');
  const fixedTitle = applyPhoneticFixes(origTitle);

  const origDesc = String(story.description || '');
  const fixedDesc = applyPhoneticFixes(origDesc);

  const totalFixesApplied = occurrences.length;
  const verifiedStory = {
    ...story,
    title: fixedTitle,
    hook: fixedHook,
    description: fixedDesc,
    scenes: updatedScenes,
    phoneticVerified: true,
    phoneticVerificationTimestamp: new Date().toISOString(),
    phoneticFixesCount: totalFixesApplied
  };

  const summaryMessage = totalFixesApplied > 0
    ? `Verified against ${rules.length} phonetic rules: ${totalFixesApplied} dialogue corrections applied.`
    : `Verified against ${rules.length} phonetic rules: 100% compliant, zero mispronunciations detected.`;

  return {
    story: verifiedStory,
    verified: true,
    totalFixesApplied,
    occurrences,
    rulesCount: rules.length,
    summaryMessage
  };
}
