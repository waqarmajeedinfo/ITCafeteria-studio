import React, { useState } from 'react';
import { Upload, Music, Image as ImageIcon, Trash2, Play, Pause, Loader2, Check } from 'lucide-react';
import type {
  WcgCustomSongItem,
  WcgCustomTemplateItem,
  WcgEventCategory,
} from '../lib/wcgTemplates';

interface WCGUploadManagerProps {
  customTemplates: WcgCustomTemplateItem[];
  customSongs: WcgCustomSongItem[];
  activeCustomTemplateId: string | null;
  selectedMusicId: string;
  previewingMusicId: string | null;
  onSelectCustomTemplate: (tpl: WcgCustomTemplateItem) => void;
  onSelectBuiltinMultipart: () => void;
  onUploadedTemplate: (tpl: WcgCustomTemplateItem) => void;
  onDeletedTemplate: (id: string) => void;
  onSelectSong: (songId: string) => void;
  onUploadedSong: (song: WcgCustomSongItem) => void;
  onDeletedSong: (id: string) => void;
  onTogglePreviewMusic: (songId: string, audioUrl?: string) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('File read fail ho gayi.'));
    reader.readAsDataURL(file);
  });
}

export const WCGUploadManager: React.FC<WCGUploadManagerProps> = ({
  customTemplates,
  customSongs,
  activeCustomTemplateId,
  selectedMusicId,
  previewingMusicId,
  onSelectCustomTemplate,
  onSelectBuiltinMultipart,
  onUploadedTemplate,
  onDeletedTemplate,
  onSelectSong,
  onUploadedSong,
  onDeletedSong,
  onTogglePreviewMusic,
}) => {
  const [tplName, setTplName] = useState<string>('');
  const [tplCategory, setTplCategory] = useState<Exclude<WcgEventCategory, 'All'>>('Mehndi');
  const [part1File, setPart1File] = useState<File | null>(null);
  const [part2File, setPart2File] = useState<File | null>(null);
  const [isUploadingTpl, setIsUploadingTpl] = useState<boolean>(false);

  const [songTitle, setSongTitle] = useState<string>('');
  const [isUploadingSong, setIsUploadingSong] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>('');
  const [uploadErr, setUploadErr] = useState<string>('');

  const handleSaveCustomTemplate = async () => {
    if (!part1File) {
      setUploadErr('Pehle Part 1 (JPG/PNG) card image select karein.');
      return;
    }
    setUploadErr('');
    setUploadMsg('');
    setIsUploadingTpl(true);
    try {
      const part1DataUrl = await readFileAsDataUrl(part1File);
      const part2DataUrl = part2File ? await readFileAsDataUrl(part2File) : undefined;
      const derivedName = tplName.trim() || part1File.name.replace(/\.[^.]+$/, '');

      const res = await fetch('/api/wcg/library/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: derivedName,
          category: tplCategory,
          part1DataUrl,
          part2DataUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok || !json.template) {
        setUploadErr(json?.error || 'Custom template save nahi ho saka.');
        return;
      }

      onUploadedTemplate(json.template);
      setTplName('');
      setPart1File(null);
      setPart2File(null);
      setUploadMsg(`"${json.template.name}" permanent server library mein save aur select ho gaya hai.`);
    } catch (err: any) {
      setUploadErr(err?.message || 'Template upload error');
    } finally {
      setIsUploadingTpl(false);
    }
  };

  const handleSongUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadErr('');
    setUploadMsg('');
    setIsUploadingSong(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const title = songTitle.trim() || file.name.replace(/\.[^.]+$/, '');
      const res = await fetch('/api/wcg/library/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: tplCategory,
          dataUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok || !json.song) {
        setUploadErr(json?.error || 'Audio track upload nahi ho saka.');
        return;
      }

      onUploadedSong(json.song);
      setSongTitle('');
      setUploadMsg(`Audio "${json.song.title}" (${json.song.durationSec}s) library mein save ho gaya hai.`);
    } catch (err: any) {
      setUploadErr(err?.message || 'Audio upload error');
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/wcg/library/templates/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) onDeletedTemplate(id);
    } catch {}
  };

  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/wcg/library/songs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) onDeletedSong(id);
    } catch {}
  };

  return (
    <section className="bg-slate-900/65 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-400" />
          <span>WCG Permanent Asset &amp; Song Library Manager</span>
        </h3>
        <span className="text-xs text-slate-400">Saved on Server Disk</span>
      </div>

      {/* 1. Saved & Uploaded Wedding Card Templates */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Saved Card Suites (Built-in s1/s2 + Custom JPG/PNG)</span>
          </span>
          <span className="text-slate-500 tabular-nums">{customTemplates.length + 1} saved</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Built-in s1 + s2 Card */}
          <div
            onClick={onSelectBuiltinMultipart}
            className={`h-20 border-2 rounded-xl overflow-hidden cursor-pointer relative bg-slate-950 ${
              activeCustomTemplateId === null ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="grid grid-cols-2 w-full h-full">
              <img src="/assets/aistudio/s1_0b0de8d4.jpeg" alt="s1" className="w-full h-full object-cover" />
              <img src="/assets/aistudio/s2_610b836e.jpeg" alt="s2" className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-1 left-1 bg-slate-950/85 text-[10px] px-1.5 py-0.5 rounded text-amber-300 font-medium">
              s1 + s2
            </span>
            {activeCustomTemplateId === null && (
              <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 rounded-full p-0.5">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {customTemplates.map((tpl, index) => {
            const active = activeCustomTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => onSelectCustomTemplate(tpl)}
                className={`h-20 border-2 rounded-xl overflow-hidden cursor-pointer relative bg-slate-950 ${
                  active ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img src={tpl.part1Url} alt={tpl.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 right-7 truncate bg-slate-950/85 text-[10px] px-1.5 py-0.5 rounded text-slate-200">
                  #{index + 1} {tpl.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                  className="absolute top-1 right-1 p-1 rounded bg-slate-950/85 text-slate-300 hover:text-rose-400 cursor-pointer"
                  title="Remove from library"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Template name (e.g. Royal Gold Walima)"
              className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
            />
            <select
              value={tplCategory}
              onChange={(e) => setTplCategory(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
            >
              <option value="Mehndi">Mehndi</option>
              <option value="Barat">Barat</option>
              <option value="Walima">Walima</option>
              <option value="Nikah">Nikah</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] text-slate-400 block mb-1">Part 1 Image (Required JPG/PNG)</span>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg, image/webp"
                onChange={(e) => setPart1File(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400 block mb-1">Part 2 Image (Optional 2nd Page)</span>
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg, image/webp"
                onChange={(e) => setPart2File(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSaveCustomTemplate}
            disabled={isUploadingTpl || !part1File}
            className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isUploadingTpl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isUploadingTpl ? 'Saving Template to Server...' : 'Save Custom Card to Library'}</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* 2. Custom 30-Sec Song Upload & Saved Library */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom 30-Sec Audio / Song Library (.mp3, .wav, .m4a)</span>
          </span>
          <span className="text-slate-500 tabular-nums">{customSongs.length} custom tracks</span>
        </div>

        {customSongs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customSongs.map((song) => {
              const active = selectedMusicId === song.id;
              const previewing = previewingMusicId === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{song.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Custom · {song.durationSec}s · {song.filename.split('.').pop()?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePreviewMusic(song.id, song.audioUrl);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-cyan-300 cursor-pointer"
                      title={previewing ? 'Stop' : 'Listen'}
                    >
                      {previewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSong(song.id, e)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Delete Track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <input
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Custom song title (optional, e.g. Din Shagna Mix 30s)"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="audio/mp3, audio/wav, audio/mpeg, audio/mp4, audio/x-m4a, audio/ogg"
              onChange={handleSongUpload}
              disabled={isUploadingSong}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer disabled:opacity-50"
            />
            {isUploadingSong && <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />}
          </div>
          <p className="text-[11px] text-slate-500">
            Uploaded 30-second MP3/WAV/M4A clips server library mein permanently save hoti hain aur render ke waqt video ke saath mix ho jati hain.
          </p>
        </div>
      </div>

      {uploadErr && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
          {uploadErr}
        </div>
      )}
      {uploadMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200">
          {uploadMsg}
        </div>
      )}
    </section>
  );
};
export default WCGUploadManager;
