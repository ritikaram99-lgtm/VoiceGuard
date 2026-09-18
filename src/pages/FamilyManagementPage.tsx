import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, LogOut, Pencil, Phone, Shield, X } from 'lucide-react';
import { api, DEFAULT_FAMILY_ID } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { clearSessionUser, getSessionUser } from './FamilyLoginPage';

interface Member {
  user_id: string;
  name: string;
  role: 'mom' | 'dad' | 'son';
  phone: string;
  login_id: string | null;
  online: boolean;
}

export const FamilyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [session] = useState(getSessionUser());
  const [members, setMembers] = useState<Member[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    api.getFamily(DEFAULT_FAMILY_ID).then((res) => {
      if (res?.members) setMembers(res.members);
    });
  }, [session, navigate]);

  if (!session) return null;

  const startEdit = (member: Member) => {
    setEditingId(member.user_id);
    setLoginId(member.login_id || '');
    setPassword('');
    setSavedId(null);
  };

  const saveEdit = async (userId: string) => {
    const fields: { login_id?: string; password?: string } = {};
    if (loginId.trim()) fields.login_id = loginId.trim();
    if (password.trim()) fields.password = password.trim();
    const res = await api.updateMemberCredentials(userId, fields);
    if (res.ok) {
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, login_id: res.data.login_id } : m)));
      setSavedId(userId);
      setEditingId(null);
    }
  };

  const handleLogout = () => {
    clearSessionUser();
    navigate('/login');
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Family Settings</h1>
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-bold text-slate-700">{session.name}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.user_id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <Avatar name={member.name} role={member.role} size="md" showRing isOnline={member.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900">{member.name}</h3>
                  {member.user_id === session.user_id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">You</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phone}</span>
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> {member.login_id || 'not set'}
                  </span>
                </div>
              </div>
              {savedId === member.user_id ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(member)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {editingId === member.user_id && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Login ID</label>
                    <input
                      type="text"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(member.user_id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900">
          These are the same credentials used on the identity verification page a caller sees when their
          claimed identity can't be confirmed another way.
        </p>
      </div>
    </div>
  );
};
