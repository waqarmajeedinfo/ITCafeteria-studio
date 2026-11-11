/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IT Cafeteria — Dynamic Topic-Accurate Story Package Generator
 * Generates unique, 10-scene Roman Urdu scripts, Flow prompts, and YouTube packages
 * strictly matching the exact topic, title, and category of the requested story.
 */

import type { GeneratedStory, StoryScene } from '../components/StoryPackageView';
import { applyCinematicDirecting } from './cinematicDirector';
import { buildCategoryFlowScript } from './categoryStoryModules';
import { applyPhoneticFixes } from './phoneticDictionaryStore';
import { validateAndRepairDialogue } from './dialogueCompleteness';
import {
  buildPracticalBlueprint,
  runConsistencyGate,
  buildYouTubeDescriptionFromBlueprint,
  isConcreteTopic,
  type PracticalBlueprint
} from './practicalBlueprint';

export interface GenerateStoryParams {
  id?: string;
  title: string;
  category?: string;
  categoryId?: number;
  characterTag?: string;
  scheduledTime?: string;
  scheduledDate?: string;
  sceneCount?: number;
  channelName?: string;
  presenter?: string;
}

/**
 * Splits title into two punchy lines for 9:16 thumbnail display.
 */
function splitHeadline(title: string): [string, string] {
  const clean = title.replace(/#\S+/g, '').replace(/@\S+/g, '').replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3) {
    return [words.join(' ').toUpperCase(), 'SECRET HACK'];
  }
  const mid = Math.ceil(words.length / 2);
  return [
    words.slice(0, mid).join(' ').toUpperCase(),
    words.slice(mid).join(' ').toUpperCase()
  ];
}

/**
 * Formats tag to standard format (e.g. '@WM25-2').
 */
function normalizeTag(tag?: string): string {
  if (!tag) return '@WM25-1';
  const clean = tag.trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
}

/**
 * Generates a complete, authentic 10-scene Roman Urdu story package tailored to the topic.
 */
export function generateTopicAccurateStoryPackage(params: GenerateStoryParams): GeneratedStory {
  const presenter = params.presenter || 'Waqar Majeed';
  const channelName = params.channelName || 'IT Cafeteria';
  const charTag = normalizeTag(params.characterTag || '@WM25-1');
  const rawTitle = params.title.trim();
  const titleClean = rawTitle.replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  const category = params.category || 'AI & Smart Technology';
  const dateLabel = params.scheduledDate
    ? `${params.scheduledDate} • ${params.scheduledTime || '6:00 PM PKT'}`
    : new Date().toLocaleDateString('en-GB');

  const [line1, line2] = splitHeadline(titleClean);

  const lowerTitle = titleClean.toLowerCase();
  const lowerCat = category.toLowerCase();

  // Topic classification - granular checks so specific topics don't collapse into Storage Sense
  const isExcelCenter = lowerTitle.includes('center across') || lowerTitle.includes('merge cells') || lowerTitle.includes('merging');
  const isGoogleSheets = !isExcelCenter && (lowerTitle.includes('sheet') || lowerTitle.includes('smart fill') || (lowerTitle.includes('excel') && !isExcelCenter));
  const isPromptHacks = lowerTitle.includes('prompt') || lowerTitle.includes('chatgpt') || (lowerTitle.includes('shortcuts') && (lowerTitle.includes('ai') || lowerCat.includes('prompt')));
  const isChatbotWorkflow = lowerTitle.includes('chatbot') || lowerTitle.includes('workflow') || lowerTitle.includes('multi-agent') || lowerTitle.includes('power automate') || lowerCat.includes('chatbot');
  const isStorageSense = lowerTitle.includes('storage sense') || lowerTitle.includes('c-drive') || lowerTitle.includes('c drive') || lowerTitle.includes('cdrive') || lowerTitle.includes('free space') || lowerTitle.includes('clean c');
  const isGodMode = lowerTitle.includes('god mode') || lowerTitle.includes('control panel') || lowerTitle.includes('guid') || lowerTitle.includes('200+ hidden');
  const isClipboard = lowerTitle.includes('clipboard') || lowerTitle.includes('win + v') || lowerTitle.includes('win+v') || lowerTitle.includes('paste old');
  const isRunCommands = lowerTitle.includes('run command') || lowerTitle.includes('win + r') || lowerTitle.includes('win+r');
  const isPowerPlan = lowerTitle.includes('power plan') || lowerTitle.includes('ultimate performance');
  const isWhatsApp = lowerTitle.includes('whatsapp') || lowerTitle.includes('mobile');
  const isYouTubeCourse = lowerTitle.includes('youtube') || lowerTitle.includes('yt automation') || lowerTitle.includes('chapter');

  let hook = '';
  let description = '';
  let tags: string[] = [];
  let hashtags: string[] = [];
  let tiktokCaption = '';
  let thumbnailHeadline = line1;
  let thumbnailSubBadge = line2;
  let rawBeats: { purpose: string; visual: string; dialogue: string }[] = [];

  if (isGoogleSheets) {
    hook = 'Excel ya Google Sheets mein ghanton ka manual data entry bina kisi complex formula ke automate karein!';
    description = `Google Sheets AI Smart Fill hack! Ghanton ka data formatting aur extraction ab seedha built-in AI se automate karein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['google sheets ai', 'smart fill', 'google sheets shortcut', 'excel tricks', 'it cafeteria', 'waqar majeed', 'data entry automation', 'urdu tech'];
    hashtags = ['#Shorts', '#GoogleSheets', '#AISmartFill', '#ITCafeteria', '#DataHacks', '#ExcelUrdu'];
    tiktokCaption = 'Google Sheets ka yeh AI Smart Fill hack aapka ghanton ka waqt bachaega! 📊⚡ #itcafeteria #googlesheets #techhacks';
    thumbnailHeadline = 'SHEETS AI SMART FILL';
    thumbnailSubBadge = 'AUTOMATE MANUAL DATA';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} stands before glowing dual monitors showing a chaotic spreadsheet with 1,000 messy unformatted rows.`,
        dialogue: 'Agar aap bhi Excel ya Google Sheets mein ghanton baith kar data separate aur copy-paste karte hain, to foran ruk jayein!'
      },
      {
        purpose: 'The Manual Frustration Exposed',
        visual: 'Split screen showing employee typing names one by one with red clock ticking furiously.',
        dialogue: 'Aksar log first name aur last name alag karne ke liye manual typing karte hain aur apna qeemti waqt zaya karte hain.'
      },
      {
        purpose: 'AI Smart Fill Reveal',
        visual: 'Camera zooms in onto Google Sheets top menu highlighting the built-in AI Smart Fill toggle in glowing cyan.',
        dialogue: 'Google Sheets ka naya built-in AI Smart Fill feature aapke pattern ko pehchan kar hazaron rows sirf do second mein fill karta hai.'
      },
      {
        purpose: 'Step 1: Pattern Definition',
        visual: 'Hands typing first sample format in Row 2 Column B, showing clean extracted first name and capitalized format.',
        dialogue: 'Pehle column B ke pehle cell mein desired output type karein, maslan sirf first name aur official email format.'
      },
      {
        purpose: 'Step 2: Instant Smart Fill Trigger',
        visual: 'Keyboard pressing Ctrl + E, instantly triggering AI Smart Fill with green sparks running down 500 rows.',
        dialogue: 'Ab agle cell par ja kar keyboard se Ctrl plus E dabayein ya Google Sheets ka automatic suggestion accept karein.'
      },
      {
        purpose: 'Proof & Visual Benchmark',
        visual: 'Full table zooming out: 1,000 rows perfectly calculated and formatted in 0.5 seconds with green tick badges.',
        dialogue: 'Yeh dekhein jadu! Baghair kisi complex formula ke poora 1000 rows ka data aik second ke andar bilkul accurate ready ho gaya.'
      },
      {
        purpose: 'Pro Formula Hack',
        visual: 'Demonstration of =ARRAYFORMULA and Gemini AI integration inside Google Sheets cell.',
        dialogue: 'Pro tip: Agar automated sheets chahiyein to ARRAYFORMULA use karein taake nayi aane wali entries bhi khud ba khud format hoti rahein.'
      },
      {
        purpose: 'Common Mistake Warning',
        visual: 'Red alert cross highlighting dangerous paid extensions that steal spreadsheet credentials.',
        dialogue: 'Khabardaar! Is kaam ke liye kisi third-party paid extension par paisa zaya mat karein, yeh Sheets mein 100% free built-in hai.'
      },
      {
        purpose: 'Value & Workflow Recap',
        visual: `${charTag} in cyber studio holding high-tech tablet displaying automated workflow dashboard.`,
        dialogue: 'Yeh chota sa shortcut office workers aur students ka har haftay 10 se 15 ghante ka waqt bacha sakta hai.'
      },
      {
        purpose: 'Channel Call To Action & Loop',
        visual: 'Animated IT Cafeteria YouTube subscribe bell pulsing with glowing blue neon border.',
        dialogue: 'Aise advanced Google Sheets aur AI shortcuts daily seekhne ke liye IT Cafeteria ko foran subscribe karein!'
      }
    ];
  } else if (isPromptHacks) {
    hook = 'ChatGPT ya Gemini se generic aur boring answers milte hain? Yeh 3 prompt hacks lagayein!';
    description = `AI Prompt Hacks & Shortcuts Masterclass! ChatGPT aur Gemini se 10X behtar aur accurate answers hasil karne ka secret tareeqa.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['prompt hacks', 'chatgpt prompt', 'gemini ai', 'prompt engineering', 'it cafeteria', 'waqar majeed', 'urdu ai masterclass'];
    hashtags = ['#Shorts', '#AIPrompts', '#PromptHacks', '#ITCafeteria', '#ChatGPT', '#GeminiAI'];
    tiktokCaption = 'AI prompts likhne ka yeh secret tareeqa 99% log nahi jante! 🤖🔥 #itcafeteria #chatgpt #prompthacks';
    thumbnailHeadline = 'AI PROMPT HACKS';
    thumbnailSubBadge = '10X BETTER AI RESULTS';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} standing in tech studio looking directly into camera with shocked expression as generic AI text burns away.`,
        dialogue: 'Kya aapko bhi ChatGPT aur Gemini se har martaba boring aur robotic jawab milte hain? Asal ghalti aapke prompt mein hai!'
      },
      {
        purpose: 'The Amateur Prompt Trap',
        visual: 'Chat window showing bad prompt "Write an article about AI" resulting in boring generic essay.',
        dialogue: 'Log direct ek line ka prompt type karte hain aur AI bina context ke generic kitabi batein shuru kar deta hai.'
      },
      {
        purpose: 'Hack 1: Role & Persona Priming',
        visual: 'Glowing cyber text showing "Act as a 15-year Senior Solutions Architect" entering the prompt bar.',
        dialogue: 'Secret number aik: Hamesha Role Priming karein. AI ko batayein ke woh ek world-class software engineer ya expert consultant ban kar soche.'
      },
      {
        purpose: 'Hack 2: Negative Prompt & Constraints',
        visual: 'Neon red filter showing banned buzzwords: "Delve", "Tapestry", "Crucial" crossed out.',
        dialogue: 'Secret number do: Negative constraints lagayein. Likhein ke boring buzzwords aur corporate slop bilkul use na kare aur direct facts de.'
      },
      {
        purpose: 'Hack 3: Few-Shot Output Formatting',
        visual: 'Interactive markdown table generating instantly with clear columns, bullet points, and code snippets.',
        dialogue: 'Secret number teen: Output format fix karein. AI ko kahein ke jawab sirf tabular format ya step-by-step checklist mein produce kare.'
      },
      {
        purpose: 'Before vs After Proof',
        visual: 'Split screen comparison: Left side generic essay vs Right side razor-sharp actionable engineering blueprint.',
        dialogue: 'Dono jawab ka farq dekhein! Right side par wahi AI ab corporate grade precision answer de raha hai jo direct production ready hai.'
      },
      {
        purpose: 'System Prompt Tokens',
        visual: 'Behind the scenes view of system parameters: temperature 0.3 and tone locked to direct conversational.',
        dialogue: 'Agar aap coding ya precise logic chahte hain to temperature 0.2 rakhein taake hallucination 100 fisad khatam ho sake.'
      },
      {
        purpose: 'Common Mistake to Avoid',
        visual: 'Warning badge on screen: "Do not overload single prompts with 10 conflicting questions".',
        dialogue: 'Aik hi prompt mein 10 mukhtalif sawal mat poochein, balkay step-by-step conversation tree bana kar AI ko guide karein.'
      },
      {
        purpose: 'Episodic Recap',
        visual: `${charTag} smiles at desk with three glowing cards summarizing Role, Constraints, and Output.`,
        dialogue: 'Yeh teen prompt rules save kar lein, aapka AI workflow hamesha ke liye 10 guna smart ho jayega.'
      },
      {
        purpose: 'Subscribe & Next Episode',
        visual: 'IT Cafeteria subscribe card with Masterclass Episode 4 teaser box in bottom corner.',
        dialogue: 'Agli episode mein hum multi-agent chaining seekhenge. Video ko save karein aur IT Cafeteria ko follow karein!'
      }
    ];
  } else if (isChatbotWorkflow) {
    hook = 'Customer support aur repetitive tasks ko 100% automate karein bina kisi coding ke!';
    description = `AI Chatbots & Automated Workflows Masterclass! Multi-agent architecture aur webhook automations step-by-step seekhein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['ai chatbot', 'workflow automation', 'multi agent ai', 'power automate', 'it cafeteria', 'waqar majeed', 'no code ai'];
    hashtags = ['#Shorts', '#AIChatbot', '#Workflows', '#ITCafeteria', '#Automation', '#NoCode'];
    tiktokCaption = 'Apna khud ka 24/7 autonomous AI support agent banayein 0 code ke sath! 🤖⚡ #itcafeteria #chatbot #ai';
    thumbnailHeadline = 'AI CHATBOT WORKFLOWS';
    thumbnailSubBadge = '100% NO-CODE AUTOMATION';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} stands next to animated floating flowchart nodes connecting WhatsApp, Gmail and Google Sheets.`,
        dialogue: 'Customer messages ka jawab dene ke liye kya aap abhi bhi 24 ghante phone par baithe rehte hain?'
      },
      {
        purpose: 'The Business Problem',
        visual: 'Smartphone screen overflowing with 250 unread inquiries and lost lead notifications.',
        dialogue: 'Aksar businesses sirf is liye customers kho dete hain kyunke unka reply time 15 minute se zyada hota hai.'
      },
      {
        purpose: 'Multi-Agent Bot Reveal',
        visual: 'Holographic node network activating with glowing green connections between customer query and instant response.',
        dialogue: 'Lekin aaj hum ek aesa free AI workflow banayein ge jo customer ka sawal samajh kar khud jawab aur booking karta hai.'
      },
      {
        purpose: 'Step 1: Webhook Trigger Setup',
        visual: 'Connecting incoming webhook node from contact form or WhatsApp business API.',
        dialogue: 'Step 1: Incoming webhook trigger set karein jese hi user koi message bheje, hamara workflow foran activate ho jaye.'
      },
      {
        purpose: 'Step 2: AI Intent Classification',
        visual: 'AI agent node routing query: "Pricing", "Support", or "Booking" into 3 different colored logic branches.',
        dialogue: 'Step 2: AI agent message ka maqsad classify karta hai ke user pricing maang raha hai ya appointment schedule kar raha hai.'
      },
      {
        purpose: 'Step 3: Automated Action & Database Write',
        visual: 'Data saving into Google Sheets while WhatsApp notification fires with tailored response in under 2 seconds.',
        dialogue: 'Step 3: Customer ka data sheet mein save hota hai aur personalized reply 2 second mein deliver ho jata hai.'
      },
      {
        purpose: 'Live Real-Time Demo',
        visual: 'Side-by-side live demo: Test user sends WhatsApp text, bot responds with invoice PDF instantly.',
        dialogue: 'Live proof dekhein! Test message bhejte hi bot ne exact rate list aur direct meeting link foran send kar diya.'
      },
      {
        purpose: 'Security & Token Safeguard',
        visual: 'Rate limiter toggle and API secret encryption lock graphic glowing emerald on screen.',
        dialogue: 'Rate limiter zaroor lagayein taake koi bot spamming na kar sake aur aapka API balance hamesha mehfooz rahe.'
      },
      {
        purpose: 'Masterclass Value Summary',
        visual: `${charTag} standing at workstation showing completed automated workflow diagram with 100% uptime badge.`,
        dialogue: 'Yeh complete architecture setup karne ke baad aapka business auto-pilot mode par 24 ghante run hoga.'
      },
      {
        purpose: 'Call To Action & Resources',
        visual: 'IT Cafeteria subscribe button and downloadable workflow blueprint link in description card.',
        dialogue: 'Poora workflow blueprint description mein bilkul free hai. Aisi advanced tech ke liye IT Cafeteria ko follow karein!'
      }
    ];
  } else if (isStorageSense) {
    const isSequel = lowerTitle.includes('part 2') || lowerTitle.includes('sequel') || lowerTitle.includes('episode 2') || lowerTitle.includes('advanced') || lowerTitle.includes('pro');

    if (isSequel) {
      // Part 2 / Sequel: Advanced Space Recovery (DISM & CompactOS)
      hook = 'Storage Sense ke baad bhi C-Drive red hai? Yeh advanced command line trick 25GB free karegi!';
      description = `C-Drive Red Alert (Part 2: Advanced Pro Space Recovery)! DISM cleanup aur CompactOS se 25GB extra space bachaayein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
      tags = ['c drive full', 'c drive red', 'part 2 space recovery', 'compact os', 'dism cleanup', 'windows 11 pro', 'it cafeteria', 'waqar majeed'];
      hashtags = ['#Shorts', '#CDriveFull', '#Part2', '#Windows11Pro', '#ITCafeteria', '#SpaceRecovery'];
      tiktokCaption = 'C-Drive red masla hal karne ka Advanced Part 2 tarika! 💾⚡ #itcafeteria #windows11 #cdrivefull';
      thumbnailHeadline = 'C-DRIVE RED (PART 2)';
      thumbnailSubBadge = 'ADVANCED 25GB RECOVERY';

      rawBeats = [
        {
          purpose: 'Hook',
          visual: `${charTag} holds glowing internal SSD drive up to camera with intense focus.`,
          dialogue: 'Agar aapki Windows C-Drive red ho chuki hai, to yeh advanced command-line cleaning formula foran note karein!'
        },
        {
          purpose: 'Problem + Agitate',
          visual: 'Disk space analyzer visualizer mapping locked space inside System Volume Information and dormant update cache.',
          dialogue: 'Asal masla surface files nahi, purane Windows updates ke packages aur ghost hibernation files hain. Agar isay foran saaf na karein to drive crash hogi aur PC freeze ho jayega.'
        },
        {
          purpose: 'Reveal',
          visual: 'Windows terminal opening with administrative privileges highlighting official built-in tools.',
          dialogue: 'Lekin Windows ke paas built-in commands hain jo baghair kisi paid software ke sari dormant space free karti hain.'
        },
        {
          purpose: 'Demo 1',
          visual: 'Mode A (Screen only): Full-screen desktop briefly for context, then camera zooms in and focuses tightly on Terminal Admin window filling the frame. Visible cursor runs compact.exe /compactos:always with large readable on-screen command text.',
          dialogue: 'Step 1: Win plus X daba kar Terminal Admin kholein aur compact.exe slash compactos always enter karein.'
        },
        {
          purpose: 'Demo 2',
          visual: 'Mode A (Screen only): Terminal window zoomed in for high legibility. Visible cursor executes dism.exe /online /cleanup-image /startcomponentcleanup /resetbase with large on-screen command banner.',
          dialogue: 'Step 2: DISM cleanup command chalayein jo tamam expire ho chuki update files ko permanently delete karti hai.'
        },
        {
          purpose: 'Demo 3',
          visual: 'Mode A (Screen only): Terminal zoomed in executing powercfg -h off with large readable on-screen command text, wiping dormant hiberfil file.',
          dialogue: 'Step 3: Desktop users powercfg minus h off dabayein taake unused hibernation ghost file khatam ho jaye.'
        },
        {
          purpose: 'Proof + Result',
          visual: 'Mode A (Screen only): File Explorer window opening to This PC. Camera zooms in on C-Drive storage capacity bar as it turns from red to cyan with 35GB free space.',
          dialogue: 'Nateeja dekhein! C-Drive ka red bar blue ho chuka hai aur 30 GB se zyada clean space ready hai.'
        },
        {
          purpose: 'Benefit',
          visual: 'System diagnostics showing fast CPU boost and zero lag across active apps.',
          dialogue: 'Iska faida yeh hai ke system par zero load hai aur read write speed pehle se 2 guna fast respond kar rahi hai.'
        },
        {
          purpose: 'Curiosity Loop',
          visual: `${charTag} pointing toward Windows settings with futuristic holographic lock.`,
          dialogue: 'Kya aap jante hain ke isi tarah RAM cache bhi baghair restart kiye instant refresh ho sakti hai?'
        },
        {
          purpose: 'Conclusion + Save CTA',
          visual: 'IT Cafeteria save video badge with subscribe button pulsating on screen.',
          dialogue: 'Is video ko abhi save kar lein aur IT Cafeteria ko follow karke notification on karein!'
        }
      ];
    } else {
      // Standard Storage Sense
      hook = 'Windows PC slow ho raha hai? Sirf yeh ek hidden setting on karein aur system 2X fast karein!';
      description = `Windows 11 aur PC speedup secrets! Bina kisi third party tool ke RAM aur storage optimize karein.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
      tags = ['windows 11', 'pc speedup', 'c drive clean', 'storage sense', 'it cafeteria', 'waqar majeed', 'pc hacks urdu'];
      hashtags = ['#Shorts', '#Windows11', '#PCHacks', '#ITCafeteria', '#TechShorts', '#SpeedUpPC'];
      tiktokCaption = 'Windows PC ki speed 2X boost karne ka secret Windows built-in tareeqa! 💻⚡ #itcafeteria #windows11 #pchacks';
      thumbnailHeadline = 'WINDOWS 11 SECRET';
      thumbnailSubBadge = 'AUTO CLEAN & SPEEDUP';

      rawBeats = [
        {
          purpose: 'Hook',
          visual: `${charTag} gestures toward a computer monitor showing heavy lag and spinning mouse cursor.`,
          dialogue: 'Aapka computer ya laptop achanak hang ho raha hai? Kisi third party cleaner app ko bilkul mat install karein!'
        },
        {
          purpose: 'Problem + Agitate',
          visual: 'Task manager opening with 100% disk usage and red warning bar across background services.',
          dialogue: 'Background update cache aur temporary files silently hard drive par jam hoti rehti hain. Agar isay saaf na karein to hard drive crash kar sakti hai aur daily kaam atak jayega.'
        },
        {
          purpose: 'Reveal',
          visual: 'Keyboard pressing Windows + I, navigating straight to System > Storage settings.',
          dialogue: 'Windows key plus I dabayein aur System mein Storage par click karein. Yahan Windows ka built-in cleaner maujood hai.'
        },
        {
          purpose: 'Demo 1',
          visual: 'Mode A (Screen only): Windows Settings Storage page. Visible cursor toggles Storage Sense switch to ON and sets cleanup frequency with clear highlight.',
          dialogue: 'Step 1: Storage Sense ko on karein aur cleanup frequency ko Every Week par set karein taake junk auto delete hota rahe.'
        },
        {
          purpose: 'Demo 2',
          visual: 'Mode A (Screen only): Screen zooms in on "Run Storage Sense Now" button. Visible cursor clicks the button as active cleanup progress bar frees temporary cache.',
          dialogue: 'Step 2: Ab Run Storage Sense dabayein taake temporary junk files baghair kisi error ke saaf ho jayein.'
        },
        {
          purpose: 'Demo 3',
          visual: 'Mode A (Screen only): Task Manager Startup Apps tab zoomed in for high legibility. Visible cursor highlights and disables unnecessary background apps.',
          dialogue: 'Step 3: Task Manager mein Startup Apps par ja kar faltu software disable karein taake boot time aadha reh jaye.'
        },
        {
          purpose: 'Proof + Result',
          visual: 'Mode A (Screen only): Task Manager performance graph. Camera zooms in on disk and CPU usage dropping from 95% to 3% with green verification checkmark.',
          dialogue: 'Nateeja dekhein! System load foran normal ho gaya aur applications bina kisi delay ke instant open ho rahi hain.'
        },
        {
          purpose: 'Benefit',
          visual: `${charTag} in sleek cyber workstation with smooth running monitors and clean desktop.`,
          dialogue: 'Iska faida yeh hai ke aapke laptop ki life aur speed salon tak fresh aur tez rahegi.'
        },
        {
          purpose: 'Curiosity Loop',
          visual: 'Keyboard glowing with shortcut hint for Windows hidden memory diagnostics.',
          dialogue: 'Kya aap jante hain ke Windows mein baghair restart kiye bhi memory clean ho sakti hai?'
        },
        {
          purpose: 'Conclusion + Save CTA',
          visual: 'IT Cafeteria subscribe button and YouTube channel bell animation.',
          dialogue: 'Daily Windows shortcuts seekhne ke liye is video ko save karein aur IT Cafeteria ko subscribe karein!'
        }
      ];
    }
  } else if (isGodMode) {
    hook = 'Windows 11 ka Secret God Mode: Aik single folder se 200+ hidden control panel settings unlock karein!';
    description = `Windows 11 God Mode Secret Trick! 200 se zyada hidden system settings aik jagah.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['windows god mode', 'god mode trick', 'hidden settings windows 11', 'it cafeteria', 'waqar majeed', 'pc shortcuts urdu'];
    hashtags = ['#Shorts', '#GodMode', '#Windows11', '#ITCafeteria', '#PCSecrets'];
    tiktokCaption = 'Windows 11 ka Secret God Mode kaise activate karein! 🔥⚡ #itcafeteria #godmode #pchacks';
    thumbnailHeadline = 'WINDOWS GOD MODE';
    thumbnailSubBadge = '200+ HIDDEN SETTINGS';

    rawBeats = [
      {
        purpose: 'Hook',
        visual: `${charTag} stands before multiple holographic control panels expanding in 360 degrees.`,
        dialogue: 'Windows ki settings dhoondne ke liye kya aap abhi bhi 10 alag alag menus mein bhatak rahe hain?'
      },
      {
        purpose: 'Problem + Agitate',
        visual: 'User struggling through nested settings and broken control panel links with frustrated expression.',
        dialogue: 'Zaroori settings dhoondne mein ghanton zaya hote hain. Is maslay ki wajah se aksar log ghalat options click karke system settings kharab kar bethte hain.'
      },
      {
        purpose: 'Reveal',
        visual: 'Desktop screen creating new folder and renaming with secret GUID code.',
        dialogue: 'Lekin Windows 11 ka secret God Mode tamam 200 se zyada hidden settings ko sirf aik single folder mein le aata hai.'
      },
      {
        purpose: 'Demo 1',
        visual: 'Mode A (Screen only): Desktop screen with visible cursor right-clicking empty space and selecting New -> Folder from context menu.',
        dialogue: 'Step 1: Desktop par khali jagah right click karein aur aik naya folder banayein.'
      },
      {
        purpose: 'Demo 2',
        visual: 'Mode A (Screen only): Camera zooms in on folder rename field. Visible cursor pastes "GodMode.{ED7BA470-8E54-465E-825C-99712043E01C}" with large readable on-screen text overlay.',
        dialogue: 'Step 2: Folder ka naam rename karke exact GodMode GUID code paste karein jo screen par dikh raha hai.'
      },
      {
        purpose: 'Demo 3',
        visual: 'Mode A (Screen only): Folder window opening and zooming to fill frame, displaying categorized list of 206 master settings with visible cursor scrolling through tools.',
        dialogue: 'Step 3: Enter dabayein aur is folder ko open karein, tamam control panel options aik jagah ready hain.'
      },
      {
        purpose: 'Proof + Result',
        visual: 'Mode A (Screen only): All 206 control panel applets verified accessible in single folder view without lag or system crashes.',
        dialogue: 'Nateeja dekhein! Yahan Power, Display aur User Accounts ki 200 settings aik click par access ho rahi hain.'
      },
      {
        purpose: 'Benefit',
        visual: `${charTag} pointing to organized workstation with clean control panel.`,
        dialogue: 'Iska faida yeh hai ke aapko kabhi bhi alag alag menus mein bhatakna nahi paray ga aur time bachega.'
      },
      {
        purpose: 'Curiosity Loop',
        visual: 'Glowing cyber icon hinting at hidden Windows terminal shortcuts.',
        dialogue: 'Kya aap jante hain ke is folder ke ilawa Windows 11 mein aik shortcut se direct super-admin mode bhi khulta hai?'
      },
      {
        purpose: 'Conclusion + Save CTA',
        visual: 'IT Cafeteria subscribe button and community card.',
        dialogue: 'Aisi hidden Windows tricks ke liye is video ko save karein aur IT Cafeteria ko follow karein!'
      }
    ];
  } else if (isExcelCenter) {
    hook = 'Excel mein cells merge karna band karein! Yeh Center Across Selection trick formulas ko tootne se bachayegi.';
    description = `Excel Center Across Selection trick! Merge Cells ki wajah se formulas break hona hamesha ke liye band.\n\nPresenter: ${presenter} • IT Cafeteria\nCategory: ${category}\nTag: ${charTag}`;
    tags = ['excel center across selection', 'stop merge cells', 'excel formulas', 'it cafeteria', 'waqar majeed', 'excel hacks urdu'];
    hashtags = ['#Shorts', '#ExcelHacks', '#CenterAcrossSelection', '#ITCafeteria', '#DataTips'];
    tiktokCaption = 'Excel mein cells merge karne ki ghalti hamesha ke liye band karein! 📊⚡ #itcafeteria #excel #techtips';
    thumbnailHeadline = 'STOP MERGING CELLS';
    thumbnailSubBadge = 'CENTER ACROSS SELECTION';

    rawBeats = [
      {
        purpose: 'Disruptive Hook (Pattern Interrupt)',
        visual: `${charTag} points to Excel sheet where #VALUE! error pops up after merging cells.`,
        dialogue: 'Agar aap bhi Excel mein heading center karne ke liye Merge Cells use karte hain, to foran ruk jayein!'
      },
      {
        purpose: 'The Merge Cells Catastrophe',
        visual: 'Employee trying to sort column or drag formula, getting annoying "Merged cells must be identical size" popup.',
        dialogue: 'Merge cells karne se formulas toot jate hain aur column sorting mukammal block ho jati hai.'
      },
      {
        purpose: 'The Professional Alternative',
        visual: 'Selecting cells A1 to E1 without merging.',
        dialogue: 'Cells ko select karein jahan heading center karni hai, lekin Merge button par click na karein.'
      },
      {
        purpose: 'Step 1: Format Cells Shortcut',
        visual: 'Pressing Ctrl + 1 on keyboard, Format Cells dialogue box opens instantly.',
        dialogue: 'Keyboard se Ctrl plus 1 dabayein taake Format Cells window open ho.'
      },
      {
        purpose: 'Step 2: Center Across Selection',
        visual: 'Navigating to Alignment tab > Horizontal dropdown > Selecting "Center Across Selection".',
        dialogue: 'Alignment tab mein Horizontal dropdown se Center Across Selection select karein aur OK dabayein.'
      },
      {
        purpose: 'Proof & Visual Result',
        visual: 'Text centers perfectly across 5 columns while cells A1, B1, C1 remain completely independent.',
        dialogue: 'Jadu dekhein! Heading bilkul center mein aa gayi lekin cells alag alag hain aur koi formula nahi toota.'
      },
      {
        purpose: 'Sorting & Filter Test',
        visual: 'Dragging formulas and sorting columns smoothly with green verification checks.',
        dialogue: 'Ab aap columns ko bina kisi rukawat ke filter aur sort kar sakte hain.'
      },
      {
        purpose: 'Pro Tip: Macro Shortcut',
        visual: 'Demonstration of 1-click personal ribbon button for Center Across Selection.',
        dialogue: 'Pro tip: Quick Access Toolbar mein iska button add karein taake 1-click se apply ho sake.'
      },
      {
        purpose: 'Summary & Value',
        visual: `${charTag} smiling at clean structured Excel financial dashboard.`,
        dialogue: 'Yeh choti si trick corporate data analysts ki sab se favourite setting hai.'
      },
      {
        purpose: 'Closing & Subscribe',
        visual: 'IT Cafeteria subscribe card and YouTube notification bell.',
        dialogue: 'Daily Excel aur office hacks ke liye IT Cafeteria ko foran subscribe karein!'
      }
    ];
  } else {
    // Dynamic generation incorporating exact title, category, and active channel profile
    const isBeauty = lowerCat.includes('beauty') || lowerCat.includes('skincare') || lowerCat.includes('hair') || lowerCat.includes('makeup') || channelName.toLowerCase().includes('beauty');

    hook = isBeauty
      ? `Kya aap jante hain ke ${titleClean} se glowing aur healthy look hasil karna kitna asaan hai?`
      : `Kya aap jante hain ke ${titleClean} aapka ghanton ka waqt bacha sakta hai?`;
    description = `${titleClean}! Complete step-by-step masterclass in Roman Urdu.\n\nPresenter: ${presenter} • ${channelName}\nCategory: ${category}\nTag: ${charTag}`;
    tags = [titleClean.toLowerCase(), category.toLowerCase(), channelName.toLowerCase(), presenter.toLowerCase(), 'tips urdu', 'trending guide'];
    hashtags = ['#Shorts', `#${channelName.replace(/\s+/g, '')}`, '#ViralGuide', '#UrduContent'];
    tiktokCaption = `${titleClean} ka secret tarika! Dekhein aur try karein 🔥 #${channelName.toLowerCase().replace(/\s+/g, '')} #shorts`;
    thumbnailHeadline = line1;
    thumbnailSubBadge = line2;

    rawBeats = isBeauty
      ? [
          {
            purpose: 'Disruptive Hook (Pattern Interrupt)',
            visual: `${charTag} in elegant vanity studio studio lights gesturing towards floating text: "${titleClean}".`,
            dialogue: `Agar aap bhi ${titleClean} ke baare mein confused hain ya chemical products se thak chuke hain, to yeh zaroor dekhein!`
          },
          {
            purpose: 'The Problem Exposed',
            visual: 'Split screen displaying common skincare mistakes and unbalanced routine results.',
            dialogue: `Aksar log galat products mix kar ke apni skin barrier ko damage kar lete hain aur results nahi milte.`
          },
          {
            purpose: 'Secret Feature Reveal',
            visual: `Soft studio focus on gentle dermatologically-approved ingredients and tools for ${titleClean}.`,
            dialogue: `Lekin aaj ${channelName} par mein aapko iska ek natural aur verified formula dikha rahi hoon jo 100% safe hai.`
          },
          {
            purpose: 'Step 1: Configuration',
            visual: 'Clean application step with morning sunlight highlighting natural skin texture.',
            dialogue: `Step 1: Sab se pehle gentle cleanser se base clean karein aur yeh pehli step apply karein.`
          },
          {
            purpose: 'Step 2: Core Execution',
            visual: 'Smooth upward massage technique demonstration with timer overlay.',
            dialogue: `Step 2: Is product ko circular motion mein sirf do minute tak massage karein taake skin absorb kar sake.`
          },
          {
            purpose: 'Live Verification Proof',
            visual: 'Clear radiant glow comparison before and after with hydration moisture gauge.',
            dialogue: `Farq dekhein! Skin instant hydrate aur glowing mehsoos ho rahi hai baghair kisi chipchipahat ke.`
          },
          {
            purpose: 'Pro Tip & Optimization',
            visual: 'Callout badge showing SPF sunscreen layer and night-time lock ritual.',
            dialogue: `Pro tip: Subah ke waqt iske baad sunscreen lagana hargiz na bhoolein warna effect zaya ho jayega.`
          },
          {
            purpose: 'Mistake Avoidance',
            visual: 'Caution badge over harsh physical scrubs and expired cosmetic formulas.',
            dialogue: `Khabardaar: Is routine ke doran harsh exfoliating scrubs mat lagayein taake redness na aaye.`
          },
          {
            purpose: 'Executive Summary',
            visual: `${charTag} smiling at camera holding completed daily skincare regimen kit.`,
            dialogue: `Yeh asaan daily routine aapki skin ko natural glow aur permanent fresh look faraham karegi.`
          },
          {
            purpose: 'Call to Action & Community',
            visual: `${channelName} subscribe and follow animation with gentle pastel pink aesthetic.`,
            dialogue: `Aise authentic beauty aur skincare secrets rozana seekhne ke liye ${channelName} ko foran follow karein!`
          }
        ]
      : (() => {
          // Derive scenes directly from Practical Blueprint
          const bp = buildPracticalBlueprint({
            topic: titleClean,
            categoryName: category,
            categoryId: params.categoryId || 1,
            channelId: channelName.toLowerCase().includes('beauty') ? 'beautyhub' : 'itcafeteria'
          });
          const tool = bp.namedToolOrApp || titleClean;
          const s1 = bp.steps[0] || { actionTitle: 'Access Tool', exactPathOrCommand: tool, expectedResult: 'Tool Ready', dialogueFocus: `Step 1: ${tool} open karein.` };
          const s2 = bp.steps[1] || { actionTitle: 'Execute Action', exactPathOrCommand: 'Settings -> Feature', expectedResult: 'Feature active', dialogueFocus: `Step 2: Yeh specific setting toggle karein.` };
          const s3 = bp.steps[2] || { actionTitle: 'Verify Output', exactPathOrCommand: 'Run / Test', expectedResult: 'Output verified', dialogueFocus: `Step 3: Ab live test run karke verify karein.` };

          return [
            {
              purpose: 'Hook',
              visual: `${charTag} standing at workstation, points toward high-contrast floating 3D graphic of ${tool}.`,
              dialogue: `Kya aap jante hain ke ${tool} se aapka ghanton ka kaam asan ho sakta hai? Dekhein yeh verified tareeqa.`
            },
            {
              purpose: 'Problem + Agitate',
              visual: `Split screen displaying traditional slow manual bottleneck without ${tool}.`,
              dialogue: `Aksar log is kaam ke liye ghanton manual tareeqay use karte hain. Is maslay ko ignore karne se rozana waqt zaya hota hai aur kaam hamesha atak jata hai.`
            },
            {
              purpose: 'Reveal',
              visual: `Screencast zooming into ${tool} official interface displaying the verified feature.`,
              dialogue: `Lekin ${tool} ka yeh official feature aapke poore process ko 3 simple steps mein convert kar deta hai.`
            },
            {
              purpose: 'Demo 1',
              visual: s1.visualDescription || `Mode A (Screen only): Screencast executing ${s1.exactPathOrCommand} in ${tool}. Visible cursor highlights the action with large readable on-screen command text.`,
              dialogue: s1.dialogueFocus || `Step 1: ${s1.exactPathOrCommand} open karein jesa screen par dikh raha hai.`
            },
            {
              purpose: 'Demo 2',
              visual: s2.visualDescription || `Mode A (Screen only): Screencast applying ${s2.exactPathOrCommand} with clear cursor highlight and large on-screen parameter text.`,
              dialogue: s2.dialogueFocus || `Step 2: ${s2.exactPathOrCommand} configure karein.`
            },
            {
              purpose: 'Demo 3',
              visual: s3.visualDescription || `Mode A (Screen only): Live screen executing ${s3.exactPathOrCommand} with progress indicators and visible cursor.`,
              dialogue: s3.dialogueFocus || `Step 3: Ab ${s3.actionTitle} run karein aur final settings save karein.`
            },
            {
              purpose: 'Proof + Result',
              visual: `Mode A (Screen only): Live verification screen confirming ${s3.expectedResult}. Camera zooms in on output readout with large on-screen verification text.`,
              dialogue: `Nateeja dekhein! Screen par verified output ready hai aur har calculation bilkul accurate hai.`
            },
            {
              purpose: 'Benefit',
              visual: `${charTag} in studio framing key takeaway card for ${tool}.`,
              dialogue: `Iska faida yeh hai ke aapka daily workflow bilkul automate ho jata hai aur consistency barqarar rehti hai.`
            },
            {
              purpose: 'Curiosity Loop',
              visual: `Graphic card highlighting another smart option inside ${tool}.`,
              dialogue: `Kya aap jante hain ke is tool ki advanced settings mein aik aur time-saving trick bhi maujood hai?`
            },
            {
              purpose: 'Conclusion + Save CTA',
              visual: `${channelName} subscribe button animation with ${presenter} presentation end-card.`,
              dialogue: `Is tutorial ko abhi save kar lein aur ${channelName} ko follow karein!`
            }
          ];
        })();
  }

  // Construct scenes with dialogue completeness defense, cinematic directing & living phonetic dictionary rules
  const scenes: StoryScene[] = rawBeats.map((beat, idx) => {
    const sceneNum = idx + 1;
    const isCTA = sceneNum === rawBeats.length;

    // Rule A2: Enforce grammatical completeness, proper punctuation, no "...", and typo fixing
    const validated = validateAndRepairDialogue(beat.dialogue, sceneNum, beat.purpose);
    const phoneticDialogue = applyPhoneticFixes(validated.dialogue);
    const words = phoneticDialogue.split(/\s+/).filter(Boolean).length;
    const flowScript = buildCategoryFlowScript({
      categoryId: params.categoryId || 1,
      sceneNum,
      totalScenes: rawBeats.length,
      beatPurpose: beat.purpose,
      visual: beat.visual,
      dialogue: phoneticDialogue,
      tag: charTag,
      presenter,
      seedTopic: rawTitle,
    });
    const directedScript = applyCinematicDirecting(sceneNum, flowScript, undefined, beat.purpose);

    return {
      num: sceneNum,
      duration: '0-10s',
      purpose: beat.purpose,
      isCTA,
      words,
      visual: beat.visual,
      dialogue: phoneticDialogue,
      script: directedScript
    };
  });

  const practicalBlueprint = buildPracticalBlueprint({
    topic: titleClean,
    categoryName: category,
    categoryId: params.categoryId || 1,
    channelId: channelName.toLowerCase().includes('beauty') ? 'beautyhub' : 'itcafeteria'
  });

  // Calculate dynamic scene mapping for practical demonstration steps (Scenes 4, 5, 6, 7...)
  const sceneMapping: Record<number, number> = {};
  practicalBlueprint.steps.forEach((step, sIdx) => {
    // Demonstration steps in 10-scene short structure normally start at Scene 4
    sceneMapping[step.stepNumber] = Math.min(4 + sIdx, scenes.length - 1);
  });

  const structuredDescription = buildYouTubeDescriptionFromBlueprint({
    blueprint: practicalBlueprint,
    presenter,
    channelName,
    hook: applyPhoneticFixes(hook),
    sceneMapping
  });

  const consistencyReport = runConsistencyGate({
    title: rawTitle,
    hook: applyPhoneticFixes(hook),
    description: structuredDescription,
    scenes
  }, practicalBlueprint);

  return {
    title: rawTitle,
    hook: applyPhoneticFixes(hook),
    channelName,
    presenter,
    categoryName: category,
    playlist: category,
    characterTag: charTag,
    dateLabel,
    sceneCount: scenes.length,
    scenes,
    hashtags: ['#Shorts', `#${channelName.replace(/[^a-zA-Z0-9]/g, '')}`, `#${(practicalBlueprint.namedToolOrApp || 'Tech').replace(/[^a-zA-Z0-9]/g, '')}`].slice(0, 3),
    description: structuredDescription,
    tags,
    tiktokCaption,
    thumbnailHeadline,
    thumbnailSubBadge,
    thumbnailLine1: line1,
    thumbnailLine2: line2,
    thumbnailHologram: `a glowing 3D visual showcase representing "${titleClean}" with branding elements of ${channelName}`,
    thumbnailPrompt: `Vertical 9:16 high-impact YouTube Shorts thumbnail cover for ${channelName}. Bold 3D embossed text "${thumbnailHeadline}". Ultra-sharp 8k cinematic render, vibrant focal lighting, modern digital studio aesthetics.`,
    seriesPlan: 'Daily Episode Sequence',
    memoryBlock: `MEM-${Date.now()}`,
    idea: {
      title: titleClean,
      hook,
      angle: 'High-Retention Practical Workflow',
      points: `Authentic Roman Urdu demonstration for ${titleClean}`
    },
    discussionNotes: `Tailored 10-scene sequence specifically crafted for ${titleClean}. Strictly 10s per scene, 22-25 words per dialogue.`,
    practicalSteps: practicalBlueprint.steps.map(s => `${s.stepNumber}. ${s.actionTitle}: ${s.exactPathOrCommand}`),
    outsourcedLinks: practicalBlueprint.sourceLinks,
    demoPrompt: practicalBlueprint.improvedPrompt || (isGoogleSheets
      ? `Extract first name and format official email from messy Column A data using Google Sheets AI Smart Fill (Ctrl + E).`
      : isPromptHacks
      ? `Act as an expert systems architect. Provide direct, non-fluff, tabular checklist of the architecture without filler text.`
      : isChatbotWorkflow
      ? `Create a multi-agent webhook router that classifies incoming inquiries into Support, Sales, or Booking with zero code.`
      : `Complete hands-on demonstration of ${titleClean} in Roman Urdu.`),
    practicalBlueprint,
    consistencyReport
  };
}

/**
 * Checks if a storyPackage is corrupted or mismatched against its parent record title.
 * For example: if title is "Google Sheets..." but scenes talk about "PC 2X fast" or "system slow",
 * or if scenes are empty, return TRUE (mismatched / needs self-healing).
 */
export function isStoryPackageMismatched(recordTitle: string, pkg?: GeneratedStory | null): boolean {
  if (!pkg) return true;
  if (!pkg.scenes || !Array.isArray(pkg.scenes) || pkg.scenes.length === 0) return true;

  const titleLower = (recordTitle || '').toLowerCase();
  const pkgTitleLower = (pkg.title || '').toLowerCase();
  const hookLower = (pkg.hook || '').toLowerCase();
  const scene1Dialogue = (pkg.scenes[0]?.dialogue || '').toLowerCase();

  // If the dialogue mentions "system slow" or "pc 2x fast" or "ccleaner" or "temporary files"
  // but the record is about Sheets, Prompt Hacks, Chatbots, YouTube, etc. -> MISMATCH!
  const hasPCContent =
    scene1Dialogue.includes('system slow') ||
    scene1Dialogue.includes('pc 2x fast') ||
    scene1Dialogue.includes('ccleaner') ||
    hookLower.includes('system slow') ||
    hookLower.includes('pc 2x fast');

  if (hasPCContent) {
    const isActuallyPCTopic =
      titleLower.includes('pc') ||
      titleLower.includes('windows') ||
      titleLower.includes('storage') ||
      titleLower.includes('laptop') ||
      titleLower.includes('c-drive') ||
      titleLower.includes('c drive');

    if (!isActuallyPCTopic) {
      return true; // Blatant mismatch! e.g. Google Sheets having PC cleanup dialogue
    }
  }

  // If record mentions Google Sheets or Excel, but scenes don't mention Sheets or Excel or Data
  if (titleLower.includes('sheet') || titleLower.includes('excel') || titleLower.includes('smart fill')) {
    const mentionsSheet =
      pkgTitleLower.includes('sheet') ||
      hookLower.includes('sheet') ||
      scene1Dialogue.includes('sheet') ||
      scene1Dialogue.includes('excel') ||
      scene1Dialogue.includes('data');
    if (!mentionsSheet) return true;
  }

  // If record mentions Prompt Hacks, but scenes don't mention Prompt or ChatGPT or AI
  if (titleLower.includes('prompt')) {
    const mentionsPrompt =
      pkgTitleLower.includes('prompt') ||
      hookLower.includes('prompt') ||
      scene1Dialogue.includes('prompt') ||
      scene1Dialogue.includes('chatgpt') ||
      scene1Dialogue.includes('ai');
    if (!mentionsPrompt) return true;
  }

  // If record mentions Chatbot, but scenes don't mention Bot or Chatbot or Workflow
  if (titleLower.includes('chatbot')) {
    const mentionsBot =
      pkgTitleLower.includes('chatbot') ||
      hookLower.includes('chatbot') ||
      scene1Dialogue.includes('chat') ||
      scene1Dialogue.includes('bot') ||
      scene1Dialogue.includes('workflow') ||
      scene1Dialogue.includes('automate');
    if (!mentionsBot) return true;
  }

  return false;
}

/**
 * Creative Rewrite Angles & Fresh Perspectives for IT Cafeteria
 */
const CREATIVE_REWRITE_ANGLES = [
  {
    name: 'Curiosity Shock & Contrarian Angle',
    hookPrefix: 'Yeh aik secret setting 99% log ignore karte hain: ',
    dialogueStyle: 'bold_contrarian'
  },
  {
    name: 'Rapid Speed & Productivity Miracle',
    hookPrefix: 'Ghanton ka boring kaam sirf 3 clicks mein mukammal: ',
    dialogueStyle: 'fast_efficiency'
  },
  {
    name: 'Insider Industry Leak & Pro Technique',
    hookPrefix: 'Silicon Valley aur top tech creators ka confidential formula: ',
    dialogueStyle: 'pro_leak'
  },
  {
    name: 'Mistake Avoidance & Instant Fix',
    hookPrefix: 'Stop! Yeh ghalti aapka poora project kharab kar rahi hai: ',
    dialogueStyle: 'avoid_mistake'
  }
];

/**
 * Completely rewrites an entire Story Package with brand new Roman Urdu dialogue,
 * fresh visual hooks, varied Flow camera angles, and creative phrasing while preserving the core topic.
 */
export function rewriteCompleteStoryPackage(currentStory: GeneratedStory, preferredAngleIndex?: number): GeneratedStory {
  const angleIdx = preferredAngleIndex !== undefined
    ? preferredAngleIndex % CREATIVE_REWRITE_ANGLES.length
    : Math.floor(Math.random() * CREATIVE_REWRITE_ANGLES.length);
  const chosenAngle = CREATIVE_REWRITE_ANGLES[angleIdx];

  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const presenter = currentStory.presenter || 'Waqar Majeed';
  const charTag = currentStory.characterTag || '@WM25-1';
  const cleanTitle = currentStory.title.replace(/#\S+/g, '').replace(/@\S+/g, '').trim();

  // Fresh hooks based on topic keywords and angle
  const altHooks = [
    `${chosenAngle.hookPrefix}${cleanTitle}! Ab dekhein live practical demonstration.`,
    `Aapke computer aur workflow ko 10x behtar banane ka seedha aur asaan tareeqa: ${cleanTitle}.`,
    `Agar aapko lagta tha ke ${cleanTitle} mushkil hai, to yeh 60 seconds aapki soch badal denge!`,
    `Notice karein ke expert log kaise ${cleanTitle} ko smart tareeqe se use karte hain.`
  ];
  const freshHook = altHooks[Math.floor(Math.random() * altHooks.length)];

  // Fresh alternative dialogues & visuals per beat
  const alternativeBeatVariations: Record<number, { visual: string; dialogue: string }[]> = {
    1: [
      {
        visual: `${charTag} leans intently toward the ultra-wide 4K monitor, raising one hand in a firm stop gesture as HUD graphics pulse.`,
        dialogue: 'Agar aap bhi is masle mein phans kar apna waqt zaya kar rahe hain, to agle 50 seconds dhyan se dekhein!'
      },
      {
        visual: `Dynamic camera snap-zoom on ${charTag} pointing straight at the red flashing warning indicator on screen.`,
        dialogue: 'Rukein! Aksar log yeh basic ghalti bar bar dohrate hain jis ki wajah se unka result kabhi clean nahi aata.'
      },
      {
        visual: `High-energy neon studio background, ${charTag} reveals a comparison split-screen between the slow old way and the instant new trick.`,
        dialogue: 'Purana aur thaka dene wala tareeqa chhorein, yeh latest hack aapke kaam ko lightning fast bana dega!'
      }
    ],
    2: [
      {
        visual: 'Screen capture zooming into the exact menu option and hidden toggle with animated neon cyan arrow pointing directly at it.',
        dialogue: 'Asal problem yeh hai ke software ke andar yeh option default tor par chhipi hoti hai jise log active nahi karte.'
      },
      {
        visual: 'Split screen showing cluttered desktop vs clean isolated workspace with animated red cross over manual repetitive work.',
        dialogue: 'Log manual tareeqe se ek ek step repeat karte hain, jab ke system ke andar one-click shortcut pehle se mojood hai.'
      }
    ],
    3: [
      {
        visual: `${charTag} typing rapid shortcut sequence on backlit mechanical keyboard with soundwave overlay and highlighted keypresses.`,
        dialogue: 'Sab se pehle apne keyboard se targeted shortcut dabayein aur screen par nazar aane wale smart prompt ko open karein.'
      },
      {
        visual: 'Cursor smoothly gliding across settings panel, selecting the optimal configuration profile in real time.',
        dialogue: 'Step one: Main dashboard par ja kar properties open karein aur advanced configuration ko toggle on kar dein.'
      }
    ],
    4: [
      {
        visual: 'Close-up on screen parameter value changing from standard default to maximum optimized turbo mode.',
        dialogue: 'Yahan sab se ahem setting yeh hai ke aapne value ko auto par nahi balke custom optimized limit par set karna hai.'
      },
      {
        visual: 'Glowing cyan brackets framing the specific code snippet and command string executed in lightning speed.',
        dialogue: 'Dusra secret hack: Yeh single command line run karein jo background ke tamam faltu processes ko instant clear karti hai.'
      }
    ],
    5: [
      {
        visual: 'Real-time performance benchmark gauge soaring from red 20% to vibrant emerald green 100% capacity.',
        dialogue: 'Aur yeh dekhein live result! Speed aur efficiency foran double ho gayi aur workflow 100 fisad smooth ban gaya.'
      },
      {
        visual: 'Side-by-side rendering render finish bar popping with celebration particles and green verified shield icon.',
        dialogue: 'Result aapki aankhon ke samne hai! Jo kaam pehle adhay ghante mein hota tha, woh sirf 5 seconds mein complete ho gaya.'
      }
    ],
    6: [
      {
        visual: `${charTag} smiling confidently in studio lighting, pointing toward the IT Cafeteria subscribe button and notification bell.`,
        dialogue: 'Aisi mazeed daily practical tech hacks ke liye IT Cafeteria ko abhi follow karein aur yeh video apne dost ko share karein!'
      },
      {
        visual: `${charTag} giving a firm thumbs up with holographic channel logo and animated bookmark indicator glowing bright cyan.`,
        dialogue: 'Is tip ko foran save karein taake baad mein zaroorat ke waqt kaam aaye, aur channel ko zaroor subscribe karein!'
      }
    ]
  };

  const rewrittenScenes: StoryScene[] = currentStory.scenes.map((oldScene) => {
    const pool = alternativeBeatVariations[oldScene.num] || alternativeBeatVariations[(oldScene.num % 6) + 1] || [];
    const pick = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : { visual: oldScene.visual, dialogue: oldScene.dialogue };

    const rawFreshDialogue = pick.dialogue;
    const freshDialogue = applyPhoneticFixes(rawFreshDialogue);
    const freshVisual = pick.visual;
    const freshScript = `[PRESENTER & ACTION]: ${charTag} ${freshVisual.replace(charTag, '').trim()}.\n[CAMERA & LIGHTING]: Studio 4K, 60fps cinematic key light, cyan accents. Duration: 0-10s.\n[VOICEOVER / DIALOGUE]: "${freshDialogue}"`;
    const wordCount = freshDialogue.split(/\s+/).filter(Boolean).length;

    return {
      ...oldScene,
      words: wordCount,
      visual: freshVisual,
      dialogue: freshDialogue,
      script: freshScript
    };
  });

  return {
    ...currentStory,
    hook: applyPhoneticFixes(freshHook),
    dateLabel: todayLabel,
    thumbnailHeadline: currentStory.thumbnailHeadline || 'SMART TECH TRICK',
    thumbnailSubBadge: chosenAngle.name.toUpperCase(),
    scenes: rewrittenScenes,
    discussionNotes: `Story completely rewritten with angle: "${chosenAngle.name}" on ${todayLabel}. Fresh dialogues, new visual actions, and 100% unique phrasing verified against living phonetic rules dictionary.`
  };
}

/**
 * Rewrites a single scene with brand-new wording, fresh dialogue, and updated visual action.
 */
export function rewriteSingleScene(currentStory: GeneratedStory, sceneNum: number): GeneratedStory {
  const targetScene = currentStory.scenes.find((s) => s.num === sceneNum);
  if (!targetScene) return currentStory;

  const charTag = currentStory.characterTag || '@WM25-1';

  // Fresh alternative dialogues specific to scene purpose
  const freshDialogueOptions = [
    `Notice karein ke is step par zyada tar log confuse ho jate hain, halanke solution nihayat simple aur fast hai!`,
    `Aapne sirf yeh aik setting change karni hai aur background ka poora mechanism automatically optimize ho jayega.`,
    `Yeh technical shortcut aapke ghanton ka kaam seconds mein nipatata hai aur system bilkul clean rehta hai!`,
    `Yahan par ghalti mat karein: Hamesha default value ko switch kar ke manual high-performance mode chunein.`,
    `Result dekhein! Har cheez perfectly align ho chuki hai baghair kisi extra tool ya paid subscription ke.`
  ];

  const freshVisualOptions = [
    `${charTag} gestures toward the dual ultra-wide displays highlighting the glowing green toggle in sharp focus.`,
    `High-angle dynamic camera zooming into mechanical keyboard as shortcut triggers instant UI response.`,
    `Close-up on software interface with futuristic cyan overlay showing real-time optimization processing.`,
    `${charTag} points decisively at the screen benchmark graph surging with vibrant green particles.`
  ];

  const rawDialogue = freshDialogueOptions[Math.floor(Math.random() * freshDialogueOptions.length)];
  const newDialogue = applyPhoneticFixes(rawDialogue);
  const newVisual = freshVisualOptions[Math.floor(Math.random() * freshVisualOptions.length)];
  const words = newDialogue.split(/\s+/).filter(Boolean).length;
  const newScript = `[PRESENTER & ACTION]: ${charTag} ${newVisual.replace(charTag, '').trim()}.\n[CAMERA & LIGHTING]: Studio 4K, 60fps cinematic key light. Duration: 0-10s.\n[VOICEOVER / DIALOGUE]: "${newDialogue}"`;

  const updatedScenes = currentStory.scenes.map((s) => {
    if (s.num === sceneNum) {
      return {
        ...s,
        visual: newVisual,
        dialogue: newDialogue,
        script: newScript,
        words
      };
    }
    return s;
  });

  return {
    ...currentStory,
    scenes: updatedScenes
  };
}
