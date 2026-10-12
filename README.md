# StudyPilot – Agentic AI Study Companion

StudyPilot is an AI-powered study companion that helps students **learn, plan, practice, and track their academic progress** from one platform.

It combines an AI tutor, personalized study planning, quiz generation, progress tracking, weak-topic detection, and an **agentic AI study assistant** that can decide which study tools to use based on the student's needs.

---

## Problem

Students often use multiple platforms for learning, planning, practicing, and tracking their studies. This can make their learning process fragmented and difficult to manage.

They may also struggle to identify weak topics, adjust their study plans when they fall behind, and receive personalized guidance.

---

## Our Solution

StudyPilot brings these study activities together into one AI-powered platform.

It helps students:

- Understand difficult topics with an AI tutor
- Create and adjust personalized study plans
- Practice through automatically generated quizzes
- Track their learning progress
- Identify weak topics
- Receive personalized study recommendations
- Interact with an AI agent that can choose the appropriate study tools

---

## Key Features

### AI Tutor
Students can ask questions and receive AI-powered explanations and learning assistance.

### Smart Study Planner
Create personalized study plans based on learning goals and available time.

### Re-Planning
The planner can adjust the study schedule when a student falls behind or their schedule changes.

### AI Quiz Generator
Generate quizzes for practice and evaluate learning.

### Progress Dashboard
Visualize study activity and learning progress.

### Weak-Topic Detection
Identify topics where the student needs additional practice.

### AI Recommendations
Provide personalized suggestions based on the student's learning progress and weak areas.

### Agentic AI Study Assistant
The study agent can determine which available tool is appropriate for a user's request, such as:

- Checking progress
- Managing the study plan
- Generating a quiz

This allows StudyPilot to provide a more personalized and automated study experience.

### Authentication
User authentication and data management are handled using Supabase.

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Frontend and application framework |
| React | User interface |
| Tailwind CSS | Styling |
| Supabase | Authentication and database |
| Claude API | AI-powered features |
| Netlify | Deployment |

---

## Architecture

```text
                    ┌──────────────────┐
                    │     Student      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   StudyPilot UI  │
                    │     Next.js      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   AI Study Agent │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          Progress         Planner         Quiz
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │    Supabase      │
                    │   Database/Auth  │
                    └──────────────────┘

                    Claude API
                         │
                         ▼
                 AI-powered features
