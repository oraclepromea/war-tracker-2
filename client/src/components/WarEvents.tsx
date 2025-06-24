import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Users,
  Wifi,
  WifiOff,
  ExternalLink
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';

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
  date: string;
  coordinates?: [number, number];
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

// Add military intelligence processing functions
interface MilitaryIntelligence {
  country: string;
  region: string;
  coordinates?: [number, number];
  casualtiesDetected: {
    confirmed?: number;
    estimated?: number;
    civilian?: number;
    military?: number;
  };
  weaponsUsed: string[];
  militaryUnits: string[];
  eventClassification: {
    type: string;
    intensity: 'low' | 'medium' | 'high' | 'critical';
    strategicImpact: string;
  };
  keyEntities: string[];
  locationConfidence: number;
}

// Intelligence processing functions
const processWarIntelligence = (title: string, description: string): MilitaryIntelligence => {
  const text = (title + ' ' + description).toLowerCase();
  
  // Country/Region Detection
  const countryDetection = detectCountryAndRegion(text);
  
  // Coordinates Extraction
  const coordinates = extractCoordinates(text);
  
  // Casualties Analysis
  const casualties = extractCasualties(text);
  
  // Weapons Detection
  const weapons = detectWeapons(text);
  
  // Military Units
  const units = detectMilitaryUnits(text);
  
  // Event Classification
  const classification = classifyMilitaryEvent(text);
  
  // Key Entities
  const entities = extractKeyEntities(text);
  
  return {
    country: countryDetection.country,
    region: countryDetection.region,
    coordinates,
    casualtiesDetected: casualties,
    weaponsUsed: weapons,
    militaryUnits: units,
    eventClassification: classification,
    keyEntities: entities,
    locationConfidence: countryDetection.confidence
  };
};

const detectCountryAndRegion = (text: string) => {
  const locationMappings = {
    // Gaza/Palestine
    'gaza': { country: 'Palestine', region: 'Gaza Strip', confidence: 0.95 },
    'gaza strip': { country: 'Palestine', region: 'Gaza Strip', confidence: 0.98 },
    'rafah': { country: 'Palestine', region: 'Gaza Strip - Rafah', confidence: 0.95 },
    'khan younis': { country: 'Palestine', region: 'Gaza Strip - Khan Younis', confidence: 0.95 },
    
    // Israel
    'israel': { country: 'Israel', region: 'Israel', confidence: 0.90 },
    'tel aviv': { country: 'Israel', region: 'Central Israel', confidence: 0.95 },
    'jerusalem': { country: 'Israel', region: 'Jerusalem District', confidence: 0.95 },
    'haifa': { country: 'Israel', region: 'Northern Israel', confidence: 0.95 },
    
    // West Bank
    'west bank': { country: 'Palestine', region: 'West Bank', confidence: 0.95 },
    'ramallah': { country: 'Palestine', region: 'West Bank - Ramallah', confidence: 0.95 },
    'hebron': { country: 'Palestine', region: 'West Bank - Hebron', confidence: 0.95 },
    
    // Lebanon
    'lebanon': { country: 'Lebanon', region: 'Lebanon', confidence: 0.90 },
    'southern lebanon': { country: 'Lebanon', region: 'Southern Lebanon', confidence: 0.95 },
    'beirut': { country: 'Lebanon', region: 'Beirut', confidence: 0.95 },
    
    // Ukraine
    'ukraine': { country: 'Ukraine', region: 'Ukraine', confidence: 0.90 },
    'donetsk': { country: 'Ukraine', region: 'Donetsk Oblast', confidence: 0.95 },
    'kharkiv': { country: 'Ukraine', region: 'Kharkiv Oblast', confidence: 0.95 },
    'zaporizhzhia': { country: 'Ukraine', region: 'Zaporizhzhia Oblast', confidence: 0.95 },
    'bakhmut': { country: 'Ukraine', region: 'Donetsk Oblast - Bakhmut', confidence: 0.95 },
    'mariupol': { country: 'Ukraine', region: 'Donetsk Oblast - Mariupol', confidence: 0.95 },
    'kyiv': { country: 'Ukraine', region: 'Kyiv Oblast', confidence: 0.95 },
    
    // Syria
    'syria': { country: 'Syria', region: 'Syria', confidence: 0.90 },
    'damascus': { country: 'Syria', region: 'Damascus', confidence: 0.95 },
    'aleppo': { country: 'Syria', region: 'Aleppo Governorate', confidence: 0.95 },
  };
  
  for (const [location, data] of Object.entries(locationMappings)) {
    if (text.includes(location)) {
      return data;
    }
  }
  
  return { country: 'Unknown', region: 'Unknown', confidence: 0.0 };
};

const extractCoordinates = (text: string): [number, number] | undefined => {
  // Look for coordinate patterns
  const coordPattern = /(\d+\.?\d*)[°\s]*[ns]?\s*[,\s]\s*(\d+\.?\d*)[°\s]*[ew]?/i;
  const match = text.match(coordPattern);
  
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  
  // Default coordinates for known regions
  const regionCoords: Record<string, [number, number]> = {
    'gaza': [31.5, 34.45],
    'tel aviv': [32.08, 34.78],
    'donetsk': [48.0, 37.8],
    'kharkiv': [49.99, 36.23],
    'beirut': [33.89, 35.49]
  };
  
  for (const [region, coords] of Object.entries(regionCoords)) {
    if (text.includes(region)) {
      return coords;
    }
  }
  
  return undefined;
};

const extractCasualties = (text: string) => {
  const casualties: any = {};
  
  // Pattern matching for casualty numbers
  const patterns = [
    /(\d+)\s*(?:killed|dead|deaths|fatalities)/i,
    /(\d+)\s*(?:wounded|injured|casualties)/i,
    /(\d+)\s*(?:civilians?)\s*(?:killed|dead)/i,
    /(\d+)\s*(?:soldiers?|military|troops)\s*(?:killed|dead)/i,
    /(?:at least|over|more than)\s*(\d+)\s*(?:killed|dead|casualties)/i
  ];
  
  patterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      const number = parseInt(match[1]);
      if (text.includes('civilian')) {
        casualties.civilian = number;
      } else if (text.includes('soldier') || text.includes('military')) {
        casualties.military = number;
      } else if (text.includes('at least') || text.includes('over')) {
        casualties.estimated = number;
      } else {
        casualties.confirmed = number;
      }
    }
  });
  
  return casualties;
};

const detectWeapons = (text: string): string[] => {
  const weapons: string[] = [];
  const weaponPatterns = [
    // Missiles & Rockets
    'rocket', 'missile', 'qassam', 'grad', 'katyusha', 'iron dome', 'patriot',
    'himars', 'atacms', 'javelin', 'stinger', 'tow missile',
    
    // Artillery & Air Power
    'airstrike', 'bombing', 'artillery', 'mortar', 'tank', 'drone', 'uav',
    'fighter jet', 'helicopter', 'gunship', 'bomber',
    
    // Small Arms & Explosives
    'ied', 'rpg', 'sniper', 'machine gun', 'explosive', 'grenade',
    
    // Specific Weapons
    'f-16', 'f-35', 'ah-64 apache', 'merkava', 'abrams', 'leopard',
    'bayraktar', 'switchblade', 'shahed'
  ];
  
  weaponPatterns.forEach(weapon => {
    if (text.includes(weapon.toLowerCase())) {
      weapons.push(weapon.charAt(0).toUpperCase() + weapon.slice(1));
    }
  });
  
  return [...new Set(weapons)]; // Remove duplicates
};

const detectMilitaryUnits = (text: string): string[] => {
  const units: string[] = [];
  const unitPatterns = [
    // Israeli Forces
    'idf', 'israeli defense forces', 'golani brigade', 'paratroopers brigade',
    'givati brigade', 'nahal brigade', 'armored corps',
    
    // Palestinian Groups
    'hamas', 'pij', 'palestinian islamic jihad', 'al-qassam brigades',
    'al-aqsa martyrs brigades',
    
    // Ukrainian Forces
    'ukrainian armed forces', 'territorial defense', 'azov regiment',
    'national guard of ukraine',
    
    // Russian Forces
    'russian armed forces', 'wagner group', 'vdv', 'spetsnaz',
    'rosgvardia',
    
    // General Military Terms
    'special forces', 'marines', 'air force', 'navy', 'army',
    'commandos', 'elite unit'
  ];
  
  unitPatterns.forEach(unit => {
    if (text.includes(unit.toLowerCase())) {
      units.push(unit.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    }
  });
  
  return [...new Set(units)];
};

const classifyMilitaryEvent = (text: string) => {
  let type = 'military_activity';
  let intensity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let strategicImpact = 'Localized military action';
  
  // Event Type Classification
  if (text.includes('airstrike') || text.includes('bombing')) {
    type = 'airstrike';
    intensity = 'high';
    strategicImpact = 'Air power projection';
  } else if (text.includes('rocket') || text.includes('missile')) {
    type = 'missile_attack';
    intensity = 'high';
    strategicImpact = 'Rocket/missile strike';
  } else if (text.includes('ground') && text.includes('assault')) {
    type = 'ground_assault';
    intensity = 'critical';
    strategicImpact = 'Ground force engagement';
  } else if (text.includes('drone') || text.includes('uav')) {
    type = 'drone_attack';
    intensity = 'medium';
    strategicImpact = 'Unmanned aerial operation';
  } else if (text.includes('artillery') || text.includes('shelling')) {
    type = 'artillery_strike';
    intensity = 'high';
    strategicImpact = 'Artillery bombardment';
  } else if (text.includes('diplomatic') || text.includes('ceasefire')) {
    type = 'diplomatic';
    intensity = 'low';
    strategicImpact = 'Diplomatic development';
  } else if (text.includes('humanitarian') || text.includes('aid')) {
    type = 'humanitarian';
    intensity = 'low';
    strategicImpact = 'Humanitarian operation';
  }
  
  // Intensity Modifiers
  if (text.includes('massive') || text.includes('heavy') || text.includes('intense')) {
    intensity = 'critical';
  } else if (text.includes('limited') || text.includes('minor')) {
    intensity = 'low';
  }
  
  return { type, intensity, strategicImpact };
};

const extractKeyEntities = (text: string): string[] => {
  const entities: string[] = [];
  const entityPatterns = [
    // Political Leaders
    'netanyahu', 'biden', 'zelensky', 'putin', 'nasrallah',
    
    // Organizations
    'un', 'nato', 'eu', 'red cross', 'unrwa',
    
    // Cities/Strategic Locations
    'tel aviv', 'jerusalem', 'gaza city', 'rafah', 'kyiv', 'moscow',
    
    // Military Terms
    'ceasefire', 'evacuation', 'blockade', 'siege', 'occupation'
  ];
  
  entityPatterns.forEach(entity => {
    if (text.includes(entity.toLowerCase())) {
      entities.push(entity.charAt(0).toUpperCase() + entity.slice(1));
    }
  });
  
  return [...new Set(entities)];
};

export function WarEvents() {
  const { backendData, backendStatus, refetch } = useRealTimeData();
  
  // Extract data from backendData
  const events = backendData?.events || [];
  const loading = backendStatus === 'checking';
  const error = backendStatus === 'offline' ? 'Backend offline' : null;
  const refreshData = refetch;

  // Add missing state variables
  const [filteredEvents, setFilteredEvents] = useState<WarEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Connection status from real-time data
  const isConnected = !loading && !error;
  const connectionStatus = loading ? 'connecting' : error ? 'error' : 'connected';

  // Utility function to get severity color
  const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500';
      case 'high':
        return 'border-orange-500 bg-orange-500';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500';
      case 'low':
        return 'border-green-500 bg-green-500';
      default:
        return 'border-gray-500 bg-gray-500';
    }
  };

  // Transform and filter events with intelligence processing
  useEffect(() => {
    if (!events || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    // Transform events to match WarEvent interface with intelligence processing
    const transformedEvents: WarEvent[] = events.map((event: any) => {
      // Process military intelligence
      const intelligence = processWarIntelligence(
        event.title || '', 
        event.description || ''
      );
      
      return {
        id: event.id,
        title: event.title || 'Untitled Event',
        description: event.description,
        timestamp: (event as any).timestamp || new Date().toISOString(),
        location: intelligence.region !== 'Unknown' ? intelligence.region : ((event as any).location || 'Unknown'),
        severity: (event.severity as 'critical' | 'high' | 'medium' | 'low') || intelligence.eventClassification.intensity,
        type: intelligence.eventClassification.type,
        source: event.source,
        verified: (event as any).verified ?? true,
        date: event.date || new Date().toISOString().split('T')[0],
        coordinates: intelligence.coordinates,
        casualties: Object.keys(intelligence.casualtiesDetected).length > 0 ? {
          confirmed: intelligence.casualtiesDetected.confirmed || 0,
          estimated: intelligence.casualtiesDetected.estimated || 0
        } : undefined,
        // Add intelligence data
        intelligence
      };
    });

    let filtered = [...transformedEvents];

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.location && event.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort events
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity] || 1) - (severityOrder[a.severity] || 1);
      }
    });

    setFilteredEvents(filtered);
  }, [events, severityFilter, locationFilter, sortBy, searchQuery]);

  // Utility function to format time ago
  const formatTimeAgo = (timestamp: string): string => {
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
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Search Input */}
            <div className="flex items-center space-x-2 flex-1 min-w-64">
              <span className="text-sm text-tactical-muted font-mono">SEARCH:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text flex-1"
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="bg-neon-500 hover:bg-neon-600 text-black px-3 py-1 rounded text-sm font-mono transition-colors"
            >
              REFRESH
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">EVENT TYPE:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Events ({filteredEvents?.length || 0})</option>
                <option value="airstrike">Airstrikes ({filteredEvents?.filter(e => e.type === 'airstrike').length || 0})</option>
                <option value="ground_assault">Ground Assaults ({filteredEvents?.filter(e => e.type === 'ground_assault').length || 0})</option>
                <option value="missile_attack">Missile Attacks ({filteredEvents?.filter(e => e.type === 'missile_attack').length || 0})</option>
                <option value="diplomatic">Diplomatic ({filteredEvents?.filter(e => e.type === 'diplomatic').length || 0})</option>
                <option value="humanitarian">Humanitarian ({filteredEvents?.filter(e => e.type === 'humanitarian').length || 0})</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-tactical-muted font-mono">REGION:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-tactical-panel border border-tactical-border rounded px-3 py-1 text-sm text-tactical-text"
              >
                <option value="all">All Regions ({filteredEvents?.length || 0})</option>
                <option value="middle_east">Middle East ({filteredEvents?.filter(e => {
                  const loc = e.location?.toLowerCase() || '';
                  return loc.includes('gaza') || loc.includes('west bank') || loc.includes('lebanon') || loc.includes('syria') || loc.includes('iraq') || loc.includes('yemen');
                }).length || 0})</option>
                <option value="ukraine">Ukraine Theater ({filteredEvents?.filter(e => {
                  const loc = e.location?.toLowerCase() || '';
                  return loc.includes('ukraine') || loc.includes('donetsk') || loc.includes('kharkiv') || loc.includes('crimea') || loc.includes('bakhmut') || loc.includes('zaporizhzhia');
                }).length || 0})</option>
                <option value="gaza_strip">Gaza Strip ({filteredEvents?.filter(e => e.location?.toLowerCase().includes('gaza')).length || 0})</option>
                <option value="west_bank">West Bank ({filteredEvents?.filter(e => e.location?.toLowerCase().includes('west bank')).length || 0})</option>
                <option value="lebanon">Lebanon ({filteredEvents?.filter(e => e.location?.toLowerCase().includes('lebanon')).length || 0})</option>
                <option value="ukraine_east">Eastern Ukraine ({filteredEvents?.filter(e => {
                  const loc = e.location?.toLowerCase() || '';
                  return loc.includes('donetsk') || loc.includes('bakhmut');
                }).length || 0})</option>
                <option value="ukraine_north">Northern Ukraine ({filteredEvents?.filter(e => {
                  const loc = e.location?.toLowerCase() || '';
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
              {expandedEvent ? (() => {
                const event = filteredEvents.find(e => e.id === expandedEvent);
                const intel = (event as any)?.intelligence;
                
                if (!event) return <div className="text-tactical-muted">Select an event to view details</div>;
                
                return (
                  <>
                    {/* Country & Region */}
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">COUNTRY/REGION</div>
                      <div className="text-neon-400 font-tactical">
                        {intel?.country || 'Unknown'} • {intel?.region || event.location}
                      </div>
                      {intel?.locationConfidence && (
                        <div className="text-xs text-tactical-muted mt-1">
                          Confidence: {Math.round(intel.locationConfidence * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Event Classification */}
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">EVENT CLASSIFICATION</div>
                      <div className="text-neon-400 font-tactical uppercase">
                        {intel?.eventClassification?.type?.replace('_', ' ') || event.type}
                      </div>
                      <div className="text-xs text-tactical-muted mt-1">
                        {intel?.eventClassification?.strategicImpact || 'Military activity'}
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">COORDINATES</div>
                      <div className="text-tactical-text text-sm font-mono">
                        {intel?.coordinates ? 
                          `${intel.coordinates[0].toFixed(4)}, ${intel.coordinates[1].toFixed(4)}` : 
                          'Unknown'
                        }
                      </div>
                      {intel?.coordinates && (
                        <div className="text-xs text-tactical-muted mt-1">
                          GPS: {intel.coordinates[0].toFixed(6)}°N, {intel.coordinates[1].toFixed(6)}°E
                        </div>
                      )}
                    </div>

                    {/* Casualties Analysis */}
                    {intel?.casualtiesDetected && Object.keys(intel.casualtiesDetected).length > 0 && (
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">CASUALTIES ANALYSIS</div>
                        <div className="space-y-1">
                          {intel.casualtiesDetected.confirmed && (
                            <div className="text-red-400 font-mono text-sm">
                              ⚫ Confirmed: {intel.casualtiesDetected.confirmed}
                            </div>
                          )}
                          {intel.casualtiesDetected.estimated && (
                            <div className="text-orange-400 font-mono text-sm">
                              ⚫ Estimated: {intel.casualtiesDetected.estimated}
                            </div>
                          )}
                          {intel.casualtiesDetected.civilian && (
                            <div className="text-yellow-400 font-mono text-sm">
                              ⚫ Civilian: {intel.casualtiesDetected.civilian}
                            </div>
                          )}
                          {intel.casualtiesDetected.military && (
                            <div className="text-blue-400 font-mono text-sm">
                              ⚫ Military: {intel.casualtiesDetected.military}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Weapons Detected */}
                    {intel?.weaponsUsed && intel.weaponsUsed.length > 0 && (
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">WEAPONS SYSTEMS</div>
                        <div className="flex flex-wrap gap-1">
                          {intel.weaponsUsed.map((weapon: string, index: number) => (
                            <span key={index} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs font-mono border border-red-400/20">
                              {weapon}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Military Units */}
                    {intel?.militaryUnits && intel.militaryUnits.length > 0 && (
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">MILITARY UNITS</div>
                        <div className="space-y-1">
                          {intel.militaryUnits.map((unit: string, index: number) => (
                            <div key={index} className="text-neon-400 text-sm font-mono">
                              ▸ {unit}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Entities */}
                    {intel?.keyEntities && intel.keyEntities.length > 0 && (
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">KEY ENTITIES</div>
                        <div className="flex flex-wrap gap-1">
                          {intel.keyEntities.map((entity: string, index: number) => (
                            <span key={index} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs font-mono border border-blue-400/20">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Severity & Timestamp */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">THREAT LEVEL</div>
                        <div className={`font-tactical uppercase ${getSeverityColor(event.severity).split(' ')[0]?.replace('border-', 'text-')}`}>
                          {event.severity}
                        </div>
                      </div>
                      
                      <div className="tactical-panel p-3 rounded">
                        <div className="text-tactical-muted text-xs font-mono mb-1">TIMESTAMP</div>
                        <div className="text-tactical-text text-xs font-mono">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Source Information */}
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">INTELLIGENCE SOURCE</div>
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-neon-400" />
                        <span className="text-neon-400 text-sm font-mono cursor-pointer hover:underline">
                          {event.source}
                        </span>
                        {event.verified && (
                          <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-mono border border-green-400/20">
                            VERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Full Description */}
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">FULL INTEL REPORT</div>
                      <div className="text-tactical-text text-sm leading-relaxed">
                        {event.description}
                      </div>
                    </div>
                  </>
                );
              })() : (
                <div className="tactical-panel p-6 rounded text-center">
                  <MapPin className="h-8 w-8 text-tactical-muted mx-auto mb-2" />
                  <div className="text-tactical-muted">
                    Select an event from the timeline to view detailed military intelligence
                  </div>
                  <div className="text-xs text-tactical-muted mt-2">
                    Intelligence includes: Country analysis, weapon systems, military units, casualties, and strategic assessment
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}