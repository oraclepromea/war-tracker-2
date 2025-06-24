import { Activity, AlertTriangle } from 'lucide-react';

export function WarEventsTimeline() {
  return (
    <div className="min-h-screen bg-tactical-bg p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="tactical-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-6 w-6 text-neon-400" />
            <h2 className="text-xl font-bold text-neon-400">War Events Timeline</h2>
          </div>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <p className="text-tactical-muted">War Events Timeline coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}