import Anthropic from "@anthropic-ai/sdk";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { subject, examDate, topics, hoursPerDay, today } = await req.json();
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 3000,
    system:
      "You are a study planner. Reply with ONLY a JSON array, no markdown. " +
      'Each item: {"day":"YYYY-MM-DD","topic":string,"description":string,"minutes":number}. ' +
      "Start on today's date, finish at least 1 day before the exam, put revision in the last 1-2 days, " +
      "and keep each day's total minutes within the daily limit.",
    messages: [{
      role: "user",
      content: `Subject: ${subject}\nToday: ${today}\nExam date: ${examDate}\nTopics: ${topics}\nStudy hours per day: ${hoursPerDay}`,
    }],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : ""))
    .join("").replace(/```json|```/g, "").trim();
  try {
    return Response.json({ tasks: JSON.parse(text) });
  } catch {
    return Response.json({ error: "Bad AI output" }, { status: 500 });
  }
}
