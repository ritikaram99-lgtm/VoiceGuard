import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { RISK_SIGNALS } from '../../data/mockData';

interface WhyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyPerson: () => void;
}

export const WhyPanel: React.FC<WhyPanelProps> = ({
  isOpen,
  onClose,
  onVerifyPerson,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-sm transition-all duration-300">
      {/* Click outside to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet Content Container */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        {/* Top Handle for mobile sheet feel */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Why is this call suspicious?
              </h3>
              <p className="text-xs text-slate-500">
                VoiceGuard detected 3 risk signals in this live call
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Signal Items */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {RISK_SIGNALS.map((signal) => (
            <div
              key={signal.id}
              className="p-4 rounded-2xl bg-[#F8F9FA] border border-slate-200/80 hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {signal.title}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {signal.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* CRITICAL PRODUCT PRINCIPLE ALERT BOX */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-900">
                  Important: this is a risk signal, not proof
                </p>
                <p className="text-blue-800/90 leading-relaxed">
                  Voice analysis flags acoustic variance, but voice alone does not prove identity.
                  Verify the person through their registered trusted device before taking any action.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Primary CTA */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onVerifyPerson();
            }}
            className="flex-1 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>VERIFY PERSON NOW</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-2xl transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
