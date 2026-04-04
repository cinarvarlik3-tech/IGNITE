"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatScreen() {
  const { state, sendMessage, requestTree, clearChat } = useApp();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canGenerateTree = state.messages.length >= 4 && !state.isStreaming;

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || state.isStreaming) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ─── Messages ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {state.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div className="mb-4 rounded-2xl bg-teal-light p-4">
                <Sparkles className="h-8 w-8 text-teal" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-text">
                What&apos;s on your mind?
              </h2>
              <p className="max-w-sm text-text-muted">
                Describe a situation you&apos;ve been overthinking. I&apos;ll
                help you see it from new angles.
              </p>
            </div>
          )}

          {state.messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={
                state.isStreaming &&
                i === state.messages.length - 1 &&
                msg.role === "assistant"
              }
            />
          ))}

          {state.isStreaming &&
            state.messages[state.messages.length - 1]?.content === "" && (
              <TypingIndicator />
            )}
        </div>
      </div>

      {/* ─── Tree CTA ─── */}
      {canGenerateTree && (
        <div className="flex justify-center pb-2">
          <button
            onClick={requestTree}
            className="flex items-center gap-2 rounded-full bg-lavender px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-lavender/90 hover:shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
            See alternative outcomes →
          </button>
        </div>
      )}

      {/* ─── Input Bar ─── */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          {state.messages.length > 0 && (
            <button
              onClick={clearChat}
              className="mb-1 rounded-lg p-2 text-text-muted transition-colors hover:bg-gray-100 hover:text-text"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what's been on your mind..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || state.isStreaming}
            className="mb-1 rounded-xl bg-teal p-3 text-white transition-all hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
