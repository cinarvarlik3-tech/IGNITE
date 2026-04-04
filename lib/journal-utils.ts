import type { JournalEntry } from "@/types";

const TITLE_MAX = 72;

/** Title for list/header: explicit displayTitle, else first line / snippet of body. */
export function getJournalDisplayTitle(entry: JournalEntry): string {
  if (entry.displayTitle?.trim()) return entry.displayTitle.trim();
  return deriveDisplayTitle(entry.text);
}

export function deriveDisplayTitle(text: string): string {
  const t = text.trim();
  if (!t) return "Untitled";
  const firstLine = t.split(/\r?\n/).find((l) => l.trim()) ?? t;
  const cleaned = firstLine.trim().replace(/\s+/g, " ");
  if (cleaned.length <= TITLE_MAX) return cleaned;
  return cleaned.slice(0, TITLE_MAX - 1).trimEnd() + "…";
}

/** e.g. Saturday, April 4 @ 11:22 PM */
export function formatJournalDetailDate(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "long" });
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${weekday}, ${month} ${day}${suffix} @ ${time}`;
}

function startOfWeekLocal(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day;
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isEntryThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const start = startOfWeekLocal(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export function filterJournalEntries(entries: JournalEntry[], query: string): JournalEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => {
    const title = getJournalDisplayTitle(e).toLowerCase();
    return title.includes(q) || e.text.toLowerCase().includes(q);
  });
}
