const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://war-tracker-20-production.up.railway.app' 
    : 'http://localhost:3001');

const API_ENDPOINTS = {
  health: '/api/health',
  news: '/api/news',
  events: '/api/events',
  live: '/api/live'
};

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async getHealth() {
    return this.request(API_ENDPOINTS.health);
  }

  async getNews() {
    return this.request(API_ENDPOINTS.news);
  }

  async getEvents() {
    return this.request(API_ENDPOINTS.events);
  }

  async getLive() {
    return this.request(API_ENDPOINTS.live);
  }
}

export const apiService = new ApiService();
