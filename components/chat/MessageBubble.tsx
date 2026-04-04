"use client";

import type { Message } from "@/types";
import { formatTime } from "@/lib/utils";
import { TreePine } from "lucide-react";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-light">
          <TreePine className="h-4 w-4 text-teal" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-teal text-white rounded-br-md"
            : "bg-card border border-border text-text rounded-bl-md"
        }`}
      >
        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isStreaming && message.content ? "streaming-cursor" : ""}`}>
          {message.content}
        </p>
        <p
          className={`mt-1.5 text-xs ${
            isUser ? "text-white/60" : "text-text-muted"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
