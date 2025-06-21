import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface APIResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    lastUpdated: string;
    source: string;
    count?: number;
  };
}

interface Event {
  id: string;
  source: string;
  date: string;
  country: string;
  description: string;
  severity: string;
  tags: string[];
  latitude?: number;
  longitude?: number;
}

interface NewsItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  severity: string;
  tags: string[];
  reliability: number;
}

// Hook for fetching real-time events
export function useRealTimeEvents(options: {
  refreshInterval?: number;
  enabled?: boolean;
  hours?: number;
} = {}) {
  const { refreshInterval = 30000, enabled = true, hours = 24 } = options;
  
  return useQuery<APIResponse<Event[]>>({
    queryKey: ['events', 'recent', hours],
    queryFn: async () => {
      const response = await fetch(`/api/events/recent?hours=${hours}`);
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

// Hook for latest news
export function useLatestNews(limit: number = 10) {
  return useQuery<APIResponse<NewsItem[]>>({
    queryKey: ['news', 'latest', limit],
    queryFn: async () => {
      const response = await fetch(`/api/news/latest?limit=${limit}`);
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
      const response = await fetch('/api/jobs/news', { method: 'POST' });
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

// Hook for data source status
export function useDataSourceStatus() {
  return useQuery({
    queryKey: ['data-sources', 'status'],
    queryFn: async () => {
      // This will be replaced with real data source monitoring
      const [eventsCount, newsCount] = await Promise.all([
        fetch('/api/events?limit=1').then(r => r.json()),
        fetch('/api/news?limit=1').then(r => r.json())
      ]);

      return {
        sources: [
          {
            id: 'news-aggregator',
            name: 'News Aggregator',
            type: 'Multiple RSS/API',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            recordsToday: newsCount.pagination?.total || 0,
            reliability: 95
          },
          {
            id: 'event-tracker',
            name: 'Event Tracker',
            type: 'Real-time Events',
            status: 'active',
            lastUpdate: new Date().toISOString(),
            recordsToday: eventsCount.pagination?.total || 0,
            reliability: 92
          }
        ]
      };
    },
    refetchInterval: 5 * 60 * 1000, // Update every 5 minutes
    staleTime: 2 * 60 * 1000
  });
}