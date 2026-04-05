import { knowingNeedsChatSystem } from "@/constants/knowing-your-needs-prompts";
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

    const b = body as { scope?: unknown; messages?: unknown };
    const scope = b.scope === "moment" || b.scope === "situation" ? b.scope : null;
    if (!scope) {
      return new Response(
        JSON.stringify({ error: "Expected scope: 'moment' | 'situation'" }),
        { status: 400 }
      );
    }

    const rawMessages = b.messages;
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
            { role: "system", content: knowingNeedsChatSystem(scope) },
            ...messages.slice(-24),
          ],
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
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

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Needs chat API error:", error);
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
