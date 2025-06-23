/// <reference path="../vite-env.d.ts" />
import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../vite-env';

// Constants and configuration
const API_BASE_URL = getApiBaseUrl();
console.log('🔍 API Base URL:', API_BASE_URL);

// Helper function to check if backend is available
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    console.log('🔍 API Base URL:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend not available:', error);
    return false;
  }
};

const fetchHealthCheck = async (): Promise<boolean> => {
  try {
    console.log('🔍 useRealTimeData: Starting data fetch...');
    console.log('🔍 API Base URL:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Error fetching health check:', error);
    return false;
  }
};

const fetchWarData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/conflicts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching war data:', error);
    return [];
  }
};

const fetchLatestNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching latest news:', error);
    return [];
  }
};

const testApiConnection = async (endpoint: string): Promise<boolean> => {
  try {
    console.log('🔧 Development mode: Testing API with shorter timeout');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Remove leading slash if it exists to prevent double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    console.log('🔍 Testing URL:', url);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ API connection successful: ${url}`);
      return true;
    } else {
      console.log(`❌ Failed endpoint ${cleanEndpoint}: HTTP ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Failed endpoint ${endpoint}:`, error.message || error);
    return false;
  }
};