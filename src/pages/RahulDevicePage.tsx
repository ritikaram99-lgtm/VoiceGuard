import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useVoiceGuard } from '../context/VoiceGuardContext';
import { Avatar } from '../components/common/Avatar';
import { StatusRing } from '../components/common/StatusRing';


export const RahulDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { verificationRequest, respondRahul, resetDemo, recentEvents, sendCallerVerification, callId } = useVoiceGuard();
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const isPending = verificationRequest.status === 'pending';
  const isAnsweredYes = verificationRequest.status === 'confirmed_yes';
  const isAnsweredNo = verificationRequest.status === 'confirmed_no';
  const isAnswered = isAnsweredYes || isAnsweredNo;
  const isIdle = !isPending && !isAnswered;

  const handleSendVerification = async () => {
    setSendState('sending');
    await sendCallerVerification('requested_by_son');
    setSendState('sent');
  };

  if (isIdle) {
    // Rahul's own dashboard — distinct from Mom's, showing his device's
    // protection status rather than an incoming-call view he has none of.
    return (
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 sm:py-12 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-mono text-slate-600">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Pixel 9 Pro • Trusted Device</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">VG-SEC-AUTH</span>
          </div>

          <div className="flex items-center gap-4">
            <Avatar name="Rahul" role="son" size="lg" showRing status="safe" isOnline />
            <div>
              <h1 className="text-xl font-black text-slate-900">Rahul's Device</h1>
              <p className="text-xs text-slate-500">
                No identity verification request is currently pending.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-emerald-900">This device is registered and reachable</p>
              <p className="text-xs text-emerald-700">
                If someone calls Mom claiming to be you, a confirmation prompt will appear here instantly.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">Recent family activity</h3>
            {recentEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{event.title}</span>
                </div>
                <span className="text-slate-400">{event.timestamp}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h3 className="text-sm font-bold text-slate-800">If you'd rather not use this device to confirm</h3>
            <p className="text-xs text-slate-500">
              You can request that the caller prove their identity with your VoiceGuard login instead —
              useful if a call is in progress but confirming here isn't convenient right now.
            </p>
            {sendState === 'sent' ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verification message sent to the caller.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={sendState === 'sending' || !callId}
                className="py-2.5 px-4 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                {sendState === 'sending' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Verification Message</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full px-4 py-8 sm:py-12">
      {/* Device Shell Frame Container */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden text-center space-y-6">
        {/* Device Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 font-mono text-slate-600">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Pixel 9 Pro • Trusted Device</span>
          </div>

          <span className="font-mono text-[11px] text-slate-400">VG-SEC-AUTH</span>
        </div>

        {!isAnswered ? (
          /* Active Confirmation Prompt */
          <>
            {/* Identity Visual */}
            <div className="flex justify-center my-2">
              <Avatar
                name="Rahul"
                role="son"
                size="xl"
                showRing
                status={verificationRequest.status === 'pending' ? 'verifying' : 'safe'}
                isOnline
              />
            </div>

            {/* Prompt Heading */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Identity Verification Prompt</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                IS THIS YOU?
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                Someone is currently on an active voice call claiming to be{' '}
                <span className="font-bold text-slate-900">Rahul</span>.
              </p>
            </div>

            {/* Context Card */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Speaking with:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-500" /> Mom (Protected Line)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Claimed Identity:</span>
                <span className="font-bold text-blue-700">Rahul Sharma (Son)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Call Reference:</span>
                <span className="font-mono font-bold text-slate-700">
                  {verificationRequest.callId}
                </span>
              </div>
            </div>

            {/* Two Major Touch-Friendly Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* YES Action */}
              <button
                type="button"
                onClick={() => respondRahul(true)}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>YES, THAT’S ME</span>
              </button>

              {/* NO Action */}
              <button
                type="button"
                onClick={() => respondRahul(false)}
                className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-base shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <X className="w-6 h-6 stroke-[3]" />
                <span>NO, THAT’S NOT ME</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Only tap YES if you are speaking on this voice line right now.
            </p>
          </>
        ) : isAnsweredYes ? (
          /* YES State: Identity Verified */
          <div className="space-y-5 py-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <StatusRing status="VERIFIED" size={130} strokeWidth={4}>
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </StatusRing>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Identity Confirmed
              </span>
              <h2 className="text-2xl font-black text-slate-900">IDENTITY VERIFIED</h2>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                ✓ Rahul confirmed his identity via his registered trusted device.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/mom')}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
              >
                <span>Return to Mom’s Call</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetDemo}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Reset Demo
              </button>
            </div>
          </div>
        ) : (
          /* NO State: Impersonation Confirmed */
          <div className="space-y-5 py-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <StatusRing status="HIGH RISK" size={130} strokeWidth={4}>
                <div className="w-24 h-24 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-12 h-12" />
                </div>
              </StatusRing>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Human Confirmation Override
              </span>
              <h2 className="text-2xl font-black text-rose-600">
                IMPERSONATION CONFIRMED
              </h2>
              <p className="text-sm text-slate-700 max-w-xs mx-auto font-medium">
                The caller could not be trusted as Rahul. The trusted device owner explicitly confirmed this is not them.
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-900 text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <ShieldCheck className="w-4 h-4" />
                Safeguards Activated:
              </div>
              <p>• Mom’s call flagged and sensitive actions blocked</p>
              <p>• Family Shield alert dispatched to Dad</p>
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/dad')}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/25"
              >
                <span>View Dad’s Family Shield</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetDemo}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
