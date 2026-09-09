"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2, SkipForward, Check, X } from "lucide-react";
import clsx from "clsx";
import type { Flashcard } from "@/types";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { recordReview } from "@/hooks/useFlashcards";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ListeningQuestion({
  order,
  idx,
  total,
  onNext,
}: {
  order: Flashcard[];
  idx: number;
  total: number;
  onNext: () => void;
}) {
  const card = order[idx];
  const { speak } = useTextToSpeech("en-US");
  const [picked, setPicked] = useState<string | null>(null);

  // Recomputed only when idx changes (component remounts via key=idx from parent),
  // so this is a pure derivation rather than a setState-in-effect.
  const choices = useMemo(() => {
    const pool = order.filter((c) => c.id !== card.id);
    const others = shuffle(pool).slice(0, 3);
    return shuffle([card, ...others]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    const t = setTimeout(() => speak(card.word), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const handlePick = (id: string) => {
    if (picked) return;
    setPicked(id);
    recordReview(card.id, id === card.id);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="text-xs text-slate-400 mb-3">
        Câu {idx + 1}/{total}
      </p>

      <button
        onClick={() => speak(card.word)}
        className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg hover:bg-indigo-700"
      >
        <Volume2 size={32} />
      </button>
      <p className="text-xs text-slate-400 mt-2">Nghe và chọn từ đúng</p>

      <div className="grid grid-cols-1 gap-2 mt-6">
        {choices.map((c) => {
          const isCorrect = c.id === card.id;
          const showResult = picked !== null;
          return (
            <button
              key={c.id}
              onClick={() => handlePick(c.id)}
              disabled={!!picked}
              className={clsx(
                "flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors",
                showResult && isCorrect
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : showResult && picked === c.id
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
              )}
            >
              <span>
                {c.word} <span className="text-slate-400 font-normal font-mono">{c.phonetic}</span>
              </span>
              {showResult && isCorrect && <Check size={16} />}
              {showResult && picked === c.id && !isCorrect && <X size={16} />}
            </button>
          );
        })}
      </div>

      {picked && (
        <button
          onClick={onNext}
          className="mt-5 flex items-center gap-1.5 mx-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Câu tiếp theo <SkipForward size={14} />
        </button>
      )}
    </div>
  );
}

export function ListeningPractice({ cards }: { cards: Flashcard[] }) {
  const [order] = useState(() => shuffle(cards));
  const [idx, setIdx] = useState(0);

  const next = () => setIdx((i) => (i + 1) % order.length);

  if (cards.length < 4) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        Cần ít nhất 4 Flashcard để luyện nghe (trắc nghiệm 4 đáp án).
      </div>
    );
  }

  return <ListeningQuestion key={idx} order={order} idx={idx} total={order.length} onNext={next} />;
}
