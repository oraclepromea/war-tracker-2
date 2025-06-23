import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProcessingStats {
  totalProcessed: number;
  eventsCreated: number;
  skippedNotWar: number;
  errors: number;
  processingTimeMs: number;
}

interface SchedulerLog {
  id: string;
  run_type: string;
  articles_found: number;
  processing_stats: ProcessingStats;
  status: string;
  executed_at: string;
}

export function AutomationDashboard() {
  const [logs, setLogs] = useState<SchedulerLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  useEffect(() => {
    fetchLogs();
    fetchUnprocessedCount();
    const interval = setInterval(() => {
      fetchLogs();
      fetchUnprocessedCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('scheduler_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(10);
    
    if (data) setLogs(data);
  };

  const fetchUnprocessedCount = async () => {
    const { count } = await supabase
      .from('rss_articles')
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', false);
    
    if (count !== null) setUnprocessedCount(count);
  };

  const triggerBatchProcessing = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-analyze-articles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ batch_size: 5, max_concurrent: 2 })
        }
      );

      if (response.ok) {
        setTimeout(() => {
          fetchLogs();
          fetchUnprocessedCount();
        }, 2000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerScheduler = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheduler`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    );

    if (response.ok) {
      setTimeout(() => {
        fetchLogs();
        fetchUnprocessedCount();
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Automation Dashboard</h2>
        <div className="flex space-x-3">
          <button
            onClick={triggerBatchProcessing}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Manual Batch Process'}
          </button>
          <button
            onClick={triggerScheduler}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Trigger Scheduler
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              📰
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Unprocessed</p>
              <p className="text-2xl font-bold text-blue-600">{unprocessedCount}</p>
            </div>
          </div>
        </div>

        {logs[0] && (
          <>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  ⚔️
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Events Created</p>
                  <p className="text-2xl font-bold text-green-600">
                    {logs[0].processing_stats?.eventsCreated || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-md">
                  ⏭️
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {logs[0].processing_stats?.skippedNotWar || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-md">
                  ❌
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-900">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {logs[0].processing_stats?.errors || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Processing Logs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Processing Runs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.executed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.run_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.articles_found}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.processing_stats?.eventsCreated || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      log.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.processing_stats?.processingTimeMs
                      ? `${Math.round(log.processing_stats.processingTimeMs / 1000)}s`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}