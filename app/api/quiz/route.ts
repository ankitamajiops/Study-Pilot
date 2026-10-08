import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { subject, topic, count = 5 } = await req.json();
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 2000,
    system:
      "You create quizzes. Reply with ONLY a JSON array, no markdown. " +
      'Each item: {"question": string, "options": [4 strings], "answerIndex": number, "explanation": string}',
    messages: [{
      role: "user",
      content: `Make ${count} multiple-choice questions on ${topic} (${subject}) for a beginner.`,
    }],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : ""))
    .join("").replace(/```json|```/g, "").trim();
  try {
    return Response.json({ questions: JSON.parse(text) });
  } catch {
    return Response.json({ error: "Bad AI output, try again" }, { status: 500 });
  }
}
