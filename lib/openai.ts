import type { Message, WhatIfTree } from "@/types";

/**
 * Stream a chat response from /api/chat.
 * Calls `onToken` for each chunk, `onDone` when complete.
 */
export async function streamChat(
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      throw new Error(`Chat API error: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) onToken(token);
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Generate a What-If tree from the conversation.
 */
export async function generateTree(
  messages: { role: string; content: string }[]
): Promise<WhatIfTree> {
  const res = await fetch("/api/generate-tree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Tree API error: ${res.status}`);
  }

  const tree = await res.json();
  return {
    ...tree,
    generatedAt: new Date().toISOString(),
  } as WhatIfTree;
}
