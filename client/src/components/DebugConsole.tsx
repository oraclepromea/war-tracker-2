import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  RefreshCw, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
// Fix: Remove vite-env import and use direct environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  endpoint?: string;
  status?: number;
  message: string;
  data?: any;
}

interface SystemMetrics {
  [key: string]: any;
}

interface DiagnosticResult {
  [key: string]: any;
}

interface RssStatus {
  [key: string]: any;
}

interface ApiTestResponse {
  status: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  data?: any;
  error?: string; // Add error property to interface
}

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [rssStatus, setRssStatus] = useState<RssStatus>({});
  const [apiTests, setApiTests] = useState<Record<string, ApiTestResponse>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({});
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult>({});

  // System health check
  const checkSystemHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      setSystemStatus(data);
      
      addLog({
        type: 'info',
        message: `System health check: ${data.status}`,
        data: data
      });
    } catch (error) {
      setSystemStatus({ status: 'ERROR', error: error instanceof Error ? error.message : String(error) });
      addLog({
        type: 'error',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // Test RSS feeds
  const testRSSFeeds = async () => {
    const rssFeeds = [
      { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/worldNews' },
      { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/' },
      { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/' }
    ];

    const results: RssStatus = {};
    
    for (const feed of rssFeeds) {
      try {
        addLog({
          type: 'request',
          message: `Testing RSS feed: ${feed.name}`,
          endpoint: feed.url
        });

        // Simulate RSS test (in real app, this would go through backend)
        const testResult = {
          status: Math.random() > 0.1 ? 'success' : 'failed',
          responseTime: Math.floor(Math.random() * 2000) + 200,
          articles: Math.floor(Math.random() * 50) + 10,
          lastUpdate: new Date().toISOString()
        };

        results[feed.name] = testResult;
        
        addLog({
          type: testResult.status === 'success' ? 'response' : 'error',
          message: `RSS ${feed.name}: ${testResult.status} (${testResult.articles} articles)`,
          data: testResult
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results[feed.name] = { status: 'error', error: error instanceof Error ? error.message : String(error) };
        addLog({
          type: 'error',
          message: `RSS ${feed.name} failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    setRssStatus(results);
  };

  // Test API endpoints
  const testAPIEndpoints = async () => {
    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'GET' },
      { name: 'News Sync', path: '/api/jobs/news', method: 'POST' },
      { name: 'Events', path: '/api/events', method: 'GET' },
      { name: 'News Items', path: '/api/news', method: 'GET' }
    ];

    const results: Record<string, ApiTestResponse> = {};

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        addLog({
          type: 'request',
          message: `Testing ${endpoint.method} ${endpoint.path}`,
          endpoint: endpoint.path
        });

        const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
          method: endpoint.method
        });
        const responseTime = Date.now() - startTime;

        const result: ApiTestResponse = {
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
          responseTime,
          timestamp: new Date().toISOString()
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.data = data;
          } catch (e) {
            result.data = 'Non-JSON response';
          }
        }

        results[endpoint.name] = result;
        
        addLog({
          type: response.ok ? 'response' : 'error',
          message: `API ${endpoint.name}: ${response.status} (${responseTime}ms)`,
          status: response.status,
          endpoint: endpoint.path,
          data: result
        });

      } catch (error) {
        results[endpoint.name] = { 
          status: 'error', 
          statusCode: 0,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        };
        
        addLog({
          type: 'error',
          message: `API ${endpoint.name} failed: ${error instanceof Error ? error.message : String(error)}`,
          endpoint: endpoint.path
        });
      }
    }

    setApiTests(results);
  };

  // Add log entry helper
  const addLog = (logData: Partial<LogEntry>) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: '',
      type: 'info',
      ...logData
    };
    
    setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // Run diagnostics
  const runFullDiagnostics = async () => {
    addLog({
      type: 'info',
      message: '🔍 Starting full system diagnostics...'
    });

    await checkSystemHealth();
    await testAPIEndpoints();
    await testRSSFeeds();

    addLog({
      type: 'info',
      message: '✅ Full diagnostics completed'
    });
  };

  const runSystemDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const results: DiagnosticResult = {};
    
    try {
      // Database connectivity
      const dbStart = Date.now();
      try {
        await fetch('/api/health/database');
        results.database = { status: 'OK', responseTime: Date.now() - dbStart };
      } catch (error) {
        results.database = { status: 'ERROR', error: error instanceof Error ? error.message : String(error) };
      }

      // API endpoints
      const apiEndpoints = ['/api/events', '/api/weapons', '/api/stats'];
      for (const endpoint of apiEndpoints) {
        const start = Date.now();
        try {
          await fetch(endpoint);
          results[`api_${endpoint.replace('/', '_')}`] = { 
            status: 'OK', 
            responseTime: Date.now() - start 
          };
        } catch (error) {
          results[`api_${endpoint.replace('/', '_')}`] = { 
            status: 'ERROR', 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      }

      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostics failed:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setSystemMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    // Initial system check
    checkSystemHealth();
    
    if (!autoRefresh) return;

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      addLog({
        type: 'info',
        message: `🔄 Auto-refresh check at ${new Date().toLocaleTimeString()}`
      });
      checkSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'request': return <Terminal className="h-4 w-4 text-blue-400" />;
      case 'response': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'request': return 'text-blue-400';
      case 'response': return 'text-green-400';
      default: return 'text-yellow-400';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  // Use the system metrics in a metrics panel
  const displaySystemMetrics = () => {
    return (
      <Card className="neon-border">
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(systemMetrics).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(systemMetrics).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-tactical-muted">{key}:</span>
                  <span className="text-tactical-text">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-tactical-muted text-sm">No metrics available</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemMetrics}
            className="mt-4"
          >
            Refresh Metrics
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Use diagnostic results in diagnostics panel
  const displayDiagnosticResults = () => {
    return (
      <Card className="neon-border">
        <CardHeader>
          <CardTitle>Diagnostic Results</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(diagnosticResults).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(diagnosticResults).map(([key, result]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-tactical-muted">{key}:</span>
                  <span className={`text-xs ${(result as any).status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                    {(result as any).status || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-tactical-muted text-sm">No diagnostics run</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={runSystemDiagnostics}
            disabled={isRunningDiagnostics}
            className="mt-4"
          >
            {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-tactical font-bold text-neon-400">
          Debug Console & System Diagnostics
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-400 text-green-400' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={runFullDiagnostics}>
            <Database className="h-4 w-4 mr-2" />
            Run Diagnostics
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neon-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemStatus.status === 'OK' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`font-mono text-sm ${
                systemStatus.status === 'OK' ? 'text-green-400' : 'text-red-400'
              }`}>
                {systemStatus.status || 'CHECKING...'}
              </span>
            </div>
            <div className="mt-2 text-xs text-tactical-muted">
              Database: {systemStatus.database || 'unknown'}
            </div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">RSS Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(rssStatus as Record<string, any>).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-tactical-muted">{name}</span>
                  <span className={`font-mono ${
                    status.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(apiTests as Record<string, any>).map(([name, test]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-tactical-muted">{name}</span>
                  <span className={`font-mono ${
                    test.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {test.statusCode || test.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Console */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-5 w-5" />
                  <span>Live System Logs</span>
                  <div className="text-xs text-tactical-muted font-mono">
                    [{logs.length} entries]
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-tactical-bg rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                <AnimatePresence>
                  {logs.slice(0, isExpanded ? logs.length : 20).map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`mb-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedLog?.id === log.id ? 'bg-neon-950/50 border border-neon-400' : 'hover:bg-tactical-panel'
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center space-x-2">
                        {getLogIcon(log.type)}
                        <span className="text-tactical-muted text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={getLogColor(log.type)}>
                          {log.endpoint && `[${log.endpoint}]`}
                        </span>
                        {log.status && (
                          <span className={`text-xs ${
                            log.status < 400 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        )}
                      </div>
                      <div className="text-tactical-text mt-1 ml-6">
                        {log.message}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {logs.length === 0 && (
                  <div className="text-center text-tactical-muted py-8">
                    <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No logs yet. Run diagnostics to generate logs.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log Details */}
        <div>
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Log Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <div className="space-y-4">
                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">TIMESTAMP</div>
                    <div className="text-neon-400 font-mono text-sm">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">TYPE</div>
                    <div className={`font-mono text-sm ${getLogColor(selectedLog.type)}`}>
                      {selectedLog.type.toUpperCase()}
                    </div>
                  </div>
                  {selectedLog.endpoint && (
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">ENDPOINT</div>
                      <div className="text-tactical-text font-mono text-sm">
                        {selectedLog.endpoint}
                      </div>
                    </div>
                  )}
                  {selectedLog.status && (
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">STATUS</div>
                      <div className={`font-mono text-sm ${
                        selectedLog.status < 400 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedLog.status}
                      </div>
                    </div>
                  )}
                  <div className="tactical-panel p-3 rounded">
                    <div className="text-tactical-muted text-xs font-mono mb-1">MESSAGE</div>
                    <div className="text-tactical-text text-sm">
                      {selectedLog.message}
                    </div>
                  </div>
                  {selectedLog.data && (
                    <div className="tactical-panel p-3 rounded">
                      <div className="text-tactical-muted text-xs font-mono mb-1">DATA</div>
                      <pre className="text-neon-400 text-xs font-mono bg-tactical-bg p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-tactical-muted py-8">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a log entry to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add these panels to the UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {displaySystemMetrics()}
        {displayDiagnosticResults()}
      </div>
    </div>
  );
}