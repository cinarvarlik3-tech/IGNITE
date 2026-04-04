"use client";

import { useState } from "react";
import type { Branch } from "@/types";
import { useApp } from "@/context/AppContext";
import { getEmotionColor, LIKELIHOOD_STYLES } from "@/constants/theme";
import {
  ChevronDown,
  ChevronUp,
  PenLine,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  branch: Branch;
  variant?: "comfortable" | "compact";
  onDeleteOutcome?: (nodeId: string) => void;
  descendantCount?: number;
}

export default function BranchCard({
  branch,
  variant = "comfortable",
  onDeleteOutcome,
  descendantCount = 0,
}: Props) {
  const { reflectOnBranch, selectBranch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const emotionColor = getEmotionColor(branch.emotion);
  const likelihoodClass =
    LIKELIHOOD_STYLES[branch.likelihood] || LIKELIHOOD_STYLES.possible;
  const compact = variant === "compact";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteOutcome) return;
    const total = 1 + descendantCount;
    const detail =
      descendantCount > 0
        ? ` This removes ${total} outcomes in total — this step and every nested outcome beneath it.`
        : " This removes this outcome.";
    const ok = window.confirm(
      `Remove “${branch.title}”?${detail} This cannot be undone.`
    );
    if (ok) onDeleteOutcome(branch.id);
  };

  return (
    <div
      className={cn(
        "group relative w-full min-w-0 cursor-pointer border border-border bg-card transition-all hover:shadow-md",
        compact ? "rounded-lg" : "rounded-xl"
      )}
      onClick={() => {
        selectBranch(branch);
        setExpanded((e) => !e);
      }}
      style={{ borderLeftWidth: "3px", borderLeftColor: emotionColor }}
    >
      {onDeleteOutcome && (
        <button
          type="button"
          onClick={handleDelete}
          title="Remove outcome and nested steps"
          className="absolute right-1.5 top-1.5 z-10 rounded-md p-1 text-text-muted/80 transition-all hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove outcome ${branch.title}`}
        >
          <Trash2 className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
      <div className={cn("pr-7", compact ? "p-2" : "p-3")}>
        <div className="mb-1 flex items-start justify-between gap-1">
          <h4 className="min-w-0 flex-1 text-base font-semibold leading-snug text-text break-words">
            {branch.title}
          </h4>
          {expanded ? (
            <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          ) : (
            <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          )}
        </div>

        <p
          className={cn(
            "leading-snug text-text-muted",
            compact ? "text-[10px] leading-tight" : "text-xs",
            !expanded && "line-clamp-2"
          )}
        >
          {branch.description}
        </p>

        <div className={cn("flex flex-wrap items-center gap-1", compact ? "mt-1" : "mt-2")}>
          <span
            className="inline-flex max-w-full items-center gap-0.5 truncate rounded-full px-1.5 py-0 text-[10px] font-medium capitalize"
            style={{
              backgroundColor: emotionColor + "20",
              color: emotionColor,
            }}
          >
            {branch.emotion}
          </span>
          <span
            className={`rounded-full px-1.5 py-0 text-[10px] font-medium ${likelihoodClass}`}
          >
            {branch.likelihood}
          </span>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "flex gap-1.5 rounded-lg bg-bg",
                  compact ? "mt-1.5 p-1.5" : "mt-2 p-2"
                )}
              >
                <Lightbulb
                  className={cn(
                    "shrink-0 text-lavender",
                    compact ? "mt-px h-3 w-3" : "mt-0.5 h-3.5 w-3.5"
                  )}
                />
                <p
                  className={cn(
                    "leading-snug italic text-text-muted",
                    compact ? "text-[10px] leading-tight" : "text-xs"
                  )}
                >
                  {branch.insight}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reflectOnBranch(branch);
                }}
                className={cn(
                  "flex w-full items-center justify-center gap-1 rounded-lg bg-teal-light font-medium text-teal-dark transition-colors hover:bg-teal hover:text-white",
                  compact ? "mt-1.5 py-1.5 text-[11px]" : "mt-2 gap-1.5 py-2 text-xs"
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
                Reflect on this
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
