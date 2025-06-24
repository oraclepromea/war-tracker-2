-- Execute in Supabase SQL Editor or Railway Database
BEGIN;

-- Check if net schema exists and migrate tables
DO $$
BEGIN
    -- Migrate articles table if it exists in net schema
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'net' AND table_name = 'articles'
    ) THEN
        RAISE NOTICE 'Migrating net.articles to public schema...';
        ALTER TABLE net.articles SET SCHEMA public;
    END IF;

    -- Migrate war_events table if it exists in net schema
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'net' AND table_name = 'war_events'
    ) THEN
        RAISE NOTICE 'Migrating net.war_events to public schema...';
        ALTER TABLE net.war_events SET SCHEMA public;
    END IF;

    -- Migrate rss_articles table if it exists in net schema
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'net' AND table_name = 'rss_articles'
    ) THEN
        RAISE NOTICE 'Migrating net.rss_articles to public schema...';
        ALTER TABLE net.rss_articles SET SCHEMA public;
    END IF;
END $$;

-- Create schema audit view
CREATE OR REPLACE VIEW schema_audit AS
SELECT 
    schemaname,
    COUNT(*) AS table_count,
    array_agg(tablename ORDER BY tablename) AS tables
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;

COMMIT;
