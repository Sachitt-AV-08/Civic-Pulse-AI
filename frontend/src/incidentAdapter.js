export function toCopilotIncident(issue) {
  if (!issue) return null;
  const priority = issue.severity >= 5 ? "P1" : issue.severity >= 4 ? "P2" : issue.severity >= 3 ? "P3" : "P4";
  const priorityLabel = {
    P1: "Critical - Life Safety",
    P2: "Urgent - Infrastructure",
    P3: "Standard Operational",
    P4: "Routine Maintenance"
  }[priority];
  const longitude = Number(issue.longitude);
  const latitude = Number(issue.latitude);
  const reportedAt = issue.created_at || new Date().toISOString();
  return {
    id: issue.id,
    code: issue.id,
    title: issue.title || issue.id,
    category: issue.category || "Public Works",
    priority,
    priorityLabel,
    status: issue.status === "resolved" ? "resolved" : issue.status === "assigned" || issue.status === "in_progress" ? "dispatched" : "triaged",
    location: {
      address: issue.address || `${latitude}, ${longitude}`,
      district: "Ward 112 - Indiranagar",
      crossStreet: issue.address || "Indiranagar",
      lat: latitude,
      lng: longitude,
      mapX: Math.max(0, Math.min(100, ((longitude + 180) / 360) * 100)),
      mapY: Math.max(0, Math.min(100, ((90 - latitude) / 180) * 100))
    },
    reportedAt,
    slaDeadlineSeconds: Math.max(0, Math.round((new Date(issue.sla_deadline).getTime() - Date.now()) / 1000)),
    initialSlaMinutes: issue.sla_hours || 45,
    caller: {
      name: issue.reporter_name || "Citizen reporting unit",
      contact: issue.reporter_contact || "Ward 112",
      channel: "311 Citizen Portal",
      recordedAt: reportedAt
    },
    callerTranscript: issue.description || "No transcript provided.",
    hasAudio: false,
    audioDuration: "00:00",
    imageUrl: null,
    aiConfidence: Math.round((issue.ai_confidence || 0.8) * 100),
    aiModel: "FastAPI deterministic triage",
    municipalCode: `Civic Pulse ${issue.id}`,
    aiSummary: issue.ai_reason || "Incident triage summary generated from Civic Pulse rules.",
    riskAssessment: {
      publicSafety: issue.severity >= 4 ? (issue.severity >= 5 ? "Critical" : "High") : "Medium",
      infrastructure: issue.severity >= 3 ? "High" : "Medium",
      financialLiability: issue.is_overdue ? "High" : "Medium"
    },
    primaryAgency: issue.department || "Municipal Dispatch",
    secondaryAgencies: ["Ward 112 Dispatch", "Operations Center"],
    assignedUnits: [],
    recommendedActions: [issue.ai_reason || "Verify the incident location and collect evidence."],
    auditTrail: [],
    aiRecommendedPriority: null
  };
}