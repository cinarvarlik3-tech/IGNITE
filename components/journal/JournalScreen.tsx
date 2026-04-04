"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, Plus, X } from "lucide-react";
import MoodSelector from "./MoodSelector";
import JournalCard from "./JournalCard";
import type { MoodKey } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function JournalScreen() {
  const { state, saveEntry, clearDraft } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<MoodKey>("reflective");

  // Auto-open editor when draft arrives (from "Reflect on this")
  useEffect(() => {
    if (state.draftEntry) {
      setText(state.draftEntry.text || "");
      setIsEditing(true);
    }
  }, [state.draftEntry]);

  const handleSave = () => {
    if (!text.trim()) return;
    saveEntry(text.trim(), mood);
    setText("");
    setMood("reflective");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText("");
    setMood("reflective");
    setIsEditing(false);
    clearDraft();
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Journal</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          )}
        </div>

        {/* Editor */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                {/* Linked branch indicator */}
                {state.draftEntry?.linkedBranch && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-lavender-light px-3 py-2">
                    <span className="text-xs text-lavender">
                      Reflecting on:{" "}
                      <strong>{state.draftEntry.linkedBranch.title}</strong>
                    </span>
                  </div>
                )}

                {/* Mood selector */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-text-muted">
                    How are you feeling?
                  </label>
                  <MoodSelector selected={mood} onSelect={setMood} />
                </div>

                {/* Text area */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's on your mind right now?"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-[15px] leading-relaxed text-text placeholder:text-text-muted focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                />

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-text-muted transition-colors hover:bg-gray-100"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!text.trim()}
                    className="rounded-xl bg-teal px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entry list */}
        {state.entries.length === 0 && !isEditing ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div className="mb-4 rounded-2xl bg-lavender-light p-4">
              <BookOpen className="h-8 w-8 text-lavender" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text">
              Your reflections will appear here
            </h3>
            <p className="max-w-sm text-sm text-text-muted">
              Create a journal entry after exploring your What-If tree, or
              write freely anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {state.entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <JournalCard entry={entry} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
