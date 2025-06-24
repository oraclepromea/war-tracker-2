import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Activity
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    name: string;
    icon: string;
    component: React.ComponentType;
  }>;
}

export function Navigation({ activeTab, onTabChange, tabs }: NavigationProps) {
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
              const isActive = activeTab === tab.name;
              
              return (
                <Button
                  key={tab.name}
                  variant={isActive ? "neon" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.name)}
                  className={cn(
                    "flex items-center space-x-2 font-mono text-xs",
                    isActive && "active-tab"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}