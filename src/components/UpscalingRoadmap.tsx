import React, { useState } from 'react';
import { 
  Rocket, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  Share2, 
  Volume2, 
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { YT_AUTOMATION_ROADMAP, PHONETIC_DICTIONARY } from '../data/channelData';

export const UpscalingRoadmap: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const enhancements = [
    {
      id: 1,
      title: "Enhancement #1: Shorts-Feed Hook Optimization (9.4% → 40%+ Target)",
      category: "Global / Mechanical",
      priority: "Critical Priority",
      summary: "Algorithm feed mein enter hone ke liye visual pattern interrupts aur curiosity-gap timing ko refine karna.",
      problem: "Abhi 79% views search se aate hain aur sirf 9.4% feed se. Search audience slow scale karti hai; feed audience viral scale karti hai.",
      solution: [
        "Scene 1 ke pehle 1.5 seconds mein verbal introduction ke bajaye 'Visual Shock / Agitation' lagana.",
        "Dialogue formula: 'Direct-hook rule' ko tighten karein taake pehla lafz hi problem ya impossible result ho (e.g. 'Agar aapka PC 2 saal purana hai toh is secret setting ko chhu kar bhi mat dekhna!')",
        "Screen-zoom and sound cue: Flow generation mein anchor pose ke andar pehle 2 second mein ek floating red warning ya sound accent trigger ho."
      ],
      proposedAgentText: `Section 18 Enhancement Proposal:
"Hook scene never opens with greeting. In Shorts Feed optimization, the first 1.5 seconds must feature an immediate visual pattern interrupt (e.g. dramatic screen flash, glowing warning badge, or bold contradiction text) before the character speaks, reducing swipe-away probability below 25%."`
    },
    {
      id: 2,
      title: "Enhancement #2: Series Binge Bridges (Returning Viewers 0.2% → 15%+)",
      category: "Channel-Specific (IT Cafeteria)",
      priority: "Growth Critical",
      summary: "One-off viewers ko subscribers aur recurring daily watchers mein convert karna.",
      problem: "97.2% audience nayi hai aur regular audience sirf 0.2% hai. Log ek tip dekh kar chale jate hain aur channel subscribe nahi karte.",
      solution: [
        "Part-by-Part series (Secrets, PC & Windows Hacks) ke final scene CTA ko 'generic follow' se badal kar 'asset promise' banana.",
        "Formula: 'Is trick ka agla hissa / complete script kal shaam 6 baje aayega, abhi save karein aur notification ON karein taake miss na ho.'",
        "Community Tab & Pinned Comment strategy: Description mein di gayi command ko pinned comment mein dalna aur viewers se feedback mangna."
      ],
      proposedAgentText: `Section 15 CTA Enhancement Proposal:
"In Serial/Part-by-Part mode, the final CTA must not use generic 'subscribe for more' wording. It must explicitly tease the specific tool or outcome of the immediate next part with an exact upload time anchor (e.g. 'Kal shaam 6 baje Part 2 mein main iska advanced fix bataunga...')."`
    },
    {
      id: 3,
      title: "Enhancement #3: Fresh-Chat Tag Rotation Conflict Resolution",
      category: "Global / Mechanical",
      priority: "Architecture Fix",
      summary: "Section 11 vs Section 11.1 ke conflicting notes ko clear karna.",
      problem: "Section 11.1 kehta hai ke fresh chat mein pichli category/tag poocho, jabke Section 11 kehta hai tag automatic rotation se select hoga. Nayi chat mein agent bina pooche @WM25-1 pick kar leta hai.",
      solution: [
        "Nayi chat mein agent Startup Protocol ke foran baad ek single concise prompt mein dono cheezein confirm kare: 'Pichli video mein kaunsi category aur kaunsa character tag use hua tha?'",
        "Agar user bataye (e.g. 'Category 3, @WM25-2'), toh agla auto-select ho jaye (Category 4, @WM25-3).",
        "Agar user bole 'yaad nahi' ya 'nayi session hai', toh Category 1 aur @WM25-1 se clean start le."
      ],
      proposedAgentText: `Section 11 Step 1b & 11.1 Clean Resolution:
"Fresh Chat Rule: Whenever a fresh conversation begins with no prior history in the transcript, the agent asks once: 'Pichli dafa kaunsi category aur tag use hua tha?' If specified, it rotates forward to the next index; if unspecified or unknown, it cleanly defaults to Category 1 and Tag 1."`
    },
    {
      id: 4,
      title: "Enhancement #4: Memory Block Schema Standardization",
      category: "Global / Mechanical",
      priority: "System Refinement",
      summary: "Draft memory block fields ko compact, structured aur 100% duplicate-proof banana.",
      problem: "Draft memory block fields text-based hain aur agar thori wording badal jaye toh agent library search mein miss kar sakta hai.",
      solution: [
        "Memory block mein explicit 'Duplicate Key' (Tool + Feature pair) ko standardize karein (e.g. 'WhatsApp :: pin_messages').",
        "Next part exclusion list ko mandatory banayein taake agli episode mein pehle wale points repeat na hon.",
        "Evening batch paste routine ko automate ya one-click format mein pack karein."
      ],
      proposedAgentText: `Section 19.2 Memory Block Final Schema:
[MEMORY_BLOCK_V3.42]
Date: [DD-Mon-YYYY]
Category_ID: [1-10] | Playlist: [Playlist Name]
Duplicate_Key: [Tool_Name :: Specific_Feature]
Title: [Exact YouTube Title]
Headline_Thumbnail: [Main Headline] | Sub_Banner: [Sub Banner]
Points_Covered: 1. [Point 1] | 2. [Point 2] | 3. [Point 3]
Excluded_For_Next_Part: [What was intentionally left for Part N+1]
Scenes_Count: [10-15] | Status: Produced
[/MEMORY_BLOCK_V3.42]`
    },
    {
      id: 5,
      title: "Enhancement #5: YT Automation Course Chapter 11 Production Blueprint",
      category: "Course / Long-Form (16:9)",
      priority: "Immediate Next Action",
      summary: "Roadmap ke Chapter 11 'B-Roll Mastery & Generative AI Visuals' ki execution.",
      problem: "Chapters 1 to 10 successfully complete ho chuke hain. Chapter 11 agla step hai aur iske liye high-fidelity visuals aur AI generation comparison chahiye.",
      solution: [
        "Tools to cover: Midjourney v6.1, Runway Gen-3, Pika 2.0, aur OpenAI Sora / Luma Dream Machine.",
        "Structure (16:9 wide lecture): Hook -> Why Faceless channels fail with stock photos -> Prompt formulas for cinematic AI B-Roll -> Camera motion tokens -> Assembly inside CapCut.",
        "Production parts: 10-12 scenes per part under Section 9.2 Lecture Series format."
      ],
      proposedAgentText: `Chapter 11 Ready Proposition:
Roadmap status updated in Channel_Insights.md section 9. Ready to generate Chapter 11 in 16:9 format with @WM25-4 or @WM25-5 rotation.`
    },
    {
      id: 6,
      title: "Enhancement #6: Script Word-Count Pacing Engine (~22-25 words)",
      category: "Global / Mechanical",
      priority: "Voice Engine Polish",
      summary: "Google Flow mein voice hallucinations aur dead silence gaps ko khatam karna.",
      problem: "Agar dialogue 9 second se kam ho, toh Omni Flash khud se extra alfaaz bol deta hai ya ajeeb facial movements karta hai.",
      solution: [
        "Har scene ke script block mein strict 22–25 words Roman Urdu count maintain karna.",
        "Anti-repetition line aur voice line ke sath trailing silence instruction ensure karna: 'stays silent after the final word'.",
        "Phonetic living list ke tamam rules automatically apply hon."
      ],
      proposedAgentText: `Section 6.3 Metric Enforcement:
"Pacing Meter: Exact 2.7 words/second benchmark. Dialogue lines must strictly measure 22 to 25 words in Roman Urdu for a 10-second scene window to avoid Flow generating phantom audio."`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                <Rocket className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Agent Upscaling & Channel Growth Blueprint (v3.42+)
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Multi_Channel_Content_Agent.md (v3.41) pehle se bohot mazboot hai. Isko mazeed up-scale karne ke liye 6 practical aur targeted enhancements identify kiye gaye hain jo channel ko search-heavy se algorithmic viral-feed par le kar jayenge.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-mono font-medium">
              Target Version: v3.42
            </span>
          </div>
        </div>
      </div>

      {/* Enhancements Accordion List */}
      <div className="space-y-4">
        {enhancements.map((enh) => {
          const isExpanded = expandedSection === enh.id;
          return (
            <div 
              key={enh.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700"
            >
              <button
                onClick={() => toggleSection(enh.id)}
                className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      {enh.category}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      enh.priority.includes('Critical') 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {enh.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {enh.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {enh.summary}
                  </p>
                </div>
                <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs">
                  {/* Problem & Solution Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Current Bottleneck / Masla:
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {enh.problem}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Proposed Upscale Solution:
                      </div>
                      <ul className="space-y-1.5 text-slate-300">
                        {enh.solution.map((sol, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 shrink-0">•</span>
                            <span>{sol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Proposed Exact Agent Wording */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Proposed Agent File Wording (For User Approval Before Editing):
                    </span>
                    <pre className="p-3 bg-slate-950 rounded-xl border border-blue-500/20 text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                      {enh.proposedAgentText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next Up: Chapter 11 Planner Card */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/40 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-mono font-semibold">
                YT Automation Roadmap Progress
              </span>
              <span className="text-xs text-slate-400">Chapters 1–10 Covered (100%)</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Next Chapter in Queue: Chapter 11 — B-Roll Mastery & Generative AI Visuals
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Aspect ratio 16:9 Lecture format. Midjourney, Runway Gen-3, Pika 2.0, aur cinematic camera prompts ke zariye faceless channels ke visual retention ko scale karna.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center shrink-0">
            <div className="text-[11px] text-slate-400">Format</div>
            <div className="text-base font-bold text-cyan-400">16:9 Wide</div>
            <div className="text-[10px] text-emerald-400">Section 9.2 Standard</div>
          </div>
        </div>
      </div>
    </div>
  );
};
