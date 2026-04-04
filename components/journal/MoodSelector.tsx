"use client";

import { MOODS } from "@/constants/theme";
import type { MoodKey } from "@/types";

interface Props {
  selected: MoodKey;
  onSelect: (mood: MoodKey) => void;
}

export default function MoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(MOODS) as [MoodKey, (typeof MOODS)[MoodKey]][]).map(
        ([key, { emoji, label, color }]) => {
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "text-white shadow-sm"
                  : "bg-gray-50 text-text-muted hover:bg-gray-100"
              }`}
              style={active ? { backgroundColor: color } : undefined}
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        }
      )}
    </div>
  );
}
