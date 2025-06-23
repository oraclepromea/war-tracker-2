import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

// Types
interface WarEvent {
  id: string
  event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic'
  country: string
  region: string | null
  latitude: number | null
  longitude: number | null
  casualties: number | null
  weapons_used: string[] | null
  source_country: string | null
  target_country: string | null
  confidence: number
  threat_level: 'low' | 'medium' | 'high' | 'critical'
  article_id: string
  article_title: string
  article_url: string
  processed_at: string
  timestamp: string
}

interface Filters {
  country: string
  threat_level: string
  time_window: string
  event_type: string
}

const WarNews: React.FC = () => {
  const [events, setEvents] = useState<WarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<WarEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    country: '',
    threat_level: '',
    time_window: '24h',
    event_type: ''
  })
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  // Threat level colors
  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white border-red-600'
      case 'high': return 'bg-orange-500 text-white border-orange-600'
      case 'medium': return 'bg-yellow-500 text-black border-yellow-600'
      case 'low': return 'bg-green-500 text-white border-green-600'
      default: return 'bg-gray-500 text-white border-gray-600'
    }
  }

  // Event type icons
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'airstrike': return '✈️'
      case 'humanitarian': return '🏥'
      case 'cyberattack': return '💻'
      case 'diplomatic': return '🤝'
      default: return '⚡'
    }
  }

  // Fetch war events with filters
  const fetchEvents = async () => {
    try {
      setError(null)
      let query = supabase
        .from('war_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      // Apply time window filter
      if (filters.time_window) {
        const timeMap: { [key: string]: number } = {
          '1h': 1,
          '6h': 6,
          '24h': 24,
          '7d': 168,
          '30d': 720
        }
        const hoursAgo = timeMap[filters.time_window] || 24
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
        query = query.gte('timestamp', cutoffTime)
      }

      // Apply other filters
      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`)
      }
      if (filters.threat_level) {
        query = query.eq('threat_level', filters.threat_level)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }

      const { data, error } = await query

      if (error) throw error

      setEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isAutoRefresh) return

    const subscription = supabase
      .channel('war_events_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'war_events'
        },
        (payload) => {
          console.log('New war event:', payload.new)
          setEvents(prev => [payload.new as WarEvent, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isAutoRefresh])

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchEvents()
  }, [filters])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [isAutoRefresh, filters])

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Format coordinates
  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return 'Unknown location'
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">War Intel Dashboard</h1>
              <p className="text-gray-400 mt-1">Live analysis of global conflict events</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isAutoRefresh 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {isAutoRefresh ? '🔄 Live' : '⏸️ Paused'}
                </button>
                <button
                  onClick={fetchEvents}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? '⏳' : '🔄'} Refresh
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {events.length} events
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              {/* Time Window */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Window
                </label>
                <select
                  value={filters.time_window}
                  onChange={(e) => handleFilterChange('time_window', e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="1h">Last Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Country */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="Enter country name..."
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                />
              </div>

              {/* Threat Level */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Threat Level
                </label>
                <select
                  value={filters.threat_level}
                  onChange={(e) => handleFilterChange('threat_level', e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Event Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={filters.event_type}
                  onChange={(e) => handleFilterChange('event_type', e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">All Types</option>
                  <option value="airstrike">Airstrike</option>
                  <option value="humanitarian">Humanitarian</option>
                  <option value="cyberattack">Cyberattack</option>
                  <option value="diplomatic">Diplomatic</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({ country: '', threat_level: '', time_window: '24h', event_type: '' })}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {loading && events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-400">Loading war events...</p>
                </div>
              ) : error ? (
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300">Error: {error}</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No events found for the current filters.</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`bg-gray-800 rounded-lg p-4 border-l-4 cursor-pointer hover:bg-gray-750 transition-colors ${
                      getThreatColor(event.threat_level).split(' ')[2]
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {event.event_type.replace('_', ' ')}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {event.country}{event.region ? `, ${event.region}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatColor(event.threat_level)}`}>
                          {event.threat_level.toUpperCase()}
                        </span>
                        <p className="text-gray-400 text-xs mt-1">
                          {event.confidence}% confidence
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Casualties:</p>
                        <p className="text-white">{event.casualties || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Weapons:</p>
                        <p className="text-white">
                          {event.weapons_used?.join(', ') || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')} • 
                        Click for details
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 sticky top-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Event Type</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getEventIcon(selectedEvent.event_type)}</span>
                      <span className="capitalize">{selectedEvent.event_type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Location</h4>
                    <p>{selectedEvent.country}</p>
                    {selectedEvent.region && <p className="text-gray-400">{selectedEvent.region}</p>}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Coordinates</h4>
                    <p className="text-sm">
                      {formatCoordinates(selectedEvent.latitude, selectedEvent.longitude)}
                    </p>
                    {selectedEvent.latitude && selectedEvent.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedEvent.latitude},${selectedEvent.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View on Map →
                      </a>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Threat Assessment</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatColor(selectedEvent.threat_level)}`}>
                      {selectedEvent.threat_level.toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      {selectedEvent.confidence}% confidence
                    </p>
                  </div>

                  {selectedEvent.casualties && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Casualties</h4>
                      <p>{selectedEvent.casualties}</p>
                    </div>
                  )}

                  {selectedEvent.weapons_used && selectedEvent.weapons_used.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Weapons Used</h4>
                      <ul className="text-sm space-y-1">
                        {selectedEvent.weapons_used.map((weapon, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {weapon}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(selectedEvent.source_country || selectedEvent.target_country) && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-1">Parties</h4>
                      {selectedEvent.source_country && (
                        <p className="text-sm">Source: {selectedEvent.source_country}</p>
                      )}
                      {selectedEvent.target_country && (
                        <p className="text-sm">Target: {selectedEvent.target_country}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Source Article</h4>
                    <p className="text-sm text-gray-400 mb-2">{selectedEvent.article_title}</p>
                    <a
                      href={selectedEvent.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Read Original Article →
                    </a>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Processed</h4>
                    <p className="text-sm text-gray-400">
                      {format(new Date(selectedEvent.processed_at), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Select an Event</h3>
                <p className="text-gray-400 text-sm">
                  Click on any event from the list to view detailed intelligence information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarNews