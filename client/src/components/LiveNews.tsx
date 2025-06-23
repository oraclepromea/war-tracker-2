import { useState, useEffect } from 'react';
import { Activity, Clock, ExternalLink, Database, RefreshCw, Wifi } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

// War-related keywords for filtering
const warKeywords = [
  'war', 'military', 'nato', 'conflict', 'attack',
  'diplomacy', 'sanctions', 'treaty', 'UN security council',
  'ukraine', 'russia', 'china', 'taiwan', 'middle east', 'defense',
  'airstrike', 'ceasefire', 'peacekeeping', 'humanitarian', 'refugee',
  'invasion', 'occupation', 'missile', 'drone', 'terrorism'
];

interface RSSArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string | { name: string };
  published_at: string;
  fetched_at: string;
}

// Function to check if an article is war/diplomacy related
const isWarRelated = (article: RSSArticle) => {
  const text = `${article.title} ${article.content || ''}`.toLowerCase();
  return warKeywords.some(keyword => text.includes(keyword.toLowerCase()));
};

export function LiveNews() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [warFilterEnabled, setWarFilterEnabled] = useState(false);

  // Fetch latest articles from backend
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📰 Fetching latest articles from backend...');
      
      const response = await fetch(`${API_BASE_URL}/api/news`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data?.length || 0} articles from backend`);
      
      if (data && data.length > 0) {
        // Sort backend data by published date, newest first
        const sortedData = data.sort((a: RSSArticle, b: RSSArticle) => {
          const dateA = new Date(a.published_at || a.fetched_at).getTime();
          const dateB = new Date(b.published_at || b.fetched_at).getTime();
          return dateB - dateA; // Newest first
        });
        setArticles(sortedData);
      }
      
      setIsConnected(true);
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates by polling the backend
  useEffect(() => {
    fetchArticles();

    console.log('🔔 Setting up auto-refresh for backend data...');
    
    // Poll backend every 30 seconds for new articles
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing articles...');
      fetchArticles();
    }, 30000);

    return () => {
      console.log('🔌 Cleaning up auto-refresh');
      clearInterval(interval);
    };
  }, []);

  // Trigger RSS sync and refresh
  const triggerRSSSync = async () => {
    try {
      console.log('📡 Triggering RSS sync...');
      const response = await fetch(`${API_BASE_URL}/api/jobs/news`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('✅ RSS sync completed');
        // Refresh articles after sync
        setTimeout(fetchArticles, 2000);
      }
    } catch (error) {
      console.error('❌ RSS sync failed:', error);
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  // Get source badge color
  const getSourceBadgeColor = (source: string | { name: string }): string => {
    const sourceName = typeof source === 'string' ? source : source?.name || 'Unknown';
    switch (sourceName) {
      case 'BBC World': return 'bg-red-600/20 text-red-400 border-red-400';
      case 'Reuters World': return 'bg-blue-600/20 text-blue-400 border-blue-400';
      case 'Al Jazeera': return 'bg-green-600/20 text-green-400 border-green-400';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-400';
    }
  };

  // Reset new article counter
  const handleInteraction = () => {
    if (newArticleCount > 0) {
      setNewArticleCount(0);
    }
  };

  // Apply war filtering if enabled
  const filteredArticles = warFilterEnabled 
    ? articles.filter(isWarRelated)
    : articles;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <Database className="h-12 w-12 text-neon-400 animate-spin" />
              <p className="text-lg font-mono text-tactical-text">Loading live news...</p>
              <p className="text-sm text-tactical-muted">Connecting to backend</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="tactical-panel border-red-500 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Connection Error</h2>
            </div>
            <p className="text-tactical-muted mb-4">{error}</p>
            <button
              onClick={fetchArticles}
              className="px-4 py-2 bg-neon-600 hover:bg-neon-700 text-tactical-bg rounded font-mono flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-bg p-4 md:p-6" onClick={handleInteraction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Activity className="h-8 w-8 text-red-400 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-bold text-neon-400">Live News Feed</h1>
              <div className="flex items-center space-x-2">
                <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                <span className={`text-xs font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              {newArticleCount > 0 && (
                <div className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-mono animate-bounce">
                  +{newArticleCount}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm font-mono text-tactical-muted">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>{filteredArticles.length} articles</span>
                {warFilterEnabled && (
                  <span className="text-yellow-400">({articles.length - filteredArticles.length} filtered)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Auto-refresh</span>
              </div>
              <button
                onClick={() => setWarFilterEnabled(!warFilterEnabled)}
                className={`px-3 py-1 rounded text-xs font-mono flex items-center space-x-1 transition-colors ${
                  warFilterEnabled 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <span>{warFilterEnabled ? '🎯' : '📰'}</span>
                <span>{warFilterEnabled ? 'War Filter ON' : 'All News'}</span>
              </button>
              <button
                onClick={triggerRSSSync}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-mono flex items-center space-x-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync RSS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Articles List */}
        {filteredArticles.length > 0 ? (
          <div className="tactical-panel max-h-[70vh] overflow-y-auto">
            <div className="divide-y divide-tactical-border">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 hover:bg-tactical-border/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {/* Source Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-mono border ${getSourceBadgeColor(article.source)} flex-shrink-0`}>
                      {typeof article.source === 'string' ? article.source : article.source?.name || 'Unknown'}
                    </span>

                    {/* Time */}
                    <span className="text-xs text-tactical-muted font-mono ml-3">
                      {formatRelativeTime(article.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-tactical-text mb-2 leading-tight">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neon-400 transition-colors flex items-start space-x-2 group"
                    >
                      <span className="flex-1">{article.title}</span>
                      <ExternalLink className="h-4 w-4 text-tactical-muted group-hover:text-neon-400 mt-0.5 flex-shrink-0 transition-colors" />
                    </a>
                  </h3>

                  {/* Content Snippet */}
                  {article.content && (
                    <p className="text-sm text-tactical-muted leading-relaxed">
                      {article.content.length > 200
                        ? `${article.content.substring(0, 200)}...`
                        : article.content
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Database className="h-16 w-16 text-tactical-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tactical-text mb-2">No Articles Available</h3>
            <p className="text-tactical-muted mb-6">
              No articles found in the database. Run the RSS fetcher to populate articles.
            </p>
            <button
              onClick={fetchArticles}
              className="px-6 py-3 bg-neon-600 hover:bg-neon-700 text-tactical-bg rounded font-mono flex items-center space-x-2 mx-auto transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}