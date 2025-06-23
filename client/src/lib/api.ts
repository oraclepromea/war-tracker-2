// API Configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://war-tracker-20-production.up.railway.app'
    : 'http://localhost:3001'
  );

console.log('🔗 API Base URL:', API_BASE_URL);

export { API_BASE_URL };