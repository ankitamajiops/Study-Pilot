"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = { id: string; day: string; topic: string; description: string; minutes: number; done: boolean };
type Plan = { id: string; subject: string; exam_date: string; hours_per_day: number };

const today = () => new Date().toISOString().slice(0, 10);

export default function Planner() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [topics, setTopics] = useState("");
  const [hours, setHours] = useState(2);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.push("/login");
    const { data: p } = await supabase.from("plans").select("*")
      .order("created_at", { ascending: false }).limit(1);
    if (!p?.length) return;
    setPlan(p[0]);
    const { data: t } = await supabase.from("tasks").select("*")
      .eq("plan_id", p[0].id).order("day");
    setTasks(t ?? []);
  }
  useEffect(() => { load(); }, []);

  async function askAI(s: string, exam: string, tp: string, h: number) {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: s, examDate: exam, topics: tp, hoursPerDay: h, today: today() }),
    });
    const data = await res.json();
    return data.tasks as any[] | undefined;
  }

  async function create() {
    setBusy(true);
    const list = await askAI(subject, examDate, topics, hours);
    const { data: auth } = await supabase.auth.getUser();
    if (!list || !auth.user) { setBusy(false); return alert("Failed, try again"); }
    const { data: p } = await supabase.from("plans").insert({
      user_id: auth.user.id, subject, exam_date: examDate, hours_per_day: hours,
    }).select().single();
    await supabase.from("tasks").insert(
      list.map((t) => ({ plan_id: p.id, day: t.day, topic: t.topic, description: t.description, minutes: t.minutes }))
    );
    await load();
    setBusy(false);
  }

  async function toggle(t: Task) {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
  }

  async function reschedule() {
    if (!plan) return;
    const remaining = tasks.filter((t) => !t.done);
    if (!remaining.length) return alert("All tasks done!");
    setBusy(true);
    const topicList = [...new Set(remaining.map((t) => t.topic))].join(", ");
    const list = await askAI(plan.subject, plan.exam_date, topicList, plan.hours_per_day);
    if (!list) { setBusy(false); return alert("Failed, try again"); }
    await supabase.from("tasks").delete().eq("plan_id", plan.id).eq("done", false);
    await supabase.from("tasks").insert(
      list.map((t) => ({ plan_id: plan.id, day: t.day, topic: t.topic, description: t.description, minutes: t.minutes }))
    );
    await load();
    setBusy(false);
  }

  const byDay = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    (acc[t.day] ??= []).push(t);
    return acc;
  }, {});
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Study Planner</h1>
      <div className="grid gap-2 mb-6">
        <input className="border p-2 rounded" placeholder="Subject" value={subject}
          onChange={(e) => setSubject(e.target.value)} />
        <input className="border p-2 rounded" type="date" value={examDate}
          onChange={(e) => setExamDate(e.target.value)} />
        <textarea className="border p-2 rounded" placeholder="Topics (comma separated)"
          value={topics} onChange={(e) => setTopics(e.target.value)} />
        <input className="border p-2 rounded" type="number" min={1} max={12} value={hours}
          onChange={(e) => setHours(+e.target.value)} />
        <button onClick={create} disabled={busy} className="bg-blue-600 text-white p-2 rounded">
          {busy ? "Working..." : "Create plan"}
        </button>
      </div>
      {plan && (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">{plan.subject}: {doneCount}/{tasks.length} done</p>
            <button onClick={reschedule} disabled={busy}
              className="bg-orange-500 text-white px-3 py-1 rounded">Re-plan remaining</button>
          </div>
          {Object.entries(byDay).map(([day, list]) => (
            <div key={day} className="mb-4">
              <h2 className="font-bold">
                {day}
                {day < today() && list.some((t) => !t.done) && (
                  <span className="text-red-600 text-sm ml-2">missed</span>
                )}
              </h2>
              {list.map((t) => (
                <label key={t.id} className="flex gap-2 items-start">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
                  <span className={t.done ? "line-through text-gray-400" : ""}>
                    <b>{t.topic}</b>: {t.description} ({t.minutes} min)
                  </span>
                </label>
              ))}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
