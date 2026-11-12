-- Applied to production (project pgxgfhqwzkdayhbyqfvl) on 2026-11-12 as migration "lock_down_host_tables".
--
-- Why: lock_down_rls.sql had never been applied. Policies granting role "public" USING (true) let anyone
-- holding the anon key read and write website_state, announcements, tasks, chat_messages and suggestions
-- (including submitter emails) directly through the Data API, bypassing every check in the host API.
--
-- Effect: the host API connects with the service-role key, which bypasses RLS, so the site is unaffected.
-- Verified after applying: API row counts match the database, and anon and publishable keys get
-- 42501 permission denied on every host table.
--
-- The ws_* workspace tables use Supabase Auth policies and are deliberately left unchanged.

drop policy if exists "Public read access to website_state"  on public.website_state;
drop policy if exists "Public write access to website_state" on public.website_state;
drop policy if exists "Public read access to announcements"  on public.announcements;
drop policy if exists "Public write access to announcements" on public.announcements;
drop policy if exists "Public read access to tasks"          on public.tasks;
drop policy if exists "Public write access to tasks"         on public.tasks;
drop policy if exists "Public read access to chat_messages"  on public.chat_messages;
drop policy if exists "Public write access to chat_messages" on public.chat_messages;
drop policy if exists "Public read suggestions"              on public.suggestions;
drop policy if exists "Public insert suggestions"            on public.suggestions;
drop policy if exists "Service role update suggestions"      on public.suggestions;
drop policy if exists "Service role delete suggestions"      on public.suggestions;

-- Defense in depth: browser-facing roles get no rights at all on host tables.
revoke all on table public.website_state, public.announcements, public.tasks,
  public.chat_messages, public.suggestions, public.user_accounts, public.role_requests,
  public.bot_commands, public.bot_data, public.bot_status
from anon, authenticated;

-- Rollback (only if something unexpectedly depended on anonymous access; re-opens the hole):
--   grant select, insert, update, delete on public.<table> to anon, authenticated;
--   create policy "..." on public.<table> for all to public using (true) with check (true);
