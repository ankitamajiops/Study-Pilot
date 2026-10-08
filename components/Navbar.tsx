"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  ["/agent", "Agent"],
  ["/tutor", "Tutor"],
  ["/planner", "Planner"],
  ["/quiz", "Quiz"],
  ["/dashboard", "Dashboard"],
];

export default function Navbar() {
  const router = useRouter();
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }
  return (
    <nav className="flex flex-wrap gap-4 items-center p-3 border-b bg-white">
      <b className="text-blue-600">StudyPilot</b>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="hover:underline">{label}</Link>
      ))}
      <button onClick={logout} className="ml-auto text-sm underline">Log out</button>
    </nav>
  );
}
