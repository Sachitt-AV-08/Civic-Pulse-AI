import React, { useState } from 'react';
import { Incident, PriorityLevel } from '../types/incident';
import {
  ShieldAlert,
  Cpu,
  CheckCircle,
  AlertTriangle,
  History,
  Send,
  Sliders,
  Scale,
  Building,
  UserCheck,
  Radio,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { playAcknowledgeBeep } from '../utils/audio';
import { calculateAIRecommendedPriority, getSeverityScoreStyle } from '../utils/aiPriorityScorer';

interface AiTriagePanelProps {
  incident: Incident;
  onDispatchUnits: (incidentId: string) => void;
  onOverridePriority: (incidentId: string, newPriority: PriorityLevel, reason: string) => void;
  onResolveIncident: (incidentId: string) => void;
  onOpenBroadcastModal: () => void;
  onAcceptAIPriority?: (incidentId: string) => void;
}

export const AiTriagePanel: React.FC<AiTriagePanelProps> = ({
  incident,
  onDispatchUnits,
  onOverridePriority,
  onResolveIncident,
  onOpenBroadcastModal,
  onAcceptAIPriority,
}) => {
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>(incident.priority);
  const [overrideReason, setOverrideReason] = useState('');

  // Active or calculated AI recommended priority
  const recPriority = incident.aiRecommendedPriority || calculateAIRecommendedPriority({
    title: incident.title,
    description: incident.aiSummary,
    callerTranscript: incident.callerTranscript,
    category: incident.category,
    address: incident.location.address,
    priority: incident.priority,
  });

  const severityStyle = getSeverityScoreStyle(recPriority.automatedSeverityScore);

  const handleAcceptRecommendation = () => {
    playAcknowledgeBeep();
    if (onAcceptAIPriority) {
      onAcceptAIPriority(incident.id);
    } else {
      onOverridePriority(
        incident.id,
        recPriority.recommendedPriority,
        `Operator accepted AI-Recommended Priority (${recPriority.recommendedPriority}) based on historical pattern cross-reference (${recPriority.historicalPattern.patternClusterId})`
      );
    }
  };

  const handleDispatch = () => {
    playAcknowledgeBeep();
    onDispatchUnits(incident.id);
  };

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    playAcknowledgeBeep();
    onOverridePriority(incident.id, overridePriority, overrideReason);
    setIsOverrideModalOpen(false);
    setOverrideReason('');
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB] font-bold';
      case 'High':
        return 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5] font-semibold';
      case 'Medium':
        return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
      default:
        return 'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#CBD5E1] overflow-y-auto select-none">
      {/* Triage Panel Header */}
      <div className="p-3.5 bg-[#001C33] text-white border-b border-[#012745]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#5790FF]" />
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider">
              Algorithmic Triage Engine
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0159C5] text-white rounded font-bold">
            CONFIDENCE {incident.aiConfidence.toFixed(1)}%
          </span>
        </div>
        <p className="text-[11px] text-[#A5C0DD] mt-1 font-mono">
          Model: {incident.aiModel}
        </p>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* AI-RECOMMENDED PRIORITY & AUTOMATED SEVERITY SCORE REVIEW CARD */}
        <div className="p-4 bg-gradient-to-br from-white via-[#FAFBFD] to-[#F0F5FF] border-2 border-[#0259C5]/40 rounded-xl shadow-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#D9E2FF] text-[#001A43] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0259C5]" />
              </span>
              <div>
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#001C33]">
                  AI-Recommended Priority
                </h3>
                <span className="text-[10px] text-[#5A6066] font-mono">
                  Historical Pattern & Automated Severity
                </span>
              </div>
            </div>

            {/* Review Status Pill */}
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
                ? 'Accepted by Operator'
                : recPriority.reviewStatus === 'overridden'
                ? 'Overridden by Operator'
                : 'Pending Operator Review'}
            </span>
          </div>

          {/* Automated Severity Score Dial & Recommendation Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {/* Score Card */}
            <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase font-semibold text-[#5A6066]">
                <span>Automated Severity</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${severityStyle.badgeBg}`}>
                  {severityStyle.label}
                </span>
              </div>

              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tracking-tight text-[#001C33]">
                  {recPriority.automatedSeverityScore}
                </span>
                <span className="text-xs text-[#5A6066] font-mono">/ 100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
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

            {/* Recommendation vs Active Tier */}
            <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] shadow-2xs flex flex-col justify-between">
              <div className="text-[10.5px] font-mono uppercase font-semibold text-[#5A6066]">
                Recommended Priority Tier
              </div>

              <div className="my-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-sm font-bold font-mono ${
                    recPriority.recommendedPriority === 'P1'
                      ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB]'
                      : recPriority.recommendedPriority === 'P2'
                      ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]'
                      : 'bg-[#EFF4FB] text-[#001C33] border border-[#BFDBFE]'
                  }`}
                >
                  {recPriority.recommendedPriority}
                </span>
                <span className="text-xs font-semibold text-[#161C21] truncate">
                  {recPriority.recommendedPriorityLabel.split('-')[1]?.trim() || recPriority.recommendedPriorityLabel}
                </span>
              </div>

              <div className="text-[11px] text-[#5A6066] flex items-center gap-1 font-mono">
                {recPriority.recommendedPriority === incident.priority ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Matches Active ({incident.priority})
                  </span>
                ) : (
                  <span className="text-[#C2410C] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#C2410C]" />
                    Active is {incident.priority} (Divergence)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Historical Incident Pattern Cross-Reference */}
          <div className="p-3 bg-[#EFF4FB] rounded-lg border border-[#BFDBFE] mb-3 text-xs">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#D4E3F7]">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#001C33]">
                <History className="w-3.5 h-3.5 text-[#0259C5]" />
                <span>Pattern: {recPriority.historicalPattern.patternClusterId}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-white text-[#0259C5] text-[10px] font-mono font-bold border border-[#BFDBFE]">
                {recPriority.historicalPattern.historicalMatchConfidence.toFixed(1)}% Match
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 mb-2 font-mono text-[10.5px] text-center">
              <div className="bg-white p-1.5 rounded border border-[#CBD5E1]">
                <div className="text-[9.5px] text-[#5A6066]">Historical Matches</div>
                <div className="font-bold text-[#001C33]">{recPriority.historicalPattern.similarIncidentsCount} cases</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#CBD5E1]">
                <div className="text-[9.5px] text-[#5A6066]">30m Escalation</div>
                <div className="font-bold text-[#BA1A1A]">{recPriority.historicalPattern.historicalEscalationRatePct}%</div>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#CBD5E1]">
                <div className="text-[9.5px] text-[#5A6066]">Avg Resolution</div>
                <div className="font-bold text-[#001C33]">{recPriority.historicalPattern.avgHistoricalResolutionHours}h</div>
              </div>
            </div>

            <p className="text-[11px] text-[#161C21] leading-relaxed italic">
              "{recPriority.historicalPattern.historicalPrecedentNote}"
            </p>
          </div>

          {/* Component Severity Score Factors */}
          <div className="mb-3 space-y-1">
            <span className="text-[10px] font-bold text-[#5A6066] uppercase tracking-wider block font-mono">
              Score Factor Decomposition:
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
              <div className="p-1.5 bg-white rounded border border-[#E2E8F0]">
                <div className="text-[#5A6066] truncate">Life Safety</div>
                <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.lifeSafetyScore}/35</div>
              </div>
              <div className="p-1.5 bg-white rounded border border-[#E2E8F0]">
                <div className="text-[#5A6066] truncate">Infra Impact</div>
                <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.infrastructureImpactScore}/25</div>
              </div>
              <div className="p-1.5 bg-white rounded border border-[#E2E8F0]">
                <div className="text-[#5A6066] truncate">Escalation</div>
                <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.escalationProbabilityScore}/20</div>
              </div>
              <div className="p-1.5 bg-white rounded border border-[#E2E8F0]">
                <div className="text-[#5A6066] truncate">Corridor</div>
                <div className="font-bold text-[#001C33]">{recPriority.scoreBreakdown.demographicVulnerabilityScore}/20</div>
              </div>
            </div>
          </div>

          {/* Operator Action Bar for Review */}
          <div className="pt-2 border-t border-[#E2E8F0]">
            {recPriority.reviewStatus === 'pending_review' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptRecommendation}
                  className="flex-1 py-2 px-3 bg-[#001C33] hover:bg-[#012745] text-white text-xs font-bold rounded shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Accept AI Priority ({recPriority.recommendedPriority})</span>
                </button>
                <button
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="py-2 px-3 bg-white hover:bg-[#F1F5F9] text-[#001C33] text-xs font-bold rounded border border-[#CBD5E1] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#5A6066]" />
                  <span>Adjust</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded bg-white border border-[#CBD5E1] text-xs">
                <div className="flex items-center gap-1.5 text-[#161C21]">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    {recPriority.reviewStatus === 'accepted'
                      ? `Reviewed: AI Recommendation Accepted (${incident.priority})`
                      : `Reviewed: Operator Set Priority to ${incident.priority}`}
                  </span>
                </div>
                <button
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="text-[11px] text-[#0259C5] font-bold hover:underline cursor-pointer"
                >
                  Re-evaluate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Confidence & Code Card */}
        <div className="p-3.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded-lg shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#001C33] flex items-center gap-1.5 uppercase font-mono">
              <Scale className="w-3.5 h-3.5 text-[#0159C5]" />
              Statutory Classification
            </span>
            <span className="text-[10.5px] font-bold font-mono text-[#0159C5] bg-[#EBF3FC] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
              VERIFIED
            </span>
          </div>

          <div className="font-mono text-xs font-bold text-[#001C33] bg-white p-2.5 rounded border border-[#CBD5E1] mb-2.5">
            ⚖️ {incident.municipalCode}
          </div>

          {/* AI Forensic Summary */}
          <p className="text-xs text-[#161C21] leading-relaxed mb-3">
            {incident.aiSummary}
          </p>

          {/* Risk Vector Matrix */}
          <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
            <span className="text-[10.5px] font-bold text-[#5A6066] uppercase tracking-wider block font-mono">
              Algorithmic Risk Vectors:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-white rounded border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#5A6066] block font-mono">Life Safety</span>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] mt-1 font-mono ${getRiskBadgeColor(
                    incident.riskAssessment.publicSafety
                  )}`}
                >
                  {incident.riskAssessment.publicSafety}
                </span>
              </div>

              <div className="p-2 bg-white rounded border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#5A6066] block font-mono">Infrastructure</span>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] mt-1 font-mono ${getRiskBadgeColor(
                    incident.riskAssessment.infrastructure
                  )}`}
                >
                  {incident.riskAssessment.infrastructure}
                </span>
              </div>

              <div className="p-2 bg-white rounded border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#5A6066] block font-mono">Liability</span>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] mt-1 font-mono ${getRiskBadgeColor(
                    incident.riskAssessment.financialLiability
                  )}`}
                >
                  {incident.riskAssessment.financialLiability}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Agency Routing */}
        <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg shadow-xs">
          <div className="flex items-center gap-1.5 mb-2 text-[#001C33]">
            <Building className="w-3.5 h-3.5 text-[#0159C5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              Automated Dispatch Routing
            </h3>
          </div>

          <div className="mb-2">
            <span className="text-[10.5px] text-[#5A6066] font-mono uppercase font-semibold">
              Primary Jurisdiction:
            </span>
            <div className="text-xs font-bold text-[#001C33] p-2 bg-[#EFF4FB] border border-[#BFDBFE] rounded mt-0.5 flex items-center justify-between">
              <span>{incident.primaryAgency}</span>
              <span className="text-[10px] font-mono text-[#0159C5] uppercase">Lead</span>
            </div>
          </div>

          {incident.secondaryAgencies.length > 0 && (
            <div>
              <span className="text-[10.5px] text-[#5A6066] font-mono uppercase font-semibold">
                Secondary Assists:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {incident.secondaryAgencies.map((agency, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-1 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#161C21]"
                  >
                    + {agency}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Immediate Field Protocols */}
          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
            <span className="text-[10.5px] font-bold text-[#5A6066] uppercase font-mono tracking-wider block mb-1.5">
              Field Protocols Recommended:
            </span>
            <ul className="space-y-1 text-xs text-[#161C21]">
              {incident.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-[#0159C5] font-bold mt-0.5">›</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dispatcher Actions */}
        <div className="p-3.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded-lg shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold text-[#001C33] uppercase font-mono tracking-wider">
            Operator Authorizations:
          </span>

          {incident.status !== 'resolved' ? (
            <>
              {incident.status === 'triaged' && (
                <button
                  onClick={handleDispatch}
                  className="w-full py-2.5 px-4 bg-[#001C33] hover:bg-[#012745] text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#012745]"
                >
                  <Send className="w-3.5 h-3.5 text-[#5790FF]" />
                  <span>Verify & Dispatch Units</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="py-2 px-3 bg-white hover:bg-[#EFF4FB] text-[#001C33] text-xs font-semibold rounded border border-[#CBD5E1] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#5A6066]" />
                  <span>Override Tier</span>
                </button>

                <button
                  onClick={onOpenBroadcastModal}
                  className="py-2 px-3 bg-white hover:bg-amber-50 text-[#C2410C] text-xs font-semibold rounded border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  <span>Public Alert</span>
                </button>
              </div>

              <button
                onClick={() => onResolveIncident(incident.id)}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Incident as Resolved</span>
              </button>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-emerald-900 block">Incident Closed & Resolved</span>
              <span className="text-[11px] text-emerald-700">All dispatched units demobilized.</span>
            </div>
          )}
        </div>

        {/* Dispatch Audit Trail */}
        <div className="bg-white border border-[#CBD5E1] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0159C5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#001C33]">
                Dispatch Audit Trail
              </h3>
            </div>
            <span className="text-[10px] text-[#5A6066] font-mono">Immutable Log</span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-[#E2E8F0]">
            {incident.auditTrail.map((entry) => (
              <div key={entry.id} className="relative pl-6 text-xs">
                {/* Node dot */}
                <div
                  className={`absolute left-0.5 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                    entry.actor === 'AI_AUTOMATION'
                      ? 'border-[#0159C5]'
                      : entry.actor === 'HUMAN_OPERATOR'
                      ? 'border-[#001C33]'
                      : 'border-emerald-600'
                  }`}
                />

                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="font-bold text-[#001C33]">{entry.actorName}</span>
                  <span className="text-[#5A6066]">{entry.timestamp}</span>
                </div>

                <p className="font-semibold text-[#161C21] mt-0.5">{entry.action}</p>
                <p className="text-[11px] text-[#5A6066] leading-snug mt-0.5">{entry.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Priority Override Dialog */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full border border-[#94A3B8] shadow-xl overflow-hidden">
            <div className="p-3 bg-[#001C33] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#5790FF]" />
                <span className="font-heading text-xs font-bold uppercase tracking-wider">
                  Manual Priority Override · {incident.code}
                </span>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-white hover:text-amber-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyOverride} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#001C33] block mb-1 font-mono uppercase">
                  Select Adjusted Priority Tier:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['P1', 'P2', 'P3', 'P4'] as PriorityLevel[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setOverridePriority(p)}
                      className={`py-2 text-xs font-bold rounded border transition-all cursor-pointer font-mono ${
                        overridePriority === p
                          ? 'bg-[#001C33] text-white border-[#001C33] shadow-xs'
                          : 'bg-white text-[#161C21] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#001C33] block mb-1 font-mono uppercase">
                  Mandatory Operator Justification:
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State operational reason for algorithmic priority override (e.g., secondary hazards, weather, supervisor order)..."
                  rows={3}
                  required
                  className="w-full text-xs p-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#5A6066] hover:bg-[#F1F5F9] rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!overrideReason.trim()}
                  className="px-4 py-2 bg-[#001C33] hover:bg-[#012745] disabled:opacity-50 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                >
                  Commit Override to Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
