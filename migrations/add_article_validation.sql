-- Migration: Add article validation columns and tables
-- File: /Users/RoRo_HQ/War Tracker 2.0/migrations/add_article_validation.sql

-- Add validation columns to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS validation_warnings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(3,2);

-- Create validation_errors table
CREATE TABLE IF NOT EXISTS validation_errors (
    id BIGSERIAL PRIMARY KEY,
    article_title TEXT,
    article_url TEXT,
    source TEXT NOT NULL,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    content_hash VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_metrics table (if not exists)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    batch_number INTEGER,
    articles_processed INTEGER DEFAULT 0,
    articles_failed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    memory_before_mb INTEGER,
    memory_after_mb INTEGER,
    memory_delta_mb INTEGER,
    heap_used_mb INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    batch_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create connection_errors table (if not exists)
CREATE TABLE IF NOT EXISTS connection_errors (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compound indexes for duplicate detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_content_hash 
ON articles (content_hash) WHERE content_hash IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_url_hash 
ON articles (link, content_hash) WHERE link IS NOT NULL AND content_hash IS NOT NULL;

-- Create text search index for similarity detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_title_search 
ON articles USING GIN (to_tsvector('english', title)) WHERE is_valid = true;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_created_at_valid 
ON articles (created_at DESC) WHERE is_valid = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_validation_errors_source_timestamp 
ON validation_errors (source, validation_timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_source_timestamp 
ON performance_metrics (source, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_errors_timestamp 
ON connection_errors (timestamp DESC);

-- Add comments for documentation
COMMENT ON COLUMN articles.is_valid IS 'Whether the article passed validation checks';
COMMENT ON COLUMN articles.content_hash IS 'SHA-256 hash of normalized title, description, URL and publish date';
COMMENT ON COLUMN articles.validation_warnings IS 'Non-critical validation warnings as JSON array';
COMMENT ON COLUMN articles.similarity_score IS 'Similarity score compared to existing articles (0-1)';

COMMENT ON TABLE validation_errors IS 'Log of articles that failed validation checks';
COMMENT ON TABLE performance_metrics IS 'Performance metrics for batch processing operations';
COMMENT ON TABLE connection_errors IS 'Log of connection and DNS errors during RSS fetching';

-- Create view for valid articles only
CREATE OR REPLACE VIEW valid_articles AS
SELECT 
    id,
    title,
    description,
    link,
    source,
    category,
    tags,
    pub_date,
    content_hash,
    validation_warnings,
    similarity_score,
    created_at,
    updated_at
FROM articles 
WHERE is_valid = true;

-- Create view for duplicate detection
CREATE OR REPLACE VIEW potential_duplicates AS
SELECT 
    a1.id as article_id,
    a1.title,
    a1.link,
    a1.source,
    a1.content_hash,
    a2.id as duplicate_id,
    a2.title as duplicate_title,
    a2.source as duplicate_source,
    a2.created_at as duplicate_created_at
FROM articles a1
JOIN articles a2 ON a1.content_hash = a2.content_hash 
WHERE a1.id < a2.id 
  AND a1.content_hash IS NOT NULL
  AND a1.is_valid = true 
  AND a2.is_valid = true;

-- Create function to update content hash automatically
CREATE OR REPLACE FUNCTION update_content_hash()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update hash if not already set or if content changed
    IF NEW.content_hash IS NULL OR 
       OLD.title != NEW.title OR 
       OLD.description != NEW.description OR 
       OLD.link != NEW.link OR 
       OLD.pub_date != NEW.pub_date THEN
        
        NEW.content_hash = encode(
            digest(
                CONCAT(
                    LOWER(TRIM(REGEXP_REPLACE(NEW.title, '\s+', ' ', 'g'))),
                    '|',
                    LOWER(TRIM(REGEXP_REPLACE(COALESCE(NEW.description, ''), '\s+', ' ', 'g'))),
                    '|',
                    LOWER(TRIM(NEW.link)),
                    '|',
                    COALESCE(DATE(NEW.pub_date)::TEXT, '')
                ), 
                'sha256'
            ), 
            'hex'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic hash generation
DROP TRIGGER IF EXISTS trigger_update_content_hash ON articles;
CREATE TRIGGER trigger_update_content_hash
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_content_hash();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON validation_errors TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT ON connection_errors TO authenticated;
GRANT SELECT ON valid_articles TO authenticated;
GRANT SELECT ON potential_duplicates TO authenticated;

-- Add RLS policies
ALTER TABLE validation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON validation_errors
    FOR SELECT USING (true);
    
CREATE POLICY "Enable insert for service role" ON validation_errors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON performance_metrics
    FOR SELECT USING (true);
    
CREATE POLICY "Enable insert for service role" ON performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON connection_errors
    FOR SELECT USING (true);
    
CREATE POLICY "Enable insert for service role" ON connection_errors
    FOR INSERT WITH CHECK (true);