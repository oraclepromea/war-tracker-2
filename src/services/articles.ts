export class ArticlesService {
  static async getLatestArticles() {
    try {
      const response = await fetch('/api/articles/latest');
      if (!response.ok) throw new Error('Failed to fetch articles');
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest articles:', error);
      return [];
    }
  }
  
  static async searchArticles(query: string) {
    try {
      const response = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search articles');
      return await response.json();
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  static async triggerRSSFetch() {
    try {
      const response = await fetch('/api/rss/trigger', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to trigger RSS fetch');
      return await response.json();
    } catch (error) {
      console.error('Error triggering RSS fetch:', error);
      return { success: false };
    }
  }
}
