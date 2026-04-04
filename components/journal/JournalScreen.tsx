"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, X, Loader2 } from "lucide-react";
import MoodSelector from "./MoodSelector";
import JournalDailyFlowModal from "./JournalDailyFlowModal";
import JournalNewEntryModeModal from "./JournalNewEntryModeModal";
import JournalSidebar from "./JournalSidebar";
import JournalDetailPanel from "./JournalDetailPanel";
import type { MoodKey } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { filterJournalEntries } from "@/lib/journal-utils";
import { analyzeJournalEntry } from "@/lib/journal-analyze";

export default function JournalScreen() {
  const {
    state,
    saveEntry,
    updateJournalEntry,
    consumeShards,
    clearDraft,
    deleteEntry,
  } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [dailyFlowOpen, setDailyFlowOpen] = useState(false);
  const [modeChoiceOpen, setModeChoiceOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [mood, setMood] = useState<MoodKey>("reflective");
  const [saveBusy, setSaveBusy] = useState(false);

  const filteredEntries = useMemo(
    () => filterJournalEntries(state.entries, searchQuery),
    [state.entries, searchQuery]
  );

  const selectedEntry =
    selectedEntryId && selectedEntryId !== "__draft__"
      ? state.entries.find((e) => e.id === selectedEntryId) ?? null
      : null;

  useEffect(() => {
    if (state.draftEntry) {
      setText(state.draftEntry.text || "");
      setIsEditing(true);
      setSelectedEntryId("__draft__");
    }
  }, [state.draftEntry]);

  useEffect(() => {
    if (isEditing) return;
    if (state.entries.length === 0) {
      if (selectedEntryId !== "__draft__") setSelectedEntryId(null);
      return;
    }
    const exists =
      selectedEntryId &&
      selectedEntryId !== "__draft__" &&
      state.entries.some((e) => e.id === selectedEntryId);
    if (!exists && selectedEntryId !== "__draft__") {
      setSelectedEntryId(state.entries[0]!.id);
    }
  }, [state.entries, selectedEntryId, isEditing]);

  const handleSave = async () => {
    if (!text.trim() || saveBusy) return;
    setSaveBusy(true);
    try {
      const trimmed = text.trim();
      let analysis;
      try {
        analysis = await analyzeJournalEntry(trimmed, mood);
        consumeShards(2);
      } catch (err) {
        console.error(err);
      }
      const id = saveEntry(trimmed, mood, analysis ? { analysis } : undefined);
      setText("");
      setMood("reflective");
      setIsEditing(false);
      setSelectedEntryId(id);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setMood("reflective");
    setIsEditing(false);
    clearDraft();
    setSelectedEntryId(state.entries[0]?.id ?? null);
  };

  const openNewEntry = () => {
    if (state.draftEntry) {
      setIsEditing(true);
      setSelectedEntryId("__draft__");
      return;
    }
    setModeChoiceOpen(true);
  };

  const handleModeChoiceDismiss = () => {
    setModeChoiceOpen(false);
  };

  const handleChooseGuided = () => {
    setModeChoiceOpen(false);
    setDailyFlowOpen(true);
  };

  const handleChooseFree = () => {
    setModeChoiceOpen(false);
    setText("");
    setMood("reflective");
    setIsEditing(true);
    setSelectedEntryId(null);
  };

  const handleDailyFlowDismiss = () => {
    setDailyFlowOpen(false);
  };

  const handleDailyFlowCompleted = () => {
    setDailyFlowOpen(false);
  };

  const handleSelectEntry = (id: string) => {
    setSelectedEntryId(id);
    setIsEditing(false);
  };

  const handleSelectDraft = () => {
    if (state.draftEntry) {
      setText(state.draftEntry.text || "");
    }
    setIsEditing(true);
    setSelectedEntryId("__draft__");
  };

  const showEmptyGlobally =
    state.entries.length === 0 &&
    !state.draftEntry &&
    !isEditing &&
    !dailyFlowOpen &&
    !modeChoiceOpen;

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg md:order-1">
        <JournalNewEntryModeModal
          open={modeChoiceOpen}
          onDismiss={handleModeChoiceDismiss}
          onChooseFree={handleChooseFree}
          onChooseGuided={handleChooseGuided}
        />

        <JournalDailyFlowModal
          open={dailyFlowOpen}
          onDismiss={handleDailyFlowDismiss}
          onFlowCompleted={handleDailyFlowCompleted}
          onEntrySaved={(id) => setSelectedEntryId(id)}
        />

        {isEditing ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto w-full max-w-2xl"
              >
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  {state.draftEntry?.linkedBranch && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-lavender-light px-3 py-2">
                      <span className="text-xs text-lavender">
                        Reflecting on:{" "}
                        <strong>{state.draftEntry.linkedBranch.title}</strong>
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-text-muted">
                      How are you feeling?
                    </label>
                    <MoodSelector selected={mood} onSelect={setMood} />
                  </div>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind right now?"
                    rows={8}
                    className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                  />

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saveBusy}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-text-muted transition-colors hover:bg-gray-100 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={!text.trim() || saveBusy}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saveBusy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save Entry"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : selectedEntry ? (
          <JournalDetailPanel
            entry={selectedEntry}
            onDelete={deleteEntry}
            onUpdateAnalysis={(id, analysis) => updateJournalEntry(id, { analysis })}
            onConsumeShards={consumeShards}
          />
        ) : showEmptyGlobally ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-2xl bg-lavender-light p-4">
              <BookOpen className="h-8 w-8 text-lavender" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text">
              Your reflections will appear here
            </h3>
            <p className="max-w-sm text-sm text-text-muted">
              Create a journal entry after exploring your What-If tree, or write freely anytime.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-text-muted">
            <p className="text-sm">Select an entry or start a new one.</p>
          </div>
        )}
      </div>

      <JournalSidebar
        entries={state.entries}
        filteredEntries={filteredEntries}
        draftPreview={state.draftEntry ? { text: state.draftEntry.text } : null}
        selectedId={selectedEntryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectEntry={handleSelectEntry}
        onSelectDraft={handleSelectDraft}
        onNewEntry={openNewEntry}
        showNewButton={!isEditing && !dailyFlowOpen && !modeChoiceOpen}
      />
    </div>
  );
}
