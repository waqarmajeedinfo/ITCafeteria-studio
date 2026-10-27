import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Filter, 
  Search, 
  ListTodo,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface TaskItem {
  id: number;
  section: string;
  title: string;
  status: 'done' | 'pending' | 'input_needed';
  details: string;
}

export const MasterListTracker: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'done' | 'pending' | 'input_needed'>('all');
  const [search, setSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.filter) setFilter(e.detail.filter);
      if (e.detail?.highlightFirstPending) {
        setFilter('all');
        const firstPending = masterList.find(t => t.status === 'pending');
        if (firstPending) {
          setHighlightedId(firstPending.id);
          setTimeout(() => {
            const el = document.getElementById(`task-item-${firstPending.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
          // remove highlight after 5 seconds
          setTimeout(() => setHighlightedId(null), 5000);
        }
      }
    };
    window.addEventListener('itcafeteria_highlight_masterlist_task', handler);
    return () => window.removeEventListener('itcafeteria_highlight_masterlist_task', handler);
  }, []);

  const masterList: TaskItem[] = [
    // A. YouTube settings
    { id: 1, section: "A. YouTube Settings", title: "Auto dubbing review setting saved", status: "done", details: "Saved as 'Review dubs in all languages'. Next: check Languages page of 1 video in Studio." },
    { id: 2, section: "A. YouTube Settings", title: "Feature eligibility screenshot", status: "input_needed", details: "Studio -> Settings -> Channel -> Feature eligibility tab screenshot needed to verify Advanced access for audio tracks & upload limits." },
    { id: 3, section: "A. YouTube Settings", title: "Default video language set to Urdu", status: "pending", details: "Studio -> Settings -> Upload defaults -> Advanced settings -> Video language: Urdu." },
    { id: 4, section: "A. YouTube Settings", title: "Category playlists creation & casing unification", status: "pending", details: "Created playlists active; unify 'Whatsapp Business' vs 'whatsapp Tips & Tricks' casing, merge YT Step By Step into Digital Growth." },
    { id: 5, section: "A. YouTube Settings", title: "English translated titles/descriptions & subtitles", status: "pending", details: "Cheap growth hack: test English translated metadata for India and global search reach." },
    { id: 6, section: "A. YouTube Settings", title: "Upload schedule test (5/6/7pm)", status: "input_needed", details: "Confirm upload frequency: 3 videos a day (21/week) vs 7-10 videos a week, test 5/6/7pm slots for 2 weeks." },

    // B. Data and Channel_Insights
    { id: 7, section: "B. Channel Insights & Data", title: "Geography numbers saved", status: "done", details: "India 37.9% (avg 0:32), Pakistan 7.0% (avg 0:49), other countries ~55% documented." },
    { id: 8, section: "B. Channel Insights & Data", title: "Category per video in library", status: "pending", details: "Fill 'Category' column gradually from new daily memory blocks." },
    { id: 9, section: "B. Channel Insights & Data", title: "Weekly screenshots update", status: "pending", details: "Keywords (YouTube search terms), per-Short retention/swiped-away %, 2-3 retention graphs." },

    // C. Growth plan
    { id: 10, section: "C. Growth Plan Order", title: "Execution Sequence", status: "pending", details: "Consistency (set up) -> hook & retention -> title/keywords -> subscribe moment -> returning audience (series) -> geography/language -> length." },

    // D. Agent file
    { id: 11, section: "D. Agent File Updates", title: "v3.40 architectural update applied", status: "done", details: "No intro, 3 fixed instruction lines, free-first rule, curiosity gap, YT Automation Section 9.2 added." },
    { id: 12, section: "D. Agent File Updates", title: "v3.41 duplicate check & memory block applied", status: "done", details: "Decision Note line, topic check against Section 8 library, draft memory block format." },
    { id: 13, section: "D. Agent File Updates", title: "Fresh chat last-used tag rotation conflict", status: "pending", details: "Section 11 vs 11.1 conflict: ask once in fresh chat for both modes instead of defaulting to @WM25-1." },
    { id: 14, section: "D. Agent File Updates", title: "Language question in agent", status: "pending", details: "Routine: default Roman Urdu; Custom: ask language (requires Flow English test first)." },

    // E. Tests & Verification
    { id: 15, section: "E. Tests & Live Validation", title: "Voice A/B test across profiles", status: "pending", details: "Generate same scene in 2 Flow profiles with and without the voice instruction line to check consistency." },
    { id: 16, section: "E. Tests & Live Validation", title: "YT Automation Chapter 10 covered", status: "done", details: "Deep-Dive AI Voice Cloning & Emotion Tuning marked finished in roadmap." },
    { id: 17, section: "E. Tests & Live Validation", title: "YT Automation Chapter 11 (B-Roll Mastery)", status: "pending", details: "Next chapter in queue: Midjourney, Runway, Pika & Sora for faceless video b-roll." },

    // F. Session Continuity
    { id: 18, section: "F. Session Continuity", title: "Memory block 1-week test refinement", status: "pending", details: "Test 5-10 stories with the memory block to confirm duplicate detection effectiveness." }
  ];

  const filteredTasks = masterList.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                          task.section.toLowerCase().includes(search.toLowerCase()) ||
                          task.details.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const doneCount = masterList.filter(t => t.status === 'done').length;
  const pendingCount = masterList.filter(t => t.status === 'pending').length;
  const inputCount = masterList.filter(t => t.status === 'input_needed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                <ListTodo className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                IT Cafeteria Master Task & Decision Tracker
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Master Project Summary v3.41 Section 10 Master List: Track ongoing channel setups, pending tests, and decisions needed from Waqar Majeed.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {doneCount} Done
            </span>
            <span className="px-3 py-1.5 bg-amber-950/60 text-amber-400 border border-amber-800/40 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {pendingCount} Pending
            </span>
            <span className="px-3 py-1.5 bg-rose-950/60 text-rose-400 border border-rose-800/40 rounded-xl flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> {inputCount} Input Needed
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 border-blue-400 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Items ({masterList.length})
          </button>
          <button
            onClick={() => setFilter('input_needed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filter === 'input_needed' 
                ? 'bg-rose-600 border-rose-400 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Needs Waqar's Input ({inputCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filter === 'pending' 
                ? 'bg-amber-600 border-amber-400 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filter === 'done' 
                ? 'bg-emerald-600 border-emerald-400 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Completed ({doneCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search master list..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isHighlighted = highlightedId === task.id;
          return (
            <div 
              key={task.id}
              id={`task-item-${task.id}`}
              className={`bg-slate-900 border rounded-xl p-4 space-y-2 transition-all duration-300 ${
                isHighlighted
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20 bg-slate-900/95 scale-[1.02]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isHighlighted 
                    ? 'text-cyan-300 bg-cyan-900/60 border-cyan-400' 
                    : 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40'
                }`}>
                  {task.section} {isHighlighted && '⚡ Focused by Voice'}
                </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                task.status === 'done' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : task.status === 'input_needed'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                {task.status === 'input_needed' && <HelpCircle className="w-3 h-3" />}
                {task.status === 'pending' && <Clock className="w-3 h-3" />}
                {task.status === 'done' ? 'Completed' : task.status === 'input_needed' ? 'Needs Input' : 'In Progress'}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white tracking-tight">
              #{task.id} {task.title}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {task.details}
            </p>
          </div>
          );
        })}
      </div>
    </div>
  );
};
