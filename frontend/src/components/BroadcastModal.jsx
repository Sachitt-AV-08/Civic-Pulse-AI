import React, { useEffect, useState } from "react";
import { api } from "../api";

export function BroadcastModal({ issue, onClose }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);
    setError("");
    if (!issue) return undefined;
    setRunning(true);
    api
      .generateBroadcast({
        incidentTitle: issue.title || issue.id,
        location: issue.address || "Ward 112",
        severity: issue.severity >= 4 ? (issue.severity >= 5 ? "P1" : "P2") : "P3",
        instructions: issue.ai_reason || "Avoid the affected area and follow official guidance."
      })
      .then((data) => setResult(data.broadcast || data))
      .catch((err) => setError(err.message))
      .finally(() => setRunning(false));
    return undefined;
  }, [issue]);

  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-space-md">
      <div className="w-full max-w-3xl rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-space-lg py-space-md border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-on-surface">Civic broadcast advisory</h3>
            <p className="font-body-sm text-on-surface-variant">{issue.id} • {issue.title}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-on-surface-variant hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-space-lg overflow-y-auto flex flex-col gap-space-md">
          {running && <div className="font-body-sm text-on-surface-variant animate-pulse">Generating advisory...</div>}
          {error && <div className="rounded-lg bg-error-container text-on-error-container p-space-md font-body-sm">{error}</div>}
          {result && (
            <>
              <div className="rounded-xl bg-surface-container-low border border-outline-variant p-space-md">
                <div className="font-label-md font-semibold text-on-surface mb-space-xs">SMS alert</div>
                <p className="font-body-md text-on-surface-variant">{result.smsAlert}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low border border-outline-variant p-space-md">
                <div className="font-label-md font-semibold text-on-surface mb-space-xs">Radio script</div>
                <p className="font-body-md text-on-surface-variant">{result.radioScript}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low border border-outline-variant p-space-md">
                <div className="font-label-md font-semibold text-on-surface mb-space-xs">Public advisory</div>
                <p className="font-body-md text-on-surface-variant">{result.publicAdvisory}</p>
                <div className="mt-space-sm flex flex-wrap gap-space-xs">
                  {(result.precinctsAffected || []).map((item) => (
                    <span key={item} className="rounded bg-surface-container text-on-surface-variant px-2 py-1 text-xs">{item}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-space-lg py-space-md border-t border-outline-variant flex justify-end">
          <button onClick={onClose} className="h-10 rounded bg-secondary text-on-secondary px-space-md font-label-md font-semibold shadow-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
EOF
