"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Tutor() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const { reply } = await res.json();
    setMessages([...next, { role: "assistant", content: reply ?? "Error, try again" }]);
    setLoading(false);
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Tutor</h1>
      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded whitespace-pre-wrap ${
            m.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100"}`}>
            {m.content}
          </div>
        ))}
        {loading && <p>Thinking...</p>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border p-2 rounded" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything..." />
        <button onClick={send} className="bg-blue-600 text-white px-4 rounded">Send</button>
      </div>
    </main>
  );
}
