import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Globe,
  Zap
} from 'lucide-react';

// Define sources locally
const RSS_SOURCES = [
  { name: 'Reuters', category: 'general', language: 'en', url: 'https://feeds.reuters.com/reuters/topNews', needsTranslation: false, priority: 'high' },
  { name: 'BBC News', category: 'general', language: 'en', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', needsTranslation: false, priority: 'high' },
];

// Enhanced NewsItem interface
interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  language: string;
  priority: 'high' | 'medium' | 'low';
  confidence?: number;
  tags?: string[];
  threatLevel?: 'critical' | 'high' | 'medium' | 'low';
  isNew?: boolean;
  wordCount?: number;
  readingTime?: number;
}

// Enhanced filter interface
interface NewsFilters {
  search: string;
  sources: string[];
  categories: string[];
  languages: string[];
  threatLevels: string[];
  dateRange: { start: string; end: string; };
  sortBy: 'date' | 'priority' | 'relevance' | 'source';
  sortOrder: 'asc' | 'desc';
}

const determineThreatLevel = (title: string, description: string): 'critical' | 'high' | 'medium' | 'low' => {
  const text = `${title} ${description}`.toLowerCase();
  const criticalWords = ['nuclear', 'war', 'attack', 'missile', 'bombing', 'explosion', 'terrorist'];
  const highWords = ['military', 'conflict', 'strike', 'battle', 'combat', 'defense'];
  const mediumWords = ['tension', 'dispute', 'crisis', 'protest', 'violence'];
  
  if (criticalWords.some(word => text.includes(word))) return 'critical';
  if (highWords.some(word => text.includes(word))) return 'high';
  if (mediumWords.some(word => text.includes(word))) return 'medium';
  return 'low';
};

const calculatePriority = (article: NewsItem): 'high' | 'medium' | 'low' => {
  if (article.title?.toLowerCase().includes('breaking') || 
      article.title?.toLowerCase().includes('urgent')) {
    return 'high';
  }
  if (article.pubDate && new Date(article.pubDate).getTime() > Date.now() - 86400000) {
    return 'medium';
  }
  return 'low';
};

export function LiveNews() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters] = useState<NewsFilters>({
    search: '',
    sources: [],
    categories: [],
    languages: [],
    threatLevels: [],
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newArticleCount] = useState(0);
  const [contentHashes, setContentHashes] = useState(new Set<string>());

  // Enhanced filtering and sorting logic
  const getFilteredAndSortedNews = () => {
    let filtered = articles;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.source.toLowerCase().includes(searchTerm)
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
          const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
          const aPriority = (a.priority as 'high' | 'medium' | 'low') || 'low';
          const bPriority = (b.priority as 'high' | 'medium' | 'low') || 'low';
          comparison = priorityOrder[bPriority] - priorityOrder[aPriority];
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
  const itemsPerPage = 10;
  const totalPagesCount = Math.ceil(filteredAndSortedNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedArticles = filteredAndSortedNews.slice(startIndex, startIndex + itemsPerPage);

  // Content hashing for deduplication
  const generateContentHash = (item: any): string => {
    const content = `${item.title}${item.description}${item.source}`.toLowerCase();
    return btoa(content).substring(0, 16);
  };

  // Enhanced fetch with deduplication
  const fetchEnhancedNews = async () => {
    try {
      setLoading(true);
      setLastUpdate(new Date());

      const newContentHashes = new Set(contentHashes);

      const rssPromises = RSS_SOURCES.map(async (source) => {
        try {
          const response = await fetch(`/api/rss-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url, source: source.name })
          });

          if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
          
          const data = await response.json();
          const items = data.items || [];
          
          const processedItems = items.slice(0, 15).map((item: any) => {
            const contentHash = generateContentHash(item);
            
            if (newContentHashes.has(contentHash)) return null;
            newContentHashes.add(contentHash);

            let title = item.title || 'No title';
            let description = item.description || item.summary || 'No description';

            const threatLevel = determineThreatLevel(title, description);
            const wordCount = (title + ' ' + description).split(' ').length;
            const readingTime = Math.ceil(wordCount / 200);

            return {
              id: `${source.name}-${contentHash}`,
              title,
              description,
              link: item.link || '#',
              pubDate: item.pubDate || new Date().toISOString(),
              source: source.name,
              category: source.category,
              language: source.language,
              priority: calculatePriority({ title, pubDate: item.pubDate } as NewsItem),
              confidence: 75,
              tags: [source.category],
              threatLevel,
              isNew: true,
              wordCount,
              readingTime
            } as NewsItem;
          }).filter(Boolean) as NewsItem[];

          return processedItems;
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
          return [];
        }
      });

      const allRssResults = await Promise.all(rssPromises);
      const combinedNews = allRssResults.flat();

      // Sort by priority and date
      const sortedNews = combinedNews.sort((a, b) => {
        const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

      setArticles(sortedNews.slice(0, 100));
      setContentHashes(newContentHashes);
      
    } catch (error) {
      console.error('Enhanced news fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch news on component mount
  useEffect(() => {
    fetchEnhancedNews();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEnhancedNews();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Loading state
  if (loading && articles.length === 0) {
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-bg p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <TrendingUp className="h-8 w-8 text-neon-400 animate-pulse" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neon-400">Enhanced Live Intelligence</h1>
                <p className="text-tactical-muted text-sm">
                  {RSS_SOURCES.length} RSS sources
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

              <div className="text-sm font-mono text-tactical-muted">
                {filteredAndSortedNews.length} articles
              </div>
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {displayedArticles.map((article: NewsItem) => (
            <div key={article.id} className="tactical-panel p-4 rounded">
              <h3 className="text-neon-400 mb-2">{article.title}</h3>
              <p className="text-tactical-muted text-sm">{article.description}</p>
              <div className="text-xs text-tactical-muted mt-2">
                Source: {article.source} | Priority: {article.priority}
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPagesCount > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs bg-tactical-panel border border-tactical-border rounded text-tactical-muted"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPagesCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-xs rounded ${
                  page === currentPage
                    ? 'bg-neon-400 text-black'
                    : 'bg-tactical-panel border border-tactical-border text-tactical-muted'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPagesCount, currentPage + 1))}
              disabled={currentPage === totalPagesCount}
              className="px-3 py-1 text-xs bg-tactical-panel border border-tactical-border rounded text-tactical-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
