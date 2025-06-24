import { useState, useEffect, useCallback } from 'react';
import { apiRequest, API_BASE_URL } from '../config/api';

// FIXED: Add missing interfaces and functions
interface BackendData {
  articles: any[];
  events: any[];
  weapons: any[];
  status: string;
}

const getFallbackData = (): BackendData => ({
  articles: [],
  events: [],
  weapons: [],
  status: 'offline'
});

export function useRealTimeData() {
  // FIXED: Add missing state variables
  const [backendData, setBackendData] = useState<BackendData>(getFallbackData());
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // FIXED: Add better error handling and fallbacks
  const fetchBackendData = useCallback(async () => {
    try {
      console.log('🔍 useRealTimeData: Starting data fetch...');
      
      // Check if backend is available first
      const healthCheck = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        console.log('⚠️ Backend not available, using fallback data');
        setBackendStatus('offline');
        setBackendData(getFallbackData());
        return;
      }

      // Fetch actual data
      const data = await apiRequest('/api/news');
      setBackendData(data);
      setBackendStatus('online');
      
    } catch (error) {
      console.error('⚠️ Backend not available:', error);
      setBackendStatus('offline');
      setBackendData(getFallbackData());
    }
  }, []);

  // FIXED: Use fetchBackendData in useEffect
  useEffect(() => {
    fetchBackendData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchBackendData, 30000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  return {
    backendData,
    backendStatus,
    refetch: fetchBackendData
  };
};