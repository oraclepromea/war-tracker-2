import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WarEvent {
  id: string;
  event_type: string;
  country: string;
  region: string;
  casualties: number;
  weapons_used: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence: number;
  threat_level: string;
  article_link: string;
  article_title: string;
  summary: string;
  created_at: string;
  event_date: string;
}

export default function WarEvents() {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: '',
    threat_level: '',
    timeWindow: '7d'
  });

  useEffect(() => {
    fetchWarEvents();
    
    // Subscribe to real-time war event updates
    const subscription = supabase
      .channel('war_events_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'war_events' },
        (payload) => {
          console.log('New war event detected:', payload.new);
          setEvents(prev => [payload.new as WarEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchWarEvents();
  }, [filters]);

  const fetchWarEvents = async () => {
    setLoading(true);
    
    let query = supabase
      .from('war_events')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.country) {
      query = query.ilike('country', `%${filters.country}%`);
    }
    
    if (filters.threat_level) {
      query = query.eq('threat_level', filters.threat_level);
    }

    // Time window filter
    const timeWindow = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      'all': null
    }[filters.timeWindow];

    if (timeWindow) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    const { data, error } = await query.limit(100);
    
    if (data && !error) {
      setEvents(data);
    } else if (error) {
      console.error('Error fetching war events:', error);
    }
    
    setLoading(false);
  };

  const getThreatLevelColor = (threatLevel: string) => {
    const colors = {
      'critical': 'bg-red-600 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-black',
      'low': 'bg-green-500 text-white',
      'minimal': 'bg-gray-400 text-white'
    };
    return colors[threatLevel as keyof typeof colors] || 'bg-gray-400 text-white';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEventTypeIcon = (eventType: string) => {
    const icons = {
      'airstrike': '✈️',
      'ground_assault': '🏭',
      'naval_operation': '🚢',
      'missile_attack': '🚀',
      'bombing': '💥',
      'diplomatic': '🏛️',
      'cyber_attack': '💻',
      'unknown': '❓'
    };
    return icons[eventType as keyof typeof icons] || '⚡';
  };

  const openMapLocation = (coordinates: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    window.open(url, '_blank');
  };

  const uniqueCountries = [...new Set(events.map(e => e.country))].filter(Boolean);

  return (
    <div className="flex h-full">
      {/* Main Events List */}
      <div className="flex-1 space-y-6 pr-6">
        {/* Header & Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">War Intelligence Dashboard</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Monitoring Active</span>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={filters.threat_level}
              onChange={(e) => setFilters(prev => ({ ...prev, threat_level: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Threat Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="minimal">Minimal</option>
            </select>

            <select
              value={filters.timeWindow}
              onChange={(e) => setFilters(prev => ({ ...prev, timeWindow: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {events.length} war events detected
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading war events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-600">No war events found with current filters</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-red-500"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {event.event_type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-600">{event.country}, {event.region}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getThreatLevelColor(event.threat_level)}`}>
                      {event.threat_level.toUpperCase()}
                    </span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Casualties</p>
                      <p className="text-lg font-semibold text-red-600">
                        {event.casualties ? event.casualties.toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Confidence</p>
                      <p className={`text-lg font-semibold ${getConfidenceColor(event.confidence)}`}>
                        {event.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Weapons */}
                  {event.weapons_used && event.weapons_used.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Weapons Used</p>
                      <div className="flex flex-wrap gap-2">
                        {event.weapons_used.map((weapon, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                          >
                            {weapon}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {event.summary}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(event.event_date || event.created_at).toLocaleString()}</span>
                    {event.coordinates && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMapLocation(event.coordinates);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        📍 View Location
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEvent && (
        <div className="w-96 bg-white rounded-lg shadow-lg p-6 ml-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Event Details</h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Event Type & Location */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {getEventTypeIcon(selectedEvent.event_type)} {selectedEvent.event_type.replace('_', ' ').toUpperCase()}
              </h4>
              <p className="text-gray-600">{selectedEvent.country}, {selectedEvent.region}</p>
            </div>

            {/* Threat Assessment */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Threat Assessment</h4>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getThreatLevelColor(selectedEvent.threat_level)}`}>
                  {selectedEvent.threat_level.toUpperCase()}
                </span>
                <span className={`font-semibold ${getConfidenceColor(selectedEvent.confidence)}`}>
                  {selectedEvent.confidence}% Confidence
                </span>
              </div>
            </div>

            {/* Casualties */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Casualty Report</h4>
              <p className="text-2xl font-bold text-red-600">
                {selectedEvent.casualties ? selectedEvent.casualties.toLocaleString() : 'Unknown'}
              </p>
            </div>

            {/* Weapons */}
            {selectedEvent.weapons_used && selectedEvent.weapons_used.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Weapons Identified</h4>
                <div className="space-y-1">
                  {selectedEvent.weapons_used.map((weapon, index) => (
                    <span
                      key={index}
                      className="block px-3 py-2 bg-red-50 border border-red-200 rounded text-sm"
                    >
                      {weapon}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Intelligence Summary */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Intelligence Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedEvent.summary}
              </p>
            </div>

            {/* Coordinates */}
            {selectedEvent.coordinates && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Coordinates</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedEvent.coordinates.lat.toFixed(6)}, {selectedEvent.coordinates.lng.toFixed(6)}
                </p>
                <button
                  onClick={() => openMapLocation(selectedEvent.coordinates)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  📍 View on Map
                </button>
              </div>
            )}

            {/* Source Article */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Source Intelligence</h4>
              <a
                href={selectedEvent.article_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 text-sm"
              >
                <p className="font-medium text-blue-600 mb-1">
                  {selectedEvent.article_title}
                </p>
                <p className="text-gray-500 text-xs">
                  Click to view original source →
                </p>
              </a>
            </div>

            {/* Timestamp */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Event Date: {new Date(selectedEvent.event_date || selectedEvent.created_at).toLocaleString()}</p>
                <p>Detected: {new Date(selectedEvent.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}