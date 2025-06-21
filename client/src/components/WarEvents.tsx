import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users,
  Wifi,
  WifiOff,
  ExternalLink
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

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
  date: string; // Add missing date property
  coordinates?: [number, number];
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

export function WarEvents() {
  const { events, isConnected, connectionStatus } = useWebSocket();
  const [filteredEvents, setFilteredEvents] = useState<WarEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');

  const getSeverityColor = (severity: WarEvent['severity']) => {
    const colors = {
      critical: 'border-red-500 bg-red-500/10',
      high: 'border-orange-500 bg-orange-500/10',
      medium: 'border-yellow-500 bg-yellow-500/10',
      low: 'border-green-500 bg-green-500/10'
    };
    return colors[severity];
  };

  // Generate more realistic and current events
  const generateCurrentEvents = (): WarEvent[] => {
    const now = new Date();
    const eventTypes = ['airstrike', 'ground_assault', 'missile_attack', 'diplomatic', 'humanitarian'];
    const locations = [
      'Gaza Strip', 'West Bank', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 
      'Ukraine', 'Donetsk', 'Kharkiv', 'Crimea', 'Bakhmut', 'Zaporizhzhia'
    ];
    const sources = ['Reuters', 'BBC', 'Al Jazeera', 'Times of Israel', 'Kyiv Independent'];

    return Array.from({ length: 50 }, (_, i) => {
      const hoursAgo = Math.floor(Math.random() * 72); // Last 3 days
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];

      // Generate contextual events based on location
      const getEventDetails = (loc: string, eventType: string): {
        title: string;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category: string;
      } => {
        if (loc.includes('Gaza') || loc.includes('West Bank') || loc.includes('Lebanon')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Israeli airstrikes target ${loc}`,
                description: `Military operations continue in ${loc} with reported strikes on strategic targets. Casualties and damage assessment ongoing.`,
                severity: Math.random() > 0.3 ? 'high' : 'critical',
                category: 'military'
              };
            case 'missile_attack':
              return {
                title: `Rocket fire from ${loc}`,
                description: `Multiple rockets launched from ${loc} towards Israeli territory. Iron Dome systems activated.`,
                severity: 'high',
                category: 'military'
              };
            case 'humanitarian':
              return {
                title: `Humanitarian aid convoy enters ${loc}`,
                description: `International aid convoy delivers medical supplies and food to civilian population in ${loc}.`,
                severity: 'low',
                category: 'humanitarian'
              };
            default:
              return {
                title: `Military activity in ${loc}`,
                description: `Ongoing military operations reported in ${loc} region.`,
                severity: 'medium',
                category: 'military'
              };
          }
        } else if (loc.includes('Ukraine') || loc.includes('Donetsk') || loc.includes('Kharkiv')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Russian strikes hit ${loc}`,
                description: `Ukrainian forces report Russian airstrikes targeting civilian and military infrastructure in ${loc}.`,
                severity: Math.random() > 0.4 ? 'high' : 'critical',
                category: 'military'
              };
            case 'ground_assault':
              return {
                title: `Ground fighting intensifies near ${loc}`,
                description: `Heavy fighting reported as Ukrainian forces defend positions near ${loc}. Artillery exchanges ongoing.`,
                severity: 'high',
                category: 'military'
              };
            case 'diplomatic':
              return {
                title: `International talks on ${loc} situation`,
                description: `Diplomatic efforts continue to address the ongoing conflict affecting ${loc} region.`,
                severity: 'low',
                category: 'diplomatic'
              };
            default:
              return {
                title: `Military operations in ${loc}`,
                description: `Active military operations continue in the ${loc} sector.`,
                severity: 'medium',
                category: 'military'
              };
          }
        }
        
        return {
          title: `${type.replace('_', ' ')} in ${loc}`,
          description: `Military activity reported in ${loc}. Situation developing.`,
          severity: 'medium',
          category: 'military'
        };
      };

      const details = getEventDetails(location, type);

      return {
        id: `event-${timestamp.getTime()}-${i}`,
        timestamp: timestamp.toISOString(),
        date: timestamp.toISOString().split('T')[0], // Add missing date property
        title: details.title,
        description: details.description,
        location,
        type,
        severity: details.severity,
        casualties: type === 'humanitarian' || type === 'diplomatic' ? undefined : {
          confirmed: Math.floor(Math.random() * 50),
          estimated: Math.floor(Math.random() * 100)
        },
        source,
        coordinates: [31.5 + (Math.random() - 0.5) * 10, 35.0 + (Math.random() - 0.5) * 15] as [number, number],
        verified: Math.random() > 0.2
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Fetch events from API or generate mock data
  const fetchEvents = async () => {
    // setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/events');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      console.warn('Failed to fetch events from server, using generated data:', error);
      // Fallback to generated events
      const generatedEvents = generateCurrentEvents();
      // setEvents(generatedEvents);
      setFilteredEvents(generatedEvents);
    } 
    // finally {
    //   setIsLoading(false);
    // }
  };

  // Auto-refresh events
  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter events based on WebSocket events and local state
  useEffect(() => {
    if (!events) {
      setFilteredEvents([]);
      return;
    }

    let filtered = [...events];

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Sort events
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
    });

    // Add verified property to WebSocket events
    const formattedEvents = filtered.map(event => ({
      ...event,
      verified: true,
      date: event.date || new Date(event.timestamp).toISOString().split('T')[0]
    }));

    setFilteredEvents(formattedEvents);
  }, [events, severityFilter, locationFilter, sortBy]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-tactical font-bold text-neon-400">
          War Events Timeline
        </h2>
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-sm font-mono ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          
          <div className="text-sm text-tactical-muted font-mono">
            {filteredEvents.length} events • Real-time updates
          </div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className="tactical-panel p-4 rounded neon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className={`font-mono text-sm ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {isConnected ? 'LIVE MONITORING' : 'CONNECTION LOST'}
              </span>
            </div>
            <div className="text-tactical-muted text-sm">
              Active Conflicts: <span className="text-neon-400">Gaza • Ukraine • Lebanon</span>
            </div>
          </div>
          <div className="text-tactical-muted text-xs font-mono">
            WebSocket Status: {connectionStatus}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="neon-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">EVENT TYPE:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Events ({events?.length || 0})</option>
                <option value="airstrike">Airstrikes ({events?.filter(e => e.type === 'airstrike').length || 0})</option>
                <option value="ground_assault">Ground Assaults ({events?.filter(e => e.type === 'ground_assault').length || 0})</option>
                <option value="missile_attack">Missile Attacks ({events?.filter(e => e.type === 'missile_attack').length || 0})</option>
                <option value="diplomatic">Diplomatic ({events?.filter(e => e.type === 'diplomatic').length || 0})</option>
                <option value="humanitarian">Humanitarian ({events?.filter(e => e.type === 'humanitarian').length || 0})</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">REGION:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Regions ({events?.length || 0})</option>
                <option value="middle_east">Middle East ({events?.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('gaza') || loc.includes('west bank') || loc.includes('lebanon') || loc.includes('syria') || loc.includes('iraq') || loc.includes('yemen');
                }).length || 0})</option>
                <option value="ukraine">Ukraine Theater ({events?.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('ukraine') || loc.includes('donetsk') || loc.includes('kharkiv') || loc.includes('crimea') || loc.includes('bakhmut') || loc.includes('zaporizhzhia');
                }).length || 0})</option>
                <option value="gaza_strip">Gaza Strip ({events?.filter(e => e.location.toLowerCase().includes('gaza')).length || 0})</option>
                <option value="west_bank">West Bank ({events?.filter(e => e.location.toLowerCase().includes('west bank')).length || 0})</option>
                <option value="lebanon">Lebanon ({events?.filter(e => e.location.toLowerCase().includes('lebanon')).length || 0})</option>
                <option value="ukraine_east">Eastern Ukraine ({events?.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('donetsk') || loc.includes('bakhmut');
                }).length || 0})</option>
                <option value="ukraine_north">Northern Ukraine ({events?.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('kharkiv') || (loc.includes('ukraine') && !loc.includes('donetsk'));
                }).length || 0})</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'severity')}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="timestamp">Latest First</option>
                <option value="severity">Severity</option>
              </select>
            </div>

            <div className="ml-auto flex items-center space-x-4">
              {['critical', 'high', 'medium', 'low'].map(severity => {
                const count = filteredEvents.filter(e => e.severity === severity).length;
                return (
                  <div key={severity} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity as any).split(' ')[1]?.replace('/10', '/50')}`} />
                    <span className="text-xs text-tactical-muted font-mono">
                      {severity.toUpperCase()}: {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Live Events Stream</span>
                <div className="ml-auto text-xs text-tactical-muted font-mono">
                  {filteredEvents.length} events
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`tactical-panel p-4 rounded cursor-pointer transition-all border-l-4 ${
                      getSeverityColor(event.severity)
                    } ${
                      expandedEvent === event.id
                        ? 'bg-neon-950/30 border border-neon-400'
                        : 'hover:bg-tactical-bg'
                    }`}
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${getSeverityColor(
                            event.severity
                          ).split(' ')[0]?.replace('border-', 'text-')}`}
                        />
                        <span className="font-tactical text-neon-400">
                          {event.title}
                        </span>
                        <span className="text-xs text-tactical-muted font-mono uppercase">
                          {event.severity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-tactical-muted">
                        <span>{formatTimeAgo(event.timestamp)}</span>
                        {/* Real-time indicator for recent events */}
                        {Date.now() - new Date(event.timestamp).getTime() < 60000 && (
                          <span className="bg-red-500 text-white px-1 rounded text-xs animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-tactical-muted" />
                      <span className="text-sm text-tactical-text">
                        {event.location}
                      </span>
                    </div>

                    <p className="text-sm text-tactical-muted line-clamp-2">
                      {event.description}
                    </p>

                    {event.casualties && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-mono text-red-400">
                          {event.casualties.confirmed || 0} confirmed, {event.casualties.estimated || 0} estimated
                        </span>
                        <div className="text-xs text-tactical-muted">
                          <span>Confirmed: {event.casualties.confirmed || 0}</span>
                          <span className="mx-2">•</span>
                          <span>Estimated: {event.casualties.estimated || 0}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <div>
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Event Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  EVENT TYPE
                </div>
                <div className="text-neon-400 font-tactical">
                  {expandedEvent ? filteredEvents.find(e => e.id === expandedEvent)?.type : ''}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  LOCATION
                </div>
                <div className="text-tactical-text text-sm">
                  {expandedEvent ? filteredEvents.find(e => e.id === expandedEvent)?.location : ''}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  TIMESTAMP
                </div>
                <div className="text-tactical-text text-sm font-mono">
                  {expandedEvent ? new Date(filteredEvents.find(e => e.id === expandedEvent)!.timestamp).toLocaleString() : ''}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  SEVERITY
                </div>
                <div
                  className={`font-tactical uppercase ${getSeverityColor(
                    expandedEvent ? filteredEvents.find(e => e.id === expandedEvent)!.severity : 'medium'
                  ).split(' ')[0]?.replace('border-', 'text-')}`}
                >
                  {expandedEvent ? filteredEvents.find(e => e.id === expandedEvent)!.severity : ''}
                </div>
              </div>

              {expandedEvent && (() => {
                const event = filteredEvents.find(e => e.id === expandedEvent);
                if (!event?.casualties) return null;
                
                const { casualties } = event;
                return (
                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">
                      CASUALTIES
                    </div>
                    <div className="text-red-400 font-tactical">
                      {casualties.confirmed || 0} confirmed, {casualties.estimated || 0} estimated
                    </div>
                    <div className="text-xs text-tactical-muted">
                      <span>Confirmed: {casualties.confirmed || 0}</span>
                      <span className="mx-2">•</span>
                      <span>Estimated: {casualties.estimated || 0}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  DESCRIPTION
                </div>
                <div className="text-tactical-text text-sm">
                  {expandedEvent ? filteredEvents.find(e => e.id === expandedEvent)?.description : ''}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  SOURCES
                </div>
                <div className="space-y-1">
                  {expandedEvent && filteredEvents.find(e => e.id === expandedEvent)?.source && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-neon-400 text-sm cursor-pointer hover:underline">
                        {filteredEvents.find(e => e.id === expandedEvent)!.source}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  COORDINATES
                </div>
                <div className="text-tactical-text text-sm font-mono">
                  {expandedEvent && filteredEvents.find(e => e.id === expandedEvent)?.coordinates ? 
                    `${filteredEvents.find(e => e.id === expandedEvent)?.coordinates?.[0]}, ${filteredEvents.find(e => e.id === expandedEvent)?.coordinates?.[1]}` : 
                    'Unknown'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}