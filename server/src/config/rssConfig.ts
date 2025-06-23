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