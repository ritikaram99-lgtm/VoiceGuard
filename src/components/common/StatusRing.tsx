import React from 'react';
import type { RiskLevel } from '../../types';


interface StatusRingProps {
  status?: RiskLevel | 'active_call' | 'online' | 'offline' | 'verifying' | 'safe';

  size?: number; // size in px
  strokeWidth?: number;
  animate?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const StatusRing: React.FC<StatusRingProps> = ({
  status = 'LOW RISK',
  size = 140,
  strokeWidth = 3,
  animate = true,
  children,
  className = '',
}) => {
  // Determine color palette based on status
  let ringColor = 'stroke-emerald-500';
  let glowColor = 'rgba(16, 185, 129, 0.18)';
  let pulseRing = false;

  switch (status) {
    case 'LOW RISK':
    case 'safe':
    case 'VERIFIED':
    case 'IDENTITY VERIFIED':
      ringColor = 'stroke-emerald-500';
      glowColor = 'rgba(16, 185, 129, 0.2)';
      pulseRing = animate;
      break;

    case 'SUSPICIOUS':
    case 'UNVERIFIED':
      ringColor = 'stroke-amber-500';
      glowColor = 'rgba(245, 158, 11, 0.25)';
      pulseRing = true;
      break;

    case 'HIGH RISK':
    case 'IMPERSONATION DETECTED':
    case 'IMPERSONATION CONFIRMED':
    case 'IDENTITY VERIFICATION FAILED':
      ringColor = 'stroke-rose-500';
      glowColor = 'rgba(244, 63, 94, 0.3)';
      pulseRing = true;
      break;

    case 'verifying':
      ringColor = 'stroke-blue-500';
      glowColor = 'rgba(37, 99, 235, 0.25)';
      pulseRing = true;
      break;

    case 'active_call':
      ringColor = 'stroke-blue-500';
      glowColor = 'rgba(37, 99, 235, 0.2)';
      pulseRing = true;
      break;

    default:
      ringColor = 'stroke-emerald-500';
      glowColor = 'rgba(16, 185, 129, 0.15)';
  }

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer pulsing halo */}
      {pulseRing && (
        <div
          className="absolute inset-0 rounded-full animate-voice-pulse pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />
      )}

      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90 pointer-events-none"
      >
        {/* Subtle background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeOpacity="0.6"
        />
        {/* Active status ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`${ringColor} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
        />
      </svg>

      {/* Embedded Center Content */}
      <div className="relative z-10 flex items-center justify-center">{children}</div>
    </div>
  );
};
