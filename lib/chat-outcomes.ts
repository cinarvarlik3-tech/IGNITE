import type { Message } from "@/types";

/** Assistant bubble may show outcomes CTA when prefix through this index is long enough and this turn is complete. */
export function shouldShowOutcomesButton(
  messages: Message[],
  index: number,
  isStreaming: boolean
): boolean {
  const msg = messages[index];
  if (!msg || msg.role !== "assistant") return false;
  if (!msg.content.trim()) return false;
  if (index + 1 < 4) return false;
  const isLast = index === messages.length - 1;
  if (isLast && isStreaming) return false;
  return true;
}
