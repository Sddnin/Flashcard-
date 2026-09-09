export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface FlashcardExample {
  en: string;
  vi: string;
}

export interface Flashcard {
  id: string;
  word: string; // front word/phrase (English)
  phonetic: string; // IPA transcription, e.g. /həˈloʊ/
  partOfSpeech: string; // noun, verb, adj, ...
  level: CEFRLevel;
  meaningVi: string; // Vietnamese meaning (back side)
  examples: FlashcardExample[]; // example sentences (back side)
  synonyms?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  // spaced-repetition style stats (lightweight, not full SRS)
  timesReviewed: number;
  timesCorrect: number;
  lastReviewedAt?: number;
  source: "manual" | "ai" | "import";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ApiKeySlot {
  id: string; // slot 1-4
  key: string;
  label?: string;
  enabled: boolean;
  lastUsedAt?: number;
  failCount: number;
  cooldownUntil?: number; // epoch ms, set when rate-limited
}

export interface AppSettings {
  geminiKeys: ApiKeySlot[];
  chatModel: string;
  liveModel: string;
  ttsVoiceLang: string; // for speechSynthesis, e.g. "en-US"
  autoSpeak: boolean;
}

export type PracticeMode =
  | "match-en-vi"
  | "match-vi-en"
  | "speaking"
  | "listening"
  | "sentence-order"
  | "mixed";

export interface MatchPair {
  id: string;
  en: string;
  vi: string;
}

export interface PracticeResult {
  id: string;
  mode: PracticeMode;
  cardId: string;
  correct: boolean;
  createdAt: number;
}

export interface SentenceOrderQuestion {
  id: string;
  cardId: string;
  sentence: string; // full correct sentence
  vi: string;
  tokens: string[]; // shuffled tokens
}
