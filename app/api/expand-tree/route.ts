import { TREE_EXPAND_PROMPT } from "@/constants/prompts";
import { sanitizeChatMessages } from "@/lib/sanitize-openai-messages";
import {
  normalizeWhatIfTree,
  stripTreeForApiPrompt,
  validateExpandPreservesPrevious,
  validateTreeNodes,
} from "@/lib/tree-utils";
import type { WhatIfTree } from "@/types";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
      });
    }

    const b = body as {
      messages?: unknown;
      currentTree?: unknown;
      hintParentNodeId?: unknown;
    };
    const rawMessages = b.messages;
    const { currentTree, hintParentNodeId } = b;

    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: "Expected { messages: [] }" }), {
        status: 400,
      });
    }

    const messages = sanitizeChatMessages(rawMessages);
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages for tree context" }),
        { status: 400 }
      );
    }

    const prevNormalized = currentTree
      ? normalizeWhatIfTree(currentTree as WhatIfTree)
      : null;

    if (!prevNormalized || prevNormalized.nodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Expected non-empty currentTree" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      console.error("expand-tree: OPENAI_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: OPENAI_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const validIds = new Set(prevNormalized.nodes.map((n) => n.id));
    const hint =
      typeof hintParentNodeId === "string" && validIds.has(hintParentNodeId)
        ? hintParentNodeId
        : null;

    const hintBlock = hint
      ? `HINT_PARENT_NODE_ID: "${hint}"\nThe user may be focused on this branch — add or refine sub-outcomes when supported by the conversation. Still return the complete merged tree.\n\n`
      : "";

    const userContent = `${hintBlock}PREVIOUS_TREE:\n${JSON.stringify(stripTreeForApiPrompt(prevNormalized))}\n\nRe-read the full conversation (especially the latest turns). Return updated JSON: same shape (situation, root, nodes). Follow EXPAND rules — preserve every prior node id, add new nodes with correct parentId.`;

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 8192,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: TREE_EXPAND_PROMPT },
            ...messages.slice(-20),
            { role: "user", content: userContent },
          ],
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("expand-tree: fetch failed:", e);
      return new Response(
        JSON.stringify({
          error: `Cannot reach OpenAI (${msg}). Check network and API key.`,
        }),
        { status: 502 }
      );
    }

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Empty response from AI" }), {
        status: 500,
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Model returned non-JSON tree content" }),
        { status: 500 }
      );
    }
    const normalized = normalizeWhatIfTree(parsed);

    if (!normalized) {
      return new Response(JSON.stringify({ error: "Invalid tree structure" }), {
        status: 500,
      });
    }

    const validation = validateTreeNodes(normalized.nodes);
    if (!validation.ok) {
      return new Response(
        JSON.stringify({ error: validation.error ?? "Invalid tree" }),
        { status: 500 }
      );
    }

    const preserve = validateExpandPreservesPrevious(
      prevNormalized.nodes,
      normalized.nodes
    );
    if (!preserve.ok) {
      return new Response(JSON.stringify({ error: preserve.error }), {
        status: 500,
      });
    }

    return Response.json(normalized);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("expand-tree error:", error);
    return new Response(
      JSON.stringify({
        error:
          msg.length > 0 && msg !== "[object Object]"
            ? msg.slice(0, 500)
            : "Failed to expand tree",
      }),
      { status: 500 }
    );
  }
}
