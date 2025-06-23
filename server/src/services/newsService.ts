import Parser from 'rss-parser';

interface RSSSource {
  name: string;
  url: string;
  category: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  category: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'War-Tracker-2.0/1.0'
  }
});

let articlesCache: Article[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Working RSS sources (tested to avoid XML errors)
const RSS_SOURCES: RSSSource[] = [
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition.rss', category: 'world' },
  { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', category: 'world' },
  { name: 'AP News', url: 'https://feeds.apnews.com/rss/apf-topnews', category: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
];

const isRelevantArticle = (title: string, description: string): boolean => {
  const keywords = [
    'war', 'conflict', 'military', 'attack', 'strike', 'missile', 'bomb',
    'ukraine', 'russia', 'israel', 'palestine', 'gaza', 'syria', 'iran',
    'nato', 'pentagon', 'defense', 'army', 'navy', 'air force',
    'ceasefire', 'peace', 'diplomatic', 'sanctions', 'weapons'
  ];
  
  const text = (title + ' ' + description).toLowerCase();
  return keywords.some(keyword => text.includes(keyword));
};

const fetchFromSource = async (source: RSSSource): Promise<Article[]> => {
  try {
    console.log(`📡 News Service: Fetching from ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const articles: Article[] = [];
    
    feed.items?.forEach((item, index) => {
      if (item.title && item.link) {
        const title = item.title;
        const description = item.contentSnippet || item.content || item.summary || '';
        
        if (isRelevantArticle(title, description)) {
          articles.push({
            id: `${source.name}-${index}-${Date.now()}`,
            title: title,
            description: description,
            url: item.link,
            publishedAt: item.pubDate || new Date().toISOString(),
            source: { name: source.name },
            category: source.category
          });
        }
      }
    });
    
    console.log(`✅ News Service ${source.name}: ${articles.length} relevant articles`);
    return articles;
    
  } catch (error) {
    console.log(`❌ News Service failed to fetch ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

const fetchAllRSSFeeds = async (): Promise<Article[]> => {
  console.log('🔍 News Service: Fetching RSS feeds...');
  
  const allArticles: Article[] = [];
  
  for (const source of RSS_SOURCES) {
    const articles = await fetchFromSource(source);
    allArticles.push(...articles);
  }
  
  // Sort by publication date (newest first)
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  console.log(`✅ News Service: ${allArticles.length} total articles cached`);
  return allArticles;
};

export const getRSSArticles = async (limit?: number): Promise<Article[]> => {
  const now = Date.now();
  
  // Refresh cache if it's older than CACHE_DURATION or empty
  if (now - lastFetchTime > CACHE_DURATION || articlesCache.length === 0) {
    console.log('🔄 News Service: Refreshing RSS cache...');
    articlesCache = await fetchAllRSSFeeds();
    lastFetchTime = now;
  }
  
  const result = limit ? articlesCache.slice(0, limit) : articlesCache;
  console.log(`📊 News Service: Returning ${result.length} articles (requested: ${limit || 'all'})`);
  return result;
};

// Initialize cache on startup
export const initializeNewsService = async (): Promise<void> => {
  try {
    console.log('🚀 News Service: Initializing...');
    articlesCache = await fetchAllRSSFeeds();
    lastFetchTime = Date.now();
    console.log('✅ News Service: Initialized successfully');
  } catch (error) {
    console.error('❌ News Service: Failed to initialize:', error);
  }
};