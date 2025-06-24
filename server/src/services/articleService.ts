import { createClient } from '@supabase/supabase-js';

interface Article {
  id: string;
  title: string;
  url: string;
  content: string;
  published_date: string;
  source: string;
  fetched_at: string;
}

export class ArticleService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getAllArticles(): Promise<Article[]> {
    try {
      const { data, error } = await this.supabase
        .from('rss_articles')
        .select('*')
        .order('fetched_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Article service error:', error);
      throw error;
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await this.supabase
        .from('rss_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Article service error:', error);
      return null;
    }
  }

  async createArticle(article: Omit<Article, 'id' | 'fetched_at'>): Promise<Article | null> {
    try {
      const { data, error } = await this.supabase
        .from('rss_articles')
        .insert([{
          ...article,
          fetched_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating article:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Article service error:', error);
      return null;
    }
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
    try {
      const { data, error } = await this.supabase
        .from('rss_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating article:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Article service error:', error);
      return null;
    }
  }

  async deleteArticle(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('rss_articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Article service error:', error);
      return false;
    }
  }
}
