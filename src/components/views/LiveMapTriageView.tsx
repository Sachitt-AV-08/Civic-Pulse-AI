import React, { useState } from 'react';
import { Incident, PriorityLevel } from '../../types/incident';
import { AudioPlayer } from '../AudioPlayer';
import {
  Layers,
  Shield,
  Car,
  MapPin,
  Search,
  ExternalLink,
  Loader2,
  Clock,
  Radio,
  FileText,
  Camera,
  Maximize2,
  Users,
  Send,
  Sliders,
  CheckCircle,
  Scale,
  Building,
  History,
  Sparkles,
  Bot,
} from 'lucide-react';
import { playAcknowledgeBeep } from '../../utils/audio';
import {
  PredictiveForecastingWidget,
  PREDICTED_HOTSPOTS,
  PredictedHotspot,
} from '../PredictiveForecastingWidget';
import { calculateAIRecommendedPriority, getSeverityScoreStyle } from '../../utils/aiPriorityScorer';

interface LiveMapTriageViewProps {
  incidents: Incident[];
  selectedIncident: Incident;
  onSelectIncident: (inc: Incident) => void;
  onDispatchUnits: (incidentId: string) => void;
  onOverridePriority: (incidentId: string, newPriority: PriorityLevel, reason: string) => void;
  onResolveIncident: (incidentId: string) => void;
  onOpenBroadcastModal: () => void;
  onOpenCopilot: () => void;
  onAcceptAIPriority?: (incidentId: string) => void;
}

export const LiveMapTriageView: React.FC<LiveMapTriageViewProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onDispatchUnits,
  onOverridePriority,
  onResolveIncident,
  onOpenBroadcastModal,
  onOpenCopilot,
  onAcceptAIPriority,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCrews, setShowCrews] = useState(true);
  const [mapsQuery, setMapsQuery] = useState('');
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>(selectedIncident.priority);
  const [overrideReason, setOverrideReason] = useState('');
  const [showForecastingWidget, setShowForecastingWidget] = useState(true);
  const [showHotspotLayer, setShowHotspotLayer] = useState(true);
  const [highlightedHotspot, setHighlightedHotspot] = useState<PredictedHotspot | null>(null);

  // Google Maps place pins
  const [googlePlaces, setGooglePlaces] = useState<any[]>([
    {
      id: 'g-1',
      title: 'Chinmaya Mission Hospital (Trauma Care)',
      address: 'CMH Road, Indiranagar',
      uri: 'https://maps.google.com/?cid=1298492817293847',
      x: 65,
      y: 26,
    },
    {
      id: 'g-2',
      title: 'BESCOM Indiranagar Substation',
      address: '100 Feet Road, Ward 112',
      uri: 'https://maps.google.com/?cid=9837492817294829',
      x: 52,
      y: 35,
    },
    {
      id: 'g-3',
      title: 'Indiranagar Fire & Rescue Station',
      address: 'Old Airport Road Junction',
      uri: 'https://maps.google.com/?cid=4729103948271029',
      x: 74,
      y: 72,
    },
  ]);

  const filteredIncidents = incidents.filter((inc) => {
    if (categoryFilter === 'POWER' && inc.category !== 'Power Grid') return false;
    if (categoryFilter === 'ROADS' && inc.category !== 'Public Works') return false;
    if (categoryFilter === 'WATER' && inc.category !== 'Water & Utilities') return false;
    if (categoryFilter === 'TRAFFIC' && inc.category !== 'Traffic & Transit') return false;

    if (severityFilter === 'CRITICAL' && inc.priority !== 'P1') return false;
    if (severityFilter === 'URGENT' && inc.priority !== 'P2') return false;
    if (severityFilter === 'HIGH' && inc.priority !== 'P3') return false;
    if (severityFilter === 'NORMAL' && inc.priority !== 'P4') return false;

    return true;
  });

  // Simulated live field emergency units with map positions
  const fieldUnits = [
    { id: 'BESCOM-09', name: 'BESCOM High-Voltage Crew', x: 44, y: 46, status: 'En Route', targetId: 'inc-01' },
    { id: 'BBMP-T1', name: 'BBMP Cordon Unit', x: 52, y: 39, status: 'En Route', targetId: 'inc-01' },
    { id: 'BWSSB-04', name: 'BWSSB Main Isolation', x: 60, y: 32, status: 'En Route', targetId: 'inc-02' },
    { id: 'BBMP-R9', name: 'BBMP Road Plating Crew', x: 70, y: 22, status: 'En Route', targetId: 'inc-03' },
    { id: 'VAC-04', name: 'Hydro Vactor 04', x: 80, y: 46, status: 'On Scene', targetId: 'inc-05' },
  ];

  const formatSla = (seconds: number) => {
    if (seconds <= 0) return '00:00:00 (BREACHED)';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'P1':
        return '#ba1a1a';
      case 'P2':
        return '#f97316';
      case 'P3':
        return '#d97706';
      default:
        return '#0259c5';
    }
  };

  const handleQueryGoogleMaps = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapsQuery.trim()) return;

    setIsSearchingMaps(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Find facilities and points of interest for: ${mapsQuery} near ${selectedIncident.location.address}`,
            },
          ],
          useGoogleMaps: true,
          userLocation: { latitude: selectedIncident.location.lat, longitude: selectedIncident.location.lng },
        }),
      });

      const data = await res.json();
      if (data.groundingChunks && data.groundingChunks.length > 0) {
        const newPins = data.groundingChunks
          .filter((c: any) => c.maps)
          .map((c: any, index: number) => ({
            id: `g-query-${Date.now()}-${index}`,
            title: c.maps.title || 'Google Maps Verified Place',
            uri: c.maps.uri || 'https://maps.google.com',
            x: Math.floor(35 + Math.random() * 45),
            y: Math.floor(25 + Math.random() * 50),
          }));

        if (newPins.length > 0) {
          setGooglePlaces((prev) => [...newPins, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMaps(false);
      setMapsQuery('');
    }
  };

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    onOverridePriority(selectedIncident.id, overridePriority, overrideReason);
    setIsOverrideModalOpen(false);
    setOverrideReason('');
  };

  return (
    <div className="flex flex-col w-full select-none">
      {/* Sub-Header Telemetry Ticker (Matches Stitch) */}
      <div className="w-full bg-[#EFF4FB] px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE3EE]">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2 font-heading font-semibold text-[#161C21]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0259C5] animate-pulse"></span>
            <span>Ward 112 Command Console</span>
            <span className="text-[#74777E] font-normal font-mono">| Sector: Indiranagar Core GIS</span>
          </div>

          <span className="text-[#C3C6CD] hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 text-[#43474D] font-mono">
            <span className="material-symbols-outlined text-[16px] text-[#0259C5]">satellite_alt</span>
            <span>Satellite Geodesic Link: <strong className="text-[#161C21]">RTK Lock (99.84%)</strong></span>
          </div>

          <span className="text-[#C3C6CD] hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#E9EEF5] text-[#43474D] font-mono">
            <span className="material-symbols-outlined text-[14px]">sensors</span>
            <span>Queue Latency: 142ms</span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#43474D]">Active Incidents:</span>
            <span className="font-bold text-[#161C21] px-1.5 py-0.5 rounded bg-[#DDE3EA]">142</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#43474D]">Dispatched Units:</span>
            <span className="font-bold text-[#0259C5] px-1.5 py-0.5 rounded bg-[#D9E2FF]">18 Active</span>
          </div>
          <div className="flex items-center gap-1 text-[#BA1A1A] font-bold">
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span>2 Overdue SLAs</span>
          </div>
        </div>
      </div>

      {/* Main Split View: 65% Map Canvas | 35% Incident Dossier */}
      <div className="w-full flex flex-col xl:flex-row min-h-[calc(100vh-8.5rem)]">
        {/* LEFT COLUMN: Municipal GIS Map Canvas (65% width) */}
        <div className="w-full xl:w-[65%] flex flex-col relative bg-[#EFF4FB] border-r border-[#DCE3EE]">
          {/* Filter & Controls Toolbar */}
          <div className="p-3.5 bg-white border-b border-[#DCE3EE] shadow-xs flex flex-col gap-2.5 z-20">
            {/* Category Pill Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                }`}
              >
                <span>All Incidents</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded-full font-mono text-[10px]">142</span>
              </button>

              <button
                onClick={() => setCategoryFilter('POWER')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === 'POWER'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#BA1A1A]"></span>
                <span>Electrical & Power</span>
                <span className="text-[#43474D] font-mono text-[11px]">(8)</span>
              </button>

              <button
                onClick={() => setCategoryFilter('ROADS')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === 'ROADS'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#D95F00]"></span>
                <span>Potholes & Roads</span>
                <span className="text-[#43474D] font-mono text-[11px]">(34)</span>
              </button>

              <button
                onClick={() => setCategoryFilter('WATER')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === 'WATER'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#0259C5]"></span>
                <span>Water & Sanitation</span>
                <span className="text-[#43474D] font-mono text-[11px]">(21)</span>
              </button>

              <button
                onClick={() => setCategoryFilter('TRAFFIC')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === 'TRAFFIC'
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#49607A]"></span>
                <span>Traffic & Signals</span>
                <span className="text-[#43474D] font-mono text-[11px]">(18)</span>
              </button>
            </div>

            {/* Filter Sub-bar: Severity, Heatmap, Google Maps Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F1F5F9] text-xs">
              {/* Severity Buttons */}
              <div className="flex items-center gap-1 bg-[#EFF4FB] p-1 rounded-lg">
                <span className="text-[11px] text-[#43474D] px-1 font-semibold uppercase font-mono">SEVERITY:</span>
                {(['ALL', 'CRITICAL', 'URGENT', 'HIGH', 'NORMAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      severityFilter === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-[#FFDAD6] text-[#93000A] font-bold'
                          : 'bg-[#001D34] text-white'
                        : 'text-[#161C21] hover:bg-[#E9EEF5]'
                    }`}
                  >
                    {sev === 'CRITICAL' ? 'Critical (4)' : sev === 'URGENT' ? 'Urgent (11)' : sev === 'HIGH' ? 'High' : sev === 'NORMAL' ? 'Normal' : 'All'}
                  </button>
                ))}
              </div>

              {/* Secondary Controls & Google Maps Query */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Google Maps Search Bar */}
                <form onSubmit={handleQueryGoogleMaps} className="flex items-center gap-1 bg-[#EFF4FB] p-0.5 rounded border border-[#CBD5E1]">
                  <span className="material-symbols-outlined text-[16px] text-[#0259C5] pl-1.5">pin_drop</span>
                  <input
                    type="text"
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="Query Google Maps..."
                    className="w-28 lg:w-36 h-6 text-[11px] px-1 bg-transparent text-[#161C21] focus:outline-none placeholder:text-[#74777E]"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingMaps || !mapsQuery.trim()}
                    className="px-2 py-0.5 bg-[#0259C5] text-white text-[10.5px] rounded font-semibold cursor-pointer disabled:opacity-40"
                  >
                    {isSearchingMaps ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
                  </button>
                </form>

                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    showHeatmap ? 'bg-[#FFDBCA] text-[#783200] border border-[#FFB690]' : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#D95F00]">local_fire_department</span>
                  <span>Heatmap</span>
                </button>

                <button
                  onClick={() => setShowCrews(!showCrews)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    showCrews ? 'bg-[#D9E2FF] text-[#001A43] border border-[#5790FF]' : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0259C5]">fmd_good</span>
                  <span>Live Crews (18)</span>
                </button>

                <button
                  onClick={() => setShowForecastingWidget(!showForecastingWidget)}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showForecastingWidget
                      ? 'bg-[#011D34] text-white shadow-xs border border-cyan-400/40'
                      : 'bg-[#E9EEF5] text-[#161C21] hover:bg-[#E3E9F0]'
                  }`}
                  title="Toggle Predictive Hotspot & Temporal Risk Analytics Widget"
                >
                  <span className="material-symbols-outlined text-[16px] text-cyan-300">insights</span>
                  <span>Forecasting {showForecastingWidget ? 'Active' : 'Closed'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SVG Canvas Map Area (Ward 112 Indiranagar Grid) */}
          <div className="relative flex-1 w-full min-h-[580px] bg-[#EBF0F7] overflow-hidden select-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 680"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DDE5EF" strokeWidth="1" />
                </pattern>
                <radialGradient id="heat-glow" cx="48%" cy="42%" r="32%">
                  <stop offset="0%" stopColor="#BA1A1A" stopOpacity="0.38" />
                  <stop offset="50%" stopColor="#D95F00" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#F6FAFF" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Coordinate Grid */}
              <rect width="100%" height="100%" fill="#EBF0F7" />
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* Heatmap Layer */}
              {showHeatmap && (
                <ellipse cx="480" cy="360" rx="280" ry="200" fill="url(#heat-glow)" />
              )}

              {/* Ward 112 Poly Boundary Footprint */}
              <polygon
                points="60,40 940,30 960,630 820,660 140,640 40,480"
                fill="#0259C5"
                fillOpacity="0.04"
                stroke="#0259C5"
                strokeWidth="2"
                strokeDasharray="6,4"
              />

              {/* Defence Colony Park / Green Corridor */}
              <polygon points="180,80 320,70 310,180 170,170" fill="#D3E8D8" opacity="0.85" rx="8" />
              <text x="190" y="130" fill="#2E6930" fontSize="11" fontWeight="600" opacity="0.8">
                DEFENCE COLONY PARK
              </text>

              {/* 100 Feet Road Commercial Buffer Zone */}
              <rect x="510" y="50" width="80" height="560" fill="#E2E8F0" opacity="0.6" rx="6" />

              {/* 100 Feet Road (North-South Main Spine) */}
              <line x1="550" y1="20" x2="550" y2="660" stroke="#FFFFFF" strokeWidth="16" />
              <line x1="550" y1="20" x2="550" y2="660" stroke="#B0C2D9" strokeWidth="2" strokeDasharray="8,6" />
              <text x="560" y="90" fill="#475569" fontSize="11" fontWeight="700" letterSpacing="1">
                100 FEET ROAD (ARTERIAL SPINE)
              </text>

              {/* CMH Road (East-West Commercial Artery) */}
              <line x1="40" y1="220" x2="960" y2="220" stroke="#FFFFFF" strokeWidth="14" />
              <line x1="40" y1="220" x2="960" y2="220" stroke="#B0C2D9" strokeWidth="2" strokeDasharray="8,6" />
              <text x="120" y="210" fill="#475569" fontSize="10.5" fontWeight="700" letterSpacing="1">
                CMH ROAD (CHINMAYA MISSION HOSPITAL RD)
              </text>

              {/* 12th Main Road (Where Incident CV-8490 is located) */}
              <line x1="400" y1="40" x2="400" y2="640" stroke="#FFFFFF" strokeWidth="10" />
              <text x="320" y="320" fill="#475569" fontSize="10" fontWeight="600">
                12TH MAIN ROAD
              </text>

              {/* Old Airport Road */}
              <line x1="60" y1="580" x2="940" y2="580" stroke="#FFFFFF" strokeWidth="12" />
              <text x="680" y="570" fill="#475569" fontSize="10.5" fontWeight="700">
                OLD AIRPORT ROAD
              </text>

              {/* Secondary Cross Streets Grid */}
              {[120, 300, 380, 460, 520].map((y) => (
                <line key={`cross-${y}`} x1="80" y1={y} x2="920" y2={y} stroke="#D8E2ED" strokeWidth="4" />
              ))}
              {[220, 680, 780, 860].map((x) => (
                <line key={`vert-${x}`} x1={x} y1="40" x2={x} y2="640" stroke="#D8E2ED" strokeWidth="4" />
              ))}

              {/* Bangalore Metro Line Elevated Flyover */}
              <line x1="40" y1="220" x2="960" y2="220" stroke="#7C3AED" strokeWidth="3" strokeDasharray="6,4" opacity="0.6" />
              <rect x="535" y="205" width="30" height="30" rx="4" fill="#6D28D9" />
              <text x="550" y="224" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">M</text>
              <text x="575" y="235" fill="#6D28D9" fontSize="10" fontWeight="bold">Indiranagar Metro</text>

              {/* Cordon Perimeter Circle around CV-8490 */}
              <circle
                cx={(selectedIncident.location.mapX / 100) * 1000}
                cy={(selectedIncident.location.mapY / 100) * 680}
                r="44"
                fill="#BA1A1A"
                fillOpacity="0.14"
                stroke="#BA1A1A"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              >
                <animate attributeName="r" values="38;50;38" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Google Maps Places */}
              {googlePlaces.map((place) => (
                <g key={place.id} transform={`translate(${(place.x / 100) * 1000}, ${(place.y / 100) * 680})`} className="cursor-pointer">
                  <circle r="12" fill="#0259C5" fillOpacity="0.2" stroke="#0259C5" strokeWidth="1.5" />
                  <circle r="6" fill="#0259C5" stroke="#FFFFFF" strokeWidth="1.5" />
                  <g transform="translate(10, -10)">
                    <rect x="0" y="0" width="16" height="13" rx="2" fill="#0259C5" />
                    <text x="8" y="10" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">G</text>
                  </g>
                </g>
              ))}

              {/* Dispatched Field Units */}
              {showCrews &&
                fieldUnits.map((u) => {
                  const ux = (u.x / 100) * 1000;
                  const uy = (u.y / 100) * 680;
                  return (
                    <g key={u.id} transform={`translate(${ux}, ${uy})`}>
                      <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#011D34" stroke="#5790FF" strokeWidth="1.5" />
                      <text x="0" y="4" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {u.id.split('-')[0]}
                      </text>
                      <text x="16" y="4" fill="#011D34" fontSize="10" fontWeight="bold" className="font-mono">
                        {u.id}
                      </text>
                    </g>
                  );
                })}

              {/* Probabilistic AI Forecasted Hotspots Layer */}
              {showHotspotLayer &&
                PREDICTED_HOTSPOTS.map((hotspot) => {
                  const px = (hotspot.coordinates.mapX / 100) * 1000;
                  const py = (hotspot.coordinates.mapY / 100) * 680;
                  const isHighlighted = highlightedHotspot?.id === hotspot.id;
                  const isCritical = hotspot.riskScore >= 90;
                  const color = isCritical ? '#BA1A1A' : '#D95F00';

                  return (
                    <g
                      key={hotspot.id}
                      onClick={() => setHighlightedHotspot(hotspot)}
                      transform={`translate(${px}, ${py})`}
                      className="cursor-pointer"
                    >
                      {/* Animated probabilistic risk dispersal ring */}
                      <circle
                        r={isHighlighted ? '54' : '44'}
                        fill={color}
                        fillOpacity="0.14"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeDasharray="4,2"
                      >
                        <animate
                          attributeName="r"
                          values={`${isHighlighted ? 44 : 36};${isHighlighted ? 62 : 52};${
                            isHighlighted ? 44 : 36
                          }`}
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </circle>

                      <circle r="6" fill={color} stroke="#FFFFFF" strokeWidth="2" />

                      <g transform="translate(10, -14)">
                        <rect
                          x="0"
                          y="0"
                          width="110"
                          height="18"
                          rx="3"
                          fill="#011D34"
                          stroke={color}
                          strokeWidth="1"
                        />
                        <text
                          x="55"
                          y="12"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          🔮 PREDICTED {hotspot.riskScore}%
                        </text>
                      </g>
                    </g>
                  );
                })}

              {/* Incident Pins */}
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident.id === inc.id;
                const px = (inc.location.mapX / 100) * 1000;
                const py = (inc.location.mapY / 100) * 680;
                const color = getPriorityColor(inc.priority);

                return (
                  <g
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    transform={`translate(${px}, ${py})`}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle r="22" fill="none" stroke="#001C33" strokeWidth="2.5" strokeDasharray="3,2">
                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r="13" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
                    <circle r="6.5" fill={color} stroke="#FFFFFF" strokeWidth="2" />

                    <g transform="translate(12, -12)">
                      <rect x="0" y="0" width="50" height="18" rx="3" fill={isSelected ? '#001C33' : '#FFFFFF'} stroke={color} strokeWidth="1.5" />
                      <text x="25" y="13" fill={isSelected ? '#FFFFFF' : color} fontSize="9.5" fontWeight="800" textAnchor="middle" className="font-mono">
                        {inc.code}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* In-Map Legend Bottom Left */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#CBD5E1] shadow-xs text-xs flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]"></span>
                <span className="text-[11px]">Critical (P1)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                <span className="text-[11px]">Urgent (P2)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0259C5]"></span>
                <span className="text-[11px]">Google Maps Place (G)</span>
              </div>
              {showHotspotLayer && (
                <div className="flex items-center gap-1.5 font-bold text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A] animate-ping"></span>
                  <span className="text-[11px]">AI Hotspot (ML)</span>
                </div>
              )}
            </div>

            {/* Selected Location Banner Bottom Right */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-[#0259C5] shadow-sm text-xs max-w-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0259C5]" />
                <span className="font-bold text-[#161C21]">{selectedIncident.location.address}</span>
              </div>
              <p className="text-[11px] text-[#43474D] mt-0.5 font-mono">
                {selectedIncident.location.lat.toFixed(4)}° N, {selectedIncident.location.lng.toFixed(4)}° E • {selectedIncident.location.district}
              </p>
            </div>
          </div>

          {/* New Forecasting & Probabilistic Hotspot Intelligence Component */}
          {showForecastingWidget && (
            <div className="w-full">
              <PredictiveForecastingWidget
                isLayerActive={showHotspotLayer}
                onToggleLayer={() => setShowHotspotLayer(!showHotspotLayer)}
                onSelectHotspot={(hotspot) => {
                  setHighlightedHotspot(hotspot);
                  playAcknowledgeBeep();
                }}
                onPrestageDispatch={(hotspot) => {
                  onOverridePriority(
                    selectedIncident.id,
                    'P1',
                    `Preemptive crew authorization dispatched to ${hotspot.name} based on predictive ML hotspot analysis.`
                  );
                }}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Incident Forensic Verification Dossier (35% width, Matches Stitch) */}
        <div className="w-full xl:w-[35%] bg-white p-4 overflow-y-auto flex flex-col gap-4 shadow-sm select-none">
          {/* Header & SLA Timer */}
          <div className="p-3.5 bg-[#EFF4FB] border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#011D34] text-white rounded">
                {selectedIncident.code}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#BA1A1A] font-mono">
                <Clock className="w-4 h-4 animate-spin text-[#BA1A1A]" />
                <span>SLA: {formatSla(selectedIncident.slaDeadlineSeconds)}</span>
              </div>
            </div>
            <h2 className="font-heading text-sm font-bold text-[#161C21] leading-snug mt-1">
              {selectedIncident.title}
            </h2>
            <p className="text-[11px] text-[#43474D] mt-1 font-mono">
              📍 {selectedIncident.location.address}
            </p>
          </div>

          {/* Citizen RAW Evidence Photo & SHA-256 Validation */}
          {selectedIncident.imageUrl && (
            <div className="bg-[#EFF4FB] p-3 rounded-lg border border-[#CBD5E1] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#161C21] flex items-center gap-1.5 font-mono">
                  <Camera className="w-3.5 h-3.5 text-[#0259C5]" />
                  Citizen Evidence: IMG_9842_RAW.dng
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#D9E2FF] text-[#001A43] rounded">
                  SHA-256 VALID
                </span>
              </div>
              <div
                onClick={() => setIsImageModalOpen(true)}
                className="relative h-40 rounded overflow-hidden bg-slate-900 cursor-pointer group"
              >
                <img
                  src={selectedIncident.imageUrl}
                  alt={selectedIncident.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  EXIF: 12.9784° N, 77.6408° E • TAMPER-PROOF HASH
                </div>
              </div>
            </div>
          )}

          {/* Audio Transmission Player */}
          {selectedIncident.hasAudio && (
            <div>
              <AudioPlayer
                duration={selectedIncident.audioDuration}
                callerChannel={selectedIncident.caller.channel}
              />
            </div>
          )}

          {/* AI-RECOMMENDED PRIORITY & AUTOMATED SEVERITY SCORE REVIEW CARD */}
          {(() => {
            const recPriority =
              selectedIncident.aiRecommendedPriority ||
              calculateAIRecommendedPriority({
                title: selectedIncident.title,
                description: selectedIncident.aiSummary,
                callerTranscript: selectedIncident.callerTranscript,
                category: selectedIncident.category,
                address: selectedIncident.location.address,
                priority: selectedIncident.priority,
              });
            const severityStyle = getSeverityScoreStyle(recPriority.automatedSeverityScore);

            const handleAccept = () => {
              playAcknowledgeBeep();
              if (onAcceptAIPriority) {
                onAcceptAIPriority(selectedIncident.id);
              } else {
                onOverridePriority(
                  selectedIncident.id,
                  recPriority.recommendedPriority,
                  `Operator accepted AI-Recommended Priority (${recPriority.recommendedPriority}) based on historical pattern cluster ${recPriority.historicalPattern.patternClusterId}`
                );
              }
            };

            return (
              <div className="p-4 bg-gradient-to-br from-white via-[#FAFBFD] to-[#EFF4FB] border-2 border-[#0259C5]/40 rounded-xl shadow-sm flex flex-col gap-3">
                {/* Header & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#D9E2FF] text-[#001A43] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#0259C5]" />
                    </span>
                    <div>
                      <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#001C33]">
                        AI-Recommended Priority
                      </h3>
                      <span className="text-[10px] text-[#5A6066] font-mono">
                        Pattern Cross-Referenced Severity
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 ${
                      recPriority.reviewStatus === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : recPriority.reviewStatus === 'overridden'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-[#001A43] border border-blue-300'
                    }`}
                  >
                    {recPriority.reviewStatus === 'pending_review' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0259C5] animate-ping"></span>
                    )}
                    {recPriority.reviewStatus === 'accepted'
                      ? 'Operator Accepted'
                      : recPriority.reviewStatus === 'overridden'
                      ? 'Operator Overridden'
                      : 'Pending Review'}
                  </span>
                </div>

                {/* Score Dial & Priority Tier */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase font-semibold text-[#5A6066]">
                      <span>Automated Severity</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${severityStyle.badgeBg}`}>
                        {severityStyle.label}
                      </span>
                    </div>
                    <div className="my-1 flex items-baseline gap-1 font-mono">
                      <span className="text-2xl font-extrabold text-[#001C33]">
                        {recPriority.automatedSeverityScore}
                      </span>
                      <span className="text-xs text-[#5A6066]">/ 100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          recPriority.automatedSeverityScore >= 85
                            ? 'bg-[#BA1A1A]'
                            : recPriority.automatedSeverityScore >= 65
                            ? 'bg-[#D97706]'
                            : 'bg-[#0259C5]'
                        }`}
                        style={{ width: `${recPriority.automatedSeverityScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
                    <div className="text-[10px] font-mono uppercase font-semibold text-[#5A6066]">
                      AI Recommended Tier
                    </div>
                    <div className="my-1 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          recPriority.recommendedPriority === 'P1'
                            ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB]'
                            : recPriority.recommendedPriority === 'P2'
                            ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]'
                            : 'bg-[#EFF4FB] text-[#001C33] border border-[#BFDBFE]'
                        }`}
                      >
                        {recPriority.recommendedPriority}
                      </span>
                      <span className="text-[11px] font-semibold text-[#161C21] truncate">
                        {recPriority.recommendedPriorityLabel.split('-')[1]?.trim() || recPriority.recommendedPriorityLabel}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono">
                      {recPriority.recommendedPriority === selectedIncident.priority ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Matches Active ({selectedIncident.priority})
                        </span>
                      ) : (
                        <span className="text-[#C2410C] font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C] animate-pulse"></span>
                          Active is {selectedIncident.priority} (Divergence)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Historical Pattern Cross-Reference */}
                <div className="p-2.5 bg-[#EFF4FB] rounded-lg border border-[#BFDBFE] text-xs">
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#D4E3F7]">
                    <div className="flex items-center gap-1 font-mono text-[10.5px] font-bold text-[#001C33]">
                      <History className="w-3 h-3 text-[#0259C5]" />
                      <span>{recPriority.historicalPattern.patternClusterId}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-white text-[#0259C5] text-[9.5px] font-mono font-bold border border-[#BFDBFE]">
                      {recPriority.historicalPattern.historicalMatchConfidence.toFixed(1)}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 py-1 mb-1 font-mono text-[10px] text-center">
                    <div className="bg-white p-1 rounded border border-[#CBD5E1]">
                      <div className="text-[#5A6066]">Historical</div>
                      <div className="font-bold text-[#001C33]">{recPriority.historicalPattern.similarIncidentsCount} cases</div>
                    </div>
                    <div className="bg-white p-1 rounded border border-[#CBD5E1]">
                      <div className="text-[#5A6066]">30m Escalation</div>
                      <div className="font-bold text-[#BA1A1A]">{recPriority.historicalPattern.historicalEscalationRatePct}%</div>
                    </div>
                    <div className="bg-white p-1 rounded border border-[#CBD5E1]">
                      <div className="text-[#5A6066]">Avg SLA</div>
                      <div className="font-bold text-[#001C33]">{recPriority.historicalPattern.avgHistoricalResolutionHours}h</div>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-[#161C21] italic leading-tight">
                    "{recPriority.historicalPattern.historicalPrecedentNote}"
                  </p>
                </div>

                {/* Score Factor Decomposition */}
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-[#5A6066] uppercase tracking-wider block font-mono">
                    Score Components:
                  </span>
                  <div className="grid grid-cols-4 gap-1 text-[9.5px] font-mono text-center">
                    <div className="p-1 bg-white rounded border border-[#E2E8F0]">
                      <div className="text-[#5A6066]">Life Safety</div>
                      <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.lifeSafetyScore}/35</div>
                    </div>
                    <div className="p-1 bg-white rounded border border-[#E2E8F0]">
                      <div className="text-[#5A6066]">Infra</div>
                      <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.infrastructureImpactScore}/25</div>
                    </div>
                    <div className="p-1 bg-white rounded border border-[#E2E8F0]">
                      <div className="text-[#5A6066]">Escalation</div>
                      <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.escalationProbabilityScore}/20</div>
                    </div>
                    <div className="p-1 bg-white rounded border border-[#E2E8F0]">
                      <div className="text-[#5A6066]">Corridor</div>
                      <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.demographicVulnerabilityScore}/20</div>
                    </div>
                  </div>
                </div>

                {/* Operator Review Button */}
                <div className="pt-1.5 border-t border-[#E2E8F0]">
                  {recPriority.reviewStatus === 'pending_review' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAccept}
                        className="flex-1 py-2 px-3 bg-[#001C33] hover:bg-[#012745] text-white text-xs font-bold rounded shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Accept AI Priority ({recPriority.recommendedPriority})</span>
                      </button>
                      <button
                        onClick={() => setIsOverrideModalOpen(true)}
                        className="py-2 px-3 bg-white hover:bg-[#F1F5F9] text-[#001C33] text-xs font-bold rounded border border-[#CBD5E1] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#5A6066]" />
                        <span>Adjust</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-[#CBD5E1] text-xs">
                      <div className="flex items-center gap-1.5 text-[#161C21]">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-[11px]">
                          {recPriority.reviewStatus === 'accepted'
                            ? `AI Recommendation Confirmed (${selectedIncident.priority})`
                            : `Operator Overridden to ${selectedIncident.priority}`}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsOverrideModalOpen(true)}
                        className="text-[10px] text-[#0259C5] font-bold hover:underline cursor-pointer"
                      >
                        Re-evaluate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* AI Triage Confidence & Statutory Classification */}
          <div className="p-3.5 bg-[#F6FAFF] border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#161C21] flex items-center gap-1.5 font-mono uppercase">
                <Scale className="w-3.5 h-3.5 text-[#0259C5]" />
                Statutory Pre-Classification
              </span>
              <span className="px-2 py-0.5 bg-[#D9E2FF] text-[#001A43] rounded text-[10.5px] font-mono font-bold">
                AI {selectedIncident.aiConfidence.toFixed(1)}% CONFIDENCE
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-[#001C33] bg-white p-2.5 rounded border border-[#CBD5E1] mb-2">
              ⚖️ {selectedIncident.municipalCode}
            </div>
            <p className="text-xs text-[#161C21] leading-relaxed">
              {selectedIncident.aiSummary}
            </p>
          </div>

          {/* Multi-Agency Dispatch Routing Handshake */}
          <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#161C21] font-mono uppercase">
                <Building className="w-3.5 h-3.5 text-[#0259C5]" />
                Multi-Agency Dispatch Routing
              </div>
              <span className="text-[10px] font-mono text-[#0259C5] font-bold">HANDSHAKE ACTIVE</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 bg-[#EFF4FB] border border-[#D9E2FF] rounded flex items-center justify-between font-bold text-[#001C33]">
                <span>{selectedIncident.primaryAgency}</span>
                <span className="text-[10px] text-[#0259C5] font-mono">LEAD</span>
              </div>
              {selectedIncident.secondaryAgencies.map((agency, i) => (
                <div key={i} className="p-1.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#43474D] text-[11px]">
                  + {agency}
                </div>
              ))}
            </div>
          </div>

          {/* Action Authorizations */}
          <div className="p-3.5 bg-[#EFF4FB] border border-[#CBD5E1] rounded-lg flex flex-col gap-2">
            <span className="text-xs font-bold text-[#161C21] uppercase font-mono tracking-wider">
              Dispatcher Interventions:
            </span>

            {selectedIncident.status !== 'resolved' ? (
              <>
                <button
                  onClick={() => onDispatchUnits(selectedIncident.id)}
                  className="w-full py-2.5 px-4 bg-[#001C33] hover:bg-[#012745] text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-[#5790FF]" />
                  <span>Verify & Authorize Quad-Agency Dispatch</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="py-2 px-3 bg-white hover:bg-[#EFF4FB] text-[#161C21] text-xs font-semibold rounded border border-[#CBD5E1] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#43474D]" />
                    <span>Override Tier</span>
                  </button>

                  <button
                    onClick={onOpenBroadcastModal}
                    className="py-2 px-3 bg-white hover:bg-[#FFDAD6] text-[#93000A] text-xs font-semibold rounded border border-[#BA1A1A]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-[#BA1A1A]" />
                    <span>Public Alert</span>
                  </button>
                </div>

                <button
                  onClick={() => onResolveIncident(selectedIncident.id)}
                  className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark as Resolved & Audited</span>
                </button>
              </>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-emerald-900 block">Incident Closed & Resolved</span>
              </div>
            )}
          </div>

          {/* Immutable Dispatch Audit Trail */}
          <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-[#161C21]">
                <History className="w-3.5 h-3.5 text-[#0259C5]" />
                Immutable Audit Trail
              </div>
              <span className="text-[10px] text-[#74777E] font-mono">TAMPER-PROOF</span>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-[#E9EEF5]">
              {selectedIncident.auditTrail.map((entry) => (
                <div key={entry.id} className="relative pl-6 text-xs">
                  <div className="absolute left-0.5 top-1 w-3 h-3 rounded-full border-2 bg-white border-[#0259C5]" />
                  <div className="flex items-center justify-between text-[10.5px] font-mono">
                    <span className="font-bold text-[#161C21]">{entry.actorName}</span>
                    <span className="text-[#74777E]">{entry.timestamp}</span>
                  </div>
                  <p className="font-semibold text-[#161C21] mt-0.5">{entry.action}</p>
                  <p className="text-[11px] text-[#43474D] leading-snug mt-0.5">{entry.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Priority Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-[#CBD5E1] shadow-xl overflow-hidden">
            <div className="p-3 bg-[#001C33] text-white flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase">
                Priority Override · {selectedIncident.code}
              </span>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-white hover:text-amber-300 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleApplyOverride} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#161C21] block mb-1 uppercase font-mono">
                  Select Adjusted Severity Tier:
                </label>
                <div className="grid grid-cols-4 gap-2 font-mono font-bold">
                  {(['P1', 'P2', 'P3', 'P4'] as PriorityLevel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverridePriority(p)}
                      className={`py-2 rounded border cursor-pointer ${
                        overridePriority === p
                          ? 'bg-[#001C33] text-white border-[#001C33]'
                          : 'bg-white text-[#161C21] border-[#CBD5E1]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-[#161C21] block mb-1 uppercase font-mono">
                  Mandatory Operational Justification:
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State operational reason for algorithmic override..."
                  className="w-full p-2 bg-[#EFF4FB] border border-[#CBD5E1] rounded text-[#161C21]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E9EEF5]">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#43474D] hover:bg-[#EFF4FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001C33] hover:bg-[#012745] text-white font-bold rounded"
                >
                  Commit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAW Image Inspector Fullscreen Modal */}
      {isImageModalOpen && selectedIncident.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full overflow-hidden border border-[#CBD5E1] shadow-2xl">
            <div className="p-3 bg-[#011D34] text-white flex items-center justify-between">
              <span className="font-mono text-xs font-bold">{selectedIncident.code} · RAW Evidence File</span>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-white hover:text-amber-300 font-bold px-2 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 bg-slate-950">
              <img
                src={selectedIncident.imageUrl}
                alt={selectedIncident.title}
                className="w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            <div className="p-3 bg-[#EFF4FB] flex items-center justify-between text-xs text-[#43474D] font-mono">
              <span>GPS: {selectedIncident.location.lat}, {selectedIncident.location.lng}</span>
              <span>SHA-256: #89f2a4e9b772c</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
