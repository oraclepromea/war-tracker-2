// Dynamic API URL based on environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://war-tracker-20-production.up.railway.app' 
    : 'http://localhost:3000');

export const API_ENDPOINTS = {
  health: '/api/health',
  news: '/api/news',
  events: '/api/events',
  live: '/api/live',
  syncNews: '/api/jobs/news'
};

// Enhanced fetch with error handling
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🔍 API Request: ${url}`);
    
    const response = await fetch(url, {
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
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
