"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onDismiss: () => void;
  onChooseFree: () => void;
  onChooseGuided: () => void;
}

export default function JournalNewEntryModeModal({
  open,
  onDismiss,
  onChooseFree,
  onChooseGuided,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onDismiss();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-mode-choice-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onDismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="journal-mode-choice-title"
              className="pr-10 text-lg font-semibold text-text"
            >
              Would you like a free journal or a guided journal?
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Free writing opens the editor right away. Guided walks you through
              a few questions first.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-stretch">
              <button
                type="button"
                onClick={onChooseFree}
                className="flex-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition-colors hover:bg-gray-50"
              >
                Free
              </button>
              <button
                type="button"
                onClick={onChooseGuided}
                className="flex-1 rounded-xl bg-teal px-5 py-3 text-sm font-medium text-white transition-all hover:bg-teal-dark"
              >
                Guided
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
