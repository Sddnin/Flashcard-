"use client";

import { LayoutGrid, Dumbbell, Bot, FileJson2, Settings } from "lucide-react";
import clsx from "clsx";

export type TabKey = "flashcards" | "practice" | "ai" | "importexport" | "settings";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "flashcards", label: "Flashcard", icon: LayoutGrid },
  { key: "practice", label: "Luyện tập", icon: Dumbbell },
  { key: "ai", label: "AI", icon: Bot },
  { key: "importexport", label: "Import/Export", icon: FileJson2 },
  { key: "settings", label: "Cài đặt", icon: Settings },
];

export function DesktopNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="hidden md:flex items-center gap-1 border-b border-slate-200 bg-white px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 mr-6 py-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          FE
        </div>
        <span className="font-semibold text-slate-800">FlashEnglish</span>
      </div>
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon size={17} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export function MobileTaskbar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
