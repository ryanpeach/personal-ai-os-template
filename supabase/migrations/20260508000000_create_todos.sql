-- Todos table — Postgres equivalent of the prior SQLite schema.
create table if not exists public.todos (
  id         bigint generated always as identity primary key,
  title      text        not null,
  done       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- POC: this is a personal, locally hosted app with no auth wired up yet.
-- Disable RLS so the anon key can read/write through PostgREST.
-- Re-enable + add policies before exposing this beyond localhost / Tailscale.
alter table public.todos disable row level security;
