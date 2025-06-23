import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RSS_SOURCES, 
  OSINT_TWITTER_SOURCES, 
  TELEGRAM_INTELLIGENCE_CHANNELS,
  API_BASE_URL 
} from '../lib/api';
import { TranslationService } from '../lib/translation';
import { 
  Rss, 
  ExternalLink, 
  Clock, 
  Filter,
  Globe,
  Languages,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingUp,
  MapPin,
  Users,
  Search,
  ArrowUpDown,
  Loader2,
  Hash,
  ChevronDown,
  ChevronUp,
  Activity,
  RefreshCw
} from 'lucide-react';

// Source statistics interface
interface SourceStats {
  name: string;
  category: string;
  language: string;
  articlesCount: number;
  lastUpdate: string;
  status: 'active' | 'error' | 'pending';
}

// Enhanced NewsItem interface with better data quality
interface NewsItem {
  id: string;
  title: string;
  originalTitle?: string;
  description: string;
  originalDescription?: string;
  fullContent?: string; // Full article content when available
  summary?: string; // AI-generated summary
  link: string;
  pubDate: string; // Original publication date
  insertedAt: string; // When we fetched/stored it
  source: string;
  category: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  needsTranslation?: boolean;
  translated?: boolean;
  confidence?: number;
  tags?: string[];
  contentHash?: string; // For deduplication
  wordCount?: number;
  readingTime?: number; // Estimated reading time in minutes
  threatLevel?: 'critical' | 'high' | 'medium' | 'low';
  keywords?: string[];
  isNew?: boolean; // Flag for new articles
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

export const LiveNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [translationService] = useState(() => TranslationService.getInstance());
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [osintEnabled, setOsintEnabled] = useState(true);
  const [autoRefresh] = useState(true);
  const [refreshInterval] = useState(30);
  const [filters, setFilters] = useState<NewsFilters>({
    search: '',
    sources: [],
    categories: [],
    languages: [],
    threatLevels: [],
    dateRange: {
      start: '',
      end: ''
    },
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [contentHashes] = useState(new Set<string>());

  // Get unique categories and languages
  const categories = Array.from(new Set(RSS_SOURCES.map(source => source.category)));
  const languages = Array.from(new Set(RSS_SOURCES.map(source => source.language)));

  // Enhanced filtering and sorting logic
  const getFilteredAndSortedNews = () => {
    let filtered = news;

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
          // Combine confidence, threat level, and recency
          const getRelevanceScore = (item: NewsItem) => {
            const confidenceScore = item.confidence || 50;
            const threatScore = item.threatLevel === 'critical' ? 40 : 
                              item.threatLevel === 'high' ? 30 :
                              item.threatLevel === 'medium' ? 20 : 10;
            const recencyScore = Math.max(0, 20 - (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60)); // Hours ago
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
    return btoa(content).substring(0, 16); // Simple hash
  };

  // Enhanced fetch with deduplication and full content
  const fetchEnhancedNews = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching enhanced news with deduplication...');

      const rssPromises = RSS_SOURCES.map(async (source) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/rss-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url, source: source.name })
          });

          if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
          
          const data = await response.json();
          let duplicatesCount = 0;
          
          const processedItems = await Promise.all(
            data.items.slice(0, 15).map(async (item: any) => {
              // Generate content hash for deduplication
              const contentHash = generateContentHash(item);
              
              // Skip if duplicate
              if (contentHashes.has(contentHash)) {
                duplicatesCount++;
                return null;
              }
              contentHashes.add(contentHash);

              let title = item.title;
              let description = item.description || item.summary || '';
              const originalTitle = title;
              const originalDescription = description;

              // Extract keywords from content
              const keywords = extractKeywords(title + ' ' + description);
              
              // Determine threat level based on content
              const threatLevel = determineThreatLevel(title, description, keywords);

              // Translate if needed
              if (source.needsTranslation && translationEnabled) {
                try {
                  [title, description] = await translationService.translateBatch([
                    { text: title, sourceLang: source.language },
                    { text: description, sourceLang: source.language }
                  ]);
                } catch (error) {
                  console.warn(`Translation failed for ${source.name}:`, error);
                }
              }

              // Calculate reading time
              const wordCount = (title + ' ' + description).split(' ').length;
              const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

              return {
                id: `${source.name}-${contentHash}`,
                title,
                originalTitle: source.needsTranslation ? originalTitle : undefined,
                description,
                originalDescription: source.needsTranslation ? originalDescription : undefined,
                link: item.link,
                pubDate: item.pubDate || new Date().toISOString(),
                insertedAt: new Date().toISOString(),
                source: source.name,
                category: source.category,
                language: source.language,
                priority: source.priority,
                needsTranslation: source.needsTranslation,
                translated: source.needsTranslation && translationEnabled,
                confidence: calculateConfidence(source, keywords),
                tags: generateTags(title, description, source.category),
                contentHash,
                wordCount,
                readingTime,
                threatLevel,
                keywords,
                isNew: true
              };
            })
          );

          const validItems = processedItems.filter(item => item !== null);
          setDuplicatesRemoved(prev => prev + duplicatesCount);

          // Update source stats
          setSourceStats(prev => {
            const existing = prev.find(s => s.name === source.name);
            const newStats = {
              name: source.name,
              category: source.category,
              language: source.language,
              articlesCount: validItems.length,
              lastUpdate: new Date().toISOString(),
              status: 'active' as const
            };

            if (existing) {
              return prev.map(s => s.name === source.name ? newStats : s);
            } else {
              return [...prev, newStats];
            }
          });

          return validItems;
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
          
          // Update source stats with error
          setSourceStats(prev => {
            const newStats = {
              name: source.name,
              category: source.category,
              language: source.language,
              articlesCount: 0,
              lastUpdate: new Date().toISOString(),
              status: 'error' as const
            };

            const existing = prev.find(s => s.name === source.name);
            if (existing) {
              return prev.map(s => s.name === source.name ? newStats : s);
            } else {
              return [...prev, newStats];
            }
          });

          return [];
        }
      });

      const allRssResults = await Promise.all(rssPromises);
      const combinedNews = allRssResults.flat();

      // Add OSINT sources if enabled
      if (osintEnabled) {
        // Placeholder for OSINT integration
        console.log('🔍 OSINT Sources configured:', OSINT_TWITTER_SOURCES.length, 'Twitter accounts');
        console.log('📱 Telegram channels configured:', TELEGRAM_INTELLIGENCE_CHANNELS.length, 'channels');
      }

      // Sort by priority and date
      const sortedNews = combinedNews.sort((a, b) => {
        const priorityOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority as 'high' | 'medium' | 'low'] || 1) - (priorityOrder[a.priority as 'high' | 'medium' | 'low'] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

      setNews(sortedNews.slice(0, 100)); // Limit to 100 most relevant items
      console.log(`✅ Loaded ${sortedNews.length} news items from ${RSS_SOURCES.length} sources`);
      
    } catch (error) {
      console.error('❌ Enhanced news fetch failed:', error);
      setError('Failed to load enhanced news sources');
    } finally {
      setLoading(false);
    }
  };

  // Generate relevant tags based on content
  const generateTags = (title: string, description: string, category: string): string[] => {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [category];

    // Military/conflict keywords
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

    // Geographic tags
    if (text.match(/ukraine|kyiv|kharkiv|mariupol|donetsk|luhansk/)) {
      tags.push('ukraine');
    }
    if (text.match(/russia|moscow|kremlin|putin/)) {
      tags.push('russia');
    }
    if (text.match(/israel|gaza|palestine|hamas|idf/)) {
      tags.push('middle-east');
    }
    if (text.match(/nato|pentagon|us military|american/)) {
      tags.push('nato-us');
    }

    return tags;
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

  // Enhanced auto-refresh with staggered updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEnhancedNews();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, translationEnabled, osintEnabled]);

  // Initial load
  useEffect(() => {
    fetchEnhancedNews();
  }, [translationEnabled, osintEnabled]);

  // Get unique values for filter dropdowns
  const uniqueSources = Array.from(new Set(news.map(item => item.source)));
  const uniqueThreatLevels = Array.from(new Set(news.map(item => item.threatLevel).filter(Boolean)));

  // Get threat level styling
  const getThreatLevelStyling = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600/20 text-red-400';
      case 'high': return 'bg-orange-600/20 text-orange-400';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400';
      case 'low': return 'bg-green-600/20 text-green-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  // Loading state
  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Globe className="h-12 w-12 text-neon-400 animate-spin" />
                <Zap className="h-6 w-6 text-yellow-400 absolute top-0 right-0 animate-pulse" />
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
        <div className="max-w-6xl mx-auto">
          <div className="tactical-panel border-red-500 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Connection Error</h2>
            </div>
            <p className="text-tactical-muted mb-4">{error}</p>
            <button
              onClick={fetchEnhancedNews}
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
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
                <Filter className="h-4 w-4 text-tactical-muted" />
                <span className="text-sm font-mono text-tactical-text">ENHANCED FILTERS</span>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 px-3 py-1 bg-tactical-border/50 hover:bg-tactical-border text-tactical-text rounded text-sm transition-colors"
              >
                <span>Advanced</span>
                {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                  onChange={(e) => updateFilters('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-tactical-bg border border-tactical-border rounded-lg text-tactical-text placeholder-tactical-muted focus:border-neon-400 focus:ring-1 focus:ring-neon-400"
                />
                {filters.search && (
                  <button
                    onClick={() => updateFilters('search', '')}
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
                    onChange={(e) => updateFilters('sortBy', e.target.value)}
                    className="flex-1 bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-tactical-text text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="priority">Priority</option>
                    <option value="relevance">Relevance</option>
                    <option value="source">Source</option>
                  </select>
                  <button
                    onClick={() => updateFilters('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
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
                        updateFilters('threatLevels', newThreatLevels);
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
                    updateFilters('sources', selected);
                  }}
                  className="w-full bg-tactical-bg border border-tactical-border rounded px-2 py-1 text-tactical-text text-xs max-h-20"
                  size={3}
                >
                  {uniqueSources.map(source => (
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
                    <span className="text-neon-400">{news.length}</span>
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
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-tactical-border pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Range */}
                    <div>
                      <label className="block text-xs text-tactical-muted mb-2">DATE RANGE</label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) => updateFilters('dateRange', { ...filters.dateRange, start: e.target.value })}
                          className="w-full bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-tactical-text text-sm"
                        />
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) => updateFilters('dateRange', { ...filters.dateRange, end: e.target.value })}
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
                                updateFilters('categories', newCategories);
                              }}
                              className="rounded text-neon-400"
                            />
                            <span className="text-tactical-text capitalize">{category.replace('_', ' ')}</span>
                            <span className="text-tactical-muted text-xs">
                              ({news.filter(item => item.category === category).length})
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
                                updateFilters('languages', newLanguages);
                              }}
                              className="rounded text-neon-400"
                            />
                            <span className="text-tactical-text">{language.toUpperCase()}</span>
                            <span className="text-tactical-muted text-xs">
                              ({news.filter(item => item.language === language).length})
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
                    className={`tactical-panel border-l-4 hover:bg-tactical-border/30 transition-colors ${
                      item.threatLevel === 'critical' ? 'border-l-red-500' :
                      item.threatLevel === 'high' ? 'border-l-orange-500' :
                      item.threatLevel === 'medium' ? 'border-l-yellow-500' :
                      'border-l-neon-400'
                    }`}
                  >
                    <div className="p-4">
                      {/* Enhanced Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(item.category)}
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${getPriorityColor(item.priority)}`}>
                              {item.priority.toUpperCase()}
                            </span>
                            {item.threatLevel && (
                              <span className={`px-2 py-1 rounded text-xs font-mono border ${getThreatLevelStyling(item.threatLevel)}`}>
                                {item.threatLevel.toUpperCase()}
                              </span>
                            )}
                            <span className="text-xs text-tactical-muted font-mono">
                              {item.language.toUpperCase()}
                            </span>
                            {item.translated && (
                              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                TRANSLATED
                              </span>
                            )}
                            {item.isNew && (
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-tactical-muted">
                          {item.readingTime && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
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
                          <p className="text-sm text-tactical-muted mt-1 italic pl-4 border-l-2 border-tactical-border">
                            {item.originalTitle}
                          </p>
                        </details>
                      )}

                      <p className="text-tactical-muted mb-3 line-clamp-3">
                        {item.description}
                      </p>

                      {/* Keywords */}
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.slice(0, 5).map(keyword => (
                              <span
                                key={keyword}
                                className="px-2 py-1 bg-neon-600/20 text-neon-400 text-xs rounded font-mono"
                              >
                                #{keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Footer */}
                      <div className="flex justify-between items-center pt-3 border-t border-tactical-border">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-wrap gap-1">
                            {item.tags?.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-tactical-border/50 text-tactical-muted text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-xs text-tactical-muted flex items-center space-x-2">
                            <Hash className="h-3 w-3" />
                            <span>{item.contentHash?.substring(0, 8)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-tactical-muted">
                          <div className="flex items-center space-x-1">
                            <span className="font-mono">{item.source}</span>
                          </div>
                          {item.confidence && (
                            <div className="flex items-center space-x-1">
                              <span>{item.confidence}%</span>
                              {item.confidence >= 80 ? (
                                <CheckCircle className="h-3 w-3 text-green-400" />
                              ) : item.confidence >= 60 ? (
                                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                          )}
                          {item.wordCount && (
                            <span>{item.wordCount} words</span>
                          )}
                        </div>
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
                    <ChevronUp className="h-4 w-4" />
                    <span>Next</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Extract keywords from content
const extractKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  const content = text.toLowerCase();
  
  // Military/conflict keywords
  const militaryTerms = ['attack', 'strike', 'military', 'war', 'conflict', 'battle', 'missile', 'drone', 'explosion', 'combat'];
  const diplomaticTerms = ['negotiation', 'peace', 'treaty', 'agreement', 'diplomacy', 'sanctions'];
  const humanitarianTerms = ['refugee', 'civilian', 'aid', 'humanitarian', 'evacuation', 'casualties'];
  
  [militaryTerms, diplomaticTerms, humanitarianTerms].forEach(terms => {
    terms.forEach(term => {
      if (content.includes(term)) keywords.push(term);
    });
  });

  return [...new Set(keywords)]; // Remove duplicates
};

// Determine threat level based on content analysis
const determineThreatLevel = (title: string, description: string, keywords: string[]): 'critical' | 'high' | 'medium' | 'low' => {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.match(/nuclear|missile|attack|explosion|casualties|death/)) return 'critical';
  if (content.match(/military|strike|conflict|war|battle/)) return 'high';
  if (content.match(/tension|warning|threat|sanction/)) return 'medium';
  return 'low';
};

// Calculate confidence score
const calculateConfidence = (source: any, keywords: string[]): number => {
  let confidence = 50; // Base confidence
  
  // Higher confidence for reliable sources
  if (['Reuters', 'BBC', 'AP'].includes(source.name)) confidence += 30;
  if (source.priority === 'high') confidence += 20;
  
  // Boost for military/conflict keywords
  if (keywords.length > 0) confidence += Math.min(keywords.length * 5, 25);
  
  return Math.min(confidence, 95); // Cap at 95%
};

// Filter handlers
const updateFilters = (key: keyof NewsFilters, value: any) => {
  setFilters(prev => ({ ...prev, [key]: value }));
  setCurrentPage(1); // Reset to first page when filtering
};

const resetFilters = () => {
  setFilters({
    search: '',
    sources: [],
    categories: [],
    languages: [],
    threatLevels: [],
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc'
  });
  setCurrentPage(1);
};

// Get category icon
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'military': return <Shield className="w-4 h-4" />;
    case 'diplomatic': return <Users className="w-4 h-4" />;
    case 'breaking': return <Zap className="w-4 h-4" />;
    case 'international': return <Globe className="w-4 h-4" />;
    case 'middle_east': return <MapPin className="w-4 h-4" />;
    default: return <Rss className="w-4 h-4" />;
  }
};

// Get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/20';
    case 'low': return 'text-green-400 bg-green-400/20';
    default: return 'text-gray-400 bg-gray-400/20';
  }
};