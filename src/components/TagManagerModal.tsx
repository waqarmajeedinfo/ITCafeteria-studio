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
  Tag
} from 'lucide-react';
import { addTagToChannel, loadAllChannels, saveAllChannels, type ExtendedChannelProfile } from '../lib/channelStore';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  onTagAdded?: (newTagValue: string) => void;
}

const PRESET_AVATARS = [
  { value: '@WM25-1', label: 'Casual Studio', path: '/character-refs/WM25-1.jpg' },
  { value: '@WM25-2', label: 'Blue Accent', path: '/character-refs/WM25-2.jpg' },
  { value: '@WM25-3', label: 'Tech Setup', path: '/character-refs/WM25-3.jpg' },
  { value: '@WM25-4', label: 'Lecture Series', path: '/character-refs/WM25-4.jpg' },
  { value: '@WM25-5', label: 'Smart Casual', path: '/character-refs/WM25-5.jpg' },
  { value: '@WM25-6', label: 'Signature Studio / Black Jacket', path: '/character-refs/WM25-6.png' }
];

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onTagAdded
}) => {
  const [channels, setChannels] = useState<Record<string, ExtendedChannelProfile>>(loadAllChannels);
  const activeChannel = channels[channelId] || channels['itcafeteria'];

  const [tagValue, setTagValue] = useState('@WM25-6');
  const [tagLabel, setTagLabel] = useState('@WM25-6 (Signature Studio / Black Jacket)');
  const [imagePreview, setImagePreview] = useState<string>('/character-refs/WM25-6.png');
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

    const newTag = {
      value: cleanVal,
      label: cleanLabel,
      imagePath: imagePreview || undefined
    };

    const updated = addTagToChannel(channelId, newTag);
    setChannels(updated);
    setSuccessToast(`Tag "${cleanVal}" kamyabi se add aur channel mein save ho gaya!`);
    onTagAdded?.(cleanVal);

    setTimeout(() => {
      setSuccessToast('');
      onClose();
    }, 900);
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overscroll-contain overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full flex flex-col overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Character Tag & Avatar Manager
              </h3>
              <p className="text-xs text-slate-400">
                Channel: <strong className="text-cyan-300">{activeChannel?.name || 'IT Cafeteria'}</strong> — Naye tags add karein ya photo upload karein
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
        <div className="p-4 sm:p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Form to Add New Tag */}
          <form onSubmit={handleSaveTag} className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Naya Character Tag Register Karein
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Google Flow / AI Ready</span>
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

            {/* Avatar Preset Selection or Custom Image Upload */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">
                Character Reference Photo (Pre-loaded ya Custom Upload)
              </label>

              {/* Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = imagePreview === preset.path;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setImagePreview(preset.path);
                        setTagValue(preset.value);
                        setTagLabel(`${preset.value} (${preset.label})`);
                      }}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
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
                    </button>
                  );
                })}
              </div>

              {/* Upload Local Image */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer transition-colors text-xs">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Custom Photo Upload Karein</span>
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
                    <span className="text-[11px] text-slate-400">Photo selected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tag Save & Select Karein
              </button>
            </div>
          </form>

          {/* List of Active Channel Tags */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 text-xs">
              Mawjooda Character Tags ({activeChannel?.tags?.length || 0})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeChannel?.tags?.map((tag) => (
                <div
                  key={tag.value}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-mono text-[10px] font-bold shrink-0">
                      {tag.value}
                    </span>
                    <span className="text-white text-xs truncate">
                      {tag.label}
                    </span>
                  </div>
                  {activeChannel.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.value)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0 ml-1"
                      title="Tag delete karein"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
