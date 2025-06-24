import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      war_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          event_type: string;
          country: string;
          region?: string;
          timestamp: string;
          threat_level: string;
          confidence: number;
          casualties?: number;
          weapons_used?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description: string;
          event_type: string;
          country: string;
          region?: string;
          timestamp?: string;
          threat_level: string;
          confidence: number;
          casualties?: number;
          weapons_used?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          event_type?: string;
          country?: string;
          region?: string;
          timestamp?: string;
          threat_level?: string;
          confidence?: number;
          casualties?: number;
          weapons_used?: string[];
        };
      };
    };
  };
};

export default supabase;
