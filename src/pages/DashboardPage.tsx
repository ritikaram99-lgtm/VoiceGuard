import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { useVoiceGuard } from '../context/VoiceGuardContext';
import { Avatar } from '../components/common/Avatar';
import { StatusRing } from '../components/common/StatusRing';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyMembers, recentEvents, startDemoCall } = useVoiceGuard();


  const handleStartCall = () => {
    startDemoCall();
    navigate('/mom');
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* Top Greeting & Active User */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Family Guardian
            </span>
            <span className="text-xs text-slate-400 font-mono">Synced</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Good evening, Mom
          </h1>
          <p className="text-sm text-slate-500">
            VoiceGuard helps verify trusted identities and detect suspicious voice interactions.
          </p>

        </div>

        {/* Mom User Header Capsule */}
        <div className="flex items-center gap-3 p-2 pr-4 bg-white rounded-full border border-slate-200/80 shadow-sm self-start sm:self-auto">
          <Avatar name="Mom" role="mom" size="sm" isOnline />
          <div>
            <div className="text-xs font-bold text-slate-900">Ananya Sharma</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Protected Device
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero: Organic Security Protection Visualization */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white to-slate-50/70 p-6 sm:p-12 border border-slate-200/80 shadow-sm">
        {/* Subtle decorative background circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-emerald-50/60 pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
          {/* Large Circular Living Status Element */}
          <div className="relative my-2">
            <StatusRing status="safe" size={170} strokeWidth={4} animate>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center text-emerald-700 shadow-inner border border-emerald-200/60 p-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md mb-1.5">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                  PROTECTED
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  3 Members Safe
                </span>
              </div>
            </StatusRing>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your Family is Protected
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Identity verification and suspicious call risk signals designed for family voice communication.
            </p>

          </div>

          {/* Prominent CTA */}
          <div className="pt-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStartCall}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-3 group"
            >
              <PhoneCall className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>START DEMO CALL</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Family Members Section: Large Beautiful Circular Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Family Members</h3>
            <p className="text-xs text-slate-500">Connected trusted devices</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            All 3 Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {familyMembers.map((member) => {
            const isCall = member.protectionStatus === 'active_call';
            const isAlert = member.protectionStatus === 'alert';

            return (
              <div
                key={member.id}
                className="group relative bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4"
              >
                {/* Large Avatar with Status Ring */}
                <Avatar
                  name={member.name}
                  role={member.role}
                  size="md"
                  showRing
                  status={isAlert ? 'HIGH RISK' : isCall ? 'active_call' : 'safe'}
                  isOnline={member.status === 'online'}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-extrabold text-base text-slate-900 truncate">
                      {member.name}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400 capitalize">
                      {member.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 truncate mb-2">
                    {member.device}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAlert ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Alert Flagged
                      </span>
                    ) : isCall ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        In Protected Call
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Protection: Minimal (2-3 Events, No Giant Table!) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Protection</h3>
            <p className="text-xs text-slate-500">Autonomous safeguards applied recently</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 48h</span>
        </div>

        <div className="space-y-2.5">
          {recentEvents.slice(0, 3).map((event) => {
            const isSuspicious = event.type === 'suspicious' || event.type === 'impersonation';
            return (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSuspicious
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isSuspicious ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {event.title}
                    </h4>
                    <p className="text-xs text-slate-500">{event.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
