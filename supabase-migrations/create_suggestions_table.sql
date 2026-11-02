-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  email TEXT,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  denied_by TEXT,
  denied_at TIMESTAMPTZ,
  delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow public read access
CREATE POLICY "Public read suggestions" ON suggestions
  FOR SELECT USING (true);

-- Allow public insert (for suggestions)
CREATE POLICY "Public insert suggestions" ON suggestions
  FOR INSERT WITH CHECK (true);

-- Allow update for authenticated users (via service role in backend)
CREATE POLICY "Service role update suggestions" ON suggestions
  FOR UPDATE USING (true);

-- Allow delete for authenticated users (via service role in backend)
CREATE POLICY "Service role delete suggestions" ON suggestions
  FOR DELETE USING (true);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_timestamp ON suggestions(timestamp DESC);

-- Add comment
COMMENT ON TABLE suggestions IS 'User suggestions with approval workflow';
