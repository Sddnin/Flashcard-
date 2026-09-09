"use client";

import { useMemo, useState } from "react";
import { Check, RefreshCw, SkipForward, Volume2 } from "lucide-react";
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

function tokenize(sentence: string): string[] {
  return sentence
    .trim()
    .replace(/[.!?]$/, "")
    .split(/\s+/);
}

interface Question {
  cardId: string;
  correctTokens: string[];
  vi: string;
}

interface Tok {
  id: number;
  text: string;
}

function SentenceQuestion({
  q,
  idx,
  total,
  onNext,
}: {
  q: Question;
  idx: number;
  total: number;
  onNext: () => void;
}) {
  // Pure derivation from q — this component remounts (key={idx}) each time
  // the question changes, so useState's initializer re-runs cleanly.
  const [pool, setPool] = useState<Tok[]>(() => shuffle(q.correctTokens.map((t, i) => ({ id: i, text: t }))));
  const [placed, setPlaced] = useState<Tok[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const { speak } = useTextToSpeech("en-US");

  const fullSentence = q.correctTokens.join(" ") + ".";

  const addToken = (tok: Tok) => {
    if (checked) return;
    setPlaced((p) => [...p, tok]);
    setPool((p) => p.filter((t) => t.id !== tok.id));
  };
  const removeToken = (tok: Tok) => {
    if (checked) return;
    setPool((p) => [...p, tok]);
    setPlaced((p) => p.filter((t) => t.id !== tok.id));
  };

  const checkAnswer = () => {
    const isCorrect = placed.every((t, i) => t.text === q.correctTokens[i]) && placed.length === q.correctTokens.length;
    setChecked(isCorrect);
    recordReview(q.cardId, isCorrect);
  };

  const shuffleAgain = () => {
    setPool(shuffle(q.correctTokens.map((t, i) => ({ id: i, text: t }))));
    setPlaced([]);
    setChecked(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <p className="text-xs text-slate-400 text-center mb-3">
        Câu {idx + 1}/{total}
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">Sắp xếp các từ thành câu đúng:</p>
          <button onClick={() => speak(fullSentence)} className="text-indigo-500">
            <Volume2 size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-400 italic mb-4">{q.vi}</p>

        {/* answer slot */}
        <div className="min-h-[52px] flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 mb-4">
          {placed.length === 0 && <span className="text-xs text-slate-300">Chạm vào từ bên dưới để thêm vào đây</span>}
          {placed.map((t) => (
            <button
              key={t.id}
              onClick={() => removeToken(t)}
              disabled={!!checked}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
              {t.text}
            </button>
          ))}
        </div>

        {/* word bank */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pool.map((t) => (
            <button
              key={t.id}
              onClick={() => addToken(t)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-indigo-300"
            >
              {t.text}
            </button>
          ))}
        </div>

        {checked !== null && (
          <div
            className={clsx(
              "rounded-xl p-3 text-sm mb-3",
              checked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            )}
          >
            {checked ? (
              "Chính xác! 🎉"
            ) : (
              <>
                Chưa đúng. Câu đúng là: <span className="font-medium">{fullSentence}</span>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {checked === null ? (
            <button
              onClick={checkAnswer}
              disabled={pool.length > 0}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Check size={15} /> Kiểm tra
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-1.5"
            >
              Câu tiếp theo <SkipForward size={15} />
            </button>
          )}
          <button
            onClick={shuffleAgain}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SentenceOrderPractice({ cards }: { cards: Flashcard[] }) {
  const questions: Question[] = useMemo(() => {
    const withExamples = cards.filter((c) => c.examples.length > 0 && tokenize(c.examples[0].en).length >= 3);
    return shuffle(withExamples).map((c) => ({
      cardId: c.id,
      correctTokens: tokenize(c.examples[0].en),
      vi: c.examples[0].vi,
    }));
  }, [cards]);

  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % questions.length);

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm px-6">
        Cần Flashcard có câu ví dụ (từ 3 từ trở lên) để luyện xếp câu. Hãy dùng AI để tạo thêm từ vựng có ví dụ nhé!
      </div>
    );
  }

  const q = questions[Math.min(idx, questions.length - 1)];

  return <SentenceQuestion key={idx} q={q} idx={idx} total={questions.length} onNext={next} />;
}
