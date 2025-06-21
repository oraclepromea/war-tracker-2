import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { WarEvents } from '@/components/WarEvents';
import { CountriesAndForces } from '@/components/CountriesAndForces';
import { Settings } from '@/components/Settings';
import { DebugConsole } from '@/components/DebugConsole';
import { BattleMaps } from '@/components/BattleMaps';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'events':
        return <WarEvents />;
      case 'maps':
        return <BattleMaps />;
      case 'countries':
        return <CountriesAndForces />;
      case 'settings':
        return <Settings />;
      case 'debug':
        return <DebugConsole />;
      default:
        return <Dashboard />;
    }
  };

  return (
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

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 tactical-panel border-t border-tactical-border px-4 py-2 z-20">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400">ONLINE</span>
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
  );
}

export default App;