-- Create match_stats table to store scraped Footmercato data
CREATE TABLE IF NOT EXISTS match_stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  formations JSONB,
  stats JSONB,
  player_performances JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_match_stats_match_id ON match_stats(match_id);

-- Enable RLS
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read on match_stats"
  ON match_stats FOR SELECT
  USING (true);

-- Allow authenticated write access
CREATE POLICY "Allow authenticated write on match_stats"
  ON match_stats FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on match_stats"
  ON match_stats FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
