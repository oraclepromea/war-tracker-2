export function Dashboard() {
  return (
    <div className="min-h-screen bg-tactical-bg p-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-tactical text-neon-400 mb-6">Tactical Command Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="tactical-panel p-6 rounded neon-border">
            <h3 className="text-lg font-tactical text-neon-400 mb-4">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-tactical-muted">RSS Feeds:</span>
                <span className="text-green-400">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">AI Analysis:</span>
                <span className="text-green-400">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Real-time Data:</span>
                <span className="text-green-400">STREAMING</span>
              </div>
            </div>
          </div>

          <div className="tactical-panel p-6 rounded neon-border">
            <h3 className="text-lg font-tactical text-neon-400 mb-4">Today's Intel</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-tactical-muted">Articles Processed:</span>
                <span className="text-neon-400 font-mono">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">War Events Detected:</span>
                <span className="text-orange-400 font-mono">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Threat Level:</span>
                <span className="text-red-400 font-mono">MODERATE</span>
              </div>
            </div>
          </div>

          <div className="tactical-panel p-6 rounded neon-border">
            <h3 className="text-lg font-tactical text-neon-400 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-neon-400/20 text-neon-400 border border-neon-400/50 rounded font-mono text-sm hover:bg-neon-400/30 transition-all">
                REFRESH DATA
              </button>
              <button className="w-full px-4 py-2 bg-tactical-panel text-tactical-muted border border-tactical-border rounded font-mono text-sm hover:text-neon-400 hover:border-neon-400/50 transition-all">
                EXPORT REPORT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
