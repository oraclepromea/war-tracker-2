import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeEvents, useLatestNews, useNewsAggregation } from '../hooks/useRealTimeData';

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

export function WarEventsTimeline() {
  const [timeRange, setTimeRange] = useState(24); // hours
  const [showRealTime, setShowRealTime] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Use real data hooks
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useRealTimeEvents({
    hours: timeRange,
    enabled: showRealTime
  });

  const { data: newsData, isLoading: newsLoading } = useLatestNews(5);
  const { triggerAggregation, isRunning } = useNewsAggregation();

  // Extract events from API response
  const realTimeEvents = eventsData?.data || [];
  const latestNews = newsData?.data || [];

  // Filter events by severity
  const filteredEvents = selectedSeverity === 'all' 
    ? realTimeEvents 
    : realTimeEvents.filter((event: Event) => event.severity === selectedSeverity);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMinutes}m ago`;
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-tactical font-bold text-neon-400">
          War Events Timeline
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Real-time Toggle */}
          <button
            onClick={() => setShowRealTime(!showRealTime)}
            className={`px-4 py-2 rounded font-mono text-sm transition-all ${
              showRealTime 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {showRealTime ? '🟢 LIVE' : '⚫ OFFLINE'}
          </button>

          {/* Manual Refresh for Development */}
          <button
            onClick={triggerAggregation}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-mono text-sm text-white"
          >
            {isRunning ? '🔄 SYNCING...' : '🔄 SYNC NOW'}
          </button>
        </div>
      </div>

      {/* Time Range and Severity Filters */}
      <div className="flex items-center justify-between bg-tactical-panel p-4 rounded-lg border border-tactical-border">
        <div className="flex items-center space-x-4">
          <label className="text-tactical-muted font-mono text-sm">TIME RANGE:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-tactical-bg border border-tactical-border rounded px-3 py-1 text-neon-400 font-mono text-sm"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={72}>Last 3 Days</option>
            <option value={168}>Last Week</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-tactical-muted font-mono text-sm">SEVERITY:</label>
          <select 
            value={selectedSeverity} 
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-tactical-bg border border-tactical-border rounded px-3 py-1 text-neon-400 font-mono text-sm"
          >
            <option value="all">ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-tactical-panel p-4 rounded border border-tactical-border">
          <div className="text-tactical-muted text-xs font-mono mb-1">EVENTS (LAST {timeRange}H)</div>
          <div className="text-2xl font-tactical text-neon-400">
            {eventsLoading ? '...' : filteredEvents.length}
          </div>
        </div>
        
        <div className="bg-tactical-panel p-4 rounded border border-tactical-border">
          <div className="text-tactical-muted text-xs font-mono mb-1">NEWS SOURCES</div>
          <div className="text-2xl font-tactical text-neon-400">
            {newsLoading ? '...' : latestNews.length}
          </div>
        </div>

        <div className="bg-tactical-panel p-4 rounded border border-tactical-border">
          <div className="text-tactical-muted text-xs font-mono mb-1">LAST UPDATE</div>
          <div className="text-sm font-mono text-green-400">
            {eventsData?.meta?.lastUpdated ? formatTimeAgo(eventsData.meta.lastUpdated) : 'Never'}
          </div>
        </div>
      </div>

      {/* Error States */}
      {eventsError && (
        <div className="bg-red-900/20 border border-red-500 rounded p-4">
          <div className="text-red-400 font-mono text-sm">
            ⚠️ Error loading events: {eventsError.message}
          </div>
        </div>
      )}

      {/* Loading State */}
      {eventsLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-neon-400 font-mono">🔄 Loading real-time events...</div>
        </div>
      )}

      {/* Events Timeline */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredEvents.map((event: Event, index: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-tactical-panel p-6 rounded-lg border-l-4 ${getSeverityColor(event.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-neon-400 font-tactical text-lg">
                      {event.country}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-mono uppercase ${getSeverityColor(event.severity)} bg-opacity-20`}>
                      {event.severity}
                    </span>
                    <span className="text-tactical-muted text-xs font-mono">
                      {event.source}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-3 leading-relaxed">
                    {event.description}
                  </p>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {event.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="bg-tactical-bg text-tactical-muted px-2 py-1 rounded text-xs font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-tactical-muted text-xs font-mono">
                    {formatTimeAgo(event.date)}
                  </div>
                  <div className="text-tactical-muted text-xs font-mono mt-1">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* No Events State */}
        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="text-center py-8">
            <div className="text-tactical-muted font-mono">
              No events found for the selected time range and severity level.
            </div>
          </div>
        )}
      </div>

      {/* Latest News Section */}
      {latestNews.length > 0 && (
        <div className="border-t border-tactical-border pt-6">
          <h2 className="text-xl font-tactical text-neon-400 mb-4">Latest News Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestNews.map((news: NewsItem) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-tactical-panel p-4 rounded border border-tactical-border hover:border-neon-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-tactical-muted">{news.source}</span>
                  <span className="text-xs font-mono text-tactical-muted">
                    {formatTimeAgo(news.publishedAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-300 mb-2 line-clamp-2">
                  <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-neon-400">
                    {news.title}
                  </a>
                </h3>
                {news.summary && (
                  <p className="text-tactical-muted text-sm line-clamp-2">
                    {news.summary}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}