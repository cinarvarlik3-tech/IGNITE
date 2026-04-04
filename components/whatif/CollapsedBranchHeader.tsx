"use client";

import type { Branch } from "@/types";
import { useApp } from "@/context/AppContext";
import { getEmotionColor, LIKELIHOOD_STYLES } from "@/constants/theme";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  branch: Branch;
  variant?: "comfortable" | "compact";
  onDeleteOutcome?: (nodeId: string) => void;
  descendantCount?: number;
}

export default function CollapsedBranchHeader({
  branch,
  variant = "comfortable",
  onDeleteOutcome,
  descendantCount = 0,
}: Props) {
  const { selectBranch } = useApp();
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

  const activate = () => selectBranch(branch);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative w-full min-w-0 cursor-pointer border border-border bg-muted/40 text-left transition-colors hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "rounded-md px-1.5 py-1.5" : "rounded-lg px-2 py-2"
      )}
      onClick={activate}
      onKeyDown={onKeyDown}
      style={{ borderLeftWidth: "3px", borderLeftColor: emotionColor }}
      title="Show this path"
      aria-label={`${branch.title}. Expand this path.`}
    >
      {onDeleteOutcome && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute right-0.5 top-0.5 z-10 rounded p-0.5 text-text-muted/80 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove outcome ${branch.title}`}
        >
          <Trash2 className="h-2.5 w-2.5" strokeWidth={2} />
        </button>
      )}
      <div className={cn("pr-5", compact ? "" : "pr-6")}>
        <p
          className={cn(
            "line-clamp-4 font-semibold leading-tight text-text",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {branch.title}
        </p>
        <div className="mt-1 flex flex-wrap gap-0.5">
          <span
            className="inline-block max-w-full truncate rounded-full px-1 py-0 text-[9px] font-medium capitalize"
            style={{
              backgroundColor: emotionColor + "25",
              color: emotionColor,
            }}
          >
            {branch.emotion}
          </span>
          <span
            className={`rounded-full px-1 py-0 text-[9px] font-medium ${likelihoodClass}`}
          >
            {branch.likelihood}
          </span>
        </div>
      </div>
    </div>
  );
}
