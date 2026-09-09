"use client";

import { useState } from "react";
import clsx from "clsx";
import { MessageCircle, Phone } from "lucide-react";
import { ChatTab } from "./ChatTab";
import { CallTab } from "./CallTab";

export function AiTab() {
  const [sub, setSub] = useState<"chat" | "call">("chat");

  return (
    <div>
      <div className="flex justify-center gap-2 py-3 border-b border-slate-200 bg-white sticky top-0 z-20">
        <button
          onClick={() => setSub("chat")}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
            sub === "chat" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <MessageCircle size={15} /> Chat
        </button>
        <button
          onClick={() => setSub("call")}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
            sub === "call" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Phone size={15} /> Call
        </button>
      </div>

      {sub === "chat" ? <ChatTab /> : <CallTab />}
    </div>
  );
}
