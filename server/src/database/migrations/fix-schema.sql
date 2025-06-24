-- Fix schema issues by ensuring all tables use public schema
-- and create any missing schemas if needed

-- Option 1: Create the 'net' schema if it's actually needed
-- CREATE SCHEMA IF NOT EXISTS net;

-- Option 2: Check if tables are in correct schema (recommended)
-- Move tables to public schema if they're in wrong location

-- Check current schema usage
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename IN ('articles', 'war_events', 'rss_sources');

-- Fix any tables that might be in wrong schema
-- ALTER TABLE IF EXISTS net.articles SET SCHEMA public;
-- ALTER TABLE IF EXISTS net.war_events SET SCHEMA public;
-- ALTER TABLE IF EXISTS net.rss_sources SET SCHEMA public;

-- Ensure all tables exist in public schema
CREATE TABLE IF NOT EXISTS public.articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT UNIQUE NOT NULL,
    source VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_war_related BOOLEAN DEFAULT FALSE,
    sentiment VARCHAR(50),
    keywords TEXT[],
    language VARCHAR(10) DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS public.war_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    location VARCHAR(255),
    severity VARCHAR(50),
    source VARCHAR(255),
    source_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    coordinates POINT,
    tags TEXT[]
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_war_related ON public.articles(is_war_related);
CREATE INDEX IF NOT EXISTS idx_war_events_event_date ON public.war_events(event_date);
CREATE INDEX IF NOT EXISTS idx_war_events_severity ON public.war_events(severity);
