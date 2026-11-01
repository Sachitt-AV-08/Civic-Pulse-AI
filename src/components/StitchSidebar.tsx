import React from 'react';

interface StitchSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const StitchSidebar: React.FC<StitchSidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home Dashboard', icon: 'dashboard' },
    { id: 'live-map-triage', label: 'Live Map & Triage', icon: 'map' },
    { id: 'operations-queue', label: 'Operations Queue', icon: 'inbox' },
    { id: 'report-issue-ai-assistant', label: 'AI Assistant Log / Intake', icon: 'smart_toy' },
    { id: 'public-impact-slas', label: 'Impact & SLAs', icon: 'query_stats' },
    { id: 'community-feed', label: 'Civic Feed', icon: 'forum' },
    { id: 'alerts', label: 'Critical Alerts', icon: 'notifications_active' },
  ];

  return (
    <aside className="hidden xl:flex fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-[#DCE3EE] z-40 flex-col justify-between p-4 select-none">
      <div className="flex flex-col gap-3">
        <div className="px-2 py-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#43474D] font-bold">
            Operations Command
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#D9E2FF] text-[#001A43] font-bold shadow-xs'
                    : 'text-[#43474D] hover:bg-[#E9EEF5] hover:text-[#161C21]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#0259C5]' : 'text-[#74777E]'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Ward Status Box at bottom of Sidebar */}
      <div className="p-3.5 rounded-lg bg-[#EFF4FB] border border-[#C3C6CD]/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#161C21] font-bold">Indiranagar 112 Grid</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#0259C5] animate-pulse"></span>
        </div>
        <p className="text-[11px] text-[#43474D] leading-snug">
          99.8% System SLA compliance across active municipal dispatches.
        </p>
      </div>
    </aside>
  );
};
