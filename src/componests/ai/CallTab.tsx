"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useLiveCall } from "@/hooks/useLiveCall";
import { useSettingsStore } from "@/lib/settingsStore";

export function CallTab() {
  const { status, error, transcript, aiSpeaking, userLevel, start, stop } = useLiveCall();
  const { liveModel } = useSettingsStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length]);

  useEffect(() => {
    return () => {
      if (status === "connected" || status === "connecting") stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = status === "connected" || status === "connecting";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10 flex flex-col items-center">
      <p className="text-xs text-slate-400 mb-1">Gọi thoại trực tiếp với AI</p>
      <p className="text-[11px] text-slate-300 mb-6">{liveModel}</p>

      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
        <div
          className={clsx(
            "absolute inset-0 rounded-full transition-transform",
            aiSpeaking ? "bg-indigo-200 animate-ping" : "bg-transparent"
          )}
        />
        <div
          className="absolute inset-0 rounded-full bg-emerald-200/60 transition-transform"
          style={{ transform: `scale(${1 + userLevel * 0.3})` }}
        />
        <div
          className={clsx(
            "w-28 h-28 rounded-full flex items-center justify-center text-white shadow-lg z-10 transition-colors",
            status === "connected" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-400" : "bg-slate-700"
          )}
        >
          {status === "connecting" ? <Loader2 size={32} className="animate-spin" /> : <Phone size={32} />}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-600 mb-6">
        {status === "idle" && "Sẵn sàng gọi"}
        {status === "connecting" && "Đang kết nối..."}
        {status === "connected" && (aiSpeaking ? "AI đang nói..." : "Đang nghe bạn...")}
        {status === "error" && "Có lỗi xảy ra"}
        {status === "ended" && "Đã kết thúc cuộc gọi"}
      </p>

      {!isActive ? (
        <button
          onClick={start}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 text-white font-medium shadow-lg hover:bg-emerald-700"
        >
          <Phone size={18} /> Bắt đầu gọi
        </button>
      ) : (
        <button
          onClick={stop}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-red-600 text-white font-medium shadow-lg hover:bg-red-700"
        >
          <PhoneOff size={18} /> Kết thúc
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}

      {transcript.length > 0 && (
        <div
          ref={scrollRef}
          className="w-full mt-8 bg-white border border-slate-200 rounded-2xl p-4 max-h-80 overflow-y-auto space-y-2.5"
        >
          {transcript.map((line, i) => (
            <div key={i} className={clsx("flex", line.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={clsx(
                  "max-w-[80%] px-3 py-1.5 rounded-xl text-sm",
                  line.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                  !line.final && "opacity-60"
                )}
              >
                {line.text}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-300 mt-6 text-center max-w-xs">
        Cần cho phép truy cập micro. Cuộc gọi sử dụng Gemini Live API qua trình duyệt của bạn.
      </p>
    </div>
  );
}
