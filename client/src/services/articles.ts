import { API_BASE_URL } from '../config/api';

export interface Article {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

export const fetchArticles = async (): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
};

export const fetchArticleById = async (id: string): Promise<Article | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.article || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
};

export const searchArticles = async (query: string): Promise<Article[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/articles/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
};

export class ArticlesService {
  static async getLatestArticles() {
    // Mock implementation
    return [];
  }
  
  static async searchArticles(query: string) {
    // Mock implementation
    return [];
  }
}
