# Live War Tracker System - Complete Build Guide

## Overview
Building a real-time war intelligence system with RSS ingestion, AI analysis, and live dashboard using Supabase integration.

## System Architecture
```
RSS Feeds → RSS Fetcher → rss_articles → AI Analyzer → war_events → Dashboard
                ↓                           ↓             ↓
            Supabase DB ←→ Edge Functions ←→ Real-time UI
```

## Phase 1: Database Foundation ✅ COMPLETED

### Supabase Tables Created
- `rss_articles` - Raw news from RSS feeds
- `war_events` - Structured war intelligence 
- `validation_errors` - Article validation logs
- `performance_metrics` - Processing performance data
- `connection_errors` - DNS/connection failure logs
- `skipped_logs` - Non-war articles skipped

### Key Features Implemented
- SHA-256 content hashing for duplicate detection
- Foreign key relationships
- Automatic triggers for hash generation
- Compound indexes for performance
- Row Level Security (RLS) policies

## Phase 2: RSS Ingestion System ✅ COMPLETED

### Components Built
- `lib/config.js` - Configuration management with DNS cache
- `lib/article-validator.js` - Content validation and duplicate detection
- `lib/rss-fetcher.js` - RSS fetching with retry logic
- `rss-fetcher.js` - Memory-optimized batch processing

### Key Features
- DNS caching with fallback URLs
- Levenshtein distance similarity detection (85% threshold)
- Memory management with garbage collection
- Exponential backoff retry logic
- Comprehensive error logging to Supabase

## Phase 3: AI Analysis Engine ✅ COMPLETED

### Edge Function: `analyze-war-intel`
- Location: `/supabase/functions/analyze-war-intel/index.ts`
- OpenRouter AI integration with Llama 3.1
- War keyword pre-filtering
- Structured JSON extraction
- Confidence scoring (60% minimum threshold)

### Validation Schema
```typescript
event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic'
country: string (primary location)
region: string (state/province)
casualties: number | null
weapons_used: string[] | null
confidence: number (0-100)
threat_level: 'low' | 'medium' | 'high' | 'critical'
```

## Phase 4: Next Steps (Immediate)

### 1. API Key Setup
```bash
supabase secrets set OPENROUTER_API_KEY=your_key_here
```

### 2. Missing Table Creation
```sql
CREATE TABLE skipped_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES rss_articles(id),
  article_title text,
  article_url text,
  article_source text,
  skip_reason text,
  metadata jsonb DEFAULT '{}',
  skipped_at timestamptz DEFAULT now()
);
```

### 3. Automated Processing Options

#### Option A: Database Trigger
```sql
CREATE OR REPLACE FUNCTION process_new_article()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function via HTTP request
  PERFORM net.http_post(
    'https://your-project.supabase.co/functions/v1/analyze-war-intel',
    json_build_object('article_id', NEW.id)::text,
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_article
  AFTER INSERT ON rss_articles
  FOR EACH ROW
  EXECUTE FUNCTION process_new_article();
```

#### Option B: Scheduled Processing
```bash
# Cron job every hour
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-batch
```

## Phase 5: Frontend Components (To Build)

### Live News Page (`/src/pages/LiveNews.tsx`)
```typescript
/*
GOAL: Display live RSS news feeds in real time
- Supabase subscription to rss_articles
- Real-time updates with .on('INSERT')
- Search and filter capabilities
- Keyword highlighting
*/
```

### War Intel Dashboard (`/src/pages/WarNews.tsx`)
```typescript
/*
GOAL: Display analyzed war events
- Subscribe to war_events table
- Color-coded threat levels
- Event details with confidence scores
- Filter by country/threat level
*/
```

### WW3 Meter (`/src/components/WW3Meter.tsx`)
```typescript
/*
GOAL: Real-time conflict escalation meter
- Pull from ww3_meter table
- Color-coded gauge (0-100)
- Trend visualization
- Admin score updates
*/
```

### Battle Map (`/src/pages/BattleMap.tsx`)
```typescript
/*
GOAL: Interactive map of war events
- Plot events using coordinates
- Marker colors by threat level
- Real-time updates via subscriptions
- Layer toggles by event type
*/
```

## Phase 6: Advanced Features

### Geolocation Services
- Integrate geocoding APIs (Google/MapBox)
- Convert country/region → coordinates
- Reverse geocoding for precision

### Real-time Updates
- Supabase realtime subscriptions
- WebSocket connections
- Live event streaming

### Monitoring & Alerts
- Dead letter queue for failures
- Performance dashboards
- Critical event alerts

## Current Status

### ✅ Completed
- Database schema with validation
- RSS fetching with memory optimization
- Article validation and duplicate detection
- AI analysis Edge Function
- Error handling and logging

### 🔄 In Progress
- OpenRouter API integration testing
- Automated processing setup

### 📋 Next Up
- Frontend dashboard components
- Real-time subscriptions
- Map visualization
- WW3 meter implementation

## File Structure
```
/Users/RoRo_HQ/War Tracker 2.0/
├── lib/
│   ├── config.js                 ✅ Configuration management
│   ├── article-validator.js      ✅ Validation & duplicates
│   └── rss-fetcher.js            ✅ RSS ingestion
├── supabase/functions/
│   └── analyze-war-intel/
│       └── index.ts              ✅ AI analysis
├── migrations/
│   └── add_article_validation.sql ✅ Schema updates
├── debug/
│   ├── *.sql                     ✅ Debug queries
│   └── *.sh                      ✅ Test scripts
└── docs/
    ├── next-steps.md             ✅ Roadmap
    └── build-reference.md        📄 This document
```

## Testing Commands

### Test Edge Function
```bash
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM" \
-d '{"article_id": "your-article-uuid"}'
```

### Find Test Articles
```sql
SELECT id, title, is_processed FROM rss_articles 
WHERE is_processed = false 
ORDER BY created_at DESC LIMIT 5;
```

### Reset Article for Testing
```sql
UPDATE rss_articles 
SET is_processed = false 
WHERE id = 'article-uuid';
```

## Performance Metrics

### Memory Management
- Batch size: 10 articles
- Memory threshold: 100MB RSS
- GC interval: Every 5 batches
- DNS cache TTL: 5 minutes

### AI Analysis
- Model: Llama 3.1 8B (free tier)
- Timeout: 5 seconds
- Confidence threshold: 60%
- Rate limit: 10 requests/minute

### Validation Rules
- Title: 3-500 characters
- Description: 10-2000 characters  
- Similarity threshold: 85%
- URL format validation with blacklist

---

*Last Updated: Based on current implementation status*
*Next Milestone: OpenRouter integration and frontend development*