import React from 'react';
import { StatusRing } from './StatusRing';
import type { RiskLevel } from '../../types';


interface AvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'call-hero';
  status?: RiskLevel | 'active_call' | 'online' | 'safe' | 'offline' | 'verifying';

  showRing?: boolean;
  isOnline?: boolean;
  className?: string;
  colorScheme?: 'rose' | 'blue' | 'emerald' | 'amber';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role,
  size = 'md',
  status = 'LOW RISK',
  showRing = false,
  isOnline = true,
  className = '',
  colorScheme,
}) => {
  // Dimension map
  const sizeConfig = {
    sm: { px: 40, ringPx: 48, text: 'text-sm font-semibold', dot: 'w-2.5 h-2.5' },
    md: { px: 56, ringPx: 68, text: 'text-lg font-bold', dot: 'w-3 h-3' },
    lg: { px: 76, ringPx: 92, text: 'text-2xl font-bold', dot: 'w-3.5 h-3.5' },
    xl: { px: 110, ringPx: 130, text: 'text-3xl font-bold', dot: 'w-4 h-4' },
    hero: { px: 140, ringPx: 168, text: 'text-4xl font-extrabold', dot: 'w-5 h-5' },
    'call-hero': { px: 168, ringPx: 200, text: 'text-5xl font-extrabold', dot: 'w-5 h-5' },
  }[size];

  // Default color schemes based on name/role if not explicitly passed
  let resolvedScheme = colorScheme;
  if (!resolvedScheme) {
    const lower = (name + (role || '')).toLowerCase();
    if (lower.includes('mom')) resolvedScheme = 'rose';
    else if (lower.includes('rahul') || lower.includes('son')) resolvedScheme = 'blue';
    else if (lower.includes('dad') || lower.includes('father')) resolvedScheme = 'emerald';
    else resolvedScheme = 'blue';
  }

  const colorStyles = {
    rose: {
      bg: 'bg-gradient-to-br from-rose-100 via-pink-50 to-rose-200 text-rose-700 border-rose-200',
      icon: '#E11D48',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-200 text-blue-700 border-blue-200',
      icon: '#2563EB',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-200 text-emerald-800 border-emerald-200',
      icon: '#059669',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 text-amber-800 border-amber-200',
      icon: '#D97706',
    },
  }[resolvedScheme];

  // Stylized Avatar Content (Human, clean, non-robotic portrait illustration)
  const renderAvatarGraphic = () => {
    const lower = name.toLowerCase();
    if (lower.includes('mom')) {
      return (
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
          <circle cx="50" cy="38" r="20" fill="#FDA4AF" />
          <path
            d="M50 18C40 18 33 26 33 38C33 42 35 48 37 50C40 43 45 42 50 42C55 42 60 43 63 50C65 48 67 42 67 38C67 26 60 18 50 18Z"
            fill="#9F1239"
          />
          <path
            d="M26 84C26 68 37 60 50 60C63 60 74 68 74 84"
            stroke="#BE123C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="43" cy="38" r="2.5" fill="#881337" />
          <circle cx="57" cy="38" r="2.5" fill="#881337" />
          <path d="M46 45Q50 49 54 45" stroke="#881337" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (lower.includes('rahul')) {
      return (
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
          <circle cx="50" cy="38" r="20" fill="#93C5FD" />
          <path
            d="M31 34C31 22 40 16 50 16C60 16 69 22 69 34C69 36 67 38 65 37C60 30 54 28 50 28C46 28 40 30 35 37C33 38 31 36 31 34Z"
            fill="#1E3A8A"
          />
          <path
            d="M25 84C25 67 36 59 50 59C64 59 75 67 75 84"
            stroke="#1D4ED8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="43" cy="38" r="2.5" fill="#1E3A8A" />
          <circle cx="57" cy="38" r="2.5" fill="#1E3A8A" />
          <path d="M46 45Q50 48 54 45" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (lower.includes('dad')) {
      return (
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
          <circle cx="50" cy="38" r="20" fill="#A7F3D0" />
          <path
            d="M33 30C33 20 41 16 50 16C59 16 67 20 67 30C67 32 64 30 61 27C57 24 53 23 50 23C47 23 43 24 39 27C36 30 33 32 33 30Z"
            fill="#064E3B"
          />
          {/* Glasses */}
          <rect x="36" y="33" width="11" height="9" rx="2" stroke="#065F46" strokeWidth="2" fill="none" />
          <rect x="53" y="33" width="11" height="9" rx="2" stroke="#065F46" strokeWidth="2" fill="none" />
          <line x1="47" y1="37" x2="53" y2="37" stroke="#065F46" strokeWidth="2" />
          <path
            d="M25 84C25 67 36 59 50 59C64 59 75 67 75 84"
            stroke="#047857"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path d="M46 47Q50 49 54 47" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    // Default monogram initial
    return <span className={sizeConfig.text}>{name.charAt(0).toUpperCase()}</span>;
  };

  const coreAvatar = (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden border-2 shadow-sm ${colorStyles.bg} ${className}`}
      style={{ width: sizeConfig.px, height: sizeConfig.px }}
    >
      {renderAvatarGraphic()}

      {/* Online indicator dot */}
      {isOnline && size !== 'sm' && (
        <span
          className={`absolute bottom-1 right-1 rounded-full bg-emerald-500 ring-2 ring-white ${sizeConfig.dot}`}
          title="Online"
        />
      )}
    </div>
  );

  if (showRing) {
    return (
      <StatusRing
        status={status}
        size={sizeConfig.ringPx}
        strokeWidth={size === 'call-hero' || size === 'hero' ? 4 : 3}
      >
        {coreAvatar}
      </StatusRing>
    );
  }

  return coreAvatar;
};
