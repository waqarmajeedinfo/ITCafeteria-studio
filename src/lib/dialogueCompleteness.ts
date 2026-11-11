/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Dialogue Completeness & Grammar Defense Engine
 *
 * Enforces Part A2:
 * 1. Every dialogue line must be a complete, grammatical sentence ending with proper punctuation (. ? ! or Urdu ۔).
 * 2. No line may end with "...", or with a conjunction or connector word (kyunke, magar, ke, aur, ya, taake, lekin, to, isliye).
 * 3. A curiosity-loop or teaser must be a complete sentence or a complete question, not an unfinished one.
 * 4. Catches typos ("Tstep step" -> "Teesra step").
 */

const FORBIDDEN_TRAILING_CONNECTORS = [
  'kyunke',
  'magar',
  'ke',
  'aur',
  'ya',
  'taake',
  'lekin',
  'to',
  'isliye',
  'jabke',
  'phir',
  'halankay',
  'agar'
];

const TYPO_REPLACEMENTS: Array<[RegExp, string]> = [
  // Spoken step labels must be "Step 1", "Step 2", "Step 3", "Step 4" in order
  [/\b(Pehla|Pehlay|Pehle)\s+step\b/gi, 'Step 1'],
  [/\b(Doosra|Dusra|Doosray)\s+step\b/gi, 'Step 2'],
  [/\b(Teesra|Tisra|Teesray)\s+step\b/gi, 'Step 3'],
  [/\b(Chautha|Chotha|Chauthay)\s+step\b/gi, 'Step 4'],
  [/\bTstep\s*step\b/gi, 'Step 3'],
  [/\bTstep\b/gi, 'Step 3'],
  [/\bPstep\s*step\b/gi, 'Step 1'],
  [/\bPstep\b/gi, 'Step 1'],
  [/\bDstep\s*step\b/gi, 'Step 2'],
  [/\bDstep\b/gi, 'Step 2'],
  [/\bCstep\s*step\b/gi, 'Step 4'],
  [/\bCstep\b/gi, 'Step 4'],
  [/\bstep\s+step\b/gi, 'Step'],
  [/\b10x\s+faster\b/gi, 'tezi se'],
  [/\b5\s+seconds\b/gi, 'chand lamhon'],
  [/\b100%\s+free\s+aur\s+working\b/gi, 'official tareeqay se']
];

export interface DialogueValidationResult {
  valid: boolean;
  dialogue: string;
  repaired: boolean;
  issues: string[];
}

/**
 * Validates and repairs a single dialogue line.
 */
export function validateAndRepairDialogue(
  rawDialogue: string,
  sceneNum = 1,
  purpose = ''
): DialogueValidationResult {
  let text = (rawDialogue || '').trim();
  const issues: string[] = [];
  let repaired = false;

  if (!text) {
    text = `Scene ${sceneNum} ki step-by-step practical demonstration screen par dekhein!`;
    return {
      valid: false,
      dialogue: text,
      repaired: true,
      issues: ['Dialogue was completely empty; generated fallback sentence.']
    };
  }

  // 1. Fix step labels & common typos (Enforce "Step 1", "Step 2", "Step 3", "Step 4")
  for (const [pattern, replacement] of TYPO_REPLACEMENTS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      repaired = true;
      issues.push(`Typo / step label fixed: replaced matching pattern with "${replacement}".`);
    }
  }

  // 2. CTA Rule: A CTA (subscribe, follow, save, comment) is allowed ONLY in Scene 10
  if (sceneNum < 10) {
    const ctaMatch = /\s*(is video ko save|save kar lein|subscribe karein|follow karein|comment karein|channel ko follow|channel ko subscribe)[^.?!۔]*[.?!۔]?/gi;
    if (ctaMatch.test(text)) {
      text = text.replace(ctaMatch, '').trim();
      repaired = true;
      issues.push('Removed premature CTA from scenes 1-9 (CTA allowed ONLY in Scene 10).');
    }
  }

  // 3. Complete in one video rule: Never promise next part, next episode, or sharing script/file later
  const nextPartPattern = /\b(agli\s+video\s+mein|agle\s+episode\s+mein|agla\s+part|next\s+part|next\s+episode|part\s+\d+|script\s+share\s+karenge|file\s+share\s+karenge|blueprint\s+share)\b[^.?!۔]*[.?!۔]?/gi;
  if (nextPartPattern.test(text)) {
    if (sceneNum === 10) {
      text = text.replace(nextPartPattern, 'Is video ko abhi save kar lein aur IT Cafeteria ko follow karein!').trim();
    } else {
      text = text.replace(nextPartPattern, '').trim();
    }
    repaired = true;
    issues.push('Removed next-part / next-episode promise; story must be complete in one video.');
  }

  // 4. Remove trailing ellipsis
  if (/\.{2,}$/.test(text)) {
    text = text.replace(/\.{2,}$/, '').trim();
    repaired = true;
    issues.push('Removed trailing ellipsis (...).');
  }

  // 5. Check and remove forbidden trailing connector words repeatedly until clean
  let foundConnector = true;
  while (foundConnector) {
    foundConnector = false;
    const cleanNoPunct = text.replace(/[.?!۔,\s]+$/, '').trim();
    const lastWord = cleanNoPunct.split(/\s+/).pop()?.toLowerCase();

    if (lastWord && FORBIDDEN_TRAILING_CONNECTORS.includes(lastWord)) {
      foundConnector = true;
      repaired = true;
      issues.push(`Removed dangling connector "${lastWord}" from end of sentence.`);
      // Strip that word from the end
      const regex = new RegExp(`\\s+${lastWord}[.?!۔,\\s]*$`, 'i');
      text = text.replace(regex, '').trim();
    }
  }

  // 6. Incomplete teaser / curiosity loop repair (Scene 9/10)
  const isClosingOrTeaser = sceneNum >= 9 || /teaser|cta|summary|closing|curiosity|conclusion/i.test(purpose);
  if (isClosingOrTeaser) {
    // If it ends with something like "magar yaad rakhein" without an object
    if (/yaad\s+rakhein$/i.test(text) || /yaad\s+rahe$/i.test(text)) {
      text = `${text} ke backup zaroor banayein!`;
      repaired = true;
      issues.push('Completed unfinished "yaad rakhein" thought.');
    }
    // If it's a question, make sure it ends with '?'
    if (/^(kya|kyun|kaise|konsa|kahan)\b/i.test(text) && !text.endsWith('?')) {
      text = `${text.replace(/[.!,۔\s]+$/, '')}?`;
      repaired = true;
      issues.push('Appended question mark to curiosity query.');
    }
    // If scene 10, ensure it is a complete, well-formed sentence concluding the topic
    if (sceneNum === 10 && !/save|follow|subscribe/i.test(text)) {
      text = `${text.replace(/[.?!۔\s]+$/, '')}. Is video ko save kar lein aur IT Cafeteria ko follow karein!`;
      repaired = true;
      issues.push('Ensured Scene 10 contains complete Save CTA sentence.');
    }
  }

  // 7. Ensure terminal punctuation (. ? ! or Urdu ۔)
  if (!/[.?!۔]$/.test(text)) {
    const punct = sceneNum === 1 || isClosingOrTeaser ? '!' : '.';
    text = `${text}${punct}`;
    repaired = true;
    issues.push(`Appended missing terminal punctuation "${punct}".`);
  }

  // 8. Word count target: if over 28 words, shorten into a complete sentence
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 28) {
    const firstSentence = text.split(/[.?!۔]+/)[0]?.trim();
    if (firstSentence && firstSentence.split(/\s+/).length >= 15) {
      text = `${firstSentence}!`;
      repaired = true;
      issues.push(`Shortened dialogue to complete primary sentence (${text.split(/\s+/).length} words).`);
    }
  }

  return {
    valid: issues.length === 0,
    dialogue: text,
    repaired,
    issues
  };
}

/**
 * Validates and repairs an entire story's scene dialogues.
 */
export function validateStoryDialogues<T extends { num: number; dialogue: string; purpose?: string }>(
  scenes: T[]
): { scenes: T[]; allValid: boolean; totalRepairs: number } {
  let allValid = true;
  let totalRepairs = 0;

  const repairedScenes = scenes.map(scene => {
    const res = validateAndRepairDialogue(scene.dialogue, scene.num, scene.purpose);
    if (!res.valid) allValid = false;
    if (res.repaired) totalRepairs++;

    return {
      ...scene,
      dialogue: res.dialogue
    };
  });

  return {
    scenes: repairedScenes,
    allValid,
    totalRepairs
  };
}
