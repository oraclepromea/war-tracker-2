export function LiveNews() {
  return (
    <div className="min-h-screen bg-tactical-bg p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-tactical text-neon-400 mb-6">Live News Feed</h1>
        
        <div className="tactical-panel p-6 rounded neon-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-tactical text-neon-400">Real-Time RSS Feeds</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-mono">LIVE</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-neon-400 pl-4 py-2">
              <div className="text-tactical-text font-medium">BBC World News - Breaking: Middle East Tensions Rise</div>
              <div className="text-tactical-muted text-sm mt-1">2 minutes ago • High Priority</div>
            </div>
            
            <div className="border-l-4 border-orange-400 pl-4 py-2">
              <div className="text-tactical-text font-medium">Reuters - NATO Forces Mobilize in Eastern Europe</div>
              <div className="text-tactical-muted text-sm mt-1">5 minutes ago • Medium Priority</div>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-4 py-2">
              <div className="text-tactical-text font-medium">Al Jazeera - Diplomatic Talks Resume</div>
              <div className="text-tactical-muted text-sm mt-1">8 minutes ago • Low Priority</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-tactical-muted text-sm font-mono">
              ⚡ AI processing active feeds from 15 sources
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
