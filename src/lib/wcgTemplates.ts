export type WcgEventCategory = 'All' | 'Mehndi' | 'Barat' | 'Walima' | 'Nikah';
export type WcgTransitionStyle = 'crossfade' | 'slideup' | 'wipeup';
export type WcgArchStyle = 'floral-arch' | 'mughal-dome' | 'minimal-frame' | 'botanical-vellum';

export interface WcgCardData {
  invocation: string;
  hostLine1: string;
  relationLine1: string;
  hostLine2: string;
  relationLine2: string;
  groomName: string;
  brideName: string;
  specialTitle: string;
  specialNames: string;
  part2Blessing: string;
  part2Intro: string;
  eventTitle: string;
  eventSubtitle: string;
  weddingDate: string;
  timing1: string;
  timing2: string;
  venueName: string;
  venueAddress: string;
}

export interface WcgStylingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  displayFont: 'Cormorant Garamond' | 'Cinzel' | 'Amiri';
  scriptFont: 'Great Vibes' | 'Cormorant Garamond';
  spacingScale: number;
  transitionStyle: WcgTransitionStyle;
  cleanSampleText: boolean;
}

export interface WcgTemplateSpec {
  id: string;
  name: string;
  category: Exclude<WcgEventCategory, 'All'>;
  aesthetic: string;
  isMultiPart: boolean;
  part1Image?: string;
  part2Image?: string;
  archStyle: WcgArchStyle;
  styling: WcgStylingConfig;
  defaultEventTitle: string;
  defaultEventSubtitle: string;
  defaultTiming1: string;
  defaultTiming2: string;
}

export interface WcgTrendSource {
  title: string;
  uri: string;
}

export interface WcgTrendSuggestion {
  query: string;
  trendSummaryRomanUrdu: string;
  designHighlights: string[];
  recommendedStyling: Partial<WcgStylingConfig>;
  sources: WcgTrendSource[];
  verifiedLive: boolean;
}

export type WcgRenderQuality = '1080p' | '720p';

export interface WcgMusicPreset {
  id: string;
  title: string;
  vibe: string;
  category: 'Mehndi' | 'Barat' | 'Walima' | 'Nikah' | 'Sangeet';
  bpm: number;
  durationSec: number;
  audioUrl: string;
}

export interface WcgRenderResult {
  ok: boolean;
  filename: string;
  videoUrl: string;
  downloadUrl: string;
  durationSeconds: number;
  resolution: string;
  engine: string;
  multiPart: boolean;
  musicId?: string;
}

export const DEFAULT_WCG_CARD_DATA: WcgCardData = {
  invocation: 'IN THE NAME OF ALLAH · THE MOST GRACIOUS & MERCIFUL',
  hostLine1: 'Mr. & Mrs. Jalal Din (Late)',
  relationLine1: 'Request the pleasure of your company at the Wedding Ceremony of their Beloved Nephew',
  hostLine2: 'Mr. & Mrs. M Amjad Rana',
  relationLine2: 'Cordially invite you to celebrate the Wedding of their Beloved Daughter',
  groomName: 'Hamza',
  brideName: 'Ayesha',
  specialTitle: 'Special Kidz',
  specialNames: 'Ammal Fatima, Mehroosh',
  part2Blessing: 'In Sha Allah',
  part2Intro: 'JOIN US FOR A JOYFUL EVENING OF',
  eventTitle: 'Mehndi',
  eventSubtitle: '"Rasm-e-Hina"',
  weddingDate: 'Thursday 26 November 2026',
  timing1: 'Mehndi .................... 6:00 PM',
  timing2: 'Dinner .................... 7:00 PM',
  venueName: 'RAUF MARQUI',
  venueAddress: 'Mughalpura Road, Baja Line, Near Railway Power House, Lahore',
};

export const WCG_TEMPLATES: WcgTemplateSpec[] = [
  {
    id: 'pakistani-emerald-mehndi-multipart',
    name: 'Emerald Mehndi & Dholki Royal Suite (s1 + s2)',
    category: 'Mehndi',
    aesthetic: '2-Part Wisteria Floral Arch, Dholki & Bride Mehndi Pavilion',
    isMultiPart: true,
    part1Image: '/assets/aistudio/s1_0b0de8d4.jpeg',
    part2Image: '/assets/aistudio/s2_610b836e.jpeg',
    archStyle: 'floral-arch',
    styling: {
      primaryColor: '#196134',
      secondaryColor: '#1B7A72',
      accentColor: '#E7C26B',
      textColor: '#FFFFFF',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'crossfade',
      cleanSampleText: true,
    },
    defaultEventTitle: 'Mehndi',
    defaultEventSubtitle: '"Rasm-e-Hina"',
    defaultTiming1: 'Mehndi .................... 6:00 PM',
    defaultTiming2: 'Dinner .................... 7:00 PM',
  },
  {
    id: 'shahi-maroon-gold-barat',
    name: 'Shahi Maroon & Gold Foil Barat',
    category: 'Barat',
    aesthetic: 'Deep Mughal Crimson Velvet · Embossed Zari Filigree',
    isMultiPart: true,
    archStyle: 'mughal-dome',
    styling: {
      primaryColor: '#4E0D19',
      secondaryColor: '#2D070F',
      accentColor: '#E6C275',
      textColor: '#FFF7E8',
      displayFont: 'Cinzel',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Barat Ceremony',
    defaultEventSubtitle: 'Royal Reception & Rukhsati',
    defaultTiming1: 'Reception of Barat ........ 7:30 PM',
    defaultTiming2: 'Dinner .................... 9:00 PM',
  },
  {
    id: 'champagne-ivory-walima',
    name: 'Champagne Ivory & Sage Walima',
    category: 'Walima',
    aesthetic: '2026 Quiet-Luxury Editorial · Soft Champagne & Sage Leaf',
    isMultiPart: true,
    archStyle: 'minimal-frame',
    styling: {
      primaryColor: '#243B32',
      secondaryColor: '#182A23',
      accentColor: '#DFC592',
      textColor: '#FBF8F1',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 1.04,
      transitionStyle: 'slideup',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Walima Reception',
    defaultEventSubtitle: 'Sunnat-e-Walima Feast',
    defaultTiming1: 'Guests Arrival ............ 1:30 PM',
    defaultTiming2: 'Lunch ..................... 2:30 PM',
  },
  {
    id: 'noor-nikah-kufic-gold',
    name: 'Noor-e-Nikah Midnight & Kufic Gold',
    category: 'Nikah',
    aesthetic: 'Sacred Emerald Night · Classical Calligraphy Arch',
    isMultiPart: true,
    archStyle: 'mughal-dome',
    styling: {
      primaryColor: '#0E2E2B',
      secondaryColor: '#091E1C',
      accentColor: '#F0CE7D',
      textColor: '#FAF5EB',
      displayFont: 'Amiri',
      scriptFont: 'Great Vibes',
      spacingScale: 1.02,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Nikah Ceremony',
    defaultEventSubtitle: 'Sacred Union & Dua-e-Khair',
    defaultTiming1: 'Nikah Khwani .............. 4:30 PM',
    defaultTiming2: 'Refreshments .............. 5:30 PM',
  },
  {
    id: 'lahori-genda-mayun',
    name: 'Lahori Genda & Truck-Art Dholki',
    category: 'Mehndi',
    aesthetic: 'Festive Mustard, Peacock Teal & Marigold Motifs',
    isMultiPart: true,
    archStyle: 'floral-arch',
    styling: {
      primaryColor: '#144D53',
      secondaryColor: '#0C3438',
      accentColor: '#F5B82E',
      textColor: '#FFFDF7',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 0.98,
      transitionStyle: 'wipeup',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Mayun & Dholki',
    defaultEventSubtitle: 'Ubtan, Dholak & Festive Evening',
    defaultTiming1: 'Dholki & Ubtan ............ 6:30 PM',
    defaultTiming2: 'Dinner .................... 8:30 PM',
  },
  {
    id: 'mughal-jharokha-ruby',
    name: 'Mughal Jharokha Ruby & Brass',
    category: 'Barat',
    aesthetic: 'Lahore Fort Inspired Archway · Warm Antique Brass',
    isMultiPart: true,
    archStyle: 'mughal-dome',
    styling: {
      primaryColor: '#5B1626',
      secondaryColor: '#3A0D18',
      accentColor: '#D9AE61',
      textColor: '#FFF9F0',
      displayFont: 'Cinzel',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Shahi Barat',
    defaultEventSubtitle: 'Evening of Heritage & Joy',
    defaultTiming1: 'Sehra Bandi ............... 7:00 PM',
    defaultTiming2: 'Barat & Dinner ............ 8:30 PM',
  },
  {
    id: 'dusty-rose-pearl-walima',
    name: 'Dusty Rose & Pearl Modern Walima',
    category: 'Walima',
    aesthetic: 'Mauve Plum Velvet · Pearl Rose Gold Borders',
    isMultiPart: true,
    archStyle: 'botanical-vellum',
    styling: {
      primaryColor: '#4A2535',
      secondaryColor: '#301622',
      accentColor: '#ECC8B4',
      textColor: '#FFF6F4',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 1.03,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Walima',
    defaultEventSubtitle: 'Evening Garden Reception',
    defaultTiming1: 'Welcome Reception ......... 7:00 PM',
    defaultTiming2: 'Dinner Served ............. 8:30 PM',
  },
  {
    id: 'midnight-sapphire-sangeet',
    name: 'Midnight Sapphire & Silver Mehndi',
    category: 'Mehndi',
    aesthetic: 'Royal Starry Indigo · Brushed Champagne Silver',
    isMultiPart: true,
    archStyle: 'minimal-frame',
    styling: {
      primaryColor: '#132247',
      secondaryColor: '#0A132B',
      accentColor: '#D6DFEE',
      textColor: '#F8FAFC',
      displayFont: 'Cinzel',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'slideup',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Sangeet & Mehndi',
    defaultEventSubtitle: 'Lanterns & Musical Night',
    defaultTiming1: 'Mehndi & Dance ............ 7:00 PM',
    defaultTiming2: 'Dinner .................... 9:00 PM',
  },
  {
    id: 'botanical-sage-vellum-nikah',
    name: 'Botanical Sage & Vellum Nikah',
    category: 'Nikah',
    aesthetic: 'Frosted Olive Minimalist · Fine Botanical Foil',
    isMultiPart: true,
    archStyle: 'botanical-vellum',
    styling: {
      primaryColor: '#2E4335',
      secondaryColor: '#1E2D23',
      accentColor: '#E4CFA2',
      textColor: '#F9F8F2',
      displayFont: 'Amiri',
      scriptFont: 'Cormorant Garamond',
      spacingScale: 1.05,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Nikah-e-Sunnat',
    defaultEventSubtitle: 'Masjid & Courtyard Gathering',
    defaultTiming1: 'Nikah Ceremony ............ 3:30 PM',
    defaultTiming2: 'Hi-Tea .................... 4:30 PM',
  },
  {
    id: 'regal-crimson-palki-barat',
    name: 'Regal Crimson Palki Barat',
    category: 'Barat',
    aesthetic: 'Bridal Scarlet & Heritage Mustard Gold Filigree',
    isMultiPart: true,
    archStyle: 'floral-arch',
    styling: {
      primaryColor: '#69121B',
      secondaryColor: '#410910',
      accentColor: '#F2C96C',
      textColor: '#FFF9EC',
      displayFont: 'Cinzel',
      scriptFont: 'Great Vibes',
      spacingScale: 1.0,
      transitionStyle: 'wipeup',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Wedding Barat',
    defaultEventSubtitle: 'Celebration of Two Families',
    defaultTiming1: 'Istiqbal-e-Barat .......... 7:30 PM',
    defaultTiming2: 'Dinner & Rukhsati ......... 9:30 PM',
  },
  {
    id: 'lavender-wisteria-engagement',
    name: 'Lavender Wisteria & Gold Engagement',
    category: 'Walima',
    aesthetic: 'Soft Dusk Plum & Romantic Wisteria Gold',
    isMultiPart: true,
    archStyle: 'floral-arch',
    styling: {
      primaryColor: '#362749',
      secondaryColor: '#221730',
      accentColor: '#EBD09B',
      textColor: '#FAF7FF',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 1.02,
      transitionStyle: 'crossfade',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Walima & Baat Pakki',
    defaultEventSubtitle: 'Floral Courtyard Evening',
    defaultTiming1: 'Guests Reception .......... 7:00 PM',
    defaultTiming2: 'Dinner .................... 8:30 PM',
  },
  {
    id: 'sunlit-marigold-rasm-e-hina',
    name: 'Sunlit Jade & Marigold Rasm-e-Hina',
    category: 'Mehndi',
    aesthetic: 'Deep Forest Jade · Bright Saffron Gold Ribbons',
    isMultiPart: true,
    archStyle: 'botanical-vellum',
    styling: {
      primaryColor: '#124034',
      secondaryColor: '#0A2921',
      accentColor: '#F6BD41',
      textColor: '#FFFFFF',
      displayFont: 'Cormorant Garamond',
      scriptFont: 'Great Vibes',
      spacingScale: 0.98,
      transitionStyle: 'slideup',
      cleanSampleText: false,
    },
    defaultEventTitle: 'Rasm-e-Hina',
    defaultEventSubtitle: 'Traditional Mehndi & Mithai',
    defaultTiming1: 'Hina Ceremony ............. 6:30 PM',
    defaultTiming2: 'Dinner .................... 8:00 PM',
  },
];

export const WCG_MUSIC_PRESETS: WcgMusicPreset[] = [
  {
    id: 'mehndi-laga-ke-rakhna',
    title: 'Mehndi Laga Ke Rakhna · Classic Folk',
    vibe: 'Santoor & Dholak Taal',
    category: 'Mehndi',
    bpm: 104,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/mehndi-laga-ke-rakhna.m4a',
  },
  {
    id: 'din-shagna-royal',
    title: 'Din Shagna Da · Bridal Entry',
    vibe: 'Shehnai & Warm Strings',
    category: 'Nikah',
    bpm: 78,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/din-shagna-royal.m4a',
  },
  {
    id: 'london-thumakda-dhol',
    title: 'London Thumakda · Punjabi Dholki',
    vibe: 'Tumbi Riff & Bhangra Dhol',
    category: 'Mehndi',
    bpm: 114,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/london-thumakda-dhol.m4a',
  },
  {
    id: 'kesariya-love-acoustic',
    title: 'Kesariya · Acoustic Romance',
    vibe: 'Bansuri Flute & Pluck Guitar',
    category: 'Nikah',
    bpm: 88,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/kesariya-love-acoustic.m4a',
  },
  {
    id: 'afreen-sufi-mehfil',
    title: 'Afreen Afreen · Sufi Qawwali',
    vibe: 'Harmonium, Santoor & Tabla',
    category: 'Nikah',
    bpm: 84,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/afreen-sufi-mehfil.m4a',
  },
  {
    id: 'kudmayi-rukhsati-piano',
    title: 'Kudmayi · Emotional Grand Piano',
    vibe: 'Grand Piano & Velvet Strings',
    category: 'Walima',
    bpm: 72,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/kudmayi-rukhsati-piano.m4a',
  },
  {
    id: 'gallan-goodiyaan-sangeet',
    title: 'Gallan Goodiyaan · Sangeet Party',
    vibe: 'Celebration Brass & Dhol',
    category: 'Sangeet',
    bpm: 118,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/gallan-goodiyaan-sangeet.m4a',
  },
  {
    id: 'kabira-encore-shehnai',
    title: 'Kabira Encore · Festive Shehnai',
    vibe: 'Traditional Shehnai & Bells',
    category: 'Barat',
    bpm: 94,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/kabira-encore-shehnai.m4a',
  },
  {
    id: 'kalank-shahi-barat',
    title: 'Shahi Barat · Royal Mughal Sitar',
    vibe: 'Mughal Sitar & Tanpura',
    category: 'Barat',
    bpm: 80,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/kalank-shahi-barat.m4a',
  },
  {
    id: 'tere-bin-walima-lounge',
    title: 'Tere Bin · Walima Romantic Keys',
    vibe: 'Soft Keys & Acoustic Harp',
    category: 'Walima',
    bpm: 86,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/tere-bin-walima-lounge.m4a',
  },
  {
    id: 'bole-chudiyan-family',
    title: 'Bole Chudiyan · Family Sangeet',
    vibe: 'Festive Santoor & Tabla',
    category: 'Sangeet',
    bpm: 108,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/bole-chudiyan-family.m4a',
  },
  {
    id: 'mubarak-nikaah-nasheed',
    title: 'Mubarak Hai · Oud & Chimes',
    vibe: 'Warm Oud & Ambient Pad',
    category: 'Nikah',
    bpm: 76,
    durationSec: 22,
    audioUrl: '/assets/wcg-music/mubarak-nikaah-nasheed.m4a',
  },
];

export function findWcgTemplate(templateId: string): WcgTemplateSpec {
  return WCG_TEMPLATES.find((t) => t.id === templateId) || WCG_TEMPLATES[0];
}

export function findWcgMusicPreset(musicId?: string): WcgMusicPreset | null {
  if (!musicId || musicId === 'none') return null;
  return WCG_MUSIC_PRESETS.find((m) => m.id === musicId) || null;
}

export function getDefaultMusicForCategory(cat: Exclude<WcgEventCategory, 'All'>): string {
  if (cat === 'Mehndi') return 'mehndi-laga-ke-rakhna';
  if (cat === 'Barat') return 'kabira-encore-shehnai';
  if (cat === 'Walima') return 'tere-bin-walima-lounge';
  return 'din-shagna-royal';
}
