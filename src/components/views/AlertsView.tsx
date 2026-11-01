import React, { useState } from 'react';
import { Incident } from '../../types/incident';

interface AlertsViewProps {
  incidents: Incident[];
  onSelectIncident?: (incidentId: string) => void;
  onOpenBroadcastModal?: () => void;
  onOpenVoiceCopilot?: () => void;
}

export function AlertsView({
  incidents,
  onSelectIncident,
  onOpenBroadcastModal,
  onOpenVoiceCopilot,
}: AlertsViewProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'sla' | 'agency' | 'resolved'>('all');
  const [markedRead, setMarkedRead] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const criticalCount = incidents.filter((i) => i.priority === 'P1').length;
  const slaWarningCount = incidents.filter(
    (i) => i.status !== 'resolved' && i.slaDeadlineSeconds > 0 && i.slaDeadlineSeconds < 1800
  ).length;

  return (
    <div className="w-full px-4 lg:px-10 py-6 flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 px-4 py-2.5 rounded-lg bg-[#011d34] text-white text-xs font-bold shadow-xl border border-[#d9e2ff] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-amber-300">notifications_active</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hub Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#011d34] text-[#d0e4ff] text-[11px] font-bold uppercase tracking-wider">
              Ops Telemetry Command
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#43474d] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#0259c5] animate-pulse"></span>
              Sync Frequency: 1.2s • Node BLR-EAST-112
            </span>
          </div>
          <h1 className="text-2xl text-[#161c21] font-extrabold tracking-tight">
            Civic Operations Alerts & Notifications Hub
          </h1>
          <p className="text-xs text-[#43474d] max-w-4xl">
            Real-time dispatch telemetry, SLA breach warnings, multi-agency escalation triggers, and community resolution updates for Ward 112.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => {
              setMarkedRead(['all']);
              showToast('All 19 active telemetry notifications marked as read.');
            }}
            className="h-9 px-3.5 bg-[#eff4fb] hover:bg-[#dde3ea] text-[#161c21] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-[#d9e2ff]"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>Mark All Read</span>
          </button>
          <div className="h-9 p-0.5 bg-[#e9eef5] rounded-lg flex items-center gap-1">
            <button className="px-3 py-1 text-xs rounded-md bg-white text-[#0259c5] shadow-sm font-bold">
              Officer Mode
            </button>
            <button className="px-3 py-1 text-xs rounded-md text-[#43474d] hover:text-[#161c21]">
              Citizen View
            </button>
          </div>
          {onOpenBroadcastModal && (
            <button
              onClick={onOpenBroadcastModal}
              className="h-9 px-3.5 bg-[#ba1a1a] hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow"
            >
              <span className="material-symbols-outlined text-[18px]">cell_tower</span>
              <span>WEA Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Stat Bar (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Active */}
        <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#43474d] uppercase tracking-wider font-bold">Total Active Alerts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#161c21]">19</span>
              <span className="text-xs text-[#43474d] font-mono">/ 24h Queue</span>
            </div>
            <span className="mt-2 text-xs text-[#0259c5] flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_flat</span> Steady dispatch flow
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#eff4fb] flex items-center justify-center text-[#0259c5]">
            <span className="material-symbols-outlined text-[24px]">notifications_active</span>
          </div>
        </div>

        {/* Critical Life Safety */}
        <div className="p-5 rounded-xl bg-[#ffdad6] border border-red-200 shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#93000a] uppercase tracking-wider font-bold">Critical / Life-Safety</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#ba1a1a]">{criticalCount || 2}</span>
              <span className="text-xs text-[#93000a] font-semibold">Immediate Action</span>
            </div>
            <span className="mt-2 text-xs text-[#ba1a1a] flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">warning</span> Statutory Escalation
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center shadow animate-pulse">
            <span className="material-symbols-outlined text-[24px]">fmd_bad</span>
          </div>
        </div>

        {/* SLA Warnings */}
        <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#43474d] uppercase tracking-wider font-bold">SLA Warnings (&lt;30m)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#d95f00]">{slaWarningCount || 5}</span>
              <span className="text-xs text-[#43474d] font-mono">Breach Risk</span>
            </div>
            <span className="mt-2 text-xs text-[#d95f00] flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">timer</span> Crew reassignment suggested
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#ffdbca] text-[#783200] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
          </div>
        </div>

        {/* Verified Resolutions */}
        <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#43474d] uppercase tracking-wider font-bold">Verified Resolutions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#161c21]">12</span>
              <span className="text-xs text-[#43474d] font-mono">Closed Today</span>
            </div>
            <span className="mt-2 text-xs text-emerald-700 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span> 100% Cryptographic OTPs
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
        </div>
      </div>

      {/* Filter Tab Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All Alerts (19)' },
            { id: 'critical', label: 'Critical Life-Safety (2)' },
            { id: 'sla', label: 'SLA Breaches & Warnings (5)' },
            { id: 'agency', label: 'Agency Dispatches (7)' },
            { id: 'resolved', label: 'Community Updates (5)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                filter === tab.id
                  ? 'bg-[#0259c5] text-white'
                  : 'bg-white text-[#43474d] hover:text-[#161c21] border border-[#DCE3EE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#43474d] font-semibold">Telemetry Mode:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eff4fb] text-[#161c21] text-xs font-bold border border-[#d9e2ff]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0259c5]"></span> Auto-Dispatch Broadcast Enabled
          </span>
        </div>
      </div>

      {/* Main Grid: 8 Cols Stream, 4 Cols Ops Intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Chronological Alert Timeline */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* Group 1: Critical / Urgent Escalations */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ba1a1a] animate-ping"></span>
                <h2 className="text-base text-[#161c21] font-bold">
                  Group 1: Critical & Urgent Escalations (Today - Real-Time)
                </h2>
              </div>
              <span className="text-xs text-[#ba1a1a] font-bold font-mono">2 Critical Overrides Active</span>
            </div>

            {/* Alert Item 1: Severe 11kV Feeder Line */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a] animate-pulse"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-[#ffdad6] text-[#93000a] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">e911_emergency</span>
                    Emergency SLA Warning (&lt;15m Remaining)
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#eff4fb] text-[#43474d] font-semibold">
                    Incident #CV-8490
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#d9e2ff] text-[#001a43] font-bold">
                    AI Triage Confidence: 99.4%
                  </span>
                </div>
                <span className="text-xs text-[#43474d] font-mono">2 mins ago • Node #BLR-112-E</span>
              </div>

              <div className="pl-2 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-base text-[#161c21] font-bold">
                    11kV Feeder Line Severed near National Public School
                  </h3>
                  <p className="text-xs text-[#161c21] leading-relaxed">
                    High-voltage electrical conductor grounded across 12th Main Road. Citizens' Charter 2-hour safety breach triggered in{' '}
                    <strong className="text-red-700">14 minutes</strong>. BESCOM Quick Response Unit #41 is 1.2km away with 8m ETA.
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-[#43474d] bg-[#eff4fb] p-2.5 rounded-lg border border-[#dde3ea]">
                    <span className="flex items-center gap-1 text-[#ba1a1a] font-bold">
                      <span className="material-symbols-outlined text-[16px]">alarm</span> Elapsed: 1h 46m / 2h Limit
                    </span>
                    <span className="flex items-center gap-1 text-[#161c21] font-semibold">
                      <span className="material-symbols-outlined text-[16px]">navigation</span> Dispatch: BESCOM QRU-41
                    </span>
                    <span className="flex items-center gap-1 text-[#161c21] font-semibold">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> Indiranagar 12th Main
                    </span>
                  </div>
                </div>

                {/* Mini Incident Context Snippet */}
                <div className="w-full lg:w-48 flex-shrink-0 flex flex-col justify-between p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff]">
                  <span className="text-[10px] text-[#43474d] uppercase font-bold">Impact Assessment</span>
                  <div className="flex flex-col my-1">
                    <span className="text-base font-extrabold text-[#161c21]">850+ Pedestrians</span>
                    <span className="text-[11px] text-[#43474d]">School evacuation route</span>
                  </div>
                  <div className="w-full bg-[#dde3ea] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#ba1a1a] h-1.5 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>

              <div className="pl-2 pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-[#e9eef5]">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      if (onSelectIncident) onSelectIncident(incidents[0]?.id || 'inc-001');
                      showToast('Live tracking opened for BESCOM QRU-41 on Live Map.');
                    }}
                    className="h-8 px-3 rounded-lg bg-[#011d34] text-white hover:bg-[#022c4d] text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">near_me</span>
                    Track Crew GPS Live
                  </button>
                  <button
                    onClick={() => showToast('Backup Traffic Marshall dispatched to 12th Main junction.')}
                    className="h-8 px-3 rounded-lg bg-[#eff4fb] hover:bg-[#dde3ea] text-[#161c21] text-xs font-semibold flex items-center gap-1.5 transition-all border border-[#c3c6cd]"
                  >
                    <span className="material-symbols-outlined text-[16px]">shield_person</span>
                    Dispatch Backup Marshall
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenBroadcastModal) onOpenBroadcastModal();
                    }}
                    className="h-8 px-3 rounded-lg bg-[#d9e2ff] hover:bg-[#afc6ff] text-[#001a43] text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">sms</span>
                    Send Resident SMS Advisory (500m)
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (onSelectIncident) onSelectIncident(incidents[0]?.id || 'inc-001');
                  }}
                  className="text-xs text-[#0259c5] font-bold hover:underline flex items-center gap-1"
                >
                  Forensic Dossier <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Alert Item 2: Breach Penalty Logged */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a]"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-[#ba1a1a] text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">gavel</span>
                    Automatic SLA Breach Penalty Logged
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#eff4fb] text-[#43474d] font-semibold">
                    Incident #CV-8472
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#ffdad6] text-[#93000a] font-bold">
                    Breach +46m
                  </span>
                </div>
                <span className="text-xs text-[#43474d] font-mono">14 mins ago • Municipal Ledger</span>
              </div>

              <div className="pl-2 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-base text-[#161c21] font-bold">
                    Multiple Deep Asphalt Craters on CMH Road Exceeded 4h Window
                  </h3>
                  <p className="text-xs text-[#161c21] leading-relaxed">
                    Statutory breach penalty of <strong className="text-red-600">₹10,000/hr</strong> actively debited against BBMP Road Infrastructure Contractor #04. Incident escalated directly to Zonal Municipal Commissioner and District Public Dashboard.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 p-2.5 bg-[#eff4fb] rounded-lg text-xs border border-[#dde3ea]">
                    <div>
                      <span className="block text-[#43474d] text-[10px]">Contractor Assigned</span>
                      <span className="font-bold text-[#161c21]">M/S InfraTech Ward 112</span>
                    </div>
                    <div>
                      <span className="block text-[#43474d] text-[10px]">Accumulated Penalty</span>
                      <span className="font-bold text-red-600">₹10,000 (Hour 1 Charged)</span>
                    </div>
                    <div>
                      <span className="block text-[#43474d] text-[10px]">Next Penalty Tier</span>
                      <span className="font-semibold text-[#161c21]">₹20,000 at +1h 14m</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Photo */}
                <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-1">
                  <span className="text-[10px] text-[#43474d] font-bold uppercase">Sensor Evidence</span>
                  <img
                    className="w-full h-24 object-cover rounded-lg border border-[#dde3ea]"
                    alt="Pothole crater"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRnkcNxSflTwTJlH7Cn-TIOC93qYiD6OY4h9ts-cSO-FOS_Ireeh7wUMxr0MNfRDMttVXXV1yKuCC7hPk8p7MHycCp2Y6hksLR2XOhT6PCaEuw1ttE3Au3tulG1dZpR_RNz2W1OJVaUnXsuk2mlv9XxFaQph6hkkZ8t2KCJqgexnDq6DO7w5jyvdTswGXAjDkuYemon-FLJF5S5o9MPVcOOU-uUwS4PzsWpg7swfM"
                  />
                  <span className="text-[10px] text-[#43474d] text-center font-mono">Depth: 18cm • Geotagged</span>
                </div>
              </div>
            </div>

            {/* Alert Item 3: Verified Resolution */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4 relative overflow-hidden hover:shadow-md transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    Resolution Audit Verified & Signed
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#eff4fb] text-[#43474d] font-semibold">
                    Incident #CV-8402
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 font-bold">
                    100% SLA Compliance
                  </span>
                </div>
                <span className="text-xs text-[#43474d] font-mono">2 hrs ago • Civic Ledger</span>
              </div>

              <div className="pl-2 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-base text-[#161c21] font-bold">
                    Commercial Waste Dump Cleared at Metro Pillar 42
                  </h3>
                  <p className="text-xs text-[#161c21] leading-relaxed">
                    Solid waste segregation unit sanitized sidewalk. Closed upon receiving 2 citizen OTP verifications and before/after geofenced photography. Micro-penalty reversed for area sanitation beat officer.
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-[#43474d] bg-[#eff4fb] p-2.5 rounded-lg border border-[#dde3ea]">
                    <span className="flex items-center gap-1 text-[#161c21] font-medium">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">pin_drop</span> Geofence: Radius 12m match
                    </span>
                    <span className="flex items-center gap-1 text-[#161c21] font-medium">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">fingerprint</span> OTP Hashes: Verified (x2)
                    </span>
                  </div>
                </div>

                <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-1">
                  <span className="text-[10px] text-[#43474d] font-bold uppercase">Post-Remediation Proof</span>
                  <img
                    className="w-full h-24 object-cover rounded-lg border border-[#dde3ea]"
                    alt="Clean sidewalk"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD57AYkxqIJsx0gl6LHo8D6CbVZ97xC9IhohyvUUlalkZIEpxRmx5Zc5ReFv7ZRNfLA90G3GpsEjxHdQzMDI59QJpAzfS_NQOBKPYLn82psgpayAT-kR-3RNONLWksbq6_TbDiuTXe2g5pYf84agpVUCHNS4wIEd086aMBYs3lTLGM9H0Kg4yufZcWQhlHUb77CwiH1kMhCOT-dlSu6D0gRVUGV78hEgxworRBzzzk"
                  />
                  <span className="text-[10px] text-emerald-700 font-bold text-center">Post-Remediation Hash #002</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Alert Intelligence, Escalation Matrix */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          {/* Escalation Matrix */}
          <div className="p-5 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0259c5] text-[22px]">account_tree</span>
                <h3 className="text-base text-[#161c21] font-bold">Escalation Matrix & SLAs</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#eff4fb] text-[#001a43] font-bold">
                Sakala Act 2011
              </span>
            </div>
            <p className="text-xs text-[#43474d] leading-relaxed">
              Under Karnataka Sakala Services Act, incidents follow automated bureaucratic promotion based on elapsed response time.
            </p>

            {/* Stepper */}
            <div className="flex flex-col gap-4 relative pl-6 border-l-2 border-[#dde3ea] mt-1">
              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#0259c5]"></span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#161c21]">Tier 1: Field Unit Dispatch</span>
                  <span className="text-[10px] text-[#43474d] font-mono">0 - 15m</span>
                </div>
                <p className="text-[11px] text-[#43474d]">Automatic GPS routing to nearest squad vehicle within 2.5km radius.</p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#0259c5]"></span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#161c21]">Tier 2: Asst. Executive Engineer Alert</span>
                  <span className="text-[10px] text-[#d95f00] font-bold">50% SLA Elapsed</span>
                </div>
                <p className="text-[11px] text-[#43474d]">Supervisory phone ping & dashboard escalation triggered automatically.</p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#d95f00]"></span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#161c21]">Tier 3: Chief Engineer & Zonal Comm.</span>
                  <span className="text-[10px] text-[#d95f00] font-bold">75% SLA Elapsed</span>
                </div>
                <p className="text-[11px] text-[#43474d]">Multi-agency hotline conference opened, contractor alert warning posted.</p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#ba1a1a]"></span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ba1a1a]">Tier 4: Statutory Penalty Debited</span>
                  <span className="text-[10px] text-red-600 font-bold">100% Breach</span>
                </div>
                <p className="text-[11px] text-[#43474d]">Automatic daily fine debit (₹10,000/hr) logged in Government Gazette ledger.</p>
              </div>
            </div>
          </div>

          {/* Copilot Dispatch Radio Card */}
          {onOpenVoiceCopilot && (
            <div className="p-5 rounded-xl bg-[#011d34] text-white shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-cyan-400">cell_tower</span>
                  <h4 className="text-sm font-bold">Gemini Dispatch Radio</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900 text-cyan-200 font-mono font-bold">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect directly to Ward 112 AI Dispatch Officer via live speech radio, grounded in Google Search and Google Maps telemetry.
              </p>
              <button
                onClick={onOpenVoiceCopilot}
                className="w-full py-2.5 rounded-lg bg-[#0259c5] hover:bg-[#004397] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
              >
                <span className="material-symbols-outlined text-[18px]">radio</span>
                Open Voice Radio Copilot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
