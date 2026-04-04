"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { ChatSession } from "@/types";

const PAGE_SIZE = 20;
const PAGE_MORE = 10;

interface Props {
  open: boolean;
  onClose: () => void;
}

function matchesQuery(session: ChatSession, query: string): { matched: boolean; snippet: string } {
  const q = query.toLowerCase().trim();
  if (!q) return { matched: true, snippet: "" };

  if (session.title.toLowerCase().includes(q)) {
    return { matched: true, snippet: "" };
  }

  for (const msg of session.messages) {
    const idx = msg.content.toLowerCase().indexOf(q);
    if (idx !== -1) {
      const start = Math.max(0, idx - 30);
      const end = Math.min(msg.content.length, idx + q.length + 50);
      const snippet =
        (start > 0 ? "…" : "") +
        msg.content.slice(start, end) +
        (end < msg.content.length ? "…" : "");
      return { matched: true, snippet };
    }
  }

  return { matched: false, snippet: "" };
}

export default function SearchChatsModal({ open, onClose }: Props) {
  const { state, loadSession } = useApp();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);

  const savedSessions = state.sessions.filter((s) => s.messages.length > 0);

  const results = savedSessions
    .map((s) => ({ session: s, ...matchesQuery(s, query) }))
    .filter((r) => r.matched);

  const visible = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setVisibleCount(PAGE_SIZE);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (id: string) => {
      loadSession(id);
      onClose();
    },
    [loadSession, onClose]
  );

  if (!open) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl bg-card shadow-xl border border-border flex flex-col overflow-hidden"
        style={{ maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search your chats…"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
          />
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {savedSessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              No chats yet. Start a conversation!
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">
              No chats match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul>
              {visible.map(({ session, snippet }) => (
                <li key={session.id}>
                  <button
                    onClick={() => handleSelect(session.id)}
                    className="w-full text-left px-4 py-3 hover:bg-teal-light transition-colors flex items-start gap-3 group"
                  >
                    <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-teal opacity-70 group-hover:opacity-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {session.title || "Untitled chat"}
                      </p>
                      {snippet ? (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{snippet}</p>
                      ) : (
                        <p className="text-xs text-text-muted mt-0.5">
                          {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_MORE)}
                className="w-full text-sm text-teal-dark font-medium hover:underline"
              >
                View More ({results.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        {/* Footer count */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-border text-xs text-text-muted">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
