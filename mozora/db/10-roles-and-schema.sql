-- Mozora database roles and schema (brief D12). Idempotent: safe to run more than once.
--
-- Runs once per Supabase project, as the project's `postgres` role:
--   - dev project (local, CI, Preview): applied in M0
--   - production (shared with the host): only through the approved migration job, after review
--
-- What it guarantees:
--   - mozora_migrator owns schema `mozora` and is the only role with DDL rights in it
--   - mozora_app has DML on `mozora` only, plus SELECT on four columns of public.user_accounts
--   - anon, authenticated, service_role and PUBLIC have no access to `mozora` at all,
--     so neither the browser keys nor the host's service-role key can read member data
--   - neither Mozora role can write anything in `public`
--
-- Both roles are created NOLOGIN. Login passwords are set separately, by the owner, as SCRAM
-- verifiers (see docs/mozora-setup.md), so no plaintext password ever appears in SQL or logs.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mozora_migrator') then
    create role mozora_migrator nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'mozora_app') then
    create role mozora_app nologin noinherit;
  end if;
end $$;

-- Neither role may be superuser, bypass RLS, or create roles or databases. New roles default to all
-- four being off; Supabase's `postgres` is not a superuser and cannot even name SUPERUSER in ALTER
-- ROLE, so assert instead of setting.
do $$
begin
  if exists (
    select 1 from pg_roles
    where rolname in ('mozora_app', 'mozora_migrator')
      and (rolsuper or rolbypassrls or rolcreaterole or rolcreatedb)
  ) then
    raise exception 'mozora roles must not have SUPERUSER, BYPASSRLS, CREATEROLE or CREATEDB';
  end if;
end $$;

-- Statement timeouts so a runaway query cannot hold the shared database.
alter role mozora_app      set statement_timeout = '15s';
alter role mozora_migrator set statement_timeout = '5min';
-- Both roles resolve unqualified names in `mozora` first.
alter role mozora_app      set search_path = mozora;
alter role mozora_migrator set search_path = mozora;

-- `postgres` must be able to act as the migrator to transfer ownership and to run the safety tests.
grant mozora_migrator to postgres;
grant mozora_app to postgres;

create schema if not exists mozora authorization mozora_migrator;
alter schema mozora owner to mozora_migrator;

-- Nobody else gets in.
revoke all on schema mozora from public, anon, authenticated, service_role;
revoke all on all tables    in schema mozora from public, anon, authenticated, service_role;
revoke all on all sequences in schema mozora from public, anon, authenticated, service_role;
revoke all on all functions in schema mozora from public, anon, authenticated, service_role;
alter default privileges for role mozora_migrator in schema mozora
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role mozora_migrator in schema mozora
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role mozora_migrator in schema mozora
  revoke execute on functions from public, anon, authenticated, service_role;

-- Runtime role: DML on everything the migrator creates in `mozora`, nothing more.
grant usage on schema mozora to mozora_app;
grant select, insert, update, delete on all tables in schema mozora to mozora_app;
grant usage, select on all sequences in schema mozora to mozora_app;
alter default privileges for role mozora_migrator in schema mozora
  grant select, insert, update, delete on tables to mozora_app;
alter default privileges for role mozora_migrator in schema mozora
  grant usage, select on sequences to mozora_app;

-- Identity lookup: four columns of the host's account table, read-only.
-- RLS is enabled on user_accounts with no policies (host lockdown), so mozora_app also needs a
-- SELECT-only policy scoped to that role alone. The host's own access (service role) is unchanged.
grant usage on schema public to mozora_app;
revoke all on public.user_accounts from mozora_app;
grant select (id, name, email, rank) on public.user_accounts to mozora_app;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_accounts' and policyname = 'mozora_app reads identity'
  ) then
    create policy "mozora_app reads identity" on public.user_accounts
      for select to mozora_app using (true);
  end if;
end $$;

-- Neither role may create objects in `public` (Postgres 15+ already revokes CREATE from PUBLIC;
-- this makes it explicit for these two roles).
revoke create on schema public from mozora_app, mozora_migrator;
