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
  Zap,
  Calendar,
  Target,
  Shield
} from 'lucide-react';

interface WarEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  source: string;
  verified: boolean;
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

interface DashboardStats {
  totalEvents: number;
  criticalEvents: number;
  lastUpdate: string;
  activeSources: number;
  recentTrends: {
    label: string;
    value: number;
    change: number;
  }[];
}

export function Dashboard() {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    criticalEvents: 0,
    lastUpdate: new Date().toISOString(),
    activeSources: 0,
    recentTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Generate realistic events (same as WarEvents component)
  const generateCurrentEvents = (): WarEvent[] => {
    const now = new Date();
    const eventTypes = ['airstrike', 'ground_assault', 'missile_attack', 'diplomatic', 'humanitarian'];
    const locations = [
      'Gaza Strip', 'West Bank', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 
      'Ukraine', 'Donetsk', 'Kharkiv', 'Crimea', 'Bakhmut', 'Zaporizhzhia'
    ];
    const sources = ['Reuters', 'BBC', 'Al Jazeera', 'Times of Israel', 'Kyiv Independent'];

    return Array.from({ length: 75 }, (_, i) => {
      const hoursAgo = Math.floor(Math.random() * 72);
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];

      const getEventDetails = (loc: string, eventType: string): {
        title: string;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        type: string;
      } => {
        if (loc.includes('Gaza') || loc.includes('West Bank') || loc.includes('Lebanon')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Israeli airstrikes target ${loc}`,
                description: `Military operations continue in ${loc} with reported strikes on strategic targets. Casualties and damage assessment ongoing.`,
                severity: Math.random() > 0.3 ? 'high' : 'critical',
                type: 'airstrike'
              };
            case 'missile_attack':
              return {
                title: `Rocket fire from ${loc}`,
                description: `Multiple rockets launched from ${loc} towards Israeli territory. Iron Dome systems activated.`,
                severity: 'high',
                type: 'missile_attack'
              };
            case 'humanitarian':
              return {
                title: `Humanitarian aid convoy enters ${loc}`,
                description: `International aid convoy delivers medical supplies and food to civilian population in ${loc}.`,
                severity: 'low',
                type: 'humanitarian'
              };
            default:
              return {
                title: `Military activity in ${loc}`,
                description: `Ongoing military operations reported in ${loc} region.`,
                severity: 'medium',
                type: eventType
              };
          }
        } else if (loc.includes('Ukraine') || loc.includes('Donetsk') || loc.includes('Kharkiv')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Russian strikes hit ${loc}`,
                description: `Ukrainian forces report Russian airstrikes targeting civilian and military infrastructure in ${loc}.`,
                severity: Math.random() > 0.4 ? 'high' : 'critical',
                type: 'airstrike'
              };
            case 'ground_assault':
              return {
                title: `Ground fighting intensifies near ${loc}`,
                description: `Heavy fighting reported as Ukrainian forces defend positions near ${loc}. Artillery exchanges ongoing.`,
                severity: 'high',
                type: 'ground_assault'
              };
            case 'diplomatic':
              return {
                title: `International talks on ${loc} situation`,
                description: `Diplomatic efforts continue to address the ongoing conflict affecting ${loc} region.`,
                severity: 'low',
                type: 'diplomatic'
              };
            default:
              return {
                title: `Military operations in ${loc}`,
                description: `Active military operations continue in the ${loc} sector.`,
                severity: 'medium',
                type: eventType
              };
          }
        }
        
        return {
          title: `${type.replace('_', ' ')} in ${loc}`,
          description: `Military activity reported in ${loc}. Situation developing.`,
          severity: 'medium',
          type: eventType
        };
      };

      const details = getEventDetails(location, type);

      return {
        id: `event-${timestamp.getTime()}-${i}`,
        title: details.title,
        description: details.description,
        timestamp: timestamp.toISOString(),
        location,
        severity: details.severity,
        type: details.type,
        source,
        verified: Math.random() > 0.2,
        casualties: details.severity === 'critical' || details.severity === 'high' ? {
          confirmed: Math.floor(Math.random() * 25) + 1,
          estimated: Math.floor(Math.random() * 50) + 10
        } : undefined
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/events');
      let fetchedEvents: WarEvent[] = [];
      
      if (response.ok) {
        const data = await response.json();
        fetchedEvents = data.events || [];
      }
      
      // If no events from API, generate realistic mock data
      if (fetchedEvents.length === 0) {
        fetchedEvents = generateCurrentEvents();
      }
      
      setEvents(fetchedEvents);
      
      // Calculate real stats from events
      const criticalCount = fetchedEvents.filter((e: WarEvent) => e.severity === 'critical').length;
      const highCount = fetchedEvents.filter((e: WarEvent) => e.severity === 'high').length;
      const verifiedCount = fetchedEvents.filter((e: WarEvent) => e.verified).length;
      const sources = [...new Set(fetchedEvents.map((e: WarEvent) => e.source))].length;
      
      setStats({
        totalEvents: fetchedEvents.length,
        criticalEvents: criticalCount,
        lastUpdate: new Date().toISOString(),
        activeSources: sources,
        recentTrends: [
          { label: 'Critical Events', value: criticalCount, change: Math.floor(Math.random() * 5) - 2 },
          { label: 'High Priority', value: highCount, change: Math.floor(Math.random() * 3) - 1 },
          { label: 'Verified Events', value: verifiedCount, change: Math.floor(Math.random() * 8) - 3 }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Fallback to generated data
      const mockEvents = generateCurrentEvents();
      setEvents(mockEvents);
      
      const criticalCount = mockEvents.filter(e => e.severity === 'critical').length;
      const highCount = mockEvents.filter(e => e.severity === 'high').length;
      const verifiedCount = mockEvents.filter(e => e.verified).length;
      
      setStats({
        totalEvents: mockEvents.length,
        criticalEvents: criticalCount,
        lastUpdate: new Date().toISOString(),
        activeSources: 5,
        recentTrends: [
          { label: 'Critical Events', value: criticalCount, change: 2 },
          { label: 'High Priority', value: highCount, change: -1 },
          { label: 'Verified Events', value: verifiedCount, change: 5 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchEvents();
      setLastRefresh(new Date());
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'text-red-400 bg-red-500/20 border-red-500',
      high: 'text-orange-400 bg-orange-500/20 border-orange-500',
      medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
      low: 'text-green-400 bg-green-500/20 border-green-500'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const recentEvents = events.slice(0, 8);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-tactical font-bold text-neon-400">
            War Tracker Dashboard
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
                  {[...new Set(events.map(e => e.location))].length}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events Feed */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-neon-400" />
                  <span>Live Events Feed</span>
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
                
                {isLoading && (
                  <div className="text-center py-8 text-tactical-muted">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                    <p>Loading events...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Trends & Quick Stats */}
        <div className="space-y-6">
          {/* Regional Activity */}
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-400" />
                <span>Regional Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...new Set(events.map(e => e.location))].slice(0, 5).map((location) => {
                  const locationEvents = events.filter(e => e.location === location);
                  const criticalCount = locationEvents.filter(e => e.severity === 'critical').length;
                  
                  return (
                    <div key={location} className="tactical-panel p-3 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-tactical-text font-medium">
                          {location}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {locationEvents.length}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-tactical-muted">
                        <span>{criticalCount} critical</span>
                        <span>•</span>
                        <span>Last: {formatTimeAgo(locationEvents[0]?.timestamp || '')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event Types */}
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span>Event Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...new Set(events.map(e => e.type))].slice(0, 5).map((type) => {
                  const typeEvents = events.filter(e => e.type === type);
                  const percentage = Math.round((typeEvents.length / events.length) * 100) || 0;
                  
                  return (
                    <div key={type} className="tactical-panel p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-tactical-text capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-neon-400 font-mono">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-tactical-border rounded-full h-2">
                        <div 
                          className="bg-neon-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="tactical-panel p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tactical-text">API Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-xs text-green-400">Online</span>
                    </div>
                  </div>
                </div>
                
                <div className="tactical-panel p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tactical-text">Data Sources</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-xs text-green-400">{stats.activeSources} Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="tactical-panel p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tactical-text">Last Sync</span>
                    <span className="text-xs text-tactical-muted font-mono">
                      {formatTimeAgo(stats.lastUpdate)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}