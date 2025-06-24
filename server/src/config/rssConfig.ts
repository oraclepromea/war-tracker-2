// VERIFIED WORKING RSS SOURCES - Updated 2024
export const RSS_SOURCES = [
  {
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'international',
    timeout: 10000
  },
  {
    name: 'Reuters World',
    url: 'https://feeds.reuters.com/reuters/worldNews',
    category: 'international', 
    timeout: 10000
  },
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'international',
    timeout: 10000
  },
  {
    name: 'Deutsche Welle',
    url: 'https://rss.dw.com/xml/rss-en-all',
    category: 'international',
    timeout: 10000
  }
];

export const FALLBACK_RSS_SOURCES = [
  {
    name: 'France24',
    url: 'https://www.france24.com/en/rss',
    category: 'international',
    timeout: 8000
  },
  {
    name: 'Euronews',
    url: 'https://www.euronews.com/rss?format=mrss',
    category: 'international',
    timeout: 8000
  }
];

export const RSS_FEEDS = [
  // Working feeds only
  {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'news',
    enabled: true
  },
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'news',
    enabled: true
  },
  {
    name: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    category: 'news',
    enabled: true
  },
  {
    name: 'NPR World',
    url: 'https://feeds.npr.org/1004/rss.xml',
    category: 'news',
    enabled: true
  },
  {
    name: 'DW English',
    url: 'https://rss.dw.com/xml/rss-en-world',
    category: 'news',
    enabled: true
  }
];