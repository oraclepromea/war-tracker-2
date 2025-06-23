const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// War Events Data Service
export interface WarEventData {
  id: number;
  title: string;
  description: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
  source?: string;
  type?: string;
  casualties?: {
    confirmed: number;
    estimated: number;
  };
}

export async function getWarEvents(): Promise<WarEventData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events`); // Fixed: Added /api prefix
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch war events from RSS feeds:', error);
    // Return empty array instead of mock data
    return [];
  }
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  status: string;
  participants?: string[];
  timeline?: Array<{
    phase: string;
    date: string;
    details: string;
  }>;
}

export const eventService = {
  async getEvents(_params?: any): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    return data.events || data.data || [];
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    
    return await response.json();
  },

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    
    return await response.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
  }
};