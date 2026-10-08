create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text, exam_date date, hours_per_day numeric,
  created_at timestamptz default now()
);
create table tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  day date, topic text, description text, minutes int,
  done boolean default false
);
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  subject text, topic text, score int, total int,
  created_at timestamptz default now()
);

alter table plans enable row level security;
alter table tasks enable row level security;
alter table quiz_attempts enable row level security;

create policy "own plans" on plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own attempts" on quiz_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on tasks for all
  using (exists (select 1 from plans where plans.id = tasks.plan_id and plans.user_id = auth.uid()))
  with check (exists (select 1 from plans where plans.id = tasks.plan_id and plans.user_id = auth.uid()));
