import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  KeyRound,
  Lock,
  Loader2,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { api, DEFAULT_FAMILY_ID } from '../services/api';

type Step = 'phone' | 'otp' | 'set_credentials' | 'credentials_login';

const SESSION_KEY = 'voiceguard_session_user';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const FamilyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const completeLogin = (user: { user_id: string; name: string; role: string; family_id: string }) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    navigate('/family');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const family = await api.getFamily(DEFAULT_FAMILY_ID);
    setBusy(false);
    const member = family?.members?.find((m: any) => m.phone === phone.trim());
    if (!member) {
      setError('No VoiceGuard family account is registered to that number.');
      return;
    }
    setMatchedUser(member);
    const code = generateOtp();
    setDemoOtp(code);
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== demoOtp) {
      setError('Incorrect code. Please try again.');
      return;
    }
    setError('');
    if (matchedUser?.login_id) {
      // Returning member — phone+OTP alone is enough, credentials already exist.
      completeLogin({
        user_id: matchedUser.user_id,
        name: matchedUser.name,
        role: matchedUser.role,
        family_id: DEFAULT_FAMILY_ID,
      });
    } else {
      // First-time — have them set their login credentials now.
      setStep('set_credentials');
    }
  };

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await api.updateMemberCredentials(matchedUser.user_id, { login_id: loginId.trim(), password });
    setBusy(false);
    if (!res.ok) {
      setError('Could not save credentials. Try a different login ID.');
      return;
    }
    completeLogin({
      user_id: matchedUser.user_id,
      name: matchedUser.name,
      role: matchedUser.role,
      family_id: DEFAULT_FAMILY_ID,
    });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await api.familyLogin(loginId.trim(), password);
    setBusy(false);
    if (res.data?.status !== 'OK') {
      setError(res.data?.message || 'Invalid login ID or password.');
      return;
    }
    completeLogin({
      user_id: res.data.user_id,
      name: res.data.name,
      role: res.data.role,
      family_id: res.data.family_id,
    });
  };

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 py-10 sm:py-16 flex flex-col justify-center">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900">Sign in to Family Settings</h1>
              <p className="text-xs text-slate-500">Enter your registered phone number to get started.</p>
            </div>
            <div className="relative text-left">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 90000 00001"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Send Verification Code</span>
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials_login'); setError(''); }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Already set up? Sign in with login ID instead
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900">Enter verification code</h1>
              <p className="text-xs text-slate-500">Sent to {phone}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              Demo mode — no real SMS is sent. Your code is: <span className="font-mono text-sm">{demoOtp}</span>
            </div>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className="w-full text-center tracking-[0.4em] font-mono text-lg px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Code</span>
            </button>
          </form>
        )}

        {step === 'set_credentials' && (
          <form onSubmit={handleSetCredentials} className="space-y-4 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900">Set up your login</h1>
              <p className="text-xs text-slate-500">
                First time signing in, {matchedUser?.name}. Choose a login ID and password for next time.
              </p>
            </div>
            <div className="relative text-left">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Choose a login ID"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="relative text-left">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save & Continue</span>
            </button>
          </form>
        )}

        {step === 'credentials_login' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900">Sign in</h1>
              <p className="text-xs text-slate-500">Use your VoiceGuard login ID and password.</p>
            </div>
            <div className="relative text-left">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Login ID"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="relative text-left">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              First time? Verify with your phone number instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const getSessionUser = (): { user_id: string; name: string; role: string; family_id: string } | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSessionUser = () => {
  sessionStorage.removeItem(SESSION_KEY);
};
