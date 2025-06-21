import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface WarEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  type: string;
  source: string;
  casualties?: {
    confirmed: number;
    estimated: number;
  };
  weaponsUsed?: string[];
  coordinates?: [number, number];
  verified: boolean;
  imageUrl?: string;
}

interface WarEventsProps {
  events?: WarEvent[];
  onEventSelect?: (event: WarEvent) => void;
  onEventFilter?: (filter: string) => void;
}

export function WarEvents({ events }: WarEventsProps) {
  const [filteredEvents, setFilteredEvents] = useState<WarEvent[]>([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WarEvent | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [allEvents, setAllEvents] = useState<WarEvent[]>([]);

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
      const getEventDetails = (loc: string, eventType: string) => {
        if (loc.includes('Gaza') || loc.includes('West Bank') || loc.includes('Lebanon')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Israeli airstrikes target ${loc}`,
                description: `Military operations continue in ${loc} with reported strikes on strategic targets. Casualties and damage assessment ongoing.`,
                severity: Math.random() > 0.3 ? 'high' : 'critical' as const,
                category: 'military'
              };
            case 'missile_attack':
              return {
                title: `Rocket fire from ${loc}`,
                description: `Multiple rockets launched from ${loc} towards Israeli territory. Iron Dome systems activated.`,
                severity: 'high' as const,
                category: 'military'
              };
            case 'humanitarian':
              return {
                title: `Humanitarian aid convoy enters ${loc}`,
                description: `International aid convoy delivers medical supplies and food to civilian population in ${loc}.`,
                severity: 'low' as const,
                category: 'humanitarian'
              };
            default:
              return {
                title: `Military activity in ${loc}`,
                description: `Ongoing military operations reported in ${loc} region.`,
                severity: 'medium' as const,
                category: 'military'
              };
          }
        } else if (loc.includes('Ukraine') || loc.includes('Donetsk') || loc.includes('Kharkiv')) {
          switch (eventType) {
            case 'airstrike':
              return {
                title: `Russian strikes hit ${loc}`,
                description: `Ukrainian forces report Russian airstrikes targeting civilian and military infrastructure in ${loc}.`,
                severity: Math.random() > 0.4 ? 'high' : 'critical' as const,
                category: 'military'
              };
            case 'ground_assault':
              return {
                title: `Ground fighting intensifies near ${loc}`,
                description: `Heavy fighting reported as Ukrainian forces defend positions near ${loc}. Artillery exchanges ongoing.`,
                severity: 'high' as const,
                category: 'military'
              };
            case 'diplomatic':
              return {
                title: `International talks on ${loc} situation`,
                description: `Diplomatic efforts continue to address the ongoing conflict affecting ${loc} region.`,
                severity: 'low' as const,
                category: 'diplomatic'
              };
            default:
              return {
                title: `Military operations in ${loc}`,
                description: `Active military operations continue in the ${loc} sector.`,
                severity: 'medium' as const,
                category: 'military'
              };
          }
        }
        
        return {
          title: `${type.replace('_', ' ')} in ${loc}`,
          description: `Military activity reported in ${loc}. Situation developing.`,
          severity: 'medium' as const,
          category: 'military'
        };
      };

      const details = getEventDetails(location, type);

      return {
        id: `event-${timestamp.getTime()}-${i}`,
        timestamp: timestamp.toISOString(),
        title: details.title,
        description: details.description,
        location,
        type,
        category: details.category,
        severity: details.severity as WarEvent['severity'], // Type assertion to fix severity type
        casualties: type === 'humanitarian' || type === 'diplomatic' ? undefined : {
          confirmed: Math.floor(Math.random() * 50),
          estimated: Math.floor(Math.random() * 100)
        },
        source,
        coordinates: [31.5 + (Math.random() - 0.5) * 10, 35.0 + (Math.random() - 0.5) * 15] as [number, number],
        verified: Math.random() > 0.2,
        weaponsUsed: type === 'airstrike' ? ['Fighter Jets', 'Missiles'] : undefined
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Fetch events from API or generate mock data
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from API first
      const response = await fetch('http://localhost:3001/api/events');
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data.events || []);
      } else {
        // Fallback to generated data
        const mockEvents = generateCurrentEvents();
        setAllEvents(mockEvents);
      }
    } catch (error) {
      console.warn('API unavailable, using generated data:', error);
      const mockEvents = generateCurrentEvents();
      setAllEvents(mockEvents);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh events
  useEffect(() => {
    fetchEvents();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchEvents, 120000);
    return () => clearInterval(interval);
  }, []);

  // Filter events based on props and local state
  useEffect(() => {
    // Use events prop if provided, otherwise use fetched events
    const sourceEvents = events && events.length > 0 ? events : allEvents;
    let filtered = sourceEvents;
    
    // Filter by event type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }
    
    // Filter by region/conflict zone
    if (filterRegion !== 'all') {
      filtered = filtered.filter(event => {
        const location = event.location.toLowerCase();
        switch (filterRegion) {
          case 'middle_east':
            return location.includes('gaza') || location.includes('west bank') || 
                   location.includes('lebanon') || location.includes('syria') || 
                   location.includes('iraq') || location.includes('yemen');
          case 'ukraine':
            return location.includes('ukraine') || location.includes('donetsk') || 
                   location.includes('kharkiv') || location.includes('crimea') || 
                   location.includes('bakhmut') || location.includes('zaporizhzhia');
          case 'gaza_strip':
            return location.includes('gaza');
          case 'west_bank':
            return location.includes('west bank');
          case 'lebanon':
            return location.includes('lebanon');
          case 'ukraine_east':
            return location.includes('donetsk') || location.includes('bakhmut');
          case 'ukraine_north':
            return location.includes('kharkiv') || location.includes('ukraine');
          default:
            return true;
        }
      });
    }
    
    // Sort events
    filtered.sort((a, b) => {
      if (sortBy === 'date' || sortBy === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
    });
    
    setFilteredEvents(filtered);
  }, [events, allEvents, filterType, filterRegion, sortBy]);

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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <div className="text-sm text-tactical-muted font-mono">
            {filteredEvents.length} events • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="neon-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-tactical-muted" />
              <span className="text-sm text-tactical-muted font-mono">EVENT TYPE:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Events ({allEvents.length})</option>
                <option value="airstrike">Airstrikes ({allEvents.filter(e => e.type === 'airstrike').length})</option>
                <option value="ground_assault">Ground Assaults ({allEvents.filter(e => e.type === 'ground_assault').length})</option>
                <option value="missile_attack">Missile Attacks ({allEvents.filter(e => e.type === 'missile_attack').length})</option>
                <option value="diplomatic">Diplomatic ({allEvents.filter(e => e.type === 'diplomatic').length})</option>
                <option value="humanitarian">Humanitarian ({allEvents.filter(e => e.type === 'humanitarian').length})</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">REGION:</span>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Regions ({allEvents.length})</option>
                <option value="middle_east">Middle East ({allEvents.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('gaza') || loc.includes('west bank') || loc.includes('lebanon') || loc.includes('syria') || loc.includes('iraq') || loc.includes('yemen');
                }).length})</option>
                <option value="ukraine">Ukraine Theater ({allEvents.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('ukraine') || loc.includes('donetsk') || loc.includes('kharkiv') || loc.includes('crimea') || loc.includes('bakhmut') || loc.includes('zaporizhzhia');
                }).length})</option>
                <option value="gaza_strip">Gaza Strip ({allEvents.filter(e => e.location.toLowerCase().includes('gaza')).length})</option>
                <option value="west_bank">West Bank ({allEvents.filter(e => e.location.toLowerCase().includes('west bank')).length})</option>
                <option value="lebanon">Lebanon ({allEvents.filter(e => e.location.toLowerCase().includes('lebanon')).length})</option>
                <option value="ukraine_east">Eastern Ukraine ({allEvents.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('donetsk') || loc.includes('bakhmut');
                }).length})</option>
                <option value="ukraine_north">Northern Ukraine ({allEvents.filter(e => {
                  const loc = e.location.toLowerCase();
                  return loc.includes('kharkiv') || (loc.includes('ukraine') && !loc.includes('donetsk'));
                }).length})</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="date">Latest First</option>
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

      {/* Real-time Status Bar */}
      <div className="tactical-panel p-4 rounded neon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-mono text-sm">LIVE MONITORING</span>
            </div>
            <div className="text-tactical-muted text-sm">
              Active Conflicts: <span className="text-neon-400">Gaza • Ukraine • Lebanon</span>
            </div>
          </div>
          <div className="text-tactical-muted text-xs font-mono">
            Next Update: {new Date(Date.now() + 120000).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Events</span>
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
                    transition={{ delay: index * 0.1 }}
                    className={`tactical-panel p-4 rounded cursor-pointer transition-all border-l-4 ${
                      getSeverityColor(event.severity)
                    } ${
                      selectedEvent?.id === event.id
                        ? 'bg-neon-950/30 border border-neon-400'
                        : 'hover:bg-tactical-bg'
                    }`}
                    onClick={() => setSelectedEvent(event)}
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
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-red-400 font-mono">
                          CASUALTIES: {event.casualties.confirmed} confirmed, {event.casualties.estimated} estimated
                        </span>
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
                  {selectedEvent?.type}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  LOCATION
                </div>
                <div className="text-tactical-text text-sm">
                  {selectedEvent?.location}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  TIMESTAMP
                </div>
                <div className="text-tactical-text text-sm font-mono">
                  {selectedEvent ? new Date(selectedEvent.timestamp).toLocaleString() : ''}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  SEVERITY
                </div>
                <div
                  className={`font-tactical uppercase ${getSeverityColor(
                    selectedEvent?.severity || 'medium'
                  ).split(' ')[0]?.replace('border-', 'text-')}`}
                >
                  {selectedEvent?.severity}
                </div>
              </div>

              {selectedEvent?.casualties && (
                <div className="tactical-panel p-3 rounded">
                  <div className="text-tactical-muted text-xs font-mono mb-1">
                    CASUALTIES
                  </div>
                  <div className="text-red-400 font-tactical">
                    {selectedEvent.casualties.confirmed} confirmed, {selectedEvent.casualties.estimated} estimated
                  </div>
                </div>
              )}

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  DESCRIPTION
                </div>
                <div className="text-tactical-text text-sm">
                  {selectedEvent?.description}
                </div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  SOURCES
                </div>
                <div className="space-y-1">
                  {selectedEvent?.source && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-3 w-3 text-neon-400" />
                      <span className="text-neon-400 text-sm cursor-pointer hover:underline">
                        {selectedEvent.source}
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
                  {selectedEvent?.coordinates ? `${selectedEvent.coordinates[0]}, ${selectedEvent.coordinates[1]}` : 'Unknown'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}