import { JOURNAL_ANALYSIS_PROMPT } from "@/constants/prompts";
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const mood = typeof body.mood === "string" ? body.mood : "reflective";
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
    }

    const userContent = `Mood: ${mood}\n\nJournal entry:\n${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: JOURNAL_ANALYSIS_PROMPT },
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
      return new Response(JSON.stringify({ error: "Empty model response" }), { status: 500 });
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
        : "Take a gentle breath — your entry matters even if insights are still forming.";
    const haiku =
      typeof parsed.haiku === "string" && parsed.haiku.trim()
        ? parsed.haiku.trim()
        : "Words on the page\nMoments held with quiet care\nYou showed up today";

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
    console.error("Journal analyze error:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze entry" }), { status: 500 });
  }
}
