/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Multi-Channel Profile Store, Smarter Duplicate Check, & Topic Bank Engine
 */

import { PUBLISHED_VIDEOS, type PublishedVideo, type ChannelProfile } from '../data/channelData';
import { loadPendingQueue } from './pendingQueueStore';
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

export type DuplicateVerdictType = 'new' | 'partial' | 'exact';

export interface DuplicateCheckResult {
  verdict: DuplicateVerdictType;
  level1AppDetected: string | null;
  level1Count: number;
  level1Note?: string;
  matchedStoryId?: number | string;
  matchedStoryTitle?: string;
  matchedPoint?: string;
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

// 58 catalog stories pre-analyzed covered points for IT Cafeteria
export const IT_CAFETERIA_CATALOG_COVERED_POINTS: Record<number, string[]> = {
  1: ["Gemini 4 Argon multimodal reasoning", "GitHub Copilot complex coding support", "Enterprise task automation in seconds"],
  2: ["Win+V Clipboard History activation", "Paste text copied hours earlier", "Pin frequently used text clips to clipboard"],
  3: ["Shopify store setup without inventory", "Product listing and remote client handling", "Passive e-commerce earning workflow"],
  4: ["Meta Muse Wonder Active Memory concept", "Active Focus for long-context tasks", "AI memory benchmark improvements"],
  5: ["Power Automate desktop no-code flow", "Automating repetitive daily Excel tasks", "Trigger automation on file change"],
  6: ["Google Flow Start Frame and End Frame workflow", "Smooth AI video transitions without morphing", "Maintaining character consistency between frames"],
  7: ["Google Astra live camera vision assistant", "Real-time object and code scanning through camera", "Audio conversation while scanning"],
  8: ["Gemini real-time screen share for debugging", "Live code error explanation without copy-paste", "Voice feedback while reviewing screen"],
  9: ["NotebookLM research grounded Q&A", "Generate audio overview podcast from PDF notes", "Instant source citations from custom documents"],
  10: ["ChatGPT vs Gemini vs Claude 2026 comparison", "Speed vs deep reasoning benchmarks", "Which model is best for Urdu and students"],
  11: ["OpenAI Swarm and autonomous agent loops", "Multi-agent task handoff and collaboration", "Automated daily research workflows"],
  12: ["WhatsApp Business message delivery and read analytics", "Customer engagement rate statistics", "Tracking broadcast campaign conversion"],
  13: ["Pin up to 3 important chats to top", "Custom notification tones per contact", "Disappearing messages timer (24h/7d/90d)"],
  14: ["Edit sent messages within 15 minutes", "Lock individual chats with fingerprint or FaceID", "Send HD uncompressed photos and media"],
  15: ["Voice message 1.5x and 2x playback speed", "Companion Mode (linked devices on up to 4 phones)", "Hide online status while chatting"],
  16: ["Read receipts without blue ticks", "Text formatting: bold (*), italic (_), strikethrough (~)", "Star messages for quick bookmarking"],
  17: ["Windows God Mode control panel folder", "Create folder with GUID {ED7BA470-8E54-465E-825C-99712043E01C}", "200+ hidden system settings in one window"],
  18: ["Canva Magic Studio AI design tools", "Magic Switch layout and resize", "Text to graphic asset generation"],
  19: ["CapCut text-to-speech voice styles", "Auto-caption generator with animated presets", "Video background removal without green screen"],
  20: ["Midjourney v7 photorealistic prompt syntax", "Character reference parameter (--cref)", "Style reference parameter (--sref)"],
  21: ["Runway Gen-3 Alpha camera controls", "Motion brush for selective animation", "Text to high-fidelity video generation"],
  22: ["ElevenLabs voice cloning from 1-minute audio", "Emotion and stability sliders", "Multilingual Urdu accent dubbing"],
  23: ["Cleanmgr & %temp% junk file purge", "Freeing up C-Drive red bar space", "Disabling unnecessary startup apps in Task Manager"],
  24: ["Suno AI v4 full song generation", "Custom lyrics and genre tags", "Commercial usage and instrumental stems"],
  25: ["Center Across Selection (Ctrl+1 -> Alignment)", "Alternative to Merge Cells in Excel", "Preventing sorting and VLOOKUP formula breaks"],
  26: ["Perplexity AI Pro search citations", "Focus modes: Academic, YouTube, Reddit", "Collections for persistent research projects"],
  27: ["Claude 3.7 Sonnet hybrid reasoning", "Extended thinking mode toggle", "Complex full-stack code architecture generation"],
  28: ["WhatsApp screen sharing with device audio in video call", "Secret code password for hidden locked chats", "Instant 60-second circular video messages"],
  29: ["Unhide Ultimate Performance power plan via powercfg", "Maximum CPU frequency and zero power throttling", "Fixing FPS drops and render stutter"],
  30: ["Google Sheets Smart Fill AI feature", "Auto-detect patterns and fill columns without formulas", "Instant phone number and email text splitting"],
  31: ["Gamma App instant AI presentation slides", "Export to PowerPoint and interactive webpage", "Embedding live analytics into slides"],
  32: ["DeepSeek R1 open-weight reasoning model", "Running DeepSeek locally with Ollama", "Zero-cost coding benchmarks vs o1"],
  33: ["Kling AI 1.5 video generation camera paths", "Realistic human motion and facial physics", "Text to 1080p cinematic video clips"],
  34: ["Bolt.new full-stack prompt-to-app generator", "In-browser WebContainer live execution", "One-click Netlify deployment"],
  35: ["Lovable dev full-stack web builder", "Supabase authentication and database auto-wiring", "Export code to GitHub"],
  36: ["Power Automate Ep 7: Automated WhatsApp alerts via HTTP API", "Webhook trigger on new customer order", "Sending templated WhatsApp message"],
  37: ["Cursor AI Composer multi-file editing", "Project context indexing with codebase indexing", "Rules for AI (.cursorrules)"],
  38: ["v0 by Vercel React UI generator", "Tailwind CSS component generation from screenshots", "Copy-paste into Next.js project"],
  39: ["Flux 1.1 Pro Ultra image generation", "Text rendering inside images without gibberish", "High-detail 2K photorealism"],
  40: ["Win+R secret run commands: msconfig, mrt, perfmon", "Direct access to Windows diagnostic utilities", "Malicious software removal tool background scan"],
  41: ["Pika 2.0 Pikaffects physics simulation", "Melt, explode, inflate, and squish effects", "Keyframe timing and motion control"],
  42: ["HeyGen interactive video avatar creation", "Custom studio avatar from webcam footage", "Voice sync in 40+ languages"],
  43: ["Napkin AI text-to-infographic generator", "Paste article and generate flowcharts", "Vector SVG export for presentations"],
  44: ["Make.com vs Zapier visual automation comparison", "Router branches and error handling", "Building cost-effective webhook pipelines"],
  45: ["Ollama local LLM runner on PC", "Running Llama 3.3 and DeepSeek offline", "Privacy-first AI without internet"],
  46: ["Whisper AI local voice transcription", "Subtitles SRT generation with word-level timestamps", "Transcribing Roman Urdu and English audio"],
  47: ["WhatsApp Business Ep 6: Multi-Device sync without primary phone", "Meta AI assistant integration inside chats", "Catalog management across web and mobile"],
  48: ["WhatsApp Business Ep 5: Color-coded customer labels", "Targeted broadcast lists without group clutter", "Filtering chats by paid, pending, and delivered"],
  49: ["WhatsApp Business Ep 4: Product catalog setup with prices", "Creating direct WhatsApp purchase links", "Sharing collections with new customers"],
  50: ["WhatsApp Business Ep 3: Away message and greeting auto-replies", "Quick reply keyboard shortcuts for FAQs (/price, /bank)", "Automating after-hours inquiries"],
  51: ["WhatsApp Business Ep 2: Verified business profile details", "Setting business hours, email, and Google Maps pin", "Building trust with new buyers"],
  52: ["WhatsApp Business Ep 1: Migration from regular WhatsApp", "Full chat and media backup to Google Drive", "Clean switch without losing customer chat history"],
  53: ["Google Chrome secret flags for 2X browsing speed", "Parallel downloading flag activation", "Memory Saver and Tab Discarding settings"],
  54: ["Google Drive hidden shortcuts and search operators", "type:pdf, owner:me, before:date filters", "Restoring permanently deleted file versions"],
  55: ["Gmail secret search filters: size:10M, older_than:1y", "Auto-clean gigabytes of inbox storage in 1 click", "Creating smart filter labels"],
  56: ["YouTube secret URL tricks: timestamp link, loop video", "Bypass age-gate and embed full screen", "Keyboard shortcuts: J, K, L, M, and F"],
  57: ["Telegram secret features: Schedule message, silent send", "Send uncompressed 2GB files", "Creating custom anonymous usernames"],
  58: ["Google Maps offline download for travel without internet", "Measure direct distance between points", "Save parking location and timeline history"]
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
function cleanSemanticTokens(str: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'in', 'on', 'of', 'for', 'with', 'and', 'or', 'to', 'is', 'it', 'by', 'as',
    'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'hai', 'hain', 'aur', 'karein', 'karna', 'bina', 'par',
    'secret', 'secrets', 'trick', 'tricks', 'hack', 'hacks', 'hidden', 'feature', 'features',
    'step', 'steps', 'setting', 'settings', 'part', 'episode'
  ]);

  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopWords.has(t));
}

/**
 * Calculates similarity between two text snippets based on shared key tokens.
 */
function calculatePointSimilarity(candidatePoint: string, existingPoint: string): number {
  const tCandidate = cleanSemanticTokens(candidatePoint);
  const tExisting = cleanSemanticTokens(existingPoint);
  if (!tCandidate.length || !tExisting.length) return 0;

  let common = 0;
  for (const c of tCandidate) {
    if (tExisting.some(e => e.includes(c) || c.includes(e))) {
      common++;
    }
  }

  const recall = common / Math.min(tCandidate.length, tExisting.length);
  return recall;
}

/**
 * SMARTER DUPLICATE CHECK
 *
 * LEVEL 1: Topic/App screen (NEVER BLOCKS).
 * If the candidate shares an app (e.g. WhatsApp, Windows, Excel) with existing stories,
 * we note it: "WhatsApp covered N times; checking what specific tricks/steps were shared".
 *
 * LEVEL 2: Deep content check (DECIDES).
 * Compares candidate's specific points/tricks against the "covered_points" of earlier stories.
 *
 * Series Categories (4 PC & Windows Hacks, 7 Secrets):
 * Same app repeating is NORMAL and EXPECTED. Only an already-covered specific point is a duplicate.
 *
 * Verdicts:
 * - EXACT DUPLICATE (same point already covered): BLOCK and show matched story and matched point.
 * - PARTIAL (same app but different trick / deeper angle): ALLOW, mark "fresh angle / Part N".
 * - NEW: ALLOW, mark "Naya Topic".
 */
export function checkSmarterDuplicate(
  candidate: {
    title: string;
    points?: string[];
    rawPointsText?: string;
    categoryId?: number;
    channelId: string;
  },
  options?: {
    customLibrary?: DynamicPublishedStory[];
    customTopicBank?: TopicCard[];
  }
): DuplicateCheckResult {
  const channelId = candidate.channelId;
  const library = options?.customLibrary || loadProfileLibrary(channelId);
  const topicBank = options?.customTopicBank || loadProfileTopicBank(channelId);

  const candidateTitle = candidate.title.trim();
  const candidatePointsList: string[] = candidate.points && candidate.points.length > 0
    ? candidate.points
    : candidate.rawPointsText
    ? candidate.rawPointsText.split(/[\n,;•]+/).map(s => s.trim()).filter(Boolean)
    : [candidateTitle];

  const fullCandidateText = `${candidateTitle} ${candidatePointsList.join(' ')}`.toLowerCase();

  // LEVEL 1: Detect App / Topic Entity
  const entity = extractPrimaryTopicEntity(fullCandidateText);
  let entityMatchCount = 0;

  if (entity) {
    entityMatchCount = library.filter(story => {
      const storyText = `${story.title} ${story.tool} ${story.points} ${(story.covered_points || []).join(' ')}`.toLowerCase();
      return storyText.includes(entity);
    }).length;
  }

  const isSeriesCategory = candidate.categoryId === 4 || candidate.categoryId === 7;

  // LEVEL 2: Deep Content Check against covered_points
  // We compare candidate's specific sub-points against all covered_points in the library and Topic Bank
  let exactMatch: {
    storyId: number | string;
    storyTitle: string;
    coveredPoint: string;
    similarity: number;
  } | null = null;

  for (const story of library) {
    const covered = story.covered_points && story.covered_points.length > 0
      ? story.covered_points
      : [story.points || story.title];

    for (const cp of covered) {
      for (const candPoint of candidatePointsList) {
        const sim = calculatePointSimilarity(candPoint, cp);
        // If similarity is very high (>= 0.70) or candidate title matches exactly
        if (sim >= 0.70) {
          if (!exactMatch || sim > exactMatch.similarity) {
            exactMatch = {
              storyId: story.id,
              storyTitle: story.title,
              coveredPoint: cp,
              similarity: sim
            };
          }
        }
      }
    }
  }

  // Also check against Topic Bank (in production or published)
  if (!exactMatch) {
    for (const bankItem of topicBank) {
      if (bankItem.status === 'published' || bankItem.status === 'in_production') {
        for (const kp of bankItem.keyPoints) {
          for (const candPoint of candidatePointsList) {
            const sim = calculatePointSimilarity(candPoint, kp);
            if (sim >= 0.75) {
              exactMatch = {
                storyId: bankItem.id,
                storyTitle: bankItem.title,
                coveredPoint: kp,
                similarity: sim
              };
              break;
            }
          }
        }
      }
    }
  }

  // Exact title duplicate check
  if (!exactMatch) {
    const titleMatch = library.find(s => s.title.trim().toLowerCase() === candidateTitle.toLowerCase());
    if (titleMatch) {
      exactMatch = {
        storyId: titleMatch.id,
        storyTitle: titleMatch.title,
        coveredPoint: titleMatch.points || titleMatch.title,
        similarity: 1.0
      };
    }
  }

  // VERDICT DETERMINATION
  if (exactMatch) {
    return {
      verdict: 'exact',
      level1AppDetected: entity,
      level1Count: entityMatchCount,
      level1Note: entity ? `${entity.toUpperCase()} pehle ${entityMatchCount} baar cover ho chuka hai.` : undefined,
      matchedStoryId: exactMatch.storyId,
      matchedStoryTitle: exactMatch.storyTitle,
      matchedPoint: exactMatch.coveredPoint,
      reason: `EXACT DUPLICATE: Yeh specific point/trick pehle Story #${exactMatch.storyId} ("${exactMatch.storyTitle}") mein cover ho chuka hai: "${exactMatch.coveredPoint}".`,
      confidence: Math.round(exactMatch.similarity * 100)
    };
  }

  // If entity was covered before, but the specific points are fresh -> PARTIAL (Allowed)
  if (entity && entityMatchCount > 0) {
    const seriesNote = isSeriesCategory
      ? `Series Category (${candidate.categoryId === 7 ? 'Secrets' : 'PC & Windows'}) mein same app aana normal hai.`
      : `Same tool/app area, lekin naye sub-points aur fresh angle hai.`;

    return {
      verdict: 'partial',
      level1AppDetected: entity,
      level1Count: entityMatchCount,
      level1Note: `${entity.toUpperCase()} library mein ${entityMatchCount} dafa pehle aya hai.`,
      reason: `PARTIAL ALLOW: ${seriesNote} (0 duplicate sub-points match). Approved as fresh episode/angle!`,
      confidence: 88
    };
  }

  // Completely new topic
  return {
    verdict: 'new',
    level1AppDetected: null,
    level1Count: 0,
    reason: `NEW TOPIC: Active profile library aur Topic Bank mein koi match nahi mila. 100% unique!`,
    confidence: 100
  };
}

/**
 * Returns a list of all already-covered points for a given app/topic entity or category.
 * Used BEFORE searching to exclude known points from the search prompt.
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
      if (story.covered_points && story.covered_points.length > 0) {
        points.push(...story.covered_points);
      } else if (story.points) {
        points.push(story.points);
      }
    }
  }

  return Array.from(new Set(points)).slice(0, 40);
}

/**
 * Generates initial covered_points from story scenes and dialogue.
 */
export function extractCoveredPointsFromStoryPackage(story: GeneratedStory): string[] {
  if (story.idea?.points) {
    const raw = story.idea.points.split(/[\n,;•]+/).map(s => s.trim()).filter(s => s.length > 3);
    if (raw.length >= 2) return raw.slice(0, 5);
  }

  const extracted: string[] = [];
  if (Array.isArray(story.scenes)) {
    story.scenes.forEach((sc, idx) => {
      // Pick key action scenes (scenes 3, 4, 5, 6 often contain the core steps/secrets)
      if (idx >= 2 && idx <= 6) {
        const text = (sc as any).voiceoverUrdu || sc.dialogue || (sc as any).visualPrompt || (sc as any).visual || '';
        // extract first meaningful sentence
        const firstSentence = text.split(/[.?!۔]+/)[0]?.trim();
        if (firstSentence && firstSentence.length > 15 && firstSentence.length < 80) {
          extracted.push(`Scene ${idx + 1}: ${firstSentence}`);
        }
      }
    });
  }

  if (extracted.length > 0) return extracted.slice(0, 4);

  return [story.title, story.hook].filter(Boolean);
}
