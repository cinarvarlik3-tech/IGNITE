"use client";

import type { JournalEntry } from "@/types";
import { Link } from "lucide-react";

interface Props {
  entry: JournalEntry;
}

export default function JournalEntryView({ entry }: Props) {
  return (
    <div className="space-y-4">
      {entry.linkedBranch && (
        <div className="flex items-center gap-2 rounded-xl bg-lavender-light px-3 py-2">
          <Link className="h-3.5 w-3.5 shrink-0 text-lavender" />
          <span className="text-xs text-lavender">
            Linked to: <strong>{entry.linkedBranch.title}</strong>
          </span>
        </div>
      )}
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text">{entry.text}</p>
    </div>
  );
}
