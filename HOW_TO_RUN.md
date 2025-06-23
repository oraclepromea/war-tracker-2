# War Tracker 2.0 - How to Run

## 🚀 Quick Start

### Option 1: Simple Start (Recommended)
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0"
./simple-start.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd "/Users/RoRo_HQ/War Tracker 2.0/backend"
npm run dev

# Terminal 2 - Frontend  
cd "/Users/RoRo_HQ/War Tracker 2.0/client"
npm run dev
```

## 📋 Prerequisites

- **Node.js** v18+ installed
- **npm** package manager
- **Supabase account** with project setup
- **OpenRouter API key** (for AI analysis)

## ⚙️ Initial Setup

### 1. Install Dependencies
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0"
./setup.sh
```

### 2. Configure Environment Variables

**Backend (.env):**
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/backend"
# Edit .env file with your credentials:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

**Client (.env):**
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/client"  
# Edit .env file:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🖥️ Starting the System

### Simple Start Script
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0"
chmod +x simple-start.sh
./simple-start.sh
```

**What it does:**
- Installs/updates dependencies
- Starts backend on port 3001
- Starts frontend on port 5173
- Begins RSS fetching every 10 minutes
- Starts AI analysis every 5 minutes

### Manual Start (Alternative)

**Terminal 1 - Backend:**
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/backend"
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/client"
npm install
npm run dev
```

## 🌐 Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/health
- **Live News:** http://localhost:5173 (Live News tab)
- **War Intelligence:** http://localhost:5173 (War News tab)

## 🔧 API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Manual RSS Sync
```bash
curl -X POST http://localhost:3001/api/jobs/news
```

### Get Latest News
```bash
curl http://localhost:3001/api/news
```

## 📊 System Status

### Backend Logs to Watch For:
```
✅ Supabase connection successful
🔄 Continuous RSS fetching started (every 10 minutes)  
🧠 AI analysis service started (every 5 minutes)
✅ BBC World: 10 articles, 8 new
🧠 Analyzing article: Breaking News...
💾 Stored war event: airstrike in Gaza
```

### Frontend Features:
- **Live News Tab:** Real-time RSS feeds (auto-refresh every 30s)
- **War News Tab:** AI-analyzed conflict events
- **Real-time Updates:** Articles appear as they're processed

## 🛠️ Troubleshooting

### Common Issues:

**"Invalid API key" Error:**
```bash
# Check your Supabase service role key in backend/.env
# Get fresh keys from: https://supabase.com/dashboard → Settings → API
```

**Port Already in Use:**
```bash
# Kill existing processes
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**RSS Feeds Not Working:**
```bash
# Check backend logs for network errors
# Manually trigger sync:
curl -X POST http://localhost:3001/api/jobs/news
```

**AI Analysis Not Running:**
```bash
# Ensure OPENROUTER_API_KEY is set in backend/.env
# Check backend logs for AI service status
```

### Reset Everything:
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0"
./setup.sh  # Reinstall dependencies
./simple-start.sh  # Fresh start
```

## 🔄 Development Workflow

### Backend Development:
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/backend"
npm run dev  # Auto-restart on changes
```

### Frontend Development:
```bash
cd "/Users/RoRo_HQ/War Tracker 2.0/client"
npm run dev  # Hot module reload
```

### Database Management:
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Tables:** `rss_articles`, `war_events`
- **Real-time:** Enabled for live updates

## 📈 Performance Tips

1. **RSS Fetching:** Runs every 10 minutes automatically
2. **AI Analysis:** Processes 5 articles every 5 minutes
3. **Rate Limiting:** 2-second delays between AI requests
4. **Auto-refresh:** Frontend polls backend every 30 seconds

## 🛑 Stopping the System

**Using Simple Start:**
```bash
# Press Ctrl+C in the terminal running simple-start.sh
```

**Manual Stop:**
```bash
# In each terminal, press Ctrl+C
# Or kill processes:
pkill -f "nodemon server.js"
pkill -f "vite"
```

## 📝 Logs Location

- **Backend:** Console output where `npm run dev` is running
- **Frontend:** Browser console (F12 → Console)
- **RSS Fetching:** Backend console every 10 minutes
- **AI Analysis:** Backend console every 5 minutes

## 🎯 Success Indicators

**System is working when you see:**
- ✅ Backend connected to Supabase
- ✅ RSS feeds fetching articles
- ✅ AI analysis processing articles  
- ✅ Live News tab showing articles
- ✅ War News tab showing analyzed events
- ✅ Real-time updates happening automatically

---

**Need Help?** Check the backend console logs first - they show exactly what's happening with RSS fetching, AI analysis, and database connections.