/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Multi-Channel Profile Store, Smarter Duplicate Check, & Topic Bank Engine
 */

import { PUBLISHED_VIDEOS, type PublishedVideo, type ChannelProfile } from '../data/channelData';
import type { GeneratedStory } from '../components/StoryPackageView';

export interface DynamicPublishedStory extends PublishedVideo {
  sourceRecordId?: string;
  storyPackage?: GeneratedStory;
  isPlatformGenerated?: boolean;
  publishedAt?: string;
  youtubeUrl?: string;
  covered_points?: string[];
  channelId?: string;
}

export type DuplicateVerdictType = 'new' | 'partial' | 'exact' | 'unverified';

export interface DuplicateCheckResult {
  verdict: DuplicateVerdictType;
  level1AppDetected: string | null;
  level1Count: number;
  level1Note?: string;
  matchedStoryId?: number | string;
  matchedStoryTitle?: string;
  matchedPoint?: string;
  candidatePoint?: string;
  reason: string;
  confidence: number;
}

export interface TopicSource {
  name: string;
  url: string;
  date?: string;
  verifiedOfficial?: boolean;
}

export interface TopicCard {
  id: string;
  channelId: string;
  title: string;
  hook: string;
  categoryId: number;
  aspectRatio: '9:16' | '16:9';
  lens: 'Lens 1: New Updates' | 'Lens 2: Questions & Problems' | 'Lens 3: Competitor Gap' | 'Lens 4: Category Functionality';
  whyNow: string;
  angle: string;
  keyPoints: string[];
  sources: TopicSource[];
  verificationStatus: 'verified' | 'needs_verification';
  duplicateVerdict: DuplicateVerdictType;
  matchedStoryTitle?: string;
  matchedStoryPoint?: string;
  competitorCoverage: 'none' | 'news-only' | 'full-tutorial';
  gapLine: string;
  score: number; // 0-100
  scoreReason: string;
  expiresAt: string | 'evergreen';
  status: 'saved' | 'in_production' | 'published' | 'stale' | 'discarded';
  createdAt: string;
  linkedStoryId?: string;
}

export interface CompetitorItem {
  id: string;
  channelId: string;
  name: string;
  channelIdOrUrl: string;
  group: 'local' | 'global' | 'aspirational';
  notes?: string;
  recentUploads?: Array<{
    title: string;
    publishedAt: string;
    videoId?: string;
    toolsMentioned?: string[];
  }>;
}

export interface LensSourceConfig {
  name: string;
  url?: string;
  category?: string;
  notes?: string;
  focus?: string;
  id?: string;
  enabled?: boolean;
}

export interface ProfileResearchSettings {
  lens1WindowHours: number; // default: 48
  lens2WindowDays: number; // default: 90
  lens3WindowDays: number; // default: 7
  lens4WindowDays: number; // default: 30
  warnCrossChannelDuplicate: boolean; // default: false
  sourcesByLens: {
    lens1: LensSourceConfig[];
    lens2: LensSourceConfig[];
    lens3: LensSourceConfig[];
    lens4: LensSourceConfig[];
  };
}

// 58 catalog stories pre-analyzed covered points for IT Cafeteria (specific secrets/tricks/steps — never plain tool names)
export const IT_CAFETERIA_CATALOG_COVERED_POINTS: Record<number, string[]> = {
  1: ["Gemini 4 Argon multimodal reasoning on enterprise logs", "GitHub Copilot deep coding assistance", "Automated cloud infrastructure scripts"],
  2: ["Win+V Clipboard History activation shortcut", "Pasting text clips copied hours earlier", "Pinning permanent text clips to clipboard menu"],
  3: ["Setting up store catalog without holding physical inventory", "Automating supplier product sync and remote client chats", "No-inventory dropshipping cashflow pipeline"],
  4: ["Active Memory and Active Focus context buffer", "Preserving conversational state across long tasks", "Benchmark speed for long-context recall"],
  5: ["No-code desktop flow for daily Excel data entry", "Auto-triggering desktop tasks on file drop", "Automating repetitive spreadsheet formatting"],
  6: ["Start Frame and End Frame interpolation in Google Flow", "Eliminating character face morphing across video cuts", "Locking visual continuity between keyframes"],
  7: ["Real-time phone camera visual scanning of objects and error codes", "Hands-free audio inquiry during live camera inspection", "Instant visual troubleshooting of physical hardware and cables"],
  8: ["Live screen-share error diagnosis in Gemini", "Instant debugging of running console errors without pasting", "Voice walkthrough while viewing developer screen"],
  9: ["Source-grounded Q&A against uploaded PDF research", "Generating two-host audio podcast from document notes", "Clickable citation links pointing to exact document page"],
  10: ["Speed vs deep reasoning benchmark comparison across frontier models", "Which model handles Roman Urdu technical nuances accurately", "Cost and latency evaluation for student workflows"],
  11: ["Autonomous agent handoff loop in OpenAI Swarm", "Multi-agent task distribution and result synthesis", "Daily scheduled autonomous web research pipeline"],
  12: ["Broadcast delivery and read analytics dashboard", "Measuring customer conversion rates from broadcast lists", "Tracking message open rates and reply latency"],
  13: ["Pinning 3 most important priority chats to the top", "Setting distinct custom ringtones per client contact", "Setting disappearing messages timer for privacy (24h/7d/90d)"],
  14: ["Editing sent messages within the 15-minute window", "Fingerprint and FaceID biometric chat lock", "Sending uncompressed full-resolution HD media"],
  15: ["1.5x and 2x voice note playback acceleration", "Linking up to 4 companion phones to single account", "Hiding online presence status while actively typing"],
  16: ["Disabling read receipts to hide blue double-ticks", "Markdown formatting with asterisks, underscores, and tildes", "Starring critical messages for quick bookmark search"],
  17: ["Activating God Mode master panel with GUID folder code {ED7BA470-8E54-465E-825C-99712043E01C}", "Accessing 200+ hidden system settings in one window", "Quick administrative control shortcuts without settings app"],
  18: ["Magic Switch layout and auto-resize across platforms", "Generative text-to-graphic asset synthesis in Canva", "Multi-page design consistency with Brand Kit"],
  19: ["CapCut text-to-speech voice styling and tone adjustments", "Auto-caption generator with dynamic kinetic presets", "Video background removal without green screen"],
  20: ["Midjourney v7 photorealistic prompt syntax rules", "Character reference parameter (--cref) for identical face", "Style reference parameter (--sref) for cinematic color grading"],
  21: ["Runway Gen-3 Alpha multi-axis camera motion controls", "Motion brush for selective regional animation", "Text-to-high-fidelity cinematic 4K video rendering"],
  22: ["ElevenLabs voice cloning from 1-minute audio sample", "Emotion stability and similarity sliders configuration", "Multilingual Urdu accent dubbing without robotic artifacts"],
  23: ["Cleanmgr & %temp% junk file purge shortcut", "Freeing up C-Drive red bar space safely", "Disabling high-impact startup apps in Task Manager"],
  24: ["Suno AI v4 full musical arrangement generation", "Custom lyrical metronome and style genre tags", "Commercial stems separation and instrumental mix"],
  25: ["Center Across Selection (Ctrl+1 -> Alignment)", "Safe alternative to Merge Cells in Excel", "Preventing sorting and VLOOKUP formula breaks in tables"],
  26: ["Perplexity AI Pro search citations and follow-up threads", "Focus mode filters: Academic, YouTube, and Reddit", "Collections feature for structured team research dossiers"],
  27: ["Claude 3.7 Sonnet extended thinking mode toggle", "Architecting multi-file codebases without hallucinations", "Complex full-stack system debugging and refactoring"],
  28: ["Screen sharing with device system audio in video calls", "Secret code password for hidden locked WhatsApp chats", "Instant 60-second circular video message shortcut"],
  29: ["Activating Ultimate Performance power plan via powercfg command", "Maximum CPU frequency locking with zero throttling", "Eliminating FPS drops and render stutter in Windows"],
  30: ["Google Sheets Smart Fill AI pattern auto-detection", "Splitting combined phone numbers and emails without formulas", "Instant multi-column text normalization"],
  31: ["Gamma App prompt-to-presentation slide generation", "Exporting interactive decks to PowerPoint and web", "Embedding live analytics widgets directly into slides"],
  32: ["DeepSeek R1 open-weight local model execution via Ollama", "Zero-cost local coding benchmarks matching proprietary models", "Offline reasoning pipelines without cloud API fees"],
  33: ["Kling AI 1.5 camera path positioning and motion control", "Realistic human body physics and facial expression rendering", "Prompt structuring for 1080p cinematic video clips"],
  34: ["Bolt.new prompt-to-fullstack application generator", "Live WebContainer execution inside browser tabs", "One-click deployment to Netlify and custom domains"],
  35: ["Lovable dev full-stack web builder with Supabase backend", "Automated database schema creation and auth configuration", "Exporting clean React code directly to GitHub repository"],
  36: ["Automating instant WhatsApp order alerts via HTTP webhooks", "Triggering customer notifications on new online store orders", "Sending approved templated WhatsApp messages automatically"],
  37: ["Cursor AI Composer multi-file project refactoring", "Full codebase indexing for context-aware code generation", "Configuring custom .cursorrules for project standards"],
  38: ["v0 by Vercel React UI generator from screenshots", "Tailwind CSS component generation and live preview", "Direct copy-paste integration into Next.js and Vite apps"],
  39: ["Flux 1.1 Pro Ultra accurate typography rendering in images", "Clean legible English text inside generative visuals", "High-frequency 2K photorealism and skin textures"],
  40: ["Win+R secret diagnostic commands: msconfig, mrt, perfmon", "Running malicious software removal tool deep background scans", "Diagnosing hardware resource bottlenecks via Performance Monitor"],
  41: ["Pika 2.0 Pikaffects physics simulation: melt, explode, inflate", "Keyframe timing and motion physics parameters", "Transforming static image objects into kinetic effects"],
  42: ["HeyGen custom interactive video avatar from webcam footage", "Lip-sync synthesis across 40+ languages", "Automating multilingual product tutorial video pipelines"],
  43: ["Napkin AI text-to-infographic visual documentation", "Converting dense articles into structured visual flowcharts", "Exporting scalable vector SVG graphics for presentations"],
  44: ["Make.com vs Zapier visual automation pipeline comparison", "Router branches, filters, and error-handling configurations", "Cost-effective webhook pipelines for high-volume tasks"],
  45: ["Ollama local LLM runner setup on desktop PC", "Running Llama 3.3 and DeepSeek completely offline", "Privacy-first local AI operations without internet connection"],
  46: ["Whisper AI local voice transcription with zero cloud latency", "SRT subtitle file generation with word-level timestamps", "Accurate Roman Urdu and English mixed dialect transcription"],
  47: ["WhatsApp Business multi-device sync without keeping phone online", "Meta AI assistant integration inside business chats", "Catalog inventory management synced across desktop and mobile"],
  48: ["WhatsApp Business color-coded customer lifecycle labels", "Targeted broadcast lists without creating noisy group chats", "Filtering customer chats by paid, pending, and shipped status"],
  49: ["WhatsApp Business product catalog setup with item prices", "Generating direct WhatsApp purchase links for social media", "Sharing seasonal collections directly in customer chats"],
  50: ["WhatsApp Business automated away messages and greeting replies", "Quick reply keyboard shortcuts for FAQs (/price, /bank, /hours)", "Handling after-hours customer inquiries automatically"],
  51: ["WhatsApp Business verified official profile setup", "Configuring verified business hours, support email, and location", "Building buyer trust with complete business credentials"],
  52: ["Migrating regular WhatsApp to WhatsApp Business without data loss", "Full chat and media backup to Google Drive before switch", "Clean profile transition retaining complete customer history"],
  53: ["Google Chrome secret flags for 2X parallel download speed", "Enabling Memory Saver and proactive Tab Discarding", "Optimizing hardware-accelerated video decoding in browser"],
  54: ["Google Drive advanced search operators: type:pdf, owner:me, before:date", "Restoring permanently overwritten document versions", "Organizing shared folders with color codes and shortcuts"],
  55: ["Gmail search filters for gigabyte storage recovery: size:10M, older_than:1y", "Auto-cleaning bloated promotional inbox clutter in 1 click", "Creating automatic rule filters for incoming client attachments"],
  56: ["YouTube secret URL parameters: exact timestamp sharing and loop toggle", "Clean distraction-free full-screen embeds", "Keyboard timeline navigation shortcuts: J, K, L, M, and F"],
  57: ["Telegram scheduled messages and silent sending without notification sound", "Sending uncompressed original files up to 2GB in size", "Setting up anonymous custom public usernames"],
  58: ["Google Maps offline city map downloads for internet-free navigation", "Measuring straight-line distance between geographic pins", "Saving exact vehicle parking locations and timeline history"]
};

// Default niche-specific sources for research lenses
export const DEFAULT_RESEARCH_SOURCES: Record<string, ProfileResearchSettings['sourcesByLens']> = {
  itcafeteria: {
    lens1: [
      { name: 'TechCrunch', url: 'https://techcrunch.com', category: 'Tech News' },
      { name: 'The Verge', url: 'https://www.theverge.com', category: 'Tech & Gadgets' },
      { name: 'Ars Technica', url: 'https://arstechnica.com', category: 'Deep Tech' },
      { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com', category: 'Windows & Security' },
      { name: 'Windows Central', url: 'https://www.windowscentral.com', category: 'Windows & PC' },
      { name: '9to5Google', url: 'https://9to5google.com', category: 'Google & Android' },
      { name: 'Android Authority', url: 'https://www.androidauthority.com', category: 'Android & Apps' },
      { name: 'ProPakistani Tech', url: 'https://propakistani.pk/category/tech-and-telecom/', category: 'Pakistan Tech' },
      { name: 'Google Official Blog', url: 'https://blog.google', category: 'Official Releases' },
      { name: 'Microsoft Official Blog', url: 'https://blogs.microsoft.com', category: 'Official Releases' },
      { name: 'OpenAI Newsroom', url: 'https://openai.com/news/', category: 'Official Releases' },
      { name: 'Meta Newsroom', url: 'https://about.fb.com/news/', category: 'Official Releases' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com', category: 'Product Launches' },
      { name: 'Hugging Face', url: 'https://huggingface.co', category: 'Open Source AI' }
    ],
    lens2: [
      { name: 'Reddit r/techsupport', url: 'https://reddit.com/r/techsupport', category: 'PC Troubles' },
      { name: 'Reddit r/Windows11', url: 'https://reddit.com/r/Windows11', category: 'Windows Bugs' },
      { name: 'Reddit r/whatsapp', url: 'https://reddit.com/r/whatsapp', category: 'WhatsApp Issues' },
      { name: 'Reddit r/ChatGPT', url: 'https://reddit.com/r/ChatGPT', category: 'AI Questions' },
      { name: 'Reddit r/LocalLLaMA', url: 'https://reddit.com/r/LocalLLaMA', category: 'Open Models' },
      { name: 'Stack Exchange Super User', url: 'https://superuser.com', category: 'Technical QA' },
      { name: 'Microsoft Community Forum', url: 'https://answers.microsoft.com', category: 'Official QA' },
      { name: 'Google Help Community', url: 'https://support.google.com', category: 'Official QA' },
      { name: 'Quora Tech Topics', url: 'https://www.quora.com/topic/Technology', category: 'Trending Questions' },
      { name: 'XDA Developers Forum', url: 'https://xdaforums.com', category: 'Phone Tweaks' }
    ],
    lens3: [
      { name: 'Technology Gyan', url: 'https://www.youtube.com/@TechnologyGyan', category: 'Regional Competitor' },
      { name: 'Technical Guruji', url: 'https://www.youtube.com/@TechnicalGuruji', category: 'Regional Competitor' },
      { name: 'Trakin Tech', url: 'https://www.youtube.com/@TrakinTech', category: 'Regional Competitor' },
      { name: 'Beebom', url: 'https://www.youtube.com/@BeebomCo', category: 'Global Tech' },
      { name: 'Mrwhosetheboss', url: 'https://www.youtube.com/@mrwhosetheboss', category: 'Aspirational Global' },
      { name: 'Fireship', url: 'https://www.youtube.com/@Fireship', category: 'Fast Paced Tech' }
    ],
    lens4: [
      { name: '16 Secrets Apps Release Notes', focus: 'WhatsApp, Chrome, Maps, Gmail, Drive, Play Store, YouTube, Instagram, Facebook, TikTok, Telegram, Windows, ChatGPT, Gemini, CapCut, Google' },
      { name: 'Power Automate & Desktop Flows', focus: 'Web scraping, email workflows, clean Excel output, auto reporting' },
      { name: 'PC & Windows Hidden System Tools', focus: 'CMD, PowerShell, Registry hacks, performance optimization' },
      { name: 'YouTube Automation Chapters', focus: 'Faceless channels, title engineering, B-Roll synthesis' }
    ]
  },
  beautyhub: {
    lens1: [
      { name: 'Allure Beauty News', url: 'https://www.allure.com', category: 'Beauty News' },
      { name: 'Byrdie Beauty', url: 'https://www.byrdie.com', category: 'Skincare & Hair' },
      { name: 'Vogue Beauty', url: 'https://www.vogue.com/beauty', category: 'Trends' },
      { name: 'Cosmopolitan Beauty', url: 'https://www.cosmopolitan.com/style-beauty/', category: 'Grooming' },
      { name: 'InStyle Beauty', url: 'https://www.instyle.com/beauty', category: 'Celebrity Looks' },
      { name: 'Dermatology Times', url: 'https://www.dermatologytimes.com', category: 'Ingredient Science' }
    ],
    lens2: [
      { name: 'Reddit r/SkincareAddiction', url: 'https://reddit.com/r/SkincareAddiction', category: 'Skin Problems' },
      { name: 'Reddit r/MakeupAddiction', url: 'https://reddit.com/r/MakeupAddiction', category: 'Makeup Help' },
      { name: 'Reddit r/HaircareScience', url: 'https://reddit.com/r/HaircareScience', category: 'Hair Damage' },
      { name: 'Quora Skincare & Beauty', url: 'https://www.quora.com/topic/Skin-Care', category: 'Common Questions' }
    ],
    lens3: [
      { name: 'Smitha Deepak', url: 'https://www.youtube.com/@SmithaDeepak', category: 'Makeup Tutorials' },
      { name: 'Hyram', url: 'https://www.youtube.com/@Hyram', category: 'Skincare Specialist' },
      { name: 'Brad Mondo', url: 'https://www.youtube.com/@BradMondo', category: 'Haircare' },
      { name: 'Jovita George', url: 'https://www.youtube.com/@mrjovitageorge', category: 'South Asian Beauty' }
    ],
    lens4: [
      { name: 'Daily Skincare Secrets', focus: 'Sunscreen myths, niacinamide vs vitamin C, barrier repair' },
      { name: 'Budget Makeup Hacks', focus: 'Flawless base without cakey look, lipstick hacks, eyeliner tricks' },
      { name: 'Natural Hair Routines', focus: 'Heatless curls, hair fall control, split end prevention' }
    ]
  },
  digitalchefelite: {
    lens1: [
      { name: 'Eater', url: 'https://www.eater.com', category: 'Food News' },
      { name: 'Food & Wine', url: 'https://www.foodandwine.com', category: 'Culinary Trends' },
      { name: 'Bon Appetit', url: 'https://www.bonappetit.com', category: 'Kitchen Tips' },
      { name: 'Serious Eats', url: 'https://www.seriouseats.com', category: 'Food Science' }
    ],
    lens2: [
      { name: 'Reddit r/Cooking', url: 'https://reddit.com/r/Cooking', category: 'Kitchen Troubles' },
      { name: 'Reddit r/AskCulinary', url: 'https://reddit.com/r/AskCulinary', category: 'Chef QA' },
      { name: 'Reddit r/Baking', url: 'https://reddit.com/r/Baking', category: 'Baking Fixes' }
    ],
    lens3: [
      { name: 'Ranveer Brar', url: 'https://www.youtube.com/@RanveerBrar', category: 'Regional Master' },
      { name: 'Village Food Secrets', url: 'https://www.youtube.com/@VillageFoodSecrets', category: 'Local Giant' },
      { name: 'Babish Culinary Universe', url: 'https://www.youtube.com/@babishculinaryuniverse', category: 'Aspirational' },
      { name: 'Gordon Ramsay', url: 'https://www.youtube.com/@gordonramsay', category: 'Global Icon' }
    ],
    lens4: [
      { name: 'Secret Spices & Marinades', focus: 'Biryani aroma secrets, tender meat hacks, crisp frying' },
      { name: '10-Minute Rapid Meals', focus: 'Office lunch hacks, 3-ingredient sauces, quick breakfasts' }
    ]
  }
};

// Storage Keys
const PROFILE_LIBRARY_PREFIX = 'itcafeteria_profile_library_';
const PROFILE_TOPIC_BANK_PREFIX = 'itcafeteria_profile_topic_bank_';
const PROFILE_COMPETITORS_PREFIX = 'itcafeteria_profile_competitors_';
const PROFILE_RESEARCH_PREFIX = 'itcafeteria_profile_research_';
export const TOPIC_BANK_UPDATED_EVENT = 'itcafeteria_topic_bank_updated';
export const PROFILE_LIBRARY_UPDATED_EVENT = 'itcafeteria_profile_library_updated';

/**
 * Loads published stories for a specific profile.
 * IT Cafeteria gets the 58 catalog videos pre-populated with covered points.
 * Other profiles have their own isolated library.
 */
export function loadProfileLibrary(channelId: string): DynamicPublishedStory[] {
  if (typeof window === 'undefined') {
    if (channelId === 'itcafeteria') {
      return PUBLISHED_VIDEOS.map(v => ({
        ...v,
        channelId: 'itcafeteria',
        isPlatformGenerated: false,
        covered_points: IT_CAFETERIA_CATALOG_COVERED_POINTS[v.id] || [v.points]
      }));
    }
    return [];
  }

  const key = `${PROFILE_LIBRARY_PREFIX}${channelId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Error loading profile library for ${channelId}:`, e);
  }

  // Default seed for itcafeteria: 58 catalog videos with covered points
  if (channelId === 'itcafeteria') {
    const defaultList: DynamicPublishedStory[] = PUBLISHED_VIDEOS.map(v => ({
      ...v,
      channelId: 'itcafeteria',
      isPlatformGenerated: false,
      covered_points: IT_CAFETERIA_CATALOG_COVERED_POINTS[v.id] || [v.points]
    }));
    saveProfileLibrary('itcafeteria', defaultList);
    return defaultList;
  }

  // Seed for beautyhub: beauty-specific sample catalog so it is completely clean from tech
  if (channelId === 'beautyhub') {
    const beautySeed: DynamicPublishedStory[] = [
      {
        id: 1,
        title: "Glass Skin Skincare Routine: 3 Home Ingredients for Glowing Skin",
        length: "1:05",
        tool: "Rice Water & Aloe Vera",
        points: "Korean glass skin technique at home using rice water toner and pure aloe vera gel",
        series: "Skincare Secrets",
        published: "Oct 2026",
        covered_points: [
          "Fermented rice water toner preparation",
          "Layering aloe vera gel on damp skin",
          "Locking moisture with light cold-pressed oil"
        ],
        channelId: 'beautyhub',
        isPlatformGenerated: false
      },
      {
        id: 2,
        title: "Stop Cakey Foundation! 1 Powder Trick Every Girl Should Know",
        length: "1:10",
        tool: "Translucent Powder Setting",
        points: "Preventing creasing under eyes and smile lines using damp sponge press method",
        series: "Makeup Hacks",
        published: "Oct 2026",
        covered_points: [
          "Damp beauty blender with setting spray",
          "Pressing translucent powder without baking",
          "Hydrating mist finish to melt powdery look"
        ],
        channelId: 'beautyhub',
        isPlatformGenerated: false
      }
    ];
    saveProfileLibrary('beautyhub', beautySeed);
    return beautySeed;
  }

  return [];
}

/**
 * Saves published stories for a specific profile.
 */
export function saveProfileLibrary(channelId: string, stories: DynamicPublishedStory[]): void {
  if (typeof window === 'undefined') return;
  const key = `${PROFILE_LIBRARY_PREFIX}${channelId}`;
  try {
    localStorage.setItem(key, JSON.stringify(stories));
    window.dispatchEvent(new CustomEvent(PROFILE_LIBRARY_UPDATED_EVENT, { detail: { channelId, stories } }));
  } catch (e) {
    console.error(`Error saving profile library for ${channelId}:`, e);
  }
}

/**
 * Loads the Topic Bank for a specific profile.
 */
export function loadProfileTopicBank(channelId: string): TopicCard[] {
  if (typeof window === 'undefined') return [];
  const key = `${PROFILE_TOPIC_BANK_PREFIX}${channelId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(`Error loading Topic Bank for ${channelId}:`, e);
  }
  return [];
}

/**
 * Saves the Topic Bank for a specific profile.
 */
export function saveProfileTopicBank(channelId: string, topics: TopicCard[]): void {
  if (typeof window === 'undefined') return;
  const key = `${PROFILE_TOPIC_BANK_PREFIX}${channelId}`;
  try {
    localStorage.setItem(key, JSON.stringify(topics));
    window.dispatchEvent(new CustomEvent(TOPIC_BANK_UPDATED_EVENT, { detail: { channelId, topics } }));
  } catch (e) {
    console.error(`Error saving Topic Bank for ${channelId}:`, e);
  }
}

/**
 * Loads Competitors for a specific profile.
 */
export function loadProfileCompetitors(channelId: string): CompetitorItem[] {
  // Default competitors per channel
  const defaults: CompetitorItem[] = channelId === 'itcafeteria' ? [
    { id: 'comp-1', channelId: 'itcafeteria', name: 'Technology Gyan', channelIdOrUrl: 'UC1tVU8H153ZFO9eRsGiJZaA', group: 'local', notes: 'Shorts pacing 145 WPM, quick screen demos.' },
    { id: 'comp-2', channelId: 'itcafeteria', name: 'Technical Guruji', channelIdOrUrl: 'UCXUJJGQRsfUgnW6v0XwG4sA', group: 'local', notes: 'Daily tech news updates.' },
    { id: 'comp-3', channelId: 'itcafeteria', name: 'Beebom', channelIdOrUrl: 'UCabq3GQPE648Pz3cD4OJy8g', group: 'global', notes: 'Quality animation + secret hacks.' },
    { id: 'comp-4', channelId: 'itcafeteria', name: 'Mrwhosetheboss', channelIdOrUrl: 'UCMiJRAwDNSN3RMmdXe6Zylg', group: 'aspirational', notes: 'High retention hooks and cinematography.' }
  ] : channelId === 'beautyhub' ? [
    { id: 'comp-b1', channelId: 'beautyhub', name: 'Smitha Deepak', channelIdOrUrl: 'UCmGZ_4sVvQ7kQZ9_9x1vJHQ', group: 'local', notes: 'Hooded eye makeup and Indian skin tones.' },
    { id: 'comp-b2', channelId: 'beautyhub', name: 'Hyram', channelIdOrUrl: 'UC2sYit3cZ2CuD_8FHYH7O_Q', group: 'global', notes: 'Skincare specialist and ingredient breakdowns.' }
  ] : [];

  if (typeof window === 'undefined') return defaults;
  const key = `${PROFILE_COMPETITORS_PREFIX}${channelId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Error loading Competitors for ${channelId}:`, e);
  }

  if (defaults.length > 0) {
    saveProfileCompetitors(channelId, defaults);
  }
  return defaults;
}

/**
 * Saves Competitors for a specific profile.
 */
export function saveProfileCompetitors(channelId: string, competitors: CompetitorItem[]): void {
  if (typeof window === 'undefined') return;
  const key = `${PROFILE_COMPETITORS_PREFIX}${channelId}`;
  try {
    localStorage.setItem(key, JSON.stringify(competitors));
  } catch (e) {
    console.error(`Error saving Competitors for ${channelId}:`, e);
  }
}

/**
 * Loads Research Settings for a specific profile.
 */
export function loadProfileResearchSettings(channelId: string): ProfileResearchSettings {
  const fallbackSources = DEFAULT_RESEARCH_SOURCES[channelId] || DEFAULT_RESEARCH_SOURCES.itcafeteria;
  const defaultSettings: ProfileResearchSettings = {
    lens1WindowHours: 48,
    lens2WindowDays: 90,
    lens3WindowDays: 7,
    lens4WindowDays: 30,
    warnCrossChannelDuplicate: false,
    sourcesByLens: fallbackSources
  };

  if (typeof window === 'undefined') return defaultSettings;
  const key = `${PROFILE_RESEARCH_PREFIX}${channelId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error(`Error loading research settings for ${channelId}:`, e);
  }
  return defaultSettings;
}

/**
 * Saves Research Settings for a specific profile.
 */
export function saveProfileResearchSettings(channelId: string, settings: ProfileResearchSettings): void {
  if (typeof window === 'undefined') return;
  const key = `${PROFILE_RESEARCH_PREFIX}${channelId}`;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error(`Error saving research settings for ${channelId}:`, e);
  }
}

// -------------------------------------------------------------
// SMARTER DUPLICATE CHECK ENGINE (Hierarchical: Level 1 + Level 2)
// -------------------------------------------------------------

const APP_TOPIC_KEYWORDS = [
  'whatsapp', 'chrome', 'google maps', 'maps', 'gmail', 'google drive', 'drive',
  'play store', 'youtube', 'instagram', 'facebook', 'tiktok', 'telegram',
  'windows', 'chatgpt', 'gemini', 'capcut', 'power automate', 'excel',
  'google sheets', 'sheets', 'shopify', 'canva', 'midjourney', 'runway',
  'elevenlabs', 'suno', 'perplexity', 'claude', 'deepseek', 'kling',
  'bolt.new', 'lovable', 'cursor', 'v0', 'flux', 'pika', 'heygen', 'napkin',
  'make.com', 'zapier', 'ollama', 'whisper',
  // Beauty Hub apps & core topics
  'skincare', 'sunscreen', 'foundation', 'eyeliner', 'haircare', 'hair fall',
  'aloe vera', 'niacinamide', 'vitamin c', 'salicylic', 'retinol'
];

/**
 * Extracts the primary app/tool/topic entity from text.
 */
export function extractPrimaryTopicEntity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const app of APP_TOPIC_KEYWORDS) {
    const regex = new RegExp(`\\b${app.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(lower)) {
      return app;
    }
  }
  return null;
}

/**
 * Cleans tokens for semantic comparison.
 */
/**
 * Helper to identify whether a string is merely a tool/app name or placeholder, not a real point.
 * "A tool or app NAME is never a 'point'."
 */
export function isPlaceholderOrToolName(point: string, toolOrAppName?: string): boolean {
  if (!point) return true;
  const clean = point.trim().toLowerCase();
  if (clean.length < 5) return true;
  if (/^(tool|tools|tool:\s*tool|manual entry|custom tool|—|none|pending|untitled)$/i.test(clean)) return true;

  if (toolOrAppName) {
    const appClean = toolOrAppName.trim().toLowerCase();
    if (clean === appClean) return true;
    // e.g. "Google Astra" or "Google Astra live camera vision assistant" if it's just the app title
    if (clean.replace(/[^a-z0-9]/g, '') === appClean.replace(/[^a-z0-9]/g, '')) return true;
  }

  // Check if it's just one of the known app names alone without an action/feature
  for (const app of APP_TOPIC_KEYWORDS) {
    if (clean === app || clean === `${app} tool` || clean === `${app} app`) return true;
  }

  return false;
}

/**
 * Ensures that a published story has real covered_points (specific secrets/tricks/steps/features).
 * If a story has no real covered_points yet (empty, or just a title or a placeholder like "Tool: Tool"),
 * generates them from its scenes and dialogue first.
 */
export function ensureStoryCoveredPoints(story: DynamicPublishedStory): string[] {
  const toolName = story.tool || '';
  const existing = (story.covered_points || []).filter(p => !isPlaceholderOrToolName(p, toolName));

  if (existing.length > 0) {
    return existing;
  }

  // Generate from storyPackage scenes and dialogue if available
  if (story.storyPackage && Array.isArray(story.storyPackage.scenes) && story.storyPackage.scenes.length > 0) {
    const extracted: string[] = [];
    story.storyPackage.scenes.forEach((sc, idx) => {
      // Key tutorial steps usually live in scenes 2-7
      if (idx >= 1 && idx <= 7) {
        const text = (sc as any).voiceoverUrdu || sc.dialogue || (sc as any).visualPrompt || sc.visual || '';
        const sentence = text.split(/[.?!۔\n]+/)[0]?.trim();
        if (sentence && sentence.length >= 12 && !isPlaceholderOrToolName(sentence, toolName)) {
          extracted.push(`Step ${idx + 1}: ${sentence}`);
        }
      }
    });
    if (extracted.length > 0) {
      return extracted.slice(0, 4);
    }
  }

  // Extract from points field by splitting clauses
  if (story.points && story.points.trim()) {
    const parts = story.points
      .split(/[\n,;•]+/)
      .map(p => p.trim())
      .filter(p => p.length >= 10 && !isPlaceholderOrToolName(p, toolName));
    if (parts.length > 0) {
      return parts.slice(0, 5);
    }
  }

  // Fallback: check if the title contains actionable details beyond the app name
  if (story.title && story.title.trim()) {
    const titleClean = story.title.replace(/[\n\r]+/g, ' ').trim();
    if (!isPlaceholderOrToolName(titleClean, toolName)) {
      return [titleClean];
    }
  }

  return [];
}

/**
 * Cleans tokens for semantic comparison.
 * Excludes stop words and the detected app/tool name so app repeats don't give false positives.
 */
function cleanSemanticTokens(str: string, excludedAppEntity?: string | null): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'of', 'for', 'with', 'and', 'or', 'to', 'is', 'it', 'by', 'as',
    'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'hai', 'hain', 'aur', 'karein', 'karna', 'bina', 'par',
    'secret', 'secrets', 'trick', 'tricks', 'hack', 'hacks', 'hidden', 'feature', 'features',
    'step', 'steps', 'setting', 'settings', 'part', 'episode', 'series', 'guide', 'tutorial',
    'pro', 'new', 'latest', 'urdu', 'hindi', 'video', 'shorts', 'youtube', 'tool', 'tools', 'app', 'apps'
  ]);

  if (excludedAppEntity) {
    const appTokens = excludedAppEntity.toLowerCase().split(/\s+/);
    appTokens.forEach(t => stopWords.add(t));
  }

  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopWords.has(t));
}

/**
 * Calculates semantic similarity between a candidate point and an existing covered point.
 */
function calculatePointSimilarity(candidatePoint: string, existingPoint: string, appEntity?: string | null): number {
  const tCandidate = cleanSemanticTokens(candidatePoint, appEntity);
  const tExisting = cleanSemanticTokens(existingPoint, appEntity);
  if (!tCandidate.length || !tExisting.length) return 0;

  let common = 0;
  for (const c of tCandidate) {
    if (tExisting.some(e => e.includes(c) || c.includes(e) || (e.length > 4 && c.length > 4 && e.slice(0, 4) === c.slice(0, 4)))) {
      common++;
    }
  }

  // Check critical anchor pairs (e.g. blue tick & read receipts, voice & transcribe)
  const cLower = candidatePoint.toLowerCase();
  const eLower = existingPoint.toLowerCase();
  const hasBlueTickExact = (cLower.includes('blue tick') || cLower.includes('read receipt')) &&
                           (eLower.includes('blue tick') || eLower.includes('read receipt') || eLower.includes('blue double-tick'));
  if (hasBlueTickExact) {
    return 0.85;
  }

  const recall = common / Math.min(tCandidate.length, tExisting.length);
  return recall;
}

/**
 * Extract candidate specific points (never just the app name).
 */
export function extractCandidateSpecificPoints(candidate: {
  title: string;
  points?: string[] | string;
  rawPointsText?: string;
  tool?: string;
}): string[] {
  const toolName = candidate.tool || '';
  if (Array.isArray(candidate.points) && candidate.points.length > 0) {
    const filtered = candidate.points.map(p => p.trim()).filter(p => !isPlaceholderOrToolName(p, toolName));
    if (filtered.length > 0) return filtered;
  } else if (typeof candidate.points === 'string' && candidate.points.trim()) {
    const split = candidate.points.split(/[\n,;•]+/).map(p => p.trim()).filter(p => !isPlaceholderOrToolName(p, toolName));
    if (split.length > 0) return split;
  }

  if (candidate.rawPointsText && candidate.rawPointsText.trim()) {
    const filtered = candidate.rawPointsText
      .split(/[\n,;•]+/)
      .map(p => p.trim())
      .filter(p => !isPlaceholderOrToolName(p, toolName));
    if (filtered.length > 0) return filtered;
  }

  // Fallback to title
  const cleanTitle = candidate.title.trim();
  return isPlaceholderOrToolName(cleanTitle, toolName) ? [] : [cleanTitle];
}

/**
 * PHASE 2: NEW HIERARCHICAL DUPLICATE CHECK (The ONLY duplicate check in the project)
 *
 * Scope: The check runs ONLY against stories already PUBLISHED in the active channel profile's library.
 * Never against pending items, session memory, Topic Bank items, or current queue. Never across channels.
 *
 * Hierarchy, in this order:
 * 1. Search the published stories for the same topic/app name.
 * 2. If there is a match, OPEN that story and read its covered_points (the specific secrets/tricks/steps/features it shared).
 *    If a story has no real covered_points yet (empty, or just a title or a placeholder like "Tool: Tool"), generate them from its scenes and dialogue first.
 *    A tool or app NAME is never a "point".
 * 3. Compare the candidate's specific points with those covered_points by meaning.
 * 4. Verdict:
 *    - EXACT (same point already published) -> skip / auto-move-on;
 *    - PARTIAL (same app, different trick or deeper angle) -> allow and mark "fresh angle / Part N";
 *    - NEW -> allow.
 * 5. If the story cannot be verified (no covered_points could be generated), do NOT block; mark "unverified" and continue.
 *
 * Ongoing series categories (4 PC & Windows, 7 Secrets):
 * The same app repeating is normal; only an already-published specific point counts as duplicate.
 */
export function checkHierarchicalDuplicate(
  candidate: {
    title: string;
    points?: string[];
    rawPointsText?: string;
    categoryId?: number;
    channelId: string;
    tool?: string;
  },
  options?: {
    customLibrary?: DynamicPublishedStory[];
  }
): DuplicateCheckResult {
  const channelId = candidate.channelId;
  // Strictly isolated to published stories in active channel profile library
  const library = options?.customLibrary || loadProfileLibrary(channelId);

  const candidateTitle = candidate.title.trim();
  const fullCandidateText = `${candidateTitle} ${(candidate.points || []).join(' ')} ${candidate.rawPointsText || ''} ${candidate.tool || ''}`.toLowerCase();

  // STEP 1: Search the published stories for the same topic/app name
  const entity = extractPrimaryTopicEntity(fullCandidateText);
  let matchedPublishedStories: DynamicPublishedStory[] = [];

  if (entity) {
    matchedPublishedStories = library.filter(story => {
      const storyText = `${story.title} ${story.tool} ${story.series}`.toLowerCase();
      return storyText.includes(entity);
    });
  } else {
    // If no common keyword matched, check if tool name directly matches an existing published story tool
    const candidateTool = candidate.tool?.toLowerCase().trim();
    if (candidateTool && candidateTool.length >= 3 && !isPlaceholderOrToolName(candidateTool)) {
      matchedPublishedStories = library.filter(story => {
        return (story.tool && story.tool.toLowerCase().includes(candidateTool)) ||
          story.title.toLowerCase().includes(candidateTool);
      });
    }
  }

  const isSeriesCategory = candidate.categoryId === 4 || candidate.categoryId === 7;

  // If no published story covers this app/topic at all -> NEW (ALLOW!)
  if (matchedPublishedStories.length === 0) {
    return {
      verdict: 'new',
      level1AppDetected: null,
      level1Count: 0,
      reason: `NEW TOPIC: Published library mein "${entity || candidate.title}" ka koi pehla record nahi hai. 100% unique!`,
      confidence: 100
    };
  }

  // STEP 2 & 3: OPEN matching stories, read covered_points, compare specific points by meaning
  const candidatePoints = extractCandidateSpecificPoints(candidate);
  let verifiedStoriesCount = 0;
  let exactMatch: {
    storyId: number | string;
    storyTitle: string;
    coveredPoint: string;
    candidatePoint: string;
    similarity: number;
  } | null = null;

  for (const story of matchedPublishedStories) {
    const coveredPoints = ensureStoryCoveredPoints(story);
    if (coveredPoints.length > 0) {
      verifiedStoriesCount++;
    }

    for (const cp of coveredPoints) {
      for (const candPoint of candidatePoints) {
        const sim = calculatePointSimilarity(candPoint, cp, entity);
        if (sim >= 0.68) {
          if (!exactMatch || sim > exactMatch.similarity) {
            exactMatch = {
              storyId: story.id,
              storyTitle: story.title,
              coveredPoint: cp,
              candidatePoint: candPoint,
              similarity: sim
            };
          }
        }
      }
    }
  }

  // STEP 5: If no covered points could be generated for any matched story -> UNVERIFIED (ALLOW, do NOT block)
  if (verifiedStoriesCount === 0 && candidatePoints.length === 0) {
    return {
      verdict: 'unverified',
      level1AppDetected: entity,
      level1Count: matchedPublishedStories.length,
      level1Note: entity ? `${entity.toUpperCase()} library mein hai lekin specific points verify nahi ho sake.` : undefined,
      reason: `UNVERIFIED: Story covered points verify nahi ho sake — flow ko block kiye baghair allow kiya gaya.`,
      confidence: 50
    };
  }

  // STEP 4: VERDICT
  // EXACT: same point already published -> SKIP
  if (exactMatch) {
    return {
      verdict: 'exact',
      level1AppDetected: entity,
      level1Count: matchedPublishedStories.length,
      level1Note: entity ? `${entity.toUpperCase()} pehle ${matchedPublishedStories.length} published stories mein cover ho chuka hai.` : undefined,
      matchedStoryId: exactMatch.storyId,
      matchedStoryTitle: exactMatch.storyTitle,
      matchedPoint: exactMatch.coveredPoint,
      candidatePoint: exactMatch.candidatePoint,
      reason: `EXACT DUPLICATE: Yeh specific feature/trick pehle Published Story #${exactMatch.storyId} ("${exactMatch.storyTitle}") mein cover ho chuka hai: "${exactMatch.coveredPoint}".`,
      confidence: Math.round(exactMatch.similarity * 100)
    };
  }

  // PARTIAL: same app/tool, different trick or deeper angle -> ALLOW!
  const seriesNote = isSeriesCategory
    ? `Series Category (${candidate.categoryId === 7 ? 'Secrets' : 'PC & Windows'}) mein same app repeat hona normal hai.`
    : `Same app/tool area, lekin bilkul naya secret/trick hai.`;

  return {
    verdict: 'partial',
    level1AppDetected: entity,
    level1Count: matchedPublishedStories.length,
    level1Note: `${entity?.toUpperCase() || 'App'} library mein ${matchedPublishedStories.length} dafa pehle published hai.`,
    reason: `PARTIAL ALLOW (Fresh Angle): ${seriesNote} Covered points se koi collision nahi mila. Approved as fresh angle/Part N!`,
    confidence: 88
  };
}

/**
 * Canonical Alias: checkSmarterDuplicate routes directly to checkHierarchicalDuplicate.
 * Guarantees that there is only ONE duplicate check function throughout the entire codebase.
 */
export const checkSmarterDuplicate = checkHierarchicalDuplicate;

/**
 * Returns a list of all already-covered points for a given app/topic entity or category.
 * Used BEFORE searching to exclude known points from the search prompt ("do not suggest these").
 */
export function getAlreadyCoveredPointsList(channelId: string, filterEntityOrCategory?: string | number): string[] {
  const library = loadProfileLibrary(channelId);
  const points: string[] = [];

  const filterStr = typeof filterEntityOrCategory === 'string' ? filterEntityOrCategory.toLowerCase().trim() : '';

  for (const story of library) {
    const match = !filterStr ||
      story.title.toLowerCase().includes(filterStr) ||
      story.tool.toLowerCase().includes(filterStr) ||
      story.series.toLowerCase().includes(filterStr);

    if (match) {
      const covered = ensureStoryCoveredPoints(story);
      points.push(...covered);
    }
  }

  return Array.from(new Set(points)).slice(0, 35);
}

/**
 * Generates initial covered_points from story scenes and dialogue.
 */
export function extractCoveredPointsFromStoryPackage(story: GeneratedStory): string[] {
  if (story.idea?.points) {
    const raw = story.idea.points.split(/[\n,;•]+/).map(s => s.trim()).filter(s => s.length > 5);
    if (raw.length >= 2) return raw.slice(0, 5);
  }

  const extracted: string[] = [];
  if (Array.isArray(story.scenes)) {
    story.scenes.forEach((sc, idx) => {
      if (idx >= 2 && idx <= 6) {
        const text = (sc as any).voiceoverUrdu || sc.dialogue || (sc as any).visualPrompt || (sc as any).visual || '';
        const firstSentence = text.split(/[.?!۔]+/)[0]?.trim();
        if (firstSentence && firstSentence.length >= 15 && firstSentence.length <= 80) {
          extracted.push(`Scene ${idx + 1}: ${firstSentence}`);
        }
      }
    });
  }

  if (extracted.length > 0) return extracted.slice(0, 4);

  return [story.title, story.hook].filter(Boolean);
}
