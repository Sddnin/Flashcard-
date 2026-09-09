"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, CheckCircle2, XCircle, Clock } from "lucide-react";
import clsx from "clsx";
import { useSettingsStore, DEFAULT_CHAT_MODEL, DEFAULT_LIVE_MODEL } from "@/lib/settingsStore";

export function SettingsTab() {
  const {
    geminiKeys,
    setKey,
    setKeyEnabled,
    resetKeyHealth,
    chatModel,
    liveModel,
    setChatModel,
    setLiveModel,
    autoSpeak,
    setAutoSpeak,
  } = useSettingsStore();
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  // Ticks once a second so cooldown badges update live; this synchronizes
  // component state with the external wall clock (a valid effect use),
  // rather than calling Date.now() impurely during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
          <KeyRound size={17} className="text-indigo-600" /> Gemini API Keys
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Nhập tối đa 4 API key. Hệ thống sẽ tự động xoay vòng và chuyển sang key khác nếu key hiện tại bị giới hạn (rate limit) hoặc lỗi.
        </p>

        <div className="space-y-3">
          {geminiKeys.map((slot, i) => {
            const inCooldown = !!slot.cooldownUntil && slot.cooldownUntil > now;
            return (
              <div key={slot.id} className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Key #{i + 1}</span>
                  <div className="flex items-center gap-2">
                    {slot.key && (
                      <span
                        className={clsx(
                          "flex items-center gap-1 text-[11px] font-medium",
                          inCooldown ? "text-amber-500" : slot.failCount > 0 ? "text-red-400" : "text-emerald-500"
                        )}
                      >
                        {inCooldown ? (
                          <>
                            <Clock size={11} /> Tạm nghỉ
                          </>
                        ) : slot.failCount > 0 ? (
                          <>
                            <XCircle size={11} /> Có lỗi
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={11} /> Sẵn sàng
                          </>
                        )}
                      </span>
                    )}
                    <label className="flex items-center gap-1.5 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => setKeyEnabled(slot.id, e.target.checked)}
                        className="rounded"
                      />
                      Bật
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type={visible[slot.id] ? "text" : "password"}
                    value={slot.key}
                    onChange={(e) => setKey(slot.id, e.target.value)}
                    placeholder="AIza..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={() => setVisible((v) => ({ ...v, [slot.id]: !v[slot.id] }))}
                    className="w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    {visible[slot.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {(inCooldown || slot.failCount > 0) && (
                  <button
                    onClick={() => resetKeyHealth(slot.id)}
                    className="text-[11px] text-indigo-500 mt-1.5"
                  >
                    Đặt lại trạng thái key này
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">
          Lấy API key miễn phí tại{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-500 underline"
          >
            Google AI Studio
          </a>
          . Key được lưu trên trình duyệt của bạn, không gửi lên server nào khác.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Model AI</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Model Chat</label>
            <input
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button onClick={() => setChatModel(DEFAULT_CHAT_MODEL)} className="text-[11px] text-indigo-500 mt-1">
              Đặt lại mặc định ({DEFAULT_CHAT_MODEL})
            </button>
          </div>
          <div>
            <label className="text-xs text-slate-500">Model Live Call</label>
            <input
              value={liveModel}
              onChange={(e) => setLiveModel(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button onClick={() => setLiveModel(DEFAULT_LIVE_MODEL)} className="text-[11px] text-indigo-500 mt-1">
              Đặt lại mặc định ({DEFAULT_LIVE_MODEL})
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Tuỳ chọn khác</h3>
        <label className="flex items-center justify-between text-sm text-slate-600">
          Tự động phát âm khi thêm từ mới
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
            className="rounded"
          />
        </label>
      </div>
    </div>
  );
}
