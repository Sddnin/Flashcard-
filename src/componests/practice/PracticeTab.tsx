"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowLeftRight, Mic, Headphones, ListOrdered, Shuffle } from "lucide-react";
import { useFlashcards } from "@/hooks/useFlashcards";
import type { CEFRLevel, PracticeMode } from "@/types";
import { MatchingGame } from "./MatchingGame";
import { SpeakingPractice } from "./SpeakingPractice";
import { ListeningPractice } from "./ListeningPractice";
import { SentenceOrderPractice } from "./SentenceOrderPractice";
import { MixedPractice } from "./MixedPractice";

const LEVELS: (CEFRLevel | "all")[] = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

const MODES: { key: PracticeMode; label: string; icon: React.ElementType }[] = [
  { key: "match-en-vi", label: "Nối Anh→Việt", icon: ArrowLeftRight },
  { key: "match-vi-en", label: "Nối Việt→Anh", icon: ArrowLeftRight },
  { key: "speaking", label: "Luyện nói", icon: Mic },
  { key: "listening", label: "Luyện nghe", icon: Headphones },
  { key: "sentence-order", label: "Xếp câu", icon: ListOrdered },
  { key: "mixed", label: "Tổng hợp", icon: Shuffle },
];

export function PracticeTab() {
  const [mode, setMode] = useState<PracticeMode>("match-en-vi");
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const cards = useFlashcards({ level });

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-24 md:pb-10">
      {/* mode selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={clsx(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors",
                active
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
              )}
            >
              <Icon size={17} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* level filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
              level === l
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {l === "all" ? "Tất cả" : l}
          </button>
        ))}
      </div>

      {mode === "match-en-vi" && <MatchingGame cards={cards} direction="en-vi" />}
      {mode === "match-vi-en" && <MatchingGame cards={cards} direction="vi-en" />}
      {mode === "speaking" && <SpeakingPractice cards={cards} />}
      {mode === "listening" && <ListeningPractice cards={cards} />}
      {mode === "sentence-order" && <SentenceOrderPractice cards={cards} />}
      {mode === "mixed" && <MixedPractice cards={cards} />}
    </div>
  );
}
