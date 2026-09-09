"use client";

import { useState } from "react";
import { DesktopNav, MobileTaskbar, type TabKey } from "@/components/layout/Navigation";
import { FlashcardTab } from "@/components/flashcard/FlashcardTab";
import { PracticeTab } from "@/components/practice/PracticeTab";
import { AiTab } from "@/components/ai/AiTab";
import { ImportExportTab } from "@/components/importexport/ImportExportTab";
import { SettingsTab } from "@/components/settings/SettingsTab";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("flashcards");

  return (
    <main className="min-h-dvh bg-slate-50">
      <DesktopNav active={tab} onChange={setTab} />

      <div>
        {tab === "flashcards" && <FlashcardTab />}
        {tab === "practice" && <PracticeTab />}
        {tab === "ai" && <AiTab />}
        {tab === "importexport" && <ImportExportTab />}
        {tab === "settings" && <SettingsTab />}
      </div>

      <MobileTaskbar active={tab} onChange={setTab} />
    </main>
  );
}
