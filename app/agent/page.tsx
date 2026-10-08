"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Q = { question: string; options: string[]; answerIndex: number; explanation: string };
type QuizData = { subject: string; topic: string; questions: Q[] };
type Msg = { role: "user" | "assistant"; content: string; quiz?: QuizData; used?: string[] };

function InlineQuiz({ quiz }: { quiz: QuizData }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const score = quiz.questions.filter((q, i) => answers[i] === q.answerIndex).length;

  async function submit() {
    setDone(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("quiz_attempts").insert({
      user_id: data.user.id, subject: quiz.subject, topic: quiz.topic,
      score, total: quiz.questions.length,
    });
  }

  return (
    <div className="mt-2 p-3 border rounded bg-white text-left">
      <p className="font-bold mb-2">Quiz: {quiz.topic}</p>
      {quiz.questions.map((q, i) => (
        <div key={i} className="mb-3">
          <p className="font-semibold">{i + 1}. {q.question}</p>
          {q.options.map((o, j) => (
            <label key={j} className="block">
              <input type="radio" name={`${quiz.topic}-${i}`} disabled={done}
                onChange={() => { const a = [...answers]; a[i] = j; setAnswers(a); }} /> {o}
            </label>
          ))}
          {done && (
            <p className={answers[i] === q.answerIndex ? "text-green-600" : "text-red-600"}>
              {answers[i] === q.answerIndex ? "Correct. " : "Wrong. "}{q.explanation}
            </p>
          )}
        </div>
      ))}
      {!done ? (
        <button onClick={submit} className="bg-green-600 text-white px-3 py-1 rounded">Submit</button>
      ) : (
        <p className="font-bold">Score: {score}/{quiz.questions.length} (saved)</p>
      )}
    </div>
  );
}

export default function Agent() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const out = await res.json();
      setMessages([...next, {
        role: "assistant",
        content: out.reply ?? out.error ?? "Something went wrong",
        quiz: out.quiz ?? undefined,
        used: out.used,
      }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Request failed or timed out. Try again." }]);
    }
    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">StudyPilot Agent</h1>
      <p className="text-sm text-gray-500 mb-4">Log in first. Try: "How am I doing?" or "Quiz me on recursion".</p>
      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block p-3 rounded whitespace-pre-wrap text-left ${
              m.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
              {m.content}
            </div>
            {m.used && m.used.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Tools used: {[...new Set(m.used)].join(", ")}</p>
            )}
            {m.quiz && <InlineQuiz quiz={m.quiz} />}
          </div>
        ))}
        {loading && <p>Working...</p>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border p-2 rounded" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. What should I study next?" />
        <button onClick={send} className="bg-blue-600 text-white px-4 rounded">Send</button>
      </div>
    </main>
  );
}
