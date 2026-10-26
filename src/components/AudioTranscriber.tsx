import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Copy, 
  Check, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Volume2 
} from 'lucide-react';

export const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.warn('AudioTranscriber microphone permission notice:', err?.name || err?.message || err);
      setIsRecording(false);
      setError('Microphone permission allow nahi hui ya browser mein blocked hai. Browser URL bar mein mic allow karein ya audio file upload karein.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleTranscribe = async () => {
    if (!audioBlob || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result as string;

        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Audio,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Transcription failed with status ${res.status}`);
        }

        const data = await res.json();
        setTranscription(data.text || '');
        setIsLoading(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio.');
      setIsLoading(false);
    }
  };

  const copyTranscription = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                <Mic className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Audio Transcription & Voice Dictation
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Model: <strong className="text-emerald-400 font-mono">gemini-3.5-transcribe</strong>. Waqar Majeed ki voice dictation aur voiceovers ko accurate Roman Urdu aur English text mein convert karein.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded-xl">
              Gemini 3.5 Transcribe
            </span>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recording Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Record or Upload Voice Note:
          </span>

          <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-4 text-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-500/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <div>
              <p className="text-xs font-bold text-white">
                {isRecording ? 'Listening... Bolna shuru karein' : 'Click microphone to start recording'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRecording ? 'Click again to stop recording' : 'Or upload an existing audio file below'}
              </p>
            </div>
          </div>

          {/* Audio Player if available */}
          {audioUrl && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Recorded Audio Clip:
              </span>
              <audio src={audioUrl} controls className="w-full h-8" />
            </div>
          )}

          {/* Upload File Fallback */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 flex items-center gap-2 transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Audio File</span>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={isLoading || isRecording}
              />
            </label>

            <button
              onClick={handleTranscribe}
              disabled={!audioBlob || isLoading || isRecording}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white font-bold rounded-xl transition-opacity flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Transcribing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Transcribe to Text
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="break-words whitespace-pre-wrap leading-relaxed">{error}</span>
            </div>
          )}
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Transcribed Output (Roman Urdu / English):
              </span>
              {transcription && (
                <button
                  onClick={copyTranscription}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Text
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-4 min-h-[260px] text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap select-text">
              {transcription ? (
                transcription
              ) : (
                <span className="text-slate-600 italic">
                  Transcribed voice text will appear here. You can paste it directly into your story proposition or script editor.
                </span>
              )}
            </div>
          </div>

          {transcription && (
            <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Ready to copy
              </span>
              <span>Length: {transcription.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
