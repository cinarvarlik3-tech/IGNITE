"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { MoodKey } from "@/types";
import MoodSelector from "./MoodSelector";
import { analyzeJournalEntry } from "@/lib/journal-analyze";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FlowStep =
  | "q1"
  | "q2"
  | "q3"
  | "mood"
  | "morePrompt"
  | "moreWrite"
  | "followUp";

function buildEntryText(
  highlight: string,
  struggle: string,
  troubles: string,
  moreDetail?: string
): string {
  let t = `Highlight: ${highlight.trim()}\nStruggled with: ${struggle.trim()}\nTroubles: ${troubles.trim()}`;
  if (moreDetail?.trim()) {
    t += `\n\nMore detail: ${moreDetail.trim()}`;
  }
  return t;
}

interface Props {
  open: boolean;
  onDismiss: () => void;
  onFlowCompleted: () => void;
  onEntrySaved?: (id: string) => void;
}

export default function JournalDailyFlowModal({
  open,
  onDismiss,
  onFlowCompleted,
  onEntrySaved,
}: Props) {
  const { saveEntry, startChatWithJournalSummary, consumeShards } = useApp();
  const [savingEntry, setSavingEntry] = useState(false);
  const [step, setStep] = useState<FlowStep>("q1");
  const [highlight, setHighlight] = useState("");
  const [struggle, setStruggle] = useState("");
  const [troubles, setTroubles] = useState("");
  const [mood, setMood] = useState<MoodKey>("reflective");
  const [moreDetail, setMoreDetail] = useState("");
  const [savedSummary, setSavedSummary] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("q1");
      setHighlight("");
      setStruggle("");
      setTroubles("");
      setMood("reflective");
      setMoreDetail("");
      setSavedSummary("");
    }
  }, [open]);

  const finishFollowUpNo = () => {
    onFlowCompleted();
  };

  const finishFollowUpYes = () => {
    startChatWithJournalSummary(savedSummary);
    onFlowCompleted();
  };

  const persistEntry = async (body: string) => {
    setSavingEntry(true);
    try {
      let analysis;
      try {
        analysis = await analyzeJournalEntry(body, mood);
        consumeShards(2);
      } catch (e) {
        console.error(e);
      }
      const id = saveEntry(body, mood, analysis ? { analysis } : undefined);
      setSavedSummary(body);
      onEntrySaved?.(id);
      setStep("followUp");
    } finally {
      setSavingEntry(false);
    }
  };

  const saveWithoutMoreDetail = () => {
    void persistEntry(buildEntryText(highlight, struggle, troubles));
  };

  const saveWithMoreDetail = () => {
    if (!moreDetail.trim()) return;
    void persistEntry(
      buildEntryText(highlight, struggle, troubles, moreDetail)
    );
  };

  const stepLabel =
    step === "q1"
      ? "1 / 5"
      : step === "q2"
        ? "2 / 5"
        : step === "q3"
          ? "3 / 5"
          : step === "mood"
            ? "4 / 5"
            : step === "morePrompt" || step === "moreWrite"
              ? "5 / 5"
              : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (savingEntry) return;
            if (e.target === e.currentTarget) onDismiss();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Journal check-in"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onDismiss}
              disabled={savingEntry}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text disabled:pointer-events-none disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {step !== "followUp" && (
              <p className="mb-1 text-xs font-medium text-text-muted">{stepLabel}</p>
            )}

            <AnimatePresence mode="wait">
              {step === "q1" && (
                <motion.div
                  key="q1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    What was the highlight of your day?
                  </h2>
                  <textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    rows={4}
                    className="mt-4 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="Your answer…"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!highlight.trim()}
                      onClick={() => setStep("q2")}
                      className="rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "q2" && (
                <motion.div
                  key="q2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    What did you struggle with today?
                  </h2>
                  <textarea
                    value={struggle}
                    onChange={(e) => setStruggle(e.target.value)}
                    rows={4}
                    className="mt-4 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="Your answer…"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!struggle.trim()}
                      onClick={() => setStep("q3")}
                      className="rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "q3" && (
                <motion.div
                  key="q3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    Is there anything that troubles you about today?
                  </h2>
                  <textarea
                    value={troubles}
                    onChange={(e) => setTroubles(e.target.value)}
                    rows={4}
                    className="mt-4 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="Your answer…"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!troubles.trim()}
                      onClick={() => setStep("mood")}
                      className="rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "mood" && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    How are you feeling?
                  </h2>
                  <div className="mt-4">
                    <MoodSelector selected={mood} onSelect={setMood} />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep("morePrompt")}
                      className="rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "morePrompt" && (
                <motion.div
                  key="morePrompt"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    Would you like to write in more detail?
                  </h2>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={savingEntry}
                      onClick={saveWithoutMoreDetail}
                      className="order-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50 disabled:opacity-50 sm:order-1"
                    >
                      {savingEntry ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "No"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={savingEntry}
                      onClick={() => setStep("moreWrite")}
                      className="order-1 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:opacity-50 sm:order-2"
                    >
                      Yes
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "moreWrite" && (
                <motion.div
                  key="moreWrite"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    Add more detail
                  </h2>
                  <textarea
                    value={moreDetail}
                    onChange={(e) => setMoreDetail(e.target.value)}
                    rows={6}
                    className="mt-4 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    placeholder="Write as much as you’d like…"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!moreDetail.trim() || savingEntry}
                      onClick={saveWithMoreDetail}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingEntry ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save entry"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "followUp" && (
                <motion.div
                  key="followUp"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="pr-10 text-lg font-semibold text-text">
                    Anything you want to talk about?
                  </h2>
                  <p className="mt-2 text-sm text-text-muted">
                    Your journal entry has been saved.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={finishFollowUpNo}
                      className="order-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50 sm:order-1"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={finishFollowUpYes}
                      className="order-1 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-teal-dark sm:order-2"
                    >
                      Yes
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
