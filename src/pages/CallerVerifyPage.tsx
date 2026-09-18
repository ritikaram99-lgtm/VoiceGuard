import React, { useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { DEMO_CREDENTIALS } from '../data/mockData';
import { useVoiceGuard } from '../context/VoiceGuardContext';


export const CallerVerifyPage: React.FC = () => {
  const { callId, setRiskLevel } = useVoiceGuard();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [verifyState, setVerifyState] = useState<'default' | 'verifying' | 'success' | 'failed'>('default');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyState('verifying');

    setTimeout(() => {
      if (
        loginId.trim() === DEMO_CREDENTIALS.loginId &&
        password.trim() === DEMO_CREDENTIALS.password
      ) {
        setVerifyState('success');
        setRiskLevel('IDENTITY VERIFIED');
      } else {
        setVerifyState('failed');
        setRiskLevel('IDENTITY VERIFICATION FAILED');
      }
    }, 1200);
  };

  const autofillCorrect = () => {
    setLoginId(DEMO_CREDENTIALS.loginId);
    setPassword(DEMO_CREDENTIALS.password);
  };

  const autofillWrong = () => {
    setLoginId('scammer_99');
    setPassword('fake-pass-1234');
  };

  const handleReset = () => {
    setLoginId('');
    setPassword('');
    setVerifyState('default');
  };

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-center">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
        {/* Top Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
        </div>

        {verifyState === 'default' || verifyState === 'verifying' ? (
          <>
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                VoiceGuard Security Check
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                IDENTITY VERIFICATION REQUIRED
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                You are claiming to be <span className="font-bold text-slate-900">Rahul</span> on call{' '}
                <span className="font-mono font-bold text-slate-800">{callId}</span>.
              </p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Login ID / Registered Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. rahul_001"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Secure Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyState === 'verifying'}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-extrabold rounded-2xl text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                {verifyState === 'verifying' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>VERIFYING CREDENTIALS...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>VERIFY IDENTITY</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Test Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
                Demo Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={autofillCorrect}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 transition"
                >
                  Autofill Correct (Rahul)
                </button>
                <button
                  type="button"
                  onClick={autofillWrong}
                  className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition"
                >
                  Autofill Fake (Scammer)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              “This verification link is one-time use and expires soon.”
            </p>
          </>
        ) : verifyState === 'success' ? (
          /* SUCCESS STATE */
          <div className="space-y-5 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-emerald-700">
                IDENTITY VERIFIED
              </h2>
              <p className="text-sm font-semibold text-slate-700">
                Identity confirmed. Voice line authorization granted.
              </p>
              <p className="text-xs text-slate-500">
                The call status on Mom’s screen has been updated to verified.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Test Another Login</span>
              </button>
            </div>
          </div>
        ) : (
          /* FAILED STATE */
          <div className="space-y-5 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-rose-600">
                IDENTITY VERIFICATION FAILED
              </h2>
              <p className="text-sm font-semibold text-slate-800">
                Identity could not be verified.
              </p>
              <p className="text-xs text-slate-500">
                Incorrect credentials provided. This incident has been logged and sensitive actions locked.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
