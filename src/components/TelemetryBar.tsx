import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Clock,
  CheckCircle2,
  Bot,
  Sparkles,
} from 'lucide-react';
import { isMuted, setMuted, playAcknowledgeBeep } from '../utils/audio';

interface TelemetryBarProps {
  activeCount: number;
  criticalCount: number;
  slaBreachRiskCount: number;
  onSimulateIncoming: () => void;
  onOpenNewIncidentModal: () => void;
  onOpenBroadcastModal: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  activeCount,
  criticalCount,
  slaBreachRiskCount,
  onSimulateIncoming,
  onOpenNewIncidentModal,
  onOpenBroadcastModal,
  onToggleCopilot,
  isCopilotOpen,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentUtc, setCurrentUtc] = useState<string>('');
  const [muted, setLocalMuted] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(14);
  const [throughput, setThroughput] = useState<number>(168);

  useEffect(() => {
    setLocalMuted(isMuted());

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentUtc(now.toISOString().slice(11, 19) + ' UTC');
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Subtle realistic telemetry micro-jitter
    const jitterInterval = setInterval(() => {
      setLatency(12 + Math.floor(Math.random() * 5));
      setThroughput(160 + Math.floor(Math.random() * 15));
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(jitterInterval);
    };
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
    if (!next) {
      playAcknowledgeBeep();
    }
  };

  return (
    <header className="bg-[#001C33] text-[#F8F9FF] border-b border-[#012745] sticky top-0 z-40 select-none shadow-sm">
      {/* Top micro telemetry ticker bar */}
      <div className="border-b border-[#012745]/70 bg-[#001424] px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-medium tracking-wide">
        <div className="flex items-center gap-4 text-[#A5C0DD] overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>METRO 911/311 INGEST: LIVE</span>
          </div>

          <span className="text-[#314962]">|</span>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#5790FF]" />
            <span>BRIDGE LATENCY:</span>
            <span className="font-mono text-white tabular-nums">{latency}ms</span>
          </div>

          <span className="text-[#314962]">|</span>

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-[#5790FF]" />
            <span>AI ENGINE THROUGHPUT:</span>
            <span className="font-mono text-white tabular-nums">{throughput} req/min</span>
          </div>

          <span className="text-[#314962]">|</span>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>SLA COMPLIANCE:</span>
            <span className="font-mono text-emerald-300 font-semibold tabular-nums">99.1%</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#A5C0DD] text-[11px]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#5790FF]" />
            <span className="font-mono text-white font-semibold tabular-nums">{currentTime}</span>
            <span className="text-[10px] text-[#6E86A2] font-mono">({currentUtc})</span>
          </div>

          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute tactical alert tones' : 'Mute tactical alert tones'}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[#A5C0DD] hover:text-white hover:bg-[#012745] transition-colors cursor-pointer"
          >
            {muted ? (
              <>
                <VolumeX className="w-3 h-3 text-amber-400" />
                <span className="text-[10px]">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px]">SOUND ON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Municipal Station Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0159C5] to-[#012745] rounded border border-[#5790FF]/30 flex items-center justify-center text-white font-bold shadow-inner">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-2">
                CIVIC PULSE AI
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#0159C5]/30 text-[#9BBFF4] border border-[#0159C5]/50 rounded font-semibold tracking-wider">
                Ops Command v3.8
              </span>
            </div>
            <p className="text-xs text-[#9BBFF4]/80 flex items-center gap-2">
              <span>District 4 Regional Triage Dispatch</span>
              <span className="text-[#314962]">·</span>
              <span className="text-emerald-400 font-medium">Auto-Triage Active</span>
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#011D34] border border-[#012745] rounded flex items-center gap-2.5">
            <span className="text-xs text-[#A5C0DD] font-medium">Active Incidents</span>
            <span className="text-sm font-bold font-mono text-white px-1.5 py-0.2 bg-[#001424] rounded border border-[#0159C5]/30 tabular-nums">
              {activeCount}
            </span>
          </div>

          <div
            className={`px-3 py-1.5 border rounded flex items-center gap-2.5 transition-all ${
              criticalCount > 0
                ? 'bg-[#341100]/60 border-[#BA1A1A] text-white shadow-sm'
                : 'bg-[#011D34] border-[#012745] text-[#A5C0DD]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BA1A1A] animate-ping" />
              <span className="text-xs font-semibold text-[#FF9B9B]">P1 Critical</span>
            </div>
            <span className="text-sm font-bold font-mono text-white px-1.5 py-0.2 bg-[#BA1A1A] rounded tabular-nums">
              {criticalCount}
            </span>
          </div>

          {slaBreachRiskCount > 0 && (
            <div className="px-3 py-1.5 bg-[#341100]/60 border border-[#F97316] rounded flex items-center gap-2 text-white">
              <ShieldAlert className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-xs font-semibold text-[#FFB690]">SLA Risk</span>
              <span className="text-xs font-bold font-mono bg-[#F97316] text-black px-1.5 rounded tabular-nums">
                {slaBreachRiskCount}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Gemini Copilot Launcher */}
          <button
            onClick={onToggleCopilot}
            className={`px-3 py-2 text-xs font-bold rounded transition-all flex items-center gap-2 cursor-pointer border ${
              isCopilotOpen
                ? 'bg-[#5790FF] text-[#001C33] border-white shadow-md ring-2 ring-[#5790FF]/50'
                : 'bg-gradient-to-r from-[#0159C5] to-[#011D34] hover:from-[#0269e8] hover:to-[#012745] text-white border-[#5790FF]/40 shadow-sm'
            }`}
            title="Open Gemini Dispatch Copilot with Voice, Search & Maps"
          >
            <Bot className="w-4 h-4 text-white" />
            <span>Gemini Copilot</span>
            <span className="hidden sm:inline-block text-[9.5px] px-1 py-0.2 bg-white/20 rounded font-mono uppercase">
              Voice · Search · Maps
            </span>
          </button>

          <button
            onClick={onSimulateIncoming}
            className="px-3 py-2 text-xs font-medium bg-[#011D34] hover:bg-[#012745] text-[#A5C0DD] hover:text-white border border-[#314962] hover:border-[#5790FF] rounded transition-all flex items-center gap-1.5 cursor-pointer"
            title="Simulate incoming radio or 911 dispatch transmission"
          >
            <Radio className="w-3.5 h-3.5 text-[#5790FF]" />
            <span className="hidden md:inline">Simulate 911 Call</span>
          </button>

          <button
            onClick={onOpenBroadcastModal}
            className="px-3 py-2 text-xs font-semibold bg-[#011D34] hover:bg-[#012745] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Emergency Broadcast</span>
          </button>

          <button
            onClick={onOpenNewIncidentModal}
            className="px-3.5 py-2 text-xs font-bold bg-[#0159C5] hover:bg-[#024bb0] text-white rounded shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-[#5790FF] focus:outline-none"
          >
            <span className="text-sm leading-none">+</span>
            <span>Manual Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
};
