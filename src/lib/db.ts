import Dexie, { type Table } from "dexie";
import type { Flashcard, ChatMessage, PracticeResult } from "@/types";

export class FlashcardDB extends Dexie {
  flashcards!: Table<Flashcard, string>;
  chatMessages!: Table<ChatMessage, string>;
  practiceResults!: Table<PracticeResult, string>;

  constructor() {
    super("flashcard-app-db");
    this.version(1).stores({
      flashcards: "id, word, level, source, createdAt, updatedAt",
      chatMessages: "id, createdAt",
      practiceResults: "id, mode, cardId, createdAt",
    });
  }
}

export const db = new FlashcardDB();
