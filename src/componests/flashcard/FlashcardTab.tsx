"use client";

import { useState } from "react";
import { Search, Plus, LayoutList, GalleryHorizontal } from "lucide-react";
import clsx from "clsx";
import { useFlashcards, deleteFlashcard } from "@/hooks/useFlashcards";
import { FlashcardView } from "./FlashcardView";
import { AddWordForm } from "./AddWordForm";
import { MiniAiLookup } from "./MiniAiLookup";
import type { CEFRLevel } from "@/types";

const LEVELS: (CEFRLevel | "all")[] = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

export function FlashcardTab() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"deck" | "list">("deck");
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiLookupWord, setAiLookupWord] = useState<string | null>(null);
  const [aiLookupOpen, setAiLookupOpen] = useState(false);

  const cards = useFlashcards({ search, level });

  // Derived clamp instead of an effect: keeps index valid as the filtered
  // list shrinks/grows without a synchronous setState-in-effect render pass.
  const clampedIndex = cards.length === 0 ? 0 : Math.min(index, cards.length - 1);
  const current = cards[clampedIndex];

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setIndex(0);
  };
  const handleLevelChange = (v: CEFRLevel | "all") => {
    setLevel(v);
    setIndex(0);
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-24 md:pb-10">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm từ đã lưu..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("deck")}
              className={clsx("p-2 rounded-lg", viewMode === "deck" ? "bg-indigo-100 text-indigo-600" : "text-slate-400")}
              title="Chế độ thẻ"
            >
              <GalleryHorizontal size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx("p-2 rounded-lg", viewMode === "list" ? "bg-indigo-100 text-indigo-600" : "text-slate-400")}
              title="Chế độ danh sách"
            >
              <LayoutList size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={16} /> Thêm từ
          </button>
        </div>
      </div>

      {/* Level filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => handleLevelChange(l)}
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
        <span className="ml-auto self-center text-xs text-slate-400 whitespace-nowrap pl-2">
          {cards.length} thẻ
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-sm">Chưa có Flashcard nào. Nhấn &quot;Thêm từ&quot; để bắt đầu!</p>
        </div>
      ) : viewMode === "deck" ? (
        <>
          <p className="text-center text-xs text-slate-400 mb-3">
            Thẻ {clampedIndex + 1} / {cards.length}
          </p>
          {current && (
            <FlashcardView
              card={current}
              onPrev={() => setIndex(Math.max(0, clampedIndex - 1))}
              onNext={() => setIndex(Math.min(cards.length - 1, clampedIndex + 1))}
              hasPrev={clampedIndex > 0}
              hasNext={clampedIndex < cards.length - 1}
              onOpenAI={(w) => {
                setAiLookupWord(w);
                setAiLookupOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setIndex(i);
                setViewMode("deck");
              }}
              className="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">{c.word}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                  {c.level}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-mono">{c.phonetic}</p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-1">{c.meaningVi}</p>
            </button>
          ))}
        </div>
      )}

      {/* Floating mini AI lookup trigger */}
      <button
        onClick={() => {
          setAiLookupWord(null);
          setAiLookupOpen(true);
        }}
        className="fixed right-4 bottom-24 md:bottom-8 z-30 w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600"
        title="Tra từ nhanh bằng AI"
      >
        <Search size={22} />
      </button>

      {showAddForm && (
        <AddWordForm onClose={() => setShowAddForm(false)} onAdded={() => setShowAddForm(false)} />
      )}
      {aiLookupOpen && (
        <MiniAiLookup initialWord={aiLookupWord ?? undefined} onClose={() => setAiLookupOpen(false)} />
      )}
    </div>
  );
}
