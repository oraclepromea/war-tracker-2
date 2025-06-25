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
    <nav style={{ 
      backgroundColor: '#111111', 
      borderBottom: '1px solid #333333',
      position: 'relative',
      zIndex: 30
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 1rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: '4rem' 
        }}>
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: '#00ff88' 
            }}
          >
            <div style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>⚡</div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#00ff88'
            }}>
              WAR TRACKER 2.0
            </div>
          </Link>

          <div style={{ 
            display: window.innerWidth >= 768 ? 'flex' : 'none',
            gap: '1.5rem'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease-in-out',
                  backgroundColor: location.pathname === item.path ? 'rgba(0, 255, 136, 0.2)' : 'transparent',
                  color: location.pathname === item.path ? '#00ff88' : '#888888',
                  border: location.pathname === item.path ? '1px solid rgba(0, 255, 136, 0.5)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    const target = e.target as HTMLElement;
                    target.style.color = '#00ff88';
                    target.style.backgroundColor = '#0a0a0a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    const target = e.target as HTMLElement;
                    target.style.color = '#888888';
                    target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: window.innerWidth < 768 ? 'block' : 'none',
              background: 'none',
              border: 'none',
              color: '#888888',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: '1.5rem', 
              height: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <span style={{
                backgroundColor: 'currentColor',
                height: '0.125rem',
                width: '1.5rem',
                transition: 'all 0.15s ease-in-out',
                transform: isOpen ? 'rotate(45deg) translateY(0.125rem)' : 'none'
              }}></span>
              <span style={{
                backgroundColor: 'currentColor',
                height: '0.125rem',
                width: '1.5rem',
                margin: '0.125rem 0',
                transition: 'all 0.15s ease-in-out',
                opacity: isOpen ? 0 : 1
              }}></span>
              <span style={{
                backgroundColor: 'currentColor',
                height: '0.125rem',
                width: '1.5rem',
                transition: 'all 0.15s ease-in-out',
                transform: isOpen ? 'rotate(-45deg) translateY(-0.125rem)' : 'none'
              }}></span>
            </div>
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ paddingBottom: '1rem' }}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  marginBottom: '0.5rem',
                  transition: 'all 0.15s ease-in-out',
                  backgroundColor: location.pathname === item.path ? 'rgba(0, 255, 136, 0.2)' : 'transparent',
                  color: location.pathname === item.path ? '#00ff88' : '#888888',
                  border: location.pathname === item.path ? '1px solid rgba(0, 255, 136, 0.5)' : '1px solid transparent'
                }}
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