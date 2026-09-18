import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, type BackendAnalyzeResponse, BACKEND_URL, DEFAULT_FAMILY_ID } from '../../services/api';


interface LiveMicRecorderProps {
  callId: string;
  onCallIdUpdated?: (newCallId: string) => void;
  onAnalysisSuccess: (result: BackendAnalyzeResponse) => void;
}

export const LiveMicRecorder: React.FC<LiveMicRecorderProps> = ({
  callId,
  onCallIdUpdated,
  onAnalysisSuccess,
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'complete' | 'error'>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<BackendAnalyzeResponse | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up recording and timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Helper to ensure backend has an active call before sending audio
  const ensureValidCallId = async (currentId: string): Promise<string> => {
    try {
      const check = await fetch(`${BACKEND_URL}/api/calls/${currentId}`);
      if (check.ok) return currentId;
    } catch {
      // Backend check failed, attempt to start call
    }
    const started = await api.startCall(DEFAULT_FAMILY_ID, 'demo-son', '+91 98765 43210', 'normal');
    if (started?.call_id) {
      await api.acceptCall(started.call_id);
      if (onCallIdUpdated) onCallIdUpdated(started.call_id);
      return started.call_id;
    }
    return currentId;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setLastAnalysis(null);

    // Verify browser support
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this browser.');
      setStatus('error');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setErrorMessage('MediaRecorder is not supported in this browser.');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect supported mime type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const totalBytes = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);

        if (elapsed < 0.5 || totalBytes < 500) {
          setErrorMessage('Recording was too short. Please speak a sentence and try again.');
          setStatus('error');
          return;
        }

        setStatus('processing');
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });

        try {
          const activeCallId = await ensureValidCallId(callId);
          // Send raw audio Blob to analyze endpoint with NO manually constructed transcript
          const response = await api.analyzeCall(activeCallId, undefined, audioBlob);

          if (response && response.transcript !== undefined) {
            setLastAnalysis(response);
            setStatus('complete');
            onAnalysisSuccess(response);
            // Revert status to idle after 4 seconds
            setTimeout(() => {
              setStatus((prev) => (prev === 'complete' ? 'idle' : prev));
            }, 4000);
          } else {
            setErrorMessage('Backend transcription failed. Please verify the backend is running.');
            setStatus('error');
          }
        } catch (err: any) {
          setErrorMessage(`Analysis failed: ${err?.message || 'Server error'}`);
          setStatus('error');
        }
      };

      startTimeRef.current = Date.now();
      setDuration(0);
      mediaRecorder.start(200);
      setStatus('recording');

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setErrorMessage(`Failed to start microphone: ${err.message || 'Unknown error'}`);
      }
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-2 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-left transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Live Microphone Analysis</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Speak into your mic to test real-time transcription & risk analysis
            </div>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {status === 'recording' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>{formatTime(duration)}</span>
            </span>
          )}
          {status === 'processing' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Analyzing...</span>
            </span>
          )}
          {status === 'complete' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Done</span>
            </span>
          )}
          {status === 'idle' && (
            <span className="text-[11px] font-medium text-slate-400">Mic Ready</span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-2.5 flex items-center gap-2">
        {status === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Record Voice (Click to Speak)</span>
          </button>
        )}

        {status === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop & Analyze</span>
          </button>
        )}

        {status === 'processing' && (
          <div className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Transcribing audio & evaluating risk...</span>
          </div>
        )}

        {status === 'complete' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200"
          >
            <Mic className="w-4 h-4 text-blue-600" />
            <span>Record Another Sample</span>
          </button>
        )}

        {status === 'error' && (
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex items-center justify-center gap-2 border border-rose-200"
          >
            <Mic className="w-4 h-4 text-rose-600" />
            <span>Try Recording Again</span>
          </button>
        )}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-tight">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Last Result Summary Banner */}
      {lastAnalysis && status === 'complete' && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-slate-600">Transcript:</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                lastAnalysis.risk_level === 'HIGH'
                  ? 'bg-rose-100 text-rose-800'
                  : lastAnalysis.risk_level === 'SUSPICIOUS'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {lastAnalysis.risk_level} RISK ({lastAnalysis.risk_score}/100)
            </span>
          </div>
          <p className="italic text-slate-800 bg-white p-2 rounded border border-slate-200/60 font-medium">
            "{lastAnalysis.transcript}"
          </p>
          {lastAnalysis.why && lastAnalysis.why.length > 0 && (
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-1 pt-0.5">
              <span className="font-semibold text-slate-600">Signals:</span>
              {lastAnalysis.why.map((label, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
