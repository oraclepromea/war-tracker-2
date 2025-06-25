import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: '🎯' },
    { path: '/live', label: 'LIVE NEWS', icon: '📡' },
    { path: '/events', label: 'WAR EVENTS', icon: '⚔️' },
    { path: '/countries', label: 'COUNTRIES', icon: '🌍' },
    { path: '/weapons', label: 'WEAPONS', icon: '🚀' }
  ];

  return (
    <nav className="bg-tactical-panel border-b border-tactical-border relative z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-2xl">⚡</div>
            <div className="text-xl font-tactical text-neon-400">
              WAR TRACKER 2.0
            </div>
          </Link>

          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded font-mono text-sm transition-all ${
                  location.pathname === item.path
                    ? 'bg-neon-400/20 text-neon-400 border border-neon-400/50'
                    : 'text-tactical-muted hover:text-neon-400 hover:bg-tactical-bg'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-tactical-muted hover:text-neon-400"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span
                className={`block h-0.5 w-6 bg-current transition-all ${
                  isOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-current transition-all ${
                  isOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-current transition-all ${
                  isOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded font-mono text-sm transition-all ${
                  location.pathname === item.path
                    ? 'bg-neon-400/20 text-neon-400 border border-neon-400/50'
                    : 'text-tactical-muted hover:text-neon-400 hover:bg-tactical-bg'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  );
}