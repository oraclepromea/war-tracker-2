import React, { useState, useEffect } from 'react';
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

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  endpoint?: string;
  status?: number;
  message: string;
  data?: any;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T14:32:15.123Z',
    type: 'request',
    endpoint: '/api/events',
    message: 'GET /api/events - Fetching war events',
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:32:15.456Z',
    type: 'response',
    endpoint: '/api/events',
    status: 200,
    message: 'Response received - 47 events',
    data: { count: 47, cached: true }
  },
  {
    id: '3',
    timestamp: '2024-01-15T14:32:16.789Z',
    type: 'error',
    endpoint: '/api/casualties',
    status: 503,
    message: 'Service temporarily unavailable',
  },
  {
    id: '4',
    timestamp: '2024-01-15T14:32:17.012Z',
    type: 'info',
    message: 'Data validation completed - 3 errors found',
  },
];

export function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate new log entries
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: Math.random() > 0.7 ? 'error' : 'info',
        message: `System check ${Math.random() > 0.5 ? 'passed' : 'failed'}`,
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, 5000);

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

  const generateMockData = () => {
    const mockEvents = Array.from({ length: 10 }, (_, i) => ({
      id: `mock-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
      type: 'info' as const,
      message: `Mock event ${i + 1} generated`,
    }));
    setLogs(prev => [...mockEvents, ...prev]);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-tactical font-bold text-neon-400">
          Debug Console
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
          <Button variant="outline" size="sm" onClick={generateMockData}>
            <Database className="h-4 w-4 mr-2" />
            Generate Mock Data
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Console */}
        <div className="lg:col-span-2">
          <Card className="neon-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-5 w-5" />
                  <span>API Logs</span>
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
    </div>
  );
}