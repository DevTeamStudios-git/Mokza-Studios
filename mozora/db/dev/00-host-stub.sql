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
