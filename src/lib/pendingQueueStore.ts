/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Pending Stories & Production Queue Store
 * Handles persistence, status toggles (pending vs published), and complete 6-scene story packages.
 */

import type { GeneratedStory } from '../components/StoryPackageView';

export type StoryPublishStatus = 'pending' | 'published' | 'draft' | 'overdue';

export interface PendingStoryRecord {
  id: string;
  title: string;
  hook: string;
  category: string;
  categoryId: number;
  characterTag: string; // WM25-1 to WM25-5
  scheduledTime: string; // e.g. "6:00 PM PKT"
  scheduledDate: string; // e.g. "26 Oct 2026"
  targetSlotReason: string;
  status: StoryPublishStatus;
  source: 'autopilot' | 'simulator' | 'calendar' | 'manual';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  createdAt: string;
  publishedAt?: string;
  youtubeUrl?: string;
  notes?: string;
  storyPackage: GeneratedStory;
}

export const PENDING_QUEUE_STORAGE_KEY = 'itcafeteria_pending_queue_v2';

// Pre-curated default queue with complete 6-scene story packages for IT Cafeteria
export const INITIAL_PENDING_QUEUE: PendingStoryRecord[] = [
  {
    id: 'pq-flow-startend',
    title: 'Google Flow AI Video Trick: Start & End Frames Control',
    hook: 'Kya aapki AI videos mein character ka face distort ho jata hai?',
    category: 'AI Chatbots, Workflows & Tools',
    categoryId: 2,
    characterTag: 'WM25-1',
    scheduledTime: '6:00 PM PKT',
    scheduledDate: '26 Oct 2026',
    targetSlotReason: 'Prime Viral Peak — Maximum India (37.9%) + Pakistan (7.0%) concurrent viewership overlap.',
    status: 'pending',
    source: 'autopilot',
    priority: 'URGENT',
    createdAt: '2026-10-26T06:00:00Z',
    notes: 'Autopilot ne high-velocity signal detect kiya tha. Is video mein character consistency solve hoti hai.',
    storyPackage: {
      title: 'Google Flow AI Video Trick: Start & End Frames Control #shorts #itcafeteria',
      hook: 'Kya aapki AI videos mein character ka face distort ho jata hai? Yeh secret lock dekhein!',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'AI Chatbots, Workflows & Tools',
      playlist: 'AI Video Mastery (16:9 & Shorts)',
      characterTag: 'WM25-1',
      dateLabel: '26 Oct 2026 • 6:00 PM PKT',
      sceneCount: 6,
      hashtags: ['#shorts', '#itcafeteria', '#googleflow', '#aivideo', '#pakistantech', '#aitricks'],
      description: `Google Flow AI Video generator mein Start Frame aur End Frame lock karne ka asaan tarika! Ab character ka chehra kabhi kharab nahi hoga.\n\nSubscribe karein IT Cafeteria for daily tech shortcuts.\nPresenter: Waqar Majeed\nCategory: AI Chatbots & Workflows`,
      tags: ['google flow', 'ai video trick', 'start end frame', 'it cafeteria', 'waqar majeed', 'flow ai urdu', 'ai animation', 'tech shorts'],
      tiktokCaption: 'Google Flow AI video mein character face distortion solve karne ka secret tarika! 🤯🔥 #itcafeteria #aivideo #pakistantech #shorts',
      thumbnailHeadline: 'AI VIDEO FACE LOCK',
      thumbnailSubBadge: '100% CONSISTENT',
      thumbnailLine1: 'AI VIDEO FACE',
      thumbnailLine2: 'LOCK TRICK',
      thumbnailHologram: 'FRAME 1 TO FRAME 60 LOCKED',
      thumbnailPrompt: 'Vertical 9:16 high-tech YouTube Shorts thumbnail cover. Deep cyber navy background #070a13. Bold 3D embossed yellow text "AI VIDEO FACE LOCK". Neon cyan frame, ultra-sharp 8k render with glowing holographic frame pins.',
      seriesPlan: 'Episode 1 of 4: Google Flow Precision Animation Series',
      memoryBlock: 'Memory Block A1 — Solves high swipe-away rate on AI video generators by giving instant 5-second fix.',
      idea: {
        title: 'Google Flow AI Video Trick: Start & End Frames Control',
        hook: 'Character distortion problem solved in Flow',
        angle: 'Creator productivity & workflow speed',
        points: 'Upload initial keyframe, lock final frame, set guidance to 7.5'
      },
      discussionNotes: 'Retention curve will spike at 25 seconds when the frame lock demo plays.',
      modelUsed: 'gemini-3.8-flash',
      scenes: [
        {
          num: 1,
          duration: '0-10s',
          purpose: 'Disruptive Hook',
          isCTA: false,
          words: 24,
          visual: 'Split screen: Left side warped distorted AI face, Right side ultra clean sharp face locked.',
          dialogue: 'Google Flow mein video banate waqt kya aapka character achanak kisi doosre insaan mein tabdeel ho jata hai?',
          script: 'Google Flow mein video banate waqt kya aapka character achanak kisi doosre insaan mein tabdeel ho jata hai? Yeh masla hamesha ke liye khatam.'
        },
        {
          num: 2,
          duration: '10-20s',
          purpose: 'Problem Analysis',
          isCTA: false,
          words: 22,
          visual: 'Flow prompt box cursor hovering over blank end frame setting with warning exclamation icon.',
          dialogue: 'Log ghalti yeh karte hain ke woh sirf single text prompt dete hain aur AI ko random frames chunne dete hain.',
          script: 'Log ghalti yeh karte hain ke woh sirf single text prompt dete hain aur AI ko random frames chunne dete hain.'
        },
        {
          num: 3,
          duration: '20-30s',
          purpose: 'Solution Step 1',
          isCTA: false,
          words: 25,
          visual: 'Screen capture zooming into Google Flow canvas: Uploading Image A into Keyframe 1.',
          dialogue: 'Ab se jab bhi prompt likhein, pehle "Start Frame" par apna character upload karein aur Motion slider ko 4 par rakhein.',
          script: 'Ab se jab bhi prompt likhein, pehle Start Frame par apna character upload karein aur Motion slider ko 4 par rakhein.'
        },
        {
          num: 4,
          duration: '30-40s',
          purpose: 'Secret Sauce Step 2',
          isCTA: false,
          words: 26,
          visual: 'Clicking End Frame slot and enabling "Interpolation Lock" toggle with glowing green tick.',
          dialogue: 'Sab se ahem trick: End Frame par same character ki closing pose daalein. Flow dono ke darmiyan smooth morph generate karega.',
          script: 'Sab se ahem trick: End Frame par same character ki closing pose daalein. Flow dono ke darmiyan smooth morph generate karega.'
        },
        {
          num: 5,
          duration: '40-50s',
          purpose: 'Live Result & Proof',
          isCTA: false,
          words: 23,
          visual: '60fps ultra smooth video output playing with side-by-side comparison proof.',
          dialogue: 'Nateeja dekhein! 100 fisad consistent character baghair kisi distortion ke. Yeh technique Hollywood studios bhi use kar rahe hain.',
          script: 'Nateeja dekhein! 100 fisad consistent character baghair kisi distortion ke. Yeh technique Hollywood studios bhi use kar rahe hain.'
        },
        {
          num: 6,
          duration: '50-60s',
          purpose: 'Clear Value CTA',
          isCTA: true,
          words: 20,
          visual: 'Waqar Majeed studio shot pointing to subscribe button with animated IT Cafeteria bell icon.',
          dialogue: 'Agli video mein Flow ka camera angle hack seekhenge. IT Cafeteria ko abhi subscribe karein!',
          script: 'Agli video mein Flow ka camera angle hack seekhenge. IT Cafeteria ko abhi subscribe karein!'
        }
      ]
    }
  },
  {
    id: 'pq-win11-autoclean',
    title: 'Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!',
    hook: 'C-Drive full ho rahi hai? Bina software 20GB space free karein!',
    category: 'PC & Windows Hacks',
    categoryId: 4,
    characterTag: 'WM25-2',
    scheduledTime: '5:00 PM PKT',
    scheduledDate: '27 Oct 2026',
    targetSlotReason: 'Desktop PC / Office Workflow Window — 29.1% of channel watch time is on Desktop computers.',
    status: 'pending',
    source: 'simulator',
    priority: 'HIGH',
    createdAt: '2026-10-26T06:05:00Z',
    notes: 'Windows Storage Sense automation shortcut. Office workers aur students ke liye high bookmark potential.',
    storyPackage: {
      title: 'Windows 11 Secret: 20GB C-Drive Auto Clean Hack #shorts #itcafeteria',
      hook: 'Aapki C-Drive bina waja red ho chuki hai? Windows 11 ka yeh hidden switch on karein!',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'PC & Windows Hacks',
      playlist: 'Windows 11 & PC Hacks',
      characterTag: 'WM25-2',
      dateLabel: '27 Oct 2026 • 5:00 PM PKT',
      sceneCount: 6,
      hashtags: ['#shorts', '#windows11', '#pcshortcuts', '#itcafeteria', '#techhacks', '#storagecleanup'],
      description: `Windows 11 mein bina kisi third-party tool ke 20GB tak junk files auto clean karne ka secret Windows Storage Sense shortcut!\n\nPresenter: Waqar Majeed • IT Cafeteria`,
      tags: ['windows 11 clean', 'storage sense', 'c drive full', 'clean temp files', 'it cafeteria', 'waqar majeed', 'pc hacks urdu'],
      tiktokCaption: 'C-Drive full ho gayi? Yeh hidden Windows setting foran on karein! 💾⚡ #itcafeteria #windows11 #pchacks',
      thumbnailHeadline: 'WINDOWS 11 20GB JUNK',
      thumbnailSubBadge: 'AUTO CLEAN HACK',
      thumbnailLine1: 'WINDOWS 11 20GB',
      thumbnailLine2: 'AUTO CLEAN',
      thumbnailHologram: 'NO 3RD PARTY APPS',
      thumbnailPrompt: 'Vertical 9:16 YouTube Shorts thumbnail cover. Windows 11 desktop glowing in dark cyber room. Giant red hard drive bar turning into glowing green free space. Big bold text "WINDOWS 11 20GB AUTO CLEAN".',
      seriesPlan: 'Episode 3: Windows 11 Speed & Maintenance',
      memoryBlock: 'Memory Block B2 — Direct hit on search queries for C drive full solutions.',
      idea: {
        title: 'Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!',
        hook: 'Free up 20GB C drive instantly',
        angle: 'No third party app needed',
        points: 'Settings > Storage Sense > Configure cleanup rules automatically'
      },
      discussionNotes: 'Keep screen zoom high so Windows settings text is easily readable on mobile screens.',
      modelUsed: 'gemini-3.8-flash',
      scenes: [
        {
          num: 1,
          duration: '0-10s',
          purpose: 'Instant Pain Point Hook',
          isCTA: false,
          words: 23,
          visual: 'Red glowing Windows C-Drive bar showing "0 bytes free" flashing danger.',
          dialogue: 'Aapki computer C-drive bina kisi nayi file download kiye achanak red ho gayi hai? CCleaner bilkul mat download karein!',
          script: 'Aapki computer C-drive bina kisi nayi file download kiye achanak red ho gayi hai? CCleaner bilkul mat download karein!'
        },
        {
          num: 2,
          duration: '10-20s',
          purpose: 'Hidden Location Reveal',
          isCTA: false,
          words: 24,
          visual: 'Keyboard pressing Windows + I, navigating directly to System > Storage.',
          dialogue: 'Keyboard se Windows plus I dabayein, System mein jayein aur Storage par click karein. Yahan Windows ka asli jadu chhupa hai.',
          script: 'Keyboard se Windows plus I dabayein, System mein jayein aur Storage par click karein. Yahan Windows ka asli jadu chhupa hai.'
        },
        {
          num: 3,
          duration: '20-30s',
          purpose: 'Step 1 Activation',
          isCTA: false,
          words: 22,
          visual: 'Toggling on "Storage Sense" with glowing highlight on "Automatic User Content Cleanup".',
          dialogue: 'Yahan "Storage Sense" ka toggle switch on karein. Lekin sirf on karne se kaam nahi banega, iske andar click karein.',
          script: 'Yahan Storage Sense ka toggle switch on karein. Lekin sirf on karne se kaam nahi banega, iske andar click karein.'
        },
        {
          num: 4,
          duration: '30-40s',
          purpose: 'Pro Configuration',
          isCTA: false,
          words: 26,
          visual: 'Setting Temporary Files cleanup to "Every Week" and Downloads trash to "Never delete personal files".',
          dialogue: 'Delete temporary files ko "Every Week" par set karein aur Recycle Bin ko "14 Days" karein. Aapki personal files safe rahengi.',
          script: 'Delete temporary files ko Every Week par set karein aur Recycle Bin ko 14 Days karein. Aapki personal files safe rahengi.'
        },
        {
          num: 5,
          duration: '40-50s',
          purpose: 'Execution & Results',
          isCTA: false,
          words: 25,
          visual: 'Clicking "Run Storage Sense Now" — gauge fills and 18.4GB gets purged in 3 seconds.',
          dialogue: 'Ab "Run Storage Sense Now" dabayein. Chand seconds mein 15 se 20 GB tak hidden cache aur update junk khud-ba-khud saaf!',
          script: 'Ab Run Storage Sense Now dabayein. Chand seconds mein 15 se 20 GB tak hidden cache aur update junk khud-ba-khud saaf!'
        },
        {
          num: 6,
          duration: '50-60s',
          purpose: 'CTA & Retention Seed',
          isCTA: true,
          words: 21,
          visual: 'Green free space drive bar with IT Cafeteria logo and subscribe button animation.',
          dialogue: 'Aapne kitni GB space bachayi? Comment mein batayein aur daily Windows hacks ke liye IT Cafeteria ko follow karein!',
          script: 'Aapne kitni GB space bachayi? Comment mein batayein aur daily Windows hacks ke liye IT Cafeteria ko follow karein!'
        }
      ]
    }
  },
  {
    id: 'pq-gemini-notebook',
    title: 'Gemini Notebook AI Secret: Ghanton Ka Research Seconds Mein!',
    hook: '50-page PDF ko 30 seconds mein podcast audio mein convert karein!',
    category: 'AI & Smart Technology',
    categoryId: 1,
    characterTag: 'WM25-3',
    scheduledTime: '6:00 PM PKT',
    scheduledDate: '28 Oct 2026',
    targetSlotReason: 'Peak Weekend Breakout Window — AI Tools & Deep Work.',
    status: 'draft',
    source: 'autopilot',
    priority: 'NORMAL',
    createdAt: '2026-10-26T06:10:00Z',
    notes: 'NotebookLM deep dive. Audio overview feature in Urdu/English.',
    storyPackage: {
      title: 'NotebookLM AI Secret: 50 Page PDF Ka Audio Podcast #shorts #itcafeteria',
      hook: 'Book parhne ka time nahi? Google ka yeh free AI tool aapke liye deep podcast bana dega!',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'AI & Smart Technology',
      playlist: 'Google AI Ecosystem',
      characterTag: 'WM25-3',
      dateLabel: '28 Oct 2026 • 6:00 PM PKT',
      sceneCount: 6,
      hashtags: ['#shorts', '#notebooklm', '#geminiai', '#itcafeteria', '#studyhack', '#aitools'],
      description: `Google NotebookLM se kisi bhi lambi PDF, notes ya research paper ko 2 hosts ke interactive audio podcast mein convert karein.\n\nPresenter: Waqar Majeed • IT Cafeteria`,
      tags: ['notebooklm', 'google notebook ai', 'pdf to podcast', 'it cafeteria', 'waqar majeed', 'urdu ai tools'],
      tiktokCaption: 'Lambi books parhna bhool jayein! NotebookLM ka yeh audio podcast magic dekhein 🎧🔥 #itcafeteria #ai #shorts',
      thumbnailHeadline: 'PDF TO AUDIO PODCAST',
      thumbnailSubBadge: 'GOOGLE NOTEBOOKLM',
      thumbnailLine1: 'PDF TO AUDIO',
      thumbnailLine2: 'PODCAST HACK',
      thumbnailHologram: 'NOTEBOOKLM FREE AI',
      thumbnailPrompt: 'Vertical 9:16 YouTube Shorts thumbnail cover. High-tech headphones glowing with audio waveforms coming out of a virtual Google document. Text "PDF TO AUDIO PODCAST".',
      seriesPlan: 'Episode 2: Google Ecosystem Power Automations',
      memoryBlock: 'Memory Block C3 — Targets students, researchers and exam prep audience.',
      idea: {
        title: 'Gemini Notebook AI Secret: Ghanton Ka Research Seconds Mein!',
        hook: 'PDF to Audio podcast in 1 click',
        angle: 'Academic and professional research efficiency',
        points: 'NotebookLM audio overview generation from research docs'
      },
      discussionNotes: 'Play a short 3-second sample clip of the audio podcast in scene 4 for massive viral retention.',
      modelUsed: 'gemini-3.8-flash',
      scenes: [
        {
          num: 1,
          duration: '0-10s',
          purpose: 'Pain Point & Solution Hook',
          isCTA: false,
          words: 24,
          visual: 'Huge 100-page dense textbook or PDF paper turning into a glowing audio cassette.',
          dialogue: 'Agar aapke paas 50 safhaat ki PDF parhne ka waqt nahi hai, to Google ka yeh AI tool aapke liye professional podcast bana dega.',
          script: 'Agar aapke paas 50 safhaat ki PDF parhne ka waqt nahi hai, to Google ka yeh AI tool aapke liye professional podcast bana dega.'
        },
        {
          num: 2,
          duration: '10-20s',
          purpose: 'Tool Navigation',
          isCTA: false,
          words: 23,
          visual: 'Browser typing notebooklm.google.com and opening clean minimalist dashboard.',
          dialogue: 'Google par search karein "NotebookLM". Yeh Google ka official free research assistant hai jo Gemini 1.5 Pro par chalta hai.',
          script: 'Google par search karein NotebookLM. Yeh Google ka official free research assistant hai jo Gemini 1.5 Pro par chalta hai.'
        },
        {
          num: 3,
          duration: '20-30s',
          purpose: 'Source Uploading',
          isCTA: false,
          words: 22,
          visual: 'Dragging 3 research PDFs and YouTube link into the Sources panel.',
          dialogue: 'Yahan apni koi bhi PDF, Google Doc ya YouTube video link drop karein. Yeh sirf aapke diye gaye data par research karega.',
          script: 'Yahan apni koi bhi PDF, Google Doc ya YouTube video link drop karein. Yeh sirf aapke diye gaye data par research karega.'
        },
        {
          num: 4,
          duration: '30-40s',
          purpose: 'Magic Feature Reveal',
          isCTA: false,
          words: 25,
          visual: 'Clicking "Generate Audio Overview" button — two AI host avatars appear talking with audio waveform.',
          dialogue: 'Ab right side par "Audio Overview" par Generate dabayein. Do AI hosts aapas mein baat kar ke poori kitab ka khulasa samjha denge!',
          script: 'Ab right side par Audio Overview par Generate dabayein. Do AI hosts aapas mein baat kar ke poori kitab ka khulasa samjha denge!'
        },
        {
          num: 5,
          duration: '40-50s',
          purpose: 'Real Life Application',
          isCTA: false,
          words: 24,
          visual: 'Student walking with earbuds listening to the generated briefing on mobile phone.',
          dialogue: 'Gaari chalate waqt ya gym mein headphones lagayein aur ghanton ki research 10 minute mein sun kar master karein.',
          script: 'Gaari chalate waqt ya gym mein headphones lagayein aur ghanton ki research 10 minute mein sun kar master karein.'
        },
        {
          num: 6,
          duration: '50-60s',
          purpose: 'Channel CTA',
          isCTA: true,
          words: 20,
          visual: 'IT Cafeteria subscribe card with Waqar Majeed studio outro.',
          dialogue: 'Aise smart AI tools sab se pehle seekhne ke liye IT Cafeteria ko subscribe zaroor karein!',
          script: 'Aise smart AI tools sab se pehle seekhne ke liye IT Cafeteria ko subscribe zaroor karein!'
        }
      ]
    }
  },
  {
    id: 'pq-secrets-chromium',
    title: 'Chrome vs Chromium Secrets (Browser Architecture)',
    hook: 'Kya Google Chrome aapki background RAM aur battery silently pee raha hai?',
    category: 'Secrets',
    categoryId: 7,
    characterTag: 'WM25-4',
    scheduledTime: '7:00 PM PKT',
    scheduledDate: '24 Oct 2026',
    targetSlotReason: 'Mobile Smartphone Leisure Window — Secrets perform with lowest swipe-away rate.',
    status: 'overdue',
    source: 'calendar',
    priority: 'HIGH',
    createdAt: '2026-10-24T14:00:00Z',
    notes: 'Scheduled date pass ho chuki hai lekin abhi tak publish nahi hua. Review karein ya naya slot dein.',
    storyPackage: {
      title: 'Chrome vs Chromium: Google Ka Chhupa Hua Secret! #shorts #itcafeteria',
      hook: 'Aap jo Chrome use kar rahe hain, woh asli browser ka sirf aadha hissa hai!',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'Secrets',
      playlist: 'Secrets & Hidden Tech',
      characterTag: 'WM25-4',
      dateLabel: '24 Oct 2026 • 7:00 PM PKT',
      sceneCount: 6,
      hashtags: ['#shorts', '#chromesecret', '#itcafeteria', '#techsecrets', '#privacytips', '#browsertricks'],
      description: `Chrome aur Chromium mein kya farq hai? Google background mein kya data collect karta hai aur aap ise kaise rok sakte hain.\n\nPresenter: Waqar Majeed • IT Cafeteria`,
      tags: ['chrome secret', 'chromium browser', 'google tracking', 'ram usage chrome', 'it cafeteria', 'waqar majeed'],
      tiktokCaption: 'Chrome ka yeh hidden secret 99% log nahi jante! 🔒⚠️ #itcafeteria #chrometricks #shorts',
      thumbnailHeadline: 'CHROME VS CHROMIUM',
      thumbnailSubBadge: 'UNFILTERED TRUTH',
      thumbnailLine1: 'CHROME VS',
      thumbnailLine2: 'CHROMIUM SECRET',
      thumbnailHologram: 'TRACKING & RAM EXPOSED',
      thumbnailPrompt: 'Vertical 9:16 YouTube Shorts thumbnail cover. Chrome logo split down the middle with dark blueprint Chromium logo. High contrast cyber neon glowing effect. Text "CHROME VS CHROMIUM".',
      seriesPlan: 'Episode 5: Digital Privacy & Browser Secrets',
      memoryBlock: 'Memory Block N1 — Memory Block N1 Category 7 secrets sequence.',
      idea: {
        title: 'Chrome vs Chromium Secrets (Browser Architecture)',
        hook: 'Browser secrets and telemetry',
        angle: 'Privacy awareness and system speed',
        points: 'Differences between open source Chromium and Google Chrome telemetry'
      },
      discussionNotes: 'Address telemetry settings directly inside Chrome settings in scene 5.',
      modelUsed: 'gemini-3.8-flash',
      scenes: [
        {
          num: 1,
          duration: '0-10s',
          purpose: 'Curiosity Shock Hook',
          isCTA: false,
          words: 23,
          visual: 'Chrome icon cracking open like an egg to reveal dark Chromium engine underneath.',
          dialogue: 'Aapke phone aur laptop mein jo Chrome chal raha hai, woh asli browser nahi balki Google ka banaya tracking wrapper hai!',
          script: 'Aapke phone aur laptop mein jo Chrome chal raha hai, woh asli browser nahi balki Google ka banaya tracking wrapper hai!'
        },
        {
          num: 2,
          duration: '10-20s',
          purpose: 'Origin Story',
          isCTA: false,
          words: 24,
          visual: 'Open source GitHub Chromium codebase logo on screen.',
          dialogue: 'Asal browser ka naam hai "Chromium" jo 100 fisad open-source hai, bina kisi Google login ya telemetry tracking ke.',
          script: 'Asal browser ka naam hai Chromium jo 100 fisad open-source hai, bina kisi Google login ya telemetry tracking ke.'
        },
        {
          num: 3,
          duration: '20-30s',
          purpose: 'What Google Adds',
          isCTA: false,
          words: 24,
          visual: 'Visual checklist showing Google services locking into Chromium engine.',
          dialogue: 'Google is open-source code ko utha kar us mein apna proprietary auto-update, sync aur background tracking engine install karta hai.',
          script: 'Google is open-source code ko utha kar us mein apna proprietary auto-update, sync aur background tracking engine install karta hai.'
        },
        {
          num: 4,
          duration: '30-40s',
          purpose: 'RAM & Battery Impact',
          isCTA: false,
          words: 23,
          visual: 'Task Manager showing 18 Google Chrome background processes consuming 3GB RAM.',
          dialogue: 'Isi wajah se Chrome aapki 40 fisad zyada RAM aur battery khata hai kyunke yeh band hone par bhi background mein chalta rehta hai.',
          script: 'Isi wajah se Chrome aapki 40 fisad zyada RAM aur battery khata hai kyunke yeh band hone par bhi background mein chalta rehta hai.'
        },
        {
          num: 5,
          duration: '40-50s',
          purpose: 'Instant Action Fix',
          isCTA: false,
          words: 25,
          visual: 'Chrome settings > System > Turning OFF "Continue running background apps when Chrome is closed".',
          dialogue: 'Foran Chrome Settings mein jayein, System par click karein aur "Continue running background apps" ko hamesha ke liye OFF kar dein.',
          script: 'Foran Chrome Settings mein jayein, System par click karein aur Continue running background apps ko hamesha ke liye OFF kar dein.'
        },
        {
          num: 6,
          duration: '50-60s',
          purpose: 'Closing & Subscription',
          isCTA: true,
          words: 20,
          visual: 'IT Cafeteria channel subscribe button with Waqar Majeed studio end-card.',
          dialogue: 'Aise hidden tech secrets jo companies chhupati hain, seekhne ke liye IT Cafeteria ko follow karein!',
          script: 'Aise hidden tech secrets jo companies chhupati hain, seekhne ke liye IT Cafeteria ko follow karein!'
        }
      ]
    }
  },
  {
    id: 'pq-published-ytchap10',
    title: 'YT Automation Chapter 10: Sound Design & Foley Tricks',
    hook: 'Viral shorts ka 50% secret sound design mein hota hai!',
    category: 'YT Automation (16:9)',
    categoryId: 9,
    characterTag: 'WM25-5',
    scheduledTime: '6:30 PM PKT',
    scheduledDate: '22 Oct 2026',
    targetSlotReason: 'Long-form lecture series prime weekend window.',
    status: 'published',
    source: 'manual',
    priority: 'NORMAL',
    createdAt: '2026-10-22T10:00:00Z',
    publishedAt: '2026-10-22T18:30:00Z',
    youtubeUrl: 'https://www.youtube.com/@itcafeteria',
    notes: 'Kamyabi ke sath publish ho chuki hai. Channel record mein synced hai.',
    storyPackage: {
      title: 'YouTube Automation Chapter 10: Pro Sound Design #shorts #itcafeteria',
      hook: 'Bina ache sound effects ke video kabhi viral nahi hoti!',
      channelName: 'IT Cafeteria',
      presenter: 'Waqar Majeed',
      categoryName: 'YT Automation (16:9)',
      playlist: 'YouTube Automation Course',
      characterTag: 'WM25-5',
      dateLabel: '22 Oct 2026 • Published',
      sceneCount: 6,
      hashtags: ['#shorts', '#ytautomation', '#sounddesign', '#itcafeteria'],
      description: 'YouTube Automation Course Chapter 10: Foley sound design tricks for viral retention.',
      tags: ['sound design', 'yt automation', 'foley', 'it cafeteria'],
      tiktokCaption: 'Sound design tricks that keep viewers hooked! 🎧✨ #itcafeteria #shorts',
      thumbnailHeadline: 'YT AUTOMATION CHAPTER 10',
      thumbnailSubBadge: 'SOUND DESIGN',
      thumbnailLine1: 'YT AUTOMATION',
      thumbnailLine2: 'CHAPTER 10',
      thumbnailHologram: 'PUBLISHED & SYNCED',
      thumbnailPrompt: 'Vertical 9:16 thumbnail cover with golden sound waves and studio mixer.',
      seriesPlan: 'Episode 10 of YouTube Automation Course',
      memoryBlock: 'Memory Block J10 — Published on schedule.',
      idea: {
        title: 'YT Automation Chapter 10: Sound Design & Foley Tricks',
        hook: 'Sound design secrets',
        angle: 'Audio psychology',
        points: 'Whoosh, risers, and subtle pops for scene transitions'
      },
      discussionNotes: 'Already published and verified.',
      scenes: []
    }
  }
];

export function loadPendingQueue(): PendingStoryRecord[] {
  try {
    if (typeof window === 'undefined') return INITIAL_PENDING_QUEUE;
    const raw = localStorage.getItem(PENDING_QUEUE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(INITIAL_PENDING_QUEUE));
      return INITIAL_PENDING_QUEUE;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PendingStoryRecord[];
    }
  } catch (e) {
    console.error('Error loading pending queue', e);
  }
  return INITIAL_PENDING_QUEUE;
}

export function savePendingQueue(queue: PendingStoryRecord[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error('Error saving pending queue', e);
  }
}

export function getNextTargetStory(queue?: PendingStoryRecord[]): PendingStoryRecord | null {
  const list = queue || loadPendingQueue();
  // Find first pending or overdue story (prioritize urgent/pending)
  const pending = list.find((item) => item.status === 'pending' || item.status === 'overdue');
  if (pending) return pending;
  const draft = list.find((item) => item.status === 'draft');
  if (draft) return draft;
  return list[0] || null;
}

export function updatePendingStoryStatus(id: string, newStatus: StoryPublishStatus): PendingStoryRecord[] {
  const current = loadPendingQueue();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : undefined,
      };
    }
    return item;
  });
  savePendingQueue(updated);
  return updated;
}

export function upsertPendingStoryRecord(record: PendingStoryRecord): PendingStoryRecord[] {
  const current = loadPendingQueue();
  const existingIndex = current.findIndex((item) => item.id === record.id || item.title === record.title);
  let updated: PendingStoryRecord[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...record };
  } else {
    updated = [record, ...current];
  }
  savePendingQueue(updated);
  return updated;
}

