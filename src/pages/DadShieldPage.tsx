import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import { useVoiceGuard } from '../context/VoiceGuardContext';
import { Avatar } from '../components/common/Avatar';
import { StatusRing } from '../components/common/StatusRing';

export const DadShieldPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyAlert, riskLevel, setIsIncidentModalOpen } = useVoiceGuard();


  const isAlertActive =
    !!familyAlert?.isTriggered ||
    riskLevel === 'IMPERSONATION CONFIRMED' ||
    riskLevel === 'IMPERSONATION DETECTED';

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-center">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
        {/* Device Top Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>DAD’S GUARDIAN CONSOLE</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Node: VG-DAD-02</span>
        </div>

        {isAlertActive ? (
          /* ALERT STATE: IMPERSONATION ATTEMPT DETECTED */
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            {/* Visual Ring Alert */}
            <div className="flex justify-center my-2">
              <StatusRing status="HIGH RISK" size={150} strokeWidth={4} animate>
                <div className="w-28 h-28 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-14 h-14 animate-pulse" />
                </div>
              </StatusRing>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Family Shield Emergency
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                IMPERSONATION ATTEMPT DETECTED
              </h1>
              <p className="text-sm font-semibold text-slate-700 max-w-sm mx-auto">
                Someone attempted to impersonate Rahul on Mom’s phone.
              </p>
            </div>

            {/* Compact Incident Summary */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Claimed Identity:</span>
                <span className="font-bold text-slate-900">Rahul (Son)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Caller:</span>
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Unknown / Spoofed VoIP
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Risk Assessment:</span>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  HIGH RISK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Device Verification:</span>
                <span className="font-bold text-rose-700 flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5" /> REJECTED BY RAHUL
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(true)}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>VIEW INCIDENT CAPSULE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/mom')}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl text-xs transition"
              >
                Inspect Mom’s Call Screen
              </button>
            </div>
          </div>
        ) : (
          /* CALM DEFAULT STATE: FAMILY SHIELD SAFE */
          <div className="space-y-6 py-4">
            <div className="flex justify-center my-2">
              <StatusRing status="safe" size={150} strokeWidth={4} animate>
                <div className="w-28 h-28 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-14 h-14" />
                </div>
              </StatusRing>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                Active Guardian
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                FAMILY SHIELD
              </h1>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                ✓ Your family is protected. VoiceGuard is monitoring trusted voice interactions.
              </p>

            </div>

            {/* Member Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Shield Coverage
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar name="Mom" role="mom" size="sm" />
                  <span className="font-semibold text-slate-800">Mom’s iPhone</span>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shield Armed
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar name="Rahul" role="son" size="sm" />
                  <span className="font-semibold text-slate-800">Rahul’s Pixel</span>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Trusted Device
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/mom')}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md transition"
              >
                Go to Active Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
