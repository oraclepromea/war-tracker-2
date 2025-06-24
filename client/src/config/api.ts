export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://war-tracker-20-production.up.railway.app' 
    : 'http://localhost:3001');

export const API_ENDPOINTS = {
  health: '/api/health',
  news: '/api/news',
  events: '/api/events',
  live: '/api/live'
};
