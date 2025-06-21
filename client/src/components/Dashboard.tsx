import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Clock,
  Target,
  Shield
} from 'lucide-react';

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mockStats = {
    totalEvents: 1247,
    activeThreats: 23,
    totalCasualties: 8432,
    onlineAnalysts: 12
  };

  const mockRecentEvents = [
    {
      id: 1,
      title: "Air Strike in Gaza City",
      location: "Gaza Strip",
      severity: "critical",
      time: "2 min ago",
      casualties: 15
    },
    {
      id: 2,
      title: "Rocket Interception",
      location: "Tel Aviv",
      severity: "high", 
      time: "5 min ago",
      casualties: 0
    },
    {
      id: 3,
      title: "Ground Operation",
      location: "Khan Yunis",
      severity: "medium",
      time: "12 min ago", 
      casualties: 8
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400/50';
      case 'high': return 'text-orange-400 border-orange-400/50';
      case 'medium': return 'text-yellow-400 border-yellow-400/50';
      default: return 'text-green-400 border-green-400/50';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-tactical font-bold text-neon-400 neon-glow">
            WAR TRACKER 2.0
          </h1>
          <p className="text-tactical-muted font-mono text-sm">
            Real-time Conflict Intelligence Dashboard
          </p>
        </div>
        <div className="text-right">
          <div className="text-neon-400 font-mono text-xl">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-tactical-muted font-mono text-sm">
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="neon-border rounded-lg p-4 bg-tactical-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-mono text-sm">SYSTEM OPERATIONAL</span>
            </div>
            <div className="text-tactical-muted font-mono text-sm">
              Last Update: {currentTime.toLocaleTimeString()}
            </div>
          </div>
          <div className="text-neon-400 font-mono text-sm">
            {mockStats.onlineAnalysts} Analysts Online
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tactical-muted">
              TOTAL EVENTS
            </CardTitle>
            <Activity className="h-4 w-4 text-neon-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tactical text-neon-400">
              {mockStats.totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-tactical-muted">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tactical-muted">
              ACTIVE THREATS
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tactical text-red-400">
              {mockStats.activeThreats}
            </div>
            <p className="text-xs text-tactical-muted">High priority incidents</p>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tactical-muted">
              CASUALTIES
            </CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tactical text-orange-400">
              {mockStats.totalCasualties.toLocaleString()}
            </div>
            <p className="text-xs text-tactical-muted">Total confirmed</p>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-tactical-muted">
              THREAT LEVEL
            </CardTitle>
            <Shield className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-tactical text-yellow-400">ELEVATED</div>
            <p className="text-xs text-tactical-muted">Regional assessment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events & Threat Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-neon-400" />
              <span className="text-neon-400">RECENT EVENTS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentEvents.map((event) => (
                <div
                  key={event.id}
                  className={`tactical-panel p-3 rounded border-l-4 ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-tactical-text font-medium">{event.title}</div>
                    <div className="flex items-center space-x-2 text-xs text-tactical-muted">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-tactical-muted" />
                      <span className="text-sm text-tactical-muted">{event.location}</span>
                    </div>
                    {event.casualties > 0 && (
                      <div className="text-sm text-red-400">{event.casualties} casualties</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-neon-400" />
              <span className="text-neon-400">THREAT ASSESSMENT</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  OVERALL THREAT LEVEL
                </div>
                <div className="text-yellow-400 font-tactical text-lg">ELEVATED</div>
              </div>
              
              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-1">
                  ACTIVITY TREND
                </div>
                <div className="text-red-400 font-tactical text-lg">INCREASING</div>
              </div>

              <div className="tactical-panel p-3 rounded">
                <div className="text-tactical-muted text-xs font-mono mb-2">
                  REGIONAL STATUS
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-tactical-text">Gaza Strip</span>
                    <span className="text-red-400 text-sm">CRITICAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-tactical-text">West Bank</span>
                    <span className="text-yellow-400 text-sm">ELEVATED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-tactical-text">Lebanon</span>
                    <span className="text-orange-400 text-sm">HIGH</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}