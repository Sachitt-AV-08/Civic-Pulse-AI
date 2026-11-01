import React, { useState } from 'react';
import { Incident, IncidentCategory, PriorityLevel } from '../types/incident';
import { Sparkles, Radio, Camera, MapPin, AlertCircle, Loader2, Send } from 'lucide-react';
import { playDispatchAlert, playAcknowledgeBeep } from '../utils/audio';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncident: (incident: Incident) => void;
}

const PRESETS = [
  {
    label: 'Natural Gas Leak near School',
    title: 'High-Concentration Methane Gas Odor & Hissing Sound near Elementary School',
    category: 'Fire & Rescue' as IncidentCategory,
    location: '1420 5th Avenue (5th & Spring St)',
    district: 'District 4 - Metro Core',
    lat: 47.6082,
    lng: -122.3325,
    mapX: 52,
    mapY: 48,
    caller: 'Principal Martha Gomez',
    channel: '911 Emergency Bridge' as const,
    transcript:
      'We have a strong odor of mercaptan natural gas drifting across the playground. Maintenance checked the basement meter and reported loud hissing. 340 students are currently being sheltered in place in the gymnasium.',
    imageUrl: 'https://images.unsplash.com/photo-1516216628859-9bcceabb84ca?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Bridge Pier Struck by Barge',
    title: 'Navigation Error: Gravel Barge Collided with South Bascule Pier #02',
    category: 'Public Works' as IncidentCategory,
    location: 'Spokane St Swing Bridge',
    district: 'District 1 - Industrial District',
    lat: 47.5714,
    lng: -122.3481,
    mapX: 28,
    mapY: 78,
    caller: 'Coast Guard Vessel 41',
    channel: 'Municipal Patrol Radio' as const,
    transcript:
      'Uncontrolled empty gravel barge impacted the western concrete pier fender. Visual concrete spalling and misalignment detected on bridge lock pins. Bridge mechanism disabled in open channel position.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Hospital Backup Generator Failure',
    title: 'Automatic Transfer Switch (ATS) Lockout at Regional Trauma Medical Center',
    category: 'Power Grid' as IncidentCategory,
    location: '325 9th Ave (Harbor Medical)',
    district: 'District 2 - Hospital Corridor',
    lat: 47.6045,
    lng: -122.3242,
    mapX: 68,
    mapY: 38,
    caller: 'Chief Facilities Engineer T. Becker',
    channel: '911 Emergency Bridge' as const,
    transcript:
      'Emergency ATS #2 failed to transition during routine feeder maintenance. ICU wing and surgical suites currently on secondary battery UPS with only 35 minutes of reserves remaining.',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
  },
];

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onAddIncident,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Water & Utilities');
  const [address, setAddress] = useState('4th & Pike St');
  const [district, setDistrict] = useState('District 4 - Metro Core');
  const [channel, setChannel] = useState<'911 Emergency Bridge' | '311 Citizen Portal' | 'IoT Telemetry Sensor' | 'Municipal Patrol Radio'>('911 Emergency Bridge');
  const [callerName, setCallerName] = useState('Dispatcher #104');
  const [transcript, setTranscript] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setCategory(p.category);
    setAddress(p.location);
    setDistrict(p.district);
    setChannel(p.channel);
    setCallerName(p.caller);
    setTranscript(p.transcript);
    setImageUrl(p.imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !transcript.trim()) {
      setErrorMessage('Incident title and transmission transcript are required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          reportedLocation: address,
          callerTranscript: transcript,
          description: `${title}. ${transcript}`,
        }),
      });

      const data = await response.json();
      const triage = data.triage;

      const codeNum = Math.floor(8950 + Math.random() * 50);
      const newInc: Incident = {
        id: `inc-${Date.now()}`,
        code: `INC-2026-${codeNum}`,
        title,
        category: triage.category || category,
        priority: triage.priority || 'P1',
        priorityLabel: triage.priorityLabel || 'Critical - Life Safety',
        status: 'triaged',
        location: {
          address,
          district,
          crossStreet: address.includes('&') ? address : 'Arterial Junction',
          lat: 47.605 + (Math.random() - 0.5) * 0.04,
          lng: -122.33 + (Math.random() - 0.5) * 0.04,
          mapX: Math.floor(30 + Math.random() * 50),
          mapY: Math.floor(25 + Math.random() * 50),
        },
        reportedAt: new Date().toISOString(),
        slaDeadlineSeconds: (triage.slaMinutes || 15) * 60,
        initialSlaMinutes: triage.slaMinutes || 15,
        caller: {
          name: callerName || 'Citizen Reporting Unit',
          contact: channel,
          channel,
          recordedAt: new Date().toISOString().slice(11, 19) + ' UTC',
        },
        callerTranscript: transcript,
        hasAudio: true,
        audioDuration: '00:34',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        aiConfidence: triage.confidence || 96.5,
        aiModel: data.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash (Fine-Tuned)' : 'Algorithmic Municipal Triage',
        municipalCode: triage.municipalCode || 'Muni Code §44.2 - General Life Safety Protocol',
        aiSummary: triage.summary || 'Algorithmic assessment completed with multi-agency escalation recommendations.',
        riskAssessment: triage.riskAssessment || {
          publicSafety: 'Critical',
          infrastructure: 'High',
          financialLiability: 'High',
        },
        primaryAgency: triage.primaryAgency || 'Fire & Rescue Emergency Response',
        secondaryAgencies: triage.secondaryAgencies || ['Metro Police Dept', 'Public Works'],
        assignedUnits: [
          {
            unitId: 'ENG-02',
            agency: triage.primaryAgency || 'Fire & Rescue',
            type: 'Tactical First Responder',
            status: 'Standby',
            etaMinutes: 5,
          },
        ],
        recommendedActions: triage.recommendedActions || [
          'Authorize immediate unit dispatch',
          'Coordinate perimeter isolation with traffic engineers',
        ],
        auditTrail: [
          {
            id: `aud-${Date.now()}-1`,
            timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
            actor: 'SYSTEM_TELEMETRY',
            actorName: channel,
            action: 'Emergency Ingest Received',
            details: 'Signal logged via municipal dispatch console.',
          },
          {
            id: `aud-${Date.now()}-2`,
            timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
            actor: 'AI_AUTOMATION',
            actorName: data.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash Engine' : 'Algorithmic Rule Engine',
            action: `Auto-Triaged as ${triage.priority || 'P1'}`,
            details: `Confidence score ${triage.confidence || 96.5}%. Citations: ${triage.municipalCode || 'Standard code'}.`,
          },
        ],
      };

      if (newInc.priority === 'P1') {
        playDispatchAlert();
      } else {
        playAcknowledgeBeep();
      }

      onAddIncident(newInc);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to triage incident.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full border border-[#94A3B8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3.5 bg-[#001C33] text-white flex items-center justify-between border-b border-[#012745]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5790FF]" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
              Manual Incident Intake & Gemini AI Triage
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-amber-300 font-bold text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Presets Quick Picker */}
        <div className="p-3 bg-[#F8F9FF] border-b border-[#CBD5E1]">
          <span className="text-[10.5px] font-bold text-[#5A6066] uppercase tracking-wider block mb-1.5 font-mono">
            Fast Load Real-World Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-[#EFF4FB] text-[#001C33] border border-[#CBD5E1] rounded transition-all cursor-pointer shadow-2xs"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intake Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
              Incident Title / Headline:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 24-Inch Water Main Rupture with Arterial Buckling"
              className="w-full h-8 px-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full h-8 px-2 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
              >
                <option value="Water & Utilities">Water & Utilities</option>
                <option value="Traffic & Transit">Traffic & Transit</option>
                <option value="Fire & Rescue">Fire & Rescue</option>
                <option value="Public Works">Public Works</option>
                <option value="Power Grid">Power Grid</option>
                <option value="Environmental Hazard">Environmental Hazard</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
                Reporting Ingest Channel:
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full h-8 px-2 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
              >
                <option value="911 Emergency Bridge">911 Emergency Bridge</option>
                <option value="311 Citizen Portal">311 Citizen Portal</option>
                <option value="IoT Telemetry Sensor">IoT Telemetry Sensor</option>
                <option value="Municipal Patrol Radio">Municipal Patrol Radio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
                Reported Street Address / Cross:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 4th Ave & Pike St"
                className="w-full h-8 px-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
                District / Precinct:
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-8 px-2 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
              >
                <option value="District 4 - Metro Core">District 4 - Metro Core</option>
                <option value="District 2 - Hospital Corridor">District 2 - Hospital Corridor</option>
                <option value="District 3 - Maritime Basin">District 3 - Maritime Basin</option>
                <option value="District 1 - Industrial District">District 1 - Industrial District</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
              Reporting Caller / Officer Name:
            </label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="e.g., Officer J. Ramos or Citizen ID #889"
              className="w-full h-8 px-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
              Transmission / Caller Transcript:
            </label>
            <textarea
              required
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Full transcript of 911 dispatch or citizen report..."
              className="w-full p-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] font-mono focus:border-[#0159C5] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-[#001C33] block mb-1 uppercase font-mono text-[11px]">
              Evidence Photo URL (Optional):
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-8 px-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] focus:border-[#0159C5] focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[11px] text-[#5A6066]">
              Powered by Google Gemini 3.8 Flash Municipal Triage Fine-Tune
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#5A6066] hover:bg-[#F1F5F9] rounded cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#001C33] hover:bg-[#012745] disabled:opacity-50 text-white font-bold rounded flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5790FF]" />
                    <span>Analyzing via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#5790FF]" />
                    <span>Run AI Triage & Ingest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
