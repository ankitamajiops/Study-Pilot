"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.push("/dashboard");
  }

  return (
    <main className="max-w-sm mx-auto p-4 mt-20">
      <h1 className="text-2xl font-bold mb-4">{isSignup ? "Create account" : "Log in"}</h1>
      <input className="border p-2 rounded w-full mb-2" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 rounded w-full mb-2" type="password"
        placeholder="Password (min 6 chars)" value={password}
        onChange={(e) => setPassword(e.target.value)} />
      <button onClick={submit} className="bg-blue-600 text-white w-full p-2 rounded">
        {isSignup ? "Sign up" : "Log in"}
      </button>
      {msg && <p className="text-red-600 mt-2">{msg}</p>}
      <button onClick={() => setIsSignup(!isSignup)} className="text-sm underline mt-3">
        {isSignup ? "Already have an account? Log in" : "New here? Sign up"}
      </button>
    </main>
  );
}
