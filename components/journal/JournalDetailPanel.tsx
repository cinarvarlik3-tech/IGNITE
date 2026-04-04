"use client";

import { useState, useRef, useEffect } from "react";
import type { JournalEntry, JournalEntryAnalysis } from "@/types";
import { MOODS } from "@/constants/theme";
import { getJournalDisplayTitle, formatJournalDetailDate } from "@/lib/journal-utils";
import { Share2, MoreVertical, Trash2 } from "lucide-react";
import JournalAnalysisView from "./JournalAnalysisView";
import JournalEntryView from "./JournalEntryView";
import { cn } from "@/lib/utils";

type Tab = "analysis" | "entry";

interface Props {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  onUpdateAnalysis: (id: string, analysis: JournalEntryAnalysis) => void;
  onConsumeShards: (amount?: number) => void;
}

export default function JournalDetailPanel({
  entry,
  onDelete,
  onUpdateAnalysis,
  onConsumeShards,
}: Props) {
  const [tab, setTab] = useState<Tab>("analysis");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mood = MOODS[entry.mood];
  const title = getJournalDisplayTitle(entry);

  useEffect(() => {
    setTab("analysis");
  }, [entry.id]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const shareEntry = async () => {
    const body = `${title}\n\n${entry.text}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: body });
      } else {
        await navigator.clipboard.writeText(body);
      }
    } catch {
      /* user cancel or clipboard */
    }
  };

  /** ISO A4 portrait ratio; size fits viewport height with a readable max width */
  const pageClass =
    "mx-auto flex w-[min(672px,100%,calc(min(85vh,55.2rem)*210/297))] max-h-[min(85vh,55.2rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_8px_32px_rgba(45,49,66,0.1)]";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto overflow-x-hidden p-4 pb-6 md:p-6 md:pb-10">
        <div className={pageClass} style={{ aspectRatio: "210 / 297" }}>
          <header className="shrink-0 border-b border-border px-5 pb-0 pt-5 md:px-7 md:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h1 className="text-xl font-bold leading-snug tracking-tight text-text md:text-2xl">
                  <span className="mr-2">{mood?.emoji}</span>
                  {title}
                </h1>
                <p className="mt-1.5 text-sm text-text-muted">
                  {formatJournalDetailDate(entry.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => void shareEntry()}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-muted hover:text-text"
                  aria-label="Share entry"
                >
                  <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((o) => !o);
                    }}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-muted hover:text-text"
                    aria-label="More"
                  >
                    <MoreVertical className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(entry.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-8 border-b border-border">
              <button
                type="button"
                onClick={() => setTab("analysis")}
                className={cn(
                  "-mb-px border-b-[3px] pb-2.5 text-sm font-semibold transition-colors",
                  tab === "analysis"
                    ? "border-text text-text"
                    : "border-transparent text-text-muted hover:text-text"
                )}
              >
                Analysis
              </button>
              <button
                type="button"
                onClick={() => setTab("entry")}
                className={cn(
                  "-mb-px border-b-[3px] pb-2.5 text-sm font-semibold transition-colors",
                  tab === "entry"
                    ? "border-text text-text"
                    : "border-transparent text-text-muted hover:text-text"
                )}
              >
                Entry
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6">
            {tab === "analysis" ? (
              <JournalAnalysisView
                entry={entry}
                onUpdateAnalysis={(a) => onUpdateAnalysis(entry.id, a)}
                onConsumeShards={onConsumeShards}
              />
            ) : (
              <JournalEntryView entry={entry} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
