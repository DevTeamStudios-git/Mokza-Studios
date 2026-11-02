-- ============================================================================
-- Mokza Studios Website - Supabase Database Schema
-- Project Ref: pgxgfhqwzkdayhbyqfvl
-- URL: https://pgxgfhqwzkdayhbyqfvl.supabase.co
-- ============================================================================

-- Enable the UUID extension if not already enabled (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. website_state
-- Stores the full website state as a single JSONB document.
-- Used by the website state API to persist application-wide data (projects,
-- announcements list, test fields, etc.) in one row identified by a fixed UUID.
-- ============================================================================
CREATE TABLE IF NOT EXISTS website_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table comment
COMMENT ON TABLE website_state IS 'Stores the full website state as JSONB. Single row identified by fixed UUID (00000000-0000-0000-0000-000000000001). Used by /api/website-state endpoints.';
COMMENT ON COLUMN website_state.id IS 'Primary key UUID. Fixed value 00000000-0000-0000-0000-000000000001 used by application code for upsert.';
COMMENT ON COLUMN website_state.data IS 'Full website state stored as JSONB. Default empty object.';
COMMENT ON COLUMN website_state.updated_at IS 'Timestamp of the last state update. Defaults to now().';

-- Enable Row Level Security
ALTER TABLE website_state ENABLE ROW LEVEL SECURITY;

-- Policy: public read access (anyone can read the website state)
CREATE POLICY "Public read access to website_state"
  ON website_state
  FOR SELECT
  TO public
  USING (true);

-- Policy: public write access (anyone can insert/update/delete the website state)
CREATE POLICY "Public write access to website_state"
  ON website_state
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index on updated_at for ordering queries (most recent state first)
CREATE INDEX IF NOT EXISTS idx_website_state_updated_at ON website_state(updated_at DESC);

-- ============================================================================
-- 2. announcements
-- Stores website announcements displayed on the site.
-- Supports two audience types: 'all' (everyone) and 'staff' (staff only).
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'all' CHECK (type IN ('all', 'staff')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE announcements IS 'Stores website announcements. Type can be "all" or "staff". Ordered by timestamp descending.';
COMMENT ON COLUMN announcements.id IS 'Primary key UUID.';
COMMENT ON COLUMN announcements.type IS 'Audience type: "all" or "staff". Defaults to "all".';
COMMENT ON COLUMN announcements.title IS 'Announcement title.';
COMMENT ON COLUMN announcements.content IS 'Announcement body content.';
COMMENT ON COLUMN announcements.author IS 'Author of the announcement.';
COMMENT ON COLUMN announcements.timestamp IS 'Timestamp when the announcement was created. Defaults to now().';

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to announcements"
  ON announcements
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public write access to announcements"
  ON announcements
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index on type for filtering announcements by audience (all vs staff)
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
-- Index on timestamp for ordering and time-based queries
CREATE INDEX IF NOT EXISTS idx_announcements_timestamp ON announcements(timestamp DESC);
-- Composite index for the common query pattern: filter by type, order by timestamp
CREATE INDEX IF NOT EXISTS idx_announcements_type_timestamp ON announcements(type, timestamp DESC);

-- ============================================================================
-- 3. tasks
-- Stores website tasks (to-do items) for the team.
-- Supports priority levels (low, medium, high), assignee, due date, and done status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  due_date TEXT,
  author TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tasks IS 'Stores website tasks/to-do items. Supports priority, assignee, due date, and completion status.';
COMMENT ON COLUMN tasks.id IS 'Primary key UUID.';
COMMENT ON COLUMN tasks.title IS 'Task title.';
COMMENT ON COLUMN tasks.description IS 'Optional task description.';
COMMENT ON COLUMN tasks.priority IS 'Priority level: low, medium, or high. Defaults to medium.';
COMMENT ON COLUMN tasks.assignee IS 'Person assigned to the task (optional).';
COMMENT ON COLUMN tasks.due_date IS 'Due date as a text string (ISO format).';
COMMENT ON COLUMN tasks.author IS 'Author/creator of the task.';
COMMENT ON COLUMN tasks.done IS 'Whether the task is completed. Defaults to false.';
COMMENT ON COLUMN tasks.created_at IS 'Timestamp when the task was created. Defaults to now().';

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public write access to tasks"
  ON tasks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index on created_at for ordering tasks by recency (newest first)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
-- Index on done for filtering completed vs pending tasks
CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done);
-- Index on priority for filtering by priority level
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
-- Index on assignee for filtering tasks assigned to a specific person
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
-- Composite index for common query: filter by done status, order by created_at
CREATE INDEX IF NOT EXISTS idx_tasks_done_created_at ON tasks(done, created_at DESC);

-- ============================================================================
-- 4. chat_messages
-- Stores chat messages for the Office Hub chat feature.
-- Messages belong to a channel (default "general") and include sender info,
-- optional rank, text content, optional embed data, and bot flag.
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'general',
  "from" TEXT NOT NULL,
  rank TEXT,
  text TEXT NOT NULL,
  t TEXT,
  is_bot BOOLEAN DEFAULT false,
  embed JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE chat_messages IS 'Stores chat messages for Office Hub. Organized by channel. Supports bot messages and rich embeds via JSONB.';
COMMENT ON COLUMN chat_messages.id IS 'Primary key UUID.';
COMMENT ON COLUMN chat_messages.channel IS 'Chat channel name. Defaults to "general".';
COMMENT ON COLUMN chat_messages."from" IS 'Sender of the message.';
COMMENT ON COLUMN chat_messages.rank IS 'Optional rank/role of the sender.';
COMMENT ON COLUMN chat_messages.text IS 'Message text content.';
COMMENT ON COLUMN chat_messages.t IS 'Optional timestamp string for the message.';
COMMENT ON COLUMN chat_messages.is_bot IS 'Whether the message was sent by a bot. Defaults to false.';
COMMENT ON COLUMN chat_messages.embed IS 'Optional rich embed data stored as JSONB.';
COMMENT ON COLUMN chat_messages.created_at IS 'Timestamp when the message was stored. Defaults to now().';

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to chat_messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public write access to chat_messages"
  ON chat_messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index on channel for filtering messages by channel (e.g., "general")
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
-- Index on created_at for ordering messages chronologically
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
-- Composite index for common query: get messages in a channel ordered by time
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created_at ON chat_messages(channel, created_at);
-- Index on is_bot for filtering bot vs human messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_bot ON chat_messages(is_bot);

-- ============================================================================
-- End of schema
-- ============================================================================
