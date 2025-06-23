import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Crosshair, 
  ExternalLink, 
  Filter,
  Clock,
  Globe
} from 'lucide-react';

const WarIntel = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: '',
    threat_level: '',
    timeWindow: '24h'
  });

  // Threat level color mapping
  const getThreatColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Fetch initial events
  useEffect(() => {
    fetchEvents();
    
    // Subscribe to real-time inserts
    const subscription = supabase
      .channel('war_events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'war_events'
      }, (payload) => {
        setEvents(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply filters when events or filters change
  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('war_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching war events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filter by country
    if (filters.country) {
      filtered = filtered.filter(event => 
        event.country?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Filter by threat level
    if (filters.threat_level) {
      filtered = filtered.filter(event => 
        event.threat_level?.toLowerCase() === filters.threat_level.toLowerCase()
      );
    }

    // Filter by time window
    if (filters.timeWindow) {
      const now = new Date();
      const cutoff = new Date(now);
      
      switch (filters.timeWindow) {
        case '1h':
          cutoff.setHours(now.getHours() - 1);
          break;
        case '6h':
          cutoff.setHours(now.getHours() - 6);
          break;
        case '24h':
          cutoff.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
      }

      filtered = filtered.filter(event => 
        new Date(event.created_at) >= cutoff
      );
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const EventCard = ({ event }) => (
    <div 
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors border-l-4"
      style={{ borderLeftColor: getThreatColor(event.threat_level).replace('bg-', '') }}
      onClick={() => setSelectedEvent(event)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getThreatColor(event.threat_level)}`}>
            {event.threat_level?.toUpperCase() || 'UNKNOWN'}
          </span>
          <span className="text-sm text-gray-400">{event.event_type}</span>
        </div>
        <span className="text-xs text-gray-500">{formatDate(event.created_at)}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>{event.country}</span>
          {event.region && <span className="text-gray-400">• {event.region}</span>}
        </div>

        {event.casualties && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-red-400" />
            <span>{event.casualties} casualties</span>
          </div>
        )}

        {event.weapons_used && (
          <div className="flex items-center gap-2 text-sm">
            <Crosshair className="w-4 h-4 text-orange-400" />
            <span>{event.weapons_used}</span>
          </div>
        )}

        {event.coordinates && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-400" />
            <span>Coordinates: {event.coordinates}</span>
          </div>
        )}

        {event.confidence && (
          <div className="text-sm text-gray-400">
            Confidence: {event.confidence}%
          </div>
        )}
      </div>
    </div>
  );

  const DetailPanel = ({ event, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">War Event Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded font-bold text-white ${getThreatColor(event.threat_level)}`}>
              {event.threat_level?.toUpperCase() || 'UNKNOWN'}
            </span>
            <span className="text-lg font-semibold text-white">{event.event_type}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Location</label>
              <p className="text-white">{event.country}{event.region && `, ${event.region}`}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Time</label>
              <p className="text-white">{formatDate(event.created_at)}</p>
            </div>
          </div>

          {event.casualties && (
            <div>
              <label className="text-sm text-gray-400">Casualties</label>
              <p className="text-white">{event.casualties}</p>
            </div>
          )}

          {event.weapons_used && (
            <div>
              <label className="text-sm text-gray-400">Weapons Used</label>
              <p className="text-white">{event.weapons_used}</p>
            </div>
          )}

          {event.coordinates && (
            <div>
              <label className="text-sm text-gray-400">Coordinates</label>
              <p className="text-white">{event.coordinates}</p>
            </div>
          )}

          {event.confidence && (
            <div>
              <label className="text-sm text-gray-400">Confidence Level</label>
              <p className="text-white">{event.confidence}%</p>
            </div>
          )}

          {event.original_article_link && (
            <div>
              <label className="text-sm text-gray-400">Source</label>
              <a 
                href={event.original_article_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                View Original Article <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          War Intel Dashboard
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          Live Updates Active
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" />
          <span className="font-semibold">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Country</label>
            <input
              type="text"
              placeholder="Filter by country..."
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Threat Level</label>
            <select
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              value={filters.threat_level}
              onChange={(e) => setFilters(prev => ({ ...prev, threat_level: e.target.value }))}
            >
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Time Window</label>
            <select
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              value={filters.timeWindow}
              onChange={(e) => setFilters(prev => ({ ...prev, timeWindow: e.target.value }))}
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading war events...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Showing {filteredEvents.length} events
          </p>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No events found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {selectedEvent && (
        <DetailPanel 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};

export default WarIntel;