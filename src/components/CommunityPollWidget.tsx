import React, { useState } from 'react';
import { 
  Vote, 
  Sparkles, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Eye, 
  Youtube, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Share2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { CATEGORIES_IT_CAFETERIA, PUBLISHED_VIDEOS } from '../data/channelData';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface CommunityPoll {
  id: string;
  question: string;
  options: PollOption[];
  relatedTopic: string;
  targetSlot: string;
  alignmentScore: number;
  whyItConverts: string;
  isPopular?: boolean;
}

export const CommunityPollWidget: React.FC = () => {
  // Pre-configured High-Conversion Community Polls based on IT Cafeteria topics
  const initialPolls: CommunityPoll[] = [
    {
      id: 'poll-1',
      question: 'Agar aapka laptop ya PC achanak bohot slow ho jaye, to aap pehle kya karte hain?',
      options: [
        { id: 'opt-1', text: 'Task Manager / Restart (Classic fix)', votes: 48 },
        { id: 'opt-2', text: 'Temp files delete karte hain (%temp%)', votes: 32 },
        { id: 'opt-3', text: 'Third-party cleaner software use karte hain', votes: 12 },
        { id: 'opt-4', text: 'Windows reinstall kar dete hain seedha!', votes: 8 }
      ],
      relatedTopic: 'Windows 11 Hidden Trick: Auto Clean Temp Files',
      targetSlot: '4:00 PM PKT (2h before 6:00 PM upload)',
      alignmentScore: 98,
      whyItConverts: 'Primes audience for the 6:00 PM Windows cleanup Short. Viewers who vote get the Short recommended directly in their feed!',
      isPopular: true
    },
    {
      id: 'poll-2',
      question: 'Daily office kaam ya study ke liye aapka sab se zyada time kis par zaya hota hai?',
      options: [
        { id: 'opt-1', text: 'Excel formulas aur data formatting par', votes: 54 },
        { id: 'opt-2', text: 'Emails aur reports type karne par', votes: 24 },
        { id: 'opt-3', text: 'Files aur receipts scan karne par', votes: 14 },
        { id: 'opt-4', text: 'Sab AI automate kar deta hai!', votes: 8 }
      ],
      relatedTopic: 'Power Automate & Google Sheets Smart Fill',
      targetSlot: '3:30 PM PKT (Desktop office rush)',
      alignmentScore: 94,
      whyItConverts: 'Directly speaks to 29.1% Desktop users in Lahore & India. Captures high comment engagement and debate.',
      isPopular: false
    },
    {
      id: 'poll-3',
      question: 'ChatGPT ka Voice Mode ab Urdu samajhta hai! Kiya aapne try kiya?',
      options: [
        { id: 'opt-1', text: 'Haan, bohot natural accent hai!', votes: 42 },
        { id: 'opt-2', text: 'Pata nahi tha, kese enable karein?', votes: 38 },
        { id: 'opt-3', text: 'Main sirf English mein use karta hoon', votes: 15 },
        { id: 'opt-4', text: 'Voice mode use hi nahi karta', votes: 5 }
      ],
      relatedTopic: 'ChatGPT Voice Mode Pakistani Accent & Loop Trick',
      targetSlot: '5:00 PM PKT (AI evening curiosity)',
      alignmentScore: 96,
      whyItConverts: 'Taps into channel’s #1 viral retention topic (104.7% loop). Option 2 forces curiosity clicks to watch the video!',
      isPopular: true
    }
  ];

  const [polls, setPolls] = useState<CommunityPoll[]>(initialPolls);
  const [selectedPoll, setSelectedPoll] = useState<CommunityPoll>(initialPolls[0]);

  // Draft form states
  const [draftQuestion, setDraftQuestion] = useState(initialPolls[0].question);
  const [draftOptions, setDraftOptions] = useState<string[]>(initialPolls[0].options.map(o => o.text));
  const [draftTopic, setDraftTopic] = useState(initialPolls[0].relatedTopic);
  const [draftSlot, setDraftSlot] = useState(initialPolls[0].targetSlot);
  
  // Interactive Poll Simulation States
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Switch active poll into editor
  const handleSelectPoll = (poll: CommunityPoll) => {
    setSelectedPoll(poll);
    setDraftQuestion(poll.question);
    setDraftOptions(poll.options.map(o => o.text));
    setDraftTopic(poll.relatedTopic);
    setDraftSlot(poll.targetSlot);
    setUserVotedOptionId(null);
  };

  // Option handlers
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...draftOptions];
    updated[index] = value;
    setDraftOptions(updated);
  };

  const handleAddOption = () => {
    if (draftOptions.length < 4) {
      setDraftOptions([...draftOptions, `Option ${draftOptions.length + 1}`]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (draftOptions.length > 2) {
      setDraftOptions(draftOptions.filter((_, i) => i !== index));
    }
  };

  // AI Poll Generation
  const handleGenerateAiPoll = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const generated: CommunityPoll = {
        id: `poll-${Date.now()}`,
        question: 'Google Sheets vs Microsoft Excel: Formula likhne mein aapko kaunsa zyada asaan lagta hai?',
        options: [
          { id: 'opt-1', text: 'Google Sheets (Smart Fill AI ki wajah se)', votes: 45 },
          { id: 'opt-2', text: 'Excel (Bohot powerful shortcuts hain)', votes: 40 },
          { id: 'opt-3', text: 'Dono mein formula yaad nahi rehte!', votes: 12 },
          { id: 'opt-4', text: 'Main ChatGPT se formula banwata hoon', votes: 3 }
        ],
        relatedTopic: 'Google Sheets Smart Fill AI Trick (Category F)',
        targetSlot: '4:00 PM PKT (Pre-Upload Prime)',
        alignmentScore: 97,
        whyItConverts: 'Creates natural debate between Excel & Sheets fans, solving the 0.2% returning viewer rate by converting voters into subscribers.',
        isPopular: true
      };

      setPolls([generated, ...polls]);
      handleSelectPoll(generated);
      setIsGeneratingAi(false);
    }, 700);
  };

  // Copy Poll to Clipboard formatted for YouTube Studio
  const handleCopyPoll = () => {
    const pollText = `=== YOUTUBE COMMUNITY TAB POLL ===\n\nQUESTION:\n${draftQuestion}\n\nOPTIONS:\n${draftOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nSTRATEGY:\nPost this poll at ${draftSlot} (2 hours before Short release).`;
    navigator.clipboard.writeText(pollText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Calculate vote percentage in simulation
  const totalVotes = selectedPoll.options.reduce((acc, opt) => acc + opt.votes, 0) + (userVotedOptionId ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950/50 via-slate-900 to-indigo-950/60 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Vote className="w-3.5 h-3.5 text-red-400" /> Returning Viewer Activator
              </span>
              <span className="text-xs text-slate-400 font-mono">Algorithm Growth Multiplier</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              YouTube Community Poll Studio
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Community Tab polls YouTube Home Feed par non-subscribers ko bhi dikhte hain! Apne upcoming video topics ke mutabiq viral poll draft karein taake 0.2% returning viewers ka bottleneck solve ho sake.
            </p>
          </div>

          <button
            onClick={handleGenerateAiPoll}
            disabled={isGeneratingAi}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'Generating AI Poll...' : 'Generate Viral AI Poll'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Drafter & YouTube Preview Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Poll Drafter & Templates (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Poll Drafter Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Poll Question & Options Drafter</h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                YouTube Community Spec
              </span>
            </div>

            {/* Question Input */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5 flex justify-between">
                <span>Community Poll Question (Roman Urdu + English)</span>
                <span className="text-[10px] text-slate-400 font-mono">{draftQuestion.length} / 120 chars</span>
              </label>
              <textarea
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                rows={2}
                placeholder="Ask an engaging pain-point or curiosity question..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Poll Options (2 to 4) */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300 font-medium">Poll Choices (Max 4 Options)</label>
                {draftOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Choice
                  </button>
                )}
              </div>

              {draftOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Choice ${idx + 1}...`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                  />
                  {draftOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Choice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Topic Alignment & Priming Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Aligned Video Topic</label>
                <input
                  type="text"
                  value={draftTopic}
                  onChange={(e) => setDraftTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Publishing Time</label>
                <input
                  type="text"
                  value={draftSlot}
                  onChange={(e) => setDraftSlot(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={handleCopyPoll}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Poll Copied for YouTube!' : 'Copy Poll for YouTube Studio'}</span>
              </button>

              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Post 2h before video release
              </span>
            </div>
          </div>

          {/* High-Converting Pre-Configured Poll Library */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Curated Community Poll Templates ({polls.length})
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {polls.map((p) => {
                const isSelected = selectedPoll.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPoll(p)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                            {p.relatedTopic}
                          </span>
                          {p.isPopular && (
                            <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                              High Viral Potential
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-white text-xs sm:text-sm">{p.question}</h5>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-400 font-mono">{p.alignmentScore}% Match</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>{p.options.length} Poll Choices</span>
                      <span className="text-slate-300 font-mono">⏰ {p.targetSlot}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Realistic YouTube Mobile Post Simulation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Live YouTube Mobile Simulation
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Interactive Voting Sandbox</span>
          </div>

          {/* YouTube Mobile Community Post Card */}
          <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl text-slate-100 font-sans">
            {/* Header: Channel Avatar & Handle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-0.5 shadow">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400 font-black text-xs">
                    ITC
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">IT Cafeteria</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-400">Just now • Public</div>
                </div>
              </div>

              <div className="flex gap-1 text-slate-400">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  POLL
                </span>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm text-white leading-relaxed font-normal select-text">
              {draftQuestion}
            </p>

            {/* Interactive Poll Options */}
            <div className="space-y-2 pt-1">
              {draftOptions.map((optText, optIdx) => {
                const optId = `opt-${optIdx}`;
                const isSelected = userVotedOptionId === optId;
                const baseVote = selectedPoll.options[optIdx]?.votes || 25;
                const effectiveVote = baseVote + (isSelected ? 1 : 0);
                const pct = Math.round((effectiveVote / totalVotes) * 100);

                return (
                  <button
                    key={optIdx}
                    onClick={() => setUserVotedOptionId(optId)}
                    className={`w-full p-3 rounded-xl border text-left transition-all relative overflow-hidden flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    {/* Animated Fill Bar after voting */}
                    {userVotedOptionId && (
                      <div 
                        className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-l-xl ${
                          isSelected ? 'bg-cyan-500/25' : 'bg-slate-800/60'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-2.5 text-xs font-medium">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{optText}</span>
                    </div>

                    {userVotedOptionId && (
                      <span className="relative z-10 text-xs font-mono font-bold text-slate-300">
                        {pct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Vote Count & Action Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">{totalVotes.toLocaleString()} votes</span>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="text-[11px]">84</span>
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[11px]">19</span>
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Algorithmic Priming Explanation Box */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-2 text-xs">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Algorithmic Priming Mechanism
            </div>
            <p className="text-slate-300 leading-relaxed">
              Jab viewer poll par click karta hai, YouTube ka algorithm us viewer ko IT Cafeteria ke sath <strong>"Active Session Engagement"</strong> mein count karta hai. Jab 2 ghante baad aapka Short release hota hai, yeh automatically unke Home Feed par #1 spot par deliver hota hai!
            </p>
            <div className="pt-2 border-t border-indigo-900/50 flex justify-between items-center text-[11px] text-indigo-300 font-mono">
              <span>Solution for 0.2% Returning Viewers</span>
              <span className="text-emerald-400 font-bold">+15% to 25% CTR Lift</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
