"use client";

import { useState } from "react";
import { Sparkles, Plus, Loader2, X, Trash2 } from "lucide-react";
import { useSettingsStore } from "@/lib/settingsStore";
import { generateWordData, generateWordsBatch } from "@/lib/gemini";
import { addFlashcard, addFlashcardsBulk, wordExists } from "@/hooks/useFlashcards";
import type { CEFRLevel, FlashcardExample } from "@/types";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function AddWordForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const { geminiKeys, chatModel, markKeyUsed, markKeyFailed } = useSettingsStore();

  // AI mode state
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCount, setAiCount] = useState(0);

  // Manual mode state
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [pos, setPos] = useState("");
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [meaningVi, setMeaningVi] = useState("");
  const [examples, setExamples] = useState<FlashcardExample[]>([{ en: "", vi: "" }]);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);

  const handleAiGenerate = async () => {
    const words = aiInput
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter(Boolean);
    if (words.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    setAiCount(0);
    try {
      const newWords: string[] = [];
      for (const w of words) {
        if (!(await wordExists(w))) newWords.push(w);
      }
      if (newWords.length === 0) {
        setAiError("Tất cả các từ đã có trong Flashcard rồi.");
        return;
      }
      if (newWords.length === 1) {
        const data = await generateWordData(geminiKeys, chatModel, newWords[0], markKeyUsed, markKeyFailed);
        await addFlashcard({ ...data, source: "ai" });
        setAiCount(1);
      } else {
        const data = await generateWordsBatch(geminiKeys, chatModel, newWords, markKeyUsed, markKeyFailed);
        await addFlashcardsBulk(data.map((d) => ({ ...d, source: "ai" as const })));
        setAiCount(data.length);
      }
      setAiInput("");
      onAdded();
    } catch (e) {
      setAiError((e as Error).message || "Có lỗi xảy ra khi tạo từ vựng bằng AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleManualSave = async () => {
    setManualError(null);
    if (!word.trim() || !meaningVi.trim()) {
      setManualError("Vui lòng nhập ít nhất Từ vựng và Nghĩa tiếng Việt.");
      return;
    }
    if (await wordExists(word)) {
      setManualError("Từ này đã có trong Flashcard rồi.");
      return;
    }
    setManualSaving(true);
    try {
      await addFlashcard({
        word: word.trim(),
        phonetic: phonetic.trim(),
        partOfSpeech: pos.trim() || "—",
        level,
        meaningVi: meaningVi.trim(),
        examples: examples.filter((e) => e.en.trim() || e.vi.trim()),
        source: "manual",
      });
      onAdded();
      onClose();
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-slate-800">Thêm từ vựng</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
              mode === "ai" ? "bg-white shadow text-indigo-600" : "text-slate-500"
            }`}
          >
            <Sparkles size={15} /> Tạo bằng AI
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === "manual" ? "bg-white shadow text-indigo-600" : "text-slate-500"
            }`}
          >
            Nhập tay
          </button>
        </div>

        {mode === "ai" ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Nhập 1 hoặc nhiều từ (cách nhau bằng dấu phẩy hoặc xuống dòng). AI sẽ tự tra phiên âm, nghĩa, ví dụ và ước lượng trình độ CEFR.
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder={"ví dụ: resilient, ubiquitous\nhoặc mỗi từ 1 dòng"}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            {aiError && <p className="text-xs text-red-500">{aiError}</p>}
            {aiCount > 0 && <p className="text-xs text-emerald-600">Đã thêm {aiCount} từ thành công!</p>}
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading || !aiInput.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiLoading ? "Đang tạo..." : "Tạo Flashcard bằng AI"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Từ vựng *</label>
                <input
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Phiên âm</label>
                <input
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  placeholder="/həˈloʊ/"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Từ loại</label>
                <input
                  value={pos}
                  onChange={(e) => setPos(e.target.value)}
                  placeholder="noun, verb..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Trình độ</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500">Nghĩa tiếng Việt *</label>
              <input
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Ví dụ</label>
              {examples.map((ex, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <div className="flex-1 space-y-1">
                    <input
                      value={ex.en}
                      onChange={(e) => {
                        const next = [...examples];
                        next[i] = { ...next[i], en: e.target.value };
                        setExamples(next);
                      }}
                      placeholder="Câu ví dụ tiếng Anh"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      value={ex.vi}
                      onChange={(e) => {
                        const next = [...examples];
                        next[i] = { ...next[i], vi: e.target.value };
                        setExamples(next);
                      }}
                      placeholder="Dịch nghĩa"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  {examples.length > 1 && (
                    <button
                      onClick={() => setExamples(examples.filter((_, idx) => idx !== i))}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setExamples([...examples, { en: "", vi: "" }])}
                className="text-xs text-indigo-600 font-medium"
              >
                + Thêm ví dụ
              </button>
            </div>

            {manualError && <p className="text-xs text-red-500">{manualError}</p>}

            <button
              onClick={handleManualSave}
              disabled={manualSaving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {manualSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Lưu Flashcard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
