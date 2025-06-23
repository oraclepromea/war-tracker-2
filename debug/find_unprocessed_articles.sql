-- Find unprocessed articles for testing
-- Run this in Supabase SQL Editor

SELECT 
    id,
    title,
    SUBSTRING(content, 1, 100) as content_preview,
    is_processed,
    published_at,
    created_at
FROM rss_articles 
WHERE is_processed = false 
   OR is_processed IS NULL
ORDER BY created_at DESC 
LIMIT 10;

-- If no unprocessed articles, reset one for testing
-- UPDATE rss_articles 
-- SET is_processed = false 
-- WHERE id = '626ab425-89c7-477c-8800-092aed9be454';