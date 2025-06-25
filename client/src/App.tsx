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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#e0e0e0',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        {/* HUD Scanline Effect */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          opacity: 0.2,
          background: `linear-gradient(
            transparent 50%, 
            rgba(0, 255, 136, 0.03) 50%, 
            rgba(0, 255, 136, 0.03) 51%, 
            transparent 51%
          )`,
          backgroundSize: '100% 2px',
          animation: 'scanline 2s linear infinite'
        }} />
        
        {/* Background Grid */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />

        <Navigation />
        
        <main style={{ position: 'relative', zIndex: 10 }}>
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
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#111111',
          borderTop: '1px solid #333333',
          padding: '0.5rem 1rem',
          zIndex: 20
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#4ade80',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ color: '#4ade80' }}>SYSTEM ONLINE</span>
              </div>
              <div style={{ color: '#888888' }}>
                Last Update: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#888888' }}>
                API Status: <span style={{ color: '#00ff88' }}>OPERATIONAL</span>
              </div>
              <div style={{ color: '#888888' }}>
                Active Events: <span style={{ color: '#f87171' }}>47</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;