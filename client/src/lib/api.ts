export const API_ENDPOINTS = {
  events: '/api/events',
  news: '/api/news',
  countries: '/api/countries',
  live: '/api/live'
};

// Fix: Use VITE_ prefix for Vite environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const RSS_SOURCES = [
  { name: 'BBC News', category: 'general', language: 'en', url: 'http://feeds.bbci.co.uk/news/rss.xml', needsTranslation: false, priority: 'medium' as const },
  { name: 'Al Jazeera', category: 'general', language: 'en', url: 'https://www.aljazeera.com/xml/rss/all.xml', needsTranslation: false, priority: 'high' as const },
  { name: 'Reuters', category: 'general', language: 'en', url: 'https://www.reuters.com/tools/rss', needsTranslation: false, priority: 'high' as const },
  { name: 'Defense News', category: 'military', language: 'en', url: 'https://www.defensenews.com/rss/', needsTranslation: false, priority: 'high' as const }
];

export const OSINT_TWITTER_SOURCES = [
  { name: 'OSINTdefender', category: 'military', language: 'en', url: '', needsTranslation: false, priority: 'high' as const },
  { name: 'IntelCrab', category: 'military', language: 'en', url: '', needsTranslation: false, priority: 'medium' as const }
];

export const TELEGRAM_INTELLIGENCE_CHANNELS = [
  { name: 'Intel Slava Z', category: 'military', language: 'en', url: '', needsTranslation: false, priority: 'medium' as const }
];

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}
