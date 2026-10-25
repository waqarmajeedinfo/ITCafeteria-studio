import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  Layers, 
  Database,
  CheckCircle2,
  Play,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { CHANNEL_PROFILES, type ChannelProfile } from '../data/channelData';
import {
  AgentFlowScreen,
  type AgentMemoryRecord,
  type AgentTriggerOutcome,
  type AgentTriggerSelection
} from './AgentFlowScreen';

export const AgentSimulator: React.FC = () => {
  const [draftChannel, setDraftChannel] = useState<ChannelProfile['id']>('itcafeteria');
  const [draftTag, setDraftTag] = useState<string>(CHANNEL_PROFILES.itcafeteria.defaultTag);
  const [draftCategory, setDraftCategory] = useState<number>(CHANNEL_PROFILES.itcafeteria.defaultCategoryId);
  const [draftSceneCount, setDraftSceneCount] = useState<number>(CHANNEL_PROFILES.itcafeteria.defaultSceneCount);
  const [appliedSelection, setAppliedSelection] = useState<AgentTriggerSelection | null>(null);
  const [triggerOutcome, setTriggerOutcome] = useState<AgentTriggerOutcome | null>(null);
  const [memoryRecords, setMemoryRecords] = useState<AgentMemoryRecord[]>([]);
  const [flowOpen, setFlowOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPackage, setCopiedPackage] = useState<boolean>(false);

  const draftProfile = CHANNEL_PROFILES[draftChannel];
  const draftCategoryMeta = draftProfile.categories.find((cat) => cat.id === draftCategory) ?? draftProfile.categories[0];
  const appliedProfile = appliedSelection ? CHANNEL_PROFILES[appliedSelection.channelId] : null;
  const appliedCategory = appliedSelection && appliedProfile
    ? appliedProfile.categories.find((cat) => cat.id === appliedSelection.categoryId) ?? appliedProfile.categories[0]
    : null;

  const pendingChanges = !appliedSelection ||
    draftChannel !== appliedSelection.channelId ||
    draftTag !== appliedSelection.tag ||
    draftCategory !== appliedSelection.categoryId ||
    draftSceneCount !== appliedSelection.sceneCount;

  const appliedNote = appliedProfile && appliedCategory
    ? appliedProfile.sampleNotes[appliedSelection!.categoryId] ?? { title: appliedCategory.name, hook: 'Reveal' }
    : null;
  const decisionTitle = triggerOutcome?.title || appliedNote?.title || 'Trigger dabayein';
  const decisionHook = triggerOutcome?.hook || appliedNote?.hook || 'Pending';

  const handleDraftChannelChange = (channelId: ChannelProfile['id']) => {
    const nextProfile = CHANNEL_PROFILES[channelId];
    setDraftChannel(channelId);
    setDraftTag(nextProfile.defaultTag);
    setDraftCategory(nextProfile.defaultCategoryId);
    setDraftSceneCount(nextProfile.defaultSceneCount);
  };

  const handleTrigger = () => {
    setAppliedSelection({
      channelId: draftChannel,
      tag: draftTag,
      categoryId: draftCategory,
      sceneCount: draftSceneCount
    });
    setTriggerOutcome(null);
    setFlowOpen(true);
  };

  const handleFlowOutcome = (outcome: AgentTriggerOutcome) => {
    setTriggerOutcome(outcome);
    if (outcome.status === 'generated') {
      setMemoryRecords((records) => {
        const exists = records.some((record) =>
          record.channelId === outcome.selection.channelId &&
          record.title.toLowerCase() === outcome.title.toLowerCase()
        );
        if (exists) return records;
        const outcomeProfile = CHANNEL_PROFILES[outcome.selection.channelId];
        const outcomeCategory = outcomeProfile.categories.find((cat) => cat.id === outcome.selection.categoryId);
        return [...records, {
          id: `MEM-${Date.now()}`,
          channelId: outcome.selection.channelId,
          title: outcome.title,
          tool: outcome.topic?.trim() || outcome.title,
          points: outcome.discussionNotes?.trim() || `Category: ${outcomeCategory?.name ?? outcomeProfile.niche}`,
          source: 'Trigger Flow Memory'
        }];
      });
    }
  };

  const sampleTag = CHANNEL_PROFILES.itcafeteria.defaultTag;

  // Sample Generated Scenes adhering to Section 19 of v3.41
  const sampleScenes = [
    {
      num: 1,
      duration: '10s',
      purpose: 'Hook',
      isCTA: false,
      words: 24,
      script: `${sampleTag} sits at the desk, looking directly at the camera with calm-confident focus, both hands resting on the desk for the opening 0.5-second anchor pose. In the center window, he gestures outward with an open palm toward the viewer as a glowing red warning overlay appears above the desk. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in an intriguing, confident tone: "Kya aapka laptop ak-sr bina wajah slow ho jata hai? Yeh aik single Windows setting aapka ghanton ka waq-t bachaye gi!" He returns to the exact resting anchor pose at the final 0.5 second.`
    },
    {
      num: 2,
      duration: '10s',
      purpose: 'Problem',
      isCTA: false,
      words: 23,
      script: `${sampleTag} sits at the desk, leaning slightly forward with an empathetic expression. A floating graphic showing a full red C-Drive appears on the back wall. He gestures toward the back wall visual as he explains the frustration of hidden junk files accumulating over months. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in an empathetic, relatable tone: "Har baar C-drive laal ho jati hai aur samajh nahi aati ke konsi bekaar files delete karni hain, theek hai na?" He settles smoothly into the closing anchor pose.`
    },
    {
      num: 3,
      duration: '10s',
      purpose: 'Agitate',
      isCTA: false,
      words: 24,
      script: `${sampleTag} remains seated, camera smoothly pushes in slightly. On the screen to his right, multiple background app cache windows flicker rapidly. He shakes his head gently, explaining how manual cleaning wastes precious hours. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in a thoughtful, concerned tone: "Manual cleaning mein ghanton lagte hain aur ghalti se zaroori file delete hone ka Fikr rehta hai, jo bilkul theek tareeqa nahi." He returns to the resting anchor pose.`
    },
    {
      num: 4,
      duration: '10s',
      purpose: 'Reveal',
      isCTA: false,
      words: 23,
      script: `${sampleTag} sits at the desk, smiling with renewed confidence. The glowing icon of Windows Storage Sense animates cleanly in front of his chest below chin level. He points toward the icon with his right hand. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in a warm, reassuring tone: "Iska aik automatic solution maujood hai Windows ke andar, jiska naam hai Storage Sense, aur yeh for-rn kaam shuru karta hai." He holds the anchor pose at the end.`
    },
    {
      num: 5,
      duration: '10s',
      purpose: 'Demonstrate: Settings Walkthrough',
      isCTA: false,
      words: 24,
      script: `The camera cuts to a full-screen zoomed recording of the Windows 11 Settings window. The cursor visibly moves to System, then smoothly clicks on Storage, highlighting the toggle button with a cyan pulse glow. ${sampleTag}'s voice continues smoothly in voiceover. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in a calm, clear tone: "Sab se pehle Settings open karein, System mein ja kar Storage par click karein aur yahan Storage Sense ko on kar dein." The screen recording holds on the toggle.`
    },
    {
      num: 6,
      duration: '10s',
      purpose: 'Demonstrate: Configuration',
      isCTA: false,
      words: 24,
      script: `Full-screen view of the Storage Sense configuration menu. The cursor clicks on the dropdown for Automatic User Content Cleanup and selects 'Every Week', followed by setting Recycle Bin cleanup to 14 days. ${sampleTag}'s voice guides the action. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in an instructive, clear tone: "Yahan schedule ko weekly par set karein taake temp files aur recycle bin ka kachra auto delete hota rahe bina kisi rukawat ke." The cursor highlights the selected days.`
    },
    {
      num: 7,
      duration: '10s',
      purpose: 'Proof / Result',
      isCTA: false,
      words: 23,
      script: `Full-screen screen recording showing the Storage Cleanup bar clearing 15.4 GB of temporary files in real-time, the drive space bar turning from deep red to healthy blue. ${sampleTag}'s voice narration continues. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in a delighted, confident tone: "Yeh dekhein, aik click par 15 G-B space for-rn aazad ho gayi aur laptop ki speed mein wazeh farq parra hai." The space bar settles into clear blue.`
    },
    {
      num: 8,
      duration: '10s',
      purpose: 'Benefit & Command mention',
      isCTA: false,
      words: 25,
      script: `${sampleTag} reappears at the desk in medium shot, anchor pose matching Scene 4. He rests one hand on the desk and gestures with the other toward the side display. He mentions the exact steps are saved below. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in an encouraging, helpful tone: "Aapko ab kabhi manual temp files dhoondne ki zaroorat nahi parre gi, mukammal steps aur shortcut details niche description mein maujood hain." He settles smoothly into the anchor pose.`
    },
    {
      num: 9,
      duration: '10s',
      purpose: 'Curiosity Loop & Series Continuation',
      isCTA: false,
      words: 24,
      script: `${sampleTag} sits at the desk, leaning in slightly with an engaging smile. A floating preview icon for the next episode's CMD cleanmgr command appears on the side screen. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in an inviting, curious tone: "Agli video mein main Windows ka aik aesa secret command bataunga jo corrupted system files ko secondon mein repair karta hai." He returns to the resting anchor pose.`
    },
    {
      num: 10,
      duration: '10s',
      purpose: 'Conclusion & Save CTA',
      isCTA: true,
      words: 24,
      script: `${sampleTag} sits at the desk in the opening anchor pose, smiling warmly at the camera. He gives a purposeful thumbs-up and pointing gesture toward the screen's save bookmark icon. He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace. No word or syllable is repeated. He says, in a warm, inviting tone: "Is video ko abhi save kar lein taake baad mein dhoondna na parre, aur aese practical tricks ke liye IT Cafeteria ko follow karein!" He returns to the exact resting anchor pose at the 0.5-second finish.`
    }
  ];

  const copyScene = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyFullPackage = () => {
    const pkgText = `Category: 4 — PC & Windows Hacks | Playlist: PC & Windows Hacks
Title: Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds! #ITCafeteria #Shorts #Windows11
Description:
Agar aapka PC ya laptop ak-sr slow ho jata hai ya C-drive laal rehti hai, toh yeh simple Windows 11 setting aapka ghanton ka waq-t bachaye gi. Is video mein humne Windows Storage Sense ka practical setup dikhaya hai jo bekaar temporary cache aur junk files ko automatically clean karta hai.

PRACTICAL STEPS / COMMANDS:
1. Press Win + I to open Windows Settings.
2. Go to System -> Storage.
3. Toggle "Storage Sense" to ON.
4. Click on Storage Sense to configure schedule: Set "Run Storage Sense" to Every Week.
5. Set Delete files in Recycle Bin to 14 days and Downloaded files to Never.
6. Click "Run Storage Sense now" to free up GBs instantly.

Tags:
windows 11 tricks, windows storage sense, how to clean c drive, slow pc fix windows 11, laptop speed booster, delete temp files windows, free up c drive space, computer tips and tricks, windows hidden features, it cafeteria shorts, waqar majeed windows, auto clean pc, windows 11 optimization, pc performance boost

TikTok Block:
Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!
#ITCafeteria #Shorts #Windows11 #PCTips #TechTok #WindowsHacks #LaptopSlow #PakistanTech

Thumbnail Prompt:
Create a YouTube thumbnail using the attached reference image for the character's face and identity — character name: Waqar Majeed. Channel: IT Cafeteria (tagline: Learn • Build • Grow). Story context: Windows 11 Storage Sense auto cleanup trick to free up GBs of red C-drive space without manual effort. Follow the Universal Thumbnail Template (Section 19.1.2) zone structure: Dark navy backdrop with neon-blue edge glow and vibrant swirling cyan energy-vortex. Hero headline: "STORAGE SENSE". Sub-banner: "Auto Clean PC" on bright yellow brush stroke. Floating glowing 3D hologram showing a Windows drive icon turning from red to glowing blue with sparkle particles. Side badges: "15GB Free ✓", "No Code ✓". Character positioned lower-left angled towards camera pointing toward the central hologram with confident delighted expression. Branded mug and laptop on desk. Visual finish: rich shine and sparkle particles, strong saturation and contrast. Aspect ratio: 9:16.

Memory Block (v3.41):
Tareekh: 24 Oct 2026
Title: Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!
Category / Playlist: 4 — PC & Windows Hacks | Playlist: PC & Windows Hacks
Tool / topic: Windows 11 Storage Sense
Thumbnail headline: STORAGE SENSE (Sub-banner: Auto Clean PC)
Points cover hue: (1) Storage Sense toggle activation; (2) Weekly cleanup schedule configuration; (3) Recycle bin 14-day retention rule; (4) Immediate 15GB cache release test
Duplicate key: Windows + Storage Sense auto clean
Series / Part: PC & Windows Hacks (Part 3) — Agle part mein cleanmgr / DISM repair cover hogi
Is dafa chhoda gaya: CMD cipher wipe aur dism restore-health commands
Length: 10 scenes (100s)
Status: bani`;

    navigator.clipboard.writeText(pkgText);
    setCopiedPackage(true);
    setTimeout(() => setCopiedPackage(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Multi-Channel Content Agent Studio (v3.41 Engine)</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Active Baseline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Google Flow (Gemini Omni Flash) paste-ready scripts with exact Section 19 format and phonetic discipline
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
              pendingChanges
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {!appliedSelection ? 'Not triggered yet' : pendingChanges ? 'Pending changes — Trigger dabayein' : 'Selections processed'}
            </span>
            <button 
              onClick={handleTrigger}
              title="Duplicate check chalayein aur selected category ke mutabiq story package generate karein"
              className="px-4 py-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Trigger
            </button>
          </div>
        </div>

        {/* Startup Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          {/* Channel */}
          <div>
            <label className="text-slate-400 block mb-1">Active Channel (Q1)</label>
            <select 
              value={draftChannel}
              onChange={(e) => handleDraftChannelChange(e.target.value as ChannelProfile['id'])}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="itcafeteria">1. IT Cafeteria (Waqar Majeed)</option>
              <option value="beautyhub">2. Beauty Hub (Mehr Zadi)</option>
            </select>
          </div>

          {/* Character Tag */}
          <div>
            <label className="text-slate-400 block mb-1">Character Tag Variant (Q3)</label>
            <select 
              value={draftTag}
              onChange={(e) => setDraftTag(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {draftProfile.tags.map((tag) => (
                <option key={tag.value} value={tag.value}>{tag.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-400 block mb-1">Category & Playlist (Section 9)</label>
            <select 
              value={draftCategory}
              onChange={(e) => setDraftCategory(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              {draftProfile.categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.id}. {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scene Count */}
          <div>
            <label className="text-slate-400 block mb-1">Duration & Scenes (Sec 12)</label>
            <select 
              value={draftSceneCount}
              onChange={(e) => setDraftSceneCount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
            >
              {draftProfile.durations.map((duration) => (
                <option key={duration.value} value={duration.value}>{duration.label}</option>
              ))}
            </select>
          </div>
        </div>

        {draftCategoryMeta.id === 10 && (
          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-200">
            Category 10 — Search: Trigger ke baad flow screen topic aur discussion notes poochega, phir <strong>Generate Story</strong> button se package banega.
          </div>
        )}

        {/* Trigger Decision Note (Step 4b) */}
        <div className={`mt-4 p-3 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs ${
          triggerOutcome?.status === 'duplicate'
            ? 'bg-rose-950/30 border-rose-500/30'
            : triggerOutcome?.status === 'generated'
            ? 'bg-emerald-950/20 border-emerald-500/25'
            : 'bg-blue-950/40 border-blue-500/20'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-cyan-300 font-mono">Decision Note (Step 4b):</span>
            {!appliedSelection ? (
              <span className="text-slate-300">Title: "Trigger dabayein" | Hook: Pending | Confidence: Pending</span>
            ) : triggerOutcome?.status === 'duplicate' ? (
              <span className="text-rose-100">Title: "{decisionTitle}" | Hook: {decisionHook} | Confidence: Blocked</span>
            ) : triggerOutcome?.status === 'generated' ? (
              <span className="text-emerald-100">Title: "{decisionTitle}" | Hook: {decisionHook} | Confidence: High</span>
            ) : triggerOutcome?.status === 'topic-pending' ? (
              <span className="text-amber-100">Topic pending — flow screen mein Search topic likhein | Confidence: Pending</span>
            ) : (
              <span className="text-slate-200">
                {flowOpen ? 'Duplicate check + story package generation chal raha hai...' : 'Flow band hua — dobara Trigger dabayein.'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {appliedProfile && appliedCategory && (
              <span className="px-2 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700 rounded text-[11px] font-mono">
                {appliedProfile.name} • {appliedCategory.id}. {appliedCategory.name}
              </span>
            )}
            {!appliedSelection ? (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[11px] font-medium">
                Duplicate Check: Pending
              </span>
            ) : triggerOutcome?.status === 'duplicate' ? (
              <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Duplicate: {triggerOutcome.duplicates.length} match
              </span>
            ) : triggerOutcome?.status === 'generated' ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Duplicate Check: Naya (Passed)
              </span>
            ) : triggerOutcome?.status === 'topic-pending' ? (
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium">
                Topic pending
              </span>
            ) : flowOpen ? (
              <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[11px] font-medium">
                Not completed
              </span>
            )}
            <span className="text-slate-400 text-[11px]">Memory: {memoryRecords.length}</span>
            <span className="text-slate-400 text-[11px]">Credits: ~120-150</span>
          </div>
        </div>
      </div>

      {/* Generated Story Proposition Header & Reference Line */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-2.5 text-[11px] text-slate-300">
          Neeche wala full story package ek fixed <strong className="text-white">IT Cafeteria (Category 4)</strong> reference sample hai. Aapke dropdown selections aur generated package upar <strong className="text-cyan-300">Trigger</strong> flow screen mein process hote hain.
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400">
              <span>Category: 4 — PC & Windows Hacks | Playlist: PC & Windows Hacks</span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-sans">
                Reference Sample • IT Cafeteria
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Aspect Ratio: 9:16 Short</span>
              <span>•</span>
              <span>Presenter: {sampleTag}</span>
              <span>•</span>
              <span>Duration: 100 seconds (10 scenes)</span>
              <span>•</span>
              <span>Format: Extended 7-Beat with Screen-Zoom</span>
            </div>
          </div>

          <button 
            onClick={copyFullPackage}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 hover:opacity-90 transition-opacity"
          >
            {copiedPackage ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Copied Full Upload Package!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Reference Sample Package
              </>
            )}
          </button>
        </div>

        {/* Scene List - Consolidated without pagination */}
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>All Scenes (Self-Contained • Multi-Profile Paste Ready)</span>
            <span className="text-[11px] text-cyan-400 font-normal">Section 19 Format: 1 Header Line + 1 Label Line + Paste Script</span>
          </div>

          <div className="space-y-3">
            {sampleScenes.slice(0, 10).map((scene) => (
              <div 
                key={scene.num}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors relative group"
              >
                {/* Scene Header Line */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Scene {scene.num} — {scene.duration} [{scene.purpose}]{scene.isCTA ? ' — CTA' : ''}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({scene.words} words • ~2.7 w/s)
                    </span>
                  </div>
                  <button 
                    onClick={() => copyScene(scene.script, scene.num)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                  >
                    {copiedIndex === scene.num ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Scene for Flow
                      </>
                    )}
                  </button>
                </div>

                {/* Fixed Label Line */}
                <div className="text-[11px] text-blue-400/80 font-mono mb-1.5">
                  Flow — Copy-Paste Script
                </div>

                {/* Clean Copy-Paste Script Block */}
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800/60 selection:bg-blue-600 selection:text-white">
                  {scene.script}
                </p>

                {/* Phonetic & Compliance Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5 text-[10px]">
                  <span className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 rounded">
                    ✓ Anchor Pose 0.5s Included
                  </span>
                  <span className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 rounded">
                    ✓ Voice & Anti-Repetition Line Active
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded">
                    ✓ Roman Urdu Phonetics Validated
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post-Story Trigger: 5 Items + Memory Block */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Post-Story Upload Package (Exactly 5 Items + Memory Block)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Reference line included at top</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Item 1: Title */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Item 1: YouTube Title + 3 Hashtags</span>
              <p className="text-white font-medium">
                Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds! #ITCafeteria #Shorts #Windows11
              </p>
              <span className="text-[10px] text-cyan-400 font-mono">Visible window: 57 characters (No truncation)</span>
            </div>

            {/* Item 3: Tags */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Item 3: YouTube Tags (~500 Char Budget)</span>
              <p className="text-slate-300 font-mono text-[11px] line-clamp-3">
                windows 11 tricks, windows storage sense, how to clean c drive, slow pc fix windows 11, laptop speed booster, delete temp files windows, free up c drive space, computer tips and tricks, windows hidden features, it cafeteria shorts, waqar majeed windows, auto clean pc, windows 11 optimization, pc performance boost
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">Budget: 462 / 500 characters utilized</span>
            </div>

            {/* Item 4: TikTok Block */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Item 4: TikTok Combined Block (1-Click Paste)</span>
              <p className="text-slate-200">
                Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!
              </p>
              <p className="text-cyan-400 font-mono text-[11px]">
                #ITCafeteria #Shorts #Windows11 #PCTips #TechTok #WindowsHacks #LaptopSlow #PakistanTech
              </p>
            </div>

            {/* Item 5: Thumbnail Prompt */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Item 5: Thumbnail Prompt (Universal Template)</span>
              <p className="text-slate-300 font-mono text-[11px] line-clamp-3">
                Create a YouTube thumbnail using the attached reference image for the character's face and identity — character name: Waqar Majeed. Channel: IT Cafeteria... Headline: "STORAGE SENSE". Sub-banner: "Auto Clean PC"...
              </p>
              <span className="text-[10px] text-cyan-400 font-mono">Zones 1-13 applied in prose • No leaking numbers</span>
            </div>
          </div>

          {/* Item 2: Detailed Description with Practical Commands */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Item 2: Description (With Mandatory "PRACTICAL STEPS / COMMANDS" Section)
            </span>
            <div className="p-3 bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px] space-y-2 whitespace-pre-wrap">
{`Agar aapka PC ya laptop ak-sr slow ho jata hai ya C-drive laal rehti hai, toh yeh simple Windows 11 setting aapka ghanton ka waq-t bachaye gi. Is video mein humne Windows Storage Sense ka practical setup dikhaya hai jo bekaar temporary cache aur junk files ko automatically clean karta hai.

PRACTICAL STEPS / COMMANDS:
1. Press Win + I to open Windows Settings.
2. Go to System -> Storage.
3. Toggle "Storage Sense" to ON.
4. Click on Storage Sense to configure schedule: Set "Run Storage Sense" to Every Week.
5. Set Delete files in Recycle Bin to 14 days and Downloaded files to Never.
6. Click "Run Storage Sense now" to free up GBs instantly.`}
            </div>
          </div>

          {/* Section 12 Memory Block (v3.41 Draft) */}
          <div className="bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-500/30 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Memory Block (v3.41 — Save in Notepad / Word for Evening Routine)
              </span>
              <span className="text-[10px] text-slate-400">Label only • Not pasted to YouTube</span>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-lg text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
{`Tareekh: 24 Oct 2026
Title: Windows 11 Hidden Trick: Auto Clean Temp Files in Seconds!
Category / Playlist: 4 — PC & Windows Hacks | Playlist: PC & Windows Hacks
Tool / topic: Windows 11 Storage Sense
Thumbnail headline: STORAGE SENSE (Sub-banner: Auto Clean PC)
Points cover hue: (1) Storage Sense toggle activation; (2) Weekly cleanup schedule configuration; (3) Recycle bin 14-day retention rule; (4) Immediate 15GB cache release test
Duplicate key: Windows + Storage Sense auto clean
Series / Part: PC & Windows Hacks (Part 3) — Agle part mein cleanmgr / DISM repair cover hogi
Is dafa chhoda gaya: CMD cipher wipe aur dism restore-health commands
Length: 10 scenes (100s)
Status: bani`}
            </div>
          </div>
        </div>
      </div>

      {flowOpen && appliedSelection && (
        <AgentFlowScreen
          profile={CHANNEL_PROFILES[appliedSelection.channelId]}
          selection={appliedSelection}
          memoryRecords={memoryRecords}
          onClose={() => setFlowOpen(false)}
          onOutcome={handleFlowOutcome}
        />
      )}
    </div>
  );
};
