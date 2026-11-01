import React from 'react';

interface CivicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const CivicLogo: React.FC<CivicLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 'w-8 h-8' : isLg ? 'w-12 h-12' : 'w-10 h-10';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* High-tech Municipal Institutional Crest */}
      <div
        className={`${iconSize} relative rounded-xl bg-gradient-to-br from-[#011D34] via-[#022c4d] to-[#011425] p-0.5 shadow-md border border-[#0259C5]/40 flex items-center justify-center overflow-hidden flex-shrink-0 group`}
      >
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#5790ff_1px,transparent_1px)] [background-size:6px_6px]"></div>
        
        {/* Glowing aura */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0259C5] rounded-full blur-sm opacity-60"></div>

        {/* Custom Vector Emblem: Shield + Pulse Wave + Karnataka Municipal Star */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full relative z-10 p-1 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield Outline */}
          <path
            d="M20 4L7 9.5V19C7 26.5 12.5 33.5 20 36C27.5 33.5 33 26.5 33 19V9.5L20 4Z"
            stroke="url(#shield-grad)"
            strokeWidth="1.75"
            strokeLinejoin="round"
            fill="#011D34"
            fillOpacity="0.85"
          />

          {/* Pulse Frequency Waveform inside Shield */}
          <path
            d="M11 20H15L17.5 14L20.5 25L23.5 17L25.5 20H29"
            stroke="#5790FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Core Institutional Hub Node */}
          <circle cx="20" cy="20" r="2.2" fill="#FFFFFF" />
          <circle cx="20" cy="20" r="4.5" stroke="#5790FF" strokeWidth="0.75" strokeDasharray="1.5 1.5" />

          {/* Municipal Ward Star at Top */}
          <path
            d="M20 9L21.2 11.5L23.8 11.8L21.8 13.5L22.4 16.1L20 14.8L17.6 16.1L18.2 13.5L16.2 11.8L18.8 11.5L20 9Z"
            fill="#FBBF24"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="shield-grad" x1="7" y1="4" x2="33" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5790FF" />
              <stop offset="0.5" stopColor="#0259C5" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </svg>

        {/* Live Active Pulse Dot */}
        <span className="absolute bottom-0.5 right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* Brand & Municipal Typographic Identity */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-lg lg:text-xl font-extrabold tracking-tight text-[#161C21] leading-none">
            Civic Pulse
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#0259C5] to-[#011D34] text-white text-[10px] font-bold tracking-wider font-mono shadow-xs">
            AI
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-[#43474D] tracking-tight leading-tight mt-0.5">
            Ward 112 Municipal Command • Bengaluru East
          </span>
        )}
      </div>
    </div>
  );
};
