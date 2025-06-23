// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://war-tracker-20-production.up.railway.app';

console.log('🔗 API Base URL:', API_BASE_URL);

export const api = {
  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // News endpoints
  async getNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch news:', error);
      throw error;
    }
  },

  // Events endpoint
  async getEvents() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  },

  // ...existing methods...
};