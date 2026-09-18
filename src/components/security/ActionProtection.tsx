import React from 'react';
import { Ban, CheckCircle2, Lock, ShieldAlert, X } from 'lucide-react';
import type { ActionProtectionState } from '../../types';


interface ActionProtectionProps {
  protection: ActionProtectionState;
  onDismiss: () => void;
  onViewIncident?: () => void;
}

export const ActionProtection: React.FC<ActionProtectionProps> = ({
  protection,
  onDismiss,
  onViewIncident,
}) => {
  if (!protection.isTriggered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-200 text-center animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Large Security Shield Visual */}
        <div className="flex justify-center mb-4 mt-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Alert Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold tracking-wider uppercase mb-2">
          <Ban className="w-3.5 h-3.5 text-rose-700" />
          <span>Action Protected</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
          Sensitive Action Blocked
        </h3>

        <p className="text-sm font-semibold text-rose-800 bg-rose-50/90 py-2 px-3 rounded-xl border border-rose-100 mb-4">
          “The caller's identity could not be independently verified.”
        </p>

        <p className="text-xs text-slate-600 leading-relaxed mb-5">
          {protection.reason ||
            'This action has been temporarily blocked for your protection. VoiceGuard prevented OTP credential leakage to an unverified voice.'}
        </p>

        {/* Protected items breakdown */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2 mb-6">
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Attempted Action:
            </span>
            <span className="font-bold text-slate-900">{protection.actionType}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span className="text-slate-600">Enforcement:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Safeguarded by VoiceGuard
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onViewIncident && (
            <button
              type="button"
              onClick={() => {
                onDismiss();
                onViewIncident();
              }}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition"
            >
              View Incident Capsule
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
