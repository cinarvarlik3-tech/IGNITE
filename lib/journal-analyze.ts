import type { JournalEntryAnalysis, MoodKey } from "@/types";

export async function analyzeJournalEntry(
  text: string,
  mood: MoodKey
): Promise<JournalEntryAnalysis> {
  const res = await fetch("/api/journal/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mood }),
  });

  if (!res.ok) {
    throw new Error(`Journal analyze failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    reflection: String(data.reflection ?? ""),
    haiku: String(data.haiku ?? ""),
    feelings: Array.isArray(data.feelings) ? data.feelings : [],
    people: Array.isArray(data.people) ? data.people : [],
    generatedAt: String(data.generatedAt ?? new Date().toISOString()),
  };
}
