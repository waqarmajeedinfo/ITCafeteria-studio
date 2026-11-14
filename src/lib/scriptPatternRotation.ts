/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — 12-Pattern Sequential Script Rotation, Lahori Voice DNA & High-Retention Engine
 *
 * Enforces strict sequential rotation across 12 distinct pro-YouTuber script patterns,
 * guarantees authentic Lahori / Pakistani Punjab conversational tone + "Interesting Factor",
 * enforces strict Demo Opening Rule (topic-identifying question or hook BEFORE hands-on demo),
 * and prevents repetitive hooks/dialogues across stories.
 */

export interface ScriptPatternDefinition {
  order: number;
  id: string;
  name: string;
  isDemo: boolean;
  tone: string;
  angle: string;
  lahoriVoiceFlavor: string;
  retentionMechanic: string;
  openingRule: string;
  transitionRule: string;
  beatProgression: string[];
  ctaStyle: string;
}

export interface RecentStoryDialogueFingerprint {
  title: string;
  topic: string;
  patternId: string;
  patternName: string;
  order: number;
  tone: string;
  angle: string;
  hook: string;
  scene1Dialogue: string;
  scene2Dialogue?: string;
  ctaDialogue?: string;
  timestamp: string;
}

export interface ScriptRotationState {
  nextPatternIndex: number; // 0..11
  totalGenerated: number;
  lastPatternId?: string;
  lastPatternName?: string;
  recentStories: RecentStoryDialogueFingerprint[];
}

export const LAHORI_PUNJAB_VOICE_DNA = {
  identity: 'Authentic Lahori / Pakistani Punjab Tech & Lifestyle Storyteller (Waqar Majeed cadence)',
  rules: [
    'Natural Lahori conversational warmth — jese ek samajhdar Lahori dost ya bara bhai chai ki table par samjha raha ho.',
    'Use crisp Punjabi-touched Roman Urdu conversational bridges sparingly and naturally (e.g., "Yaar ek minute ruko", "Scene check karo", "Banda hairan reh jata hai", "Asal game yahan hai", "Seedhi si baat hai", "Kamaal ho gaya"). Never overdo caricature slang.',
    'Zero dry textbook or robotic corporate Urdu. Keep sentences punchy, rhythmic, and spoken.',
    'Keep Living Phonetic Dictionary rules strict: never use forbidden words like "turant" (use "usi waqt" / "foran"); keep acronyms hyphenated (A-I, G-P-T, C-M-D, P-C).',
    'Build an unmistakable "Interesting Factor" with a mid-story curiosity twist around Scene 5 ("Lekin ruko, asal mazay ki cheez ab aayegi...") and a binge-worthy series bridge at the end.'
  ]
};

export const SCRIPT_PATTERNS_12: ScriptPatternDefinition[] = [
  {
    order: 1,
    id: 'direct_problem_solving',
    name: 'Direct ProblemSolving',
    isDemo: false,
    tone: 'Punchy Lahori problem-solver — seedhi baat, zero bakwas, fori maslay ka hal.',
    angle: 'Spotlight the exact frustrating daily error or bottleneck first, expose the real root cause, then deliver the exact practical fix.',
    lahoriVoiceFlavor: 'Relatable Lahori frustration callout ("Yaar rozana is ek maslay pe dimagh kharab hota hai...") turning into instant relief.',
    retentionMechanic: 'Open with relatable pain + Scene 5 reveals the unexpected bonus safeguard that prevents the error forever.',
    openingRule: 'Scene 1 must spotlight the specific frustrating problem/error in warm Lahori tone and promise the verified solution.',
    transitionRule: 'Scene 2 diagnoses the root cause; Scenes 3-6 walk through the practical fix step-by-step.',
    beatProgression: [
      'Lahori Pain-Point Hook',
      'Root Cause Exposure',
      'Exact Fix Reveal',
      'Fix Step 1 (Exact Path)',
      'Mid-Story Retention Twist + Step 2',
      'Live Verification Proof',
      'Real-World Relief Result',
      'Mistake Prevention Tip',
      'Crisp Action Recap',
      'Binge Loop + Dilemma CTA'
    ],
    ctaStyle: 'Ask viewers which daily error is slowing them down right now and tease the next fix.'
  },
  {
    order: 2,
    id: 'before_after',
    name: 'BeforeAfter',
    isDemo: false,
    tone: 'High-contrast Lahori visual analyst — "Pehle kya haal tha aur ab scene check karo!"',
    angle: 'Lead with a stark night-and-day Before vs After transformation so viewers immediately see why upgrading matters.',
    lahoriVoiceFlavor: 'Expressive Lahori contrast ("Zameen aasman ka farq dekhna hai?...") with sharp visual storytelling.',
    retentionMechanic: 'Tease the After state in Scene 1, dissect the ugly Before trap in Scene 2, and keep viewers hooked for the side-by-side reveal.',
    openingRule: 'Scene 1 must contrast the weak/slow "Before" result with the sharp "After" transformation immediately.',
    transitionRule: 'Scene 2 exposes why the old "Before" habit fails; Scenes 3-7 construct the upgraded "After" workflow.',
    beatProgression: [
      'Lahori Before vs After Contrast Hook',
      'Why Old Way Fails Badly',
      'Transformation Trigger Reveal',
      'Upgrade Step 1',
      'Mid-Story Curiosity Spike + Step 2',
      'Side-by-Side Live Proof',
      'Extra Pro Polish',
      'Trap To Avoid Going Back',
      'Transformation Recap',
      'A/B Preference CTA + Next Episode Hook'
    ],
    ctaStyle: 'Ask viewers A vs B: purana tareeqa ya naya After method?'
  },
  {
    order: 3,
    id: 'seedha_demo',
    name: 'Seedha Demo',
    isDemo: true,
    tone: 'No-fluff Lahori live demonstrator — crisp curiosity question first, then seedha screen action.',
    angle: 'Topic-identifying Lahori question/hook in Scene 1 followed directly by an uninterrupted hands-on demonstration.',
    lahoriVoiceFlavor: 'Friendly Lahori guide ("Acha sawal yeh hai... chalo seedha screen te chaliye!") keeping energy grounded and practical.',
    retentionMechanic: 'Mandatory identifying question builds an open curiosity loop in Scene 1 that only gets answered when viewers watch the live clicks in Scenes 2-6.',
    openingRule: 'STRICT DEMO RULE: Scene 1 MUST start with an identifying question or hook dialogue clearly indicating the topic in Lahori tone BEFORE transitioning directly into hands-on demo in Scene 2.',
    transitionRule: 'Scene 2 cuts straight into hands-on screen execution ("Chalein seedha live screen par dekhte hain...") with zero lecture delay.',
    beatProgression: [
      'Lahori Topic-Identifying Question / Hook (Before Demo)',
      'Direct Hands-On Demo Step 1',
      'Live Hands-On Demo Step 2',
      'Key Toggle Execution',
      'Mid-Story Interesting Twist + Live Proof',
      'Real-World Practical Use',
      'Bonus Time-Saver Tweak',
      'Common Misclick Alert',
      '3-Second Demo Recap',
      'Save & Try-It CTA + Series Teaser'
    ],
    ctaStyle: 'Challenge viewers to test this live demo today and reply "Done" in comments.'
  },
  {
    order: 4,
    id: 'chhupe_hue_secrets',
    name: 'Chhupe hue Secrets',
    isDemo: false,
    tone: 'Curious Lahori tech insider — "Bande nu pata hi nahi hunda andar ki chhupya hai!"',
    angle: 'Expose buried official toggles, hidden gestures, and overlooked capabilities inside everyday tools that 99% users miss.',
    lahoriVoiceFlavor: 'Intriguing Lahori friend leaning in ("Yaar ek raaz ki baat suno...") sparking instant FOMO.',
    retentionMechanic: 'Promise 2 hidden layers: Secret #1 in Scene 3 and an even bigger Secret #2 twist in Scene 5 so retention never drops.',
    openingRule: 'Scene 1 must spark insider curiosity about a hidden capability inside the specific named tool/app.',
    transitionRule: 'Scene 2 reveals where the hidden menu lives; Scenes 3-5 unlock Secret #1 and Bonus Secret #2.',
    beatProgression: [
      'Lahori Insider Secret Hook',
      'Proof Of Hidden Option',
      'Secret #1 Activation',
      'Hidden Productivity Benefit',
      'Mid-Story Bonus Secret #2 Twist',
      'Live Before/After Secret Proof',
      'Privacy & Safety Guardrail',
      'Common Mistake Warning',
      'Secret Checklist Recap',
      'Next App Secret Request CTA'
    ],
    ctaStyle: 'Ask viewers which daily app hidden secret they want exposed next.'
  },
  {
    order: 5,
    id: 'tiktok_trickdemo',
    name: 'TikTok trickdemo',
    isDemo: true,
    tone: 'High-tempo Lahori viral trickster — tez punchy sawal, zero boreiyat, full interesting factor.',
    angle: 'Snappy curiosity-driven Lahori hook identifying the exact trick/topic, followed immediately by a rapid kinetic demonstration.',
    lahoriVoiceFlavor: 'Energetic Lahori Shorts creator ("Oye hoye yeh trick dekhi hai kabhi?...") with crisp pacing.',
    retentionMechanic: 'Fast open loop in Scene 1 + mind-blown visual payoff by Scene 5 + seamless infinite replay loop at the end.',
    openingRule: 'STRICT DEMO RULE: Scene 1 MUST start with a snappy identifying question or hook dialogue clearly naming the trick/topic BEFORE transitioning straight into rapid hands-on trick demo.',
    transitionRule: 'Scene 2 launches straight into the rapid-fire trick clicks with zero slow setup.',
    beatProgression: [
      'Lahori Viral Identifying Question / Hook',
      'Rapid Trick Demo Step 1',
      'Quick Trick Toggle Step 2',
      'Instant Payoff Proof',
      'Mid-Story "Yeh Dekho Kamaal" Bonus Twist',
      'Stop-Doing-This Trap Warning',
      'Real-Time Speedup Check',
      'Practical Daily Shortcut',
      'Flash 5-Second Recap',
      'Looping Viral Dilemma CTA'
    ],
    ctaStyle: 'Quick Yes/No or A/B dilemma keeping comment thread exploding.'
  },
  {
    order: 6,
    id: 'lecturrar_pattern',
    name: 'Lecturrar Pattern',
    isDemo: false,
    tone: 'Warm, authoritative Lahori ustad/mentor — complex concepts in simple desi analogies.',
    angle: 'Teach the underlying "kyun aur kaise" principle cleanly using relatable Pakistani examples before executing live.',
    lahoriVoiceFlavor: 'Respected Lahori mentor ("Pehle buniyadi logic samjho mere bhai, phir button dabana...") inspiring deep trust.',
    retentionMechanic: 'Pose a thought-provoking question in Scene 1, use a smart everyday analogy in Scene 2, and reward viewers with master-level clarity in Scene 6.',
    openingRule: 'Scene 1 must present a sharp mentor insight or core question framing why mastering this logic changes everything.',
    transitionRule: 'Scene 2 breaks down the core architecture simply before Scenes 3-7 guide live execution.',
    beatProgression: [
      'Lahori Mentor Thesis Hook',
      'Core Principle + Desi Analogy',
      'Why Blind Shortcuts Fail',
      'Guided Pillar 1 (Mechanism)',
      'Mid-Story Deep Insight + Pillar 2',
      'Live Practical Case Proof',
      'Analytical Benchmark Takeaway',
      'Critical Beginner Pitfall',
      'Structured Lecture Recap',
      'Homework Assignment + Series Follow CTA'
    ],
    ctaStyle: 'Assign a 1-minute practical test and invite viewers to share results in comments.'
  },
  {
    order: 7,
    id: 'myth_vs_reality',
    name: 'Myth vs Reality',
    isDemo: false,
    tone: 'Sharp Lahori fact-checker — politely dismantles viral jhoot with live tested sach.',
    angle: 'Challenge a widespread misconception about the topic, show why people get fooled, and prove the verified reality.',
    lahoriVoiceFlavor: 'Candid Lahori truth-teller ("Har banda yehi suni sunayi baat aage phaila raha hai, magar sach check karo...")',
    retentionMechanic: 'Call out a popular belief right at 0-2s so viewers stay to find out if what they believed was wrong.',
    openingRule: 'Scene 1 must spotlight a popular misconception tied directly to the topic and promise a live truth test.',
    transitionRule: 'Scene 2 reveals why the myth hurts performance/results; Scenes 3-7 prove the verified working method.',
    beatProgression: [
      'Lahori Myth-Busting Hook',
      'Why Everyone Gets Fooled',
      'Verified Reality Test',
      'Correct Practice Step 1',
      'Mid-Story Shocking Proof Twist',
      'Correct Practice Step 2',
      'Real-World Performance Gain',
      'Red-Flag Scam/Mistake Alert',
      'Truth vs Myth Recap',
      'Opinion Debate CTA'
    ],
    ctaStyle: 'Ask viewers honestly whether they used to believe this myth.'
  },
  {
    order: 8,
    id: 'speedrun_demo',
    name: 'Speedrun Challenge Demo',
    isDemo: true,
    tone: 'Energetic Lahori stopwatch challenger — "Bina waq-t zaya kiye seedha kaam mukammal!"',
    angle: 'Topic-identifying challenge question/hook in Scene 1, followed directly by an ultra-clean, timed step-by-step live demo.',
    lahoriVoiceFlavor: 'Crisp Lahori challenger ("Chalo aao check karte hain kitni safai se yeh kaam hota hai...") keeping momentum sky-high.',
    retentionMechanic: 'Sets a clear measurable target in Scene 1 ("kya yeh 3 steps mein ho sakta hai?") creating natural completion curiosity.',
    openingRule: 'STRICT DEMO RULE: Scene 1 MUST open with an identifying question or challenge hook dialogue clearly naming the topic BEFORE transitioning directly into hands-on speedrun demo.',
    transitionRule: 'Scene 2 begins live steps immediately with zero fluff.',
    beatProgression: [
      'Lahori Topic-Identifying Challenge Hook',
      'Speedrun Demo Move 1',
      'Speedrun Demo Move 2',
      'Speedrun Demo Move 3',
      'Mid-Story Precision Twist + Verification',
      'Bottleneck Removed Proof',
      'Automation Bonus Shortcut',
      'Safety Check Warning',
      'Zero-Fluff Speed Recap',
      'Challenge Comment CTA'
    ],
    ctaStyle: 'Ask how long viewers used to spend on this manually before seeing this speedrun.'
  },
  {
    order: 9,
    id: 'ghalti_alert',
    name: 'Ghalti Alert (Costly Mistake Rescue)',
    isDemo: false,
    tone: 'Protective Lahori elder brother — "Ruko yaar! Yeh ek ghalti poori mehnat zaya kar degi."',
    angle: 'Expose the #1 hidden mistake Pakistani creators/users make with this tool or workflow, show its damage, and rescue them with the right setup.',
    lahoriVoiceFlavor: 'Caring, high-stakes Lahori bhai warning ("Bhai yeh ghalti maine khud logon ko karte dekhi hai...")',
    retentionMechanic: 'Immediate danger/loss aversion in Scene 1 keeps viewers glued to verify whether they are making that mistake right now.',
    openingRule: 'Scene 1 must call out the specific hidden mistake around the topic immediately with relatable Lahori concern.',
    transitionRule: 'Scene 2 shows the exact damage caused by the mistake; Scenes 3-6 show the safe verified replacement.',
    beatProgression: [
      'Lahori Warning Hook (Stop This Mistake)',
      'Exact Damage Exposed',
      'Why Default Habits Trap Users',
      'Safe Replacement Step 1',
      'Mid-Story Rescue Check + Step 2',
      'Before Error vs Fixed Clean Output',
      'Extra Protection Setting',
      'Golden Rule To Remember',
      '2-Line Safety Recap',
      'Save-To-Protect CTA & Comment Check'
    ],
    ctaStyle: 'Ask viewers how many of them had this risky default turned on.'
  },
  {
    order: 10,
    id: 'live_showdown',
    name: 'Live Showdown (Method A vs Method B)',
    isDemo: false,
    tone: 'Exciting Lahori tech commentator — fair head-to-head muqabla with real verdict.',
    angle: 'Put the traditional/popular approach against the smart modern feature/tool on the exact same task and crown a clear winner.',
    lahoriVoiceFlavor: 'Spirited Lahori commentary ("Aaj maidan mein dono ko aamne samne check karte hain...") driving huge comment debates.',
    retentionMechanic: 'Scoreboard suspense from Scene 1 to Scene 7 forces viewers to watch till the final verdict.',
    openingRule: 'Scene 1 must set up a clear two-way showdown relevant to the exact topic so viewers pick a side mentally.',
    transitionRule: 'Scene 2 defines the fair test criteria; Scenes 3-6 test Option A vs Option B live.',
    beatProgression: [
      'Lahori Head-to-Head Showdown Hook',
      'Test Rules & Real Task Setup',
      'Round 1: Traditional Method Test',
      'Round 2: Smart Method Test',
      'Mid-Story Plot Twist (Unexpected Winner Edge)',
      'Side-by-Side Result Verdict',
      'When To Use Which Option',
      'Cost & Access Reality Check',
      'Final Scoreboard Summary',
      'Team A vs Team B Comment War CTA'
    ],
    ctaStyle: 'Direct Team A vs Team B vote in comments — supercharges algorithm engagement.'
  },
  {
    order: 11,
    id: 'desi_case_study',
    name: 'Real-Life Desi Case Study',
    isDemo: false,
    tone: 'Warm Lahori storyteller — relatable Pakistani office, student, or freelancer real situation.',
    angle: 'Wrap the technical solution inside a vivid, relatable 10-second Pakistani human story that hits home emotionally before demonstrating the fix.',
    lahoriVoiceFlavor: 'Classic Lahori storytelling charm ("Kal raat ek dost ka phone aaya, pareshan baitha tha...") creating instant connection.',
    retentionMechanic: 'Human story arc creates empathy at 0-10s and payoff satisfaction at 60-80s when the problem gets solved live.',
    openingRule: 'Scene 1 must drop straight into a relatable Pakistani scenario facing this exact topic problem.',
    transitionRule: 'Scene 2 shows how we tackled it together on screen; Scenes 3-6 reveal the winning workflow.',
    beatProgression: [
      'Relatable Lahori Story Hook',
      'The Real Bottleneck Moment',
      'The Turning-Point Idea',
      'Live Fix Applied Step 1',
      'Mid-Story Breakthrough Moment',
      'Live Fix Applied Step 2',
      'Final Saved Output & Relief',
      'Lesson Anyone Can Copy',
      'Quick Workflow Checklist',
      'Share With A Friend + Next Story CTA'
    ],
    ctaStyle: 'Ask viewers to tag or share with a friend facing this exact daily headache.'
  },
  {
    order: 12,
    id: 'zero_to_hero_roadmap',
    name: 'Zero-to-Hero Rapid Roadmap',
    isDemo: false,
    tone: 'Inspiring Lahori strategist — "Bilkul zero se shuru kar ke pro level tak seedhi plan!"',
    angle: 'Break the topic into 3 crisp progressive levels (Beginner -> Smart Setup -> Pro Edge) giving viewers a binge-worthy mastery ladder.',
    lahoriVoiceFlavor: 'Motivating Lahori coach ("Agar bilkul shuru se seekhna hai to bas yeh 3 levels pakar lo...")',
    retentionMechanic: 'Progress ladder ("Level 1 -> Level 2 -> Level 3") hooks viewers through every level and drives next-video clicks.',
    openingRule: 'Scene 1 must promise a crystal-clear 3-level roadmap from beginner confusion to confident mastery on this topic.',
    transitionRule: 'Scene 2 lays out Level 1 foundation; Scenes 3-6 climb Level 2 and Level 3 with concrete live proof.',
    beatProgression: [
      'Lahori 3-Level Mastery Hook',
      'Level 1: Clean Foundation Setup',
      'Level 2: Core Practical Execution',
      'Where Most Beginners Stall',
      'Mid-Story Level 3 Unlock (Pro Edge)',
      'Live Pro-Level Output Proof',
      'Free Tools Stack Summary',
      'Consistency Warning',
      'Complete 3-Step Roadmap Recap',
      'Series Binge Bridge + Subscribe CTA'
    ],
    ctaStyle: 'Ask viewers which level they are currently on (1, 2, or 3) and point to next episode.'
  }
];

// Export compatibility alias while keeping all 12 patterns active everywhere
export const SCRIPT_PATTERNS_8 = SCRIPT_PATTERNS_12;

const LOCAL_ROTATION_KEY = 'itcafeteria_script_pattern_rotation_v1';

export function isDemoScriptPattern(pattern?: Partial<ScriptPatternDefinition> | string | null): boolean {
  if (!pattern) return false;
  if (typeof pattern === 'string') {
    const lower = pattern.toLowerCase();
    return lower.includes('demo') || lower.includes('seedha') || lower.includes('tiktok');
  }
  if (pattern.isDemo === true) return true;
  const combined = `${pattern.id || ''} ${pattern.name || ''}`.toLowerCase();
  return combined.includes('demo');
}

export function createDefaultRotationState(): ScriptRotationState {
  return {
    nextPatternIndex: 0,
    totalGenerated: 0,
    recentStories: []
  };
}

export function getPatternByIndex(index: number): ScriptPatternDefinition {
  const safeIdx = ((Math.floor(index) % SCRIPT_PATTERNS_12.length) + SCRIPT_PATTERNS_12.length) % SCRIPT_PATTERNS_12.length;
  return SCRIPT_PATTERNS_12[safeIdx];
}

export function resolvePatternByIdOrName(idOrName?: string): ScriptPatternDefinition | null {
  if (!idOrName) return null;
  const q = idOrName.trim().toLowerCase();
  return (
    SCRIPT_PATTERNS_12.find(
      (p) =>
        p.id.toLowerCase() === q ||
        p.name.toLowerCase() === q ||
        `${p.order}. ${p.name}`.toLowerCase() === q
    ) || null
  );
}

/**
 * Pure state-object selector: picks current pattern in strict 1..12 sequence
 * without mutating the input state.
 */
export function selectNextPatternFromState(
  state: ScriptRotationState,
  requestedPatternId?: string
): { pattern: ScriptPatternDefinition; nextIndexAfter: number } {
  if (requestedPatternId) {
    const explicit = resolvePatternByIdOrName(requestedPatternId);
    if (explicit) {
      return {
        pattern: explicit,
        nextIndexAfter: (explicit.order % SCRIPT_PATTERNS_12.length)
      };
    }
  }
  const idx = ((Number(state?.nextPatternIndex) || 0) % SCRIPT_PATTERNS_12.length + SCRIPT_PATTERNS_12.length) % SCRIPT_PATTERNS_12.length;
  const pattern = SCRIPT_PATTERNS_12[idx];
  return {
    pattern,
    nextIndexAfter: (idx + 1) % SCRIPT_PATTERNS_12.length
  };
}

/**
 * Pure state updater: records generated story fingerprint and advances rotation strictly to next index.
 */
export function recordPatternUsageInState(
  state: ScriptRotationState,
  pattern: ScriptPatternDefinition,
  fingerprint: Omit<RecentStoryDialogueFingerprint, 'patternId' | 'patternName' | 'order' | 'tone' | 'angle' | 'timestamp'>
): ScriptRotationState {
  const nextIndex = (pattern.order % SCRIPT_PATTERNS_12.length);
  const existing = Array.isArray(state?.recentStories) ? state.recentStories : [];
  const entry: RecentStoryDialogueFingerprint = {
    ...fingerprint,
    patternId: pattern.id,
    patternName: pattern.name,
    order: pattern.order,
    tone: pattern.tone,
    angle: pattern.angle,
    timestamp: new Date().toISOString()
  };

  return {
    nextPatternIndex: nextIndex,
    totalGenerated: (Number(state?.totalGenerated) || 0) + 1,
    lastPatternId: pattern.id,
    lastPatternName: pattern.name,
    recentStories: [entry, ...existing].slice(0, 20)
  };
}

/**
 * Browser localStorage helpers (safe no-ops on Node server).
 */
export function loadLocalScriptRotationState(): ScriptRotationState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return createDefaultRotationState();
  }
  try {
    const raw = localStorage.getItem(LOCAL_ROTATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          nextPatternIndex: Number(parsed.nextPatternIndex) || 0,
          totalGenerated: Number(parsed.totalGenerated) || 0,
          lastPatternId: parsed.lastPatternId,
          lastPatternName: parsed.lastPatternName,
          recentStories: Array.isArray(parsed.recentStories) ? parsed.recentStories.slice(0, 20) : []
        };
      }
    }
  } catch {}
  return createDefaultRotationState();
}

export function saveLocalScriptRotationState(state: ScriptRotationState): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ROTATION_KEY, JSON.stringify(state));
  } catch {}
}

export function peekNextLocalScriptPattern(): ScriptPatternDefinition {
  const state = loadLocalScriptRotationState();
  return selectNextPatternFromState(state).pattern;
}

function normalizeTokens(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function computeDialogueSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeTokens(a));
  const tokensB = new Set(normalizeTokens(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function isDialogueTooSimilarToRecent(
  dialogue: string,
  recentStories: RecentStoryDialogueFingerprint[],
  threshold = 0.45
): boolean {
  const clean = String(dialogue || '').trim();
  if (!clean || !Array.isArray(recentStories) || recentStories.length === 0) return false;

  const firstFiveWords = clean.toLowerCase().split(/\s+/).slice(0, 5).join(' ');

  for (const prev of recentStories.slice(0, 14)) {
    const prevS1 = String(prev.scene1Dialogue || '').trim();
    const prevHook = String(prev.hook || '').trim();
    if (!prevS1 && !prevHook) continue;

    if (prevS1) {
      const prevFirstFive = prevS1.toLowerCase().split(/\s+/).slice(0, 5).join(' ');
      if (firstFiveWords && prevFirstFive && firstFiveWords === prevFirstFive) {
        return true;
      }
      if (computeDialogueSimilarity(clean, prevS1) >= threshold) {
        return true;
      }
    }
    if (prevHook && computeDialogueSimilarity(clean, prevHook) >= 0.6) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether a Scene 1 dialogue starts cleanly with a topic-identifying question or hook
 * rather than jumping straight into imperative demo commands ("Step 1:", "Click karein", etc.).
 */
export function hasDemoIdentifyingQuestionOrHook(dialogue: string, topicHint: string): boolean {
  const clean = String(dialogue || '').trim();
  if (!clean) return false;
  const lower = clean.toLowerCase();

  const abruptDemoOpenings = [
    /^(step\s*1|sab\s+se\s+pehle|pehle\s+step|ab\s+aap|direct\s+click|open\s+karein|settings\s+kholein|win\s*\+|ctrl\s*\+|terminal\s+open)/i
  ];
  if (abruptDemoOpenings.some((re) => re.test(lower))) {
    return false;
  }

  const hasQuestion =
    clean.includes('?') ||
    /\b(kya\s+aap|kya\s+aapko|kabhi\s+socha|kaise|kyun|konsa|jaante\s+hain|jante\s+hain|pata\s+hai|dekha\s+hai|socha\s+hai|karein\s+ge)\b/i.test(lower);

  const hasTopicHint = (() => {
    const words = normalizeTokens(topicHint).filter((w) => w.length >= 3);
    if (words.length === 0) return true;
    return words.some((w) => lower.includes(w));
  })();

  if (hasQuestion && hasTopicHint) return true;

  const hasCuriosityHookMarker =
    /\b(check\s+karein|check\s+karo|raaz|tareeqa|trick|formula|kamaal|behtareen|live\s+demo|mazay\s+ki|scene)\b/i.test(lower);

  return hasTopicHint && hasCuriosityHookMarker;
}

/**
 * Builds unique, topic-accurate Lahori / Pakistani Punjab Scene 1 opening dialogues per pattern
 * (22-25 words range, hyphenated acronyms safe, zero "turant").
 */
export function buildUniquePatternOpeningDialogue(params: {
  pattern: ScriptPatternDefinition;
  topic: string;
  toolName?: string;
  categoryName?: string;
  variantIndex?: number;
  recentStories?: RecentStoryDialogueFingerprint[];
}): string {
  const cleanTopic = String(params.topic || 'yeh smart workflow').replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  const shortTopic = cleanTopic.split(/\s+/).slice(0, 6).join(' ');
  const subject = (params.toolName && params.toolName.trim().length > 2) ? params.toolName.trim() : shortTopic;
  const topicAlreadyNamesSubject = shortTopic.toLowerCase().includes(subject.toLowerCase());
  const subjectOrTool = topicAlreadyNamesSubject ? 'is feature' : subject;
  const recent = params.recentStories || [];

  const poolByPattern: Record<string, string[]> = {
    direct_problem_solving: [
      `Yaar ${shortTopic} istemal karte waq-t agar aapka kaam bar bar atak jata hai, to fikar chhodein — aaj seedha aur pakka tareeqa dekhein!`,
      `Sache dil se batayein, kya ${shortTopic} ki wajah se aapka rozana ka waq-t zaya ho raha hai? Chaliye isi waqt masla khatam karein.`,
      `Lahore ho ya Karachi, har banda ${shortTopic} ke is ek maslay se tang hai — aao aaj mil kar isay hamesha ke liye theek karein.`
    ],
    before_after: [
      `Scene check karo yaar! Pehle ${shortTopic} mein ghanton lagte the, lekin sirf ek tabdeeli ke baad nateeja dekh kar aap hairan reh jayenge.`,
      `Aam user aur pro bande ke ${shortTopic} result mein zameen aasman ka farq kyun hota hai? Aaj live Before aur After khud dekhein!`,
      `Purana slow tareeqa bilkul side pe rakhein, kyunke ${shortTopic} ka naya Before aur After workflow aapki poori raftaar badal dega.`
    ],
    seedha_demo: [
      `Acha yaar ek seedha sawal: kya aap jaante hain ke ${shortTopic} screen par sirf chand clicks mein kaise chalta hai? Chalo live demo dekhein!`,
      `Kabhi socha hai ke ${shortTopic} asal screen par step by step kaise perform karta hai? Pehle topic samjhein phir seedha practical dekhein!`,
      `Yaar ${shortTopic} ke baare mein baatein bohot suni hongi, par kya aapne isay live chalte dekha hai? Aao seedha screen par chalte hain!`
    ],
    chhupe_hue_secrets: [
      `Yaar ek raaz ki baat bataun? ${subjectOrTool} ke andar ${shortTopic} ka ek chhupa hua option hai jo 99% log miss kar dete hain!`,
      `${shortTopic} to har koi chalata hai, magar settings ke andar chhupa yeh kamaal secret shayad hi kisi ne aapko aaj tak dikhaya ho.`,
      `Aksar log ${shortTopic} ka sirf upar wala hissa dekhte hain, lekin asal jaadu andar chhupa hai — chalo aaj parda uthate hain!`
    ],
    tiktok_trickdemo: [
      `Oye ruko! Kya aapne kabhi ${shortTopic} ki yeh kamaal trick screen par chalte dekhi hai? Pehle topic pakrein phir dekhein live magic!`,
      `Ek mazay ka sawal: kya ${shortTopic} bina kisi extra software ke ho sakta hai? Agar nahi pata to abhi yeh tez trickdemo dekhein!`,
      `Yaar yakeen maano, kya ${shortTopic} waqai itni asani se ho sakta hai? Jawab chahiye to baghair skip kiye yeh hands-on trick dekho!`
    ],
    lecturrar_pattern: [
      `Mere bhai, ${shortTopic} ka button dabane se pehle yeh samjho ke yeh system background mein kis usool par kaam karta hai!`,
      `Aaj ke short lecture mein hum ${shortTopic} ka poora architecture seedhi Pakistani zuban mein samjhenge taake kabhi ghalti na ho.`,
      `Zyada tar log ${shortTopic} ratta laga kar use karte hain, magar jab aap iski asal logic samajh lete hain to kaam asan ho jata hai.`
    ],
    myth_vs_reality: [
      `Yaar sab yehi samajhte hain ke ${shortTopic} sirf mehnge tools se hota hai, par aaj hum is mashhoor ghalat fehmi ka sach test kareinge!`,
      `${shortTopic} ke baare mein internet par jo purani baat chalti aa rahi hai kya woh theek hai? Aao aaj myth aur reality check karein!`,
      `Suni sunayi baaton par bilkul yaqeen na karein! Jab humne ${shortTopic} khud test kiya to haqeeqat kuch aur hi nikli.`
    ],
    speedrun_demo: [
      `Kya ${shortTopic} ko bina lambi baaton ke bilkul tezi aur safai se mukammal kiya ja sakta hai? Topic note karein aur live speedrun dekhein!`,
      `Aaj ka challenge seedha hai: kya ${shortTopic} chand seconds ke practical steps mein complete hota hai? Chalein abhi live test shuru karte hain!`,
      `Tayyar hain dekhne ke liye ke ${shortTopic} bina kisi rukaawat ke kaise run hota hai? Pehle hadaf dekhein, phir seedha hands-on challenge!`
    ],
    ghalti_alert: [
      `Ek second ruko yaar! Kahin aap bhi ${shortTopic} mein woh ek aam ghalti to nahi kar rahe jo aapka poora kaam kharab kar deti hai?`,
      `Khuda ka wasta hai ${shortTopic} chalate waq-t yeh default setting aise mat chhodein, warna baad mein bohot bara nuqsan ho sakta hai!`,
      `Aaj ek zaroori alert: 90% Pakistani users ${shortTopic} mein yeh ek ghalti karte hain, chalo foran check karke isay bachate hain.`
    ],
    live_showdown: [
      `Aaj maidan mein aamna samna hoga! Purana tareeqa jeetega ya ${shortTopic} ka naya smart option? Dono ko abhi live muqable par lagate hain!`,
      `Bara sawal yeh hai ke ${shortTopic} ke liye aam setting behtar hai ya pro workflow? Aaj khud live showdown mein faisla dekh lein!`,
      `Chalo aaj dhoodh ka dhoodh aur pani ka pani karein: ${shortTopic} mein dono tareeqon ko ek hi task de kar check karte hain!`
    ],
    desi_case_study: [
      `Kal raat mere ek Lahori dost ka phone aaya jo ${shortTopic} ki wajah se poori raat se phansa tha — phir humne yeh nuskha lagaya!`,
      `Socho aapki deadline sar par ho aur ${shortTopic} bilkul atak jaye — ek Pakistani freelancer ke sath kal yahi hua, dekho kaise nikla!`,
      `Asal zindagi ka scene suno: jab office mein ${shortTopic} ka kaam sir par aaya to sirf is ek trick ne poori team bacha li.`
    ],
    zero_to_hero_roadmap: [
      `Agar aap ${shortTopic} bilkul zero se shuru kar ke pro level tak seekhna chahte hain, to bas yeh teen levels dhyan se samajh lein!`,
      `${shortTopic} dekhne mein mushkil lagta hai, magar jab isay teen asan levels mein baant lein to har banda champion ban sakta hai.`,
      `Aaj aapke liye ${shortTopic} ka seedha Zero to Hero roadmap laya hoon — pehle buniyad pakrein, phir pro level par chhalang lagayein!`
    ]
  };

  const candidates = poolByPattern[params.pattern.id] || poolByPattern.seedha_demo;
  const startIdx = Math.abs(params.variantIndex || 0) % candidates.length;

  for (let offset = 0; offset < candidates.length; offset++) {
    const candidate = candidates[(startIdx + offset) % candidates.length];
    if (!isDialogueTooSimilarToRecent(candidate, recent, 0.42)) {
      return candidate;
    }
  }

  const dynamicVariants = [
    `Ghaur se suno yaar! Kya ${shortTopic} aapko bhi uljhata hai? Aaj iska bilkul naya aur verified Lahori tareeqa live dekhein!`,
    `Sawal bara interesting hai: ${shortTopic} mein asli game kis option se badalti hai? Chalo screen par iska practical test karein!`,
    `Kya aapne kabhi notice kiya ke ${shortTopic} ko smart banane ka rasta bilkul aapke samne maujood hai? Aao abhi dekhte hain!`
  ];
  return dynamicVariants[(startIdx + recent.length) % dynamicVariants.length];
}

/**
 * Builds a mid-story Retention / "Interesting Factor" curiosity spike around Scene 5
 * so viewers stay glued through the second half of the video.
 */
export function buildMidStoryRetentionSpikeDialogue(params: {
  pattern: ScriptPatternDefinition;
  topic: string;
  toolName?: string;
  variantIndex?: number;
}): string {
  const shortTopic = String(params.topic || 'yeh workflow').replace(/#\S+/g, '').trim().split(/\s+/).slice(0, 5).join(' ');
  const subject = (params.toolName && params.toolName.trim().length > 2) ? params.toolName.trim() : shortTopic;
  const v = Math.abs(params.variantIndex || 0);

  const spikes = [
    `Lekin yaar kahani yahan khatam nahi hoti — ab ${subject} ki woh interesting setting dekho jo poori game palat deti hai!`,
    `Acha ek second ruko, sab se mazay ki cheez ab aane wali hai — ${shortTopic} ka yeh pro hissa 90% log skip kar dete hain!`,
    `Yahan tak to aam baat thi, ab asal jaadu dekho ke ${subject} bina kisi extra mehnat ke final result kaise nikalta hai!`,
    `Ab zara ghaur se screen dekho, kyunke agla step hi woh secret spark hai jis se ${shortTopic} bilkul pro level lagta hai!`
  ];

  return spikes[(v + params.pattern.order) % spikes.length];
}

/**
 * Builds unique Lahori CTA + Binge-Watch Series Hook dialogues per script pattern.
 */
export function buildUniquePatternCTADialogue(params: {
  pattern: ScriptPatternDefinition;
  topic: string;
  channelName: string;
  variantIndex?: number;
}): string {
  const shortTopic = String(params.topic || 'yeh tool').replace(/#\S+/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
  const ch = params.channelName || 'IT Cafeteria';
  const v = Math.abs(params.variantIndex || 0);

  const map: Record<string, string[]> = {
    direct_problem_solving: [
      `Ab aap batayein yaar, ${shortTopic} mein konsa masla sab se zyada tang karta hai? Comment mein likhein aur agli video bhi zaroor dekhein!`,
      `Masla hal hua ho to video save karein aur ${ch} ko follow karein — kal is se bhi bari mushkil ka asan hal la raha hoon!`
    ],
    before_after: [
      `Sach batayein: purana tareeqa pasand aaya ya naya After scene? Comment mein A ya B likhein aur ${ch} ke sath jude rahein!`,
      `Before aur After dekh kar maza aaya? Video save karein aur agle live transformation ke liye ${ch} ki agli video abhi check karein!`
    ],
    seedha_demo: [
      `Live demo aapne dekh liya, ab khud try karke comments mein Done likhein! Mazeed practical demos ke liye ${ch} ko zaroor follow karein!`,
      `Yeh demo kaam ka laga ho to bookmark karein aur ${ch} subscribe kar lein — agli video mein iska advanced step dikhaunga!`
    ],
    chhupe_hue_secrets: [
      `Ab aapki farmaish par agli video banegi — kis app ka chhupa hua secret chahiye? Naam comment karein aur ${ch} follow karein!`,
      `Yeh raaz apne doston ko bhi bhejein aur rozana naye hidden features dekhne ke liye ${ch} ka bell icon daba dein!`
    ],
    tiktok_trickdemo: [
      `Imandari se batayein: kya aapko ${shortTopic} ki yeh trick pehle pata thi? Yes ya No comment karein aur ${ch} ko follow karein!`,
      `Is trick ko abhi save karein warna bhool jayenge! Agli tez trickdemo dekhne ke liye ${ch} par agla short miss na karein!`
    ],
    lecturrar_pattern: [
      `Aaj ka chhota sa homework: is logic ko ek baar khud test karke comment mein batayein, aur agle lecture ke liye ${ch} subscribe karein!`,
      `Concept crystal clear ho gaya ho to video save karein aur isi series ka agla chapter dekhne ke liye ${ch} ke sath rahein!`
    ],
    myth_vs_reality: [
      `Dil par haath rakh kar batayein, kya aap bhi pehle is baat ko sach maante the? Comment karein aur verified tech truth ke liye ${ch} dekhein!`,
      `Ghalat fehmi door hui ho to video share karein, aur har mashhoor myth ka live test dekhne ke liye ${ch} ko subscribe karein!`
    ],
    speedrun_demo: [
      `Speedrun pasand aaya? Pehle aapko is kaam mein kitna waq-t lagta tha? Comment mein likhein aur agla challenge ${ch} par dekhein!`,
      `Agla speedrun kis tool par hona chahiye? Apni pasand comment mein batayein aur ${ch} ko abhi subscribe karna na bhoolein!`
    ],
    ghalti_alert: [
      `Foran check karein kahin aapke paas bhi yeh ghalti on to nahi! Bachne ke baad comment mein Safe likhein aur ${ch} ko follow karein!`,
      `Yeh warning apne bhai ya dost ko zaroor bhejein taake unka bhi kaam bache, aur rozana safety alerts ke liye ${ch} subscribe karein!`
    ],
    live_showdown: [
      `Ab faisla aapke haath mein hai: Team A ya Team B? Apni team comment mein likhein aur agle muqable ke liye ${ch} follow karein!`,
      `Is showdown mein aapka winner konsa raha? Comment mein wajah batayein aur channel par doosre live tests bhi zaroor dekhein!`
    ],
    desi_case_study: [
      `Aapke sath ya kisi dost ke sath aisa scene kabhi hua hai? Apni kahani comment mein share karein aur mazeed real stories ${ch} par dekhein!`,
      `Yeh video us dost ko foran bhejein jo roz is maslay mein phansa rehta hai, aur rozana desi tech stories ke liye ${ch} follow karein!`
    ],
    zero_to_hero_roadmap: [
      `Aap is waq-t Level 1, 2 ya 3 mein se kis par khare hain? Comment mein number likhein aur agla level unlock karne ke liye ${ch} dekhein!`,
      `Is roadmap ko save karein taake bhool na jayein, aur Level 3 ka advanced breakdown dekhne ke liye ${ch} ko abhi subscribe karein!`
    ]
  };

  const options = map[params.pattern.id] || map.seedha_demo;
  return options[v % options.length];
}

/**
 * Post-processes generated scenes from either Gemini or deterministic builders:
 * 1. Enforces Demo Opening Question/Hook Rule on Scene 1 for Demo patterns.
 * 2. Diversifies Scene 1 dialogue if it duplicates recent stories.
 * 3. Keeps script DIALOGUE / He says synchronized with the updated Scene 1 dialogue.
 */
export function enforcePatternAndUniquenessOnStory<T extends { num: number; purpose: string; visual: string; dialogue: string; script: string; words?: number; isCTA?: boolean }>(params: {
  scenes: T[];
  hook: string;
  topic: string;
  toolName?: string;
  categoryName?: string;
  channelName?: string;
  pattern: ScriptPatternDefinition;
  recentStories: RecentStoryDialogueFingerprint[];
  variantIndex?: number;
}): {
  scenes: T[];
  hook: string;
  demoRuleRepaired: boolean;
  uniquenessRepaired: boolean;
} {
  const { scenes, topic, toolName, categoryName, pattern, recentStories, variantIndex = 0 } = params;
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { scenes, hook: params.hook, demoRuleRepaired: false, uniquenessRepaired: false };
  }

  const nextScenes = scenes.map((s) => ({ ...s }));
  let updatedHook = String(params.hook || '').trim();
  let demoRuleRepaired = false;
  let uniquenessRepaired = false;

  const s1 = nextScenes[0];
  const isDemo = isDemoScriptPattern(pattern);
  const currentS1Dialogue = String(s1.dialogue || '').trim();

  const failsDemoRule = isDemo && !hasDemoIdentifyingQuestionOrHook(currentS1Dialogue, `${topic} ${toolName || ''}`);
  const failsUniqueness = isDialogueTooSimilarToRecent(currentS1Dialogue, recentStories);

  if (failsDemoRule || failsUniqueness || !currentS1Dialogue) {
    const freshOpening = buildUniquePatternOpeningDialogue({
      pattern,
      topic,
      toolName,
      categoryName,
      variantIndex: variantIndex + recentStories.length,
      recentStories
    });

    if (failsDemoRule) demoRuleRepaired = true;
    if (failsUniqueness) uniquenessRepaired = true;

    s1.dialogue = freshOpening;
    s1.words = freshOpening.split(/\s+/).filter(Boolean).length;
    if (isDemo && !/question|hook|intro/i.test(s1.purpose || '')) {
      s1.purpose = 'Lahori Topic-Identifying Hook (Demo Intro)';
    }
    s1.script = syncDialogueInsideFlowScript(s1.script, freshOpening);
  }

  if (!updatedHook || isDialogueTooSimilarToRecent(updatedHook, recentStories, 0.56) || (isDemo && !hasDemoIdentifyingQuestionOrHook(updatedHook, `${topic} ${toolName || ''}`))) {
    updatedHook = s1.dialogue;
  }

  return {
    scenes: nextScenes,
    hook: updatedHook,
    demoRuleRepaired,
    uniquenessRepaired
  };
}

function syncDialogueInsideFlowScript(script: string, newDialogue: string): string {
  const safeScript = String(script || '');
  const escaped = newDialogue.replace(/"/g, "'").trim();
  if (/DIALOGUE:\s*"[\s\S]*?"/i.test(safeScript)) {
    return safeScript.replace(/DIALOGUE:\s*"[\s\S]*?"/i, `DIALOGUE: "${escaped}"`);
  }
  if (/\[VOICEOVER \/ DIALOGUE\]:\s*"[\s\S]*?"/i.test(safeScript)) {
    return safeScript.replace(/\[VOICEOVER \/ DIALOGUE\]:\s*"[\s\S]*?"/i, `[VOICEOVER / DIALOGUE]: "${escaped}"`);
  }
  if (/He says:\s*"[\s\S]*?"/i.test(safeScript)) {
    return safeScript.replace(/He says:\s*"[\s\S]*?"/i, `He says: "${escaped}"`);
  }
  return safeScript ? `${safeScript.trim()}\nDIALOGUE: "${escaped}"` : `DIALOGUE: "${escaped}"`;
}

/**
 * Builds the backend Gemini prompt block describing the active sequential pattern,
 * Lahori Pakistani Punjab voice identity, mid-story Interesting Factor spike,
 * Demo Opening Rule, and forbidden recent story dialogues.
 */
export function buildPromptSectionForScriptPattern(
  pattern: ScriptPatternDefinition,
  recentStories: RecentStoryDialogueFingerprint[]
): string {
  const recentOpeners = (recentStories || [])
    .slice(0, 10)
    .map((r, i) => `  ${i + 1}. [${r.patternName}] Title: "${r.title}" | Opener: "${r.scene1Dialogue || r.hook}"`)
    .join('\n');

  const demoSection = isDemoScriptPattern(pattern)
    ? `
MANDATORY DEMO PATTERN OPENING RULE (CRITICAL — DO NOT VIOLATE):
- "${pattern.name}" is classified as a DEMO pattern.
- Scene 1 MUST strictly start with an IDENTIFYING QUESTION or TOPIC HOOK DIALOGUE in authentic Lahori Roman Urdu that clearly indicates/names the exact topic and sparks curiosity FIRST — BEFORE transitioning directly into the hands-on demonstration in Scene 2+.
- FORBIDDEN in Scene 1: Do NOT start Scene 1 with "Step 1:", "Sab se pehle click karein", "Settings kholein", or jumping straight into mouse clicks without first asking/identifying the topic hook!
- Scene 2 then cuts straight into hands-on demonstration steps with crisp visual clarity.`
    : `
PATTERN EXECUTION RULE:
- Scene 1 must embody "${pattern.name}": ${pattern.openingRule}
- Transition Rule: ${pattern.transitionRule}`;

  return `
STRICT SEQUENTIAL SCRIPT PATTERN & CREATIVE VARIETY (MANDATORY):
- Active Rotation Slot: Pattern ${pattern.order} of ${SCRIPT_PATTERNS_12.length} — "${pattern.name}" ${isDemoScriptPattern(pattern) ? '(CLASSIFICATION: DEMO PATTERN)' : '(CLASSIFICATION: HIGH-RETENTION NARRATIVE PATTERN)'}
- Required Unique Tone: ${pattern.tone}
- Required Unique Angle: ${pattern.angle}
- Lahori / Pakistani Punjab Flavor: ${pattern.lahoriVoiceFlavor}
- Retention & Interesting Factor Mechanic: ${pattern.retentionMechanic}
- Pattern Beat Sequence: ${pattern.beatProgression.join(' -> ')}
- Pattern CTA & Binge Style: ${pattern.ctaStyle}
${demoSection}

AUTHENTIC LAHORI PAKISTANI PUNJAB TONE & HIGH-RETENTION INTERESTING FACTOR (NON-NEGOTIABLE):
- ${LAHORI_PUNJAB_VOICE_DNA.identity}
- ${LAHORI_PUNJAB_VOICE_DNA.rules.join('\n- ')}
- MID-STORY INTERESTING FACTOR (SCENE 5 RULE): Around Scene 5 (middle of the short/video), insert a fresh curiosity spike or "twist/secret bonus" line ("Lekin yaar kahani yahan khatam nahi hoti...", "Ab sab se mazay ki cheez dekho...") so viewer retention stays above 50% and nobody swipes away mid-video!
- BINGE-WATCH TRIGGER (FINAL SCENE): Never end abruptly. Link the final CTA naturally to trying the tip + watching the next episode/video on the channel so viewers watch more videos in a row.

UNIQUE DIALOGUE & ANTI-REPETITION MANDATE (ZERO REUSED PHRASING):
- Every story's tone, angle, opening hook, transitions, and spoken dialogue MUST be 100% fresh and unique compared to recent stories, while aligning seamlessly with the topic's technical/niche requirements and category.
- NEVER reuse opening lines, catchphrases back-to-back, transition clichés, or identical CTA phrasing from the recent stories below:
${recentOpeners || '  (No prior stories in rotation log yet — set a strong fresh Lahori benchmark!)'}
`;
}
