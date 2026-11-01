import React from 'react';
import { User, Shield } from 'lucide-react';
import { CivicLogo } from './CivicLogo';

interface StitchHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: 'Citizen' | 'Officer';
  onToggleRole: () => void;
  criticalOverdueCount: number;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  currentView,
  onNavigate,
  userRole,
  onToggleRole,
  criticalOverdueCount,
  onToggleCopilot,
  isCopilotOpen,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#ffffff] border-b border-[#DCE3EE] shadow-[0_2px_8px_-2px_rgba(0,28,51,0.06)] select-none">
      <div className="h-20 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Brand Identifier with high-fidelity CivicLogo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
          title="Return to Civic Pulse Home Dashboard"
        >
          <CivicLogo size="md" />
        </div>

        {/* Top Center Navigation Links */}
        <nav className="hidden xl:flex items-center h-full gap-1">
          {[
            { id: 'home', label: 'Home Dashboard' },
            { id: 'live-map-triage', label: 'Live Map & Triage' },
            { id: 'operations-queue', label: 'Operations Queue' },
            { id: 'report-issue-ai-assistant', label: 'Report Issue (AI Assistant)' },
            { id: 'public-impact-slas', label: 'Public Impact & SLAs' },
            { id: 'community-feed', label: 'Civic Feed' },
            { id: 'alerts', label: 'Alerts Hub' },
          ].map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`h-full flex items-center px-3 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-[#0259C5] border-[#0259C5] font-bold'
                    : 'text-[#43474D] hover:text-[#161C21] border-transparent hover:border-[#DCE3EE]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Civic Guard AI Trigger */}
          <button
            onClick={onToggleCopilot}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-xs ${
              isCopilotOpen
                ? 'bg-[#011D34] text-white border-[#0259C5] ring-2 ring-[#0259C5]/30'
                : 'bg-[#EFF4FB] hover:bg-[#D9E2FF] text-[#011D34] border-[#C3C6CD]'
            }`}
            title="Launch Civic Guard Municipal Voice Dispatch & Multi-modal Grounding"
          >
            <Shield className={`w-4 h-4 ${isCopilotOpen ? 'text-cyan-300' : 'text-[#0259C5]'}`} />
            <span className="font-extrabold tracking-tight">Civic Guard</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>

          {/* Telemetry pill */}
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#EFF4FB] border border-[#C3C6CD] text-[11px] text-[#43474D] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0259C5] animate-ping"></span>
            <span>Live Node #112</span>
          </div>

          {/* Citizen / Officer Mode Toggle */}
          <div className="flex items-center p-0.5 bg-[#E9EEF5] rounded-lg border border-[#C3C6CD]">
            <button
              onClick={onToggleRole}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                userRole === 'Citizen'
                  ? 'bg-white text-[#0259C5] shadow-xs font-bold'
                  : 'text-[#43474D] hover:text-[#161C21]'
              }`}
            >
              Citizen
            </button>
            <button
              onClick={onToggleRole}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                userRole === 'Officer'
                  ? 'bg-white text-[#0259C5] shadow-xs font-bold'
                  : 'text-[#43474D] hover:text-[#161C21]'
              }`}
            >
              Officer
            </button>
          </div>

          {/* Critical Overdue Warning Pill */}
          <button
            onClick={() => onNavigate('alerts')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFDAD6] text-[#93000A] border border-[#BA1A1A]/30 text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-red-200 transition-colors"
            title="View Critical Overdue Escalations"
          >
            <span className="material-symbols-outlined text-[16px] text-[#BA1A1A]">warning</span>
            <span>{criticalOverdueCount} Critical</span>
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#C3C6CD]">
            <div className="text-right hidden 2xl:block">
              <div className="text-xs text-[#161C21] font-bold leading-tight">Inspector R. Sharma</div>
              <div className="text-[10px] text-[#43474D] leading-tight font-mono">Ward 112 Command</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#011D34] text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
