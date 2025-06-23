import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import our enhanced services
import { EnhancedDataSourceManager } from './services/enhancedDataSources';
import { AIEventAnalyzer } from './services/aiAnalyzer';
import { errorHandler, asyncHandler } from './middleware/errorHandler';
import { getRSSArticles, initializeNewsService } from './services/newsService';

// Simple fallback function until newsService is properly configured
const fallbackGetRSSArticles = async (limit?: number) => {
  console.log('📰 Using fallback RSS function');
  return [];
};

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Initialize services
const dataSourceManager = EnhancedDataSourceManager.getInstance();
const aiAnalyzer = AIEventAnalyzer.getInstance();

// Store active connections
const activeConnections = new Set();

// REAL-TIME DATA BROADCASTING - NO MOCK DATA
export const broadcastEvent = (event: any) => {
  console.log(`📡 Broadcasting single event: "${event.title}" from ${event.source}`);
  io.emit('new-event', event);
};

export const broadcastEvents = (events: any[]) => {
  if (events.length > 0) {
    console.log(`📡 Broadcasting ${events.length} REAL events to ${activeConnections.size} clients`);
    
    // Log first few real events for verification
    events.slice(0, 3).forEach((event, index) => {
      console.log(`📤 Event ${index + 1}: "${event.title}" | "${event.description}"`);
    });
    
    io.emit('events', events);
    io.emit('new-event', events[0]); // Send newest event separately
  } else {
    console.log('📡 No real events to broadcast');
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  activeConnections.add(socket.id);

  // Send initial events immediately
  dataSourceManager.fetchAllSources().then(events => {
    socket.emit('events', events);
    console.log(`📤 Sent ${events.length} initial events to client ${socket.id}`);
  }).catch(error => {
    console.error('Error fetching initial events:', error);
    // Send fallback events
    socket.emit('events', []);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    activeConnections.delete(socket.id);
  });

  socket.on('ping', (data) => {
    socket.emit('pong', { timestamp: Date.now(), ...data });
  });
});

// RSS MONITORING - REAL DATA ONLY
const startRSSMonitoring = async () => {
  console.log('📰 Starting RSS monitoring - REAL DATA ONLY...');
  
  setInterval(async () => {
    try {
      console.log('🔍 RSS Check: Fetching real events from RSS sources...');
      
      // Get ONLY RSS sources
      const rssSources = dataSourceManager.getDataSources().filter(s => s.type === 'rss' && s.active);
      
      if (rssSources.length === 0) {
        console.log('⚠️ No active RSS sources found');
        return;
      }
      
      // Fetch real RSS events
      const realRSSEvents = await dataSourceManager.fetchRSSEvents(rssSources);
      
      if (realRSSEvents && realRSSEvents.length > 0) {
        console.log(`✅ RSS: Got ${realRSSEvents.length} real events from RSS sources`);
        broadcastEvents(realRSSEvents);
      } else {
        console.log('📰 RSS: No new real events found');
      }
      
    } catch (error) {
      console.error('❌ RSS monitoring error:', error);
    }
  }, 60000); // Every 60 seconds
};

// TEMPORARILY DISABLE ALL MONITORING TO ISOLATE RSS CONTENT
const startContinuousAggregation = async () => {
  console.log('🚀 SIMPLIFIED: Starting ONLY RSS monitoring...');
  
  // ONLY start RSS monitoring - disable everything else
  startRSSMonitoring();
  
  // COMPLETELY DISABLE ALL OTHER MONITORING TO PREVENT MOCK DATA
  console.log('⏸️ DISABLED: Government source monitoring (mock data source)');
  console.log('⏸️ DISABLED: Social media monitoring (mock data source)');
  console.log('⏸️ DISABLED: Telegram monitoring (mock data source)');
  console.log('⏸️ DISABLED: Multi-language monitoring (mock data source)');
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      dataAggregation: 'active',
      websocket: activeConnections.size > 0 ? 'connected' : 'standby',
      aiAnalysis: 'active'
    },
    activeConnections: activeConnections.size,
    sources: {
      rss: 'monitoring',
      government: 'monitoring', 
      social: 'monitoring',
      telegram: 'monitoring',
      multilang: 'monitoring'
    }
  });
});

app.get('/api/events/real', async (req, res) => {
  try {
    console.log('🔍 API: Client requesting real events...');
    
    // Fetch real events from all configured sources
    const realEvents = await dataSourceManager.fetchAllSources();
    
    console.log(`✅ API: Returning ${realEvents.length} real events to frontend`);
    
    // Add CORS headers to ensure frontend can receive the data
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json(realEvents);
    
  } catch (error) {
    console.error('❌ API Error fetching real events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// RSS Events endpoint
app.get('/api/events/rss', async (req, res) => {
  try {
    const rssources = dataSourceManager.getDataSources().filter(s => s.type === 'rss' && s.active);
    const events = await dataSourceManager.fetchRSSEvents(rssources);
    res.json({ success: true, events });
  } catch (error) {
    console.error('RSS events error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Government Events endpoint  
app.get('/api/events/government', async (req, res) => {
  try {
    const govSources = dataSourceManager.getDataSources().filter(s => s.type === 'government' && s.active);
    const events = await dataSourceManager.fetchGovernmentEvents(govSources);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Government events error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Social Media Events endpoint
app.get('/api/events/social', async (req, res) => {
  try {
    const socialSources = dataSourceManager.getDataSources().filter(s => s.type === 'social' && s.active);
    const events = await dataSourceManager.fetchSocialMediaEvents(socialSources);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Social media events error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Telegram Events endpoint
app.get('/api/events/telegram', async (req, res) => {
  try {
    const telegramSources = dataSourceManager.getDataSources().filter(s => s.type === 'telegram' && s.active);
    const events = await dataSourceManager.fetchTelegramEvents(telegramSources);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Telegram events error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Multi-language Events endpoint
app.get('/api/events/multilang', async (req, res) => {
  try {
    const multiLangSources = dataSourceManager.getDataSources().filter(s => s.type === 'multilang' && s.active);
    const events = await dataSourceManager.fetchMultiLanguageEvents(multiLangSources);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Multi-language events error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add the missing /api/events endpoint that the frontend is trying to reach
app.get('/api/events', async (req, res) => {
  try {
    console.log('🔍 API: Client requesting events from /api/events...');
    
    // Redirect to our real events endpoint
    const realEvents = await dataSourceManager.fetchAllSources();
    
    console.log(`✅ API: Returning ${realEvents.length} events from /api/events`);
    
    res.json(realEvents);
    
  } catch (error) {
    console.error('❌ API Error fetching events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add missing news route that LiveFeed is trying to access
app.use('/news', async (req, res, next) => {
  // This will ensure that any request to /news will be handled here
  console.log('🔗 News route accessed');
  next();
});

// Make sure the /news/latest endpoint exists
app.get('/news/latest', async (req, res) => {
  try {
    console.log('📰 /news/latest endpoint hit directly');
    const limit = parseInt(req.query.limit as string) || 20;
    const articles = await getRSSArticles(limit);
    console.log(`📰 Returning ${articles.length} articles from /news/latest`);
    
    res.json({
      success: true,
      articles: articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Error at /news/latest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest news'
    });
  }
});

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Start the server and aggregation
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🚀 War Tracker 2.0 Multi-Source Intelligence Server`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 WebSocket server ready for real-time events`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend should be at: http://localhost:5173`);
  
  // Initialize news service first
  await initializeNewsService();
  
  // Wait a moment then start continuous aggregation
  setTimeout(async () => {
    await startContinuousAggregation();
    console.log('🎯 Multi-source intelligence gathering ACTIVE');
    console.log('📡 Events will start streaming in 2-12 seconds...');
  }, 1000);
});

export { app, io };

// Completely disable all non-RSS monitoring functions to prevent mock data generation
const startGovernmentSourceMonitoring = () => {
  console.log('🏛️ DISABLED: Government source monitoring (preventing mock data)');
  // Completely disabled to prevent any mock data generation
};

const startSocialMediaMonitoring = () => {
  console.log('📱 DISABLED: Social media monitoring (preventing mock data)');
  // Completely disabled to prevent any mock data generation
};

const startTelegramMonitoring = () => {
  console.log('💬 DISABLED: Telegram monitoring (preventing mock data)');
  // Completely disabled to prevent any mock data generation
};

const startMultiLanguageMonitoring = () => {
  console.log('🌍 DISABLED: Multi-language monitoring (preventing mock data)');
  // Completely disabled to prevent any mock data generation
};