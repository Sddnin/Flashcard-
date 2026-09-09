"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiKeySlot, AppSettings } from "@/types";

function emptySlot(id: string): ApiKeySlot {
  return { id, key: "", enabled: true, failCount: 0 };
}

interface SettingsState extends AppSettings {
  setKey: (id: string, key: string) => void;
  setKeyEnabled: (id: string, enabled: boolean) => void;
  setChatModel: (m: string) => void;
  setLiveModel: (m: string) => void;
  setTtsVoiceLang: (l: string) => void;
  setAutoSpeak: (v: boolean) => void;
  markKeyFailed: (id: string, cooldownMs?: number) => void;
  markKeyUsed: (id: string) => void;
  resetKeyHealth: (id: string) => void;
}

export const DEFAULT_CHAT_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_LIVE_MODEL = "gemini-3.1-flash-live";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiKeys: [emptySlot("1"), emptySlot("2"), emptySlot("3"), emptySlot("4")],
      chatModel: DEFAULT_CHAT_MODEL,
      liveModel: DEFAULT_LIVE_MODEL,
      ttsVoiceLang: "en-US",
      autoSpeak: true,

      setKey: (id, key) =>
        set((s) => ({
          geminiKeys: s.geminiKeys.map((k) =>
            k.id === id ? { ...k, key, failCount: 0, cooldownUntil: undefined } : k
          ),
        })),

      setKeyEnabled: (id, enabled) =>
        set((s) => ({
          geminiKeys: s.geminiKeys.map((k) => (k.id === id ? { ...k, enabled } : k)),
        })),

      setChatModel: (chatModel) => set({ chatModel }),
      setLiveModel: (liveModel) => set({ liveModel }),
      setTtsVoiceLang: (ttsVoiceLang) => set({ ttsVoiceLang }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),

      markKeyFailed: (id, cooldownMs = 60_000) =>
        set((s) => ({
          geminiKeys: s.geminiKeys.map((k) =>
            k.id === id
              ? {
                  ...k,
                  failCount: k.failCount + 1,
                  cooldownUntil: Date.now() + cooldownMs,
                }
              : k
          ),
        })),

      markKeyUsed: (id) =>
        set((s) => ({
          geminiKeys: s.geminiKeys.map((k) =>
            k.id === id ? { ...k, lastUsedAt: Date.now() } : k
          ),
        })),

      resetKeyHealth: (id) =>
        set((s) => ({
          geminiKeys: s.geminiKeys.map((k) =>
            k.id === id ? { ...k, failCount: 0, cooldownUntil: undefined } : k
          ),
        })),
    }),
    { name: "flashcard-app-settings" }
  )
);
