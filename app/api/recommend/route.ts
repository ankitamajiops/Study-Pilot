import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { stats, weak } = await req.json();
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 600,
    system:
      "You are a study coach. Using the student's quiz stats, give a short, specific plan: " +
      "what to revise first, why, and when to retake a quiz. Max 5 bullet points. Be encouraging.",
    messages: [{
      role: "user",
      content: `Topic stats: ${JSON.stringify(stats)}\nWeak topics: ${JSON.stringify(weak)}`,
    }],
  });
  const reply = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return Response.json({ reply });
}
