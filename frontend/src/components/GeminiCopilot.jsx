import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";

function stamp(value = "") {
  return String(value).trim();
}

export function GeminiCopilot({ isOpen, onClose, currentIncident }) {
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Civic Guard AI is online. Tune Search or Maps grounding on, use voice input, and query the active incident.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      groundingType: "none",
      groundingChunks: []
    }
  ]);
  const [input, setInput] = useState("");
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy, transcribing]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 70);
  }, [isOpen]);

  if (!isOpen) return null;

  const speakText = async (text) => {
    const plain = text.replace(/[*#_`>]/g, "").slice(0, 300);
    try {
      const result = await api.tts({ text: plain });
      if (result?.success && result.audioDataUrl) {
        const audio = new Audio(result.audioDataUrl);
        audio.play().catch(() => {});
        return;
      }
    } catch {
      /* fall back to browser speech */
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(plain);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSearch = () => {
    if (useMaps) setUseMaps(false);
    setUseSearch((value) => !value);
  };

  const toggleMaps = () => {
    if (useSearch) setUseSearch(false);
    setUseMaps((value) => !value);
  };

  const sendMessage = async (override) => {
    const text = stamp(override || input);
    if (!text || busy) return;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true);
    try {
      const result = await api.chatAI({
        messages: [{ role: "user", content: text }],
        useGoogleSearch: useSearch,
        useGoogleMaps: useMaps,
        userLocation: currentIncident?.location
          ? { latitude: currentIncident.location.lat, longitude: currentIncident.location.lng }
          : { latitude: 12.9784, longitude: 77.6408 },
        incidentContext: currentIncident
      });
      const answer = result.reply || "Operational transmission received. Standby for field telemetry.";
      setMessages((prev) => [...prev, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        groundingType: result.groundingType || "none",
        groundingChunks: Array.isArray(result.groundingChunks) ? result.groundingChunks : [],
        webQueries: Array.isArray(result.webSearchQueries) ? result.webSearchQueries : []
      }]);
      if (autoSpeak) speakText(answer);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content: `Copilot request failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } finally {
      setBusy(false);
    }
  };

  const appendTranscript = (text) => {
    if (!text) return;
    setInput((prev) => prev ? `${prev} ${text}` : text);
  };

  const processAudio = async (blob) => {
    const audioData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const result = await api.transcribeAudio({ audioData, mimeType: "audio/webm", context: currentIncident?.title || "Civic dispatch" });
    appendTranscript(result.transcription);
    setMessages((prev) => [...prev, {
      id: `transcript-${Date.now()}`,
      role: "assistant",
      content: `Voice transcript received: ${result.transcription}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return alert("Voice capture is not available in this browser.");
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      setIsRecording(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) appendTranscript(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.start();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        processAudio(blob).catch((err) => {
          setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: `Voice transcription failed: ${err.message}`, timestamp: timeNow() }]);
        });
      };
      recorder.start();
      setRecordingTime(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => setRecordingTime((value) => value + 1), 1000);
    } catch (err) {
      alert(`Voice capture failed: ${err.message}`);
    }
  };

  const citationList = Array.from(new Set((messages.at(-1)?.groundingChunks || [])
    .map((item) => item?.maps || item?.web)
    .filter(Boolean)
    .map((item) => `${item.title || "Place"}|${item.uri || "#"}`)))
    .map((item) => {
      const [title, uri] = item.split("|");
      return { title, uri };
    });

  return (
    <aside className="fixed bottom-0 right-0 top-12 z-50 flex w-full max-w-[520px] flex-col border-l border-outline-variant bg-surface-container-lowest shadow-2xl sm:w-[500px]">
      <div className="flex items-center justify-between gap-space-sm bg-primary-container px-space-md py-space-sm text-on-primary">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[24px]">shield</span>
          <div>
            <div className="font-headline-sm font-bold">Civic Guard AI</div>
            <p className="font-label-sm text-primary-fixed-dim">Voice, Google Search, and dispatch guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-space-xs">
          <button onClick={onClose} className="rounded p-2 text-primary-fixed-dim hover:bg-primary-container hover:text-on-primary" title="Close copilot">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant bg-surface-container-low px-space-md py-space-sm">
        <div className="flex flex-wrap gap-space-xs">
          <button type="button" onClick={toggleSearch} className={`inline-flex items-center gap-space-xs rounded-full px-space-sm py-1 font-label-sm font-semibold ${useSearch ? "bg-secondary text-on-secondary" : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-[15px]">public</span>
            Google Search
          </button>
          <button type="button" onClick={toggleMaps} className={`inline-flex items-center gap-space-xs rounded-full px-space-sm py-1 font-label-sm font-semibold ${useMaps ? "bg-secondary text-on-secondary" : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-[15px]">map</span>
            Google Maps
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-space-xs font-label-sm text-on-surface-variant">
          <input type="checkbox" checked={autoSpeak} onChange={(event) => setAutoSpeak(event.target.checked)} className="h-4 w-4 rounded border-outline-variant" />
          Auto voice
        </label>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-space-md">
        {messages.map((message) => (
          <div key={message.id} className={`mb-space-md flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
            <div className="mb-1 font-label-sm text-on-surface-variant">
              {message.role === "assistant" ? "Civic Guard" : "Dispatcher"} • {message.timestamp}
              {message.groundingType && message.groundingType !== "none" ? ` • ${message.groundingType}` : ""}
            </div>
            <div className={`max-w-[88%] rounded-2xl px-space-md py-space-sm shadow-sm ${message.role === "user" ? "bg-secondary text-on-secondary rounded-tr-md" : "bg-surface-container-low border border-outline-variant text-on-surface rounded-tl-md"}`}>
              <div className="whitespace-pre-wrap font-body-md">{message.content}</div>
            </div>
            {message.role === "assistant" && (
              <button type="button" onClick={() => speakText(message.content)} className="mt-1 inline-flex items-center gap-space-xs font-label-sm text-secondary hover:underline">
                <span className="material-symbols-outlined text-[14px]">volume_up</span>
                Read aloud
              </button>
            )}
          </div>
        ))}
        <div className="flex max-h-52 flex-col gap-space-sm overflow-y-auto pr-1">
          {citationList.map((item, index) => (
            <a key={index} href={item.uri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-label-sm text-on-surface-variant hover:text-secondary">
              <span className="material-symbols-outlined text-[13px]">{item.uri.includes("maps.google") ? "map" : "public"}</span>
              {item.title}
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant bg-surface-container-lowest p-space-md">
        {recording && (
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-error-container text-on-error-container px-space-sm py-1 font-label-sm font-semibold">
            <span className="material-symbols-outlined animate-pulse text-[15px]">mic</span>
            Recording voice command... {seconds}s
          </div>
        )}
        {transcribing && (
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed px-space-sm py-1 font-label-sm font-semibold">
            <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
            Transcribing recording...
          </div>
        )}
        <div className="flex items-end gap-space-sm">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${recording ? "bg-error text-on-error" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
          >
            <span className="material-symbols-outlined">{recording ? "stop" : "mic"}</span>
          </button>
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask for route guidance, facility locations, citizen-facing language, or tactical support..."
            className="min-h-[48px] flex-1 resize-none rounded bg-surface-container-lowest border border-outline-variant px-space-sm py-space-xs text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || busy}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-space-md text-on-secondary font-label-md font-semibold shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
