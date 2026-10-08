"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Q = { question: string; options: string[]; answerIndex: number; explanation: string };

export default function Quiz() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setSubmitted(false);
    setAnswers([]);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic }),
    });
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
  }

  const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;

  async function submit() {
    setSubmitted(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return alert("Please log in to save your score");
    await supabase.from("quiz_attempts").insert({
      user_id: data.user.id, subject, topic, score, total: questions.length,
    });
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz</h1>
      <div className="flex gap-2 mb-4">
        <input className="border p-2 rounded flex-1" placeholder="Subject"
          value={subject} onChange={(e) => setSubject(e.target.value)} />
        <input className="border p-2 rounded flex-1" placeholder="Topic"
          value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button onClick={generate} className="bg-blue-600 text-white px-4 rounded">Start</button>
      </div>
      {loading && <p>Generating questions...</p>}
      {questions.map((q, i) => (
        <div key={i} className="mb-5">
          <p className="font-semibold">{i + 1}. {q.question}</p>
          {q.options.map((opt, j) => (
            <label key={j} className="block">
              <input type="radio" name={`q${i}`} disabled={submitted}
                onChange={() => { const a = [...answers]; a[i] = j; setAnswers(a); }} /> {opt}
            </label>
          ))}
          {submitted && (
            <p className={answers[i] === q.answerIndex ? "text-green-600" : "text-red-600"}>
              {answers[i] === q.answerIndex ? "Correct. " : "Wrong. "}{q.explanation}
            </p>
          )}
        </div>
      ))}
      {questions.length > 0 && !submitted && (
        <button onClick={submit} className="bg-green-600 text-white px-4 py-2 rounded">Submit</button>
      )}
      {submitted && <p className="text-xl font-bold">Score: {score}/{questions.length}</p>}
    </main>
  );
}
