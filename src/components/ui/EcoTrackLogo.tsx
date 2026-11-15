import React from 'react';

interface EcoTrackLogoProps {
  variant?: 'dark' | 'light';
  showTagline?: boolean;
}

export const EcoTrackLogo: React.FC<EcoTrackLogoProps> = ({
  variant = 'dark',
  showTagline = false,
}) => {
  const titleColor = variant === 'light' ? 'text-white' : 'text-[#14201A]';
  const subColor = variant === 'light' ? 'text-white/80' : 'text-[#55665C]';
  const markBg = variant === 'light' ? 'bg-white/15 border-white/25' : 'bg-[#1B4332] border-[#132A1F]';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${markBg}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-white"
        >
          <path
            d="M19.5 4.5C12.5 4.5 6.5 8.5 5 15.5C4.6 17.3 5 19 5 19C5 19 6.7 19.4 8.5 19C15.5 17.5 19.5 11.5 19.5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 19C8.5 15.5 12.2 12.2 16 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <span className={`block font-display text-lg font-bold tracking-tight ${titleColor}`}>
          EcoTrack
        </span>
        {showTagline && (
          <span className={`block text-xs font-medium ${subColor}`}>
            Smart School Waste Management
          </span>
        )}
      </div>
    </div>
  );
};
