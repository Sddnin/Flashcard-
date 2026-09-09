"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Send, Loader2, Trash2, Bot, User } from "lucide-react";
import { db } from "@/lib/db";
import { useSettingsStore } from "@/lib/settingsStore";
import { chatWithGemini } from "@/lib/gemini";
import type { ChatMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

export function ChatTab() {
  const messages = useLiveQuery(() => db.chatMessages.orderBy("createdAt").toArray(), []) ?? [];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { geminiKeys, chatModel, markKeyUsed, markKeyFailed } = useSettingsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { id: uuidv4(), role: "user", content: text, createdAt: Date.now() };
    await db.chatMessages.add(userMsg);

    setLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }));
      const reply = await chatWithGemini(geminiKeys, chatModel, history, markKeyUsed, markKeyFailed);
      await db.chatMessages.add({
        id: uuidv4(),
        role: "assistant",
        content: reply || "(không có phản hồi)",
        createdAt: Date.now(),
      });
    } catch (e) {
      setError((e as Error).message || "Có lỗi khi gọi Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await db.chatMessages.clear();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-56px-64px)] md:h-[calc(100dvh-56px)] max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Bot size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Trợ lý AI</p>
            <p className="text-[11px] text-slate-400">{chatModel}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="text-slate-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-10">
            Hỏi AI bất cứ điều gì về từ vựng, ngữ pháp, hoặc luyện tập tiếng Anh nhé!
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-indigo-600" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-indigo-600" />
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200">
              <Loader2 size={15} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhắn gì đó..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
