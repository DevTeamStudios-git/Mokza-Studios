-- DEV PROJECT ONLY. Never run against production: production already has the real table.
--
-- A stub of the host's public.user_accounts with the exact production column shape
-- (docs/mozora-integration.md section 3), locked down the same way the host locked it down:
-- RLS on, no policies, no grants to browser roles. Rows are fictional and created by the seed script.

create table if not exists public.user_accounts (
  id            text primary key,
  email         text,
  name          text,
  picture       text,
  provider      text not null,
  rank          text not null default 'User',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

alter table public.user_accounts enable row level security;
revoke all on public.user_accounts from anon, authenticated;

-- The host's role-request table. Signing in calls /api/auth/me, which reads it; without it a preview
-- sign-in fails with a server error. Same columns as production, locked down the same way.
create table if not exists public.role_requests (
  id             text primary key,
  account_id     text not null,
  username       text,
  requested_rank text not null,
  message        text,
  status         text not null default 'pending',
  created_at     timestamptz not null default now(),
  decided_by     text,
  decided_at     timestamptz,
  decision_note  text
);

alter table public.role_requests enable row level security;
revoke all on public.role_requests from anon, authenticated;
