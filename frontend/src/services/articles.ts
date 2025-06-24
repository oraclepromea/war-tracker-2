import { supabase } from '../lib/supabase'

export interface Article {
  id: string
  title: string
  link: string
  summary: string
  published_at: string
  source: string
  image_url?: string
  created_at: string
}

export class ArticlesService {
  // Get latest articles
  static async getLatestArticles(limit = 50): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching articles:', error)
      throw error
    }

    return data || []
  }

  // Get articles by source
  static async getArticlesBySource(source: string, limit = 20): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('source', source)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching articles by source:', error)
      throw error
    }

    return data || []
  }

  // Search articles
  static async searchArticles(query: string, limit = 30): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching articles:', error)
      throw error
    }

    return data || []
  }

  // Manually trigger RSS fetch (calls the edge function)
  static async triggerRSSFetch(): Promise<any> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rssFetcher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering RSS fetch:', error);
      throw error;
    }
  }
}
