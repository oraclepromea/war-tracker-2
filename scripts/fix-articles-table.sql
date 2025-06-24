-- Add the missing column if it doesn't exist
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'articles' AND table_schema = 'public'
ORDER BY ordinal_position;
