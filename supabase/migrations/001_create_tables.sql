-- Create rss_articles table with URL uniqueness constraint
CREATE TABLE IF NOT EXISTS rss_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL UNIQUE, -- Enforce URL uniqueness
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT NOT NULL, -- For content change detection
  is_processed BOOLEAN DEFAULT FALSE, -- Processing flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rss_articles_url ON rss_articles(url);
CREATE INDEX IF NOT EXISTS idx_rss_articles_processed ON rss_articles(is_processed);
CREATE INDEX IF NOT EXISTS idx_rss_articles_fetched_at ON rss_articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_articles_source ON rss_articles(source);

-- Create war_events table
CREATE TABLE IF NOT EXISTS war_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('airstrike', 'humanitarian', 'cyberattack', 'diplomatic')),
  country TEXT NOT NULL,
  region TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  casualties INTEGER CHECK (casualties >= 0),
  weapons_used TEXT[],
  source_country TEXT,
  target_country TEXT,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  article_id UUID REFERENCES rss_articles(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_source TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for war_events performance
CREATE INDEX IF NOT EXISTS idx_war_events_country ON war_events(country);
CREATE INDEX IF NOT EXISTS idx_war_events_processed_at ON war_events(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_war_events_threat_level ON war_events(threat_level);
CREATE INDEX IF NOT EXISTS idx_war_events_event_type ON war_events(event_type);
CREATE INDEX IF NOT EXISTS idx_war_events_article_id ON war_events(article_id);

-- Enable Row Level Security (RLS)
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on rss_articles"
ON rss_articles FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Allow public read access on war_events"
ON war_events FOR SELECT
TO PUBLIC
USING (true);

-- Create policies for service role write access
CREATE POLICY "Allow service role full access on rss_articles"
ON rss_articles FOR ALL
TO service_role
USING (true);

CREATE POLICY "Allow service role full access on war_events"
ON war_events FOR ALL
TO service_role
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to rss_articles
CREATE TRIGGER update_rss_articles_updated_at
  BEFORE UPDATE ON rss_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rss_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE war_events;