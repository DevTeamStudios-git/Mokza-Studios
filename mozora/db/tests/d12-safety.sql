-- D12 shared-database safety test (brief section 3, D12; spike S-F).
--
-- Run as `postgres` against the DEV project only (CI runs it on every PR that touches mozora/db or
-- mozora/prisma). It creates two probe tables and one probe account, removes them before it finishes,
-- and ends with a SELECT that returns one row per check. Every row must have pass = true.
--
-- It proves:
--   - anon, authenticated and service_role (the browser keys and the host API's key) cannot touch
--     anything in schema `mozora`
--   - mozora_app has DML in `mozora` only, reads exactly four columns of public.user_accounts, and
--     cannot write to or create anything in `public`
--   - mozora_migrator can create objects in `mozora` only and cannot read host data
--   - tables the migrator creates are reachable by mozora_app through RLS, and by nobody else

-- Leftovers from an interrupted run.
drop table if exists mozora.d12_probe;
drop table if exists mozora.d12_ok;
delete from public.user_accounts where id = 'staff_D12Probe';

create temporary table d12_result (n serial, check_name text, expected text, actual text);

-- Runs `stmt` as `who`; returns 'ok', or the SQLSTATE if it failed.
create function pg_temp.try_as(who text, stmt text) returns text
language plpgsql as $$
begin
  execute format('set local role %I', who);
  execute stmt;
  reset role;
  return 'ok';
exception when others then
  reset role;
  return sqlstate;
end $$;

-- Runs a one-value query as `who`; returns the value as text, or the SQLSTATE if it failed.
create function pg_temp.value_as(who text, q text) returns text
language plpgsql as $$
declare v text;
begin
  execute format('set local role %I', who);
  execute q into v;
  reset role;
  return v;
exception when others then
  reset role;
  return sqlstate;
end $$;

create function pg_temp.expect(check_name text, expected text, who text, stmt text) returns void
language plpgsql as $$
begin
  insert into d12_result (check_name, expected, actual) values (check_name, expected, pg_temp.try_as(who, stmt));
end $$;

create function pg_temp.expect_value(check_name text, expected text, who text, q text) returns void
language plpgsql as $$
begin
  insert into d12_result (check_name, expected, actual) values (check_name, expected, pg_temp.value_as(who, q));
end $$;

-- Fixture: a Mozora table created the way a real migration creates it (as the migrator),
-- with RLS on and the single policy every Mozora table carries.
select pg_temp.try_as('mozora_migrator', $q$
  create table mozora.d12_probe (id int primary key, note text);
  alter table mozora.d12_probe enable row level security;
  create policy "mozora_app only" on mozora.d12_probe for all to mozora_app using (true) with check (true);
$q$);
insert into mozora.d12_probe values (1, 'fixture');

-- A fictional host account to look up.
insert into public.user_accounts (id, email, name, provider, rank)
values ('staff_D12Probe', null, 'D12 Probe', 'staff', 'Developer');

-- 1. Browser keys and the host API's key: no access to `mozora`. 42501 = insufficient_privilege.
select pg_temp.expect('anon cannot read mozora',               '42501', 'anon',            'select * from mozora.d12_probe');
select pg_temp.expect('anon cannot write mozora',              '42501', 'anon',            'insert into mozora.d12_probe values (2, ''x'')');
select pg_temp.expect('authenticated cannot read mozora',      '42501', 'authenticated',   'select * from mozora.d12_probe');
select pg_temp.expect('service_role cannot read mozora',       '42501', 'service_role',    'select * from mozora.d12_probe');
select pg_temp.expect('service_role cannot write mozora',      '42501', 'service_role',    'delete from mozora.d12_probe');

-- 2. Runtime role: full DML in `mozora`, no DDL.
select pg_temp.expect_value('mozora_app sees mozora rows',     '1',     'mozora_app',      'select count(*)::text from mozora.d12_probe');
select pg_temp.expect('mozora_app inserts mozora',             'ok',    'mozora_app',      'insert into mozora.d12_probe values (3, ''x'')');
select pg_temp.expect('mozora_app updates mozora',             'ok',    'mozora_app',      'update mozora.d12_probe set note = ''y'' where id = 3');
select pg_temp.expect('mozora_app deletes mozora',             'ok',    'mozora_app',      'delete from mozora.d12_probe where id = 3');
select pg_temp.expect('mozora_app cannot create in mozora',    '42501', 'mozora_app',      'create table mozora.d12_nope (id int)');
select pg_temp.expect('mozora_app cannot drop mozora table',   '42501', 'mozora_app',      'drop table mozora.d12_probe');

-- 3. Runtime role and the host: four columns, read-only.
select pg_temp.expect_value('mozora_app sees the account row', '1',     'mozora_app',      'select count(*)::text from public.user_accounts where id = ''staff_D12Probe''');
select pg_temp.expect_value('mozora_app reads the rank',       'Developer', 'mozora_app',  'select rank from public.user_accounts where id = ''staff_D12Probe''');
select pg_temp.expect('mozora_app cannot read picture',        '42501', 'mozora_app',      'select picture from public.user_accounts');
select pg_temp.expect('mozora_app cannot read provider',       '42501', 'mozora_app',      'select provider from public.user_accounts');
select pg_temp.expect('mozora_app cannot insert accounts',     '42501', 'mozora_app',      'insert into public.user_accounts (id, provider) values (''x'', ''x'')');
select pg_temp.expect('mozora_app cannot update rank',         '42501', 'mozora_app',      'update public.user_accounts set rank = ''Owner''');
select pg_temp.expect('mozora_app cannot delete accounts',     '42501', 'mozora_app',      'delete from public.user_accounts');
select pg_temp.expect('mozora_app cannot create in public',    '42501', 'mozora_app',      'create table public.d12_nope (id int)');

-- 4. Migration role: DDL in `mozora` only, no host data.
select pg_temp.expect('migrator creates in mozora',            'ok',    'mozora_migrator', 'create table mozora.d12_ok (id int)');
select pg_temp.expect('migrator cannot create in public',      '42501', 'mozora_migrator', 'create table public.d12_nope (id int)');
select pg_temp.expect('migrator cannot read accounts',         '42501', 'mozora_migrator', 'select id from public.user_accounts');
select pg_temp.expect('migrator cannot alter host table',      '42501', 'mozora_migrator', 'alter table public.user_accounts add column d12 int');

-- 5. Neither Mozora role can escalate. SET ROLE is checked against the SESSION user, which here is
-- postgres, so trying `set role` inside this script would wrongly succeed. Check membership instead:
-- a role that is a member of nothing cannot switch to anything when it logs in directly.
insert into d12_result (check_name, expected, actual)
select 'mozora_app is a member of no role', '0',
  (select count(*)::text from pg_auth_members m join pg_roles r on r.oid = m.member where r.rolname = 'mozora_app');
insert into d12_result (check_name, expected, actual)
select 'mozora_migrator is a member of no role', '0',
  (select count(*)::text from pg_auth_members m join pg_roles r on r.oid = m.member where r.rolname = 'mozora_migrator');
insert into d12_result (check_name, expected, actual)
select 'neither role has SUPERUSER, BYPASSRLS, CREATEROLE or CREATEDB', '0',
  (select count(*)::text from pg_roles where rolname in ('mozora_app', 'mozora_migrator')
     and (rolsuper or rolbypassrls or rolcreaterole or rolcreatedb));

-- Clean up, then report.
drop table if exists mozora.d12_probe;
drop table if exists mozora.d12_ok;
delete from public.user_accounts where id = 'staff_D12Probe';

select n, check_name, expected, actual, (expected = actual) as pass from d12_result order by n;
