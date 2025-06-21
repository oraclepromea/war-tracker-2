# War Tracker 2.0 - Data Pipeline Setup Guide

## Overview
This guide will help you implement a comprehensive real-time data ingestion system that replaces mock data with live conflict information from multiple sources including ACLED, GDELT, news APIs, and RSS feeds.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Data Models Implementation](#data-models-implementation)
5. [Data Ingestion Jobs](#data-ingestion-jobs)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)
8. [Scheduling & Automation](#scheduling--automation)
9. [Testing & Validation](#testing--validation)
10. [Troubleshooting](#troubleshooting)
11. [Deployment Considerations](#deployment-considerations)

## Prerequisites

### Required Dependencies
```bash
# Backend dependencies
npm install --save typeorm pg @types/pg node-cron axios rss-parser bull bullmq ioredis
npm install --save-dev @types/node @types/axios

# Frontend dependencies (if not already installed)
npm install --save @tanstack/react-query leaflet react-leaflet @types/leaflet
```

### API Keys Required
- **ACLED API**: [Register at acleddata.com](https://acleddata.com/data-export-tool/)
- **NewsAPI**: [Get key at newsapi.org](https://newsapi.org/)
- **Guardian API**: [Register at open-platform.theguardian.com](https://open-platform.theguardian.com/)
- **GDELT**: No key required (public access)

### Database Requirements
- PostgreSQL 12+ (recommended)
- Redis (for job queues)
- Minimum 2GB RAM
- 10GB storage for initial data

## Database Setup

### 1. PostgreSQL Installation
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb war_tracker_db

# Create user
psql -d war_tracker_db -c "CREATE USER war_tracker WITH PASSWORD 'your_password';"
psql -d war_tracker_db -c "GRANT ALL PRIVILEGES ON DATABASE war_tracker_db TO war_tracker;"
```

### 2. Redis Installation
```bash
# macOS
brew install redis
brew services start redis
```

### 3. Database Configuration
Create `/Users/RoRo_HQ/War Tracker 2.0/server/src/config/database.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Event } from '../models/Event';
import { Attack } from '../models/Attack';
import { Weapon } from '../models/Weapon';
import { NewsItem } from '../models/NewsItem';
import { CasualtyReport } from '../models/CasualtyReport';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'war_tracker',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'war_tracker_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Event, Attack, Weapon, NewsItem, CasualtyReport],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
```

## Environment Configuration

### 1. Create Environment Files
Create `/Users/RoRo_HQ/War Tracker 2.0/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=war_tracker
DB_PASSWORD=your_password
DB_NAME=war_tracker_db

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
ACLED_API_KEY=your_acled_key
ACLED_EMAIL=your_email@domain.com
NEWSAPI_KEY=your_newsapi_key
GUARDIAN_API_KEY=your_guardian_key

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Job Configuration
ENABLE_JOBS=true
JOB_CONCURRENCY=3

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Environment Variables Validation
Create `/Users/RoRo_HQ/War Tracker 2.0/server/src/config/validateEnv.ts`:

```typescript
export function validateEnvironment(): void {
  const required = [
    'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME',
    'ACLED_API_KEY', 'ACLED_EMAIL', 'NEWSAPI_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment validation passed');
}
```

## Data Models Implementation

### Implementation Order
1. Base models (Event, NewsItem)
2. Complex models (Attack, Weapon)
3. Relationship models (CasualtyReport)

### Database Migration Strategy
```bash
# Generate initial migration
npx typeorm migration:generate -d src/config/database.ts src/migrations/InitialSchema

# Run migrations
npx typeorm migration:run -d src/config/database.ts
```

### Model Validation
Each model should include:
- Input validation decorators
- Index optimization
- Proper foreign key relationships
- Audit fields (createdAt, updatedAt)

## Data Ingestion Jobs

### 1. Job Priority System
```
High Priority (every 15 min): Breaking news, real-time events
Medium Priority (every 30 min): News aggregation, social media
Low Priority (daily): Historical data, weapon specs, static data
```

### 2. Error Handling Strategy
```typescript
// Implement in each job
class JobErrorHandler {
  static async handleRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

### 3. Data Deduplication
```typescript
// Implement fingerprinting for duplicate detection
class DataDeduplication {
  static generateFingerprint(data: any): string {
    const key = `${data.source}-${data.date}-${data.location || data.title}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
```

## API Endpoints

### 1. RESTful API Structure
```
GET /api/events              - Paginated events list
GET /api/events/:id          - Single event details
GET /api/attacks             - Paginated attacks list  
GET /api/attacks/:id         - Attack with weapons/casualties
GET /api/weapons             - Weapons catalog
GET /api/news                - Recent news items
GET /api/casualties          - Casualty reports
GET /api/stats               - Dashboard statistics
```

### 2. Response Standardization
```typescript
interface APIResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    lastUpdated: string;
    source: string;
    cacheExpiry?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 3. Caching Strategy
```typescript
// Redis caching for frequently accessed data
const CACHE_KEYS = {
  RECENT_EVENTS: 'events:recent:24h',
  WEAPON_STATS: 'weapons:stats',
  COUNTRY_SUMMARY: 'countries:summary',
  NEWS_HEADLINES: 'news:headlines:1h'
};

const CACHE_TTL = {
  SHORT: 5 * 60,      // 5 minutes
  MEDIUM: 30 * 60,    // 30 minutes  
  LONG: 24 * 60 * 60  // 24 hours
};
```

## Frontend Integration

### 1. Replace Mock Data Sources
Update `/Users/RoRo_HQ/War Tracker 2.0/client/src/components/Settings.tsx`:

```typescript
// Replace existing data sources section
const realDataSources = [
  {
    id: 'acled',
    name: 'ACLED Conflict Database',
    type: 'API',
    status: 'active',
    url: 'https://api.acleddata.com',
    description: 'Armed Conflict Location & Event Data',
    reliability: 95,
    lastUpdate: '2 minutes ago',
    recordsToday: 47
  },
  {
    id: 'newsapi',
    name: 'NewsAPI',
    type: 'API', 
    status: 'active',
    url: 'https://newsapi.org',
    description: 'Global news aggregation',
    reliability: 92,
    lastUpdate: '5 minutes ago',
    recordsToday: 234
  },
  {
    id: 'reuters',
    name: 'Reuters RSS',
    type: 'RSS',
    status: 'active', 
    url: 'https://feeds.reuters.com/reuters/worldNews',
    description: 'International news feed',
    reliability: 98,
    lastUpdate: '1 minute ago',
    recordsToday: 89
  },
  {
    id: 'bbc',
    name: 'BBC World News',
    type: 'RSS',
    status: 'active',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml', 
    description: 'BBC international coverage',
    reliability: 96,
    lastUpdate: '3 minutes ago',
    recordsToday: 67
  },
  {
    id: 'gdelt',
    name: 'GDELT Project',
    type: 'API',
    status: 'active',
    url: 'https://api.gdeltproject.org',
    description: 'Global events monitoring',
    reliability: 88,
    lastUpdate: '15 minutes ago',
    recordsToday: 156
  }
];
```

### 2. Real-time Event Timeline
Update `/Users/RoRo_HQ/War Tracker 2.0/client/src/components/WarEventsTimeline.tsx`:

```typescript
// Replace mock events with real API calls
const { data: realTimeEvents, isLoading } = useQuery({
  queryKey: ['events', 'recent'],
  queryFn: async () => {
    const response = await fetch('/api/events?limit=20&sortBy=date&order=desc');
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },
  refetchInterval: 30000, // 30 seconds
  staleTime: 10000 // 10 seconds
});
```

### 3. Data Integration Points
```typescript
// Update these components to use real data:
// - WarEventsTimeline.tsx (replace mockEvents)
// - CountriesAndForces.tsx (integrate with weapons API)
// - Settings.tsx (show real data source status)
// - Dashboard statistics
// - Map component markers
```

## Scheduling & Automation

### 1. Job Queue Setup
Create `/Users/RoRo_HQ/War Tracker 2.0/server/src/queues/jobQueue.ts`:

```typescript
import Bull from 'bull';

export const dataIngestionQueue = new Bull('data ingestion', {
  redis: process.env.REDIS_URL
});

// Job processors
dataIngestionQueue.process('acled-sync', 1, require('./processors/acledProcessor'));
dataIngestionQueue.process('news-sync', 2, require('./processors/newsProcessor'));
dataIngestionQueue.process('weapons-sync', 1, require('./processors/weaponsProcessor'));
```

### 2. Monitoring & Logging
```typescript
// Add job monitoring
dataIngestionQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.data.type} completed in ${job.processedOn - job.timestamp}ms`);
});

dataIngestionQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.data.type} failed:`, err.message);
});
```

## Testing & Validation

### 1. Data Quality Checks
```typescript
// Implement data validation
class DataQualityChecker {
  static validateEvent(event: Event): boolean {
    return !!(
      event.date &&
      event.country &&
      event.description &&
      event.source &&
      event.sourceId
    );
  }

  static validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}
```

### 2. API Testing
```bash
# Test endpoints
curl -X GET "http://localhost:3001/api/events?limit=5"
curl -X GET "http://localhost:3001/api/attacks?days=7"
curl -X GET "http://localhost:3001/api/weapons?category=aircraft"
```

### 3. Performance Testing
```typescript
// Monitor API response times
const responseTimeMonitor = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow API response: ${req.path} took ${duration}ms`);
    }
  });
  next();
};
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Check connection
psql -h localhost -U war_tracker -d war_tracker_db -c "SELECT NOW();"

# Reset connections
pkill -f postgres
brew services restart postgresql
```

#### 2. API Rate Limiting
```typescript
// Implement exponential backoff
class RateLimitHandler {
  static async handleRateLimit(error: any, retryAfter: number = 60) {
    if (error.status === 429) {
      console.warn(`Rate limited, waiting ${retryAfter}s`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return true; // Retry
    }
    return false; // Don't retry
  }
}
```

#### 3. Memory Issues
```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 512 * 1024 * 1024) { // 512MB
    console.warn('High memory usage detected:', usage);
  }
}, 30000);
```

#### 4. Job Queue Failures
```bash
# Clear failed jobs
redis-cli FLUSHDB

# Monitor queue
redis-cli MONITOR
```

### Debugging Tools
```typescript
// Add debug logging
const DEBUG = process.env.NODE_ENV === 'development';

class Logger {
  static debug(message: string, data?: any) {
    if (DEBUG) {
      console.log(`🔍 ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  static error(message: string, error?: any) {
    console.error(`❌ ${new Date().toISOString()} - ${message}`, error || '');
  }
}
```

## Deployment Considerations

### 1. Production Environment Setup
```env
# Production .env
NODE_ENV=production
DB_SSL=true
ENABLE_CORS=false
LOG_LEVEL=warn
CACHE_TTL_MULTIPLIER=2
```

### 2. Scaling Considerations
- Use Redis Cluster for job queues
- Implement database read replicas
- Add CDN for static assets
- Use connection pooling

### 3. Monitoring Setup
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    apis: await checkExternalAPIs()
  };
  
  const isHealthy = Object.values(checks).every(Boolean);
  res.status(isHealthy ? 200 : 503).json(checks);
});
```

### 4. Backup Strategy
```bash
# Database backup
pg_dump war_tracker_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backups (crontab)
0 2 * * * pg_dump war_tracker_db > /backups/daily_$(date +\%Y\%m\%d).sql
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Database setup and models
- [ ] Basic API endpoints
- [ ] Environment configuration
- [ ] Error handling framework

### Phase 2: Data Ingestion
- [ ] ACLED integration
- [ ] News API integration
- [ ] RSS feed processing
- [ ] Weapons sync with Wikipedia

### Phase 3: Real-time Features
- [ ] Job scheduling
- [ ] WebSocket connections
- [ ] Frontend real-time updates
- [ ] Map integration

### Phase 4: Production Ready
- [ ] Performance optimization
- [ ] Monitoring setup
- [ ] Backup procedures
- [ ] Security hardening

## Security Considerations

### 1. API Security
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 2. Data Sanitization
```typescript
// Input sanitization
import { body, validationResult } from 'express-validator';

const validateEventInput = [
  body('country').isLength({ min: 2, max: 100 }).escape(),
  body('description').isLength({ min: 10, max: 1000 }).escape(),
  // ... other validations
];
```

### 3. Environment Security
- Use secrets management (AWS Secrets Manager, Azure Key Vault)
- Rotate API keys regularly
- Implement proper CORS policies
- Use HTTPS in production

## Maintenance Procedures

### 1. Regular Tasks
- Weekly data cleanup (remove old duplicates)
- Monthly API key rotation
- Quarterly performance reviews
- Annual security audits

### 2. Monitoring Alerts
```typescript
// Set up alerts for:
// - API failures > 5% in 1 hour
// - Database connection failures
// - Memory usage > 80%
// - Job queue backlog > 1000
```

This comprehensive guide provides a roadmap for implementing the integrated War Tracker data pipeline system. Follow the phases sequentially and refer to the troubleshooting section for common issues.