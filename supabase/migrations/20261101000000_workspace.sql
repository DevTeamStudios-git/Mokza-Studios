-- Mokza Workspace: Supabase backend (replaces Firebase Firestore / RTDB / Storage)
-- Apply with: Supabase Dashboard → SQL Editor → paste & Run  (or `supabase db push`)

-- ─── Helpers ────────────────────────────────────────────────────────────────
-- Paths under these roots are private to the user id in the 2nd segment,
-- e.g. workspaces/<uid>/tasks/<id>, users/<uid>/files/<id>, snippets/<uid>/items/<id>
create or replace function public.ws_path_owner(p text)
returns text language sql immutable as $$
  select case
    when split_part(p, '/', 1) in ('workspaces', 'users', 'snippets', 'notifications')
      then nullif(split_part(p, '/', 2), '')
    else null
  end
$$;

create table if not exists public.ws_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ws_admins enable row level security;
drop policy if exists "ws_admins self read" on public.ws_admins;
create policy "ws_admins self read" on public.ws_admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.ws_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ws_admins where user_id = auth.uid())
$$;

-- ─── Firestore-style documents ──────────────────────────────────────────────
create table if not exists public.ws_documents (
  path        text primary key,
  collection  text not null,
  doc_id      text not null,
  owner       uuid default auth.uid(),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ws_documents_collection_idx on public.ws_documents (collection);
alter table public.ws_documents enable row level security;
alter table public.ws_documents replica identity full;

drop policy if exists "ws_documents read" on public.ws_documents;
create policy "ws_documents read" on public.ws_documents for select to authenticated using (
  public.ws_path_owner(path) is null
  or public.ws_path_owner(path) = auth.uid()::text
  or owner = auth.uid()
  or (data ->> 'public') = 'true'
  or public.ws_is_admin()
);

drop policy if exists "ws_documents insert" on public.ws_documents;
create policy "ws_documents insert" on public.ws_documents for insert to authenticated with check (
  owner = auth.uid() and (
    public.ws_path_owner(path) is null
    or public.ws_path_owner(path) = auth.uid()::text
    -- mail delivery into another user's inbox / notifications
    or (split_part(path, '/', 1) = 'users' and split_part(path, '/', 3) = 'emails')
    or split_part(path, '/', 1) = 'notifications'
  )
);

drop policy if exists "ws_documents update" on public.ws_documents;
create policy "ws_documents update" on public.ws_documents for update to authenticated
  using (owner = auth.uid() or public.ws_path_owner(path) = auth.uid()::text or public.ws_is_admin())
  with check (owner = auth.uid() or public.ws_path_owner(path) = auth.uid()::text or public.ws_is_admin());

drop policy if exists "ws_documents delete" on public.ws_documents;
create policy "ws_documents delete" on public.ws_documents for delete to authenticated
  using (owner = auth.uid() or public.ws_path_owner(path) = auth.uid()::text or public.ws_is_admin());

-- ─── Realtime-Database-style tree (NotePad) ─────────────────────────────────
create table if not exists public.ws_rtdb (
  path        text primary key,
  owner       uuid default auth.uid(),
  value       jsonb,
  updated_at  timestamptz not null default now()
);
alter table public.ws_rtdb enable row level security;
alter table public.ws_rtdb replica identity full;

drop policy if exists "ws_rtdb read" on public.ws_rtdb;
create policy "ws_rtdb read" on public.ws_rtdb for select to authenticated using (
  public.ws_path_owner(path) is null or public.ws_path_owner(path) = auth.uid()::text
);
drop policy if exists "ws_rtdb insert" on public.ws_rtdb;
create policy "ws_rtdb insert" on public.ws_rtdb for insert to authenticated with check (
  public.ws_path_owner(path) is null or public.ws_path_owner(path) = auth.uid()::text
);
drop policy if exists "ws_rtdb update" on public.ws_rtdb;
create policy "ws_rtdb update" on public.ws_rtdb for update to authenticated
  using (public.ws_path_owner(path) is null or public.ws_path_owner(path) = auth.uid()::text)
  with check (public.ws_path_owner(path) is null or public.ws_path_owner(path) = auth.uid()::text);
drop policy if exists "ws_rtdb delete" on public.ws_rtdb;
create policy "ws_rtdb delete" on public.ws_rtdb for delete to authenticated using (
  public.ws_path_owner(path) is null or public.ws_path_owner(path) = auth.uid()::text
);

-- ─── Realtime ───────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ws_documents') then
    alter publication supabase_realtime add table public.ws_documents;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ws_rtdb') then
    alter publication supabase_realtime add table public.ws_rtdb;
  end if;
end $$;

-- ─── Storage (Studio Drive) ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('workspace-files', 'workspace-files', true)
on conflict (id) do nothing;

drop policy if exists "workspace-files read" on storage.objects;
create policy "workspace-files read" on storage.objects for select to authenticated
  using (bucket_id = 'workspace-files');
drop policy if exists "workspace-files upload own" on storage.objects;
create policy "workspace-files upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'workspace-files' and (storage.foldername(name))[1] = 'users'
              and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "workspace-files update own" on storage.objects;
create policy "workspace-files update own" on storage.objects for update to authenticated
  using (bucket_id = 'workspace-files' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists "workspace-files delete own" on storage.objects;
create policy "workspace-files delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'workspace-files' and (storage.foldername(name))[1] = 'users'
              and (storage.foldername(name))[2] = auth.uid()::text);
