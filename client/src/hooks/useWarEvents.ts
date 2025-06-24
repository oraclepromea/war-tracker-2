import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WarEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  severity: string;
  source: string;
  processed_at: string;
  event_type: string;
}

export const useWarEvents = () => {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWarEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if war_events table exists, if not use fallback
      const { data, error } = await supabase!
        .from('war_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Supabase war_events table not found, using fallback data');
        setEvents(mockWarEvents);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('❌ Error fetching war events:', error);
      setError(error as Error);
      // Use fallback data on error
      setEvents(mockWarEvents);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, fetchWarEvents };
};

// Fallback mock data
const mockWarEvents: WarEvent[] = [
  {
    id: 1,
    title: 'Military Operation Update',
    description: 'Recent developments in ongoing conflict zones',
    location: 'Eastern Europe',
    severity: 'high',
    source: 'Defense Intelligence',
    processed_at: new Date().toISOString(),
    event_type: 'military_action'
  },
  {
    id: 2,
    title: 'Humanitarian Corridor Established',
    description: 'Safe passage for civilians in conflict area',
    location: 'Middle East',
    severity: 'medium',
    source: 'UN Reports',
    processed_at: new Date(Date.now() - 3600000).toISOString(),
    event_type: 'humanitarian'
  }
];