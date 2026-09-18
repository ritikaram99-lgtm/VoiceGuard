import React from 'react';
import type { RiskLevel } from '../../types';


interface VoiceWaveformProps {
  isActive?: boolean;
  riskLevel?: RiskLevel;
  barCount?: number;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive = true,
  riskLevel = 'LOW RISK',
  barCount = 28,
  className = '',
}) => {
  const isHighRisk =
    riskLevel === 'HIGH RISK' ||
    riskLevel === 'IMPERSONATION DETECTED' ||
    riskLevel === 'IMPERSONATION CONFIRMED';

  const isSuspicious = riskLevel === 'SUSPICIOUS';

  // Choose lively accent gradients
  let barColorClass = 'bg-gradient-to-t from-blue-600 to-indigo-400';
  if (isHighRisk) {
    barColorClass = 'bg-gradient-to-t from-rose-600 to-amber-400';
  } else if (isSuspicious) {
    barColorClass = 'bg-gradient-to-t from-amber-500 to-yellow-300';
  }

  // Pre-calculated organic heights and animation delays to create natural voice wave pattern
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Parabolic bell curve shape centered in the middle
    const center = barCount / 2;
    const distFromCenter = Math.abs(i - center) / center;
    const baseScale = Math.max(0.18, 1 - Math.pow(distFromCenter, 1.4));

    // Staggered variation
    const delay = (i % 5) * 0.18 + (i % 3) * 0.12;
    const duration = 0.9 + (i % 4) * 0.25;

    return {
      id: i,
      baseScale,
      delay,
      duration,
    };
  });

  return (
    <div className={`flex items-center justify-center gap-1 h-12 px-4 py-1.5 ${className}`}>
      {bars.map((bar) => {
        const heightPct = isActive
          ? Math.floor(bar.baseScale * 100)
          : 15;

        return (
          <div
            key={bar.id}
            className={`w-1 rounded-full transition-all duration-300 ${barColorClass}`}
            style={{
              height: isActive ? `${Math.max(14, heightPct)}%` : '12%',
              animation: isActive
                ? `waveform-wave ${bar.duration}s ease-in-out infinite alternate`
                : 'none',
              animationDelay: `${bar.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};
