"use client";

import { useState } from "react";
import { Volume2, Eye, EyeOff, Mic, ChevronLeft, ChevronRight, Sparkles, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Flashcard } from "@/types";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-700",
  A2: "bg-teal-100 text-teal-700",
  B1: "bg-sky-100 text-sky-700",
  B2: "bg-blue-100 text-blue-700",
  C1: "bg-violet-100 text-violet-700",
  C2: "bg-fuchsia-100 text-fuchsia-700",
};

interface Props {
  card: Flashcard;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenAI?: (word: string) => void;
  onDelete?: (id: string) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function FlashcardView({ card, onPrev, onNext, onOpenAI, onDelete, hasPrev, hasNext }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [voiceHint, setVoiceHint] = useState(false);
  const { speak, speaking } = useTextToSpeech("en-US");
  const { start, listening, supported } = useSpeechRecognition("vi-VN");

  const flip = () => setFlipped((f) => !f);

  const handleVoiceFlip = () => {
    if (!supported) {
      setVoiceHint(true);
      setTimeout(() => setVoiceHint(false), 2000);
      return;
    }
    start({
      onResult: (text) => {
        const t = text.toLowerCase();
        if (t.includes("lật") || t.includes("flip") || t.includes("mặt sau") || t.includes("nghĩa")) {
          setFlipped(true);
        } else if (t.includes("mặt trước") || t.includes("quay lại") || t.includes("back")) {
          setFlipped(false);
        } else {
          setFlipped((f) => !f);
        }
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="[perspective:1200px]">
        <div
          className={clsx(
            "relative w-full aspect-[4/5] sm:aspect-[3/4] transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer",
            flipped && "[transform:rotateY(180deg)]"
          )}
          onClick={flip}
        >
          {/* FRONT */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", LEVEL_COLORS[card.level])}>
                {card.level}
              </span>
              <span className="text-xs text-slate-400">{card.partOfSpeech}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 break-words">{card.word}</h2>
              <div className="flex items-center gap-2 min-h-[28px]">
                {showPhonetic ? (
                  <span className="text-slate-500 text-lg font-mono">{card.phonetic}</span>
                ) : (
                  <span className="text-slate-300 text-lg">••••••</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPhonetic((s) => !s);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                  title="Ẩn/hiện phiên âm"
                >
                  {showPhonetic ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.word);
                }}
                className={clsx(
                  "mt-2 w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  speaking ? "bg-indigo-600 text-white animate-pulse" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                )}
                title="Phát âm"
              >
                <Volume2 size={22} />
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">Chạm vào thẻ để lật</p>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl bg-indigo-600 text-white shadow-lg flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20">{card.word}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.word);
                }}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"
              >
                <Volume2 size={16} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Nghĩa</p>
                <p className="text-xl font-semibold">{card.meaningVi}</p>
              </div>

              {card.examples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-indigo-200">Ví dụ</p>
                  {card.examples.map((ex, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3 text-sm">
                      <p className="italic">{ex.en}</p>
                      <p className="text-indigo-100 mt-1">{ex.vi}</p>
                    </div>
                  ))}
                </div>
              )}

              {card.synonyms && card.synonyms.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Đồng nghĩa</p>
                  <p className="text-sm text-indigo-100">{card.synonyms.join(", ")}</p>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-indigo-200">Chạm vào thẻ để lật lại</p>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleVoiceFlip}
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center border",
            listening
              ? "bg-red-500 text-white border-red-500 animate-pulse"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
          title="Nói để lật thẻ (thử nói 'lật' hoặc 'nghĩa')"
        >
          <Mic size={18} />
        </button>

        <button
          onClick={flip}
          className="px-5 h-11 rounded-full bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
        >
          Lật thẻ
        </button>

        <button
          onClick={() => onOpenAI?.(card.word)}
          className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-amber-100"
          title="Tra nhanh bằng AI"
        >
          <Sparkles size={18} />
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {voiceHint && (
        <p className="text-center text-xs text-red-500 mt-2">Trình duyệt không hỗ trợ nhận diện giọng nói</p>
      )}

      {onDelete && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => onDelete(card.id)}
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
          >
            <Trash2 size={13} /> Xoá thẻ này
          </button>
        </div>
      )}
    </div>
  );
}
