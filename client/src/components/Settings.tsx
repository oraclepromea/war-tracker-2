import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Database, 
  Bell, 
  Key, 
  Wifi,
  Save,
  RotateCcw
} from 'lucide-react';

export function Settings() {
  const [theme, setTheme] = useState('neon-green');
  const [panelOpacity, setPanelOpacity] = useState(90);
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('sk-****************************');

  const themes = [
    { id: 'neon-green', name: 'Neon Green', color: 'bg-neon-400' },
    { id: 'neon-blue', name: 'Neon Blue', color: 'bg-blue-400' },
    { id: 'neon-purple', name: 'Neon Purple', color: 'bg-purple-400' },
    { id: 'neon-red', name: 'Neon Red', color: 'bg-red-400' }
  ];

  const dataSources = [
    { id: 'reuters', name: 'Reuters API', status: 'connected', lastSync: '2 min ago' },
    { id: 'ap', name: 'Associated Press', status: 'connected', lastSync: '5 min ago' },
    { id: 'bbc', name: 'BBC News API', status: 'error', lastSync: '1 hour ago' },
    { id: 'telegram', name: 'Telegram Channels', status: 'connected', lastSync: '30 sec ago' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-tactical font-bold text-neon-400">
        System Settings
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Theme & Display</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-mono text-tactical-muted mb-3 block">
                NEON PALETTE
              </label>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    className={`tactical-panel p-3 rounded transition-all flex items-center space-x-3 ${
                      theme === themeOption.id ? 'border border-neon-400' : 'hover:bg-tactical-bg'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${themeOption.color}`} />
                    <span className="text-sm text-tactical-text">{themeOption.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-mono text-tactical-muted mb-3 block">
                PANEL OPACITY: {panelOpacity}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={panelOpacity}
                onChange={(e) => setPanelOpacity(Number(e.target.value))}
                className="w-full h-2 bg-tactical-border rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="tactical-panel p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tactical-text">HUD Scanlines</div>
                  <div className="text-xs text-tactical-muted">Enable tactical overlay effects</div>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSources.map((source) => (
              <div key={source.id} className="tactical-panel p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      source.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className="text-sm text-tactical-text">{source.name}</span>
                  </div>
                  <span className={`text-xs font-mono ${
                    source.status === 'connected' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {source.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-tactical-muted">
                  Last sync: {source.lastSync}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="tactical-panel p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tactical-text">Real-time Alerts</div>
                  <div className="text-xs text-tactical-muted">Get notified of new events</div>
                </div>
                <Button 
                  variant={notifications ? "neon" : "outline"} 
                  size="sm"
                  onClick={() => setNotifications(!notifications)}
                >
                  {notifications ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            <div className="tactical-panel p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tactical-text">Critical Events</div>
                  <div className="text-xs text-tactical-muted">High priority notifications</div>
                </div>
                <Button variant="neon" size="sm">
                  ON
                </Button>
              </div>
            </div>

            <div className="tactical-panel p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tactical-text">System Status</div>
                  <div className="text-xs text-tactical-muted">API and data alerts</div>
                </div>
                <Button variant="outline" size="sm">
                  OFF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-mono text-tactical-muted mb-2 block">
                NEWS API KEY
              </label>
              <div className="tactical-panel p-3 rounded">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-transparent text-tactical-text text-sm font-mono outline-none"
                  placeholder="Enter API key..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-mono text-tactical-muted mb-2 block">
                REFRESH INTERVAL
              </label>
              <select className="w-full tactical-panel p-3 rounded text-tactical-text text-sm bg-transparent">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="900">15 minutes</option>
              </select>
            </div>

            <div className="tactical-panel p-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tactical-text">Auto-verify Sources</div>
                  <div className="text-xs text-tactical-muted">Cross-reference multiple sources</div>
                </div>
                <Button variant="neon" size="sm">
                  ON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between tactical-panel p-4 rounded">
        <div className="flex items-center space-x-2 text-sm text-tactical-muted">
          <Wifi className="h-4 w-4" />
          <span>System Online • Last updated 30 seconds ago</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="neon" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}