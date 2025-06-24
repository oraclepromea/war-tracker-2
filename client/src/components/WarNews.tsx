import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Activity, 
  AlertTriangle, 
  Filter, 
  ExternalLink, 
  Clock,
  MapPin,
  Users,
  Crosshair
} from 'lucide-react';

interface WarEvent {
  id: string;
  event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic';
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  casualties: number | null;
  weapons_used: string[] | null;
  source_country: string | null;
  target_country: string | null;
  confidence: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  article_id: string;
  article_title: string;
  article_url: string;
  article_source: string;
  processed_at: string;
  created_at?: string;
}

export function WarNews() {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [threatLevelFilter, setThreatLevelFilter] = useState('all');
  const [newEventCount, setNewEventCount] = useState(0);

  // Get unique values for filters
  const countries = Array.from(new Set(events.map(e => e.country))).sort();
  const eventTypes = Array.from(new Set(events.map(e => e.event_type))).sort();
  const threatLevels = ['low', 'medium', 'high', 'critical'];

  // Filter events
  const filteredEvents = events.filter(event => {
    return (
      (countryFilter === 'all' || event.country === countryFilter) &&
      (eventTypeFilter === 'all' || event.event_type === eventTypeFilter) &&
      (threatLevelFilter === 'all' || event.threat_level === threatLevelFilter)
    );
  });

  // Fetch war events from Supabase
  const fetchWarEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        console.log('📰 Supabase not available, using fallback data');
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('war_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setEvents(data || []);
      console.log(`✅ Loaded ${data?.length || 0} war events`);
    } catch (err) {
      console.error('❌ Error fetching war events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch war events');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchWarEvents();

    if (!supabase) {
      console.log('📰 Supabase not available, skipping real-time subscription');
      return;
    }

    console.log('🔔 Setting up real-time war events subscription...');
    
    const channel = supabase
      .channel('war_events_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'war_events'
        },
        (payload) => {
          console.log('🚨 New war event received:', payload.new);
          
          const newEvent = payload.new as WarEvent;
          
          setEvents(prev => {
            const exists = prev.some(event => event.id === newEvent.id);
            if (exists) return prev;
            
            return [newEvent, ...prev].slice(0, 100);
          });
          
          setNewEventCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Get threat level styling
  const getThreatLevelStyling = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600/20 text-red-400 border-red-400';
      case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-400';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-400';
      case 'low': return 'bg-green-600/20 text-green-400 border-green-400';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-400';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'airstrike': return <Crosshair className="h-4 w-4" />;
      case 'humanitarian': return <Users className="h-4 w-4" />;
      case 'cyberattack': return <Activity className="h-4 w-4" />;
      case 'diplomatic': return <MapPin className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  // Reset new event counter
  const resetNewCount = () => setNewEventCount(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <Activity className="h-12 w-12 text-neon-400 animate-spin" />
              <p className="text-lg font-mono text-tactical-text">Loading war intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="tactical-panel border-red-500 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Intelligence Error</h2>
            </div>
            <p className="text-tactical-muted mb-4">{error}</p>
            <button
              onClick={fetchWarEvents}
              className="px-4 py-2 bg-neon-600 hover:bg-neon-700 text-tactical-bg rounded font-mono"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-bg p-4 md:p-6" onClick={resetNewCount}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Activity className="h-8 w-8 text-red-400 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-bold text-neon-400">War Intelligence Dashboard</h1>
              {newEventCount > 0 && (
                <div className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-mono animate-bounce">
                  +{newEventCount} new
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm font-mono text-tactical-muted">
              <span>{filteredEvents.length} events</span>
              <span className="text-green-400">● LIVE</span>
            </div>
          </div>

          {/* Filters */}
          <div className="tactical-panel p-4 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="h-4 w-4 text-tactical-muted" />
              <span className="text-sm font-mono text-tactical-text">FILTERS</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select 
                value={countryFilter} 
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              <select 
                value={eventTypeFilter} 
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Event Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select 
                value={threatLevelFilter} 
                onChange={(e) => setThreatLevelFilter(e.target.value)}
                className="bg-tactical-bg border border-tactical-border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Threat Levels</option>
                {threatLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setCountryFilter('all');
                  setEventTypeFilter('all');
                  setThreatLevelFilter('all');
                }}
                className="px-4 py-2 bg-tactical-border hover:bg-tactical-border/80 text-tactical-text rounded text-sm font-mono"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length > 0 ? (
          <div className="tactical-panel max-h-[70vh] overflow-y-auto">
            <div className="divide-y divide-tactical-border">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-tactical-border/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getEventTypeIcon(event.event_type)}
                      <span className={`px-2 py-1 rounded text-xs font-mono border ${getThreatLevelStyling(event.threat_level)}`}>
                        {event.threat_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-tactical-muted font-mono">
                        {event.confidence}% confidence
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-tactical-muted">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(event.processed_at)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-tactical-text mb-2">
                    <a
                      href={event.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neon-400 transition-colors flex items-start space-x-2"
                    >
                      <span className="flex-1">{event.article_title}</span>
                      <ExternalLink className="h-4 w-4 text-tactical-muted flex-shrink-0 mt-0.5" />
                    </a>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-tactical-muted">Location:</span>
                      <p className="text-tactical-text font-mono">
                        {event.country}{event.region && `, ${event.region}`}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-tactical-muted">Event Type:</span>
                      <p className="text-tactical-text font-mono capitalize">{event.event_type}</p>
                    </div>
                    
                    {event.casualties && (
                      <div>
                        <span className="text-tactical-muted">Casualties:</span>
                        <p className="text-red-400 font-mono font-bold">{event.casualties}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-tactical-muted">Source:</span>
                      <p className="text-tactical-text font-mono">{event.article_source}</p>
                    </div>
                  </div>

                  {event.weapons_used && event.weapons_used.length > 0 && (
                    <div className="mt-3">
                      <span className="text-tactical-muted text-sm">Weapons/Equipment:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.weapons_used.map((weapon, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-mono">
                            {weapon}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-tactical-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tactical-text mb-2">No War Events</h3>
            <p className="text-tactical-muted">
              No events match current filters or none have been processed yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}