import React, { useCallback, useState, useEffect } from 'react';

// Constants and configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGE_SIZE = 20;

// Types
interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

const fetchLatestNews = useCallback(async (): Promise<Article[]> => {
  try {
    console.log('🔍 Fetching latest news from backend...');
    
    // Fix: Use correct API base URL and endpoint
    const url = `${API_BASE_URL}/news/latest?limit=${PAGE_SIZE}`;
    console.log('🔍 Full URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📡 Raw response from backend:', data);
    console.log('📡 Response structure:', Object.keys(data || {}));
    
    // Fix: Handle both possible response structures
    if (data && data.success && Array.isArray(data.articles)) {
      console.log(`📡 Successfully fetched ${data.articles.length} articles from backend`);
      return data.articles;
    } else if (Array.isArray(data)) {
      console.log(`📡 Direct array response: ${data.length} articles`);
      return data;
    } else {
      console.log('📡 Unexpected response structure:', data);
      return [];
    }
  } catch (error) {
    console.error('Backend fetch failed:', error);
    return [];
  }
}, []);

const LiveFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      const newsData = await fetchLatestNews();
      setArticles(newsData);
      setLoading(false);
    };

    loadNews();
  }, []);

  if (loading) {
    return <div>Loading news...</div>;
  }

  return (
    <div className="live-feed">
      <h2>Latest News</h2>
      {articles.map((article) => (
        <div key={article.id} className="article">
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <p>Source: {article.source.name}</p>
        </div>
      ))}
    </div>
  );
};

export default LiveFeed;