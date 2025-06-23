import React from 'react';

type TabType = 'dashboard' | 'live' | 'intelligence' | 'geospatial' | 'analytics' | 'alerts';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'live', label: 'Live', icon: '📡' },
    { id: 'intelligence', label: 'Intelligence', icon: '🔍' },
    { id: 'geospatial', label: 'Geospatial', icon: '🗺️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id as TabType)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;