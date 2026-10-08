# StudyPilot - Agentic AI Study Companion

Next.js + Supabase + Claude API. Features: AI tutor, study planner (with re-plan),
quiz generator, progress dashboard, weak-topic detection, AI recommendations,
and an agent that chooses tools (progress, plan, quiz) on its own.

## Setup
1. Create a Supabase project, open SQL Editor, run `supabase.sql`.
2. In Supabase: Authentication > Providers > Email, turn OFF "Confirm email" (for demo).
3. Copy `.env.example` to `.env.local` and fill in the 3 keys.
4. `npm install` then `npm run dev` and open http://localhost:3000

## Deploy on Netlify
1. Push this folder to a GitHub repo (do not push `.env.local`).
2. Netlify: Add new site > Import from GitHub > pick the repo.
3. Site configuration > Environment variables: add the 3 keys from `.env.example`.
4. Deploy. Then set Supabase Authentication > URL Configuration > Site URL to your Netlify link.
