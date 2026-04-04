/** OpenAI chat messages: only user/assistant/system with string content */
export function sanitizeChatMessages(
  raw: unknown[]
): { role: string; content: string }[] {
  const out: { role: string; content: string }[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const o = m as Record<string, unknown>;
    const role = typeof o.role === "string" ? o.role : "user";
    if (role !== "user" && role !== "assistant" && role !== "system") continue;
    const content =
      typeof o.content === "string"
        ? o.content
        : o.content != null
          ? String(o.content)
          : "";
    out.push({ role, content });
  }
  return out;
}
