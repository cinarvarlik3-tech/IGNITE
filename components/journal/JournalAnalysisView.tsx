"use client";

import { useState, useEffect } from "react";
import type { JournalEntry, JournalEntryAnalysis } from "@/types";
import { Share2, Loader2 } from "lucide-react";
import { analyzeJournalEntry } from "@/lib/journal-analyze";

interface Props {
  entry: JournalEntry;
  onUpdateAnalysis: (analysis: JournalEntryAnalysis) => void;
  onConsumeShards: (amount?: number) => void;
}

export default function JournalAnalysisView({
  entry,
  onUpdateAnalysis,
  onConsumeShards,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [feelings, setFeelings] = useState<string[]>(entry.analysis?.feelings ?? []);
  const [people, setPeople] = useState<string[]>(entry.analysis?.people ?? []);
  const [personInput, setPersonInput] = useState("");

  useEffect(() => {
    setFeelings(entry.analysis?.feelings ?? []);
    setPeople(entry.analysis?.people ?? []);
  }, [entry.id, entry.analysis]);

  const removeFeeling = (label: string) => {
    if (!entry.analysis) return;
    const nextFeelings = feelings.filter((f) => f !== label);
    setFeelings(nextFeelings);
    onUpdateAnalysis({ ...entry.analysis, feelings: nextFeelings, people });
  };

  const addPerson = () => {
    if (!entry.analysis) return;
    const p = personInput.trim();
    if (!p) return;
    const nextPeople = [...people, p];
    setPeople(nextPeople);
    setPersonInput("");
    onUpdateAnalysis({ ...entry.analysis, feelings, people: nextPeople });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const analysis = await analyzeJournalEntry(entry.text, entry.mood);
      onConsumeShards(2);
      onUpdateAnalysis(analysis);
      setFeelings(analysis.feelings);
      setPeople(analysis.people);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyHaiku = async () => {
    if (!entry.analysis?.haiku) return;
    try {
      await navigator.clipboard.writeText(entry.analysis.haiku);
    } catch {
      /* ignore */
    }
  };

  if (!entry.analysis) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-12 text-center">
        <p className="max-w-sm text-sm text-text-muted">
          Generate a short reflection, haiku, and themes from this entry.
        </p>
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate insights"
          )}
        </button>
      </div>
    );
  }

  const { reflection, haiku } = entry.analysis;

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(reflection);
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-muted hover:text-text"
          aria-label="Copy reflection"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Entry reflection
        </h3>
        <div className="pr-8 text-sm leading-relaxed text-text">
          {reflection.split(/\n\n+/).map((para, i) => (
            <p key={i} className="mb-3 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            <span aria-hidden className="text-sm">
              🏆
            </span>
            Haiku
          </h3>
          <button
            type="button"
            onClick={() => void copyHaiku()}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-muted"
            aria-label="Copy haiku"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm italic leading-relaxed text-text">
          {haiku}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Feelings
        </h3>
        <div className="flex flex-wrap gap-2">
          {feelings.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal-dark"
            >
              {f}
              <button
                type="button"
                onClick={() => removeFeeling(f)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-teal/20"
                aria-label={`Remove ${f}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            People
          </h3>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById(`journal-people-input-${entry.id}`);
              el?.focus();
            }}
            className="text-sm font-medium text-teal-dark transition-colors hover:text-teal"
          >
            + Add
          </button>
        </div>
        <ul className="mb-2 space-y-1 text-sm text-text">
          {people.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            id={`journal-people-input-${entry.id}`}
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPerson())}
            placeholder="Add someone…"
            className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          />
          <button
            type="button"
            onClick={addPerson}
            className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-medium text-teal-dark transition-colors hover:bg-teal-light"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
