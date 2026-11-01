import React, { useEffect, useState } from "react";
import { api } from "../api";

export function AiTelemetryStrip() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () =>
      api
        .getTelemetry()
        .then((data) => {
          if (mounted) setMetrics(data);
        })
        .catch(() => {});
    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const items = [
    ["Active issues", metrics?.activeIncidentsCount ?? 0, "assignment_late", "bg-secondary text-on-secondary"],
    ["Critical", metrics?.criticalP1Count ?? 0, "emergency_home", "bg-error text-on-error"],
    ["Bridge latency", `${metrics?.bridgeLatencyMs ?? 120} ms`, "speed", "bg-primary text-on-primary"],
    ["Units in field", metrics?.unitsInField ?? 0, "support", "bg-primary-container text-on-primary-container"],
    ["SLA compliance", `${metrics?.slaCompliancePct ?? 92}%`, "timer", "bg-surface-container-high text-on-surface"],
    ["Community signal", metrics?.publicSupportSignal ?? 0, "groups", "bg-secondary-fixed text-on-secondary-fixed"]
  ];

  return (
    <div className="rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm p-space-md">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <div>
            <h3 className="font-headline-sm text-on-surface">Live operational telemetry</h3>
            <p className="font-body-sm text-on-surface-variant">Cross-region dispatch snapshot from the Civic Pulse ledger</p>
          </div>
          <button
            onClick={() => api.getTelemetry().then(setMetrics).catch(() => {})}
            className="inline-flex h-9 items-center gap-space-sm rounded bg-surface-container-low px-space-sm font-label-md font-semibold text-on-surface-variant shadow-sm hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[17px]">refresh</span>
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 gap-space-sm md:grid-cols-3 xl:grid-cols-6">
          {items.map(([label, value, icon, tone]) => (
            <div key={label} className="rounded-lg bg-surface-container-low border border-outline-variant p-space-sm flex items-center gap-space-sm">
              <span className={`flex h-8 w-8 items-center justify-center rounded-md ${tone}`}>
                <span className="material-symbols-outlined text-[17px]">{icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-tabular-md text-on-surface truncate">{value}</div>
                <div className="font-body-sm text-on-surface-variant truncate">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
