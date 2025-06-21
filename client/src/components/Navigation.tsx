import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Crosshair, 
  Shield, 
  Settings, 
  Bug,
  Activity
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'War Events', icon: Crosshair },
  { id: 'countries', label: 'Countries & Forces', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'debug', label: 'Debug', icon: Bug },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="tactical-panel border-b border-tactical-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-neon-400 animate-pulse" />
            <h1 className="text-xl font-tactical font-bold text-neon-400">
              WAR TRACKER 2.0
            </h1>
            <div className="text-xs text-tactical-muted font-mono">
              [MIDDLE EAST CONFLICT MONITOR]
            </div>
          </div>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "neon" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 font-mono text-xs",
                    isActive && "active-tab"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}