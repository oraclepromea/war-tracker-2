# War Tracker 2.0 🎯

A real-time military conflict tracking system with AI-powered analysis, focusing on Middle East conflicts. Features a tactical HUD interface, live data aggregation from multiple sources, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Real-time Event Tracking** - Live updates from RSS feeds and news APIs
- **AI-Powered Analysis** - OpenRouter integration for event classification and threat assessment
- **Geographic Visualization** - Interactive maps with conflict heatmaps
- **Tactical Interface** - Military-style HUD with neon aesthetics
- **Multi-source Verification** - Cross-reference multiple news sources for credibility

### Data Sources
- Reuters Middle East Feed
- Associated Press World News
- BBC Middle East
- Times of Israel
- Haaretz
- Custom News API integration

### Technical Features
- **WebSocket Real-time Updates**
- **MongoDB Database** with optimized indexes
- **Redis Caching** for performance
- **Docker Containerization**
- **CI/CD Pipeline** with GitHub Actions
- **Security Scanning** with Trivy
- **Nginx Reverse Proxy** for production

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Three.js** for 3D weapon visualizations
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **WebSocket** for real-time communication
- **OpenRouter API** for AI analysis
- **JWT Authentication**
- **Rate Limiting** and security middleware

### Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** for CI/CD
- **Nginx** for reverse proxy
- **Redis** for caching
- **MongoDB** for data persistence

## 🚀 Quick Start

# War Tracker 2.0 - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (optional - will run in demo mode without it)
- Redis (optional - for job queues)

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd "War Tracker 2.0"
chmod +x setup.sh
./setup.sh
```

2. **Configure environment:**
```bash
# Edit .env file with your API keys
cp .env.example .env
# Add your NewsAPI key from https://newsapi.org
```

3. **Start the application:**
```bash
npm run dev
```

## 🔄 What We've Implemented

### ✅ Phase 1: Foundation Complete
- **Database Models**: Event, NewsItem, Weapon, Attack
- **API Endpoints**: `/api/events`, `/api/news`, `/api/jobs/news`
- **Real-time News Aggregation**: RSS feeds from Reuters, BBC, Al Jazeera
- **Frontend Integration**: React Query hooks for real data consumption

### 📊 Current Data Sources
- **Reuters RSS**: International news feed
- **BBC World News**: Global coverage
- **Al Jazeera**: Middle East focused
- **NewsAPI**: Global aggregation (with API key)

### 🎯 Working Features
1. **Real-time Event Timeline**: Replaces mock data with live RSS feeds
2. **News Aggregation**: Fetches and processes war-related articles
3. **Data Source Monitoring**: Live status in Settings tab
4. **Manual Sync**: Trigger data refresh for development

## 🧪 Testing the System

### Test the API:
```bash
# Health check
curl http://localhost:3001/health

# Trigger news aggregation
curl -X POST http://localhost:3001/api/jobs/news

# Check recent events
curl http://localhost:3001/api/events/recent

# Check latest news
curl http://localhost:3001/api/news/latest
```

### Frontend Features:
- **War Events Timeline**: Now shows real events from RSS feeds
- **Settings > Data Sources**: Shows live source status and sync buttons
- **Real-time Toggle**: Enable/disable live updates
- **Severity Filtering**: Filter events by importance level

## 🔧 Development Commands

```bash
# Start both client and server
npm run dev

# Start server only
cd server && npm run dev

# Start client only  
cd client && npm run dev

# Run news aggregation job
curl -X POST http://localhost:3001/api/jobs/news
```

## 📈 Next Implementation Steps

### Phase 2: Enhanced Data Sources
- [ ] ACLED conflict database integration
- [ ] GDELT global events monitoring
- [ ] Weapons database sync with Wikipedia images
- [ ] Attack tracking with weapon correlations

### Phase 3: Real-time Features
- [ ] WebSocket connections for live updates
- [ ] Automated job scheduling with node-cron
- [ ] Map component with attack markers
- [ ] Alert system for critical events

### Phase 4: Production Ready
- [ ] Rate limiting and API security
- [ ] Redis caching for performance
- [ ] Error monitoring and logging
- [ ] Docker containerization

## 🐛 Troubleshooting

### Common Issues:

**Database connection fails:**
```bash
# Start PostgreSQL
brew services start postgresql

# Create database manually
createdb war_tracker_db
```

**Server won't start:**
```bash
# Check dependencies
cd server && npm install
npm run build
```

**No events showing:**
```bash
# Trigger manual news sync
curl -X POST http://localhost:3001/api/jobs/news
```

**CORS errors:**
- Ensure frontend is running on http://localhost:3000
- Check server CORS configuration

## 📚 Documentation

- **Setup Guide**: `docs/DATA_PIPELINE_SETUP_GUIDE.md`
- **API Documentation**: Available at `/api/health`
- **Environment Variables**: See `.env.example`

## 🎯 Current Status

✅ **Working**: RSS news aggregation, event timeline, API endpoints
✅ **Live Data**: War Events Timeline now uses real RSS feeds
✅ **Settings Integration**: Real data source monitoring
🔄 **In Progress**: Database persistence, automated scheduling
⏳ **Next**: ACLED integration, weapon tracking, map features

The system is now functional with real RSS data replacing the mock events!

---

**War Tracker 2.0** - Real-time conflict intelligence with AI-powered analysis 🎯