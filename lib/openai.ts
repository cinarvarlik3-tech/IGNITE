import type { WhatIfTree } from "@/types";
import { normalizeWhatIfTree } from "@/lib/tree-utils";

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
      let detail = "";
      const text = await res.text();
      try {
        const j = JSON.parse(text) as { error?: string };
        if (typeof j?.error === "string") detail = j.error;
      } catch {
        if (text) detail = text.slice(0, 500);
      }
      throw new Error(
        detail
          ? `Chat API error: ${res.status} — ${detail}`
          : `Chat API error: ${res.status}`
      );
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

async function parseTreeResponse(res: Response): Promise<WhatIfTree> {
  if (!res.ok) {
    let detail = "";
    const text = await res.text();
    try {
      const j = JSON.parse(text) as { error?: string };
      if (typeof j?.error === "string") detail = j.error;
    } catch {
      if (text) detail = text.slice(0, 500);
    }
    throw new Error(
      detail ? `Tree API error: ${res.status} — ${detail}` : `Tree API error: ${res.status}`
    );
  }
  const raw = await res.json();
  const normalized = normalizeWhatIfTree(raw);
  if (!normalized) {
    throw new Error("Invalid tree payload");
  }
  return {
    ...normalized,
    generatedAt: new Date().toISOString(),
  };
}

/** First outcomes tree for a conversation (three top-level paths). */
export async function createOutcomesTree(
  messages: { role: string; content: string }[]
): Promise<WhatIfTree> {
  const res = await fetch("/api/create-tree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  return parseTreeResponse(res);
}

/** Add sub-branches; server requires all previous node ids to remain. */
export async function expandOutcomesTree(
  messages: { role: string; content: string }[],
  currentTree: WhatIfTree,
  hintParentNodeId?: string | null
): Promise<WhatIfTree> {
  const res = await fetch("/api/expand-tree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      currentTree,
      ...(hintParentNodeId ? { hintParentNodeId } : {}),
    }),
  });
  return parseTreeResponse(res);
}

/** @deprecated Use createOutcomesTree or expandOutcomesTree */
export async function generateTree(
  messages: { role: string; content: string }[],
  options?: { previousTree?: WhatIfTree | null }
): Promise<WhatIfTree> {
  if (options?.previousTree) {
    return expandOutcomesTree(messages, options.previousTree, null);
  }
  return createOutcomesTree(messages);
}
