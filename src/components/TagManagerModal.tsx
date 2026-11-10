import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  User,
  Plus,
  Check,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  Sliders,
  Ratio
} from 'lucide-react';
import {
  addTagToChannel,
  loadAllChannels,
  saveAllChannels,
  updateTagInChannel,
  filterTagsByAspectRatio,
  type ExtendedChannelProfile
} from '../lib/channelStore';
import type { ChannelTagVariant } from '../data/channelData';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  onTagAdded?: (newTagValue: string) => void;
}

const PRESET_AVATARS: Array<{ value: string; label: string; path: string; aspectRatios: ('9:16' | '16:9')[] }> = [
  { value: '@WM25-1', label: 'Casual Studio', path: '/character-refs/WM25-1.jpg', aspectRatios: ['9:16', '16:9'] },
  { value: '@WM25-2', label: 'Blue Accent', path: '/character-refs/WM25-2.jpg', aspectRatios: ['9:16', '16:9'] },
  { value: '@WM25-3', label: 'Tech Setup', path: '/character-refs/WM25-3.jpg', aspectRatios: ['9:16', '16:9'] },
  { value: '@WM25-4', label: 'Lecture Series', path: '/character-refs/WM25-4.jpg', aspectRatios: ['16:9'] },
  { value: '@WM25-5', label: 'Smart Casual', path: '/character-refs/WM25-5.jpg', aspectRatios: ['9:16', '16:9'] },
  { value: '@WM25-6', label: 'Signature Studio / Black Jacket', path: '/character-refs/WM25-6.png', aspectRatios: ['9:16'] },
  { value: '@WM25-7', label: 'Plaid Flannel / Vertical Studio', path: '/character-refs/WM25-7.jpeg', aspectRatios: ['9:16'] },
  { value: '@WM25-8', label: 'Green Bomber / Tech Desk', path: '/character-refs/WM25-8.png', aspectRatios: ['9:16'] },
  { value: '@WM25-9', label: 'Black Blazer / Studio Suit', path: '/character-refs/WM25-9.png', aspectRatios: ['9:16'] }
];

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onTagAdded
}) => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const activeChannel = channels[channelId] || channels['itcafeteria'];

  const [tagValue, setTagValue] = useState('@WM25-1');
  const [tagLabel, setTagLabel] = useState('@WM25-1 (Casual Studio)');
  const [imagePreview, setImagePreview] = useState<string>('/character-refs/WM25-1.jpg');
  const [newTag916, setNewTag916] = useState(true);
  const [newTag169, setNewTag169] = useState(true);
  const [filterRatio, setFilterRatio] = useState<'all' | '9:16' | '16:9'>('all');
  const [successToast, setSuccessToast] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanVal = tagValue.trim();
    if (!cleanVal) return;
    if (!cleanVal.startsWith('@') && cleanVal !== 'No-Character') {
      cleanVal = `@${cleanVal}`;
    }

    const cleanLabel = tagLabel.trim() || cleanVal;
    const selectedRatios: ('9:16' | '16:9')[] = [];
    if (newTag916) selectedRatios.push('9:16');
    if (newTag169) selectedRatios.push('16:9');
    if (selectedRatios.length === 0) selectedRatios.push('9:16');

    const newTag = {
      value: cleanVal,
      label: cleanLabel,
      imagePath: imagePreview || undefined,
      aspectRatios: selectedRatios
    };

    const updated = addTagToChannel(channelId, newTag);
    setChannels(updated);
    setSuccessToast(`Tag "${cleanVal}" kamyabi se save ho gaya! Aspect Ratios: ${selectedRatios.join(', ')}`);
    onTagAdded?.(cleanVal);

    setTimeout(() => {
      setSuccessToast('');
    }, 2000);
  };

  const handleToggleRatio = (tagVal: string, ratioToToggle: '9:16' | '16:9') => {
    const currentTag = activeChannel.tags.find(t => t.value === tagVal);
    if (!currentTag) return;

    const currentRatios = currentTag.aspectRatios && currentTag.aspectRatios.length > 0
      ? currentTag.aspectRatios
      : ['9:16'];

    let nextRatios: ('9:16' | '16:9')[];
    if (currentRatios.includes(ratioToToggle)) {
      if (currentRatios.length === 1) {
        alert('Kam az kam aik aspect ratio select hona zaroori hai (9:16 ya 16:9).');
        return;
      }
      nextRatios = currentRatios.filter(r => r !== ratioToToggle);
    } else {
      nextRatios = [...currentRatios, ratioToToggle];
    }

    const updated = updateTagInChannel(channelId, tagVal, { aspectRatios: nextRatios });
    setChannels(updated);
    setSuccessToast(`${tagVal} ke supported aspect ratios update ho gaye: ${nextRatios.join(', ')}`);
    setTimeout(() => setSuccessToast(''), 1500);
  };

  const handleDeleteTag = (valToDelete: string) => {
    if (activeChannel.tags.length <= 1) {
      alert('Kam az kam aik character tag hona zaroori hai.');
      return;
    }
    const filteredTags = activeChannel.tags.filter(t => t.value !== valToDelete);
    const updatedChannel = {
      ...activeChannel,
      tags: filteredTags
    };
    const updatedAll = {
      ...channels,
      [channelId]: updatedChannel
    };
    saveAllChannels(updatedAll);
    setChannels(updatedAll);
  };

  const displayedTags = filterRatio === 'all'
    ? activeChannel?.tags || []
    : filterTagsByAspectRatio(activeChannel?.tags || [], filterRatio);

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full flex flex-col overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Character Tag &amp; Aspect Ratio Registry
              </h3>
              <p className="text-xs text-slate-400">
                Channel: <strong className="text-cyan-300">{activeChannel?.name || 'IT Cafeteria'}</strong> — Har tag ke liye explicit 9:16 / 16:9 ratios set karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto custom-modal-scroll">
          {successToast && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Quick Presets Carousel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold block text-xs">
                Official Character Tag Presets (Click to pre-fill)
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">Restored: @WM25-1 se @WM25-9</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = tagValue === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setImagePreview(preset.path);
                      setTagValue(preset.value);
                      setTagLabel(`${preset.value} (${preset.label})`);
                      setNewTag916(preset.aspectRatios.includes('9:16'));
                      setNewTag169(preset.aspectRatios.includes('16:9'));
                    }}
                    className={`flex flex-col items-center gap-1 p-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
                      <img
                        src={preset.path}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-300 truncate w-full">
                      {preset.value}
                    </span>
                    <span className="text-[8px] text-cyan-400 font-mono">
                      {preset.aspectRatios.join('/')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form to Add / Update Tag */}
          <form onSubmit={handleSaveTag} className="space-y-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Tag Register / Edit Karein
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Google Flow / AI Studio Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Tag Identifier (e.g. @WM25-6) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="@WM25-6"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Tag Label / Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tagLabel}
                  onChange={(e) => setTagLabel(e.target.value)}
                  placeholder="@WM25-6 (Signature Studio / Black Jacket)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Explicit Aspect Ratio Toggles */}
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
              <label className="text-slate-200 font-semibold block text-xs flex items-center justify-between">
                <span>Supported Aspect Ratios (Never guessed from tag name)</span>
                <span className="text-[10px] text-cyan-400 font-mono">Select 9:16, 16:9 or Both</span>
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newTag916}
                    onChange={(e) => setNewTag916(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-white font-medium">9:16 Shorts (Vertical)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newTag169}
                    onChange={(e) => setNewTag169(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-white font-medium">16:9 Long Form (Widescreen)</span>
                </label>
              </div>
            </div>

            {/* Custom Photo Upload */}
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer transition-colors text-xs">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custom Reference Photo Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Selected Preview"
                    className="w-8 h-8 rounded-lg object-cover border border-cyan-500/50"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">{tagValue} photo selected</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tag Save &amp; Register Karein
              </button>
            </div>
          </form>

          {/* Active Tags with Interactive Aspect Ratio Management */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h4 className="font-semibold text-white text-xs">
                  Active Channel Tags ({activeChannel?.tags?.length || 0})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Har tag ke agay checkboxes par click karke direct aspect ratio allow ya disable karein.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterRatio('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterRatio === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({activeChannel?.tags?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRatio('9:16')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterRatio === '9:16' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  9:16 Shorts ({filterTagsByAspectRatio(activeChannel?.tags || [], '9:16').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRatio('16:9')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterRatio === '16:9' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  16:9 Long ({filterTagsByAspectRatio(activeChannel?.tags || [], '16:9').length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {displayedTags.map((tag) => {
                const ratios = tag.aspectRatios && tag.aspectRatios.length > 0
                  ? tag.aspectRatios
                  : ['9:16'];
                const supports916 = ratios.includes('9:16');
                const supports169 = ratios.includes('16:9');

                return (
                  <div
                    key={tag.value}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {tag.path || tag.imagePath ? (
                        <img
                          src={tag.path || tag.imagePath}
                          alt={tag.value}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/50 font-mono text-[10px] font-bold">
                            {tag.value}
                          </span>
                          <span className="text-white text-xs font-medium truncate">
                            {tag.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ratio Toggles and Delete */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-400 font-mono">Ratio:</span>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={supports916}
                            onChange={() => handleToggleRatio(tag.value, '9:16')}
                            className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={supports916 ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                            9:16
                          </span>
                        </label>
                        <span className="text-slate-700">|</span>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={supports169}
                            onChange={() => handleToggleRatio(tag.value, '16:9')}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className={supports169 ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
                            16:9
                          </span>
                        </label>
                      </div>

                      {activeChannel.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag.value)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Tag delete karein"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[10px] text-slate-400">
            Rules: 9:16 par sirf 9:16 tags, 16:9 par sirf 16:9 tags show honge. Auto-rotate bhi inhi mein cycle karega.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
