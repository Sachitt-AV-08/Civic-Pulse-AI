import React from 'react';
import { Incident } from '../../types/incident';
import { WeeklyIncidentForecastChart } from '../WeeklyIncidentForecastChart';

interface HomeDashboardViewProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onNavigate: (view: string) => void;
  onOpenBroadcastModal: () => void;
  onOpenCivicGuard: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  incidents,
  onSelectIncident,
  onNavigate,
  onOpenBroadcastModal,
  onOpenCivicGuard,
}) => {
  return (
    <div className="w-full px-4 lg:px-10 py-6 flex flex-col gap-6 text-[#161C21] select-none">
      {/* Operational Header / Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#011D34] via-[#022c4d] to-[#011425] p-6 lg:p-8 text-white shadow-xl border border-[#0259C5]/30">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#5790FF]/15 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E2FF] text-[#001A43] text-xs font-mono font-bold tracking-wider uppercase">
                <span className="h-2 w-2 rounded-full bg-[#0259C5] animate-pulse"></span>
                Live Grid Feed Active
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Synchronized with BBMP Control Room • Node #BLR-112-E
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Ward 112 Civic Operations & Accountability Console
            </h1>

            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time AI-assisted incident verification, quad-agency dispatch bridge (BESCOM, BBMP, BWSSB, Traffic Police), and statutory Citizen Charter SLA governance for Indiranagar municipal quadrant.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('report-issue-ai-assistant')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0259C5] hover:bg-[#004397] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Report an Issue</span>
            </button>

            <button
              onClick={onOpenBroadcastModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#161C21] hover:bg-slate-100 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0259c5]">broadcast_on_home</span>
              <span>Broadcast Advisory</span>
            </button>

            <button
              onClick={onOpenCivicGuard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-cyan-300">shield</span>
              <span>Civic Guard Voice</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metric Strip: 4 Operational KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Open Incidents */}
        <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#43474D] font-bold">Active Incidents</span>
            <span className="p-1.5 rounded-lg bg-[#eff4fb] text-[#0259C5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">emergency_home</span>
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-[#161C21] tracking-tight">142</div>
            <div className="text-xs text-[#43474D] mt-0.5">Under Active Jurisdiction</div>
          </div>
          <div className="pt-2 border-t border-[#e9eef5] flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span> 4 Critical
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span> 11 Urgent
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#eff4fb] text-[#43474D] text-[11px] font-medium">
              127 Routine
            </span>
          </div>
        </div>

        {/* Metric 2: Overdue Citizen Charter SLAs */}
        <div className="rounded-xl bg-[#ffdad6]/60 p-5 border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#93000a] font-bold">Citizen Charter SLAs</span>
            <span className="p-1.5 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[20px]">timer_off</span>
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#ba1a1a] tracking-tight">2</span>
              <span className="text-base font-bold text-[#ba1a1a]">Overdue</span>
            </div>
            <div className="text-xs text-[#93000a] mt-0.5">Escalated to Zonal Commissioner</div>
          </div>
          <div className="pt-2 border-t border-red-200 flex items-center justify-between text-xs">
            <span className="text-[#ba1a1a] font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ba1a1a] animate-ping"></span>
              Breach Penalty Logged
            </span>
            <span className="text-[#93000a] font-mono">98.6% on-track</span>
          </div>
        </div>

        {/* Metric 3: Avg Triage-to-Dispatch Time */}
        <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#43474D] font-bold">Dispatch Latency</span>
            <span className="p-1.5 rounded-lg bg-[#eff4fb] text-[#0259C5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-[#161C21] tracking-tight">14.2</span>
              <span className="text-base font-medium text-[#43474D]">min</span>
            </div>
            <div className="text-xs text-[#43474D] mt-0.5">AI Triage to Agency Handshake</div>
          </div>
          <div className="pt-2 border-t border-[#e9eef5] flex items-center gap-1.5 text-[#0259c5] text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">trending_down</span>
            <span>-18% vs 30-day baseline (17.3m)</span>
          </div>
        </div>

        {/* Metric 4: Verified Citizen Trust Rating */}
        <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#43474D] font-bold">Public Audit Trust</span>
            <span className="p-1.5 rounded-lg bg-[#d9e2ff] text-[#001a43] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-[#161C21] tracking-tight">94.8%</div>
            <div className="text-xs text-[#43474D] mt-0.5">Based on 1,420 Resolved Audits</div>
          </div>
          <div className="pt-2 border-t border-[#e9eef5] flex items-center justify-between text-xs text-[#43474D]">
            <span className="text-[#161C21] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#0259C5]">thumb_up</span>
              89% 1st-Time Resolution
            </span>
            <span className="font-mono text-[#0259C5] font-semibold">Ward 112 Rank #1</span>
          </div>
        </div>
      </section>

      {/* Main Content Split Grid (8-col Left, 4-col Right) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Interactive Hotspot Geo-Overview Card */}
          <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#161C21]">Live Ward 112 Hotspot Geometry</h2>
                  <span className="px-2 py-0.5 rounded bg-[#d9e2ff] text-[#001a43] text-xs font-bold">
                    100ft Rd / CMH Corridor
                  </span>
                </div>
                <p className="text-xs text-[#43474D] mt-0.5">
                  Real-time telemetry showing live incident densities and active field emergency units.
                </p>
              </div>

              {/* View Full Live Map button */}
              <button
                onClick={() => onNavigate('live-map-triage')}
                className="px-3 py-1.5 rounded-lg bg-[#eff4fb] hover:bg-[#d9e2ff] text-[#0259C5] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span>Launch Live Map & Triage</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Mini Map Simulation */}
            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-[#011D34] border border-[#dde3ea]">
              {/* Satellite / Dark Cartography layer */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzoHPBTtEcHz7PTcPe1rt2uWvO2RDBD-nyrLMen5ZjZOwjl7LGgzYRfjLdl2NCfnYHy5EVlD020RGUZQCPDbBZtJCZjfSXFXvW-a0DzgzKUVfl4P_ACWVAFobIDunAG7C-_vmjBVqpOLwL5aAXuWXHmxpPT8zm6jUw2AeBCufS9bMqlhIdItZaJ2KXQPR_nQLOCzR0Kuy_3BAP-bZselGT8nzlShTNjXlylI0Es-g')`,
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#011D34] via-[#011D34]/40 to-transparent"></div>

              {/* Vector Grid Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
                {/* 100ft Road Line */}
                <line x1="20%" y1="10%" x2="80%" y2="90%" stroke="#5790FF" strokeWidth="4" strokeOpacity="0.6" />
                {/* CMH Road Line */}
                <line x1="10%" y1="65%" x2="90%" y2="40%" stroke="#0259C5" strokeWidth="3" strokeOpacity="0.5" />
                {/* Simulated Dispatch Route */}
                <path d="M 400 240 Q 320 200 260 90" fill="none" stroke="#5790FF" strokeDasharray="6,4" strokeWidth="3" opacity="0.9" />
              </svg>

              {/* Severity Pin 01: CV-8490 Live 11kV Severed Cable */}
              <div
                onClick={() => {
                  const inc = incidents.find((i) => i.code === 'CV-8490') || incidents[0];
                  onSelectIncident(inc);
                  onNavigate('live-map-triage');
                }}
                className="absolute top-1/4 left-1/3 z-20 flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-8 w-8 rounded-full bg-red-600/40 animate-ping"></span>
                  <span className="relative h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                    !
                  </span>
                </div>
                <div className="mt-1 px-2.5 py-1 rounded-md bg-[#011D34] text-white text-[11px] font-bold shadow-md whitespace-nowrap flex items-center gap-1.5 border border-red-500/50">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span>CV-8490: 11kV Cable Severed</span>
                </div>
              </div>

              {/* Severity Pin 02: BESCOM QRU #41 In-Transit Route */}
              <div className="absolute bottom-1/3 left-1/2 z-20 flex flex-col items-center cursor-pointer">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0259C5] text-white text-[11px] font-bold shadow-md">
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  <span>BESCOM QRU #41 (ETA 4m)</span>
                </div>
                <div className="h-2 w-2 bg-[#0259C5] rotate-45 -mt-1 shadow-sm"></div>
              </div>

              {/* Severity Pin 03: Routine Pothole Cluster */}
              <div
                onClick={() => {
                  const inc = incidents.find((i) => i.code === 'CV-8492') || incidents[1];
                  onSelectIncident(inc);
                  onNavigate('live-map-triage');
                }}
                className="absolute top-2/3 right-1/4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#161c21] text-[11px] font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>CV-8472: Pothole Craters</span>
              </div>

              {/* Bottom Map Bar Information */}
              <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between p-2.5 rounded-lg bg-white/90 backdrop-blur text-[#161c21] text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0259C5] animate-pulse"></span>
                  <span className="font-bold">Active Route:</span>
                  <span>BESCOM Substation 4th Cross → 100ft Rd / 12th Main Jn</span>
                </div>
                <div className="font-mono text-[11px] text-[#43474D]">Telemetry Latency: 1.2s</div>
              </div>
            </div>
          </div>

          {/* Weekly Incident Forecast Line Chart (Recharts) */}
          <WeeklyIncidentForecastChart
            incidents={incidents}
            onNavigate={onNavigate}
            onSelectIncident={onSelectIncident}
          />

          {/* Recent Incident Pipeline */}
          <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#161C21]">Recent Incident Pipeline</h2>
                <p className="text-xs text-[#43474D]">Top priority dispatches under active citizen SLA monitoring.</p>
              </div>
              <button
                onClick={() => onNavigate('operations-queue')}
                className="text-xs text-[#0259C5] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Operations Queue</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Data Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#eff4fb] text-[#43474D] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 rounded-l-lg">Incident ID</th>
                    <th className="py-2.5 px-3">Category & Detail</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Agency</th>
                    <th className="py-2.5 px-3">SLA Countdown</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9eef5]">
                  {incidents.slice(0, 4).map((inc) => {
                    const isP1 = inc.priority === 'P1';
                    const isP2 = inc.priority === 'P2';
                    const minsRemaining = Math.max(0, Math.floor(inc.slaDeadlineSeconds / 60));
                    const isOverdue = inc.slaDeadlineSeconds <= 0 && inc.status !== 'resolved';

                    return (
                      <tr key={inc.id} className="hover:bg-[#eff4fb]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#0259C5]">
                          {inc.code}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#161C21]">{inc.title}</div>
                          <div className="text-[11px] text-[#43474D]">{inc.location.address}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] w-fit ${
                                isP1
                                  ? 'bg-red-100 text-red-800'
                                  : isP2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isP1 ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
                                }`}
                              ></span>
                              {inc.priorityLabel || inc.priority}
                            </span>
                            {inc.aiRecommendedPriority && (
                              <span
                                className="text-[10px] font-mono font-bold text-[#001C33] bg-[#EFF4FB] px-1.5 py-0.5 rounded border border-[#BFDBFE] w-fit flex items-center gap-1"
                                title={`Cross-referenced ${inc.aiRecommendedPriority.historicalPattern.patternClusterId}`}
                              >
                                <span>AI: {inc.aiRecommendedPriority.recommendedPriority}</span>
                                <span className="text-[#0259C5]">({inc.aiRecommendedPriority.automatedSeverityScore})</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#161C21]">
                          {inc.primaryAgency}
                        </td>
                        <td className="py-3 px-3 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className={isOverdue ? 'text-red-600 font-bold' : 'text-[#161C21] font-semibold'}>
                              {isOverdue ? '+42m OVERDUE' : `${minsRemaining}m left`}
                            </span>
                            <span className="text-[#43474D]">{inc.initialSlaMinutes}m SLA</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#dde3ea] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOverdue ? 'bg-red-600' : 'bg-[#0259C5]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(15, (inc.slaDeadlineSeconds / (inc.initialSlaMinutes * 60)) * 100))}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              onSelectIncident(inc);
                              onNavigate('live-map-triage');
                            }}
                            className="px-3 py-1 rounded-lg bg-[#011D34] hover:bg-[#022c4d] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Triage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* AI Neural Triage Stream Card */}
          <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#d9e2ff] text-[#001a43] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </span>
                <h3 className="text-sm font-bold text-[#161C21]">AI Neural Triage Stream</h3>
              </div>
              <span className="text-xs text-[#0259C5] font-bold font-mono">Live Feed</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Stream Item 1 */}
              <div className="p-3.5 rounded-xl bg-[#eff4fb] flex flex-col gap-2 border border-[#d9e2ff]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d9e2ff] text-[#001a43] text-[10px] font-bold font-mono">
                    AI 98.4% CONFIDENCE
                  </span>
                  <span className="text-[11px] text-[#43474D] font-mono">2m ago</span>
                </div>
                <div className="text-xs font-bold text-[#161C21]">
                  11kV Live Feeder hazard detected near school pedestrian zone
                </div>
                <div className="text-[11px] text-[#43474D] leading-relaxed">
                  Computer vision matched sparking transformer junction at 100ft Rd. Auto-routed directly to BESCOM Emergency Dispatch Unit 04.
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#dde3ea]">
                  <span className="text-[10px] text-[#0259C5] font-mono font-bold">Audit Key: #TRG-90214</span>
                  <button
                    onClick={() => onNavigate('live-map-triage')}
                    className="px-2.5 py-1 rounded bg-[#011D34] text-white text-[10px] font-bold hover:bg-[#022c4d] transition-all cursor-pointer"
                  >
                    Officer Fast-Approve
                  </button>
                </div>
              </div>

              {/* Stream Item 2 */}
              <div className="p-3.5 rounded-xl bg-[#eff4fb] flex flex-col gap-2 border border-[#dde3ea]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d9e2ff] text-[#001a43] text-[10px] font-bold font-mono">
                    AI 94.1% CONFIDENCE
                  </span>
                  <span className="text-[11px] text-[#43474D] font-mono">11m ago</span>
                </div>
                <div className="text-xs font-bold text-[#161C21]">
                  Duplicate Incident Merged: 4 citizen reports on 12th Cross
                </div>
                <div className="text-[11px] text-[#43474D] leading-relaxed">
                  Synthesized 4 geo-tagged mobile photos into single ticket CV-8472 to prevent multi-crew dispatch conflict.
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#dde3ea]">
                  <span className="text-[10px] text-[#43474D] font-mono">Cluster ID #449-IND</span>
                  <span className="text-[10px] text-[#0259C5] font-bold">Auto-consolidated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Resolution Public Audit Card */}
          <div className="rounded-xl bg-white p-5 border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0259C5] text-[20px]">verified_user</span>
                <h3 className="text-sm font-bold text-[#161C21]">Public SLA Audit Certificate</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#eff4fb] text-[#43474D] font-mono font-bold">
                #AUD-77402
              </span>
            </div>

            {/* Before / After Visual Proof */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 border border-[#dde3ea]">
                  <img
                    className="h-full w-full object-cover"
                    alt="Damaged municipal water drain before repair"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLM_FqhwvGOig5q_r2HmRTopmhQNxYUFNBpXCdwGMJe_yNSweZHWk7-3U2o4SIeH4zZcZDFnhyeXNzBkgtKCx3OZuOiwlNrbigLPAzDFwmteUhARoxyzW0n5wvYyvw02uVou6wLXQxlz--hCWl68gDO6TYglbb6Djc3jb3ZdMmR88xFbo80ymhkGQTLSg1C5e9tD7EqB-x5qVpZTv0hk3yQr2ZLZoexwtmJcysdbg"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#011D34] text-white text-[9px] font-bold">
                    BEFORE
                  </span>
                </div>
                <span className="text-[10px] text-[#43474D] font-mono">09:14 AM • Reported</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 border border-[#dde3ea]">
                  <img
                    className="h-full w-full object-cover"
                    alt="Repaired municipal storm water drain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSXTUU3lAjoBUEuJlkv9c1F4XWfqTCkIbQevV5LHk8UKS7Ps3zM5u1tT4rm5Xb5fFU4KXLKOCfesTd-RKdebOWNRbIwNNRyTo3xPbVEnae3PaNI64THBfahnM0EUMplmYvB041zGuhzekH4pGahIK4aRDHnlawdEK8MWi3GvoOaH15-uCRV61Nxd55x3uPmqRrnwXbvVzmRnTclJ9R-JLXgvXQHDuEHBCZsK-WSAA"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                    RESOLVED
                  </span>
                </div>
                <span className="text-[10px] text-[#43474D] font-mono">11:02 AM • Verified</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#eff4fb] flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#161C21]">Resolved in 1h 48m</span>
                <span className="text-[#0259C5]">Target SLA: 4h 00m</span>
              </div>
              <p className="text-[11px] text-[#43474D] italic mt-0.5">
                “Drain cover replaced completely, pedestrian walkway clear. Verified by RWA Member K. Swaminathan.”
              </p>
              <div className="mt-1 pt-1 border-t border-[#dde3ea] text-[10px] text-[#43474D] flex items-center justify-between font-mono">
                <span>Hash: 0x8f...4e1a</span>
                <span className="text-emerald-700 font-bold">Citizen Sign-off Confirmed</span>
              </div>
            </div>
          </div>

          {/* Civic Advisory Banner */}
          <div className="rounded-xl bg-[#011D34] text-white p-5 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-400">cyclone</span>
              <h4 className="text-sm font-bold">Monsoon Preparedness Protocol</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ward 112 utility trenching freeze active through Nov 15. All non-emergency BESCOM and GAIL digging permits suspended along CMH Road corridor.
            </p>
            <div className="mt-1 flex items-center justify-between pt-1">
              <span className="text-[10px] text-cyan-300 font-mono font-bold">Advisory #BLR-W112-08</span>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Read Directive</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
