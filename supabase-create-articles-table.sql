-- CREATE THE ARTICLES TABLE THAT YOUR BACKEND IS EXPECTING
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

-- ADD MISSING COLUMNS TO EXISTING WAR_EVENTS TABLE
ALTER TABLE public.war_events 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS severity VARCHAR(50),
ADD COLUMN IF NOT EXISTS source VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS coordinates POINT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_war_related ON public.articles(is_war_related);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY FOR PUBLIC READ ACCESS
CREATE POLICY "Enable read access for all users" ON public.articles
    FOR SELECT USING (true);

-- CREATE POLICY FOR SERVICE ROLE INSERTS
CREATE POLICY "Enable insert for authenticated users" ON public.articles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.articles
    FOR UPDATE USING (true);
