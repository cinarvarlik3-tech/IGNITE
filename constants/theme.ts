import type { MoodKey } from "@/types";

// ─── Mood Definitions ───────────────────────────────

export const MOODS: Record<MoodKey, { emoji: string; label: string; color: string }> = {
  calm:       { emoji: "😌", label: "Calm",       color: "#81C784" },
  anxious:    { emoji: "😟", label: "Anxious",    color: "#FFB74D" },
  determined: { emoji: "💪", label: "Determined",  color: "#7E57C2" },
  low:        { emoji: "😔", label: "Low",         color: "#90A4AE" },
  reflective: { emoji: "🤔", label: "Reflective",  color: "#4FC3F7" },
  hopeful:    { emoji: "✨", label: "Hopeful",     color: "#F06292" },
};

// ─── Emotion → Color Mapping (for tree branches) ───

const EMOTION_COLORS: Record<string, string> = {
  // Calm / Relief
  relieved: "#81C784", content: "#81C784", calm: "#81C784", peaceful: "#81C784",
  // Tension / Anxiety
  anxious: "#FFB74D", regretful: "#FFB74D", frustrated: "#FFB74D", worried: "#FFB74D",
  // Empowerment
  empowered: "#7E57C2", confident: "#7E57C2", bold: "#7E57C2", proud: "#7E57C2",
  // Sadness
  sad: "#90A4AE", defeated: "#90A4AE", resigned: "#90A4AE", lonely: "#90A4AE",
  // Curiosity / Hope
  hopeful: "#4FC3F7", curious: "#4FC3F7", open: "#4FC3F7", excited: "#4FC3F7",
};

const DEFAULT_EMOTION_COLOR = "#9CA3AF";

export function getEmotionColor(emotion: string): string {
  return EMOTION_COLORS[emotion.toLowerCase()] ?? DEFAULT_EMOTION_COLOR;
}

// ─── Likelihood labels ──────────────────────────────

export const LIKELIHOOD_STYLES: Record<string, string> = {
  likely:   "bg-green-100 text-green-700",
  possible: "bg-amber-100 text-amber-700",
  unlikely: "bg-gray-100 text-gray-500",
};
