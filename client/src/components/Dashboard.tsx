import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/index';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  Globe, 
  MapPin,
  RefreshCw,
  ExternalLink,
  Users,
  Target,
  Shield
} from 'lucide-react';

interface WarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  verified: boolean;
  type: string;
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

interface DashboardStats {
  totalEvents: number;
  criticalEvents: number;
  activeRegions: number;
  activeSources: number;
  lastUpdate: string;
}

export function Dashboard() {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    criticalEvents: 0,
    activeRegions: 0,
    activeSources: 0,
    lastUpdate: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      // Simulate API call with demo data
      const demoEvents: WarEvent[] = [
        {
          id: '1',
          title: 'Israeli Airstrikes Target Gaza Strip',
          description: 'Military operations continue in Gaza Strip with reported strikes on strategic targets.',
          location: 'Gaza Strip',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          severity: 'critical',
          source: 'Al Jazeera',
          verified: true,
          type: 'airstrike',
          casualties: { confirmed: 12, estimated: 25 }
        },
        {
          id: '2',
          title: 'International Talks on Ukraine Situation',
          description: 'Diplomatic efforts continue to address the ongoing conflict affecting Ukraine region.',
          location: 'Ukraine',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          severity: 'medium',
          source: 'Reuters',
          verified: true,
          type: 'diplomatic'
        },
        {
          id: '3',
          title: 'Humanitarian Crisis in Iraq',
          description: 'Military activity reported in Iraq. Situation developing.',
          location: 'Iraq',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          severity: 'medium',
          source: 'Times of Israel',
          verified: false,
          type: 'humanitarian'
        }
      ];

      setEvents(demoEvents);
      setStats({
        totalEvents: 175,
        criticalEvents: 5,
        activeRegions: 12,
        activeSources: 8,
        lastUpdate: new Date().toISOString()
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'low': return 'bg-green-600/20 text-green-400 border-green-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const recentEvents = events.slice(0, 8);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tactical-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
          <p className="text-tactical-muted">Connecting to War Tracker API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-tactical font-bold text-neon-400">
              WAR TRACKER DASHBOARD
            </h1>
            <p className="text-tactical-muted mt-2">
              Real-time conflict monitoring and intelligence
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="text-sm text-tactical-muted font-mono">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="tactical-panel p-4 rounded neon-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-mono text-sm font-bold">SYSTEM ONLINE</span>
              </div>
              <div className="text-tactical-muted text-sm">
                Monitoring: <span className="text-neon-400">Gaza • Ukraine • Lebanon • Syria</span>
              </div>
              <div className="text-tactical-muted text-sm">
                Sources: <span className="text-neon-400">{stats.activeSources} active</span>
              </div>
            </div>
            <div className="text-tactical-muted text-xs font-mono">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tactical-muted text-sm font-mono">TOTAL EVENTS</p>
                  <p className="text-2xl font-tactical font-bold text-neon-400">
                    {stats.totalEvents}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-neon-400" />
              </div>
              <div className="mt-2 text-xs text-tactical-muted">
                Last 7 days
              </div>
            </CardContent>
          </Card>

          <Card className="neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tactical-muted text-sm font-mono">CRITICAL ALERTS</p>
                  <p className="text-2xl font-tactical font-bold text-red-400">
                    {stats.criticalEvents}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div className="mt-2 text-xs text-red-400">
                Requires immediate attention
              </div>
            </CardContent>
          </Card>

          <Card className="neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tactical-muted text-sm font-mono">ACTIVE REGIONS</p>
                  <p className="text-2xl font-tactical font-bold text-orange-400">
                    {stats.activeRegions}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-orange-400" />
              </div>
              <div className="mt-2 text-xs text-tactical-muted">
                Conflict zones
              </div>
            </CardContent>
          </Card>

          <Card className="neon-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tactical-muted text-sm font-mono">DATA SOURCES</p>
                  <p className="text-2xl font-tactical font-bold text-blue-400">
                    {stats.activeSources}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <div className="mt-2 text-xs text-tactical-muted">
                Intelligence feeds
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-neon-400" />
                <span>Recent Events</span>
              </div>
              <Badge variant="outline" className="text-neon-400 border-neon-400">
                {recentEvents.length} events
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {recentEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="tactical-panel p-4 rounded hover:bg-tactical-bg transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${getSeverityColor(event.severity)} text-xs`}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-tactical-muted font-mono">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                          {event.verified && (
                            <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-tactical text-neon-400 mb-1">
                          {event.title}
                        </h4>
                        
                        <p className="text-sm text-tactical-muted line-clamp-2 mb-2">
                          {event.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-tactical-muted">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="h-3 w-3" />
                            <span>{event.source}</span>
                          </div>
                          {event.casualties && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{event.casualties.confirmed} casualties</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {events.length === 0 && !isLoading && (
                <div className="text-center py-8 text-tactical-muted">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events available</p>
                  <p className="text-sm">Check your data sources</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}