"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { Flashcard } from "@/types";
import { MatchingGame } from "./MatchingGame";
import { SpeakingPractice } from "./SpeakingPractice";
import { ListeningPractice } from "./ListeningPractice";
import { SentenceOrderPractice } from "./SentenceOrderPractice";

type SubMode = "match-en-vi" | "match-vi-en" | "speaking" | "listening" | "sentence-order";

const ALL_MODES: SubMode[] = ["match-en-vi", "match-vi-en", "speaking", "listening", "sentence-order"];

const LABELS: Record<SubMode, string> = {
  "match-en-vi": "Nối từ Anh → Việt",
  "match-vi-en": "Nối từ Việt → Anh",
  speaking: "Luyện nói",
  listening: "Luyện nghe",
  "sentence-order": "Xếp câu",
};

export function MixedPractice({ cards }: { cards: Flashcard[] }) {
  const [mode, setMode] = useState<SubMode>(() => ALL_MODES[Math.floor(Math.random() * ALL_MODES.length)]);
  const [round, setRound] = useState(0);

  const rollNext = () => {
    const options = ALL_MODES.filter((m) => m !== mode);
    const next = options[Math.floor(Math.random() * options.length)];
    setMode(next);
    setRound((r) => r + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-fuchsia-100 text-fuchsia-700">
          {LABELS[mode]}
        </span>
        <button
          onClick={rollNext}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <Shuffle size={13} /> Đổi bài tập
        </button>
      </div>

      <div key={`${mode}-${round}`}>
        {mode === "match-en-vi" && <MatchingGame cards={cards} direction="en-vi" />}
        {mode === "match-vi-en" && <MatchingGame cards={cards} direction="vi-en" />}
        {mode === "speaking" && <SpeakingPractice cards={cards} />}
        {mode === "listening" && <ListeningPractice cards={cards} />}
        {mode === "sentence-order" && <SentenceOrderPractice cards={cards} />}
      </div>
    </div>
  );
}
