import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useVoiceGuard } from '../../context/VoiceGuardContext';
import type { DemoStep } from '../../types';


export const DemoFloatingBar: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { demoStep, runDemoStep, resetDemo } = useVoiceGuard();

  const steps: { step: DemoStep; label: string; desc: string; route?: string }[] = [
    { step: 1, label: '1. Normal Call', desc: 'Rahul calls Mom (Low Risk)', route: '/mom' },
    { step: 2, label: '2. Urgent OTP Request', desc: 'Synthetic urgent OTP request triggered', route: '/mom' },
    { step: 3, label: '3. Verify Person', desc: 'Mom dispatches secure prompt to Rahul', route: '/mom' },
    { step: 4, label: '4. Rahul Confirms NO', desc: 'Rahul explicitly rejects: Not me!', route: '/rahul' },
    { step: 5, label: '5. Protected & Alerted', desc: 'Action blocked & Dad Family Shield alert', route: '/dad' },
  ];

  const handleStepClick = (s: DemoStep, route?: string) => {
    runDemoStep(s);
    if (route) {
      navigate(route);
    }
  };

  return (
    <aside aria-label="Demo Controls" className="fixed bottom-4 right-4 z-40">
      {/* Collapsed Pill */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-xl backdrop-blur-md border border-slate-700/60 text-xs font-bold transition-all hover:scale-105 active:scale-95"
          title="Open Pitch / Demo Story Controls"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Controller</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
            Step {demoStep}/5
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Expanded Controller Card */
        <div className="w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-300/80 text-left animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Hackathon Story Controller
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetDemo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Reset to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Minimize controller"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Sequence Buttons */}
          <div className="space-y-1.5 mb-3">
            {steps.map((item) => {
              const isCurrent = demoStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => handleStepClick(item.step, item.route)}
                  className={`w-full text-left p-2.5 rounded-2xl text-xs transition flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200/60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-full bg-blue-700 text-blue-100 font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] leading-tight ${
                        isCurrent ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <Play
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                      isCurrent
                        ? 'text-white translate-x-0.5'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Role Switcher Jump */}
          <div className="pt-2 border-t border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Multi-Window Navigation
            </span>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-center">
              {[
                { label: 'Dash', path: '/dashboard' },
                { label: 'Mom', path: '/mom' },
                { label: 'Rahul', path: '/rahul' },
                { label: 'Dad', path: '/dad' },
                { label: 'Caller', path: '/caller' },
              ].map((r) => (
                <button
                  key={r.path}
                  type="button"
                  onClick={() => navigate(r.path)}
                  className="py-1 px-1 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 text-slate-700 rounded-lg transition text-[10px] font-bold"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
