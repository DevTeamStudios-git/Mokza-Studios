-- Lock down Row Level Security.
-- The Express backend uses the service-role key, which bypasses RLS, so no browser-facing
-- (anon / authenticated) policy is needed. With RLS enabled and NO policies, the public anon key
-- (which was exposed in git history) can no longer read or write any of these tables directly.

DROP POLICY IF EXISTS "Public read access to website_state" ON website_state;
DROP POLICY IF EXISTS "Public write access to website_state" ON website_state;
DROP POLICY IF EXISTS "Public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Public write access to announcements" ON announcements;
DROP POLICY IF EXISTS "Public read access to tasks" ON tasks;
DROP POLICY IF EXISTS "Public write access to tasks" ON tasks;
DROP POLICY IF EXISTS "Public read access to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Public write access to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Public read suggestions" ON suggestions;
DROP POLICY IF EXISTS "Public insert suggestions" ON suggestions;
DROP POLICY IF EXISTS "Service role update suggestions" ON suggestions;
DROP POLICY IF EXISTS "Service role delete suggestions" ON suggestions;

ALTER TABLE IF EXISTS website_state  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suggestions    ENABLE ROW LEVEL SECURITY;
-- tables created outside this repo's schema files
ALTER TABLE IF EXISTS user_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS call_state     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files          ENABLE ROW LEVEL SECURITY;
