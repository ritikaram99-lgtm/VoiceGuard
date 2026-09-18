import {
  AlertTriangle,
  Clock,
  Fingerprint,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  UserX,
  X,
} from 'lucide-react';
import type { Incident } from '../../types';


interface IncidentCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident;
}

export const IncidentCapsule: React.FC<IncidentCapsuleProps> = ({
  isOpen,
  onClose,
  incident,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {incident.callId}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase">
                  {incident.riskLevel}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Incident Capsule</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="py-5 space-y-4 text-xs sm:text-sm">
          {/* Identities */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Claimed Identity
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {incident.claimedIdentity}
              </div>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Incoming Caller
              </span>
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <PhoneCall className="w-3.5 h-3.5" />
                {incident.caller}
              </div>
            </div>
          </div>

          {/* Risk Signals */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Risk Signals Detected
            </span>
            <ul className="space-y-1.5 pl-1">
              {incident.conversationSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-amber-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Voice vs Identity Verification Matrix */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Fingerprint className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Acoustic Voice Match Analysis:
                </span>
                <span className="text-xs text-slate-600 leading-tight">
                  {incident.voiceResult}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <UserX className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-rose-900 block">
                  Trusted Human Verification:
                </span>
                <span className="text-xs text-rose-800 font-medium leading-tight">
                  {incident.verificationResult}
                </span>
              </div>
            </div>
          </div>

          {/* Action Taken */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Protection Action Enforced
            </span>
            <p className="text-xs text-emerald-950 font-medium">
              {incident.actionTaken}
            </p>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Logged {incident.timestamp}
            </span>
            <span className="font-mono text-[11px] text-slate-500">Security Node: VG-HYD-04</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition shadow"
          >
            Close Incident
          </button>
        </div>
      </div>
    </div>
  );
};
