import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { messages } = await req.json();
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1000,
    system: "You are a friendly tutor. Explain simply for a beginner.",
    messages,
  });
  const reply = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return Response.json({ reply });
}
