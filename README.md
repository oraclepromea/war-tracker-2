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

# War Tracker 2.0 - Local Setup Guide

## Quick Start

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start Supabase locally (optional)
npx supabase start

# 4. Start the application
npm run dev
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (optional for local development)
- OpenRouter API key
- Supabase project

## Environment Setup

Create `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter AI API
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Local development
VITE_API_URL=http://localhost:3001
```

## Database Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project

2. **Run Database Migrations**: Execute these SQL commands in your Supabase SQL editor:

```sql
-- RSS Sources table
CREATE TABLE rss_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  last_fetched TIMESTAMP,
  fetch_interval INTEGER DEFAULT 1800,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RSS Articles table
CREATE TABLE rss_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL UNIQUE,
  source TEXT,
  published_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW(),
  is_processed BOOLEAN DEFAULT false
);

-- War Events table
CREATE TABLE war_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  casualties INTEGER,
  weapons_used TEXT[],
  source_country TEXT,
  target_country TEXT,
  confidence INTEGER,
  threat_level TEXT,
  article_id UUID REFERENCES rss_articles(id),
  article_title TEXT,
  article_url TEXT,
  processed_at TIMESTAMP DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Scheduler logs
CREATE TABLE scheduler_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type TEXT,
  articles_found INTEGER,
  processing_stats JSONB,
  status TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

## Running the System

### 1. Start the Client Application

```bash
cd client
npm run dev
```

This starts the React app at `http://localhost:5173`

### 2. Deploy Supabase Edge Functions

```bash
# Deploy RSS fetcher
npx supabase functions deploy fetch-rss-feeds

# Deploy AI analysis
npx supabase functions deploy analyze-war-intel

# Deploy batch processor
npx supabase functions deploy batch-analyze-articles

# Deploy scheduler
npx supabase functions deploy scheduler
```

### 3. Add RSS Sources

Use the dashboard or run:

```bash
curl -X POST "your_supabase_url/functions/v1/add-war-feeds" \
  -H "Authorization: Bearer your_service_role_key"
```

### 4. Set Up Automated Processing

Create a cron job or use Supabase's cron extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule RSS fetching every 30 minutes
SELECT cron.schedule(
  'fetch-rss-feeds',
  '*/30 * * * *',
  'SELECT net.http_post(
    url:=''your_supabase_url/functions/v1/scheduler'',
    headers:=''{"Authorization": "Bearer your_service_role_key"}''::jsonb
  );'
);
```

## Development Workflow

### 1. Monitor Logs

```bash
# Watch Supabase function logs
npx supabase functions logs --tail

# Watch client logs
cd client && npm run dev
```

### 2. Test Components

- **RSS Fetching**: Visit the Debug tab and click "Test RSS Feeds"
- **AI Analysis**: Check the Live News tab for processed articles
- **War Events**: View the War News tab for analyzed events

### 3. Development Commands

```bash
# Install all dependencies
npm run install:all

# Start development environment
npm run dev

# Build for production
npm run build

# Test Supabase functions locally
npx supabase functions serve
```

## Troubleshooting

### Common Issues

1. **No articles appearing**:
   - Check RSS sources are active
   - Verify Supabase functions are deployed
   - Check function logs for errors

2. **AI analysis not working**:
   - Verify OpenRouter API key is set
   - Check function timeout settings
   - Monitor processing logs

3. **Real-time updates not working**:
   - Verify Supabase real-time is enabled
   - Check WebSocket connections
   - Refresh the page

### Debug Commands

```bash
# Test Supabase connection
curl "your_supabase_url/rest/v1/rss_articles?limit=1" \
  -H "apikey: your_anon_key"

# Test AI function
curl -X POST "your_supabase_url/functions/v1/analyze-war-intel" \
  -H "Authorization: Bearer your_service_role_key" \
  -d '{"article_id": "test-id"}'

# Check function status
npx supabase functions list
```

## Production Deployment

1. **Environment Variables**: Set all production keys
2. **Domain Setup**: Configure custom domain
3. **Monitoring**: Set up error tracking
4. **Scaling**: Monitor function execution times
5. **Security**: Review RLS policies

## Features Overview

- **🔴 Live RSS Feed Monitoring**: Automatically fetches from multiple news sources
- **🤖 AI-Powered Analysis**: Uses OpenRouter/LLaMA to analyze articles for war events
- **⚡ Real-time Updates**: WebSocket connections for instant updates
- **🎯 War Intel Dashboard**: Comprehensive event tracking and filtering
- **🗺️ Geographic Mapping**: GPS coordinates for events
- **📊 Threat Assessment**: Color-coded threat levels and confidence scores# Updated Tue Jun 24 16:56:57 -04 2025
