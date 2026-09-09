"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { useSettingsStore } from "@/lib/settingsStore";
import { MicStreamer, PcmPlayer } from "@/lib/liveAudio";
import { pickAvailableKey } from "@/lib/gemini";

export type CallStatus = "idle" | "connecting" | "connected" | "error" | "ended";

interface TranscriptLine {
  role: "user" | "model";
  text: string;
  final: boolean;
}

export function useLiveCall() {
  const { geminiKeys, liveModel, markKeyUsed, markKeyFailed } = useSettingsStore();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userLevel, setUserLevel] = useState(0);

  const sessionRef = useRef<Session | null>(null);
  const micRef = useRef<MicStreamer | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const currentUserLineRef = useRef("");
  const currentModelLineRef = useRef("");
  const meterRafRef = useRef<number | null>(null);

  const appendOrUpdateLine = (role: "user" | "model", text: string, final: boolean) => {
    setTranscript((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      if (lastIdx >= 0 && next[lastIdx].role === role && !next[lastIdx].final) {
        next[lastIdx] = { role, text, final };
      } else {
        next.push({ role, text, final });
      }
      return next;
    });
  };

  const stopMeter = () => {
    if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = null;
    setUserLevel(0);
  };

  const startMeter = () => {
    const loop = () => {
      const analyser = micRef.current?.analyser;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setUserLevel(Math.min(1, avg / 100));
      }
      meterRafRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    currentUserLineRef.current = "";
    currentModelLineRef.current = "";
    setStatus("connecting");

    const keySlot = pickAvailableKey(geminiKeys);
    if (!keySlot) {
      setError("Không có Gemini API key khả dụng. Vào Cài đặt để nhập key.");
      setStatus("error");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: keySlot.key });
      playerRef.current = new PcmPlayer(setAiSpeaking);

      const session = await ai.live.connect({
        model: liveModel,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            "Bạn là giáo viên tiếng Anh AI, nói chuyện trực tiếp bằng giọng nói với người học Việt Nam để luyện phản xạ nghe nói. Nói tiếng Anh rõ ràng, tốc độ vừa phải, có thể chêm giải thích tiếng Việt ngắn khi người học có vẻ không hiểu. Giữ câu trả lời ngắn gọn, mang tính hội thoại tự nhiên.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            markKeyUsed(keySlot.id);
            setStatus("connected");
          },
          onmessage: (msg) => {
            const sc = msg.serverContent;
            if (!sc) return;

            if (sc.interrupted) {
              playerRef.current?.reset();
            }

            const parts = sc.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playerRef.current?.playChunk(part.inlineData.data);
              }
            }

            if (sc.inputTranscription?.text) {
              currentUserLineRef.current += sc.inputTranscription.text;
              appendOrUpdateLine("user", currentUserLineRef.current, false);
            }
            if (sc.outputTranscription?.text) {
              currentModelLineRef.current += sc.outputTranscription.text;
              appendOrUpdateLine("model", currentModelLineRef.current, false);
            }
            if (sc.turnComplete) {
              if (currentUserLineRef.current) appendOrUpdateLine("user", currentUserLineRef.current, true);
              if (currentModelLineRef.current) appendOrUpdateLine("model", currentModelLineRef.current, true);
              currentUserLineRef.current = "";
              currentModelLineRef.current = "";
            }
          },
          onerror: () => {
            markKeyFailed(keySlot.id, 60_000);
            setError("Kết nối tới Gemini Live bị lỗi. Vui lòng thử lại.");
            setStatus("error");
          },
          onclose: () => {
            setStatus((s) => (s === "connected" ? "ended" : s));
          },
        },
      });

      sessionRef.current = session;

      const mic = new MicStreamer((base64Chunk) => {
        session.sendRealtimeInput({
          media: { data: base64Chunk, mimeType: "audio/pcm;rate=16000" },
        });
      });
      micRef.current = mic;
      await mic.start();
      startMeter();
    } catch (e) {
      markKeyFailed(keySlot.id, 60_000);
      setError((e as Error).message || "Không thể kết nối tới Gemini Live.");
      setStatus("error");
    }
  }, [geminiKeys, liveModel, markKeyUsed, markKeyFailed]);

  const stop = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    stopMeter();
    sessionRef.current?.close();
    sessionRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    setStatus("ended");
    setAiSpeaking(false);
  }, []);

  return { status, error, transcript, aiSpeaking, userLevel, start, stop };
}
