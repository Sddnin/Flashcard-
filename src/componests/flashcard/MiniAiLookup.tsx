"use client";

import { useState } from "react";
import { X, Volume2, Search, Plus, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/lib/settingsStore";
import { quickLookup, type QuickLookupResult } from "@/lib/gemini";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { addFlashcard, wordExists } from "@/hooks/useFlashcards";
import type { CEFRLevel } from "@/types";

export function MiniAiLookup({
  initialWord,
  onClose,
}: {
  initialWord?: string;
  onClose: () => void;
}) {
  const [word, setWord] = useState(initialWord ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { speak } = useTextToSpeech("en-US");
  const { geminiKeys, chatModel, markKeyUsed, markKeyFailed } = useSettingsStore();

  const doLookup = async (w: string) => {
    if (!w.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await quickLookup(geminiKeys, chatModel, w.trim(), markKeyUsed, markKeyFailed);
      setResult(res);
    } catch (e) {
      setError((e as Error).message || "Có lỗi khi tra từ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const exists = await wordExists(result.word);
    if (exists) {
      setError("Từ này đã có trong Flashcard rồi.");
      return;
    }
    await addFlashcard({
      word: result.word,
      phonetic: result.phonetic,
      partOfSpeech: result.partOfSpeech,
      level: "B1" as CEFRLevel,
      meaningVi: result.meaningVi,
      examples: [{ en: result.exampleEn, vi: result.exampleVi }],
      source: "ai",
    });
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Search size={16} className="text-amber-500" /> Tra từ nhanh bằng AI
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            autoFocus
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLookup(word)}
            placeholder="Nhập từ tiếng Anh..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => doLookup(word)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Tra"}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        {result && (
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-slate-800">{result.word}</h4>
              <button onClick={() => speak(result.word)} className="text-indigo-500">
                <Volume2 size={16} />
              </button>
              <span className="text-slate-400 text-sm font-mono">{result.phonetic}</span>
            </div>
            <p className="text-xs text-slate-400">{result.partOfSpeech}</p>
            <p className="text-slate-700 font-medium">{result.meaningVi}</p>
            <div className="text-sm bg-white rounded-xl p-2.5 border border-slate-100">
              <p className="italic text-slate-600">{result.exampleEn}</p>
              <p className="text-slate-400 mt-0.5">{result.exampleVi}</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saved}
              className="w-full mt-2 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={15} /> {saved ? "Đã lưu vào Flashcard" : "Lưu vào Flashcard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
