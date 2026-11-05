import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Database, 
  Copy, 
  Check, 
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  Filter,
  Eye,
  X,
  Sparkles,
  Film,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  getAllPublishedVideos, 
  LIBRARY_UPDATED_EVENT, 
  type DynamicPublishedStory 
} from '../lib/publishedLibraryStore';
import { StoryPackageView, buildStoryPackageText } from './StoryPackageView';
import { findDuplicateMatches, CORE_TOPIC_CONCEPTS } from './AgentFlowScreen';

export const DuplicateChecker: React.FC = () => {
  const [videos, setVideos] = useState<DynamicPublishedStory[]>(getAllPublishedVideos);
  const [searchQuery, setSearchQuery] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [copiedMemory, setCopiedMemory] = useState(false);
  const [reviewStory, setReviewStory] = useState<DynamicPublishedStory | null>(null);

  // Centralized Sequel Launcher: Guarantees localStorage persistence + immediate custom event dispatch
  const handleLaunchSequel = (target: { tool: string; title: string; series?: string }) => {
    const topicData = {
      tool: target.tool,
      title: target.title,
      series: target.series,
      isSequel: true
    };
    try {
      localStorage.setItem('itcafeteria_prefill_topic', JSON.stringify(topicData));
    } catch {}
    window.dispatchEvent(
      new CustomEvent('itcafeteria_open_simulator_for_topic', {
        detail: topicData
      })
    );
    setReviewStory(null);
  };

  // Sync with dynamic library events
  useEffect(() => {
    const refreshList = () => {
      setVideos(getAllPublishedVideos());
    };

    window.addEventListener(LIBRARY_UPDATED_EVENT, refreshList);
    window.addEventListener('itcafeteria_story_published', refreshList);
    window.addEventListener('storage', refreshList);

    return () => {
      window.removeEventListener(LIBRARY_UPDATED_EVENT, refreshList);
      window.removeEventListener('itcafeteria_story_published', refreshList);
      window.removeEventListener('storage', refreshList);
    };
  }, []);

  // Filtered Library
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.points.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeries = seriesFilter === 'all' || video.series.toLowerCase().includes(seriesFilter.toLowerCase());
    return matchesSearch && matchesSeries;
  });

  // Deep Duplicate Analysis Logic across ALL videos (static 58 + live published + core concepts)
  const getDuplicateStatus = () => {
    if (!toolInput.trim() && !featureInput.trim()) return null;

    const candidateText = `${toolInput.trim()} ${featureInput.trim()}`.toLowerCase();
    
    // 1. Deep Concept Match
    const matchedConcept = CORE_TOPIC_CONCEPTS.find(c => 
      c.aliases.some(alias => candidateText.includes(alias))
    );

    // 2. Comprehensive deep matching
    const deepMatches = findDuplicateMatches(toolInput.trim(), featureInput.trim(), 'itcafeteria');

    const matchedVideos = videos.filter(v => {
      const matchTool = toolInput.trim() && v.tool.toLowerCase().includes(toolInput.toLowerCase().trim());
      const matchFeature = featureInput.trim() && (
        v.points.toLowerCase().includes(featureInput.toLowerCase().trim()) ||
        v.title.toLowerCase().includes(featureInput.toLowerCase().trim())
      );
      const matchConcept = matchedConcept && (
        matchedConcept.aliases.some(alias => `${v.title} ${v.tool} ${v.points}`.toLowerCase().includes(alias))
      );
      return (matchTool && matchFeature) || matchConcept;
    });

    if (matchedVideos.length > 0 || deepMatches.length > 0) {
      const combined = [...matchedVideos];
      deepMatches.forEach(dm => {
        const numId = parseInt(dm.id.replace('#', ''), 10);
        if (!combined.some(v => v.title === dm.title || v.id === numId)) {
          combined.push({
            id: isNaN(numId) ? 999 : numId,
            title: dm.title,
            tool: dm.tool,
            points: dm.points,
            series: 'Published',
            length: '60s',
            published: 'Platform Record'
          });
        }
      });

      return {
        isDuplicate: true,
        matches: combined,
        message: matchedConcept 
          ? `Deep Concept Duplicate: "${matchedConcept.name}" pehle cover ho chuka hai! (${combined.length} matches)`
          : `Pehle cover ho chuka hai! (Found in ${combined.length} published video/part)`
      };
    }

    // Check if tool exists but feature is new
    const toolOnlyMatches = videos.filter(v => 
      toolInput.trim() && v.tool.toLowerCase().includes(toolInput.toLowerCase().trim())
    );

    if (toolOnlyMatches.length > 0) {
      return {
        isDuplicate: false,
        isPartial: true,
        matches: toolOnlyMatches,
        message: `Tool pehle use hua hai (${toolOnlyMatches.length} videos), lekin yeh specific feature naya lag raha hai.`
      };
    }

    return {
      isDuplicate: false,
      matches: [],
      message: "Naya Topic! (Poori published library aur deep concept checks mein koi duplicate nahi mila)"
    };
  };

  const duplicateResult = getDuplicateStatus();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Duplicate Topic Prevention & Library Audit
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              v3.41 Step 2 Duplicate Check: {videos.length} published videos aur memory blocks ko scan kar ke pata lagata hai ke tool ya feature pehle banna chuka hai ya nahi.
            </p>
          </div>
          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 font-mono">
            Total Library: <strong className="text-cyan-400 font-bold">{videos.length}</strong> Videos
          </div>
        </div>
      </div>

      {/* Live Duplicate Checker Tester */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-blue-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Live Duplicate Key Tester (Step 2 Simulation)
          </h3>
          <span className="text-xs text-slate-400">Tool + Feature Pair Matching</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Tool / App Name (e.g. WhatsApp, Power Automate, Windows, Gemini, Google Flow):
            </label>
            <input 
              type="text"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              placeholder="e.g. Google Flow"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Specific Feature / Setting to Cover (e.g. pin chats, clipboard history, start frame):
            </label>
            <input 
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="e.g. start frame"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 text-[11px]">Test with known cases:</span>
          <button 
            onClick={() => { setToolInput('WhatsApp'); setFeatureInput('pin chats'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            WhatsApp + pin chats (Known Duplicate)
          </button>
          <button 
            onClick={() => { setToolInput('Windows'); setFeatureInput('clipboard history'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            Windows + clipboard history (Known Duplicate)
          </button>
          <button 
            onClick={() => { setToolInput('Power Automate'); setFeatureInput('daily reports'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            Power Automate + daily reports
          </button>
          <button 
            onClick={() => { setToolInput('CapCut'); setFeatureInput('auto caption styling'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px] cursor-pointer"
          >
            CapCut + auto captions (Fresh Topic)
          </button>
        </div>

        {/* Real-time Status Card */}
        {duplicateResult && (
          <div className={`p-4 rounded-xl border text-xs ${
            duplicateResult.isDuplicate 
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
              : duplicateResult.isPartial
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              {duplicateResult.isDuplicate ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : duplicateResult.isPartial ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{duplicateResult.message}</span>
            </div>

            {duplicateResult.matches.length > 0 && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Matched Library Entries:</span>
                {duplicateResult.matches.map(m => (
                  <div key={m.id} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center text-[11px]">
                    <div>
                      <strong className="text-white">#{m.id} {m.title}</strong>
                      <span className="text-slate-400 ml-2">({m.series !== '—' ? m.series : 'Standalone'})</span>
                    </div>
                    <span className="text-cyan-400 font-mono">{m.length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Searchable Published Videos Library */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-semibold text-white text-base">Published Videos Library (Channel_Insights Section 8)</h3>
            <p className="text-xs text-slate-400">Total {filteredVideos.length} matching entries displayed (Includes {videos.length - 58} live published stories)</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, tool or points..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Series</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Power Automate">Power Automate</option>
              <option value="Windows">PC & Windows Hacks</option>
              <option value="Secrets">Secrets</option>
              <option value="AI">AI Tools</option>
              <option value="Shorts">Shorts Series</option>
            </select>
          </div>
        </div>

        {/* Video Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-medium w-12">#</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Tool / Topic</th>
                <th className="pb-3 font-medium">Key Points Covered</th>
                <th className="pb-3 font-medium">Series / Part</th>
                <th className="pb-3 font-medium w-16">Length</th>
                <th className="pb-3 font-medium text-right pr-2 w-56">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVideos.map((v) => {
                const isDynamic = Boolean(v.isPlatformGenerated || v.storyPackage);

                return (
                  <tr key={v.id} className={`hover:bg-slate-800/40 transition-colors ${isDynamic ? 'bg-emerald-950/15' : ''}`}>
                    <td className="py-2.5 font-mono text-slate-500">{v.id}</td>
                    <td className="py-2.5 font-medium text-white max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDynamic && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
                            Live Published
                          </span>
                        )}
                        <span>{v.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-cyan-300 font-mono">{v.tool}</td>
                    <td className="py-2.5 text-slate-400 text-[11px] max-w-sm truncate" title={v.points}>
                      {v.points}
                    </td>
                    <td className="py-2.5 text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 text-[11px]">
                        {v.series}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-cyan-400">{v.length}</td>
                    <td className="py-2.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleLaunchSequel(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
                          title="Is topic ka agla part / sequel Agent Simulator mein trigger karein"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Sequel (Part 2)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewStory(v)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            isDynamic
                              ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300 shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Is video ki mukammal story open karein"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>Open Story</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Story Modal */}
      {reviewStory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Published Story Review
                  </span>
                  {reviewStory.isPlatformGenerated && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                      Full Flow Package Available
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    ID #{reviewStory.id} • Duration: {reviewStory.length}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base sm:text-lg mt-1 line-clamp-1">
                  {reviewStory.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setReviewStory(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Band karein"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {reviewStory.storyPackage ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-cyan-200">Is video ka agla episode (Part 2 / Sequel) banana chahte hain?</span>
                        <span className="block text-[10px] text-cyan-300/70">Agent Simulator mein is topic ka naya part generate karein.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchSequel(reviewStory)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Sequel (Next Episode)</span>
                    </button>
                  </div>
                  <StoryPackageView
                    story={reviewStory.storyPackage}
                    publishStatus="published"
                    storyId={reviewStory.sourceRecordId}
                  />
                </div>
              ) : (
                /* Catalog Review Card */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-semibold">Tool / Topic Covered:</span>
                      <span className="text-cyan-300 font-mono font-bold text-sm">{reviewStory.tool}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-slate-400 font-semibold block">Key Points Covered in Video:</span>
                      <p className="text-slate-200 text-sm leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
                        {reviewStory.points}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Series Playlist:</span>
                        <span className="text-white font-semibold">{reviewStory.series}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Original Publish Date:</span>
                        <span className="text-white font-semibold">{reviewStory.published}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-cyan-200 text-xs">
                        Is topic ka next episode ya remake banana chahte hain?
                      </p>
                      <p className="text-[11px] text-cyan-300/70 mt-0.5">
                        Yeh video YouTube catalog ka hissa hai. Agent Simulator mein is topic ka Part 2 direct generate karein.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchSequel(reviewStory)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Sequel (Next Episode)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setReviewStory(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
