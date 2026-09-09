"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultLike {
  transcript: string;
  confidence: number;
}

// Minimal shape of the Web Speech API's SpeechRecognition, typed loosely
// since TS lib.dom does not include it in all environments.
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  onerror: ((event: any) => void) | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognitionCtor(): (new () => ISpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => ISpeechRecognition)
    | undefined;
  return ctor ?? null;
}

export function useSpeechRecognition(lang: string = "en-US") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const supported = typeof window !== "undefined" && !!getRecognitionCtor();

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (opts?: { onResult?: (text: string, confidence: number) => void; overrideLang?: string }) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        setError("Trình duyệt không hỗ trợ nhận diện giọng nói.");
        return;
      }
      setError(null);
      setTranscript("");
      const rec = new Ctor();
      rec.lang = opts?.overrideLang ?? lang;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 3;

      rec.onresult = (event) => {
        const results = event.results as unknown as ArrayLike<
          ArrayLike<SpeechRecognitionResultLike>
        >;
        const last = results[results.length - 1];
        const best = last[0];
        setTranscript(best.transcript);
        setConfidence(best.confidence ?? 0);
        opts?.onResult?.(best.transcript, best.confidence ?? 0);
      };
      rec.onerror = (event) => {
        setError(String(event?.error ?? "unknown_error"));
        setListening(false);
      };
      rec.onend = () => setListening(false);
      rec.onstart = () => setListening(true);

      recognitionRef.current = rec;
      rec.start();
    },
    [lang]
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { start, stop, listening, transcript, confidence, error, supported };
}

/** Basic pronunciation-accuracy scoring by comparing recognized text to target word. */
export function scorePronunciation(target: string, heard: string): number {
  const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  const t = norm(target);
  const h = norm(heard);
  if (!h) return 0;
  if (t === h) return 100;

  // Levenshtein distance based similarity
  const a = t.split(" ").join("");
  const b = h.split(" ").join("");
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const dist = dp[a.length][b.length];
  const maxLen = Math.max(a.length, b.length, 1);
  const similarity = Math.max(0, 1 - dist / maxLen);
  return Math.round(similarity * 100);
}
