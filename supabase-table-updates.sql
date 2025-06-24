-- 1. CREATE OR UPDATE ARTICLES TABLE
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

-- 2. UPDATE EXISTING WAR_EVENTS TABLE (add missing columns)
ALTER TABLE public.war_events 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS severity VARCHAR(50),
ADD COLUMN IF NOT EXISTS source VARCHAR(255),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coordinates POINT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. CREATE RSS_SOURCES TABLE (for tracking RSS feed sources)
CREATE TABLE IF NOT EXISTS public.rss_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    category VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_war_related ON public.articles(is_war_related);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at);

CREATE INDEX IF NOT EXISTS idx_war_events_event_date ON public.war_events(event_date);
CREATE INDEX IF NOT EXISTS idx_war_events_severity ON public.war_events(severity);
CREATE INDEX IF NOT EXISTS idx_war_events_created_at ON public.war_events(created_at);
CREATE INDEX IF NOT EXISTS idx_war_events_event_type ON public.war_events(event_type);

-- 5. INSERT DEFAULT RSS SOURCES
INSERT INTO public.rss_sources (name, url, category, language) VALUES
('BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'international', 'en'),
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'international', 'en'),
('CNN World', 'http://rss.cnn.com/rss/edition_world.rss', 'international', 'en'),
('Guardian World', 'https://www.theguardian.com/world/rss', 'international', 'en')
ON CONFLICT (name) DO NOTHING;

-- 6. ENABLE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

-- 7. CREATE POLICIES FOR PUBLIC READ ACCESS
CREATE POLICY "Enable read access for all users" ON public.articles
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.war_events
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.rss_sources
    FOR SELECT USING (true);

-- 8. CREATE POLICIES FOR INSERT/UPDATE (for your backend service)
-- You'll need to replace 'your-service-role-key' with your actual service role
CREATE POLICY "Enable insert for service role" ON public.articles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON public.articles
    FOR UPDATE USING (true);

CREATE POLICY "Enable insert for service role" ON public.war_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON public.war_events
    FOR UPDATE USING (true);
