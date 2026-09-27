-- Training Arc — Phase 4 persistence schema.
-- Apply via the Supabase SQL editor, or `supabase db push` if you use the CLI.
-- Every table is owned by auth.users(id) and locked down with RLS so a user
-- can only ever read or write their own rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per warrior, keyed by the authenticated user.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  warrior_name text not null,
  avatar_url text,
  xp integer not null default 0,
  level integer not null default 1,
  rank text not null default 'Initiate',
  streak integer not null default 0,
  total_workouts integer not null default 0,
  last_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are self-access only"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_completions: one row per successfully completed workout.
-- ---------------------------------------------------------------------------
-- id is supplied by the client (the session id from sessionStore), not
-- generated here, so a retried sync after a partial failure upserts the
-- same row instead of creating a second completion record.
create table if not exists public.workout_completions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  xp_earned integer not null,
  completed_at timestamptz not null default now(),
  duration_seconds integer
);

alter table public.workout_completions enable row level security;

create policy "Workout completions are self-access only"
  on public.workout_completions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists workout_completions_user_completed_at_idx
  on public.workout_completions (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- achievements: one row per unlocked achievement per user.
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

alter table public.achievements enable row level security;

create policy "Achievements are self-access only"
  on public.achievements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
