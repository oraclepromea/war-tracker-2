const express = require('express');
const Parser = require('rss-parser');
const router = express.Router();

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'War-Tracker-2.0/1.0 (https://war-tracker.com)',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  }
});

// RSS feed sources with reliability scores
const RSS_SOURCES = [
  { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/worldNews', reliability: 95, icon: '📰' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', reliability: 93, icon: '🏛️' },
  { name: 'Associated Press', url: 'https://feeds.apnews.com/ApTopHeadlines', reliability: 94, icon: '📡' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition.rss', reliability: 87, icon: '📺' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 85, icon: '🌍' },
  { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', reliability: 87, icon: '🇮🇱' },
  { name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeed', reliability: 86, icon: '📰' },
  { name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss.xml', reliability: 82, icon: '👁️' },
  { name: 'Al Arabiya', url: 'https://english.alarabiya.net/rss.xml', reliability: 84, icon: '🕌' },
  { name: 'Kyiv Independent', url: 'https://kyivindependent.com/rss/', reliability: 88, icon: '🇺🇦' },
  { name: 'Ukraine World', url: 'https://ukraine.ua/news/rss/', reliability: 85, icon: '🌍' },
  { name: 'US State Department', url: 'https://www.state.gov/rss/', reliability: 97, icon: '🇺🇸' },
  { name: 'Pentagon News', url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', reliability: 98, icon: '🛡️' },
  { name: 'NATO News', url: 'https://www.nato.int/rss/news.xml', reliability: 98, icon: '🤝' },
  { name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', reliability: 94, icon: '🇺🇳' },
  { name: 'ReliefWeb', url: 'https://reliefweb.int/rss.xml', reliability: 92, icon: '🚨' },
  { name: 'OCHA', url: 'https://www.unocha.org/rss.xml', reliability: 93, icon: '🆘' },
  { name: 'UNHCR', url: 'https://www.unhcr.org/rss.xml', reliability: 91, icon: '🏕️' },
  { name: 'France24', url: 'https://www.france24.com/en/rss', reliability: 89, icon: '🇫🇷' },
  { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all', reliability: 88, icon: '🇩🇪' },
  { name: 'RT News', url: 'https://www.rt.com/rss/', reliability: 70, icon: '🇷🇺' },
  { name: 'TASS', url: 'https://tass.com/rss/v2.xml', reliability: 75, icon: '📻' }
];

// Cache for articles (in production, use Redis or database)
let articlesCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch articles from a single RSS source
async function fetchFromSource(source) {
  try {
    console.log(`🔄 Fetching from ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    const articles = feed.items.slice(0, 10).map(item => ({
      id: `${source.name}-${item.guid || item.link || Date.now()}-${Math.random()}`,
      title: item.title || 'No title',
      description: item.contentSnippet || item.content || item.summary || 'No description available',
      url: item.link || '#',
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      source: {
        name: source.name,
        reliability: source.reliability,
        icon: source.icon
      },
      category: item.categories?.[0] || 'General'
    }));

    console.log(`✅ ${source.name}: ${articles.length} articles fetched`);
    return articles;
  } catch (error) {
    console.error(`❌ Error fetching from ${source.name}:`, error.message);
    return [];
  }
}

// Fetch articles from all sources
async function fetchAllArticles() {
  console.log('🚀 Starting RSS fetch from all sources...');
  
  const promises = RSS_SOURCES.map(source => fetchFromSource(source));
  const results = await Promise.allSettled(promises);
  
  const allArticles = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.error(`❌ Failed to fetch from ${RSS_SOURCES[index].name}:`, result.reason);
    }
  });

  // Sort by publication date (newest first)
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  console.log(`📰 Total articles fetched: ${allArticles.length}`);
  return allArticles;
}

// GET /api/live/articles - Fetch latest articles
router.get('/articles', async (req, res) => {
  try {
    const now = Date.now();
    
    // Use cache if it's still fresh
    if (articlesCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('📋 Serving cached articles');
      return res.json(articlesCache);
    }

    // Fetch fresh articles
    const articles = await fetchAllArticles();
    
    // Update cache
    articlesCache = articles;
    lastFetchTime = now;
    
    res.json(articles);
  } catch (error) {
    console.error('❌ Error in /api/live/articles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch articles',
      message: error.message 
    });
  }
});

// GET /api/live/sources - Get RSS source status
router.get('/sources', (req, res) => {
  const sourcesWithStats = RSS_SOURCES.map(source => ({
    ...source,
    status: 'active',
    lastFetch: new Date().toISOString(),
    articleCount: articlesCache.filter(article => article.source.name === source.name).length
  }));
  
  res.json(sourcesWithStats);
});

// POST /api/live/refresh - Force refresh all sources
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh requested');
    const articles = await fetchAllArticles();
    
    // Update cache
    articlesCache = articles;
    lastFetchTime = Date.now();
    
    res.json({ 
      success: true, 
      count: articles.length,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in force refresh:', error);
    res.status(500).json({ 
      error: 'Failed to refresh articles',
      message: error.message 
    });
  }
});

module.exports = router;