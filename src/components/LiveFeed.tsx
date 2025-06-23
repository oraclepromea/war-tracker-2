/// <reference path="../vite-env.d.ts" />
import React, { useCallback, useState, useEffect } from 'react';
import './LiveFeed.css';

// Force the correct API base URL - no more port 8000!
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Constants and configuration
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

const LiveFeed: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check backend connectivity
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Backend not responding (${response.status})`);
      }
      
      console.log('✅ Backend connection verified');
      setIsConnected(true);
      return true;
    } catch (error) {
      console.warn('⚠️ Backend connection failed:', error);
      setIsConnected(false);
      return false;
    }
  }, [API_BASE_URL]);

  const fetchNewsFromBackend = async (): Promise<Article[]> => {
    console.log('🔍 Fetching latest news from backend...');
    
    try {
      console.log('🔍 Fetching from URL:', `${API_BASE_URL}/api/news`);
      const response = await fetch(`${API_BASE_URL}/api/news`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📰 Received ${data.length || 0} articles from backend`);
      
      return Array.isArray(data) ? data : (data.articles || data.data || []);
    } catch (error) {
      console.error('Backend fetch failed:', error);
      throw error;
    }
  };

  const fetchArticles = useCallback(async () => {
    console.log('🔍 LiveFeed: Starting fetchArticles...');
    setLoading(true);
    
    try {
      console.log('📡 LiveFeed: Making request to /api/news...');
      const response = await fetch('/api/news');
      console.log('📡 LiveFeed: Response status:', response.status);
      console.log('📡 LiveFeed: Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 LiveFeed: Raw response data:', data);
      console.log('📊 LiveFeed: Data type:', typeof data);
      console.log('📊 LiveFeed: Is array:', Array.isArray(data));
      console.log('📊 LiveFeed: Data length:', data?.length);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ LiveFeed: Setting articles:', data.length, 'items');
        console.log('📋 LiveFeed: First article sample:', data[0]);
        setArticles(data);
        setError(null);
      } else {
        console.log('⚠️ LiveFeed: No articles in response');
        setArticles([]);
        setError('No articles available from backend RSS feeds');
      }
    } catch (err) {
      console.error('❌ LiveFeed: Error fetching articles:', err);
      setError(`Failed to fetch articles: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setArticles([]);
    } finally {
      setLoading(false);
      console.log('🏁 LiveFeed: fetchArticles completed');
    }
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await checkConnection();
        const newsData = await fetchNewsFromBackend();
        setArticles(newsData);
        
        if (newsData.length === 0) {
          setError('No articles received from backend');
        }
      } catch (error) {
        setError(`Failed to load news: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadNews();

    // Set up interval for real-time updates every 30 seconds
    const interval = setInterval(async () => {
      console.log('🔄 Auto-refreshing feed...');
      try {
        const newsData = await fetchNewsFromBackend();
        setArticles(newsData);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  if (loading) {
    return (
      <div className="live-feed">
        <div>Loading news...</div>
      </div>
    );
  }

  return (
    <div className="live-feed">
      <div className="feed-header">
        <h2>Latest News</h2>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
      
      {error && (
        <div className="error-message" style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {!isConnected && (
        <div className="warning-message" style={{ color: 'orange', padding: '10px', marginBottom: '10px' }}>
          ⚠️ Backend connection lost. Showing cached data.
        </div>
      )}
      
      {articles.length === 0 ? (
        <div>No news articles available.</div>
      ) : (
        articles.map((article) => (
          <div key={article.id} className="article" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <p><strong>Source:</strong> {article.source.name}</p>
            <p><small>Published: {new Date(article.publishedAt).toLocaleString()}</small></p>
          </div>
        ))
      )}
    </div>
  );
};

export default LiveFeed;