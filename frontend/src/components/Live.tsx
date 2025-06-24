// DEPRECATED - Live component removed from application
// This file is no longer used after the Live tab was removed from navigation
// The functionality was consolidated into other components

import React, { useState, useEffect, useCallback } from 'react';

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
    reliability: number;
    icon: string;
  };
  category?: string;
}

interface RSSSource {
  name: string;
  url: string;
  reliability: number;
  icon: string;
  status: 'active' | 'inactive' | 'error';
  lastFetch?: string;
  articleCount?: number;
}

const Live: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize RSS sources with real feeds
  const initializeSources = useCallback(() => {
    const rssSources: RSSSource[] = [
      { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/worldNews', reliability: 95, icon: '📰', status: 'active' },
      { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', reliability: 93, icon: '🏛️', status: 'active' },
      { name: 'Associated Press', url: 'https://feeds.apnews.com/ApTopHeadlines', reliability: 94, icon: '📡', status: 'active' },
      { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition.rss', reliability: 87, icon: '📺', status: 'active' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', reliability: 85, icon: '🌍', status: 'active' },
      { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', reliability: 87, icon: '🇮🇱', status: 'active' },
      { name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeed', reliability: 86, icon: '📰', status: 'active' },
      { name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss.xml', reliability: 82, icon: '👁️', status: 'active' },
      { name: 'Al Arabiya', url: 'https://english.alarabiya.net/rss.xml', reliability: 84, icon: '🕌', status: 'active' },
      { name: 'Kyiv Independent', url: 'https://kyivindependent.com/rss/', reliability: 88, icon: '🇺🇦', status: 'active' },
      { name: 'Ukraine World', url: 'https://ukraine.ua/news/rss/', reliability: 85, icon: '🌍', status: 'active' },
      { name: 'US State Department', url: 'https://www.state.gov/rss/', reliability: 97, icon: '🇺🇸', status: 'active' },
      { name: 'Pentagon News', url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10', reliability: 98, icon: '🛡️', status: 'active' },
      { name: 'NATO News', url: 'https://www.nato.int/rss/news.xml', reliability: 98, icon: '🤝', status: 'active' },
      { name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', reliability: 94, icon: '🇺🇳', status: 'active' },
      { name: 'ReliefWeb', url: 'https://reliefweb.int/rss.xml', reliability: 92, icon: '🚨', status: 'active' },
      { name: 'OCHA', url: 'https://www.unocha.org/rss.xml', reliability: 93, icon: '🆘', status: 'active' },
      { name: 'UNHCR', url: 'https://www.unhcr.org/rss.xml', reliability: 91, icon: '🏕️', status: 'active' },
      { name: 'France24', url: 'https://www.france24.com/en/rss', reliability: 89, icon: '🇫🇷', status: 'active' },
      { name: 'Deutsche Welle', url: 'https://rss.dw.com/xml/rss-en-all', reliability: 88, icon: '🇩🇪', status: 'active' },
      { name: 'RT News', url: 'https://www.rt.com/rss/', reliability: 70, icon: '🇷🇺', status: 'active' },
      { name: 'TASS', url: 'https://tass.com/rss/v2.xml', reliability: 75, icon: '📻', status: 'active' }
    ];
    setSources(rssSources);
  }, []);

  // Fetch articles from backend
  const fetchArticles = useCallback(async () => {
    console.log('🔄 Live: Starting article fetch...');
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/live/articles');
      console.log('🔄 Live: Response status:', response.status);
      console.log('🔄 Live: Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Live: Expected JSON but got:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Make sure the server is running on port 3001.');
      }

      const data = await response.json();
      console.log('📰 Live: Received articles:', data.length);

      if (Array.isArray(data) && data.length > 0) {
        // Merge with existing articles, avoiding duplicates
        setArticles(prevArticles => {
          const existingIds = new Set(prevArticles.map(a => a.id));
          const newArticles = data.filter((article: Article) => !existingIds.has(article.id));
          
          // Combine and sort by date (newest first)
          const combined = [...newArticles, ...prevArticles]
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          
          console.log(`✅ Live: Added ${newArticles.length} new articles, total: ${combined.length}`);
          return combined;
        });

        // Update source statistics
        setSources(prevSources => {
          const sourceStats = new Map<string, number>();
          data.forEach((article: Article) => {
            const count = sourceStats.get(article.source.name) || 0;
            sourceStats.set(article.source.name, count + 1);
          });

          return prevSources.map(source => ({
            ...source,
            articleCount: sourceStats.get(source.name) || source.articleCount || 0,
            lastFetch: new Date().toISOString(),
            status: 'active' as const
          }));
        });
      } else {
        console.warn('⚠️ Live: No articles received');
      }
    } catch (error) {
      console.error('❌ Live: Error fetching articles:', error);
      setError(`Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every minute
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('⏰ Live: Auto-refresh triggered');
      fetchArticles();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchArticles]);

  // Initial load
  useEffect(() => {
    initializeSources();
    fetchArticles();
  }, [initializeSources, fetchArticles]);

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 90) return 'bg-green-500';
    if (reliability >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-3xl font-bold text-red-600">🔴 Live News Feed</h2>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-red-600 animate-pulse">●</span>
          <span>Auto-refreshing every minute</span>
          <span className="font-semibold text-gray-800">({articles.length} articles)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <span className="text-lg">{source.icon}</span>
            <span className="flex-1 font-medium">{source.name}</span>
            <span 
              className="px-2 py-1 rounded text-white text-xs font-semibold"
              style={{ backgroundColor: getReliabilityColor(source.reliability) }}
            >
              {source.reliability}%
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {articles.map((article) => (
          <div key={article.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
            <div className="mb-3">
              <h3 className="text-lg font-semibold mb-3 leading-tight">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600 no-underline">
                  {article.title}
                </a>
              </h3>
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span className="font-semibold">
                  {article.source.icon} {article.source.name}
                </span>
                <span 
                  className="font-semibold"
                  style={{ color: getReliabilityColor(article.source.reliability) }}
                >
                  {article.source.reliability}% reliable
                </span>
                <span className="ml-auto">
                  {new Date(article.publishedAt).toLocaleString()}
                </span>
              </div>
            </div>
            {article.description && (
              <p className="text-gray-700 leading-relaxed m-0">{article.description}</p>
            )}
          </div>
        ))}
      </div>

      {isRefreshing && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-5"></div>
          <p>Loading live news feeds...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <p className="mb-3">Error: {error}</p>
          <button 
            onClick={fetchArticles}
            className="px-4 py-2 bg-blue-600 text-white border-none rounded-md cursor-pointer hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default Live;