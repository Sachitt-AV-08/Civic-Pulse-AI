import React, { useEffect, useState } from "react";
import { api } from "../api";

const FACILITY_LINKS = [
  { label: "Google Maps", url: "https://www.google.com/maps/search/?api=1&query=" },
  { label: "Search triage guidance", url: "https://www.google.com/search?q=" }
];

export function PredictiveForecasting({ incident, onSelectHotspot }) {
  const [hotspots, setHotspots] = useState([]);
  const [hotspotsBusy, setHotspotsBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setHotspotsBusy(true);
    api.getPredictions({ incidents: incident ? [incident] : undefined })
      .then((result) => setHotspots(Array.isArray(result?.hotspots) ? result.hotspots : []))
      .catch((err) => setMessage(err.message))
      .finally(() => setHotspotsBusy(false));
  }, [incident?.id]);

  const prestage = async (hotspot) => {
    try {
      const result = await api.generateBroadcast({
        incidentTitle: hotspot.primaryHazard || hotspot.name,
        location: hotspot.name || hotspot.corridor || "Ward 112",
        severity: hotspot.riskScore >= 90 ? "P1" : hotspot.riskScore >= 75 ? "P2" : "P3",
        instructions: hotspot.recommendedPreemptiveAction || "Preventive inspection"
      });
      setMessage(result?.broadcast?.smsAlert || `Preventive advisory generated for ${hotspot.name}.`);
      if (typeof onSelectHotspot === "function") onSelectHotspot(hotspot);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const openGoogleMaps = (hotspot) => {
    const query = `${hotspot.name || hotspot.corridor || hotspot.title || "Civic Pulse AI"}, ${hotspot.coordinates?.lat ?? 12.9784},${hotspot.coordinates?.lng ?? 77.6408}`;
    window.open(FACILITY_LINKS[0].url + encodeURIComponent(query), "_blank", "noopener,noreferrer");
  };

  const riskClass = (score) => (score >= 90 ? "bg-error-container text-on-error-container" : score >= 75 ? "bg-tertiary-fixed text-on-tertiary" : "bg-primary-fixed text-on-primary-fixed");

  return (
    <div className="rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm p-space-lg flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm">
        <div>
          <h3 className="font-headline-sm text-on-surface">AI predictive forecasting</h3>
          <p className="font-body-sm text-on-surface-variant">Risk-ranked hotspot forecast with preemptive options and live Google Maps lookup</p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm font-semibold">
          {hotspotsBusy ? "Updating..." : "Forecast active"}
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        {hotspots.map((hotspot) => (
          <div key={hotspot.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-space-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-sm">
              <div className="min-w-0">
                <div className="font-title-md text-on-surface">{hotspot.title || hotspot.name}</div>
                <p className="font-body-sm text-on-surface-variant">{hotspot.category || "Civic"} • {hotspot.timeWindow}</p>
                <p className="font-body-sm text-on-surface mt-1">{hotspot.primaryHazard || hotspot.hazard}</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${riskClass(hotspot.riskScore)}`}>{hotspot.riskScore}/100</span>
                <button onClick={() => openGoogleMaps(hotspot)} className="inline-flex h-9 items-center rounded bg-surface-container-lowest px-space-sm font-label-md text-secondary shadow-sm hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Maps
                </button>
                <button onClick={() => prestage(hotspot)} className="inline-flex h-9 items-center rounded bg-secondary text-on-secondary px-space-sm font-label-md font-semibold shadow-sm">
                  Prestage
                </button>
              </div>
            </div>
            <div className="mt-space-sm h-2 overflow-hidden rounded bg-surface-container">
              <div className="h-full rounded bg-amber-500" style={{ width: `${hotspot.riskScore}%` }} />
            </div>
            <ul className="mt-space-sm flex flex-wrap gap-space-xs">
              {(hotspot.contributingFactors || []).map((factor) => (
                <li key={factor} className="rounded-full bg-surface-container-low px-2 py-0.5 text-xs text-on-surface-variant">{factor}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {message && <div className="rounded-lg bg-surface-container-low p-space-sm font-body-sm text-on-surface-variant">{message}</div>}
    </div>
  );
}
EOF
