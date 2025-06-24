import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';

export function LiveEventsFeed() {
  const { backendData, backendStatus } = useRealTimeData();
  
  // Extract events data from backendData
  const events = backendData?.events || [];
  const loading = backendStatus === 'checking';
  const error = backendStatus === 'offline' ? 'Backend offline' : null;

  // Get the latest 10 events
  const recentEvents = events.slice(0, 10);
  
  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'text-red-400 bg-red-400/10 border-red-400/20',
      high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      low: 'text-green-400 bg-green-400/10 border-green-400/20'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diff = now.getTime() - eventTime.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="neon-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-neon-400" />
            <span>Live Events Feed</span>
          </div>
          <div className="flex items-center space-x-2">
            {loading ? (
              <WifiOff className="h-4 w-4 text-yellow-400 animate-pulse" />
            ) : error ? (
              <WifiOff className="h-4 w-4 text-red-400" />
            ) : (
              <Wifi className="h-4 w-4 text-green-400" />
            )}
            <span className="text-xs text-tactical-muted font-mono">
              {loading ? 'CONNECTING' : error ? 'OFFLINE' : 'LIVE'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {loading && events.length === 0 ? (
            <div className="p-4 text-center text-tactical-muted">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-400 mx-auto mb-2" />
              Loading events...
            </div>
          ) : error && events.length === 0 ? (
            <div className="p-4 text-center text-red-400">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
              {error}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="p-4 text-center text-tactical-muted">
              No events available
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {events.map((event: any, index: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded border-l-4 ${getSeverityColor(event.severity)} hover:bg-tactical-bg/50 transition-colors cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-neon-400 line-clamp-2 flex-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-1 ml-2">
                      {/* Real-time indicator for very recent events */}
                      {Date.now() - new Date(event.created_at || event.date).getTime() < 300000 && (
                        <span className="bg-red-500 text-white px-1 rounded text-xs animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-tactical-muted line-clamp-2 mb-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {event.country && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-tactical-muted">{event.country}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-tactical-muted">
                          {formatTimeAgo(event.created_at || event.date)}
                        </span>
                      </div>
                    </div>
                    
                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-neon-400 hover:text-neon-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{event.source}</span>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {events.length > 10 && (
          <div className="p-3 border-t border-tactical-border text-center">
            <span className="text-xs text-tactical-muted font-mono">
              Showing latest 10 of {events.length} events
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveEventsFeed;