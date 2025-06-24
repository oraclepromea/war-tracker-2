import React, { useEffect, useState } from 'react';
import { ArticlesService, Article } from '../services/articles';

export const NewsArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchArticles();
  }, []);

  if (loading) return <div>Loading articles...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Latest War & Conflict News</h2>
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
