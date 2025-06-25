import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { LiveNews } from './components/LiveNews';
import { WarNews } from './components/WarNews';
import { CountriesAndForces } from './components/CountriesAndForces';
import { WeaponsManagement } from './components/WeaponsManagement';
import { BattleMaps } from './components/BattleMaps';
import { Settings } from './components/Settings';
import { DebugConsole } from './components/DebugConsole';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-tactical-bg text-tactical-text">
        {/* HUD Scanline Effect */}
        <div className="fixed inset-0 pointer-events-none hud-scanline opacity-20" />
        
        {/* Background Grid */}
        <div 
          className="fixed inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        <Navigation />
        
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveNews />} />
            <Route path="/events" element={<WarNews />} />
            <Route path="/maps" element={<BattleMaps />} />
            <Route path="/countries" element={<CountriesAndForces />} />
            <Route path="/weapons" element={<WeaponsManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug" element={<DebugConsole />} />
          </Routes>
        </main>

        {/* Footer Status Bar */}
        <footer className="fixed bottom-0 left-0 right-0 tactical-panel border-t border-tactical-border px-4 py-2 z-20">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">SYSTEM ONLINE</span>
              </div>
              <div className="text-tactical-muted">
                Last Update: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-tactical-muted">
                API Status: <span className="text-neon-400">OPERATIONAL</span>
              </div>
              <div className="text-tactical-muted">
                Active Events: <span className="text-red-400">47</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;