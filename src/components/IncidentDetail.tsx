import React, { useState } from 'react';
import { Incident } from '../types/incident';
import { AudioPlayer } from './AudioPlayer';
import { MunicipalMap } from './MunicipalMap';
import {
  MapPin,
  Clock,
  Radio,
  FileText,
  Camera,
  Maximize2,
  Users,
  Building,
  CheckCircle,
  ExternalLink,
  Map as MapIcon,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface IncidentDetailProps {
  incident: Incident;
  allIncidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onUpdateNotes: (notes: string) => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incident,
  allIncidents,
  onSelectIncident,
  onUpdateNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MAP' | 'TRANSCRIPT'>('OVERVIEW');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [notes, setNotes] = useState(incident.operatorNotes || '');
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isTranscribingNote, setIsTranscribingNote] = useState(false);
  const noteMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const noteAudioChunksRef = React.useRef<Blob[]>([]);

  const toggleRecordNote = async () => {
    if (isRecordingNote) {
      if (noteMediaRecorderRef.current) {
        noteMediaRecorderRef.current.stop();
        setIsRecordingNote(false);
      }
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setNotes((prev) => (prev ? `${prev} [Voice Note]: ${transcript}` : `[Voice Note]: ${transcript}`));
            setIsRecordingNote(false);
          };
          rec.start();
          setIsRecordingNote(true);
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      noteAudioChunksRef.current = [];
      const rec = new MediaRecorder(stream);
      noteMediaRecorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) noteAudioChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        const audioBlob = new Blob(noteAudioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribingNote(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioData: base64Audio,
                mimeType: 'audio/webm',
                context: `Field note for incident ${incident.code}: ${incident.title}`,
              }),
            });
            const data = await res.json();
            if (data.transcription) {
              setNotes((prev) =>
                prev ? `${prev} [Dictated via Gemini]: ${data.transcription}` : `[Dictated via Gemini]: ${data.transcription}`
              );
            }
            setIsTranscribingNote(false);
          };
        } catch (err) {
          console.error(err);
          setIsTranscribingNote(false);
        }
      };

      rec.start();
      setIsRecordingNote(true);
    } catch (e) {
      console.error('Microphone error:', e);
    }
  };

  const formatSla = (seconds: number) => {
    if (seconds <= 0) return '00:00:00 (BREACHED)';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FF] overflow-y-auto">
      {/* Incident Header */}
      <div className="p-4 bg-white border-b border-[#CBD5E1] shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#001C33] text-white rounded">
                {incident.code}
              </span>
              <span className="text-xs font-semibold text-[#0159C5] bg-[#EBF3FC] px-2 py-0.5 rounded border border-[#BFDBFE]">
                {incident.category}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${
                  incident.priority === 'P1'
                    ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB]'
                    : incident.priority === 'P2'
                    ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]'
                    : 'bg-[#EFF4FB] text-[#001C33]'
                }`}
              >
                {incident.priority} · {incident.priorityLabel}
              </span>

              {incident.aiRecommendedPriority && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#001C33] text-white border border-[#5790FF]/40 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#5790FF]" />
                  <span>AI Rec: {incident.aiRecommendedPriority.recommendedPriority} ({incident.aiRecommendedPriority.automatedSeverityScore}/100)</span>
                </span>
              )}
            </div>

            <h1 className="font-heading text-lg font-bold text-[#001C33] tracking-tight">
              {incident.title}
            </h1>
          </div>

          {/* SLA Degradation Counter Card */}
          <div className="px-3.5 py-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-right min-w-[140px]">
            <span className="text-[10.5px] uppercase font-mono text-[#5A6066] font-semibold block">
              SLA Time to Breach
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <Clock
                className={`w-4 h-4 ${
                  incident.slaDeadlineSeconds < 300 ? 'text-[#BA1A1A] animate-spin' : 'text-[#0159C5]'
                }`}
              />
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  incident.slaDeadlineSeconds < 300 ? 'text-[#BA1A1A]' : 'text-[#001C33]'
                }`}
              >
                {formatSla(incident.slaDeadlineSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Metadata Line */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A6066] pt-1 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-1.5 text-[#001C33] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#0159C5]" />
            <span>{incident.location.address}</span>
            {incident.location.crossStreet && (
              <span className="text-[#5A6066]">({incident.location.crossStreet})</span>
            )}
          </div>
          <span>·</span>
          <span>{incident.location.district}</span>
          <span>·</span>
          <span className="font-mono">
            {incident.location.lat.toFixed(4)}° N, {Math.abs(incident.location.lng).toFixed(4)}° W
          </span>
          <span>·</span>
          <span>Reported: {new Date(incident.reportedAt).toLocaleTimeString()}</span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#001C33] text-white shadow-xs'
                : 'text-[#5A6066] hover:bg-[#EFF4FB]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Forensic Dossier</span>
          </button>

          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MAP'
                ? 'bg-[#001C33] text-white shadow-xs'
                : 'text-[#5A6066] hover:bg-[#EFF4FB]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GIS Sector Map</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSCRIPT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRANSCRIPT'
                ? 'bg-[#001C33] text-white shadow-xs'
                : 'text-[#5A6066] hover:bg-[#EFF4FB]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Caller Transmission & Audio</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        {/* Tab 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex flex-col gap-4">
            {/* Top Split: Evidence Photo & Quick Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Photo Evidence Card */}
              {incident.imageUrl && (
                <div className="md:col-span-5 bg-white p-3 rounded-lg border border-[#CBD5E1] shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#001C33] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <Camera className="w-3.5 h-3.5 text-[#0159C5]" />
                      Citizen Evidence Attachment
                    </span>
                    <button
                      onClick={() => setIsImageModalOpen(true)}
                      className="text-[#0159C5] hover:text-[#001C33] text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>

                  <div
                    onClick={() => setIsImageModalOpen(true)}
                    className="relative w-full h-44 rounded overflow-hidden bg-slate-900 cursor-pointer group"
                  >
                    <img
                      src={incident.imageUrl}
                      alt={incident.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10.5px] px-2 py-0.5 rounded font-mono">
                      LAT {incident.location.lat.toFixed(4)} · VERIFIED GPS
                    </div>
                  </div>
                </div>
              )}

              {/* Caller & Transmission Dossier */}
              <div
                className={`${
                  incident.imageUrl ? 'md:col-span-7' : 'md:col-span-12'
                } bg-white p-3.5 rounded-lg border border-[#CBD5E1] shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-[#0159C5]" />
                      <span className="font-semibold text-[#001C33]">Channel:</span>
                      <span className="font-mono text-[#0159C5] font-bold">{incident.caller.channel}</span>
                    </div>
                    <span className="text-[#5A6066] font-mono">{incident.caller.recordedAt}</span>
                  </div>

                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-[#5A6066] uppercase tracking-wider">
                      Reporting Officer / Citizen:
                    </span>
                    <p className="text-xs font-semibold text-[#001C33]">
                      {incident.caller.name}{' '}
                      <span className="font-normal text-[#5A6066]">({incident.caller.contact})</span>
                    </p>
                  </div>

                  <div className="bg-[#F8F9FF] p-2.5 rounded border border-[#E2E8F0] text-xs leading-relaxed text-[#161C21] font-mono">
                    "{incident.callerTranscript}"
                  </div>
                </div>

                {incident.hasAudio && (
                  <div className="mt-3">
                    <AudioPlayer
                      duration={incident.audioDuration}
                      callerChannel={incident.caller.channel}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Field Units Deployed Table */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0159C5]" />
                  <h3 className="font-heading text-xs font-bold text-[#001C33] uppercase tracking-wider">
                    Assigned Field Units & Tactical Response
                  </h3>
                </div>
                <span className="text-xs text-[#5A6066] font-mono">
                  {incident.assignedUnits.length} Units Active
                </span>
              </div>

              {incident.assignedUnits.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#5A6066]">
                  No field units currently committed. Awaiting dispatcher verification.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#5A6066] uppercase text-[10.5px] font-mono">
                        <th className="pb-1.5 font-semibold">Unit ID</th>
                        <th className="pb-1.5 font-semibold">Agency</th>
                        <th className="pb-1.5 font-semibold">Equipment Type</th>
                        <th className="pb-1.5 font-semibold">ETA</th>
                        <th className="pb-1.5 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {incident.assignedUnits.map((u) => (
                        <tr key={u.unitId} className="hover:bg-[#F8FAFC]">
                          <td className="py-2 font-mono font-bold text-[#001C33]">{u.unitId}</td>
                          <td className="py-2 text-[#161C21]">{u.agency}</td>
                          <td className="py-2 text-[#5A6066]">{u.type}</td>
                          <td className="py-2 font-mono text-[#0159C5] font-semibold tabular-nums">
                            {u.etaMinutes === 0 ? 'On Scene' : `${u.etaMinutes} min`}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold uppercase ${
                                u.status === 'On Scene'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.status === 'En Route'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Operator Notes Box */}
            <div className="bg-white rounded-lg border border-[#CBD5E1] p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#001C33] uppercase tracking-wider font-mono">
                  Municipal Dispatcher Operational Notes:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecordNote}
                    className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isRecordingNote
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-[#EFF4FB] hover:bg-[#E2E8F0] text-[#001C33] border border-[#CBD5E1]'
                    }`}
                    title="Dictate voice note using Gemini 3.5 Transcribe"
                  >
                    {isRecordingNote ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#0159C5]" />}
                    <span>{isRecordingNote ? 'Recording...' : 'Dictate Audio'}</span>
                  </button>

                  <button
                    onClick={handleSaveNotes}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#001C33] hover:bg-[#012745] text-white rounded transition-colors cursor-pointer"
                  >
                    Save Dispatch Notes
                  </button>
                </div>
              </div>

              {isTranscribingNote && (
                <div className="p-2 mb-2 bg-[#EBF3FC] text-[#0159C5] text-xs font-mono flex items-center gap-2 rounded border border-[#BFDBFE]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing field audio via Gemini 3.5 Transcribe...</span>
                </div>
              )}

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log field communications, supervisor instructions, or utility valve tag references..."
                rows={2}
                className="w-full text-xs p-2.5 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-[#001C33] placeholder:text-[#8896A6] focus:border-[#0159C5] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 2: GIS Sector Map */}
        {activeTab === 'MAP' && (
          <div className="flex-1 min-h-[460px] flex flex-col">
            <MunicipalMap
              incidents={allIncidents}
              selectedIncident={incident}
              onSelectIncident={onSelectIncident}
            />
          </div>
        )}

        {/* Tab 3: Detailed Caller Transcript & Audio Analysis */}
        {activeTab === 'TRANSCRIPT' && (
          <div className="bg-white rounded-lg border border-[#CBD5E1] p-4 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-bold text-[#001C33] mb-1">
                  Full 911 / Citizen Transmission Transcript
                </h3>
                <p className="text-xs text-[#5A6066]">
                  Automated transcription logged at {incident.caller.recordedAt} via {incident.caller.channel}.
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EBF3FC] text-[#0159C5] rounded border border-[#BFDBFE] text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini 3.5 Transcribe Grounded</span>
              </div>
            </div>

            <div className="bg-[#F8F9FF] border border-[#CBD5E1] p-3.5 rounded font-mono text-xs leading-relaxed text-[#161C21]">
              <span className="text-[#0159C5] font-bold">[DISPATCH INGEST]:</span> "{incident.callerTranscript}"
            </div>

            {incident.hasAudio && (
              <AudioPlayer
                duration={incident.audioDuration}
                callerChannel={incident.caller.channel}
              />
            )}

            <div className="border-t border-[#E2E8F0] pt-3">
              <h4 className="text-xs font-bold text-[#001C33] mb-2 uppercase tracking-wider font-mono">
                Transcription NLP Keyword Vectors:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {incident.title.split(' ').map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#EFF4FB] border border-[#CBD5E1] text-[#001C33] rounded text-[11px] font-mono"
                  >
                    #{word.toLowerCase().replace(/[^a-z0-9]/g, '')}
                  </span>
                ))}
                <span className="px-2 py-0.5 bg-[#EBF3FC] border border-[#BFDBFE] text-[#0159C5] rounded text-[11px] font-mono font-semibold">
                  #priority-{incident.priority.toLowerCase()}
                </span>
                <span className="px-2 py-0.5 bg-[#EFF4FB] border border-[#CBD5E1] text-[#001C33] rounded text-[11px] font-mono">
                  #muni-code-verified
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* High-Res Image Fullscreen Modal */}
      {isImageModalOpen && incident.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full overflow-hidden border border-[#94A3B8] shadow-2xl">
            <div className="p-3 bg-[#001C33] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#5790FF]" />
                <span className="font-mono text-xs font-bold">{incident.code} · Field Evidence</span>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-white hover:text-amber-300 font-bold text-sm px-2 py-0.5 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 bg-slate-900">
              <img
                src={incident.imageUrl}
                alt={incident.title}
                className="w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            <div className="p-3 bg-[#F8F9FF] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5A6066]">
              <span>Location: {incident.location.address}</span>
              <span className="font-mono">Coordinates: {incident.location.lat}, {incident.location.lng}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
