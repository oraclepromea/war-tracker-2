import { useState, useEffect } from 'react';

export interface RealTimeEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  source: string;
  category: string;
  verified: boolean;
  type?: string;
  casualties?: number | {
    confirmed?: number;
    estimated?: number;
    total?: number;
  };
}

export interface WarEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  source: string;
  type?: string;
  verified?: boolean;
  casualties?: number | {
    confirmed?: number;
    estimated?: number;
    total?: number;
  };
}

export interface RealTimeData {
  events: RealTimeEvent[];
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean; // Added missing property
  connectionStatus: string; // Added missing property
}

export function useRealTimeData(): RealTimeData {
  const [data, setData] = useState<RealTimeData>({
    events: [],
    status: 'connecting',
    isConnected: false,
    connectionStatus: 'Connecting...'
  });

  useEffect(() => {
    // Simulate real-time data connection
    const mockEvents: RealTimeEvent[] = [
      {
        id: '1',
        title: 'Sample Event',
        description: 'This is a sample real-time event',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        location: 'Sample Location',
        source: 'Sample Source',
        category: 'military',
        type: 'conflict',
        verified: true,
        casualties: 0
      }
    ];

    setData({
      events: mockEvents,
      status: 'connected',
      isConnected: true,
      connectionStatus: 'Connected'
    });
  }, []);

  return data;
}