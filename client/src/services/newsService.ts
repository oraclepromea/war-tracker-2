import { apiRequest, API_ENDPOINTS } from '../config/api';

export class NewsService {
  static async fetchLatestNews() {
    try {
      console.log('📰 Fetching latest articles from backend...');
      const data = await apiRequest(API_ENDPOINTS.news);
      return data;
    } catch (error) {
      console.error('❌ Error fetching articles:', error);
      throw error;
    }
  }
}