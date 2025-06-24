import React, { useState } from 'react';

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  source: {
    name: string;
    icon: string;
    reliability: number;
  };
}

const LiveNews = () => {
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    threatLevel: '',
    timeRange: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [articles] = useState<Article[]>([]); // Initialize with empty array

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      source: '',
      threatLevel: '',
      timeRange: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Live News</h2>
      <p className="text-gray-600 mb-4">
        This component has been moved to /client/src/components/LiveNews.tsx
      </p>
      
      {/* Placeholder content */}
      <div className="bg-gray-100 p-4 rounded">
        <p>Active filters: {Object.values(filters).filter(Boolean).length}</p>
        <p>Current page: {currentPage}</p>
        <p>Articles count: {articles.length}</p>
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => handleFilterChange('search', 'test')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            🔍 Test Filter
          </button>
          <button 
            onClick={resetFilters}
            className="px-3 py-1 bg-gray-500 text-white rounded"
          >
            🔄 Reset Filters
          </button>
        </div>
      </div>

      <div className="mt-4">
        {articles.map((article: Article, index: number) => (
          <div key={article.id || index} className="border p-3 mb-2 rounded">
            <h3>🗺️ {article.title}</h3>
            <p>📅 {article.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveNews;