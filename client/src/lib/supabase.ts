import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://prmjtsiyeovmkujtbjwi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM';

// FIXED: Create supabase client with null check
const supabase = createClient(supabaseUrl, supabaseKey);

// FIXED: Add better error handling for Supabase operations
export const fetchWarEvents = async () => {
  try {
    // FIXED: Add null check for supabase
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('war_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase error:', error);
      return {
        data: [],
        error: error.message
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch war events:', error);
    return {
      data: [],
      error: 'Database connection failed'
    };
  }
};

// FIXED: Add WebSocket reconnection logic
export const setupRealtimeSubscription = (callback: (payload: any) => void) => {
  try {
    // FIXED: Add null check for supabase
    if (!supabase) {
      console.error('Supabase client not available for real-time subscription');
      return null;
    }

    const subscription = supabase
      .channel('war_events_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'war_events' 
        }, 
        callback
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
          // Retry connection after delay
          setTimeout(() => {
            setupRealtimeSubscription(callback);
          }, 5000);
        }
      });

    return subscription;
  } catch (error) {
    console.error('Failed to setup realtime subscription:', error);
    return null;
  }
};

export { supabase };
