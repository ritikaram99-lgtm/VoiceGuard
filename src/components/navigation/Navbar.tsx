import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  KeyRound,
  LayoutDashboard,
  PhoneCall,
  Shield,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { useVoiceGuard } from '../../context/VoiceGuardContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { callStatus, riskLevel, verificationRequest, familyAlert } = useVoiceGuard();

  const isCallActive = callStatus === 'connected' || callStatus === 'verifying';
  const isPendingRahul = verificationRequest.status === 'pending';
  const isDadAlert = !!familyAlert?.isTriggered;

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      path: '/mom',
      label: 'Mom (Call)',
      icon: PhoneCall,
      badge: isCallActive ? (
        <span
          className={`w-2 h-2 rounded-full ${
            riskLevel === 'HIGH RISK' || riskLevel === 'IMPERSONATION CONFIRMED'
              ? 'bg-rose-500 animate-ping'
              : 'bg-emerald-500 animate-pulse'
          }`}
        />
      ) : null,
    },
    {
      path: '/rahul',
      label: 'Rahul (Device)',
      icon: Smartphone,
      badge: isPendingRahul ? (
        <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold animate-bounce">
          1
        </span>
      ) : null,
    },
    {
      path: '/dad',
      label: 'Dad (Shield)',
      icon: ShieldCheck,
      badge: isDadAlert ? (
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
      ) : null,
    },
    {
      path: '/caller',
      label: 'Anonymous Call',
      icon: KeyRound,
      badge: null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Tagline */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-display">
                  VOICEGUARD
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hidden sm:inline-block">
                  Trust Layer
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block tracking-tight">
                “Never trust a voice. Verify the person.”
              </p>
            </div>
          </Link>

          {/* Role Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge}
                </Link>
              );
            })}
          </nav>

          {/* Quick Status / Help Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Family Shield Active</span>
              <span className="sm:hidden font-bold">Shield</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Role Switcher Scrollable Bar */}
      <div className="md:hidden flex items-center gap-1 px-3 py-2 bg-slate-50 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge}
            </Link>
          );
        })}
      </div>
    </header>
  );
};
