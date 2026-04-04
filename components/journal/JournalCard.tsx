"use client";

import { useState } from "react";
import type { JournalEntry } from "@/types";
import { useApp } from "@/context/AppContext";
import { MOODS } from "@/constants/theme";
import { formatRelative } from "@/lib/utils";
import { ChevronDown, ChevronUp, Trash2, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  entry: JournalEntry;
}

export default function JournalCard({ entry }: Props) {
  const { deleteEntry } = useApp();
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS[entry.mood];

  return (
    <div
      className="cursor-pointer rounded-2xl border border-border bg-card transition-all hover:shadow-sm"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Mood badge */}
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: mood?.color + "20" }}
            >
              {mood?.emoji}
            </span>

            <div>
              <span className="text-sm font-medium capitalize text-text">
                {mood?.label}
              </span>
              <p className="text-xs text-text-muted">
                {formatRelative(entry.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {entry.linkedBranch && (
              <Link className="h-3.5 w-3.5 text-lavender" />
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </div>

        {/* Preview text (collapsed) */}
        {!expanded && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
            {entry.text}
          </p>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Linked branch */}
              {entry.linkedBranch && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-lavender-light px-3 py-2">
                  <Link className="h-3 w-3 text-lavender" />
                  <span className="text-xs text-lavender">
                    Linked to: {entry.linkedBranch.title}
                  </span>
                </div>
              )}

              {/* Full text */}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text">
                {entry.text}
              </p>

              {/* Delete */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEntry(entry.id);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
