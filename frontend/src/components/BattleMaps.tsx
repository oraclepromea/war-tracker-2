import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/index';
import { motion } from 'framer-motion';
import { 
  Map, 
  Layers, 
  Target, 
  MapPin,
  Crosshair,
  Satellite,
  Eye,
  EyeOff,
  RotateCcw,
  Maximize2
} from 'lucide-react';

interface MapEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  source: string;
  verified: boolean;
  casualties?: number;
}

interface MapLayer {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  events: MapEvent[];
}

export function BattleMaps() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.5, 35.0]); // Gaza/Israel region
  const [zoomLevel, setZoomLevel] = useState(8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([]);
  const [activeFilters] = useState<string[]>(['all']);
  const [mapStyle, setMapStyle] = useState<'tactical' | 'satellite' | 'terrain'>('tactical');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate realistic military events with coordinates
  const generateMapEvents = (): MapEvent[] => {
    const now = new Date();
    const regions = [
      // Gaza Strip region
      { name: 'Gaza Strip', center: [31.5, 34.5], radius: 0.3 },
      { name: 'West Bank', center: [32.0, 35.2], radius: 0.5 },
      // Ukraine conflict zones
      { name: 'Donetsk', center: [48.0, 37.8], radius: 0.8 },
      { name: 'Kharkiv', center: [49.9, 36.2], radius: 0.6 },
      { name: 'Zaporizhzhia', center: [47.8, 35.1], radius: 0.7 },
      // Lebanon
      { name: 'Southern Lebanon', center: [33.3, 35.4], radius: 0.4 },
    ];

    const eventTypes = ['airstrike', 'artillery', 'missile_strike', 'ground_assault', 'drone_attack'];
    const sources = ['IDF', 'Ukrainian Armed Forces', 'Reuters', 'BBC', 'Local Observers'];

    return Array.from({ length: 150 }, (_, i) => {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * region.radius;
      
      const lat = region.center[0] + distance * Math.cos(angle);
      const lng = region.center[1] + distance * Math.sin(angle);
      
      const hoursAgo = Math.floor(Math.random() * 48);
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severity = ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as MapEvent['severity'];

      return {
        id: `map-event-${i}`,
        title: `${eventType.replace('_', ' ')} in ${region.name}`,
        description: `Military activity reported at coordinates ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
        timestamp: timestamp.toISOString(),
        location: region.name,
        coordinates: [lat, lng] as [number, number],
        severity,
        type: eventType,
        source: sources[Math.floor(Math.random() * sources.length)],
        verified: Math.random() > 0.2,
        casualties: severity === 'critical' || severity === 'high' ? Math.floor(Math.random() * 20) + 1 : undefined
      };
    });
  };

  // Initialize map layers
  useEffect(() => {
    const events = generateMapEvents();
    
    const layers: MapLayer[] = [
      {
        id: 'airstrikes',
        name: 'Airstrikes',
        enabled: true,
        color: '#ef4444',
        events: events.filter(e => e.type === 'airstrike')
      },
      {
        id: 'artillery',
        name: 'Artillery',
        enabled: true,
        color: '#f97316',
        events: events.filter(e => e.type === 'artillery')
      },
      {
        id: 'missiles',
        name: 'Missile Strikes',
        enabled: true,
        color: '#8b5cf6',
        events: events.filter(e => e.type === 'missile_strike')
      },
      {
        id: 'ground',
        name: 'Ground Operations',
        enabled: true,
        color: '#22c55e',
        events: events.filter(e => e.type === 'ground_assault')
      },
      {
        id: 'drones',
        name: 'Drone Attacks',
        enabled: true,
        color: '#06b6d4',
        events: events.filter(e => e.type === 'drone_attack')
      }
    ];

    setMapLayers(layers);
  }, []);

  const getSeverityColor = (severity: MapEvent['severity']) => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a'
    };
    return colors[severity];
  };

  const getSeveritySize = (severity: MapEvent['severity']) => {
    const sizes = {
      critical: 16,
      high: 12,
      medium: 8,
      low: 6
    };
    return sizes[severity];
  };

  const toggleLayer = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    ));
  };

  const getVisibleEvents = () => {
    return mapLayers
      .filter(layer => layer.enabled)
      .flatMap(layer => layer.events)
      .filter(event => 
        activeFilters.includes('all') || 
        activeFilters.includes(event.severity) ||
        activeFilters.includes(event.type)
      );
  };

  const focusOnRegion = (coords: [number, number]) => {
    setMapCenter(coords);
    setZoomLevel(10);
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    return `${hours}h ago`;
  };

  const visibleEvents = getVisibleEvents();

  // Map background styles based on selected style
  const getMapBackground = () => {
    const baseStyle = "absolute inset-0 transition-all duration-500";
    
    switch (mapStyle) {
      case 'satellite':
        return (
          <div className={baseStyle}>
            {/* Real satellite imagery style background */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${Math.floor((mapCenter[0] + 85.05112878) / 180 * Math.pow(2, zoomLevel))}/${Math.floor((1 - Math.log(Math.tan(mapCenter[0] * Math.PI / 180) + 1 / Math.cos(mapCenter[0] * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoomLevel))}')`,
                filter: 'contrast(1.1) brightness(0.9)',
                transform: `scale(${1 + (zoomLevel - 8) * 0.1})`
              }}
            />
            {/* Satellite overlay with realistic effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />
            </div>
            {/* Satellite metadata overlay */}
            <div className="absolute top-4 left-4 tactical-panel p-2 rounded bg-black/80">
              <div className="text-xs text-green-300 font-mono">SATELLITE VIEW</div>
              <div className="text-xs text-tactical-muted font-mono">RES: {Math.pow(2, Math.max(0, 15-zoomLevel)).toFixed(1)}M</div>
              <div className="text-xs text-tactical-muted font-mono">ALT: {(zoomLevel * 50)}KM</div>
            </div>
          </div>
        );
      
      case 'terrain':
        return (
          <div className={baseStyle}>
            {/* Enhanced topographical terrain */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-green-900/30 to-slate-800/40" />
            <div className="absolute inset-0 opacity-30" style={{ transform: `scale(${1 + (zoomLevel - 8) * 0.1})` }}>
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="terrain" width="150" height="150" patternUnits="userSpaceOnUse">
                    <rect width="150" height="150" fill="#2a4a3a"/>
                    <path d="M0,75 Q37.5,45 75,75 T150,75" stroke="#4a6741" strokeWidth="2" fill="none" opacity="0.6"/>
                    <path d="M0,100 Q37.5,70 75,100 T150,100" stroke="#5a7751" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    <path d="M0,125 Q37.5,95 75,125 T150,125" stroke="#3a5731" strokeWidth="1" fill="none" opacity="0.4"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#terrain)" />
              </svg>
            </div>
            {/* Elevation contours scaled with zoom */}
            <div className="absolute inset-0 opacity-20" style={{ transform: `scale(${1 + (zoomLevel - 8) * 0.15})` }}>
              <svg width="100%" height="100%">
                {Array.from({ length: Math.floor(zoomLevel) }, (_, i) => (
                  <circle
                    key={i}
                    cx={`${20 + i * 8}%`}
                    cy={`${30 + i * 4}%`}
                    r={`${10 + i * 5}`}
                    fill="none"
                    stroke="#8b5a2b"
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                ))}
              </svg>
            </div>
            <div className="absolute top-4 left-4 text-xs text-amber-300 font-mono opacity-70">
              TERRAIN VIEW • ELEVATION DATA • ZOOM: {zoomLevel}x
            </div>
          </div>
        );
      
      default: // tactical
        return (
          <div className={baseStyle}>
            {/* Tactical grid with zoom-responsive detail */}
            <div className="absolute inset-0 bg-tactical-bg" />
            <div className="absolute inset-0 opacity-30" style={{ transform: `scale(${1 + (zoomLevel - 8) * 0.1})` }}>
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="tactical-grid" width={50 / (zoomLevel * 0.1)} height={50 / (zoomLevel * 0.1)} patternUnits="userSpaceOnUse">
                    <path d={`M ${50 / (zoomLevel * 0.1)} 0 L 0 0 0 ${50 / (zoomLevel * 0.1)}`} fill="none" stroke="#22c55e" strokeWidth="0.5"/>
                    <circle cx={25 / (zoomLevel * 0.1)} cy={25 / (zoomLevel * 0.1)} r="1" fill="#22c55e" opacity="0.3"/>
                  </pattern>
                  <pattern id="tactical-major" width={200 / (zoomLevel * 0.05)} height={200 / (zoomLevel * 0.05)} patternUnits="userSpaceOnUse">
                    <path d={`M ${200 / (zoomLevel * 0.05)} 0 L 0 0 0 ${200 / (zoomLevel * 0.05)}`} fill="none" stroke="#22c55e" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tactical-grid)" />
                <rect width="100%" height="100%" fill="url(#tactical-major)" />
              </svg>
            </div>
            <div className="absolute top-4 left-4 text-xs text-green-300 font-mono opacity-70">
              TACTICAL GRID • MILITARY OVERLAY • ZOOM: {zoomLevel}x
            </div>
          </div>
        );
    }
  };

  // Enhanced reference points and landmarks
  const renderReferencePoints = () => {
    const referencePoints = [
      // Middle East region
      { name: 'Gaza City', coords: [31.5, 34.47], type: 'city' },
      { name: 'Tel Aviv', coords: [32.08, 34.78], type: 'city' },
      { name: 'Beirut', coords: [33.89, 35.50], type: 'city' },
      { name: 'Damascus', coords: [33.51, 36.29], type: 'city' },
      // Ukraine region  
      { name: 'Kyiv', coords: [50.45, 30.52], type: 'capital' },
      { name: 'Kharkiv', coords: [49.99, 36.23], type: 'city' },
      { name: 'Donetsk', coords: [48.01, 37.80], type: 'city' },
      { name: 'Mariupol', coords: [47.10, 37.54], type: 'city' },
    ];

    return referencePoints.map(point => {
      const x = ((point.coords[1] - (mapCenter[1] - 5)) / 10) * 100;
      const y = (((mapCenter[0] + 3) - point.coords[0]) / 6) * 100;
      
      if (x < -10 || x > 110 || y < -10 || y > 110) return null;

      return (
        <div
          key={point.name}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 ${
              point.type === 'capital' ? 'bg-yellow-400' : 'bg-blue-400'
            } rounded-full border border-white/50`} />
            <span className="text-xs text-white/80 font-mono whitespace-nowrap bg-black/50 px-1 rounded">
              {point.name}
            </span>
          </div>
        </div>
      );
    });
  };

  // Enhanced coordinate grid overlay with zoom responsiveness
  const renderCoordinateGrid = () => {
    if (mapStyle !== 'tactical') return null;

    const gridLines = [];
    const stepLat = Math.max(0.1, 1 / zoomLevel); // Adaptive grid density
    const stepLng = Math.max(0.1, 1 / zoomLevel);
    
    // Calculate visible grid bounds
    const viewRange = 6 / zoomLevel;
    const minLat = mapCenter[0] - viewRange/2;
    const maxLat = mapCenter[0] + viewRange/2;
    const minLng = mapCenter[1] - viewRange/2;
    const maxLng = mapCenter[1] + viewRange/2;

    // Latitude lines (horizontal)
    for (let lat = Math.floor(minLat/stepLat)*stepLat; lat <= Math.ceil(maxLat/stepLat)*stepLat; lat += stepLat) {
      const y = ((mapCenter[0] + viewRange/2 - lat) / viewRange) * 100;
      if (y >= 0 && y <= 100) {
        gridLines.push(
          <g key={`lat-${lat}`}>
            <line x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#22c55e" strokeWidth="0.5" opacity="0.6" />
            <text x="2%" y={`${y}%`} fill="#22c55e" fontSize={Math.min(10, 6 + zoomLevel)} opacity="0.8" dy="-2">
              {lat.toFixed(2)}°N
            </text>
          </g>
        );
      }
    }

    // Longitude lines (vertical)
    for (let lng = Math.floor(minLng/stepLng)*stepLng; lng <= Math.ceil(maxLng/stepLng)*stepLng; lng += stepLng) {
      const x = ((lng - (mapCenter[1] - viewRange/2)) / viewRange) * 100;
      if (x >= 0 && x <= 100) {
        gridLines.push(
          <g key={`lng-${lng}`}>
            <line x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" stroke="#22c55e" strokeWidth="0.5" opacity="0.6" />
            <text x={`${x}%`} y="98%" fill="#22c55e" fontSize={Math.min(10, 6 + zoomLevel)} opacity="0.8" dx="2">
              {lng.toFixed(2)}°E
            </text>
          </g>
        );
      }
    }

    return (
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {gridLines}
      </svg>
    );
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev + 1 : prev - 1;
      return Math.max(1, Math.min(18, newZoom));
    });
  };

  // Mouse/touch interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Convert pixel movement to coordinate movement
      const sensitivity = 0.001 * (1 / zoomLevel);
      setMapCenter(prev => [
        prev[0] + deltaY * sensitivity,
        prev[1] - deltaX * sensitivity
      ]);
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 'out' : 'in';
    handleZoom(direction);
  };

  return (
    <div className={`space-y-6 p-6 max-w-full mx-auto ${isFullscreen ? 'fixed inset-0 z-50 bg-tactical-bg' : 'max-w-7xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-tactical font-bold text-neon-400">
            Battle Maps - Tactical Overview
          </h1>
          <p className="text-tactical-muted mt-2">
            Real-time military operations visualization • {visibleEvents.length} active events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset View
          </Button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="space-y-4">
          {/* Map Style */}
          <Card className="neon-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Map Style</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { id: 'tactical', name: 'Tactical', icon: Target },
                { id: 'satellite', name: 'Satellite', icon: Satellite },
                { id: 'terrain', name: 'Terrain', icon: Map }
              ].map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMapStyle(id as any)}
                  className={`w-full tactical-panel p-2 rounded flex items-center space-x-2 transition-all ${
                    mapStyle === id ? 'border border-neon-400 bg-neon-950/30' : 'hover:bg-tactical-bg'
                  }`}
                >
                  <Icon className="h-4 w-4 text-neon-400" />
                  <span className="text-sm text-tactical-text">{name}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card className="neon-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Event Layers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mapLayers.map(layer => (
                <div key={layer.id} className="tactical-panel p-2 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-sm text-tactical-text">{layer.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {layer.events.length}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className="text-tactical-muted hover:text-neon-400"
                    >
                      {layer.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Regions */}
          <Card className="neon-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Quick Navigation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Gaza Strip', coords: [31.5, 34.5] as [number, number] },
                { name: 'West Bank', coords: [32.0, 35.2] as [number, number] },
                { name: 'Donetsk', coords: [48.0, 37.8] as [number, number] },
                { name: 'Kharkiv', coords: [49.9, 36.2] as [number, number] },
                { name: 'Lebanon', coords: [33.3, 35.4] as [number, number] }
              ].map(region => (
                <button
                  key={region.name}
                  onClick={() => focusOnRegion(region.coords)}
                  className="w-full tactical-panel p-2 rounded text-left hover:bg-tactical-bg transition-all"
                >
                  <span className="text-sm text-tactical-text">{region.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-neon-400" />
                  <span>Tactical Map Display</span>
                </div>
                <div className="text-xs text-tactical-muted font-mono">
                  {mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)} • Zoom: {zoomLevel}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                ref={mapRef}
                className={`relative bg-tactical-bg rounded-lg overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Map Background */}
                {getMapBackground()}

                {/* Coordinate Grid (tactical mode only) */}
                {renderCoordinateGrid()}

                {/* Reference Points */}
                {renderReferencePoints()}

                {/* Map Events */}
                <div className="absolute inset-0">
                  {visibleEvents.map(event => {
                    // Convert coordinates to screen position with zoom consideration
                    const viewRange = 6 / zoomLevel;
                    const x = ((event.coordinates[1] - (mapCenter[1] - viewRange/2)) / viewRange) * 100;
                    const y = (((mapCenter[0] + viewRange/2) - event.coordinates[0]) / viewRange) * 100;
                    
                    if (x < -5 || x > 105 || y < -5 || y > 105) return null;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute cursor-pointer pointer-events-auto"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        <div
                          className={`rounded-full border-2 animate-pulse ${
                            selectedEvent?.id === event.id 
                              ? 'border-white shadow-lg shadow-neon-400/50' 
                              : 'border-white/50'
                          }`}
                          style={{
                            backgroundColor: getSeverityColor(event.severity),
                            width: Math.max(6, getSeveritySize(event.severity) * (zoomLevel / 8)),
                            height: Math.max(6, getSeveritySize(event.severity) * (zoomLevel / 8))
                          }}
                        />
                        {event.severity === 'critical' && (
                          <div className="absolute -inset-2 border border-red-500 rounded-full animate-ping" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Zoom Controls */}
                <div className="absolute top-4 right-20 flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('in')}
                    disabled={zoomLevel >= 18}
                    className="w-8 h-8 p-0"
                  >
                    +
                  </Button>
                  <div className="tactical-panel px-2 py-1 text-xs text-center font-mono">
                    {zoomLevel}x
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoom('out')}
                    disabled={zoomLevel <= 1}
                    className="w-8 h-8 p-0"
                  >
                    -
                  </Button>
                </div>

                {/* Enhanced Map Legend */}
                <div className="absolute bottom-4 left-4 tactical-panel p-3 rounded">
                  <div className="text-xs text-tactical-muted font-mono mb-2">THREAT LEVELS</div>
                  <div className="space-y-1">
                    {[
                      { severity: 'critical', label: 'CRITICAL', color: '#dc2626' },
                      { severity: 'high', label: 'HIGH', color: '#ea580c' },
                      { severity: 'medium', label: 'MEDIUM', color: '#ca8a04' },
                      { severity: 'low', label: 'LOW', color: '#16a34a' }
                    ].map(({ severity, label, color }) => (
                      <div key={severity} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-tactical-text">{label}</span>
                      </div>
                    ))}
                  </div>
                  {mapStyle === 'tactical' && (
                    <div className="mt-3 pt-2 border-t border-tactical-border">
                      <div className="text-xs text-tactical-muted font-mono mb-1">GRID SYSTEM</div>
                      <div className="text-xs text-green-400">MGRS/UTM Coordinates</div>
                    </div>
                  )}
                </div>

                {/* Enhanced Coordinates Display */}
                <div className="absolute top-4 right-4 tactical-panel p-3 rounded">
                  <div className="text-xs text-tactical-muted font-mono mb-1">POSITION</div>
                  <div className="text-xs text-tactical-muted font-mono">
                    LAT: {mapCenter[0].toFixed(4)}°
                  </div>
                  <div className="text-xs text-tactical-muted font-mono">
                    LNG: {mapCenter[1].toFixed(4)}°
                  </div>
                  <div className="text-xs text-tactical-muted font-mono mt-2">
                    ZOOM: {zoomLevel}x
                  </div>
                  <div className="text-xs text-neon-400 font-mono mt-1">
                    {mapStyle.toUpperCase()} MODE
                  </div>
                </div>

                {/* Scale indicator */}
                <div className="absolute bottom-4 right-4 tactical-panel p-2 rounded">
                  <div className="text-xs text-tactical-muted font-mono mb-1">SCALE</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-1 bg-neon-400" />
                    <span className="text-xs text-neon-400 font-mono">10km</span>
                  </div>
                </div>

                {/* ...existing code... */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <div>
          <Card className="neon-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Event Intelligence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">OPERATION TYPE</div>
                    <div className="text-neon-400 font-tactical uppercase">
                      {selectedEvent.type.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">THREAT LEVEL</div>
                    <div 
                      className="font-tactical uppercase"
                      style={{ color: getSeverityColor(selectedEvent.severity) }}
                    >
                      {selectedEvent.severity}
                    </div>
                  </div>

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">COORDINATES</div>
                    <div className="text-tactical-text text-sm font-mono">
                      {selectedEvent.coordinates[0].toFixed(4)}, {selectedEvent.coordinates[1].toFixed(4)}
                    </div>
                  </div>

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">TIME STAMP</div>
                    <div className="text-tactical-text text-sm font-mono">
                      {formatTimeAgo(selectedEvent.timestamp)}
                    </div>
                  </div>

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">LOCATION</div>
                    <div className="text-tactical-text text-sm">
                      {selectedEvent.location}
                    </div>
                  </div>

                  {selectedEvent.casualties && (
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">CASUALTIES</div>
                      <div className="text-red-400 font-tactical">
                        {selectedEvent.casualties} confirmed
                      </div>
                    </div>
                  )}

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">SOURCE</div>
                    <div className="text-tactical-text text-sm">
                      {selectedEvent.source}
                    </div>
                  </div>

                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">STATUS</div>
                    <Badge 
                      variant={selectedEvent.verified ? "default" : "outline"}
                      className={selectedEvent.verified ? "text-green-400 border-green-400" : "text-yellow-400 border-yellow-400"}
                    >
                      {selectedEvent.verified ? 'VERIFIED' : 'UNCONFIRMED'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center text-tactical-muted py-8">
                  <Crosshair className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select an event on the map</p>
                  <p className="text-xs">Click any marker for details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <div className="tactical-panel p-4 rounded neon-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-mono text-sm font-bold">TACTICAL MAP ONLINE</span>
            </div>
            <div className="text-tactical-muted text-sm">
              Events: <span className="text-neon-400">{visibleEvents.length} visible</span>
            </div>
            <div className="text-tactical-muted text-sm">
              Coverage: <span className="text-neon-400">Gaza • Ukraine • Lebanon</span>
            </div>
          </div>
          <div className="text-tactical-muted text-xs font-mono">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}