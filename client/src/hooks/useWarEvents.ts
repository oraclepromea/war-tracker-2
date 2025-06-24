import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface WarEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  source: string;
  verified: boolean;
  date: string;
  coordinates?: [number, number];
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

export const useWarEvents = () => {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('war_events')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) {
          throw error;
        }

        setEvents(data || []);
      } catch (err) {
        console.error('Error fetching war events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Set up real-time subscription
    const subscription = supabase
      .channel('war_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'war_events' },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchEvents(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { events, loading, error };
};