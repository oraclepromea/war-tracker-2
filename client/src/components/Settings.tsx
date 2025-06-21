import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/index';
import { 
  Settings as SettingsIcon, 
  Database, 
  Bell, 
  Save,
  RotateCcw,
  Key,
  Wifi
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'webhook';
  url: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  articles?: number;
  category: string;
}

const mockDataSources: Record<string, DataSource[]> = {
  'News Feeds': [
    {
      id: 'reuters-world',
      name: 'Reuters World News',
      type: 'rss',
      url: 'https://feeds.reuters.com/reuters/worldNews',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:30:00Z',
      articles: 245,
      category: 'News Feeds'
    },
    {
      id: 'bbc-world',
      name: 'BBC World News',
      type: 'rss',
      url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:25:00Z',
      articles: 189,
      category: 'News Feeds'
    },
    {
      id: 'aljazeera',
      name: 'Al Jazeera English',
      type: 'rss',
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:28:00Z',
      articles: 156,
      category: 'News Feeds'
    },
    {
      id: 'times-israel',
      name: 'Times of Israel',
      type: 'rss',
      url: 'https://www.timesofisrael.com/feed/',
      enabled: false,
      status: 'inactive',
      lastSync: '2024-01-15T09:45:00Z',
      articles: 78,
      category: 'News Feeds'
    }
  ],
  'Military Sources': [
    {
      id: 'defense-news',
      name: 'Defense News',
      type: 'rss',
      url: 'https://www.defensenews.com/arc/outboundfeeds/rss/',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:32:00Z',
      articles: 67,
      category: 'Military Sources'
    },
    {
      id: 'jane-defense',
      name: 'Jane\'s Defense Weekly',
      type: 'api',
      url: 'https://api.janes.com/defense-weekly',
      enabled: true,
      status: 'error',
      lastSync: '2024-01-15T08:15:00Z',
      articles: 0,
      category: 'Military Sources'
    },
    {
      id: 'mil-times',
      name: 'Military Times',
      type: 'rss',
      url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:20:00Z',
      articles: 45,
      category: 'Military Sources'
    }
  ],
  'Regional Sources': [
    {
      id: 'kyiv-independent',
      name: 'Kyiv Independent',
      type: 'rss',
      url: 'https://kyivindependent.com/rss/',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:35:00Z',
      articles: 134,
      category: 'Regional Sources'
    },
    {
      id: 'haaretz',
      name: 'Haaretz English',
      type: 'rss',
      url: 'https://www.haaretz.com/cmlink/1.628752',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:22:00Z',
      articles: 92,
      category: 'Regional Sources'
    },
    {
      id: 'daily-beast-war',
      name: 'Daily Beast War',
      type: 'rss',
      url: 'https://www.thedailybeast.com/rss/war-room',
      enabled: false,
      status: 'inactive',
      lastSync: '2024-01-15T07:30:00Z',
      articles: 23,
      category: 'Regional Sources'
    },
    {
      id: 'lebanon-now',
      name: 'Lebanon Now',
      type: 'api',
      url: 'https://api.lebanon-now.com/news',
      enabled: true,
      status: 'error',
      lastSync: '2024-01-15T06:45:00Z',
      articles: 0,
      category: 'Regional Sources'
    }
  ],
  'Intelligence Feeds': [
    {
      id: 'osint-ukraine',
      name: 'OSINT Ukraine',
      type: 'webhook',
      url: 'https://webhook.osint-ukraine.com/events',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:38:00Z',
      articles: 89,
      category: 'Intelligence Feeds'
    },
    {
      id: 'conflict-monitor',
      name: 'Conflict Monitor API',
      type: 'api',
      url: 'https://api.conflictmonitor.org/v1/events',
      enabled: true,
      status: 'active',
      lastSync: '2024-01-15T10:30:00Z',
      articles: 156,
      category: 'Intelligence Feeds'
    },
    {
      id: 'liveuamap',
      name: 'LiveUAMap Feed',
      type: 'webhook',
      url: 'https://liveuamap.com/api/webhook',
      enabled: false,
      status: 'inactive',
      lastSync: '2024-01-15T05:20:00Z',
      articles: 0,
      category: 'Intelligence Feeds'
    }
  ]
};

export function Settings() {
  const [dataSources, setDataSources] = useState<Record<string, DataSource[]>>(mockDataSources);
  const [themes] = useState([
    { id: 'tactical', name: 'Tactical Green', color: 'bg-green-400' },
    { id: 'cyber', name: 'Cyber Blue', color: 'bg-blue-400' },
    { id: 'military', name: 'Military Orange', color: 'bg-orange-400' },
    { id: 'stealth', name: 'Stealth Purple', color: 'bg-purple-400' }
  ]);
  const [theme, setTheme] = useState('tactical');
  const [panelOpacity, setPanelOpacity] = useState(90);
  const [currentSources] = useState(Object.values(dataSources).flat());
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('');

  const checkDataSources = async () => {
    setIsLoading(true);
    // Simulate checking data sources
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const triggerSync = async () => {
    setSyncStatus('running');
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const toggleSource = (sourceId: string) => {
    setDataSources(prev => {
      const newSources = { ...prev };
      Object.keys(newSources).forEach(category => {
        newSources[category] = newSources[category].map(source =>
          source.id === sourceId ? { ...source, enabled: !source.enabled } : source
        );
      });
      return newSources;
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-tactical font-bold text-neon-400">
        System Settings
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
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
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Sources ({currentSources.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Button
                onClick={checkDataSources}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? 'CHECKING...' : 'REFRESH STATUS'}
              </Button>
              
              <Button
                onClick={triggerSync}
                disabled={syncStatus === 'running'}
                variant="outline"
                size="sm"
              >
                {syncStatus === 'running' ? 'SYNCING...' : 
                 syncStatus === 'success' ? 'SYNC SUCCESS' :
                 syncStatus === 'error' ? 'SYNC FAILED' :
                 'SYNC NOW'}
              </Button>
            </div>

            {Object.entries(dataSources).map(([category, sources]: [string, DataSource[]]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-neon-400">{category}</h4>
                {sources.map((source) => (
                  <div key={source.id} className="tactical-panel p-3 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          source.status === 'active' ? 'bg-green-400' :
                          source.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                        <div>
                          <div className="text-sm text-tactical-text">{source.name}</div>
                          <div className="text-xs text-tactical-muted">{source.type.toUpperCase()}</div>
                        </div>
                      </div>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(source.id)}
                      />
                    </div>
                  </div>
                ))}
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
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
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
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}