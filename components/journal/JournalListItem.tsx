"use client";

import type { JournalEntry } from "@/types";
import { MOODS } from "@/constants/theme";
import { cn, formatRelative } from "@/lib/utils";
import { getJournalDisplayTitle } from "@/lib/journal-utils";
import { Link } from "lucide-react";

interface Props {
  entry: JournalEntry;
  selected: boolean;
  onSelect: () => void;
}

export default function JournalListItem({ entry, selected, onSelect }: Props) {
  const mood = MOODS[entry.mood];
  const title = getJournalDisplayTitle(entry);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-teal bg-teal-light shadow-sm"
          : "border-border bg-card hover:border-teal/30 hover:bg-muted/50"
      )}
    >
      <div className="flex gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: (mood?.color ?? "#9CA3AF") + "25" }}
        >
          {mood?.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-text">{title}</p>
            {entry.linkedBranch && (
              <Link className="h-3.5 w-3.5 shrink-0 text-lavender" aria-hidden />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
            {entry.text}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">{formatRelative(entry.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}
