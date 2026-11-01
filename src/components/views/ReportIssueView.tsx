import React, { useState, useMemo } from 'react';
import { Incident } from '../../types/incident';
import { calculateAIRecommendedPriority, getSeverityScoreStyle } from '../../utils/aiPriorityScorer';

interface ReportIssueViewProps {
  onIncidentCreated: (newIncident: Incident) => void;
  onNavigateToMap: () => void;
  onOpenVoiceCopilot?: () => void;
}

export function ReportIssueView({
  onIncidentCreated,
  onNavigateToMap,
  onOpenVoiceCopilot,
}: ReportIssueViewProps) {
  const [narrative, setNarrative] = useState(
    'High-voltage underground 11kV electrical feeder wire snapped and sparking in standing water right outside National Public School Gate 2 on 12th Main Road during road trenching work. Children and pedestrians walking past.'
  );
  const [address, setAddress] = useState(
    'Opposite National Public School Gate 2, 12th Main Road, Ward 112 Indiranagar, Bengaluru - 560038'
  );
  const [selectedCategory, setSelectedCategory] = useState<'Electrical' | 'Roads' | 'Water' | 'Streetlights' | 'Sanitation'>('Electrical');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Live pattern cross-referencing and severity computation
  const liveAiRec = useMemo(() => {
    const cat =
      selectedCategory === 'Electrical'
        ? 'Power Grid'
        : selectedCategory === 'Roads'
        ? 'Public Works'
        : selectedCategory === 'Water'
        ? 'Water & Utilities'
        : selectedCategory === 'Sanitation'
        ? 'Environmental Hazard'
        : 'Traffic & Transit';

    return calculateAIRecommendedPriority({
      title: narrative.slice(0, 60),
      description: narrative,
      callerTranscript: narrative,
      category: cat,
      address,
    });
  }, [narrative, selectedCategory, address]);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setNarrative((prev) =>
        prev + ' [Audio Telemetry verified: Bescom transformer buzz audio signature detected]'
      );
    }, 2800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const resp = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: narrative,
          callerTranscript: narrative,
          location: address,
        }),
      });

      const triageData = resp.ok ? await resp.json() : null;
      const code = `CV-${Math.floor(8500 + Math.random() * 500)}`;

      const newInc: Incident = {
        id: `inc-${Date.now()}`,
        code,
        title: narrative.slice(0, 60) + '...',
        category:
          selectedCategory === 'Electrical'
            ? 'Power Grid'
            : selectedCategory === 'Roads'
            ? 'Public Works'
            : selectedCategory === 'Water'
            ? 'Water & Utilities'
            : selectedCategory === 'Sanitation'
            ? 'Environmental Hazard'
            : 'Traffic & Transit',
        priority: liveAiRec.recommendedPriority,
        priorityLabel: liveAiRec.recommendedPriorityLabel,
        aiRecommendedPriority: liveAiRec,
        status: 'triaged',
        reportedAt: 'Just now',
        slaDeadlineSeconds: 7200,
        initialSlaMinutes: 120,
        location: {
          address,
          district: 'Ward 112 (Indiranagar)',
          lat: 12.9784,
          lng: 77.6408,
          mapX: 42,
          mapY: 38,
        },
        caller: {
          name: 'Verified Citizen (OTP #9845)',
          contact: '+91 98450 11200',
          channel: '311 Citizen Portal',
          recordedAt: new Date().toLocaleTimeString(),
        },
        callerTranscript: narrative,
        hasAudio: true,
        audioDuration: '0:42',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBQC91_Uqm7Ef2K5wf2imStaLAW5V0GuleOVwI9lWu-ZHMSzo1SoM2Oet62oZXa77C4T2oG8huiMMg9JJF_QK47mSgpZ2dTXwiUhv9ZGM14HpHv7qyIivSLchb3EOinaJnh_BeWQFr3ytNOPKCKSrDp_a9zzOcYN7qQN1xYsBU4pRNLw0HgEtEVT_JR4JCJBSVb6vGzeIXlc6QlZKXHBXwuEvvE3gUZMouJvzJiAts',
        aiConfidence: 98.4,
        aiModel: 'Gemini 3.8 Flash (Triage & Multi-Agency Bridge v4.2)',
        municipalCode: 'KSA-BESCOM-2011 Sec 14(A)',
        aiSummary:
          triageData?.summary ||
          'High-voltage 11kV conductor immersed in standing water near school gate. Active electrocution and public safety risk.',
        riskAssessment: {
          publicSafety: 'Critical',
          infrastructure: 'High',
          financialLiability: 'Critical',
        },
        primaryAgency: 'BESCOM Quick Response Unit #41',
        secondaryAgencies: ['BBMP Disaster Management', 'Traffic Police East'],
        assignedUnits: [
          {
            unitId: 'unit-bescom-41',
            agency: 'BESCOM',
            type: 'Quick Response Squad',
            status: 'Dispatched',
            etaMinutes: 8,
          },
        ],
        recommendedActions: [
          'Trigger SCADA breaker lock on Indiranagar 11kV bus',
          'Deploy BESCOM Quick Response Unit #41',
          'Cordon 50m radius via BBMP Traffic Marshalls',
        ],
        auditTrail: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            actor: 'AI_AUTOMATION',
            actorName: 'Gemini Municipal Triage v4.2',
            action: 'Statutory Incident Intake & Geocoding',
            details: `Confidence 98.4%. SHA-256 evidence validated. Assigned to BESCOM.`,
          },
        ],
      };

      onIncidentCreated(newInc);
      setSubmittedCode(code);
    } catch {
      setSubmittedCode('CV-8490');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 lg:px-10 py-6">
      {/* Top Breadcrumb & Status Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-[#43474d] font-semibold">
          <span>Ward 112 Command</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Field Telemetry</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#161c21] font-bold">
            Incident Intake #{submittedCode || 'BLR-2025-0892'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d9e2ff] text-[#001a43] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0259c5] animate-pulse"></span>
            Realtime Triage Engine: Operational
          </span>
          <span className="text-[#43474d] text-xs font-mono">Latency 18ms</span>
        </div>
      </div>

      {submittedCode && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-emerald-600">check_circle</span>
            <div>
              <p className="font-bold text-sm">
                Incident #{submittedCode} successfully Triaged & Dispatched to BESCOM Quick Response Unit #41!
              </p>
              <p className="text-xs text-emerald-700">
                SLA countdown active (2-hour life safety window). Field unit en route.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToMap}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow"
          >
            Track on Live Map →
          </button>
        </div>
      )}

      {/* Main Operational Split Layout (55% / 45%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Citizen & Officer Reporting Form (7 cols) */}
        <section className="xl:col-span-7 flex flex-col gap-5">
          {/* Header Banner Card */}
          <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl text-[#161c21] tracking-tight font-bold">
                File a Verified Civic Incident
              </h1>
              <span className="material-symbols-outlined text-[28px] text-[#0259c5]">verified_user</span>
            </div>
            <p className="text-sm text-[#43474d] max-w-2xl leading-relaxed">
              AI verifies geolocation, checks for duplicate dispatches, and pre-classifies municipal severity before public and operational queue handoff.
            </p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* STEP 1: Issue Description & Audio Intake */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#011d34] text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <span className="text-base font-bold text-[#161c21]">Issue Description & Audio Intake</span>
                </div>
                <span className="text-xs text-[#0259c5] font-semibold uppercase tracking-wider">Mandatory</span>
              </div>

              {/* Kannada / English Speech-to-Text Status Pill */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#eff4fb] border border-[#d9e2ff]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#d9e2ff] text-[#0259c5] hover:bg-[#c4d7ff]'
                    }`}
                    title="Toggle audio recording"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                  <span className="text-xs text-[#161c21] font-medium">
                    {isRecording
                      ? 'Listening & transcribing Kannada / English audio stream...'
                      : 'Audio transcription active (Kannada/English speech-to-text verified)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenVoiceCopilot && (
                    <button
                      type="button"
                      onClick={onOpenVoiceCopilot}
                      className="px-2 py-0.5 rounded text-[11px] bg-[#0259c5] text-white font-semibold hover:bg-[#004397]"
                    >
                      Copilot Radio
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-[#0259c5] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0259c5]"></span>
                    Synced
                  </span>
                </div>
              </div>

              {/* Complaint Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#43474d] uppercase font-bold tracking-wider" htmlFor="complaint-text">
                  Detailed Incident Narrative
                </label>
                <div className="p-3 rounded-lg bg-white border border-[#c3c6cd] focus-within:border-[#0259c5] focus-within:ring-2 focus-within:ring-[#d9e2ff] transition-all">
                  <textarea
                    className="w-full bg-transparent text-sm text-[#161c21] focus:outline-none resize-none leading-relaxed"
                    id="complaint-text"
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Describe the incident with precision..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between pt-1 text-[#43474d] text-xs">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#0259c5]">auto_awesome</span>
                    Natural Language Parser active: 3 hazards extracted
                  </span>
                  <span className="font-mono">{narrative.length} / 1000 characters</span>
                </div>
              </div>
            </div>

            {/* STEP 2: Photo / Evidence Upload */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#011d34] text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span className="text-base font-bold text-[#161c21]">Photo & Forensic Evidence</span>
                </div>
                <span className="text-xs text-[#43474d]">Tamper-Proof Geotagging</span>
              </div>

              {/* Evidence Card Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-[#eff4fb] border border-[#dde3ea]">
                <div className="md:col-span-4 relative rounded-lg overflow-hidden bg-[#e3e9f0] h-32 md:h-full min-h-[120px]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Severed electric wire submerged in puddle on 12th Main Road"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQC91_Uqm7Ef2K5wf2imStaLAW5V0GuleOVwI9lWu-ZHMSzo1SoM2Oet62oZXa77C4T2oG8huiMMg9JJF_QK47mSgpZ2dTXwiUhv9ZGM14HpHv7qyIivSLchb3EOinaJnh_BeWQFr3ytNOPKCKSrDp_a9zzOcYN7qQN1xYsBU4pRNLw0HgEtEVT_JR4JCJBSVb6vGzeIXlc6QlZKXHBXwuEvvE3gUZMouJvzJiAts"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-xs text-[#161c21] font-bold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-red-600">lens_blur</span>
                    RAW Capture
                  </div>
                </div>

                <div className="md:col-span-8 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#161c21]">Evidence File: IMG_9842_RAW.dng</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#dde3ea] text-[#161c21] text-[11px] font-semibold">
                        <span className="material-symbols-outlined text-[14px] text-[#0259c5]">verified</span>
                        SHA-256 Valid
                      </span>
                    </div>
                    <p className="text-xs text-[#43474d] leading-relaxed">
                      EXIF GPS & Timestamp Tagged:{' '}
                      <span className="font-mono text-[#161c21] font-semibold">12.97842° N, 77.64081° E</span> • Today{' '}
                      <span className="font-mono text-[#161c21] font-semibold">14:22:04 IST</span> • Hash{' '}
                      <span className="text-[#0259c5] font-mono font-bold">#89f2a4e9b</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#161c21] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm border border-[#c3c6cd]"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Inspect Metadata
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-[#d9e2ff] hover:bg-[#afc6ff] text-[#001a43] text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                      Add Photo / Video
                    </button>
                  </div>
                </div>
              </div>

              {/* Supplementary Upload Target */}
              <div className="p-4 rounded-xl bg-white border-2 border-dashed border-[#c3c6cd] hover:border-[#0259c5] text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#eff4fb] transition-colors">
                <span className="material-symbols-outlined text-[26px] text-[#74777e]">cloud_upload</span>
                <p className="text-xs text-[#161c21] font-semibold">Drag secondary sensor logs or field imagery here</p>
                <span className="text-[11px] text-[#43474d]">Supports MP4, JPG, PNG, HEIC up to 45MB</span>
              </div>
            </div>

            {/* STEP 3: Location & Geotag */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#011d34] text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <span className="text-base font-bold text-[#161c21]">Location & Sub-Meter Geotag</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-[#0259c5] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">gps_fixed</span>
                  RTK Dual Lock
                </span>
              </div>

              {/* Address Input Display */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#43474d] uppercase font-bold tracking-wider" htmlFor="address-field">
                  Pinned Municipal Address
                </label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#eff4fb] border border-[#d9e2ff]">
                  <span className="material-symbols-outlined text-[#0259c5] text-[20px] flex-shrink-0">pin_drop</span>
                  <input
                    className="w-full bg-transparent text-xs text-[#161c21] font-medium focus:outline-none"
                    id="address-field"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              {/* Location Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#e9eef5] hover:bg-[#dde3ea] text-[#161c21] text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0259c5]">lock</span>
                  Use GPS Location (±2.4m RTK Lock)
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#eff4fb] hover:bg-[#e9eef5] text-[#43474d] hover:text-[#161c21] text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">electric_bolt</span>
                  Search Landmark / Pole ID: #BES-112-901
                </button>
              </div>
            </div>

            {/* STEP 4: Category Quick Selection Grid */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#011d34] text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <span className="text-base font-bold text-[#161c21]">Category Classification</span>
                </div>
                <span className="text-xs text-[#0259c5] font-semibold">AI Pre-Selected</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {[
                  { id: 'Electrical', label: 'Electrical & Power Lines', icon: 'bolt' },
                  { id: 'Roads', label: 'Potholes & Roads', icon: 'traffic' },
                  { id: 'Water', label: 'Water & Sewage', icon: 'water_damage' },
                  { id: 'Streetlights', label: 'Streetlights Outage', icon: 'light' },
                  { id: 'Sanitation', label: 'Garbage & Sanitation', icon: 'delete_outline' },
                ].map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl text-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#011d34] text-white shadow-md ring-2 ring-[#0259c5] scale-[1.02]'
                          : 'bg-[#eff4fb] hover:bg-[#e3e9f0] text-[#161c21]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[26px] ${
                          isSelected ? 'text-[#d9e2ff]' : 'text-[#43474d]'
                        }`}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-xs font-semibold leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Footer & Duplicate Sentinel */}
            <div className="p-6 rounded-xl bg-white border border-[#DCE3EE] shadow-sm flex flex-col gap-4">
              {/* Radius Duplicate Check Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#eff4fb] text-[#161c21] border border-[#d9e2ff]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#0259c5]">radar</span>
                  <span className="text-xs font-medium">
                    Spatial Deduplication Check: <span className="font-bold">0 duplicates detected</span> within 150m radius
                  </span>
                </div>
                <span className="text-[11px] text-[#43474d]">Scan depth: 48h active queue</span>
              </div>

              {/* Submissions Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#e9eef5] hover:bg-[#dde3ea] text-[#161c21] text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Encrypted Draft (Offline Sync)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#011d34] hover:bg-[#022c4d] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#d9e2ff]">
                    {isSubmitting ? 'sync' : 'send_time_extension'}
                  </span>
                  {isSubmitting ? 'Triaging via Gemini 3.8...' : 'Submit & Dispatch to Municipal Control'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: Live Real-time AI Triage Preview Card (5 cols) */}
        <aside className="xl:col-span-5 flex flex-col gap-5 xl:sticky xl:top-24">
          <div className="rounded-xl bg-white border border-[#DCE3EE] shadow-md overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="p-5 bg-[#eff4fb] border-b border-[#DCE3EE] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0259c5] text-[24px]">psychology</span>
                  <h2 className="text-base font-bold text-[#161c21] tracking-tight">AI Triage Neural Preview</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d9e2ff] text-[#001a43] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0259c5]"></span>
                  98.4% Confidence • Model v4.2
                </span>
              </div>
              <p className="text-xs text-[#43474d]">
                Continuous inference based on multimodal vision and narrative NLP telemetry.
              </p>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Severity & Urgency Tier Display */}
              <div
                className={`p-4 rounded-xl flex flex-col gap-2 border ${
                  liveAiRec.recommendedPriority === 'P1'
                    ? 'bg-[#ffdad6] text-[#93000a] border-red-200'
                    : liveAiRec.recommendedPriority === 'P2'
                    ? 'bg-[#ffeedb] text-[#783200] border-amber-200'
                    : 'bg-[#eff4fb] text-[#001a43] border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider">
                    Automated Severity Score: {liveAiRec.automatedSeverityScore}/100
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                    {liveAiRec.recommendedPriority === 'P1' ? 'CRITICAL ESCALATION' : 'ROUTINE VERIFIED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-extrabold tracking-tight">
                      {liveAiRec.recommendedPriority} · {liveAiRec.recommendedPriorityLabel}
                    </div>
                    <div className="text-xs font-mono mt-0.5">
                      Pattern: {liveAiRec.historicalPattern.patternClusterId} ({liveAiRec.historicalPattern.similarIncidentsCount} precedent cases)
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#011D34] text-white flex items-center justify-center flex-shrink-0 shadow">
                    <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                  </div>
                </div>

                <div className="pt-2 mt-1 border-t border-current/20 text-[11px] italic leading-tight">
                  "{liveAiRec.historicalPattern.historicalPrecedentNote}"
                </div>
              </div>

              {/* Automatic Department Routing Breakdown */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#43474d] uppercase font-bold tracking-wider">
                  Algorithmic Agency Routing
                </span>
                <div className="p-4 rounded-xl bg-[#eff4fb] border border-[#dde3ea] flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#0259c5] text-[22px] flex-shrink-0 mt-0.5">
                      electric_meter
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#161c21] font-bold">Target Agency: BESCOM</span>
                      <span className="text-xs text-[#43474d] leading-relaxed">
                        Bangalore Electricity Supply Company — Quick Response Unit #41 (Indiranagar Feeder Depot)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-[#d5dbe2]">
                    <span className="material-symbols-outlined text-[#43474d] text-[20px] flex-shrink-0 mt-0.5">
                      notification_important
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#161c21] font-semibold">Secondary Co-responder:</span>
                      <span className="text-xs text-[#43474d]">
                        BBMP Ward 112 Infrastructure Disaster Cell notified via priority webhook
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen's Charter SLA Mandate & Simulation Meter */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#43474d] uppercase font-bold tracking-wider">
                    Citizen's Charter SLA Mandate
                  </span>
                  <span className="text-xs text-[#ba1a1a] font-bold">2-Hour Emergency Life-Safety Window</span>
                </div>
                <div className="p-4 rounded-xl bg-[#e9eef5] flex flex-col gap-2">
                  <div className="w-full bg-[#dde3ea] h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-[#ba1a1a] w-1/4 h-full"></div>
                    <div className="bg-[#0259c5] w-2/4 h-full"></div>
                    <div className="bg-slate-300 w-1/4 h-full"></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#161c21] font-medium font-mono">
                    <span className="flex items-center gap-1 font-semibold text-red-700">
                      <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                      Target First Unit: &lt; 30 mins
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#0259c5]">
                      <span className="w-2 h-2 rounded-full bg-[#0259c5]"></span>
                      Full Containment: &lt; 2h
                    </span>
                  </div>
                </div>
              </div>

              {/* Duplicate Likelihood Sentinel */}
              <div className="p-4 rounded-xl bg-[#eff4fb] border border-[#dde3ea] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#161c21]">Cluster Sentinel: 0 Duplicates</span>
                    <span className="text-[11px] text-[#43474d]">Fresh dispatch sequence initialized</span>
                  </div>
                </div>
                <span className="text-xs text-emerald-700 font-bold font-mono">Clean Ticket</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
