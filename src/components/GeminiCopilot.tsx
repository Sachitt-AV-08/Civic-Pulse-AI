import React, { useState, useRef, useEffect } from 'react';
import { Incident } from '../types/incident';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Globe,
  MapPin,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Loader2,
  X,
  FileText,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { playAcknowledgeBeep } from '../utils/audio';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundingType?: 'search' | 'maps' | 'none';
  groundingChunks?: any[];
  audioUrl?: string;
}

interface GeminiCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncident: Incident | null;
  onLocatePinOnMap?: (lat: number, lng: number, title: string) => void;
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  isOpen,
  onClose,
  currentIncident,
  onLocatePinOnMap,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '**Civic Guard AI Municipal Dispatch online.** I am grounded in Ward 112 municipal statutory codes, emergency response protocols, Google Search live data, and Google Maps geospatial intelligence.\n\nHow can I assist your dispatch team with tactical coordination, route hazards, or incident analysis?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleToggleSearch = () => {
    const next = !useGoogleSearch;
    setUseGoogleSearch(next);
    if (next) setUseGoogleMaps(false); // Can't combine search & maps per Gemini API rule
  };

  const handleToggleMaps = () => {
    const next = !useGoogleMaps;
    setUseGoogleMaps(next);
    if (next) setUseGoogleSearch(false); // Can't combine search & maps per Gemini API rule
  };

  const speakText = async (text: string) => {
    try {
      // Clean markdown tags for clear speech
      const plainText = text.replace(/[*#_`>]/g, '').slice(0, 300);

      // Try server-side Gemini TTS
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText }),
      });
      const data = await res.json();

      if (data.success && data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.play();
        return;
      }
    } catch (e) {
      // Fallback to Web Speech API
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`>]/g, ''));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .slice(-6)
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
      history.push({ role: 'user', content: textToSend });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          useGoogleSearch,
          useGoogleMaps,
          userLocation: currentIncident
            ? { latitude: currentIncident.location.lat, longitude: currentIncident.location.lng }
            : { latitude: 47.6062, longitude: -122.3321 },
          incidentContext: currentIncident
            ? {
                code: currentIncident.code,
                title: currentIncident.title,
                category: currentIncident.category,
                priority: currentIncident.priority,
                priorityLabel: currentIncident.priorityLabel,
                location: currentIncident.location,
                primaryAgency: currentIncident.primaryAgency,
                municipalCode: currentIncident.municipalCode,
              }
            : null,
        }),
      });

      const data = await response.json();
      const assistantMsg: Message = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Operational update received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingType: data.groundingType,
        groundingChunks: data.groundingChunks || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      playAcknowledgeBeep();

      if (autoSpeak) {
        speakText(assistantMsg.content);
      }
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'Network connection to municipal dispatch model delayed. Standby while telemetry retries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording and Speech-to-Text via Gemini 3.5 Transcribe
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Fallback speech recognition via Web Speech API if getUserMedia fails
      startWebSpeechRecognition();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const startWebSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech-to-text recognition not supported in this environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setIsRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const processAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Audio,
            mimeType: 'audio/webm',
            context: currentIncident ? currentIncident.title : 'Dispatch Operations',
          }),
        });
        const data = await res.json();
        if (data.transcription) {
          setInput((prev) => (prev ? `${prev} ${data.transcription}` : data.transcription));
        }
        setIsTranscribing(false);
      };
    } catch (e) {
      console.error(e);
      setIsTranscribing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed bottom-0 right-0 top-12 z-50 w-full sm:w-[480px] bg-white border-l border-[#CBD5E1] shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 bg-[#001C33] text-white border-b border-[#012745] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#0159C5] flex items-center justify-center text-white shadow-inner">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-bold tracking-tight">Civic Guard AI</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#5790FF]/20 text-[#9BBFF4] rounded border border-[#5790FF]/30 font-semibold">
                Municipal Copilot
              </span>
            </div>
            <p className="text-[11px] text-[#A5C0DD]">
              Voice Radio · Google Search Grounded · Google Maps Grounded
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#A5C0DD] hover:text-white hover:bg-[#012745] transition-colors cursor-pointer"
          title="Close Copilot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grounding & Voice Tools Bar */}
      <div className="px-3 py-2 bg-[#F8F9FF] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Google Search Toggle */}
          <button
            onClick={handleToggleSearch}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              useGoogleSearch
                ? 'bg-[#0159C5] text-white border-[#0159C5] shadow-2xs'
                : 'bg-white text-[#5A6066] border-[#CBD5E1] hover:bg-[#EFF4FB]'
            }`}
            title="Ground AI responses in real-time Google Search data"
          >
            <Globe className="w-3.5 h-3.5 text-current" />
            <span>Google Search</span>
          </button>

          {/* Google Maps Toggle */}
          <button
            onClick={handleToggleMaps}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              useGoogleMaps
                ? 'bg-[#001C33] text-white border-[#001C33] shadow-2xs'
                : 'bg-white text-[#5A6066] border-[#CBD5E1] hover:bg-[#EFF4FB]'
            }`}
            title="Ground AI responses in real-time Google Maps geospatial places"
          >
            <MapPin className="w-3.5 h-3.5 text-current" />
            <span>Google Maps</span>
          </button>
        </div>

        {/* Voice Auto-Read Toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
            autoSpeak ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-[#5A6066] hover:bg-[#EFF4FB]'
          }`}
          title="Toggle auto voice readout for radio dispatch"
        >
          {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{autoSpeak ? 'Voice Radio: ON' : 'Voice: Muted'}</span>
        </button>
      </div>

      {/* Incident Context Banner */}
      {currentIncident && (
        <div className="px-3.5 py-2 bg-[#EFF4FB] border-b border-[#CBD5E1] text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10.5px] font-bold text-[#0159C5] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              ACTIVE INCIDENT: {currentIncident.code}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold px-1 rounded bg-white text-[#001C33] border border-[#CBD5E1]">
              {currentIncident.priority}
            </span>
          </div>
          <p className="text-[11px] text-[#161C21] truncate font-medium">{currentIncident.title}</p>

          {/* Quick Context Prompt Chips */}
          <div className="flex flex-wrap gap-1 mt-2">
            <button
              onClick={() => {
                setUseGoogleMaps(true);
                setUseGoogleSearch(false);
                handleSend(
                  `Find the nearest trauma centers, emergency staging zones, and fire stations near ${currentIncident.location.address} using Google Maps.`
                );
              }}
              className="text-[10.5px] px-2 py-0.5 bg-white hover:bg-[#001C33] text-[#001C33] hover:text-white border border-[#CBD5E1] rounded transition-all cursor-pointer font-medium"
            >
              📍 Nearest Trauma Centers (Maps)
            </button>
            <button
              onClick={() => {
                setUseGoogleSearch(true);
                setUseGoogleMaps(false);
                handleSend(
                  `Check current weather advisories, flash flooding, and traffic road closures near ${currentIncident.location.address} using Google Search.`
                );
              }}
              className="text-[10.5px] px-2 py-0.5 bg-white hover:bg-[#0159C5] text-[#001C33] hover:text-white border border-[#CBD5E1] rounded transition-all cursor-pointer font-medium"
            >
              🌐 Weather & Road Closures (Search)
            </button>
            <button
              onClick={() =>
                handleSend(
                  `Evaluate secondary hazard cascade risks and municipal statutory liability under ${currentIncident.municipalCode} for this incident.`
                )
              }
              className="text-[10.5px] px-2 py-0.5 bg-white hover:bg-[#001C33] text-[#001C33] hover:text-white border border-[#CBD5E1] rounded transition-all cursor-pointer font-medium"
            >
              ⚖️ Secondary Hazards & Liability
            </button>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#F8F9FF]">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-[#5A6066] mb-1 px-1 font-mono">
                <span>{isUser ? 'DISPATCHER OPERATOR' : 'GEMINI COPILOT'}</span>
                <span>·</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] ${
                  isUser
                    ? 'bg-[#001C33] text-white rounded-br-none shadow-xs'
                    : 'bg-white text-[#161C21] border border-[#CBD5E1] rounded-bl-none shadow-xs'
                }`}
              >
                {/* Message Body with clean styling */}
                <div className="whitespace-pre-line space-y-1">
                  {m.content.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? (
                          <strong key={cIdx} className="font-bold text-current">
                            {chunk}
                          </strong>
                        ) : (
                          chunk
                        )
                      )}
                    </p>
                  ))}
                </div>

                {/* Grounding Source Attribution Chunks */}
                {m.groundingChunks && m.groundingChunks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5A6066] flex items-center gap-1">
                      {m.groundingType === 'maps' ? (
                        <>
                          <MapPin className="w-3 h-3 text-[#0159C5]" />
                          Google Maps Verified Places:
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-[#0159C5]" />
                          Google Search Grounding Sources:
                        </>
                      )}
                    </span>

                    <div className="flex flex-col gap-1">
                      {m.groundingChunks.map((chunk, cIdx) => {
                        const web = chunk.web;
                        const maps = chunk.maps;

                        if (maps) {
                          return (
                            <a
                              key={cIdx}
                              href={maps.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] p-1.5 bg-[#EFF4FB] hover:bg-[#EBF3FC] text-[#0159C5] border border-[#BFDBFE] rounded flex items-center justify-between transition-colors font-medium group"
                            >
                              <span className="truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {maps.title || 'View Location on Google Maps'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1" />
                            </a>
                          );
                        }

                        if (web) {
                          return (
                            <a
                              key={cIdx}
                              href={web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] p-1.5 bg-[#EFF4FB] hover:bg-[#EBF3FC] text-[#0159C5] border border-[#BFDBFE] rounded flex items-center justify-between transition-colors font-medium group"
                            >
                              <span className="truncate flex items-center gap-1">
                                <Globe className="w-3 h-3 flex-shrink-0" />
                                {web.title || web.uri}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1" />
                            </a>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Assistant Audio Action Button */}
                {!isUser && (
                  <div className="mt-2 pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between">
                    <button
                      onClick={() => speakText(m.content)}
                      className="text-[10px] text-[#5A6066] hover:text-[#0159C5] flex items-center gap-1 transition-colors cursor-pointer font-mono"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Speak Aloud</span>
                    </button>
                    <span className="text-[9.5px] text-[#8896A6] font-mono">Civic Pulse Verified</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#CBD5E1] text-xs text-[#5A6066]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0159C5]" />
            <span>
              {useGoogleMaps
                ? 'Querying real-time Google Maps geospatial places...'
                : useGoogleSearch
                ? 'Synthesizing live Google Search intelligence...'
                : 'Evaluating tactical dispatch procedures...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Banner */}
      {isRecording && (
        <div className="p-2.5 bg-red-600 text-white flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span className="font-bold uppercase font-mono">
              Recording Dispatch Transmission ({recordingSeconds}s)...
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="px-2 py-0.5 bg-white text-red-600 rounded font-bold text-[11px] cursor-pointer"
          >
            Finish & Transcribe
          </button>
        </div>
      )}

      {isTranscribing && (
        <div className="p-2 bg-[#EBF3FC] text-[#0159C5] flex items-center gap-2 text-xs font-mono font-medium border-t border-[#BFDBFE]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Transcribing audio stream via Gemini 3.5 Transcribe...</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-[#CBD5E1]">
        <div className="flex items-end gap-2">
          {/* Push to Talk Microphone */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#EFF4FB] text-[#001C33] hover:bg-[#E2E8F0]'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak / Transcribe Audio (Gemini 3.5)'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              useGoogleMaps
                ? 'Ask for locations, hospitals, or facilities with Google Maps...'
                : useGoogleSearch
                ? 'Ask about live weather, road news with Google Search...'
                : 'Ask Gemini Copilot or use microphone...'
            }
            rows={2}
            className="flex-1 p-2 bg-[#F8F9FF] border border-[#CBD5E1] rounded text-xs text-[#001C33] focus:border-[#0159C5] focus:outline-none resize-none"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded bg-[#001C33] hover:bg-[#012745] disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Send Transmission"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] text-[#5A6066]">
          <span className="font-mono">Enter to Send · Shift+Enter for new line</span>
          <span className="flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-[#0159C5]" />
            Powered by Gemini 3.8
          </span>
        </div>
      </div>
    </aside>
  );
};
