import React from 'react';

// Simple date formatter to replace date-fns
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const WarNews: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">War News</h2>
      <p className="text-gray-600 mb-4">
        This component has been moved to /client/src/components/WarNews.tsx
      </p>
      
      <div className="bg-gray-100 p-4 rounded">
        <p>War news component - displays latest conflict-related news articles</p>
        <p className="mt-2 text-sm text-gray-500">
          Time formatter example: {formatTimeAgo(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
};

export default WarNews;