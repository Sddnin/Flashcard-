"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { CEFRLevel, Flashcard } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function useFlashcards(filters?: { search?: string; level?: CEFRLevel | "all" }) {
  const cards = useLiveQuery(async () => {
    let all = await db.flashcards.orderBy("createdAt").reverse().toArray();
    if (filters?.level && filters.level !== "all") {
      all = all.filter((c) => c.level === filters.level);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      all = all.filter(
        (c) =>
          c.word.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return all;
  }, [filters?.search, filters?.level]);

  return cards ?? [];
}

export async function addFlashcard(data: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "timesReviewed" | "timesCorrect">) {
  const now = Date.now();
  const card: Flashcard = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    timesReviewed: 0,
    timesCorrect: 0,
  };
  await db.flashcards.add(card);
  return card;
}

export async function addFlashcardsBulk(
  items: Omit<Flashcard, "id" | "createdAt" | "updatedAt" | "timesReviewed" | "timesCorrect">[]
) {
  const now = Date.now();
  const cards: Flashcard[] = items.map((data) => ({
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    timesReviewed: 0,
    timesCorrect: 0,
  }));
  await db.flashcards.bulkAdd(cards);
  return cards;
}

export async function updateFlashcard(id: string, changes: Partial<Flashcard>) {
  await db.flashcards.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteFlashcard(id: string) {
  await db.flashcards.delete(id);
}

export async function recordReview(id: string, correct: boolean) {
  const card = await db.flashcards.get(id);
  if (!card) return;
  await db.flashcards.update(id, {
    timesReviewed: card.timesReviewed + 1,
    timesCorrect: card.timesCorrect + (correct ? 1 : 0),
    lastReviewedAt: Date.now(),
  });
}

export async function getAllCards(): Promise<Flashcard[]> {
  return db.flashcards.toArray();
}

export async function wordExists(word: string): Promise<boolean> {
  const w = word.trim().toLowerCase();
  const found = await db.flashcards.filter((c) => c.word.trim().toLowerCase() === w).first();
  return !!found;
}
