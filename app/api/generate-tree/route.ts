import { TREE_GENERATION_PROMPT } from "@/constants/prompts";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TREE_GENERATION_PROMPT },
          ...messages.slice(-20),
          { role: "user", content: "Generate the What-If tree now based on our conversation." },
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
      return new Response(JSON.stringify({ error: "Empty response from AI" }), {
        status: 500,
      });
    }

    // Parse and validate the JSON
    const tree = JSON.parse(content);

    // Basic validation
    if (!tree.situation || !tree.root || !tree.branches || tree.branches.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid tree structure" }), {
        status: 500,
      });
    }

    return Response.json(tree);
  } catch (error) {
    console.error("Tree generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate tree" }),
      { status: 500 }
    );
  }
}
