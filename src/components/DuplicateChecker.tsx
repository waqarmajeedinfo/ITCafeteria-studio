import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { PUBLISHED_VIDEOS, PublishedVideo } from '../data/channelData';

export const DuplicateChecker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [copiedMemory, setCopiedMemory] = useState(false);

  // Filtered Library
  const filteredVideos = PUBLISHED_VIDEOS.filter(video => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.points.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeries = seriesFilter === 'all' || video.series.toLowerCase().includes(seriesFilter.toLowerCase());
    return matchesSearch && matchesSeries;
  });

  // Duplicate Analysis Logic
  const getDuplicateStatus = () => {
    if (!toolInput.trim() && !featureInput.trim()) return null;

    const matchedVideos = PUBLISHED_VIDEOS.filter(v => {
      const matchTool = toolInput.trim() && v.tool.toLowerCase().includes(toolInput.toLowerCase().trim());
      const matchFeature = featureInput.trim() && (
        v.points.toLowerCase().includes(featureInput.toLowerCase().trim()) ||
        v.title.toLowerCase().includes(featureInput.toLowerCase().trim())
      );
      return matchTool && matchFeature;
    });

    if (matchedVideos.length > 0) {
      return {
        isDuplicate: true,
        matches: matchedVideos,
        message: `Pehle cover ho chuka hai! (Found in ${matchedVideos.length} published video/part)`
      };
    }

    // Check if tool exists but feature is new
    const toolOnlyMatches = PUBLISHED_VIDEOS.filter(v => 
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
      message: "Naya Topic! (Library mein koi duplicate nahi mila)"
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
              v3.41 Step 2 Duplicate Check: 58 published videos aur memory blocks ko scan kar ke pata lagata hai ke tool ya feature pehle banna chuka hai ya nahi.
            </p>
          </div>
          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 font-mono">
            Total Library: <strong className="text-cyan-400 font-bold">{PUBLISHED_VIDEOS.length}</strong> Videos
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
              Tool / App Name (e.g. WhatsApp, Power Automate, Windows, Gemini):
            </label>
            <input 
              type="text"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              placeholder="e.g. WhatsApp"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Specific Feature / Setting to Cover (e.g. pin chats, clipboard history):
            </label>
            <input 
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="e.g. pin chats"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 text-[11px]">Test with known cases:</span>
          <button 
            onClick={() => { setToolInput('WhatsApp'); setFeatureInput('pin chats'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            WhatsApp + pin chats (Known Duplicate)
          </button>
          <button 
            onClick={() => { setToolInput('Windows'); setFeatureInput('clipboard history'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            Windows + clipboard history (Known Duplicate)
          </button>
          <button 
            onClick={() => { setToolInput('Power Automate'); setFeatureInput('daily reports'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
          >
            Power Automate + daily reports
          </button>
          <button 
            onClick={() => { setToolInput('CapCut'); setFeatureInput('auto caption styling'); }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
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
            <p className="text-xs text-slate-400">Total {filteredVideos.length} matching entries displayed</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVideos.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-mono text-slate-500">{v.id}</td>
                  <td className="py-2.5 font-medium text-white max-w-xs">{v.title}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
