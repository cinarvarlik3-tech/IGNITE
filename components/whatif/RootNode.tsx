"use client";

import type { TreeRoot } from "@/types";
import { getEmotionColor } from "@/constants/theme";
import { Circle } from "lucide-react";

interface Props {
  root: TreeRoot;
}

export default function RootNode({ root }: Props) {
  const emotionColor = getEmotionColor(root.emotion);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: emotionColor }}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          What actually happened
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-text">{root.title}</h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-text-muted">
        {root.description}
      </p>

      {/* Emotion tag */}
      <div className="mt-4 flex items-center gap-1.5">
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
