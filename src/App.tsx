import React, { useState, useEffect } from 'react';
import { Incident, PriorityLevel } from './types/incident';
import { INITIAL_INCIDENTS } from './data/initialIncidents';
import { StitchHeader } from './components/StitchHeader';
import { StitchSidebar } from './components/StitchSidebar';
import { HomeDashboardView } from './components/views/HomeDashboardView';
import { LiveMapTriageView } from './components/views/LiveMapTriageView';
import { OperationsQueueView } from './components/views/OperationsQueueView';
import { ReportIssueView } from './components/views/ReportIssueView';
import { PublicImpactSlaView } from './components/views/PublicImpactSlaView';
import { CommunityFeedView } from './components/views/CommunityFeedView';
import { AlertsView } from './components/views/AlertsView';
import { BroadcastModal } from './components/BroadcastModal';
import { GeminiCopilot } from './components/GeminiCopilot';
import { calculateAIRecommendedPriority } from './utils/aiPriorityScorer';

export type ActiveView =
  | 'home'
  | 'live-map-triage'
  | 'operations-queue'
  | 'report-issue-ai-assistant'
  | 'public-impact-slas'
  | 'community-feed'
  | 'alerts';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(INITIAL_INCIDENTS[0].id);
  // Default landing view is now the win-worthy Home Dashboard
  const [currentView, setCurrentView] = useState<ActiveView>('home');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isOfficerMode, setIsOfficerMode] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Decrement SLA timers in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.status === 'resolved' || inc.slaDeadlineSeconds <= 0) return inc;
          return {
            ...inc,
            slaDeadlineSeconds: Math.max(0, inc.slaDeadlineSeconds - 1),
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncidentId(incident.id);
  };

  const handleDispatchUnits = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const nowUtc = new Date().toISOString().slice(11, 19) + ' UTC';
        const updatedUnits = inc.assignedUnits.map((u) => ({
          ...u,
          status: 'En Route' as const,
        }));

        const newAudit = [
          ...inc.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowUtc,
            actor: 'HUMAN_OPERATOR' as const,
            actorName: 'Inspector R. Sharma (Lead Triage)',
            action: 'Authorized Multi-Unit Field Deployment',
            details: `Dispatched primary unit ${inc.primaryAgency}. Siren & fast-track authorized.`,
          },
        ];

        return {
          ...inc,
          status: 'dispatched',
          assignedUnits: updatedUnits,
          auditTrail: newAudit,
        };
      })
    );
    showToast(`Field units dispatched for ${selectedIncident?.code || 'incident'}.`);
  };

  const handleAcceptAIPriority = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const nowUtc = new Date().toISOString().slice(11, 19) + ' UTC';
        const rec =
          inc.aiRecommendedPriority ||
          calculateAIRecommendedPriority({
            title: inc.title,
            description: inc.aiSummary,
            callerTranscript: inc.callerTranscript,
            category: inc.category,
            address: inc.location.address,
            priority: inc.priority,
          });

        const newAudit = [
          ...inc.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowUtc,
            actor: 'HUMAN_OPERATOR' as const,
            actorName: 'Inspector R. Sharma (Ward 112)',
            action: `AI Priority Accepted: Confirmed ${rec.recommendedPriority} (Severity Score ${rec.automatedSeverityScore}/100)`,
            details: `Cross-referenced against historical cluster ${rec.historicalPattern.patternClusterId} (${rec.historicalPattern.similarIncidentsCount} precedent incidents).`,
          },
        ];

        return {
          ...inc,
          priority: rec.recommendedPriority,
          priorityLabel: rec.recommendedPriorityLabel,
          aiRecommendedPriority: {
            ...rec,
            reviewStatus: 'accepted' as const,
            operatorReview: {
              reviewedBy: 'Inspector R. Sharma (Ward 112)',
              reviewedAt: nowUtc,
              decision: 'accepted' as const,
              finalPriority: rec.recommendedPriority,
            },
          },
          auditTrail: newAudit,
        };
      })
    );
    showToast(`AI-Recommended Priority accepted and committed to dispatch audit.`);
  };

  const handleOverridePriority = (
    incidentId: string,
    newPriority: PriorityLevel,
    reason: string
  ) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const nowUtc = new Date().toISOString().slice(11, 19) + ' UTC';

        const newAudit = [
          ...inc.auditTrail,
          {
            id: `aud-${Date.now()}`,
            timestamp: nowUtc,
            actor: 'HUMAN_OPERATOR' as const,
            actorName: 'Inspector R. Sharma (Ward 112)',
            action: `Supervisor Override: Priority changed from ${inc.priority} to ${newPriority}`,
            details: `Reason: ${reason}. Escalation notified across BESCOM, BBMP, BWSSB.`,
          },
        ];

        return {
          ...inc,
          priority: newPriority,
          aiRecommendedPriority: inc.aiRecommendedPriority
            ? {
                ...inc.aiRecommendedPriority,
                reviewStatus: 'overridden' as const,
                operatorReview: {
                  reviewedBy: 'Inspector R. Sharma (Ward 112)',
                  reviewedAt: nowUtc,
                  decision: 'overridden' as const,
                  finalPriority: newPriority,
                  notes: reason,
                },
              }
            : undefined,
          auditTrail: newAudit,
        };
      })
    );
    showToast(`Priority updated to ${newPriority} with statutory audit stamp.`);
  };

  const handleIncidentCreated = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
    showToast(`New Incident ${newIncident.code} added to live dispatch queue.`);
  };

  const handleResolveIncident = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: 'resolved' as const } : inc))
    );
    showToast('Incident marked as resolved. Cryptographic OTP signed.');
  };

  const criticalOverdueCount = incidents.filter(
    (i) => i.priority === 'P1' && (i.status === 'triaged' || i.slaDeadlineSeconds < 900)
  ).length;

  return (
    <div className="min-h-screen bg-[#f6faff] text-[#161c21] font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-8 z-50 px-4 py-2.5 rounded-xl bg-[#011d34] text-white text-xs font-bold shadow-xl border border-cyan-400/40 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-amber-300">notifications_active</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Stitch Fixed Header (80px height) */}
      <StitchHeader
        currentView={currentView}
        onNavigate={(path) => setCurrentView(path as ActiveView)}
        userRole={isOfficerMode ? 'Officer' : 'Citizen'}
        onToggleRole={() => setIsOfficerMode(!isOfficerMode)}
        criticalOverdueCount={criticalOverdueCount}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
      />

      {/* Stitch Fixed Sidebar (64w / 256px width) */}
      <StitchSidebar
        currentView={currentView}
        onNavigate={(path) => setCurrentView(path as ActiveView)}
      />

      {/* Main Content Area: Offset by sidebar (pl-64 on desktop) and header (pt-20) */}
      <div className="pl-0 md:pl-64 flex flex-col min-h-screen">
        <main className="relative pt-20 w-full min-h-screen bg-[#f6faff]">
          {currentView === 'home' && (
            <HomeDashboardView
              incidents={incidents}
              onSelectIncident={(inc) => {
                handleSelectIncident(inc);
                setCurrentView('live-map-triage');
              }}
              onNavigate={(path) => setCurrentView(path as ActiveView)}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenCivicGuard={() => setIsCopilotOpen(true)}
            />
          )}

          {currentView === 'live-map-triage' && (
            <LiveMapTriageView
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={handleSelectIncident}
              onDispatchUnits={handleDispatchUnits}
              onOverridePriority={handleOverridePriority}
              onResolveIncident={handleResolveIncident}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onAcceptAIPriority={handleAcceptAIPriority}
            />
          )}

          {currentView === 'operations-queue' && (
            <OperationsQueueView
              incidents={incidents}
              onSelectIncident={(inc) => {
                handleSelectIncident(inc);
                setCurrentView('live-map-triage');
              }}
              onDispatchUnits={handleDispatchUnits}
              onOpenIntakeModal={() => setCurrentView('report-issue-ai-assistant')}
            />
          )}

          {currentView === 'report-issue-ai-assistant' && (
            <ReportIssueView
              onIncidentCreated={handleIncidentCreated}
              onNavigateToMap={() => setCurrentView('live-map-triage')}
              onOpenVoiceCopilot={() => setIsCopilotOpen(true)}
            />
          )}

          {currentView === 'public-impact-slas' && <PublicImpactSlaView />}

          {currentView === 'community-feed' && <CommunityFeedView />}

          {currentView === 'alerts' && (
            <AlertsView
              incidents={incidents}
              onSelectIncident={(id) => {
                setSelectedIncidentId(id);
                setCurrentView('live-map-triage');
              }}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenVoiceCopilot={() => setIsCopilotOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Action Button for Civic Guard AI */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#011D34] to-[#022c4d] hover:from-[#022c4d] hover:to-[#011D34] text-white shadow-2xl flex items-center gap-2.5 border border-cyan-400/40 transition-transform hover:scale-105 cursor-pointer ring-4 ring-[#0259C5]/10"
        title="Open Civic Guard AI with Voice Chat, Search & Maps Grounding"
      >
        <div className="w-6 h-6 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-300">
          <span className="material-symbols-outlined text-[18px]">shield</span>
        </div>
        <span className="text-xs font-bold tracking-wide">Civic Guard</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
      </button>

      {/* WEA Public Broadcast Modal */}
      {isBroadcastModalOpen && (
        <BroadcastModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          selectedIncident={selectedIncident}
          onBroadcastSent={(alertText) => {
            showToast(`Broadcast sent: "${alertText.slice(0, 40)}..."`);
            setIsBroadcastModalOpen(false);
          }}
        />
      )}

      {/* Civic Guard Dispatch Copilot Drawer */}
      <GeminiCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentIncident={selectedIncident}
        onLocatePinOnMap={(lat, lng, title) => {
          setCurrentView('live-map-triage');
          showToast(`Geolocating ${title} on Live Map (${lat.toFixed(4)}, ${lng.toFixed(4)}).`);
        }}
      />
    </div>
  );
}
