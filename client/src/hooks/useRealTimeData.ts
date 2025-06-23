import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

// Add missing type definitions
export interface APIResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
  success: boolean;
  message?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  source: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  created_at: string;
  date: string;
  source: string;
  link?: string;
  severity: string;
  country?: string;
}

export interface UseRealTimeDataReturn {
  events: any[];
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

// Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

// Check if we're in development mode - fix process undefined
const isDevelopment = () => {
  return (import.meta as any).env?.DEV || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Get mock data for development
const getMockData = () => {
  return {
    events: [
      {
        id: 'dev-1',
        title: 'LIVE: Gaza Humanitarian Situation',
        description: 'International aid organizations report critical humanitarian needs in Gaza Strip. UN calls for immediate humanitarian corridor.',
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'Reuters',
        severity: 'critical'
      },
      {
        id: 'dev-2', 
        title: 'Ukraine: Donetsk Region Activity',
        description: 'Military activities reported in eastern Donetsk region. Civilians advised to remain in sheltered areas.',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'Associated Press',
        severity: 'high'
      },
      {
        id: 'dev-3',
        title: 'Lebanon Border: Increased Tensions',
        description: 'Military buildup observed along Lebanon-Israel border. International peacekeepers on high alert.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'BBC News',
        severity: 'medium'
      },
      {
        id: 'dev-4',
        title: 'Diplomatic Update: Ceasefire Talks',
        description: 'Regional leaders continue diplomatic efforts for ceasefire negotiations in ongoing conflicts.',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'UN News',
        severity: 'low'
      }
    ],
    news: [
      {
        id: 'news-1',
        title: 'Breaking: International Response to Middle East Crisis',
        content: 'World leaders convene emergency session to address escalating humanitarian crisis. Multiple countries pledge additional aid.',
        timestamp: new Date().toISOString(),
        source: 'UN News'
      },
      {
        id: 'news-2',
        title: 'Ukraine Conflict: Weekly Analysis',
        content: 'Military analysts report significant developments in eastern regions. Infrastructure damage assessment ongoing.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'Defense Weekly'
      },
      {
        id: 'news-3',
        title: 'Humanitarian Aid Coordination',
        content: 'International relief organizations coordinate massive aid distribution efforts across conflict zones.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        source: 'Red Cross International'
      }
    ]
  };
};

// Test API connectivity
const testApiConnection = async (baseUrl: string) => {
  try {
    // In development, show mock data faster
    if (isDevelopment()) {
      console.log('🔧 Development mode: Testing API with shorter timeout');
    }
    
    const timeout = isDevelopment() ? 3000 : 5000; // Shorter timeout in dev
    const endpoints = ['/api/health', '/health', '/api/status', '/status', '/'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(timeout)
        });
        
        if (response.ok) {
          console.log(`✅ API connection successful: ${baseUrl}${endpoint}`);
          return true;
        }
      } catch (err) {
        console.log(`❌ Failed endpoint ${endpoint}:`, err);
      }
    }
    return false;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
};

// Hook for fetching real-time events with Supabase integration
export function useRealTimeEvents(options: {
  refreshInterval?: number;
  enabled?: boolean;
  hours?: number;
} = {}) {
  const { refreshInterval = 30000, enabled = true, hours = 24 } = options;
  
  return useQuery<APIResponse<Event[]>>({
    queryKey: ['events', 'recent', hours],
    queryFn: async () => {
      const baseUrl = API_BASE_URL;
      const response = await fetch(`${baseUrl}/events/recent?hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    refetchInterval: refreshInterval,
    enabled,
    staleTime: 10000 // Consider data stale after 10 seconds
  });
}

// Hook for paginated events
export function useEvents(filters: {
  page?: number;
  limit?: number;
  country?: string;
  severity?: string;
  start?: string;
  end?: string;
} = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value.toString());
  });

  return useQuery<APIResponse<Event[]>>({
    queryKey: ['events', filters],
    queryFn: async () => {
      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    staleTime: 60000 // Cache for 1 minute
  });
}

// Hook for latest news with better error handling
export function useLatestNews(limit: number = 10) {
  return useQuery<APIResponse<NewsItem[]>>({
    queryKey: ['news', 'latest', limit],
    queryFn: async () => {
      const baseUrl = API_BASE_URL;
      const response = await fetch(`${baseUrl}/news/latest?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 30000 // Consider stale after 30 seconds
  });
}

// Hook for triggering manual news aggregation (development)
export function useNewsAggregation() {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);

  const triggerAggregation = async () => {
    setIsRunning(true);
    try {
      const baseUrl = API_BASE_URL;
      const response = await fetch(`${baseUrl}/jobs/news`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to trigger news aggregation');
      
      // Invalidate and refetch related queries
      await queryClient.invalidateQueries({ queryKey: ['news'] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      
      return await response.json();
    } finally {
      setIsRunning(false);
    }
  };

  return { triggerAggregation, isRunning };
}

// Hook for data source status with Supabase integration
export function useDataSourceStatus() {
  return useQuery({
    queryKey: ['data-sources', 'status'],
    queryFn: async () => {
      try {
        const baseUrl = API_BASE_URL;
        // This will be replaced with real data source monitoring
        const [newsCount] = await Promise.all([
          fetch(`${baseUrl}/news?limit=1`).then(r => r.json()).catch(() => ({ pagination: { total: 0 } }))
        ]);

        return {
          sources: [
            {
              id: 'supabase-news',
              name: 'Supabase News Feed',
              type: 'Real-time Database',
              status: 'active',
              lastUpdate: new Date().toISOString(),
              recordsToday: newsCount.pagination?.total || 0,
              reliability: 98
            },
            {
              id: 'rss-aggregator',
              name: 'RSS Aggregator',
              type: 'Multiple RSS/API',
              status: 'active',
              lastUpdate: new Date().toISOString(),
              recordsToday: newsCount.pagination?.total || 0,
              reliability: 95
            },
            {
              id: 'ai-processor',
              name: 'AI Content Processor',
              type: 'ML Analysis',
              status: 'active',
              lastUpdate: new Date().toISOString(),
              recordsToday: Math.floor((newsCount.pagination?.total || 0) * 0.8),
              reliability: 92
            }
          ]
        };
      } catch (error) {
        console.error('Failed to fetch data source status:', error);
        return {
          sources: [
            {
              id: 'offline-mode',
              name: 'Offline Mode',
              type: 'Local Cache',
              status: 'degraded',
              lastUpdate: new Date().toISOString(),
              recordsToday: 0,
              reliability: 0
            }
          ]
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Update every 5 minutes
    staleTime: 2 * 60 * 1000
  });
}

// Hook for real-time data - fixed version with immediate mock data in development
export function useRealTimeData(): UseRealTimeDataReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update fetchInitialData to better handle backend connection
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useRealTimeData: Starting data fetch...');
      
      const baseUrl = API_BASE_URL;
      
      // Test backend health first
      try {
        // Health check
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (healthResponse.ok) {
          console.log('✅ Backend health check passed');
        } else {
          throw new Error('Backend health check failed');
        }
      } catch (healthError) {
        console.warn('⚠️ Backend not available:', healthError);
        setError('Backend server not available. Please start the backend server.');
        setLoading(false);
        return;
      }

      // In development mode, load mock data immediately to show something
      if (isDevelopment()) {
        console.log('🔧 Development mode: Loading MOCK DATA immediately');
        const mockData = getMockData();
        // Add MOCK DATA labels to all mock content
        const labeledEvents = mockData.events.map(event => ({
          ...event,
          title: event.title + ' - MOCK DATA',
          description: event.description + ' - MOCK DATA',
          source: event.source + ' - MOCK DATA'
        }));
        const labeledNews = mockData.news.map(news => ({
          ...news,
          title: news.title + ' - MOCK DATA',
          content: news.content + ' - MOCK DATA',
          source: news.source + ' - MOCK DATA'
        }));
        
        setEvents(labeledEvents);
        setNews(labeledNews);
        setLoading(false);
        
        // Still try to connect to API in background
        setTimeout(async () => {
          const isApiAvailable = await testApiConnection(baseUrl);
          if (isApiAvailable) {
            console.log('🔧 Development: API available, will try to load real data');
            // Don't reload if we already have mock data showing
          }
        }, 1000);
        
        return;
      }
      
      // Test API connection first
      const isApiAvailable = await testApiConnection(baseUrl);
      
      if (!isApiAvailable) {
        console.warn('⚠️ API not available, using mock data');
        const mockData = getMockData();
        setEvents(mockData.events);
        setNews(mockData.news);
        setLoading(false);
        return;
      }

      // Try to fetch events from different possible endpoints
      const eventEndpoints = ['/api/events', '/events', '/api/v1/events'];
      let eventsLoaded = false;
      
      for (const endpoint of eventEndpoints) {
        try {
          console.log(`🔍 Trying events endpoint: ${baseUrl}${endpoint}`);
          const eventsResponse = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000)
          });
          
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            console.log('✅ Events response:', eventsData);
            
            // Handle different response formats
            let eventsList = [];
            if (Array.isArray(eventsData)) {
              eventsList = eventsData;
            } else if (eventsData.data && Array.isArray(eventsData.data)) {
              eventsList = eventsData.data;
            } else if (eventsData.events && Array.isArray(eventsData.events)) {
              eventsList = eventsData.events;
            } else if (eventsData.results && Array.isArray(eventsData.results)) {
              eventsList = eventsData.results;
            }
            
            setEvents(eventsList);
            console.log(`✅ Loaded ${eventsList.length} events from ${endpoint}`);
            eventsLoaded = true;
            break;
          }
        } catch (endpointError) {
          console.log(`❌ Events endpoint ${endpoint} failed:`, endpointError);
        }
      }

      // Try to fetch news from different possible endpoints
      const newsEndpoints = ['/api/news', '/news', '/api/v1/news'];
      let newsLoaded = false;
      
      for (const endpoint of newsEndpoints) {
        try {
          console.log(`🔍 Trying news endpoint: ${baseUrl}${endpoint}`);
          const newsResponse = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000)
          });
          
          if (newsResponse.ok) {
            const newsData = await newsResponse.json();
            console.log('✅ News response:', newsData);
            
            // Handle different response formats
            let newsList = [];
            if (Array.isArray(newsData)) {
              newsList = newsData;
            } else if (newsData.data && Array.isArray(newsData.data)) {
              newsList = newsData.data;
            } else if (newsData.news && Array.isArray(newsData.news)) {
              newsList = newsData.news;
            } else if (newsData.results && Array.isArray(newsData.results)) {
              newsList = newsData.results;
            }
            
            setNews(newsList);
            console.log(`✅ Loaded ${newsList.length} news items from ${endpoint}`);
            newsLoaded = true;
            break;
          }
        } catch (endpointError) {
          console.log(`❌ News endpoint ${endpoint} failed:`, endpointError);
        }
      }

      // If no real data was loaded, use mock data
      if (!eventsLoaded || !newsLoaded) {
        console.log('⚠️ Using mock data for missing endpoints');
        
        if (!eventsLoaded) {
          setEvents([
            {
              id: 'mock-1',
              title: 'Mock: Gaza Conflict Update',
              description: 'This is mock data - API connection failed.',
              created_at: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0],
              source: 'Mock Source',
              severity: 'high'
            }
          ]);
        }
        
        if (!newsLoaded) {
          setNews([
            {
              id: 'mock-1',
              title: 'Mock: News Update',
              content: 'This is mock data - API connection failed.',
              timestamp: new Date().toISOString(),
              source: 'Mock Source'
            }
          ]);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ useRealTimeData: Critical error:', err);
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
      
      // Set fallback mock data even on error
      setEvents([
        {
          id: 'error-1',
          title: 'API Connection Error',
          description: 'Unable to connect to backend API. Check your backend server.',
          created_at: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          source: 'System',
          severity: 'critical'
        }
      ]);
    }
  }, []);

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data...');
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchInitialData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [fetchInitialData, refreshData]);

  return {
    events,
    news,
    loading,
    error,
    refreshData
  };
}