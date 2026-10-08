import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_progress",
    description: "Get the student's quiz performance per topic and their weak topics (under 60%).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_study_plan",
    description: "Get the student's pending (not done) study tasks.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_study_plan",
    description: "Save a day-wise study plan. You write the tasks yourself.",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        exam_date: { type: "string", description: "YYYY-MM-DD" },
        hours_per_day: { type: "number" },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", description: "YYYY-MM-DD" },
              topic: { type: "string" },
              description: { type: "string" },
              minutes: { type: "number" },
            },
            required: ["day", "topic", "description", "minutes"],
          },
        },
      },
      required: ["subject", "exam_date", "hours_per_day", "tasks"],
    },
  },
  {
    name: "generate_quiz",
    description: "Show a multiple-choice quiz to the student. You write the questions yourself (5 by default).",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        topic: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              answerIndex: { type: "number" },
              explanation: { type: "string" },
            },
            required: ["question", "options", "answerIndex", "explanation"],
          },
        },
      },
      required: ["subject", "topic", "questions"],
    },
  },
];

export async function POST(req: Request) {
  const { messages, token } = await req.json();

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: auth } = await db.auth.getUser(token);
  if (!auth.user) return Response.json({ error: "Please log in first" }, { status: 401 });
  const userId = auth.user.id;

  let quiz: any = null;
  const used: string[] = [];

  async function runTool(name: string, input: any): Promise<string> {
    used.push(name);
    if (name === "get_progress") {
      const { data } = await db.from("quiz_attempts").select("topic, score, total");
      const map: Record<string, { s: number; t: number; n: number }> = {};
      (data ?? []).forEach((a) => {
        map[a.topic] ??= { s: 0, t: 0, n: 0 };
        map[a.topic].s += a.score;
        map[a.topic].t += a.total;
        map[a.topic].n += 1;
      });
      const stats = Object.entries(map).map(([topic, v]) => ({
        topic, percent: Math.round((v.s / v.t) * 100), attempts: v.n,
      }));
      return JSON.stringify({ stats, weak: stats.filter((s) => s.percent < 60).map((s) => s.topic) });
    }
    if (name === "get_study_plan") {
      const { data: p } = await db.from("plans").select("*")
        .order("created_at", { ascending: false }).limit(1);
      if (!p?.length) return "No plan yet.";
      const { data: t } = await db.from("tasks")
        .select("day, topic, description, minutes")
        .eq("plan_id", p[0].id).eq("done", false).order("day");
      return JSON.stringify({ subject: p[0].subject, exam_date: p[0].exam_date, pending: t });
    }
    if (name === "create_study_plan") {
      const { data: p, error } = await db.from("plans").insert({
        user_id: userId, subject: input.subject,
        exam_date: input.exam_date, hours_per_day: input.hours_per_day,
      }).select().single();
      if (error) return "Error: " + error.message;
      await db.from("tasks").insert(input.tasks.map((t: any) => ({ ...t, plan_id: p.id })));
      return `Plan saved with ${input.tasks.length} tasks.`;
    }
    if (name === "generate_quiz") {
      quiz = { subject: input.subject, topic: input.topic, questions: input.questions };
      return "Quiz is now displayed to the student. Do not repeat the questions.";
    }
    return "Unknown tool";
  }

  const system =
    "You are StudyPilot, an agentic study companion for students. " +
    `Today is ${new Date().toISOString().slice(0, 10)}. ` +
    "Use tools when they help: check progress before recommending, create plans when asked, " +
    "and generate quizzes on request or on weak topics. After using tools, reply briefly and clearly. " +
    "If a plan needs missing info (exam date, topics, hours per day), ask for it first.";

  const convo: Anthropic.MessageParam[] = [...messages];

  for (let i = 0; i < 6; i++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 3000,
      system, tools, messages: convo,
    });

    if (res.stop_reason !== "tool_use") {
      const reply = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return Response.json({ reply, quiz, used });
    }

    convo.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const out = await runTool(block.name, block.input);
      results.push({ type: "tool_result", tool_use_id: block.id, content: out });
    }
    convo.push({ role: "user", content: results });
  }

  return Response.json({ reply: "I got stuck, please try again.", quiz, used });
}
