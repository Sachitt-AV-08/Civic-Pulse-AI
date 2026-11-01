import React, { useState } from 'react';

export interface PredictedHotspot {
  id: string;
  name: string;
  corridor: string;
  category: 'Electrical' | 'Roads' | 'Water' | 'Traffic';
  riskScore: number; // 0 - 100
  timeWindow: string;
  primaryHazard: string;
  contributingFactors: string[];
  recommendedPreemptiveAction: string;
  assignedPreemptiveAgency: string;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  };
  historicalIncidentMatchCount: number;
}

export const PREDICTED_HOTSPOTS: PredictedHotspot[] = [
  {
    id: 'pred-01',
    name: '12th Main Rd & NPS School Crossing',
    corridor: 'Ward 112 East Sector • Grid E4',
    category: 'Electrical',
    riskScore: 94,
    timeWindow: '17:30 - 19:15 IST (Evening Peak)',
    primaryHazard: '11kV Feeder Cable Arc & Standing Water Electrocution Risk',
    contributingFactors: [
      '34mm monsoon precipitation in past 4 hours',
      'Underground trenching excavation active by telecom subcontractor',
      'Peak residential AC/evening transformer load spike expected at 18:00',
    ],
    recommendedPreemptiveAction:
      'Pre-stage BESCOM QRU-41 squad at 12th Main and inspect breaker lock #B-14',
    assignedPreemptiveAgency: 'BESCOM Quick Response Unit #41',
    coordinates: { lat: 12.9784, lng: 77.6408, mapX: 42, mapY: 38 },
    historicalIncidentMatchCount: 14,
  },
  {
    id: 'pred-02',
    name: 'CMH Road Metro Station & 80ft Junction',
    corridor: 'Metro Rail Sub-surface Zone • Grid C2',
    category: 'Roads',
    riskScore: 86,
    timeWindow: '18:00 - 20:30 IST (Commuter Surge)',
    primaryHazard: 'Flash Sinkhole & Sub-base Asphalt Crater Delamination',
    contributingFactors: [
      'Heavy BMTC double-axle bus vibration frequency',
      'Stormwater drain back-pressure erosion beneath asphalt layer',
      '8 citizen reports of mini-subsidence in last 48 hours',
    ],
    recommendedPreemptiveAction:
      'Deploy BBMP Road Marshall squad with rapid cold-mix asphalt patch unit',
    assignedPreemptiveAgency: 'BBMP Ward 112 Infra Marshall #02',
    coordinates: { lat: 12.9785, lng: 77.6385, mapX: 25, mapY: 30 },
    historicalIncidentMatchCount: 22,
  },
  {
    id: 'pred-03',
    name: '100ft Road & 6th Cross Intersection',
    corridor: 'Primary Commercial Arterial • Grid F7',
    category: 'Water',
    riskScore: 79,
    timeWindow: '18:00 - 19:45 IST (Valve Switching)',
    primaryHazard: '36-inch Main Conduit High-Pressure Leak / Footpath Submergence',
    contributingFactors: [
      'BWSSB Stage II booster pump cycle peak pressure surge (>4.8 bar)',
      'Subsurface cast-iron pipe age (installed 1994) exceeding fatigue threshold',
      'Nearby commercial basement sump pump discharge backflow',
    ],
    recommendedPreemptiveAction:
      'Throttle gate valve #14 at HAL 2nd Stage station and alert BWSSB repair squad',
    assignedPreemptiveAgency: 'BWSSB East Water Works Div #01',
    coordinates: { lat: 12.971, lng: 77.6415, mapX: 68, mapY: 72 },
    historicalIncidentMatchCount: 9,
  },
  {
    id: 'pred-04',
    name: 'Defense Colony 2nd Main & 4th Cross',
    corridor: 'Residential Low-Rise Sector • Grid D5',
    category: 'Traffic',
    riskScore: 71,
    timeWindow: '20:00 - 22:30 IST (Night Commercial Egress)',
    primaryHazard: 'Gridlock spillover & high-mast LED circuit breaker tripping',
    contributingFactors: [
      'Narrow lane diversion caused by 100ft road waterlogging',
      'Night restaurant delivery two-wheeler density spike',
      'Phase 3 electrical ballast heating in 6 high-mast streetlights',
    ],
    recommendedPreemptiveAction:
      'Activate Traffic Police bypass signal cycle and BESCOM ballast thermal scan',
    assignedPreemptiveAgency: 'Traffic Police Indiranagar Sub-station',
    coordinates: { lat: 12.975, lng: 77.648, mapX: 82, mapY: 48 },
    historicalIncidentMatchCount: 11,
  },
];

interface PredictiveForecastingWidgetProps {
  onSelectHotspot?: (hotspot: PredictedHotspot) => void;
  onPrestageDispatch?: (hotspot: PredictedHotspot) => void;
  isLayerActive: boolean;
  onToggleLayer: () => void;
}

export const PredictiveForecastingWidget: React.FC<PredictiveForecastingWidgetProps> = ({
  onSelectHotspot,
  onPrestageDispatch,
  isLayerActive,
  onToggleLayer,
}) => {
  const [forecastHorizon, setForecastHorizon] = useState<'2h' | '4h' | '8h' | '24h'>('2h');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(PREDICTED_HOTSPOTS[0].id);
  const [prestageSuccess, setPrestageSuccess] = useState<string | null>(null);

  const selectedHotspot =
    PREDICTED_HOTSPOTS.find((h) => h.id === selectedHotspotId) || PREDICTED_HOTSPOTS[0];

  const handlePrestage = (hotspot: PredictedHotspot) => {
    if (onPrestageDispatch) {
      onPrestageDispatch(hotspot);
    }
    setPrestageSuccess(hotspot.id);
    setTimeout(() => setPrestageSuccess(null), 4000);
  };

  // 24-hour temporal risk distribution curve
  const hourlyRiskCurve = [
    { hour: '06:00', risk: 62, primary: 'Water Surge' },
    { hour: '09:00', risk: 78, primary: 'Traffic Jam' },
    { hour: '12:00', risk: 45, primary: 'Road Repair' },
    { hour: '15:00', risk: 58, primary: 'Precipitation' },
    { hour: '18:00', risk: 94, primary: '11kV Feeder' },
    { hour: '21:00', risk: 72, primary: 'Night Outage' },
    { hour: '00:00', risk: 38, primary: 'Low Risk' },
    { hour: '03:00', risk: 24, primary: 'Low Risk' },
  ];

  return (
    <div className="rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col overflow-hidden select-none">
      {/* Widget Header */}
      <div className="p-4 bg-gradient-to-r from-[#011D34] via-[#022c4d] to-[#011D34] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5790FF]/20 border border-[#5790FF]/40 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined text-[20px]">insights</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">AI Predictive Hotspot Forecasting</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ML Model v4.2
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Historical Bayesian spatial-temporal model trained on 4,920 Ward 112 incidents
            </p>
          </div>
        </div>

        {/* Map Layer Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLayer}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isLayerActive
                ? 'bg-[#0259C5] text-white border border-cyan-400/50'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLayerActive ? 'visibility' : 'visibility_off'}
            </span>
            <span>{isLayerActive ? 'Hotspot Layer: ON' : 'Show on Map'}</span>
          </button>
        </div>
      </div>

      {/* Horizon Selector & Live Summary Strip */}
      <div className="px-4 py-3 bg-[#eff4fb] border-b border-[#dde3ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#43474d] font-bold uppercase tracking-wider">
            Forecast Horizon:
          </span>
          <div className="flex items-center p-0.5 bg-white rounded-lg border border-[#c3c6cd]">
            {(
              [
                { id: '2h', label: '+2h Peak' },
                { id: '4h', label: '+4h Night' },
                { id: '8h', label: '+8h Extended' },
                { id: '24h', label: '24h Full Day' },
              ] as const
            ).map((h) => (
              <button
                key={h.id}
                onClick={() => setForecastHorizon(h.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  forecastHorizon === h.id
                    ? 'bg-[#011D34] text-white shadow-xs'
                    : 'text-[#43474d] hover:text-[#161c21]'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#161c21] font-mono">
          <span className="flex items-center gap-1 text-red-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            1 Critical Predicted Hotspot
          </span>
          <span className="text-[#43474d]">|</span>
          <span className="text-[#0259c5] font-semibold">94% Confidence</span>
        </div>
      </div>

      {/* Main 2-Column Forecast Workspace */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Predicted Hotspots List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-[#43474d] uppercase tracking-wider flex items-center justify-between">
            <span>Probable Incident Hotspots</span>
            <span className="font-mono text-[10px] text-[#0259c5]">Ranked by Risk Score</span>
          </span>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {PREDICTED_HOTSPOTS.map((hotspot) => {
              const isSelected = selectedHotspotId === hotspot.id;
              const isCritical = hotspot.riskScore >= 90;
              const isUrgent = hotspot.riskScore >= 75 && hotspot.riskScore < 90;

              return (
                <div
                  key={hotspot.id}
                  onClick={() => {
                    setSelectedHotspotId(hotspot.id);
                    if (onSelectHotspot) onSelectHotspot(hotspot);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#eff4fb] border-[#0259c5] ring-2 ring-[#0259c5]/20 shadow-xs'
                      : 'bg-white border-[#dde3ea] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCritical ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
                        }`}
                      ></span>
                      {hotspot.riskScore}% {hotspot.category}
                    </span>
                    <span className="text-[10px] text-[#43474d] font-mono">
                      {hotspot.historicalIncidentMatchCount} Past Incidents
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#161c21] line-clamp-1">{hotspot.name}</div>
                  <div className="text-[11px] text-[#43474d]">{hotspot.timeWindow}</div>

                  <div className="w-full bg-[#dde3ea] rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-red-600' : isUrgent ? 'bg-amber-500' : 'bg-[#0259c5]'
                      }`}
                      style={{ width: `${hotspot.riskScore}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Hotspot Intelligence & Preemptive Action (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3 p-4 rounded-xl bg-[#eff4fb] border border-[#d9e2ff]">
          {/* Card Title & Coordinates */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-red-600">
                  crisis_alert
                </span>
                <h4 className="text-sm font-bold text-[#161c21]">{selectedHotspot.name}</h4>
              </div>
              <p className="text-[11px] text-[#43474d] mt-0.5">
                {selectedHotspot.corridor} • GPS:{' '}
                <span className="font-mono font-semibold">
                  {selectedHotspot.coordinates.lat.toFixed(4)}°N,{' '}
                  {selectedHotspot.coordinates.lng.toFixed(4)}°E
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                if (onSelectHotspot) onSelectHotspot(selectedHotspot);
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-[#c3c6cd] hover:border-[#0259c5] text-xs font-bold text-[#0259c5] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">my_location</span>
              Pin on Map
            </button>
          </div>

          {/* Primary Hazard Callout */}
          <div className="p-3 rounded-lg bg-white border border-red-200 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              Predicted Critical Incident
            </span>
            <p className="text-xs font-bold text-[#161c21]">{selectedHotspot.primaryHazard}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#43474d]">
              <span className="material-symbols-outlined text-[14px] text-amber-600">schedule</span>
              <span>Projected Impact Window: <strong className="text-[#161c21]">{selectedHotspot.timeWindow}</strong></span>
            </div>
          </div>

          {/* Bayesian Contributing Factors */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-[#43474d] uppercase tracking-wider">
              Telemetry Drivers & Environmental Correlations
            </span>
            <div className="flex flex-col gap-1">
              {selectedHotspot.contributingFactors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[#161c21] bg-white p-2 rounded-md border border-[#dde3ea]"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#0259c5] mt-0.5">
                    check_circle
                  </span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Preemptive Dispatch & Action */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-[#011D34] to-[#022c4d] text-white flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                Automated Preemptive Mitigation Protocol
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">
                SLA Prevention
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100">
              {selectedHotspot.recommendedPreemptiveAction}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-cyan-400">shield</span>
                Agency: <strong className="text-white">{selectedHotspot.assignedPreemptiveAgency}</strong>
              </span>

              <button
                onClick={() => handlePrestage(selectedHotspot)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {prestageSuccess === selectedHotspot.id ? 'done' : 'near_me'}
                </span>
                <span>
                  {prestageSuccess === selectedHotspot.id ? 'Squad Staged!' : 'Authorize Pre-stage'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Probabilistic Risk Curve Histogram */}
      <div className="px-4 py-3 bg-[#f6faff] border-t border-[#dde3ea] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#43474d] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#0259c5]">bar_chart</span>
            24-Hour Cumulative Incident Probability Distribution
          </span>
          <span className="text-[11px] text-[#43474d]">
            Peak Risk Horizon: <strong className="text-red-600">17:30 - 19:30 IST (94% Surge)</strong>
          </span>
        </div>

        {/* Bar Histogram */}
        <div className="grid grid-cols-8 gap-2 pt-1 items-end h-16">
          {hourlyRiskCurve.map((slot, i) => {
            const isPeak = slot.risk >= 90;
            return (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end group">
                <div
                  className="w-full rounded-t transition-all duration-300 relative group-hover:opacity-90"
                  style={{
                    height: `${slot.risk}%`,
                    backgroundColor: isPeak ? '#BA1A1A' : slot.risk > 70 ? '#D95F00' : '#0259C5',
                  }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-mono whitespace-nowrap transition-opacity pointer-events-none z-20">
                    {slot.risk}% ({slot.primary})
                  </span>
                </div>
                <span className="text-[10px] text-[#43474d] font-mono leading-none">{slot.hour}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
