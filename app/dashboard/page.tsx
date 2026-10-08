"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stat = { topic: string; percent: number; attempts: number };

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([]);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");
      const { data } = await supabase.from("quiz_attempts").select("topic, score, total");
      const map: Record<string, { s: number; t: number; n: number }> = {};
      (data ?? []).forEach((a) => {
        map[a.topic] ??= { s: 0, t: 0, n: 0 };
        map[a.topic].s += a.score;
        map[a.topic].t += a.total;
        map[a.topic].n += 1;
      });
      setStats(Object.entries(map).map(([topic, v]) => ({
        topic, percent: Math.round((v.s / v.t) * 100), attempts: v.n,
      })));
      setLoading(false);
    }
    load();
  }, [router]);

  const weak = stats.filter((s) => s.percent < 60).map((s) => s.topic);

  async function getAdvice() {
    setThinking(true);
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, weak }),
    });
    const { reply } = await res.json();
    setAdvice(reply);
    setThinking(false);
  }

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Progress</h1>
      {stats.length === 0 && <p>No quizzes yet. Take one on the Quiz page.</p>}
      {stats.map((s) => (
        <div key={s.topic} className="mb-3">
          <div className="flex justify-between">
            <span>{s.topic} ({s.attempts} attempts)</span>
            <span className={s.percent < 60 ? "text-red-600" : "text-green-600"}>{s.percent}%</span>
          </div>
          <div className="bg-gray-200 h-3 rounded">
            <div className={`h-3 rounded ${s.percent < 60 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${s.percent}%` }} />
          </div>
        </div>
      ))}
      {weak.length > 0 && (
        <p className="mt-4 p-3 bg-red-50 rounded">Weak topics: <b>{weak.join(", ")}</b></p>
      )}
      {stats.length > 0 && (
        <button onClick={getAdvice} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          {thinking ? "Thinking..." : "What should I study next?"}
        </button>
      )}
      {advice && <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap">{advice}</div>}
    </main>
  );
}
