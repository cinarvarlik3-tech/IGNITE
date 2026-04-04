"use client";

import type { TreeRoot } from "@/types";
import { getEmotionColor } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

interface Props {
  root: TreeRoot;
  /** Tighter layout so the tree fits the main panel without scrolling */
  slim?: boolean;
}

export default function RootNode({ root, slim = false }: Props) {
  const emotionColor = getEmotionColor(root.emotion);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-md",
        slim ? "max-w-full px-3 py-2.5" : "p-6"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center gap-2", slim ? "mb-1.5" : "mb-3")}>
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: emotionColor }}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          What actually happened
        </span>
      </div>

      {/* Title — keep prominent; wrap naturally */}
      <h3
        className={cn(
          "font-semibold leading-snug text-text break-words",
          slim ? "mb-1 text-lg" : "mb-2 text-lg"
        )}
      >
        {root.title}
      </h3>

      {/* Description — shorter copy in slim mode */}
      <p
        className={cn(
          "leading-snug text-text-muted",
          slim
            ? "line-clamp-2 text-xs"
            : "text-sm leading-relaxed"
        )}
      >
        {root.description}
      </p>

      {/* Emotion tag */}
      <div className={cn("flex items-center gap-1.5", slim ? "mt-1.5" : "mt-4")}>
        <Circle
          className="h-3 w-3"
          fill={emotionColor}
          stroke={emotionColor}
        />
        <span className="text-xs font-medium capitalize" style={{ color: emotionColor }}>
          {root.emotion}
        </span>
      </div>
    </div>
  );
}
