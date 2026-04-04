"use client";

import { useState } from "react";
import type { Branch } from "@/types";
import { useApp } from "@/context/AppContext";
import { getEmotionColor, LIKELIHOOD_STYLES } from "@/constants/theme";
import { ChevronDown, ChevronUp, PenLine, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  branch: Branch;
}

export default function BranchCard({ branch }: Props) {
  const { reflectOnBranch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const emotionColor = getEmotionColor(branch.emotion);
  const likelihoodClass = LIKELIHOOD_STYLES[branch.likelihood] || LIKELIHOOD_STYLES.possible;

  return (
    <div
      className="group cursor-pointer rounded-2xl border border-border bg-card transition-all hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
      style={{ borderLeftWidth: "4px", borderLeftColor: emotionColor }}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-base font-semibold text-text">{branch.title}</h4>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
          )}
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed text-text-muted ${!expanded ? "line-clamp-2" : ""}`}>
          {branch.description}
        </p>

        {/* Tags row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Emotion badge */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            style={{
              backgroundColor: emotionColor + "20",
              color: emotionColor,
            }}
          >
            {branch.emotion}
          </span>

          {/* Likelihood */}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${likelihoodClass}`}>
            {branch.likelihood}
          </span>
        </div>

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
              {/* Insight */}
              <div className="mt-4 flex gap-2 rounded-xl bg-bg p-3">
                <Lightbulb className="h-4 w-4 shrink-0 text-lavender mt-0.5" />
                <p className="text-sm italic text-text-muted">
                  {branch.insight}
                </p>
              </div>

              {/* Reflect CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reflectOnBranch(branch);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-light py-2.5 text-sm font-medium text-teal-dark transition-colors hover:bg-teal hover:text-white"
              >
                <PenLine className="h-4 w-4" />
                Reflect on this
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
