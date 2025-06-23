-- Check war_events table schema
-- Run this in Supabase SQL Editor to verify table structure

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'war_events'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'war_events'
);

-- Check recent war_events entries
SELECT 
    id,
    source_article,
    event_type,
    country,
    confidence,
    threat_level,
    timestamp,
    created_at
FROM war_events 
ORDER BY created_at DESC 
LIMIT 10;