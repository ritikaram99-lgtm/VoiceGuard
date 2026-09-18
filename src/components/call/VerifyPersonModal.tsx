import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Send, Smartphone, WifiOff, X } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { useVoiceGuard } from '../../context/VoiceGuardContext';

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
  const { verificationRequest, sendCallerVerification, pendingCallerLink } = useVoiceGuard();
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!isOpen) return null;

  const deviceStatus = verificationRequest.deviceStatus ?? 'contacting';
  const isUnavailable = deviceStatus === 'unavailable';

  const handleSendVerification = async () => {
    setSendState('sending');
    await sendCallerVerification(isUnavailable ? 'offline' : 'manual');
    setSendState('sent');
  };

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
            <div
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md ${
                isUnavailable ? 'bg-amber-500' : 'bg-blue-600'
              }`}
            >
              {isUnavailable ? <WifiOff className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {isUnavailable ? (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold tracking-wide">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{claimedName.toUpperCase()} UNAVAILABLE</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {claimedName}'s registered device could not be reached
            </h3>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              This does not mean the call is fraudulent — identity just couldn't be independently
              confirmed this way yet.
            </p>

            {sendState === 'sent' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verification link sent to the anonymous number</span>
                </div>
                {pendingCallerLink && (
                  <p className="font-mono text-[11px] text-emerald-800 break-all">{pendingCallerLink.link}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={sendState === 'sending'}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {sendState === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send Verification to Caller</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>CONTACTING {claimedName.toUpperCase()}</span>
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
                <span className="font-semibold text-blue-700">"Is this you speaking with Mom?"</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              VoiceGuard never relies solely on voice heuristics. We verify identity through the human's authenticated device.
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
                <span>Open {claimedName}'s Trusted Device</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>

            {/* Spec condition 4: an immediate manual option, no waiting required */}
            <div className="pt-1">
              {sendState === 'sent' ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verification link sent to the anonymous number</span>
                  </div>
                  {pendingCallerLink && (
                    <p className="font-mono text-[10px] text-emerald-800 break-all">{pendingCallerLink.link}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={sendState === 'sending'}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-bold rounded-2xl text-xs border border-slate-200 transition flex items-center justify-center gap-2"
                >
                  {sendState === 'sending' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Verification to Caller Instead</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
