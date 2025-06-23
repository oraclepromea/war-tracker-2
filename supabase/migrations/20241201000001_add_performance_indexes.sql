-- Performance optimization indexes for War Tracker 2.0
-- Migration: 20241201000001_add_performance_indexes.sql

-- Index for fetching unprocessed RSS articles (critical for batch processing)
CREATE INDEX IF NOT EXISTS idx_rss_unprocessed 
ON rss_articles (is_processed, fetched_at) 
WHERE is_processed = false;

-- Index for war events ordered by timestamp (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_war_events_timestamp 
ON war_events (timestamp DESC);

-- Composite index for war events by country and event type (filtering)
CREATE INDEX IF NOT EXISTS idx_war_events_country_type 
ON war_events (country, event_type, timestamp DESC);

-- Index for war events by threat level (priority queries)
CREATE INDEX IF NOT EXISTS idx_war_events_threat_level 
ON war_events (threat_level, timestamp DESC);

-- Index for RSS articles by source and processed status (monitoring)
CREATE INDEX IF NOT EXISTS idx_rss_articles_source_processed 
ON rss_articles (source, is_processed, fetched_at DESC);

-- Index for war events with geographic coordinates (map queries)
CREATE INDEX IF NOT EXISTS idx_war_events_coordinates 
ON war_events (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Partial index for high-confidence war events (analytics)
CREATE INDEX IF NOT EXISTS idx_war_events_high_confidence 
ON war_events (confidence DESC, timestamp DESC) 
WHERE confidence >= 80;

-- Index for content hash lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_rss_articles_content_hash 
ON rss_articles (content_hash);

-- Index for article URLs (duplicate detection and updates)
CREATE INDEX IF NOT EXISTS idx_rss_articles_url 
ON rss_articles (url);

-- Composite index for recent war events by confidence
CREATE INDEX IF NOT EXISTS idx_war_events_recent_confident 
ON war_events (timestamp DESC, confidence DESC) 
WHERE timestamp >= (NOW() - INTERVAL '30 days');

-- Comment explaining index strategy
COMMENT ON INDEX idx_rss_unprocessed IS 'Optimizes batch fetching of unprocessed articles for AI analysis';
COMMENT ON INDEX idx_war_events_timestamp IS 'Optimizes timeline queries and recent events dashboard';
COMMENT ON INDEX idx_war_events_country_type IS 'Optimizes country-specific and event-type filtering';
COMMENT ON INDEX idx_war_events_threat_level IS 'Optimizes threat-level based queries and alerts';
COMMENT ON INDEX idx_rss_articles_source_processed IS 'Optimizes monitoring and source-specific queries';
COMMENT ON INDEX idx_war_events_coordinates IS 'Optimizes map-based queries and geographic analysis';
COMMENT ON INDEX idx_war_events_high_confidence IS 'Optimizes high-confidence event analytics';

-- Additional database optimizations
-- Set maintenance work memory for better index creation
SET maintenance_work_mem = '256MB';

-- Update table statistics for better query planning
ANALYZE rss_articles;
ANALYZE war_events;