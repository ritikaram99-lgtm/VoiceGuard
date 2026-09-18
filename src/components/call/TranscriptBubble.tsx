import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import type { TranscriptMessage } from '../../types';


interface TranscriptBubbleProps {
  messages: TranscriptMessage[];
  onOpenWhy: () => void;
  className?: string;
}

export const TranscriptBubble: React.FC<TranscriptBubbleProps> = ({
  messages,
  onOpenWhy,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!messages || messages.length === 0) return null;

  // Most recent message is the primary focus
  const latestMessage = messages[messages.length - 1];
  const hasSuspiciousFlag = messages.some((m) => m.isSuspicious);

  return (
    <div
      className={`w-full max-w-md mx-auto transition-all duration-300 ${className}`}
    >
      <div
        className={`rounded-2xl p-4 transition-all duration-300 shadow-sm border ${
          hasSuspiciousFlag
            ? 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-rose-100/50'
            : 'bg-white/95 border-slate-200/80 text-slate-800 backdrop-blur-sm'
        }`}
      >
        {/* Header line with Live label and WHY action */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasSuspiciousFlag
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-emerald-500 animate-ping'
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Live Transcript
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {latestMessage.timestamp}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasSuspiciousFlag && (
              <button
                type="button"
                onClick={onOpenWhy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm animate-bounce"
                title="View risk explanation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>WHY?</span>
              </button>
            )}

            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
                title={isExpanded ? 'Collapse transcript' : 'Expand full history'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Conversation content */}
        <div className="space-y-2">
          {/* Expanded history */}
          {isExpanded && messages.length > 1 && (
            <div className="space-y-1.5 pb-2 mb-2 border-b border-slate-200/60 max-h-36 overflow-y-auto pr-1">
              {messages.slice(0, -1).map((msg) => (
                <div key={msg.id} className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{msg.speaker}: </span>
                  <span>“{msg.text}”</span>
                </div>
              ))}
            </div>
          )}

          {/* Latest Speech Line */}
          <div className="text-sm md:text-base leading-relaxed">
            <span className="font-bold text-slate-900">{latestMessage.speaker}: </span>
            <span
              className={
                latestMessage.isSuspicious
                  ? 'font-semibold text-rose-900 bg-rose-100/70 px-1 py-0.5 rounded'
                  : 'text-slate-700'
              }
            >
              “{latestMessage.text}”
            </span>
          </div>

          {/* Warning Flag Pill if suspicious */}
          {latestMessage.isSuspicious && (
            <div className="mt-2.5 pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>⚠ Sensitive information request</span>
              </div>
              <button
                type="button"
                onClick={onOpenWhy}
                className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
              >
                Inspect signals →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
