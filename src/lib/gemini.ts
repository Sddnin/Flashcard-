import { GoogleGenAI } from "@google/genai";
import type { ApiKeySlot, CEFRLevel, Flashcard } from "@/types";

export class GeminiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiKeyError";
  }
}

export class NoAvailableKeyError extends Error {
  constructor() {
    super(
      "Không có Gemini API key nào khả dụng. Vào Cài đặt để nhập ít nhất 1 key."
    );
    this.name = "NoAvailableKeyError";
  }
}

/** Picks the best available key: enabled, not in cooldown, least-recently-used first. */
export function pickAvailableKey(keys: ApiKeySlot[]): ApiKeySlot | null {
  const now = Date.now();
  const usable = keys.filter(
    (k) => k.enabled && k.key.trim().length > 0 && (!k.cooldownUntil || k.cooldownUntil <= now)
  );
  if (usable.length === 0) return null;
  usable.sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));
  return usable[0];
}

function isRateLimitOrAuthError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("api key not valid") ||
    msg.includes("permission_denied")
  );
}

interface RunWithFailoverOpts {
  keys: ApiKeySlot[];
  onKeyUsed: (id: string) => void;
  onKeyFailed: (id: string, cooldownMs?: number) => void;
}

/** Tries each available key in order until one succeeds. */
export async function runWithFailover<T>(
  opts: RunWithFailoverOpts,
  fn: (client: GoogleGenAI, keyId: string) => Promise<T>
): Promise<T> {
  const { keys, onKeyUsed, onKeyFailed } = opts;
  const now = Date.now();
  const candidates = keys
    .filter((k) => k.enabled && k.key.trim().length > 0 && (!k.cooldownUntil || k.cooldownUntil <= now))
    .sort((a, b) => (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));

  if (candidates.length === 0) throw new NoAvailableKeyError();

  let lastErr: unknown = null;
  for (const slot of candidates) {
    try {
      const client = new GoogleGenAI({ apiKey: slot.key });
      const result = await fn(client, slot.id);
      onKeyUsed(slot.id);
      return result;
    } catch (err) {
      lastErr = err;
      if (isRateLimitOrAuthError(err)) {
        onKeyFailed(slot.id, 60_000);
        continue; // try next key
      }
      // Non key-related error (e.g. bad prompt) — no point retrying other keys
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new GeminiKeyError("Tất cả API key đều lỗi.");
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export interface GeneratedWordData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  level: CEFRLevel;
  meaningVi: string;
  examples: { en: string; vi: string }[];
  synonyms?: string[];
}

const WORD_SCHEMA_PROMPT = `Trả lời DUY NHẤT bằng một JSON object hợp lệ, không thêm chữ nào khác, không markdown, theo đúng schema sau:
{
  "word": string,
  "phonetic": string (IPA, ví dụ "/həˈloʊ/"),
  "partOfSpeech": string (ví dụ "noun", "verb", "adjective"),
  "level": one of "A1"|"A2"|"B1"|"B2"|"C1"|"C2" (ước lượng độ khó CEFR của từ),
  "meaningVi": string (nghĩa tiếng Việt ngắn gọn),
  "examples": array of exactly 2 objects { "en": string, "vi": string } (câu ví dụ tiếng Anh tự nhiên kèm dịch),
  "synonyms": array of up to 3 strings (từ đồng nghĩa tiếng Anh, có thể để mảng rỗng)
}`;

export async function generateWordData(
  keys: ApiKeySlot[],
  model: string,
  word: string,
  onKeyUsed: (id: string) => void,
  onKeyFailed: (id: string, cooldownMs?: number) => void
): Promise<GeneratedWordData> {
  const prompt = `Bạn là từ điển Anh-Việt chuyên nghiệp cho người Việt học tiếng Anh. Hãy phân tích từ/cụm từ tiếng Anh sau: "${word}".\n\n${WORD_SCHEMA_PROMPT}`;

  return runWithFailover({ keys, onKeyUsed, onKeyFailed }, async (client) => {
    const res = await client.models.generateContent({
      model,
      contents: prompt,
    });
    const text = res.text ?? "";
    const json = extractJson(text);
    const parsed = JSON.parse(json) as GeneratedWordData;
    if (!parsed.word) parsed.word = word;
    if (!Array.isArray(parsed.examples)) parsed.examples = [];
    if (!Array.isArray(parsed.synonyms)) parsed.synonyms = [];
    return parsed;
  });
}

export async function generateWordsBatch(
  keys: ApiKeySlot[],
  model: string,
  words: string[],
  onKeyUsed: (id: string) => void,
  onKeyFailed: (id: string, cooldownMs?: number) => void
): Promise<GeneratedWordData[]> {
  const prompt = `Bạn là từ điển Anh-Việt chuyên nghiệp cho người Việt học tiếng Anh. Hãy phân tích TỪNG từ/cụm từ tiếng Anh sau đây: ${words
    .map((w) => `"${w}"`)
    .join(", ")}.\n\nTrả lời DUY NHẤT bằng một JSON array, mỗi phần tử theo đúng schema, không thêm chữ nào khác, không markdown:\n[{"word": string, "phonetic": string, "partOfSpeech": string, "level": "A1"|"A2"|"B1"|"B2"|"C1"|"C2", "meaningVi": string, "examples": [{"en": string, "vi": string}, {"en": string, "vi": string}], "synonyms": [string]}]`;

  return runWithFailover({ keys, onKeyUsed, onKeyFailed }, async (client) => {
    const res = await client.models.generateContent({ model, contents: prompt });
    const text = res.text ?? "";
    const json = extractJson(text);
    const parsed = JSON.parse(json) as GeneratedWordData[];
    return parsed.map((p, i) => ({
      ...p,
      word: p.word || words[i],
      examples: Array.isArray(p.examples) ? p.examples : [],
      synonyms: Array.isArray(p.synonyms) ? p.synonyms : [],
    }));
  });
}

export async function chatWithGemini(
  keys: ApiKeySlot[],
  model: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  onKeyUsed: (id: string) => void,
  onKeyFailed: (id: string, cooldownMs?: number) => void
): Promise<string> {
  return runWithFailover({ keys, onKeyUsed, onKeyFailed }, async (client) => {
    const chat = client.chats.create({
      model,
      history: history.slice(0, -1),
      config: {
        systemInstruction:
          "Bạn là trợ lý AI hỗ trợ học tiếng Anh cho người Việt. Trả lời ngắn gọn, thân thiện, có thể giải thích ngữ pháp/từ vựng bằng tiếng Việt khi cần, và đưa ví dụ minh hoạ.",
      },
    });
    const lastMsg = history[history.length - 1]?.parts?.[0]?.text ?? "";
    const res = await chat.sendMessage({ message: lastMsg });
    return res.text ?? "";
  });
}

export interface QuickLookupResult {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
}

export async function quickLookup(
  keys: ApiKeySlot[],
  model: string,
  word: string,
  onKeyUsed: (id: string) => void,
  onKeyFailed: (id: string, cooldownMs?: number) => void
): Promise<QuickLookupResult> {
  const prompt = `Tra nhanh từ/cụm tiếng Anh "${word}" cho người Việt học tiếng Anh. Trả lời DUY NHẤT JSON, không markdown:\n{"word": string, "phonetic": string, "partOfSpeech": string, "meaningVi": string, "exampleEn": string, "exampleVi": string}`;
  return runWithFailover({ keys, onKeyUsed, onKeyFailed }, async (client) => {
    const res = await client.models.generateContent({ model, contents: prompt });
    const json = extractJson(res.text ?? "");
    return JSON.parse(json) as QuickLookupResult;
  });
}

export async function generateSentenceForCard(
  keys: ApiKeySlot[],
  model: string,
  card: Flashcard,
  onKeyUsed: (id: string) => void,
  onKeyFailed: (id: string, cooldownMs?: number) => void
): Promise<{ en: string; vi: string }> {
  const prompt = `Đặt 1 câu tiếng Anh tự nhiên, độ khó phù hợp trình độ ${card.level}, có dùng từ "${card.word}" (nghĩa: ${card.meaningVi}). Trả lời DUY NHẤT JSON không markdown: {"en": string, "vi": string (bản dịch)}`;
  return runWithFailover({ keys, onKeyUsed, onKeyFailed }, async (client) => {
    const res = await client.models.generateContent({ model, contents: prompt });
    const json = extractJson(res.text ?? "");
    return JSON.parse(json) as { en: string; vi: string };
  });
}
