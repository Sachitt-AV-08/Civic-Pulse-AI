import React, { useState, useEffect } from 'react';
import { Incident } from '../types/incident';
import { ShieldAlert, Radio, Smartphone, Volume2, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { playDispatchAlert, playAcknowledgeBeep } from '../utils/audio';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncident: Incident | null;
  onBroadcastSent: (alertText: string) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  selectedIncident,
  onBroadcastSent,
}) => {
  const [severity, setSeverity] = useState('CRITICAL');
  const [location, setLocation] = useState(
    selectedIncident ? selectedIncident.location.address : 'Downtown Metro Sector 4'
  );
  const [incidentTitle, setIncidentTitle] = useState(
    selectedIncident ? selectedIncident.title : 'Arterial Utility Rupture'
  );
  const [instructions, setInstructions] = useState(
    'Evacuate immediately within 3 blocks. Yield to emergency response apparatus.'
  );

  const [smsAlert, setSmsAlert] = useState('');
  const [radioScript, setRadioScript] = useState('');
  const [publicAdvisory, setPublicAdvisory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSent(false);
      handleGenerateBroadcast();
    }
  }, [isOpen, selectedIncident]);

  if (!isOpen) return null;

  const handleGenerateBroadcast = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentTitle: selectedIncident ? selectedIncident.title : incidentTitle,
          location: selectedIncident ? selectedIncident.location.address : location,
          severity,
          instructions,
        }),
      });

      const data = await response.json();
      if (data.broadcast) {
        setSmsAlert(data.broadcast.smsAlert);
        setRadioScript(data.broadcast.radioScript);
        setPublicAdvisory(data.broadcast.publicAdvisory);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setSmsAlert(
        `CIVIC ALERT [${severity}]: ${selectedIncident?.title || incidentTitle} at ${
          selectedIncident?.location.address || location
        }. Avoid area. Yield to emergency apparatus.`
      );
      setRadioScript(
        `This is the Municipal Emergency Operations Center. An active emergency incident has occurred at ${
          selectedIncident?.location.address || location
        }. Stay clear of the sector.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTransmit = () => {
    playDispatchAlert();
    setIsSent(true);
    onBroadcastSent(smsAlert);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full border border-[#94A3B8] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 bg-[#BA1A1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider">
              Wireless Emergency Alert (WEA) & Civic Radio Broadcast
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Target Incident summary */}
          <div className="p-3 bg-[#FFF7ED] border border-[#FFEDD5] rounded flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#C2410C] font-bold uppercase">
                Incident Target:
              </span>
              <p className="font-bold text-[#001C33] text-xs">
                {selectedIncident ? `${selectedIncident.code} · ${selectedIncident.title}` : incidentTitle}
              </p>
              <p className="text-[11px] text-[#5A6066]">
                📍 {selectedIncident ? selectedIncident.location.address : location} (
                {selectedIncident ? selectedIncident.location.district : 'Sector 4'})
              </p>
            </div>
            <button
              onClick={handleGenerateBroadcast}
              disabled={isGenerating}
              className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] text-[#001C33] rounded text-xs font-semibold hover:bg-[#F1F5F9] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin text-[#0159C5]" /> : null}
              <span>Regenerate with Gemini</span>
            </button>
          </div>

          {/* Citizen Mobile Phone Notification Preview */}
          <div>
            <span className="text-xs font-bold text-[#001C33] uppercase font-mono tracking-wider block mb-1.5">
              📱 Citizen Smartphone Wireless Emergency Alert Preview (WEA):
            </span>
            <div className="max-w-md mx-auto bg-slate-900 rounded-xl p-3 text-white shadow-lg border border-slate-700">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-500" />
                  <span className="font-bold text-red-400 uppercase">Emergency Alert · Extreme</span>
                </div>
                <span>Just Now</span>
              </div>
              <p className="text-xs font-medium text-slate-100 leading-snug font-sans">
                {smsAlert || 'Generating Wireless Emergency Alert text...'}
              </p>
              <div className="mt-2 pt-1 border-t border-slate-800 flex justify-end">
                <span className="text-[10px] font-mono text-slate-400">
                  {smsAlert.length} / 160 chars
                </span>
              </div>
            </div>
          </div>

          {/* Radio Broadcast Script */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Radio className="w-3.5 h-3.5 text-[#0159C5]" />
              <span className="text-xs font-bold text-[#001C33] uppercase font-mono tracking-wider">
                Emergency Radio & Public Address Teleprompter Script (30 Sec):
              </span>
            </div>
            <div className="p-3 bg-[#F8F9FF] border border-[#CBD5E1] rounded font-mono text-xs leading-relaxed text-[#161C21]">
              {radioScript || 'Synthesizing official radio dispatch broadcast script...'}
            </div>
          </div>

          {/* Full Public Advisory Notice */}
          <div>
            <span className="text-xs font-bold text-[#001C33] uppercase font-mono tracking-wider block mb-1.5">
              Detailed Municipal Advisory Notice:
            </span>
            <div className="p-3 bg-white border border-[#CBD5E1] rounded text-xs text-[#5A6066] leading-relaxed">
              {publicAdvisory || 'Compiling official municipal advisory bulletins...'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#F8F9FF] border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-[11px] text-[#5A6066] font-mono">
            Requires Dual Operational Verification
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#5A6066] hover:bg-[#F1F5F9] rounded cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleTransmit}
              disabled={isGenerating || isSent}
              className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                isSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#BA1A1A] hover:bg-[#93000A] text-white'
              }`}
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TRANSMITTED TO CARRIERS</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>AUTHORIZE & TRANSMIT BROADCAST</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
