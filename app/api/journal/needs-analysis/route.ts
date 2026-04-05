import { KNOWING_NEEDS_ANALYSIS_PROMPT } from "@/constants/knowing-your-needs-prompts";
import { sanitizeChatMessages } from "@/lib/sanitize-openai-messages";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scope =
      body?.scope === "moment" || body?.scope === "situation" ? body.scope : null;
    if (!scope) {
      return new Response(
        JSON.stringify({ error: "Expected scope: 'moment' | 'situation'" }),
        { status: 400 }
      );
    }

    const rawMessages = body?.messages;
    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: "Expected messages array" }), {
        status: 400,
      });
    }

    const messages = sanitizeChatMessages(rawMessages);
    const lines = messages.map(
      (m) => `${m.role === "assistant" ? "Coach" : "User"}: ${m.content}`
    );
    const transcript = lines.join("\n\n").trim();
    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "Transcript is empty" }),
        { status: 400 }
      );
    }

    const userContent = `Scope: ${scope === "moment" ? "In this current moment" : "In a situation, circumstance, or relationship"}

Conversation transcript:

${transcript}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: KNOWING_NEEDS_ANALYSIS_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "Empty model response" }), {
        status: 500,
      });
    }

    const parsed = JSON.parse(content) as {
      reflection?: string;
      haiku?: string;
      feelings?: unknown;
      people?: unknown;
    };

    const reflection =
      typeof parsed.reflection === "string" && parsed.reflection.trim()
        ? parsed.reflection.trim()
        : "Your reflections matter. Consider what needs felt most alive in what you shared.";
    const haiku =
      typeof parsed.haiku === "string" && parsed.haiku.trim()
        ? parsed.haiku.trim()
        : "Needs beneath words\nQuiet, asking to be seen\nYou listened today";

    const feelings = Array.isArray(parsed.feelings)
      ? parsed.feelings
          .filter((f): f is string => typeof f === "string")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    const people = Array.isArray(parsed.people)
      ? parsed.people
          .filter((p): p is string => typeof p === "string")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    return Response.json({
      reflection,
      haiku,
      feelings,
      people,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Needs analysis error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze conversation" }),
      { status: 500 }
    );
  }
}
