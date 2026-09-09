"use client";

import { useRef, useState } from "react";
import { Upload, Download, FileJson, FileText, FileSpreadsheet, Sparkles, Loader2, Check } from "lucide-react";
import { useFlashcards, addFlashcardsBulk, wordExists } from "@/hooks/useFlashcards";
import { exportJson, exportPdf, exportWord, exportExcel } from "@/lib/exportUtils";
import { useSettingsStore } from "@/lib/settingsStore";
import { generateWordsBatch } from "@/lib/gemini";
import type { CEFRLevel, Flashcard, FlashcardExample } from "@/types";

const VALID_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Tries to interpret arbitrary JSON as either full Flashcard objects or a plain word list. */
function classifyImportedJson(raw: unknown): { fullCards: Partial<Flashcard>[]; plainWords: string[] } {
  const arr: unknown[] = Array.isArray(raw) ? raw : typeof raw === "object" && raw !== null ? Object.values(raw as object) : [];
  const fullCards: Partial<Flashcard>[] = [];
  const plainWords: string[] = [];

  for (const item of arr) {
    if (typeof item === "string") {
      plainWords.push(item);
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const word = (obj.word ?? obj.term ?? obj.en ?? obj.english) as string | undefined;
      const meaning = (obj.meaningVi ?? obj.meaning ?? obj.vi ?? obj.vietnamese ?? obj.translation) as
        | string
        | undefined;
      if (word && meaning) {
        fullCards.push({
          word,
          meaningVi: meaning,
          phonetic: (obj.phonetic as string) ?? "",
          partOfSpeech: (obj.partOfSpeech as string) ?? (obj.pos as string) ?? "—",
          level: VALID_LEVELS.includes(obj.level as CEFRLevel) ? (obj.level as CEFRLevel) : "B1",
          examples: Array.isArray(obj.examples) ? (obj.examples as FlashcardExample[]) : [],
          synonyms: Array.isArray(obj.synonyms) ? (obj.synonyms as string[]) : [],
        });
      } else if (word) {
        plainWords.push(word);
      }
    }
  }
  return { fullCards, plainWords };
}

export function ImportExportTab() {
  const allCards = useFlashcards();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [useAiEnrich, setUseAiEnrich] = useState(true);
  const { geminiKeys, chatModel, markKeyUsed, markKeyFailed } = useSettingsStore();

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const { fullCards, plainWords } = classifyImportedJson(raw);

      let addedCount = 0;

      // Full cards: dedupe & add directly
      const newFullCards: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "timesReviewed" | "timesCorrect">[] = [];
      for (const c of fullCards) {
        if (!c.word) continue;
        if (await wordExists(c.word)) continue;
        newFullCards.push({
          word: c.word,
          phonetic: c.phonetic ?? "",
          partOfSpeech: c.partOfSpeech ?? "—",
          level: c.level ?? "B1",
          meaningVi: c.meaningVi ?? "",
          examples: c.examples ?? [],
          synonyms: c.synonyms ?? [],
          source: "import",
        });
      }
      if (newFullCards.length > 0) {
        await addFlashcardsBulk(newFullCards);
        addedCount += newFullCards.length;
      }

      // Plain word list: optionally enrich via AI, else add bare-minimum cards
      const newPlainWords: string[] = [];
      for (const w of plainWords) {
        if (!(await wordExists(w))) newPlainWords.push(w);
      }

      if (newPlainWords.length > 0) {
        if (useAiEnrich) {
          setImportStatus(`Đang phân tích ${newPlainWords.length} từ bằng AI...`);
          // Gemini batch prompts work best in chunks
          const chunkSize = 15;
          for (let i = 0; i < newPlainWords.length; i += chunkSize) {
            const chunk = newPlainWords.slice(i, i + chunkSize);
            const data = await generateWordsBatch(geminiKeys, chatModel, chunk, markKeyUsed, markKeyFailed);
            await addFlashcardsBulk(data.map((d) => ({ ...d, source: "ai" as const })));
            addedCount += data.length;
          }
        } else {
          await addFlashcardsBulk(
            newPlainWords.map((w) => ({
              word: w,
              phonetic: "",
              partOfSpeech: "—",
              level: "B1" as CEFRLevel,
              meaningVi: "",
              examples: [],
              source: "import" as const,
            }))
          );
          addedCount += newPlainWords.length;
        }
      }

      setImportStatus(`Đã nhập thành công ${addedCount} từ vựng!`);
    } catch (e) {
      setImportStatus(`Lỗi: ${(e as Error).message || "File JSON không hợp lệ."}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = async (type: "json" | "pdf" | "word" | "excel") => {
    if (allCards.length === 0) {
      setImportStatus("Chưa có Flashcard nào để xuất.");
      return;
    }
    setExporting(type);
    try {
      if (type === "json") exportJson(allCards);
      if (type === "pdf") await exportPdf(allCards);
      if (type === "word") await exportWord(allCards);
      if (type === "excel") await exportExcel(allCards);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      {/* Import section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
          <Upload size={17} className="text-indigo-600" /> Nhập từ JSON
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Hỗ trợ JSON là mảng từ đơn giản (<code>[&quot;apple&quot;, &quot;banana&quot;]</code>) hoặc mảng object đầy đủ
          thông tin. Từ đơn có thể được AI tự phân tích để bổ sung phiên âm, nghĩa, ví dụ.
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <input
            type="checkbox"
            checked={useAiEnrich}
            onChange={(e) => setUseAiEnrich(e.target.checked)}
            className="rounded"
          />
          Dùng AI phân tích &amp; bổ sung thông tin cho từ đơn giản
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {importing ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
          {importing ? "Đang xử lý..." : "Chọn file JSON để nhập"}
        </button>

        {importStatus && (
          <p className="text-xs mt-3 text-center text-slate-500 flex items-center justify-center gap-1.5">
            {importStatus.startsWith("Lỗi") ? null : <Check size={13} className="text-emerald-500" />}
            {importStatus}
          </p>
        )}
      </div>

      {/* Export section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
          <Download size={17} className="text-indigo-600" /> Xuất dữ liệu
        </h3>
        <p className="text-xs text-slate-400 mb-4">Xuất toàn bộ {allCards.length} Flashcard hiện có.</p>

        <div className="grid grid-cols-2 gap-3">
          <ExportButton
            icon={FileJson}
            label="JSON"
            loading={exporting === "json"}
            onClick={() => handleExport("json")}
          />
          <ExportButton
            icon={FileText}
            label="PDF"
            loading={exporting === "pdf"}
            onClick={() => handleExport("pdf")}
          />
          <ExportButton
            icon={FileText}
            label="Word"
            loading={exporting === "word"}
            onClick={() => handleExport("word")}
          />
          <ExportButton
            icon={FileSpreadsheet}
            label="Excel"
            loading={exporting === "excel"}
            onClick={() => handleExport("excel")}
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Quy trình đề xuất: <strong>Thêm/Nhập từ → Flashcard → Luyện tập</strong>. Sau khi nhập hoặc tạo từ vựng, hãy
          qua tab Flashcard để ôn lại, rồi qua tab Luyện tập để củng cố kiến thức.
        </p>
      </div>
    </div>
  );
}

function ExportButton({
  icon: Icon,
  label,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {label}
    </button>
  );
}
