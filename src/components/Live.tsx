import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { apiRequest, API_ENDPOINTS } from '../lib/api';
import { ArticlesService } from '../services/articles';

interface RSSArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  published_date: string;
  source_name: string;
  category: string;
  is_processed: boolean;
  created_at: string;
}

interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  last_fetched: string;
}

export function Live() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingRSS, setIsUpdatingRSS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
    fetchArticles();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        fetchArticles();
      }
    }, 30000);

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('rss_articles_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'rss_articles' },
        (payload) => {
          console.log('New article received:', payload.new);
          setArticles(prev => [payload.new as RSSArticle, ...prev]);
        }
      )
      .subscribe();

    console.log(`🔗 Live: Using WebSocket URL: ${(import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001'}`);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [isAutoRefresh]);

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from('rss_sources')  // Remove schema prefix
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data && !error) {
      setSources(data);
    }
  };

  const fetchArticles = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Live: Fetching articles from server...');
      
      const data = await apiRequest(API_ENDPOINTS.live);
      
      setArticles(data.articles);
      setSources(data.sources);
    } catch (error) {
      console.error('💥 Failed to fetch articles:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch articles');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const handleRSSUpdate = async () => {
    setIsUpdatingRSS(true);
    try {
      console.log('🔄 Triggering RSS update...');
      const result = await ArticlesService.triggerRSSFetch();
      console.log('✅ RSS update result:', result);
      
      // Refresh articles after RSS update
      await fetchArticles();
      
      // Show success message
      setError(null);
    } catch (error) {
      console.error('❌ RSS update failed:', error);
      setError('Failed to update RSS feeds');
    } finally {
      setIsUpdatingRSS(false);
    }
  };

  const triggerFetchRSS = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/fetch-rss`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(import.meta as any).env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (response.ok) {
        setTimeout(fetchArticles, 2000);
      }
    } catch (error) {
      console.error('Error fetching RSS:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'global_conflicts': 'bg-red-100 text-red-800',
      'military': 'bg-orange-100 text-orange-800',
      'defense': 'bg-yellow-100 text-yellow-800',
      'international': 'bg-blue-100 text-blue-800',
      'middle_east': 'bg-purple-100 text-purple-800',
      'analysis': 'bg-green-100 text-green-800',
      'intelligence': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getProcessingStatus = (isProcessed: boolean) => {
    return isProcessed 
      ? { color: 'bg-green-100 text-green-800', text: 'Processed' }
      : { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Live News Feed</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRSSUpdate}
            disabled={isUpdatingRSS}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isUpdatingRSS
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUpdatingRSS ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Updating RSS...
              </>
            ) : (
              '📡 RSS Update'
            )}
          </button>
          <button
            onClick={fetchArticles}
            disabled={isRefreshing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRefreshing
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRefreshing ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Refreshing...
              </>
            ) : (
              '🔄 Update Now'
            )}
          </button>
        </div>
      </div>

      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={isAutoRefresh}
                onChange={(e) => setIsAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-600">
                Auto-refresh
              </label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Articles</option>
            <option value="processed">Processed</option>
            <option value="unprocessed">Pending Processing</option>
          </select>
          
          <div className="text-sm text-gray-600">
            {articles.length} articles • {sources.length} active sources
          </div>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Latest Articles</h3>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No articles found</div>
          ) : (
            articles.map((article) => {
              const status = getProcessingStatus(article.is_processed);
              return (
                <div key={article.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                        <span className="text-xs text-gray-500">
                          {article.source_name}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          {article.title}
                        </a>
                      </h4>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(article.published_date).toLocaleString()}</span>
                        <span>•</span>
                        <span>Added {new Date(article.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};