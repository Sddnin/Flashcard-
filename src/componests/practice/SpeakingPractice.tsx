"use client";

import { useState } from "react";
import { Mic, Volume2, SkipForward, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { Flashcard } from "@/types";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useSpeechRecognition, scorePronunciation } from "@/hooks/useSpeechRecognition";
import { recordReview } from "@/hooks/useFlashcards";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SpeakingPractice({ cards }: { cards: Flashcard[] }) {
  const [order] = useState(() => shuffle(cards));
  const [idx, setIdx] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastHeard, setLastHeard] = useState("");
  const { speak } = useTextToSpeech("en-US");
  const { start, listening, supported, error } = useSpeechRecognition("en-US");

  const card = order[idx];

  const scoreColor = (s: number) =>
    s >= 85 ? "text-emerald-600 bg-emerald-50" : s >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  const handleRecord = () => {
    if (!card) return;
    setLastScore(null);
    start({
      onResult: (text) => {
        const s = scorePronunciation(card.word, text);
        setLastHeard(text);
        setLastScore(s);
        recordReview(card.id, s >= 70);
      },
    });
  };

  const next = () => {
    setLastScore(null);
    setLastHeard("");
    setIdx((i) => (i + 1) % order.length);
  };

  if (cards.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Chưa có Flashcard để luyện nói.</div>;
  }

  if (!supported) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm px-6">
        Trình duyệt hiện tại không hỗ trợ nhận diện giọng nói (SpeechRecognition). Hãy thử Chrome trên máy tính hoặc Android.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="text-xs text-slate-400 mb-1">
        Từ {idx + 1}/{order.length}
      </p>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-500 mb-3">
          {card.level}
        </span>
        <h2 className="text-3xl font-bold text-slate-800">{card.word}</h2>
        <p className="text-slate-400 font-mono mt-1">{card.phonetic}</p>
        <p className="text-slate-500 text-sm mt-1">{card.meaningVi}</p>

        <button
          onClick={() => speak(card.word)}
          className="mt-4 w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto hover:bg-indigo-100"
        >
          <Volume2 size={20} />
        </button>

        <button
          onClick={handleRecord}
          disabled={listening}
          className={clsx(
            "mt-6 w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors",
            listening ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-white hover:bg-slate-700"
          )}
        >
          <Mic size={30} />
        </button>
        <p className="text-xs text-slate-400 mt-2">{listening ? "Đang nghe..." : "Nhấn để nói từ này"}</p>

        {error && <p className="text-xs text-red-500 mt-2">Lỗi: {error}</p>}

        {lastScore !== null && (
          <div className="mt-5 space-y-1">
            <div className={clsx("inline-block px-4 py-1.5 rounded-full text-sm font-bold", scoreColor(lastScore))}>
              Độ chính xác: {lastScore}%
            </div>
            <p className="text-xs text-slate-400">Bạn nói: &quot;{lastHeard}&quot;</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 mt-5">
        <button
          onClick={handleRecord}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
        <button
          onClick={next}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Từ tiếp theo <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
}
