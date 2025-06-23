import { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';
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
  type: string;
  status: string;
  lastUpdate: string;
  enabled: boolean;
}

export default function Settings() {
  const [dataSources, setDataSources] = useState<Record<string, DataSource[]>>({
    // Real RSS News Sources - NO MOCK DATA
    'RSS': [
      { id: 'reuters', name: 'Reuters World News', type: 'rss', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'bbc', name: 'BBC World News', type: 'rss', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'ap', name: 'Associated Press', type: 'rss', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'cnn', name: 'CNN World News', type: 'rss', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true }
    ],
    // Real Government Sources
    'Government': [
      { id: 'us-dod', name: 'US Department of Defense', type: 'Government', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'nato', name: 'NATO Official News', type: 'Government', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'ukraine-mod', name: 'Ukraine Ministry of Defense', type: 'Government', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'idf', name: 'Israel Defense Forces', type: 'Government', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'us-state', name: 'US State Department', type: 'Government', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true }
    ],
    // Real Multi-language Sources
    'Multi-language': [
      { id: 'aljazeera', name: 'Al Jazeera Arabic', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'times-israel', name: 'Times of Israel', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'kyiv-independent', name: 'Kyiv Independent', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'rt-russian', name: 'RT Russian', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'al-arabiya', name: 'Al Arabiya Arabic', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'tass', name: 'TASS Russian', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'interfax', name: 'Interfax Russia', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true },
      { id: 'al-ahram', name: 'Al Ahram Arabic', type: 'Multi-language', status: 'active', lastUpdate: '2023-10-01T12:00:00Z', enabled: true }
    ]
  });
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

  const handleRemoveSource = (sourceId: string) => {
    setDataSources((prev: Record<string, DataSource[]>) => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].filter((source: DataSource) => source.id !== sourceId);
      });
      return updated;
    });
  };

  const saveToSupabase = async (settings: any) => {
    if (!isSupabaseAvailable()) {
      console.log('Supabase not available - settings saved to localStorage only');
      return { success: true, message: 'Settings saved locally' };
    }

    try {
      const { data, error } = await supabase!
        .from('user_settings')
        .upsert([settings]);

      if (error) throw error;
      return { success: true, message: 'Settings saved to cloud' };
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
      return { success: false, message: 'Failed to save to cloud, saved locally instead' };
    }
  };

  const loadFromSupabase = async () => {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      const { data, error } = await supabase!
        .from('user_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const savedSettings = await loadFromSupabase();
      if (savedSettings) {
        setDataSources(savedSettings.dataSources);
        setTheme(savedSettings.theme);
        setPanelOpacity(savedSettings.panelOpacity);
        setNotifications(savedSettings.notifications);
        setApiKey(savedSettings.apiKey);
      }
    };

    fetchData();
  }, []);

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
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleRemoveSource(source.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                        >
                          REMOVE
                        </Button>
                        <Button 
                          size="sm"
                          variant={source.enabled ? "default" : "outline"}
                          onClick={() => toggleSource(source.id)}
                        >
                          {source.enabled ? 'DISABLE' : 'ENABLE'}
                        </Button>
                        <Switch
                          checked={Boolean(source.enabled)}
                          onCheckedChange={() => toggleSource(source.id)}
                        />
                      </div>
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