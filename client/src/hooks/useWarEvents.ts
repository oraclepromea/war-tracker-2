import { supabase, isSupabaseAvailable } from '@/lib/supabase';

export const useWarEvents = () => {
  // ...existing code...

  const fetchWarEvents = async () => {
    if (!isSupabaseAvailable()) {
      console.log('📊 Using fallback war events data');
      setEvents(mockWarEvents);
      setLoading(false);
      return;
    }

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

  // ...existing code...
};

// Fallback mock data
const mockWarEvents = [
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