"use client";

import type { JournalEntry } from "@/types";
import JournalListItem from "./JournalListItem";
import { Search, Plus } from "lucide-react";
import { isEntryThisWeek } from "@/lib/journal-utils";
import { cn } from "@/lib/utils";

// draft shape from context — text preview only
export interface DraftPreview {
  text?: string;
}

interface Props {
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  draftPreview: DraftPreview | null;
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectEntry: (id: string) => void;
  onSelectDraft: () => void;
  onNewEntry: () => void;
  showNewButton: boolean;
}

export default function JournalSidebar({
  entries,
  filteredEntries,
  draftPreview,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectEntry,
  onSelectDraft,
  onNewEntry,
  showNewButton,
}: Props) {
  const thisWeek = filteredEntries.filter((e) => isEntryThisWeek(e.createdAt));
  const earlier = filteredEntries.filter((e) => !isEntryThisWeek(e.createdAt));
  const draftSelected = selectedId === "__draft__";

  return (
    <aside className="order-1 flex h-full min-h-0 w-full flex-col border-b border-border bg-card md:order-2 md:w-[min(100%,320px)] md:shrink-0 md:border-b-0 md:border-l">
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text">Journal</h2>
          {showNewButton && (
            <button
              type="button"
              onClick={onNewEntry}
              className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries…"
            className="w-full rounded-xl border border-border bg-bg py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {draftPreview && (
          <section>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Drafts
            </h3>
            <button
              type="button"
              onClick={onSelectDraft}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                draftSelected
                  ? "border-teal bg-teal-light shadow-sm"
                  : "border-border bg-muted/40 hover:border-teal/40"
              )}
            >
              <p className="text-sm font-medium text-text">Untitled</p>
              <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                {(draftPreview.text || "").trim() || "Empty draft…"}
              </p>
            </button>
          </section>
        )}

        {entries.length === 0 && !draftPreview ? (
          <p className="px-1 text-center text-sm text-text-muted">No entries yet.</p>
        ) : filteredEntries.length === 0 ? (
          <p className="px-1 text-center text-sm text-text-muted">No matches.</p>
        ) : (
          <>
            {thisWeek.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  This week
                </h3>
                <ul className="space-y-1.5">
                  {thisWeek.map((e) => (
                    <li key={e.id}>
                      <JournalListItem
                        entry={e}
                        selected={selectedId === e.id}
                        onSelect={() => onSelectEntry(e.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {earlier.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Earlier
                </h3>
                <ul className="space-y-1.5">
                  {earlier.map((e) => (
                    <li key={e.id}>
                      <JournalListItem
                        entry={e}
                        selected={selectedId === e.id}
                        onSelect={() => onSelectEntry(e.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
