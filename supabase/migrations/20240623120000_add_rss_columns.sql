-- Migration: Add RSS tracker enhancements
-- Date: 2024-06-23
-- Description: Add content_hash column, error_logs table, and performance indexes

-- 1. Add content_hash column to rss_articles for duplicate detection
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rss_articles' AND column_name = 'content_hash'
    ) THEN
        ALTER TABLE rss_articles 
        ADD COLUMN content_hash TEXT;
        
        -- Update existing records with MD5 hash of title+content
        UPDATE rss_articles 
        SET content_hash = MD5(CONCAT(COALESCE(title, ''), '-', COALESCE(content, '')))
        WHERE content_hash IS NULL;
        
        -- Make content_hash NOT NULL after populating existing records
        ALTER TABLE rss_articles 
        ALTER COLUMN content_hash SET NOT NULL;
        
        RAISE NOTICE 'Added content_hash column to rss_articles';
    END IF;
END $$;

-- 2. Add last_processed_at timestamp to rss_articles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rss_articles' AND column_name = 'last_processed_at'
    ) THEN
        ALTER TABLE rss_articles 
        ADD COLUMN last_processed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added last_processed_at column to rss_articles';
    END IF;
END $$;

-- 3. Create error_logs table for tracking RSS feed failures
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    error_message TEXT NOT NULL,
    feed_source TEXT NOT NULL,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment to error_logs table
COMMENT ON TABLE error_logs IS 'Tracks RSS feed processing errors and failures';
COMMENT ON COLUMN error_logs.timestamp IS 'When the error occurred';
COMMENT ON COLUMN error_logs.error_message IS 'The error message or description';
COMMENT ON COLUMN error_logs.feed_source IS 'Which RSS feed source caused the error';
COMMENT ON COLUMN error_logs.stack_trace IS 'Optional stack trace for debugging';

-- 4. Create indexes for performance optimization

-- Index on content_hash for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_rss_articles_content_hash 
ON rss_articles(content_hash);

-- Index on url for fast URL lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_rss_articles_url 
ON rss_articles(url);

-- Index on source for filtering by feed source
CREATE INDEX IF NOT EXISTS idx_rss_articles_source 
ON rss_articles(source);

-- Index on published_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_rss_articles_published_at 
ON rss_articles(published_at DESC);

-- Index on is_processed for filtering unprocessed articles
CREATE INDEX IF NOT EXISTS idx_rss_articles_is_processed 
ON rss_articles(is_processed);

-- Composite index for efficient duplicate checking
CREATE INDEX IF NOT EXISTS idx_rss_articles_url_content_hash 
ON rss_articles(url, content_hash);

-- Index on error_logs for efficient querying by timestamp and source
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp 
ON error_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_feed_source 
ON error_logs(feed_source);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp_source 
ON error_logs(timestamp DESC, feed_source);

-- 5. Add constraints and defaults

-- Ensure content_hash has a reasonable length limit
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'rss_articles_content_hash_length'
    ) THEN
        ALTER TABLE rss_articles 
        ADD CONSTRAINT rss_articles_content_hash_length 
        CHECK (LENGTH(content_hash) <= 64);
        
        RAISE NOTICE 'Added content_hash length constraint';
    END IF;
END $$;

-- Ensure error_message is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'error_logs_error_message_not_empty'
    ) THEN
        ALTER TABLE error_logs 
        ADD CONSTRAINT error_logs_error_message_not_empty 
        CHECK (LENGTH(TRIM(error_message)) > 0);
        
        RAISE NOTICE 'Added error_message not empty constraint';
    END IF;
END $$;

-- 6. Create function to automatically update content_hash on insert/update
CREATE OR REPLACE FUNCTION update_content_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_hash := MD5(CONCAT(COALESCE(NEW.title, ''), '-', COALESCE(NEW.content, '')));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update content_hash
DROP TRIGGER IF EXISTS trigger_update_content_hash ON rss_articles;
CREATE TRIGGER trigger_update_content_hash
    BEFORE INSERT OR UPDATE OF title, content ON rss_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_content_hash();

-- 7. Create function to clean up old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM error_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to cleanup function
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Removes error log entries older than 30 days';

-- 8. Grant necessary permissions (adjust as needed for your setup)
-- Grant permissions to authenticated users for reading
GRANT SELECT ON error_logs TO authenticated;

-- Grant permissions to service role for full access
GRANT ALL ON error_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE error_logs_id_seq TO service_role;

-- Migration completion message
DO $$
BEGIN
    RAISE NOTICE 'RSS tracker migration completed successfully';
    RAISE NOTICE 'Added: content_hash column, last_processed_at column, error_logs table';
    RAISE NOTICE 'Created: Performance indexes and constraints';
    RAISE NOTICE 'Created: Automatic content_hash trigger and cleanup function';
END $$;