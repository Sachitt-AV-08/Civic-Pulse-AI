import React, { useState } from 'react';
import { Incident } from '../types/incident';
import {
  Layers,
  Navigation,
  Shield,
  AlertTriangle,
  Car,
  MapPin,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  Building,
} from 'lucide-react';

interface MunicipalMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
}

interface GoogleMapPlacePin {
  id: string;
  title: string;
  address?: string;
  uri: string;
  x: number;
  y: number;
  category: string;
}

export const MunicipalMap: React.FC<MunicipalMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const [showUnits, setShowUnits] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showPerimeters, setShowPerimeters] = useState(true);
  const [activeDistrict, setActiveDistrict] = useState<string>('All');

  // Google Maps data query state
  const [mapsQuery, setMapsQuery] = useState('');
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [googleMapPins, setGoogleMapPins] = useState<GoogleMapPlacePin[]>([
    {
      id: 'g-1',
      title: 'Harborview Medical Center (Trauma 1)',
      address: '325 9th Ave, Seattle, WA',
      uri: 'https://maps.google.com/?cid=1298492817293847',
      x: 68,
      y: 38,
      category: 'Hospital / Trauma',
    },
    {
      id: 'g-2',
      title: 'Seattle Fire Station 10 & EOC',
      address: '400 S Washington St, Seattle, WA',
      uri: 'https://maps.google.com/?cid=9837492817294829',
      x: 54,
      y: 52,
      category: 'Fire Station & EOC',
    },
    {
      id: 'g-3',
      title: 'City Light Substation #04',
      address: '4th Ave & Yesler Way, Seattle, WA',
      uri: 'https://maps.google.com/?cid=4729103948271029',
      x: 46,
      y: 44,
      category: 'Power Substation',
    },
  ]);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<GoogleMapPlacePin | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    if (activeDistrict === 'All') return true;
    return inc.location.district.toLowerCase().includes(activeDistrict.toLowerCase());
  });

  // Simulated live field emergency units with map positions
  const fieldUnits = [
    { id: 'ENG-14', name: 'Engine 14 (Pumper)', agency: 'Fire & Rescue', x: 44, y: 46, status: 'En Route', targetId: 'inc-01' },
    { id: 'W-08', name: 'Water Crew 08 (Main Isolation)', agency: 'Water Dept', x: 52, y: 39, status: 'En Route', targetId: 'inc-01' },
    { id: 'LAD-03', name: 'Ladder 03 (Aerial)', agency: 'Fire & Rescue', x: 60, y: 32, status: 'On Scene', targetId: 'inc-02' },
    { id: 'SIG-04', name: 'Signal Tech 04 (Telemetry)', agency: 'DOT Signals', x: 70, y: 22, status: 'En Route', targetId: 'inc-03' },
    { id: 'VAC-04', name: 'Hydro Vactor 04', agency: 'Public Works', x: 80, y: 46, status: 'On Scene', targetId: 'inc-06' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return '#BA1A1A';
      case 'P2':
        return '#F97316';
      case 'P3':
        return '#D97706';
      default:
        return '#0159C5';
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
              content: `Find facilities and points of interest for: ${mapsQuery} near ${
                selectedIncident ? selectedIncident.location.address : 'Downtown Metro'
              }`,
            },
          ],
          useGoogleMaps: true,
          userLocation: selectedIncident
            ? { latitude: selectedIncident.location.lat, longitude: selectedIncident.location.lng }
            : { latitude: 47.6062, longitude: -122.3321 },
        }),
      });

      const data = await res.json();
      if (data.groundingChunks && data.groundingChunks.length > 0) {
        const newPins: GoogleMapPlacePin[] = data.groundingChunks
          .filter((c: any) => c.maps)
          .map((c: any, index: number) => ({
            id: `g-query-${Date.now()}-${index}`,
            title: c.maps.title || 'Google Maps Verified Place',
            uri: c.maps.uri || 'https://maps.google.com',
            x: Math.floor(35 + Math.random() * 45),
            y: Math.floor(25 + Math.random() * 50),
            category: mapsQuery,
          }));

        if (newPins.length > 0) {
          setGoogleMapPins((prev) => [...newPins, ...prev]);
          setSelectedGooglePlace(newPins[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMaps(false);
      setMapsQuery('');
    }
  };

  return (
    <div className="relative w-full h-full bg-[#EBF0F7] rounded-lg border border-[#CBD5E1] overflow-hidden flex flex-col select-none">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* District switcher */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded border border-[#CBD5E1] shadow-sm pointer-events-auto">
          <span className="text-[11px] font-semibold text-[#5A6066] px-2 uppercase tracking-wider flex items-center gap-1">
            <Navigation className="w-3 h-3 text-[#0159C5]" />
            District:
          </span>
          {['All', 'District 1', 'District 2', 'District 3', 'District 4'].map((dist) => (
            <button
              key={dist}
              onClick={() => setActiveDistrict(dist)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                activeDistrict === dist
                  ? 'bg-[#001C33] text-white shadow-xs font-semibold'
                  : 'text-[#161C21] hover:bg-[#F1F5F9]'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>

        {/* Google Maps Search Bar Overlay */}
        <form
          onSubmit={handleQueryGoogleMaps}
          className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded border border-[#CBD5E1] shadow-sm pointer-events-auto"
        >
          <div className="flex items-center gap-1 px-2 text-[#0159C5]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase font-mono tracking-wider">Google Maps:</span>
          </div>
          <input
            type="text"
            value={mapsQuery}
            onChange={(e) => setMapsQuery(e.target.value)}
            placeholder="Search hospitals, staging..."
            className="w-36 lg:w-44 h-7 text-xs px-2 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearchingMaps || !mapsQuery.trim()}
            className="px-2 py-1 bg-[#0159C5] hover:bg-[#024bb0] text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center gap-1"
          >
            {isSearchingMaps ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            <span>Query</span>
          </button>
        </form>

        {/* Map Layers Toggle */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded border border-[#CBD5E1] shadow-sm pointer-events-auto">
          <button
            onClick={() => setShowUnits(!showUnits)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showUnits ? 'bg-[#EBF3FC] text-[#0159C5] border border-[#BFDBFE]' : 'text-[#5A6066] hover:bg-[#F1F5F9]'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Field Units</span>
          </button>

          <button
            onClick={() => setShowInfrastructure(!showInfrastructure)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showInfrastructure ? 'bg-[#EBF3FC] text-[#0159C5] border border-[#BFDBFE]' : 'text-[#5A6066] hover:bg-[#F1F5F9]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>GIS Utilities</span>
          </button>

          <button
            onClick={() => setShowPerimeters(!showPerimeters)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
              showPerimeters ? 'bg-[#EBF3FC] text-[#0159C5] border border-[#BFDBFE]' : 'text-[#5A6066] hover:bg-[#F1F5F9]'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Hazard Perimeters</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Rendering */}
      <div className="relative flex-1 w-full h-full min-h-[380px] bg-[#E9EEF5]">
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full object-cover"
          style={{ background: '#EEF3FA' }}
        >
          {/* Water body / Shoreline / Canal */}
          <path
            d="M 0,0 L 220,0 C 230,120 180,240 240,340 C 280,410 200,520 230,650 L 0,650 Z"
            fill="#D5E5F7"
            stroke="#B6D2F0"
            strokeWidth="2"
          />
          {/* Lake Union inlet / canal */}
          <path
            d="M 240,140 Q 380,120 440,160 Q 480,190 420,240 Q 320,260 220,220 Z"
            fill="#D5E5F7"
            stroke="#B6D2F0"
            strokeWidth="1.5"
          />
          <text x="70" y="320" fill="#5E86B0" fontSize="16" fontWeight="600" letterSpacing="4">
            ELLIOTT BAY
          </text>
          <text x="310" y="195" fill="#5E86B0" fontSize="13" fontWeight="600" letterSpacing="2">
            FRESHWATER CANAL
          </text>

          {/* District boundary lines */}
          <path d="M 230,220 L 1000,220" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,4" />
          <path d="M 580,0 L 580,650" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,4" />
          <path d="M 230,440 L 1000,440" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6,4" />

          {/* District Labels */}
          <text x="320" y="50" fill="#8896A6" fontSize="11" fontWeight="700" letterSpacing="1.5">
            DISTRICT 3 · NORTH & LAKESHORE
          </text>
          <text x="640" y="50" fill="#8896A6" fontSize="11" fontWeight="700" letterSpacing="1.5">
            DISTRICT 4 · CAPITOL & EAST PRECINCT
          </text>
          <text x="320" y="250" fill="#8896A6" fontSize="11" fontWeight="700" letterSpacing="1.5">
            DISTRICT 2 · METRO CORE & RETAIL
          </text>
          <text x="640" y="250" fill="#8896A6" fontSize="11" fontWeight="700" letterSpacing="1.5">
            DISTRICT 2 · HOSPITAL CORRIDOR
          </text>
          <text x="320" y="470" fill="#8896A6" fontSize="11" fontWeight="700" letterSpacing="1.5">
            DISTRICT 1 · INDUSTRIAL & MARITIME
          </text>

          {/* Major Highway / Interstate I-5 corridor */}
          <path
            d="M 620,0 C 600,180 570,300 590,480 C 600,560 620,650 630,650"
            fill="none"
            stroke="#C0CAD7"
            strokeWidth="14"
          />
          <path
            d="M 620,0 C 600,180 570,300 590,480 C 600,560 620,650 630,650"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
          />
          <path
            d="M 620,0 C 600,180 570,300 590,480 C 600,560 620,650 630,650"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="8,6"
          />

          {/* City Street Grid */}
          {[90, 150, 210, 270, 330, 390, 450, 510, 570, 610].map((y) => (
            <line
              key={`ew-${y}`}
              x1="220"
              y1={y}
              x2="1000"
              y2={y}
              stroke="#DCE4EE"
              strokeWidth={y === 270 || y === 390 || y === 510 ? '5' : '2.5'}
            />
          ))}

          {[270, 330, 390, 450, 510, 570, 650, 720, 790, 860, 930].map((x) => (
            <line
              key={`ns-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="650"
              stroke="#DCE4EE"
              strokeWidth={x === 450 || x === 720 ? '5' : '2.5'}
            />
          ))}

          {/* Street Name Micro-Labels */}
          <text x="455" y="325" fill="#718294" fontSize="9" fontWeight="600">
            4TH AVENUE (ARTERIAL)
          </text>
          <text x="725" y="265" fill="#718294" fontSize="9" fontWeight="600">
            MERCER ARTERIAL
          </text>
          <text x="280" y="265" fill="#718294" fontSize="9" fontWeight="600">
            PINE STREET
          </text>
          <text x="280" y="505" fill="#718294" fontSize="9" fontWeight="600">
            SPOKANE ST CORRIDOR
          </text>

          {/* Infrastructure GIS Overlays */}
          {showInfrastructure && (
            <g opacity="0.75">
              <path
                d="M 230,270 L 480,270 L 480,420 L 720,420"
                fill="none"
                stroke="#0259C5"
                strokeWidth="3.5"
                strokeDasharray="4,2"
              />
              <path
                d="M 330,0 L 330,180 L 620,180 L 620,330"
                fill="none"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="6,3"
              />
            </g>
          )}

          {/* Hazard Perimeters for critical incidents */}
          {showPerimeters &&
            filteredIncidents
              .filter((inc) => inc.priority === 'P1')
              .map((inc) => {
                const cx = (inc.location.mapX / 100) * 1000;
                const cy = (inc.location.mapY / 100) * 650;
                return (
                  <g key={`perimeter-${inc.id}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="46"
                      fill="#BA1A1A"
                      fillOpacity="0.12"
                      stroke="#BA1A1A"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    >
                      <animate
                        attributeName="r"
                        values="38;52;38"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="fillOpacity"
                        values="0.16;0.06;0.16"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <text
                      x={cx + 36}
                      y={cy - 28}
                      fill="#BA1A1A"
                      fontSize="9"
                      fontWeight="700"
                      className="tracking-wider uppercase"
                    >
                      300M CORDON ZONE
                    </text>
                  </g>
                );
              })}

          {/* Active Field Units */}
          {showUnits &&
            fieldUnits.map((unit) => {
              const targetInc = incidents.find((i) => i.id === unit.targetId);
              const ux = (unit.x / 100) * 1000;
              const uy = (unit.y / 100) * 650;

              return (
                <g key={unit.id}>
                  {targetInc && (
                    <line
                      x1={ux}
                      y1={uy}
                      x2={(targetInc.location.mapX / 100) * 1000}
                      y2={(targetInc.location.mapY / 100) * 650}
                      stroke="#0159C5"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.8"
                    />
                  )}

                  <g transform={`translate(${ux - 12}, ${uy - 12})`}>
                    <rect
                      width="24"
                      height="24"
                      rx="4"
                      fill="#001C33"
                      stroke="#5790FF"
                      strokeWidth="1.5"
                    />
                    <text
                      x="12"
                      y="16"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {unit.id.split('-')[0]}
                    </text>
                  </g>
                  <text
                    x={ux + 16}
                    y={uy + 4}
                    fill="#001C33"
                    fontSize="9.5"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {unit.id}
                  </text>
                </g>
              );
            })}

          {/* Google Maps Place Pins */}
          {googleMapPins.map((place) => {
            const gx = (place.x / 100) * 1000;
            const gy = (place.y / 100) * 650;
            const isSelected = selectedGooglePlace?.id === place.id;

            return (
              <g
                key={place.id}
                onClick={() => setSelectedGooglePlace(place)}
                className="cursor-pointer"
                transform={`translate(${gx}, ${gy})`}
              >
                <circle
                  r={isSelected ? '14' : '11'}
                  fill="#0259C5"
                  fillOpacity="0.2"
                  stroke="#0259C5"
                  strokeWidth="1.5"
                />
                <circle r={isSelected ? '7' : '5'} fill="#0259C5" stroke="#FFFFFF" strokeWidth="1.5" />
                <g transform="translate(10, -10)">
                  <rect
                    x="0"
                    y="0"
                    width="18"
                    height="14"
                    rx="3"
                    fill="#0159C5"
                  />
                  <text
                    x="9"
                    y="10"
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    G
                  </text>
                </g>
              </g>
            );
          })}

          {/* Incident Pins */}
          {filteredIncidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const px = (inc.location.mapX / 100) * 1000;
            const py = (inc.location.mapY / 100) * 650;
            const color = getPriorityColor(inc.priority);

            return (
              <g
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="cursor-pointer transition-transform duration-150"
                transform={`translate(${px}, ${py})`}
              >
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#001C33"
                    strokeWidth="3"
                    strokeDasharray="3,2"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <circle
                  r={isSelected ? '16' : '13'}
                  fill={color}
                  fillOpacity="0.25"
                  stroke={color}
                  strokeWidth="2"
                />

                <circle r={isSelected ? '9' : '7'} fill={color} stroke="#FFFFFF" strokeWidth="2" />

                <g transform="translate(14, -14)">
                  <rect
                    x="0"
                    y="0"
                    width="44"
                    height="18"
                    rx="3"
                    fill={isSelected ? '#001C33' : '#FFFFFF'}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  <text
                    x="22"
                    y="13"
                    fill={isSelected ? '#FFFFFF' : color}
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {inc.priority}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Google Maps Place Detail Card */}
        {selectedGooglePlace && (
          <div className="absolute top-16 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-[#0159C5] shadow-lg max-w-xs z-30 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] font-bold text-[#0159C5] uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Google Maps Facility
              </span>
              <button
                onClick={() => setSelectedGooglePlace(null)}
                className="text-[#5A6066] hover:text-black text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-[#001C33] text-xs leading-snug">{selectedGooglePlace.title}</h4>
            {selectedGooglePlace.address && (
              <p className="text-[11px] text-[#5A6066] mt-0.5">{selectedGooglePlace.address}</p>
            )}
            <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[10px] text-[#5A6066] font-mono">{selectedGooglePlace.category}</span>
              <a
                href={selectedGooglePlace.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#0159C5] text-white rounded text-[11px] font-semibold flex items-center gap-1 hover:bg-[#024bb0] transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Floating Mini Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded border border-[#CBD5E1] shadow-sm text-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
            <span className="text-[#161C21] font-semibold text-[11px]">P1 Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            <span className="text-[#161C21] font-semibold text-[11px]">P2 Urgent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            <span className="text-[#161C21] font-semibold text-[11px]">P3 Operational</span>
          </div>
          <span className="text-[#CBD5E1]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0259C5]" />
            <span className="text-[#0159C5] font-semibold text-[11px]">Google Maps Place (G)</span>
          </div>
        </div>

        {/* Selected Incident Pin Banner */}
        {selectedIncident && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded border border-[#0159C5]/40 shadow-sm text-xs max-w-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#0159C5]" />
              <span className="font-bold text-[#001C33]">{selectedIncident.location.address}</span>
            </div>
            <p className="text-[11px] text-[#5A6066] mt-0.5">
              {selectedIncident.location.crossStreet || selectedIncident.location.district}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
