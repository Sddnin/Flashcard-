"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import clsx from "clsx";
import type { Flashcard } from "@/types";
import { recordReview } from "@/hooks/useFlashcards";

interface Props {
  cards: Flashcard[];
  direction: "en-vi" | "vi-en";
}

interface Item {
  id: string; // cardId
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle right column such that no item ends up on the same row index as its pair on the left. */
function shuffleNoSameRow(pairs: Item[]): Item[] {
  const n = pairs.length;
  if (n <= 1) return [...pairs];
  let attempt = shuffle(pairs);
  let tries = 0;
  while (attempt.some((item, i) => item.id === pairs[i].id) && tries < 50) {
    attempt = shuffle(pairs);
    tries++;
  }
  // fallback: rotate by 1 if still colliding (guarantees no fixed point for n>1)
  if (attempt.some((item, i) => item.id === pairs[i].id)) {
    attempt = pairs.map((_, i) => pairs[(i + 1) % n]);
  }
  return attempt;
}

const ROUND_SIZE = 6;

function MatchingRound({ cards, direction, onNewRound }: Props & { onNewRound: () => void }) {
  // Computed once per mount (parent remounts this via key={round}), so plain
  // useMemo is a pure derivation rather than a setState-in-effect.
  const pool = useMemo(() => shuffle(cards).slice(0, Math.min(ROUND_SIZE, cards.length)), [cards]);

  const leftItems: Item[] = useMemo(
    () => pool.map((c) => ({ id: c.id, text: direction === "en-vi" ? c.word : c.meaningVi })),
    [pool, direction]
  );
  const rightItems: Item[] = useMemo(() => {
    const right: Item[] = pool.map((c) => ({
      id: c.id,
      text: direction === "en-vi" ? c.meaningVi : c.word,
    }));
    return shuffleNoSameRow(right);
  }, [pool, direction]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const handleLeftClick = (id: string) => {
    if (matched.has(id)) return;
    setSelectedLeft(id);
    setWrongPair(null);
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft || matched.has(rightId)) return;
    setAttempts((a) => a + 1);
    if (selectedLeft === rightId) {
      const next = new Set(matched);
      next.add(rightId);
      setMatched(next);
      setCorrectCount((c) => c + 1);
      recordReview(rightId, true);
      setSelectedLeft(null);
    } else {
      setWrongPair({ left: selectedLeft, right: rightId });
      recordReview(selectedLeft, false);
      setTimeout(() => setWrongPair(null), 500);
    }
  };

  const allMatched = pool.length > 0 && matched.size === pool.length;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Đúng {correctCount}/{pool.length} · {attempts} lượt thử
        </p>
        <button
          onClick={onNewRound}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw size={13} /> Ván mới
        </button>
      </div>

      {allMatched ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check size={28} />
          </div>
          <p className="font-semibold text-slate-800">Hoàn thành!</p>
          <p className="text-sm text-slate-500 mt-1">
            Bạn đã nối đúng {correctCount}/{pool.length} cặp.
          </p>
          <button onClick={onNewRound} className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            Chơi ván khác
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {leftItems.map((item) => (
              <button
                key={item.id}
                disabled={matched.has(item.id)}
                onClick={() => handleLeftClick(item.id)}
                className={clsx(
                  "w-full text-left px-3.5 py-3 rounded-xl border text-sm font-medium transition-all",
                  matched.has(item.id)
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 opacity-60"
                    : selectedLeft === item.id
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : wrongPair?.left === item.id
                    ? "bg-red-100 border-red-300 text-red-600 animate-pulse"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                )}
              >
                {item.text}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {rightItems.map((item) => (
              <button
                key={item.id}
                disabled={matched.has(item.id)}
                onClick={() => handleRightClick(item.id)}
                className={clsx(
                  "w-full text-left px-3.5 py-3 rounded-xl border text-sm font-medium transition-all",
                  matched.has(item.id)
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 opacity-60"
                    : wrongPair?.right === item.id
                    ? "bg-red-100 border-red-300 text-red-600 animate-pulse"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                )}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MatchingGame({ cards, direction }: Props) {
  const [round, setRound] = useState(0);

  if (cards.length < 2) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        Cần ít nhất 2 Flashcard để chơi nối từ. Hãy thêm từ vựng trước nhé!
      </div>
    );
  }

  return (
    <MatchingRound
      key={`${round}-${direction}`}
      cards={cards}
      direction={direction}
      onNewRound={() => setRound((r) => r + 1)}
    />
  );
}
