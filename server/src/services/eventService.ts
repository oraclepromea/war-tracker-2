import { createClient } from '@supabase/supabase-js';

interface WarEvent {
  id: string;
  event_type: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  casualties?: number;
  weapons_used?: string;
  source_country?: string;
  target_country?: string;
  confidence: number;
  threat_level: string;
  article_id?: string;
  article_title?: string;
  article_url?: string;
  processed_at: string;
  timestamp: string;
}

export class EventService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getAllEvents(): Promise<WarEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('war_events')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Event service error:', error);
      throw error;
    }
  }

  async getEventById(id: string): Promise<WarEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('war_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Event service error:', error);
      return null;
    }
  }

  async createEvent(event: Omit<WarEvent, 'id' | 'processed_at'>): Promise<WarEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('war_events')
        .insert([{
          ...event,
          processed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Event service error:', error);
      return null;
    }
  }

  async updateEvent(id: string, updates: Partial<WarEvent>): Promise<WarEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('war_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Event service error:', error);
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('war_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Event service error:', error);
      return false;
    }
  }

  async getEventsByFilters(filters: {
    country?: string;
    event_type?: string;
    threat_level?: string;
    time_window?: string;
  }): Promise<WarEvent[]> {
    try {
      let query = this.supabase
        .from('war_events')
        .select('*');

      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`);
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.threat_level) {
        query = query.eq('threat_level', filters.threat_level);
      }
      if (filters.time_window) {
        const timeMap: { [key: string]: number } = {
          '1h': 1,
          '6h': 6,
          '24h': 24,
          '7d': 168,
          '30d': 720
        };
        const hoursAgo = timeMap[filters.time_window] || 24;
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
        query = query.gte('timestamp', cutoffTime);
      }

      query = query.order('timestamp', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Event service error:', error);
      throw error;
    }
  }
}
