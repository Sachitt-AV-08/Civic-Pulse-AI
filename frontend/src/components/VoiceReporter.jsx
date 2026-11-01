import React, { useState } from "react";
import { api } from "../api";

export default function VoiceReporter({ value = "", onTranscript }) {
  const [status, setStatus] = useState("Voice draft: idle.");
  const [recording, setRecording] = useState(false);
  const recorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const streamRef = React.useRef(null);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      try { if (timerRef.current) window.clearInterval(timerRef.current); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((track) => {
        try { track.stop(); } catch { /* ignore */ }
      });
      try { if (recorderRef.current?.state && recorderRef.current.state !== "inactive") recorderRef.current.stop(); } catch { /* ignore */ }
    };
  }, []);

  const appendText = (text) => {
    const nextText = String(text || "").trim();
    if (!nextText) return;
    const updated = value?.trim() ? `${value.trim()} ${nextText}` : nextText;
    onTranscript(updated);
    setStatus(`Voice draft appended: ${nextText.length} characters transcribed.`);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus("Voice recording is unavailable in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
// busy state removed
        setStatus("Transcribing recording...");
        try {
          const audioData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const result = await api.transcribeAudio({ audioData, mimeType: "audio/webm", context: "Civic issue report" });
          appendText(result.transcription);
        } catch (err) {
          setStatus(`Voice transcription failed: ${err.message}`);
        } finally {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          stream.getTracks().forEach((track) => track.stop());
          setRecording(false);
        }
      };
      recorder.start();
      setRecording(true);
      setStatus("Recording voice report. Press stop when finished.");
      timerRef.current = window.setInterval(() => setRecording(true), 100000);
    } catch (err) {
      setStatus(`Microphone access denied or unavailable: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="rounded-xl bg-surface-container-low border border-outline-variant p-space-md">
      <div className="flex flex-col gap-space-sm">
        <div>
          <div className="font-title-md text-on-surface">Voice report intake</div>
          <p className="font-body-sm text-on-surface-variant">{status}</p>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex h-10 items-center gap-1.5 rounded bg-secondary text-on-secondary px-space-md font-label-md font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              Record voice
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex h-10 items-center gap-1.5 rounded bg-error text-on-error px-space-md font-label-md font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">stop</span>
              Stop recording
            </button>
          )}
        </div>
        <p className="font-body-sm text-on-surface-variant">
          Voice transcripts are appended as a draft. Review the recognized text before submitting.
        </p>
      </div>
    </div>
  );
}
EOF