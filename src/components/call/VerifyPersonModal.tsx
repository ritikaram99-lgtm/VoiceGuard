import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, ShieldCheck, Smartphone, X } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';

interface VerifyPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimedName?: string;
  callId?: string;
}

export const VerifyPersonModal: React.FC<VerifyPersonModalProps> = ({
  isOpen,
  onClose,
  claimedName = 'Rahul',
  callId = 'VG-2841',
}) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'sending' | 'sent'>('sending');

  useEffect(() => {
    if (isOpen) {
      setPhase('sending');
      const timer = setTimeout(() => {
        setPhase('sent');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Identity Circle */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <Avatar name={claimedName} role="son" size="lg" showRing status="verifying" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Phase State Content */}
        {phase === 'sending' ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>DISPATCHING SECURE PROMPT</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Verifying Person</h3>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Sending a confirmation prompt to {claimedName}’s registered trusted device…
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>REQUEST SENT</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Waiting for {claimedName} to confirm
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Device:</span>
                <span className="font-semibold text-slate-800">Pixel 9 Pro (Trusted Device)</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Call ID:</span>
                <span className="font-mono font-semibold text-slate-800">{callId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prompt:</span>
                <span className="font-semibold text-blue-700">“Is this you speaking with Mom?”</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              VoiceGuard never relies solely on voice heuristics. We verify identity through the human’s authenticated device.
            </p>

            {/* Quick action to navigate to Rahul's screen for demonstration */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/rahul');
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Rahul’s Trusted Device</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
