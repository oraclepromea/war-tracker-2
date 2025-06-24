/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tactical-bg': '#0a0a0a',
        'tactical-panel': '#111111',
        'tactical-border': '#333333',
        'tactical-text': '#e0e0e0',
        'tactical-muted': '#888888',
        'neon': {
          400: '#00ff88',
          500: '#00cc6a',
          600: '#009954',
          950: '#001a0f',
        }
      },
      fontFamily: {
        'tactical': ['Orbitron', 'monospace'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}