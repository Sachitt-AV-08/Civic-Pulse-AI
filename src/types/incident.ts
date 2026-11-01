export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type IncidentCategory =
  | 'Water & Utilities'
  | 'Traffic & Transit'
  | 'Fire & Rescue'
  | 'Public Works'
  | 'Power Grid'
  | 'Environmental Hazard';

export type IncidentStatus =
  | 'triaged'
  | 'dispatched'
  | 'en_route'
  | 'on_scene'
  | 'resolved';

export interface LocationData {
  address: string;
  district: string;
  crossStreet?: string;
  lat: number;
  lng: number;
  mapX: number; // 0-100 percentage for vector map
  mapY: number; // 0-100 percentage for vector map
}

export interface CallerInfo {
  name: string;
  contact: string;
  channel: '911 Emergency Bridge' | '311 Citizen Portal' | 'IoT Telemetry Sensor' | 'Municipal Patrol Radio';
  recordedAt: string;
}

export interface AssignedUnit {
  unitId: string;
  agency: string;
  type: string;
  status: 'Dispatched' | 'En Route' | 'On Scene' | 'Standby';
  etaMinutes: number;
}

export interface HistoricalPatternMatch {
  patternClusterId: string;
  historicalMatchConfidence: number;
  similarIncidentsCount: number;
  historicalEscalationRatePct: number;
  avgHistoricalResolutionHours: number;
  historicalPrecedentNote: string;
}

export interface SeverityScoreBreakdown {
  overallScore: number; // 0 - 100
  lifeSafetyScore: number; // 0 - 35
  infrastructureImpactScore: number; // 0 - 25
  escalationProbabilityScore: number; // 0 - 20
  demographicVulnerabilityScore: number; // 0 - 20
}

export interface AIRecommendedPriority {
  recommendedPriority: PriorityLevel;
  recommendedPriorityLabel: string;
  automatedSeverityScore: number; // 0 to 100
  scoreBreakdown: SeverityScoreBreakdown;
  historicalPattern: HistoricalPatternMatch;
  rationale: string;
  reviewStatus: 'pending_review' | 'accepted' | 'overridden';
  operatorReview?: {
    reviewedBy: string;
    reviewedAt: string;
    decision: 'accepted' | 'overridden';
    finalPriority: PriorityLevel;
    notes?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'AI_AUTOMATION' | 'HUMAN_OPERATOR' | 'FIELD_UNIT' | 'SYSTEM_TELEMETRY';
  actorName: string;
  action: string;
  details: string;
}

export interface Incident {
  id: string;
  code: string;
  title: string;
  category: IncidentCategory;
  priority: PriorityLevel;
  priorityLabel: string;
  aiRecommendedPriority?: AIRecommendedPriority;
  status: IncidentStatus;
  location: LocationData;
  reportedAt: string;
  slaDeadlineSeconds: number; // seconds remaining
  initialSlaMinutes: number;
  caller: CallerInfo;
  callerTranscript: string;
  hasAudio: boolean;
  audioDuration: string;
  imageUrl?: string;
  aiConfidence: number; // 0 - 100
  aiModel: string;
  municipalCode: string;
  aiSummary: string;
  riskAssessment: {
    publicSafety: 'Low' | 'Medium' | 'High' | 'Critical';
    infrastructure: 'Low' | 'Medium' | 'High' | 'Critical';
    financialLiability: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  primaryAgency: string;
  secondaryAgencies: string[];
  assignedUnits: AssignedUnit[];
  recommendedActions: string[];
  auditTrail: AuditLogEntry[];
  operatorNotes?: string;
}

export interface TelemetryMetrics {
  activeIncidentsCount: number;
  criticalP1Count: number;
  slaBreachRiskCount: number;
  bridgeLatencyMs: number;
  throughputPerMin: number;
  slaCompliancePct: number;
  unitsInField: number;
}
