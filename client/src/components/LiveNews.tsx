import { useState, useEffect } from 'react';
import { 
  Clock, 
  ExternalLink, 
  Filter, 
  Search, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Languages,
  ArrowUpDown,
  Hash,
  CheckCircle,
  Activity  // Add Activity to replace Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RSS_SOURCES, 
  OSINT_TWITTER_SOURCES, 
  TELEGRAM_INTELLIGENCE_CHANNELS,
  API_BASE_URL 
} from '../lib/api';

// Enhanced NewsItem interface with better data quality
interface NewsItem {
  id: string;
  title: string;
  originalTitle?: string;
  description: string;
  originalDescription?: string;
  fullContent?: string;
  summary?: string;
  link: string;
  pubDate: string;
  insertedAt: string;
  source: string;
  category: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  needsTranslation?: boolean;
  translated?: boolean;
  confidence?: number;
  tags?: string[];
  contentHash?: string;
  wordCount?: number;
  readingTime?: number;
  threatLevel?: 'critical' | 'high' | 'medium' | 'low';
  keywords?: string[];
  isNew?: boolean;
}

// Enhanced filter interface
interface NewsFilters {
  search: string;
  sources: string[];
  categories: string[];
  languages: string[];
  threatLevels: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'date' | 'priority' | 'relevance' | 'source';
  sortOrder: 'asc' | 'desc';
}

// Extract keywords from content
const extractKeywords = (text: string): string[] => {
  const keywords = text.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'with', 'have', 'this', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word))
    .slice(0, 5);
  return [...new Set(keywords)];
};

// Determine threat level based on content
const determineThreatLevel = (title: string, description: string, keywords?: string[]): 'critical' | 'high' | 'medium' | 'low' => {
  const text = `${title} ${description}`.toLowerCase();
  const keywordText = keywords ? keywords.join(' ').toLowerCase() : '';
  const fullText = `${text} ${keywordText}`;
  
  if (fullText.match(/nuclear|wmd|chemical|biological|terror|explosion|bomb/)) return 'critical';
  if (fullText.match(/attack|strike|killed|casualties|war|conflict|missile/)) return 'high';
  if (fullText.match(/military|defense|sanctions|threat|warning/)) return 'medium';
  return 'low';
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export function LiveNews() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    sources: [] as string[],
    threatLevels: [] as string[],
    categories: [] as string[],
    timeRange: '24h',
    sortBy: 'timestamp',
    languages: [] as string[],
    dateRange: { start: '', end: '' },  // Fix: Make dateRange an object
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [osintEnabled, setOsintEnabled] = useState(false);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [sourceStats, setSourceStats] = useState<any[]>([]);
  const [contentHashes, setContentHashes] = useState(new Set<string>());

  // Auto-refresh functionality
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newArticleCount, setNewArticleCount] = useState(0);

  // Constants
  const itemsPerPage = 20;
  
  // Get unique categories and languages
  const categories = Array.from(new Set(RSS_SOURCES.map(source => source.category)));
  const languages = Array.from(new Set(RSS_SOURCES.map(source => source.language)));
  const uniqueSources = Array.from(new Set(articles.map(item => item.source)));

  // Enhanced filtering and sorting logic
  const getFilteredAndSortedNews = () => {
    let filtered = articles;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.source.toLowerCase().includes(searchTerm) ||
        item.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }

    // Source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter(item => filters.sources.includes(item.source));
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => filters.categories.includes(item.category));
    }

    // Language filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter(item => filters.languages.includes(item.language));
    }

    // Threat level filter
    if (filters.threatLevels.length > 0) {
      filtered = filtered.filter(item => 
        item.threatLevel && filters.threatLevels.includes(item.threatLevel)
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      filtered = filtered.filter(item => new Date(item.pubDate) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(item => new Date(item.pubDate) <= endDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
          break;
        case 'priority':
          const priorityOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'relevance':
          const getRelevanceScore = (item: NewsItem) => {
            const confidenceScore = item.confidence || 50;
            const threatScore = item.threatLevel === 'critical' ? 40 : 
                              item.threatLevel === 'high' ? 30 :
                              item.threatLevel === 'medium' ? 20 : 10;
            const recencyScore = Math.max(0, 20 - (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60));
            return confidenceScore + threatScore + recencyScore;
          };
          comparison = getRelevanceScore(b) - getRelevanceScore(a);
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
      }

      return filters.sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Filter news based on selected criteria
  const filteredAndSortedNews = getFilteredAndSortedNews();
  
  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNews.length / itemsPerPage);
  const paginatedNews = filteredAndSortedNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Content hashing for deduplication
  const generateContentHash = (item: any): string => {
    const content = `${item.title}${item.description}${item.source}`.toLowerCase();
    return btoa(content).substring(0, 16);
  };

  // Generate relevant tags based on content
  const generateTags = (title: string, description: string, category: string): string[] => {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [category];

    if (text.match(/attack|strike|military|war|conflict|battle|missile|drone|explosion/)) {
      tags.push('military-action');
    }
    if (text.match(/casualt|death|kill|injur|victim/)) {
      tags.push('casualties');
    }
    if (text.match(/humanitarian|aid|refugee|civilian|evacuation/)) {
      tags.push('humanitarian');
    }
    if (text.match(/diplomacy|negotiation|peace|treaty|agreement/)) {
      tags.push('diplomatic');
    }
    if (text.match(/cyber|hack|malware|ransomware|breach/)) {
      tags.push('cyber');
    }
    if (text.match(/nuclear|weapon|missile|defense/)) {
      tags.push('weapons');
    }

    return tags;
  };

  // Utility functions
  const calculateConfidence = (text: string, category: string): number => {
    const keywords = {
      military: ['attack', 'strike', 'operation', 'forces', 'troops'],
      civilian: ['hospital', 'school', 'civilian', 'refugee', 'humanitarian'],
      diplomatic: ['meeting', 'talks', 'agreement', 'negotiation', 'embassy'],
      economic: ['sanctions', 'trade', 'economy', 'financial', 'market']
    };
    
    const categoryKeywords = keywords[category as keyof typeof keywords] || [];
    const matchCount = categoryKeywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);
    
    return Math.min(matchCount / Math.max(categoryKeywords.length, 1), 1.0) * 100;
  };

  // Enhanced fetch with deduplication and full content
  const fetchEnhancedNews = async () => {
    try {
      setLoading(true);
      setLastUpdate(new Date());
      console.log('📡 Fetching enhanced news with deduplication...');

      const newContentHashes = new Set(contentHashes);
      let totalNewArticles = 0;
      let totalDuplicates = 0;

      // Use fallback sources for demonstration
      const fallbackSources = [
        { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'international' },
        { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best', category: 'international' },
        { name: 'AP News', url: 'https://rsshub.app/ap/topics/apf-intlnews', category: 'international' },
      ];

      const processedArticles: NewsItem[] = [];
      const sourceStatistics: any[] = [];

      for (const source of fallbackSources) {
        try {
          let response;
          try {
            response = await fetch(`${API_BASE_URL}/api/rss-proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: source.url, source: source.name }),
              mode: 'cors',
            });
          } catch {
            response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`);
          }

          if (response.ok) {
            const data = await response.json();
            const items = data.items || data.feed?.items || [];
            let sourceArticleCount = 0;
            
            items.slice(0, 5).forEach((item: any) => {
              const contentHash = generateContentHash(item);
              
              if (newContentHashes.has(contentHash)) {
                totalDuplicates++;
                return;
              }
              newContentHashes.add(contentHash);
              totalNewArticles++;
              sourceArticleCount++;

              const title = item.title || 'No title available';
              const description = item.description || item.content || 'No description available';

              const keywords = extractKeywords(title + ' ' + description);
              const threatLevel = determineThreatLevel(title, description, keywords);
              const confidence = calculateConfidence(title + ' ' + description, source.category);
              const tags = generateTags(title, description, source.category);

              processedArticles.push({
                id: `${source.name}-${contentHash}`,
                title,
                description,
                link: item.link || item.url || '#',
                pubDate: item.pubDate || item.publishedAt || new Date().toISOString(),
                insertedAt: new Date().toISOString(),
                source: source.name,
                category: source.category,
                language: 'en',
                priority: 'medium' as const,
                confidence,
                tags,
                contentHash,
                keywords,
                threatLevel,
                isNew: true,
                wordCount: (title + ' ' + description).split(' ').length,
                readingTime: Math.ceil((title + ' ' + description).split(' ').length / 200),
              });
            });

            sourceStatistics.push({
              name: source.name,
              category: source.category,
              articlesCount: sourceArticleCount,
              lastUpdate: new Date().toISOString(),
              status: 'active' as const
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${source.name}:`, error);
          sourceStatistics.push({
            name: source.name,
            category: source.category,
            articlesCount: 0,
            lastUpdate: new Date().toISOString(),
            status: 'error' as const
          });
        }
      }

      setSourceStats(sourceStatistics);
      setDuplicatesRemoved(totalDuplicates);
      setContentHashes(newContentHashes);

      // Set articles or fallback data
      if (processedArticles.length > 0) {
        setArticles(processedArticles);
        setError(null);
      } else {
        setError('Unable to fetch news from any source. Please check your connection.');
        setArticles([
          {
            id: 'demo-1',
            title: 'War Tracker - Live Intelligence Platform',
            description: 'Real-time military intelligence and conflict monitoring system. Data will load when backend services are available.',
            link: '#',
            pubDate: new Date().toISOString(),
            insertedAt: new Date().toISOString(),
            source: 'System',
            category: 'system',
            language: 'en',
            priority: 'high' as const,
            confidence: 100,
            tags: ['system', 'demo'],
            keywords: ['war', 'tracker', 'intelligence'],
            threatLevel: 'low' as const,
            isNew: true,
          }
        ]);
      }

      console.log(`✅ Loaded ${processedArticles.length} news items`);
      
    } catch (error) {
      console.error('❌ Enhanced news fetch failed:', error);
      setError('Failed to load news sources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch news on component mount and setup auto-refresh
  useEffect(() => {
    fetchEnhancedNews();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEnhancedNews();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter handlers
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      sources: [] as string[],
      threatLevels: [] as string[],
      categories: [] as string[],
      timeRange: '24h',
      sortBy: 'timestamp',
      languages: [] as string[],
      dateRange: { start: '', end: '' },  // Fix: Make dateRange an object
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const getThreatLevelStyling = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-900/50 text-red-300 border-red-500';
      case 'high': return 'bg-orange-900/50 text-orange-300 border-orange-500';
      case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-500';
      case 'low': return 'bg-green-900/50 text-green-300 border-green-500';
      default: return 'bg-tactical-dark/50 text-tactical-muted border-tactical-border';
    }
  };

  // Loading state
  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Globe className="h-12 w-12 text-neon-400 animate-spin" />
                <Activity className="h-6 w-6 text-yellow-400 absolute top-0 right-0 animate-pulse" />
              </div>
              <p className="text-lg font-mono text-tactical-text">
                Loading enhanced intelligence feeds...
              </p>
              <p className="text-sm text-tactical-muted">
                Aggregating from {RSS_SOURCES.length} sources across {languages.length} languages
              </p>
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tactical-text mb-2">Service Temporarily Unavailable</h3>
            <p className="text-tactical-muted mb-6">{error}</p>
            <button
              onClick={fetchEnhancedNews}
              className="px-6 py-3 bg-neon-600 hover:bg-neon-700 text-tactical-bg rounded-lg font-mono transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fix: Replace Zap with Activity icon
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'military': return <Activity className="w-4 h-4" />;
      case 'civilian': return <AlertTriangle className="w-4 h-4" />;
      case 'diplomatic': return <Globe className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-tactical-bg p-4 md:p-6" onClick={() => setNewArticleCount(0)}>
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <TrendingUp className="h-8 w-8 text-neon-400 animate-pulse" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neon-400">Enhanced Live Intelligence</h1>
                <p className="text-tactical-muted text-sm">
                  {RSS_SOURCES.length} RSS • {OSINT_TWITTER_SOURCES.length} OSINT • {TELEGRAM_INTELLIGENCE_CHANNELS.length} Telegram
                  {lastUpdate && (
                    <span className="ml-2">
                      • Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* New articles indicator */}
              {newArticleCount > 0 && (
                <div className="px-3 py-1 bg-neon-500/20 text-neon-400 border border-neon-500/30 rounded text-sm">
                  {newArticleCount} new
                </div>
              )}

              {/* Auto-refresh toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-2 rounded transition-colors ${
                    autoRefresh 
                      ? 'bg-neon-500/20 text-neon-400 border border-neon-500/30' 
                      : 'bg-tactical-dark border border-tactical-border text-tactical-muted hover:text-tactical-text'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
                
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-tactical-dark border border-tactical-border rounded px-2 py-1 text-tactical-text text-sm"
                >
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>
              </div>

              {/* Translation Toggle */}
              <button
                onClick={() => setTranslationEnabled(!translationEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  translationEnabled ? 'bg-blue-600 text-white' : 'bg-tactical-border text-tactical-muted'
                }`}
              >
                <Languages className="w-4 h-4" />
                <span className="text-sm">Translate</span>
              </button>

              {/* OSINT Toggle */}
              <button
                onClick={() => setOsintEnabled(!osintEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  osintEnabled ? 'bg-purple-600 text-white' : 'bg-tactical-border text-tactical-muted'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">OSINT</span>
              </button>

              <div className="text-sm font-mono text-tactical-muted">
                {filteredAndSortedNews.length} articles
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="tactical-panel p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neon-400" />
                <span className="text-sm font-mono text-tactical-text">ENHANCED FILTERS</span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1 bg-tactical-border/50 hover:bg-tactical-border text-tactical-text rounded text-sm transition-colors"
              >
                <span>Advanced</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tactical-muted" />
                <input
                  type="text"
                  placeholder="Search articles, sources, keywords..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-tactical-bg border border-tactical-border rounded-lg text-tactical-text placeholder-tactical-muted focus:border-neon-400 focus:ring-1 focus:ring-neon-400"
                />
                {filters.search && (
                  <button
                    onClick={() => updateFilters({ search: '' })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tactical-muted hover:text-tactical-text"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Sort By */}
              <div>
                <label className="block text-xs text-tactical-muted mb-2">SORT BY</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value as NewsFilters['sortBy'] })}
                    className="flex-1 bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-tactical-text text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="priority">Priority</option>
                    <option value="relevance">Relevance</option>
                    <option value="source">Source</option>
                  </select>
                  <button
                    onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
                    className="px-2 py-2 bg-tactical-border/50 hover:bg-tactical-border text-tactical-text rounded transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Threat Level Filter */}
              <div>
                <label className="block text-xs text-tactical-muted mb-2">THREAT LEVEL</label>
                <div className="flex flex-wrap gap-1">
                  {['critical', 'high', 'medium', 'low'].map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        const newThreatLevels = filters.threatLevels.includes(level)
                          ? filters.threatLevels.filter(t => t !== level)
                          : [...filters.threatLevels, level];
                        updateFilters({ threatLevels: newThreatLevels });
                      }}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        filters.threatLevels.includes(level)
                          ? getThreatLevelStyling(level)
                          : 'bg-tactical-border/50 text-tactical-muted hover:bg-tactical-border'
                      }`}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-xs text-tactical-muted mb-2">SOURCES</label>
                <select
                  multiple
                  value={filters.sources}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    updateFilters({ sources: selected });
                  }}
                  className="w-full bg-tactical-bg border border-tactical-border rounded px-2 py-1 text-tactical-text text-xs max-h-20"
                  size={3}
                >
                  {uniqueSources.map((source: string) => (
                    <option key={source} value={source} className="py-1">
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div>
                <label className="block text-xs text-tactical-muted mb-2">STATISTICS</label>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-tactical-muted">Total Articles:</span>
                    <span className="text-neon-400">{articles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tactical-muted">Filtered:</span>
                    <span className="text-neon-400">{filteredAndSortedNews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tactical-muted">Duplicates Removed:</span>
                    <span className="text-red-400">{duplicatesRemoved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tactical-muted">Sources Active:</span>
                    <span className="text-green-400">{sourceStats.filter(s => s.status === 'active').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="tactical-panel border border-tactical-border rounded-lg p-4 mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-xs text-tactical-muted mb-2">DATE RANGE</label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) => updateFilters({ 
                            dateRange: { ...filters.dateRange, start: e.target.value } 
                          })}
                          className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-tactical-text text-sm"
                        />
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) => updateFilters({ 
                            dateRange: { ...filters.dateRange, end: e.target.value } 
                          })}
                          className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-tactical-text text-sm"
                        />
                      </div>
                    </div>

                    {/* Category Filters */}
                    <div>
                      <label className="block text-xs text-tactical-muted mb-2">CATEGORIES</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {categories.map(category => (
                          <label key={category} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...filters.categories, category]
                                  : filters.categories.filter(c => c !== category);
                                updateFilters({ categories: newCategories });
                              }}
                              className="rounded text-neon-400"
                            />
                            <span className="text-tactical-text capitalize">{category.replace('_', ' ')}</span>
                            <span className="text-tactical-muted text-xs">
                              ({articles.filter(item => item.category === category).length})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Language Filters */}
                    <div>
                      <label className="block text-xs text-tactical-muted mb-2">LANGUAGES</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {languages.map(language => (
                          <label key={language} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filters.languages.includes(language)}
                              onChange={(e) => {
                                const newLanguages = e.target.checked
                                  ? [...filters.languages, language]
                                  : filters.languages.filter(l => l !== language);
                                updateFilters({ languages: newLanguages });
                              }}
                              className="rounded text-neon-400"
                            />
                            <span className="text-tactical-text">{language.toUpperCase()}</span>
                            <span className="text-tactical-muted text-xs">
                              ({articles.filter(item => item.language === language).length})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear All Filters */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-tactical-border">
                    <div className="text-xs text-tactical-muted">
                      {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'date' && v !== 'desc') && (
                        <span>Active filters: {
                          [
                            filters.search && 'Search',
                            filters.sources.length > 0 && `Sources (${filters.sources.length})`,
                            filters.categories.length > 0 && `Categories (${filters.categories.length})`,
                            filters.languages.length > 0 && `Languages (${filters.languages.length})`,
                            filters.threatLevels.length > 0 && `Threat Levels (${filters.threatLevels.length})`,
                            (filters.dateRange.start || filters.dateRange.end) && 'Date Range'
                          ].filter(Boolean).join(', ')
                        }</span>
                      )}
                    </div>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Enhanced News Grid with Pagination */}
        {filteredAndSortedNews.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-tactical-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tactical-text mb-2">No Articles Found</h3>
            <p className="text-tactical-muted mb-4">
              {filters.search || filters.sources.length > 0 || filters.categories.length > 0 || filters.threatLevels.length > 0
                ? 'No articles match your current filters. Try adjusting your search criteria.'
                : 'No articles available yet. Check back in a few minutes.'
              }
            </p>
            {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'date' && v !== 'desc') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-neon-600 hover:bg-neon-700 text-tactical-bg rounded font-mono"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* News Articles */}
            <div className="space-y-4">
              <AnimatePresence>
                {paginatedNews.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="tactical-panel border border-tactical-border rounded-lg p-6 hover:border-neon-400/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs border ${getThreatLevelStyling(item.threatLevel || 'low')}`}>
                          {item.threatLevel?.toUpperCase() || 'LOW'}
                        </div>
                        <div className="px-2 py-1 bg-tactical-dark/50 text-tactical-muted rounded text-xs">
                          {item.source}
                        </div>
                        <div className="px-2 py-1 bg-tactical-dark/50 text-tactical-muted rounded text-xs">
                          {item.category}
                        </div>
                        {item.isNew && (
                          <div className="px-2 py-1 bg-neon-500/20 text-neon-400 border border-neon-500/30 rounded text-xs animate-pulse">
                            NEW
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-tactical-muted">
                        <Clock className="w-3 h-3" />
                        {item.readingTime && (
                          <span className="mr-2">
                            <span>{item.readingTime}m read</span>
                          </span>
                        )}
                        <span>{formatRelativeTime(item.pubDate)}</span>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <h3 className="text-lg font-semibold text-tactical-text mb-2 hover:text-neon-400 transition-colors">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start space-x-2"
                      >
                        <span className="flex-1">{item.title}</span>
                        <ExternalLink className="h-4 w-4 text-tactical-muted flex-shrink-0 mt-0.5" />
                      </a>
                    </h3>

                    {item.originalTitle && (
                      <details className="mb-2">
                        <summary className="text-sm text-tactical-muted cursor-pointer hover:text-tactical-text">
                          View Original Text
                        </summary>
                        <p className="text-sm text-tactical-muted mt-1 pl-4 border-l-2 border-tactical-border">
                          {item.originalTitle}
                        </p>
                      </details>
                    )}

                    <p className="text-tactical-muted text-sm mb-4 line-clamp-3">
                      {item.description}
                    </p>

                    {/* Enhanced Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Hash className="w-3 h-3 text-tactical-muted" />
                            <div className="flex space-x-1">
                              {item.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="px-1 py-0.5 bg-tactical-dark/30 text-tactical-muted rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Confidence Score */}
                        {item.confidence && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-tactical-muted">Confidence:</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-tactical-text">{item.confidence}%</span>
                              {item.confidence >= 80 ? (
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              ) : item.confidence >= 60 ? (
                                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                          </div>
                        )}
                        {item.wordCount && (
                          <span className="text-xs text-tactical-muted">{item.wordCount} words</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="tactical-panel p-4 mt-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded font-mono flex items-center space-x-2 transition-colors ${
                      currentPage === 1
                        ? 'bg-tactical-border/50 text-tactical-muted cursor-not-allowed'
                        : 'bg-neon-600 hover:bg-neon-700 text-tactical-bg'
                    }`}
                  >
                    <ChevronUp className="h-4 w-4 rotate-180" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-mono text-tactical-muted">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedNews.length)} of {filteredAndSortedNews.length}
                    </div>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-mono transition-colors ${
                              currentPage === pageNum
                                ? 'bg-neon-600 text-tactical-bg'
                                : 'bg-tactical-border text-tactical-text hover:bg-tactical-border/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded font-mono flex items-center space-x-2 transition-colors ${
                      currentPage === totalPages
                        ? 'bg-tactical-border/50 text-tactical-muted cursor-not-allowed'
                        : 'bg-neon-600 hover:bg-neon-700 text-tactical-bg'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}