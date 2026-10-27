import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tv,
  Edit2,
  Check,
  ShieldCheck,
  Sparkles,
  User,
  Layers,
  Clock,
  RotateCcw
} from 'lucide-react';
import {
  loadAllChannels,
  saveCustomChannel,
  deleteCustomChannel,
  type ExtendedChannelProfile
} from '../lib/channelStore';

interface ChannelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelsUpdated: (channels: Record<string, ExtendedChannelProfile>) => void;
}

export const ChannelManagerModal: React.FC<ChannelManagerModalProps> = ({
  isOpen,
  onClose,
  onChannelsUpdated
}) => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // New Channel Form State
  const [name, setName] = useState('');
  const [presenter, setPresenter] = useState('Waqar Majeed');
  const [niche, setNiche] = useState('AI & Tech Workflows');
  const [tag, setTag] = useState('@WM25-Live');
  const [platform, setPlatform] = useState('YouTube + TikTok');
  const [sceneCount, setSceneCount] = useState(10);
  const [categoriesText, setCategoriesText] = useState(
    'AI Tools & Agents, Windows & Cloud Hacks, Remote Income Skills, Tutorials'
  );

  useEffect(() => {
    if (isOpen) {
      const loaded = loadAllChannels();
      setChannels(loaded);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const channelId = slug || `channel_${Date.now()}`;

    const categories = categoriesText
      .split(',')
      .map((c, i) => ({ id: i + 1, name: c.trim(), playlist: c.trim() }))
      .filter((c) => c.name.length > 0);

    const newChannel: ExtendedChannelProfile = {
      id: channelId as any,
      name: name.trim(),
      presenter: presenter.trim() || 'Waqar Majeed',
      niche: niche.trim() || 'Tech',
      platform,
      tags: [{ value: tag.trim() || '@WM25-1', label: `${tag.trim()} (Custom Tag)` }],
      categories: categories.length ? categories : [{ id: 1, name: 'Main Category', playlist: 'Main' }],
      rotationCategoryIds: [1],
      defaultTag: tag.trim() || '@WM25-1',
      defaultCategoryId: 1,
      durations: [
        { value: 10, label: '10 Scenes (100s — Standard Short)' },
        { value: 12, label: '12 Scenes (120s — Extended)' },
        { value: 7, label: '7 Scenes (70s — Minimal Threshold)' }
      ],
      defaultSceneCount: sceneCount,
      sampleNotes: {
        1: { title: `${name} Premiere Short`, hook: 'Viral Hook' }
      },
      isCustom: true
    };

    saveCustomChannel(newChannel);
    const updated = loadAllChannels();
    setChannels(updated);
    onChannelsUpdated(updated);

    // Reset Form
    setName('');
    setShowAddForm(false);
  };

  const handleDelete = (channelId: string) => {
    if (window.confirm('Kya aap waqai is custom channel ko remove karna chahte hain?')) {
      deleteCustomChannel(channelId);
      const updated = loadAllChannels();
      setChannels(updated);
      onChannelsUpdated(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-emerald-950/80 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Channel Manager & Multi-Channel Studio</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  {Object.keys(channels).length} Channels Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Naya YouTube/TikTok channel add karein, tags aur categories apne mutabiq customize karein.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Active Channels List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Configured Channels ({Object.keys(channels).length})
              </span>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Naya Channel Add Karein
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(channels).map((ch, idx) => (
                <div
                  key={ch.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {idx + 1}. {ch.name}
                        </span>
                        {ch.isCustom ? (
                          <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded font-mono">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded font-mono">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Presenter: <span className="text-slate-200">{ch.presenter}</span> • Niche: <span className="text-slate-200">{ch.niche}</span>
                      </p>
                    </div>

                    {ch.isCustom && (
                      <button
                        onClick={() => handleDelete(ch.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete custom channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tag: <strong className="text-cyan-400 font-mono">{ch.defaultTag}</strong></span>
                    <span>{ch.categories.length} Categories</span>
                    <span>{ch.defaultSceneCount} Scenes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Channel Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateChannel}
              className="mt-4 p-4 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-3.5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Naye Channel Ki Configuration
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Channel Ka Naam <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. IT Cafeteria Shorts ya Waqar Tech AI"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Host / Presenter Ka Naam
                  </label>
                  <input
                    type="text"
                    value={presenter}
                    onChange={(e) => setPresenter(e.target.value)}
                    placeholder="e.g. Waqar Majeed"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Niche / Topic</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. AI Tools & Automation"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Default Character Tag (Google Flow)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. @WM25-Live"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="YouTube + TikTok">YouTube + TikTok</option>
                    <option value="YouTube Shorts Only">YouTube Shorts Only</option>
                    <option value="TikTok Viral">TikTok Viral</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Multi-Platform MCN">Multi-Platform MCN</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Default Scene Count</label>
                  <select
                    value={sceneCount}
                    onChange={(e) => setSceneCount(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value={7}>7 Scenes (70s)</option>
                    <option value={10}>10 Scenes (100s Standard)</option>
                    <option value={12}>12 Scenes (120s Extended)</option>
                    <option value={15}>15 Scenes (150s Max)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Channel Categories (Commas se alag karein)
                </label>
                <input
                  type="text"
                  value={categoriesText}
                  onChange={(e) => setCategoriesText(e.target.value)}
                  placeholder="e.g. AI Tools, Windows Tricks, Automation, Tutorials"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60"
                >
                  <Check className="w-3.5 h-3.5" />
                  Channel Create Karein
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Naye add kiye gaye channels Agent Simulator aur Calendar ke dropdowns mein foran sync ho jate hain.
          </p>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
