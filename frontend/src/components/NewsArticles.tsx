import React, { useEffect, useState } from 'react';
import { ArticlesService, Article } from '../services/articles';

export const NewsArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingRSS, setIsUpdatingRSS] = useState(false);

  const fetchArticles = async () => {
    try {
      const latestArticles = await ArticlesService.getLatestArticles(20);
      setArticles(latestArticles);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSSUpdate = async () => {
    setIsUpdatingRSS(true);
    try {
      console.log('🔄 Triggering RSS update...');
      const result = await ArticlesService.triggerRSSFetch();
      console.log('✅ RSS update result:', result);

      // Refresh articles after RSS update
      await fetchArticles();
    } catch (error) {
      console.error('❌ RSS update failed:', error);
    } finally {
      setIsUpdatingRSS(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) return <div>Loading articles...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Latest War & Conflict News</h2>
        <button
          onClick={handleRSSUpdate}
          disabled={isUpdatingRSS}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isUpdatingRSS
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUpdatingRSS ? 'Updating RSS...' : '📡 Update RSS'}
        </button>
      </div>

      {articles.map((article) => (
        <div key={article.id} className="border p-4 rounded-lg">
          <h3 className="font-semibold">
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </h3>
          <p className="text-gray-600 text-sm">{article.summary}</p>
          <div className="text-xs text-gray-500 mt-2">
            {article.source} • {new Date(article.published_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
