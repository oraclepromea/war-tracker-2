import React from 'react';
import Live from './components/Live';
import './App.css';
import { AutomationDashboard } from './components/AutomationDashboard';
import WarNews from './pages/WarNews';

// This file should be deleted - the real app is in /client/src/
// Redirecting to proper client app...
export default function RedirectApp() {
  return (
    <div>
      <h1>Please use the client app at /client/src/App.tsx</h1>
      <p>Run: cd client && npm run dev</p>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ...existing navigation... */}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add automation dashboard */}
        <div className="mb-8">
          <AutomationDashboard />
        </div>
        
        {/* ...existing dashboard components... */}
      </main>
    </div>
  );
}

// Add War News to your navigation tabs/routes
// If you have a tab navigation, add:
// { name: 'War News', component: WarNews, icon: '🎯' }
// or if using React Router, add the route:
// <Route path="/war-news" element={<WarNews />} />