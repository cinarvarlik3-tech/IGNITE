import { CHAT_SYSTEM_PROMPT } from "@/constants/prompts";
import { sanitizeChatMessages } from "@/lib/sanitize-openai-messages";

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

    const rawMessages = (body as { messages?: unknown })?.messages;
    if (!Array.isArray(rawMessages)) {
      return new Response(
        JSON.stringify({ error: "Expected { messages: ChatMessage[] }" }),
        { status: 400 }
      );
    }

    const messages = sanitizeChatMessages(rawMessages);
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages to send" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      console.error("Chat API: OPENAI_API_KEY is missing");
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: OPENAI_API_KEY is not set",
        }),
        { status: 500 }
      );
    }

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
          stream: true,
          max_tokens: 500,
          messages: [
            { role: "system", content: CHAT_SYSTEM_PROMPT },
            ...messages.slice(-20),
          ],
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Chat API: fetch to OpenAI failed:", e);
      return new Response(
        JSON.stringify({
          error: `Cannot reach OpenAI (${msg}). Check network, VPN, and API key.`,
        }),
        { status: 502 }
      );
    }

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: response.status });
    }

    // Forward the SSE stream directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          msg.length > 0 && msg !== "[object Object]"
            ? msg.slice(0, 500)
            : "Internal server error",
      }),
      { status: 500 }
    );
  }
}
