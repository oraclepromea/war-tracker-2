import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EnhancedDataSourceManager } from './services/enhancedDataSources';
import { AIEventAnalyzer } from './services/aiAnalyzer';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize services
// Initialize services
const dataSourceManager = EnhancedDataSourceManager.getInstance();
const aiAnalyzer = AIEventAnalyzer.getInstance();
// Store active connections
const activeConnections = new Set();

// Real-time event broadcasting
export const broadcastEvent = (event: any) => {
  io.emit('new-event', event);
  console.log(`📡 Broadcasting event: ${event.title}`);
};

export const broadcastEvents = (events: any[]) => {
  io.emit('events', events);
  console.log(`📡 Broadcasting ${events.length} events`);
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  activeConnections.add(socket.id);

  // Send initial events
  dataSourceManager.fetchAllSources().then(events => {
    socket.emit('events', events);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    activeConnections.delete(socket.id);
  });

  socket.on('ping', (data) => {
    socket.emit('pong', { timestamp: Date.now(), ...data });
  });
});

// Start continuous news aggregation
const startContinuousAggregation = async () => {
  console.log('🚀 Starting continuous news aggregation...');
  
  // Start all independent source monitors
  await Promise.all([
    startRSSMonitoring(),
    startGovernmentSourceMonitoring(),
    startSocialMediaMonitoring(),
    startTelegramMonitoring(),
    startMultiLanguageMonitoring()
  ]);
};

const startRSSMonitoring = async () => {
  console.log('📰 Starting RSS source monitoring...');
  setInterval(async () => {
    try {
      const rssSources = dataSourceManager.getDataSources().filter(s => s.type === 'rss' && s.active);
      const rssEvents = await dataSourceManager.fetchRSSEvents(rssSources);
      if (rssEvents.length > 0) {
        broadcastEvents(rssEvents);
      }
    } catch (error) {
      console.error('RSS monitoring error:', error);
    }
  }, 60000); // Every minute
};

const startGovernmentSourceMonitoring = async () => {
  console.log('🏛️ Starting government source monitoring...');
  setInterval(async () => {
    try {
      const govSources = dataSourceManager.getDataSources().filter(s => s.type === 'government' && s.active);
      const govEvents = await dataSourceManager.fetchGovernmentEvents(govSources);
      if (govEvents.length > 0) {
        broadcastEvents(govEvents);
      }
    } catch (error) {
      console.error('Government source monitoring error:', error);
    }
  }, 120000); // Every 2 minutes
};

const startSocialMediaMonitoring = async () => {
  console.log('📱 Starting social media monitoring...');
  setInterval(async () => {
    try {
      const socialSources = dataSourceManager.getDataSources().filter(s => s.type === 'social' && s.active);
      const socialEvents = await dataSourceManager.fetchSocialMediaEvents(socialSources);
      if (socialEvents.length > 0) {
        broadcastEvents(socialEvents);
      }
    } catch (error) {
      console.error('Social media monitoring error:', error);
    }
  }, 90000); // Every 1.5 minutes
};

const startTelegramMonitoring = async () => {
  console.log('💬 Starting Telegram monitoring...');
  setInterval(async () => {
    try {
      const telegramSources = dataSourceManager.getDataSources().filter(s => s.type === 'telegram' && s.active);
      const telegramEvents = await dataSourceManager.fetchTelegramEvents(telegramSources);
      if (telegramEvents.length > 0) {
        broadcastEvents(telegramEvents);
      }
    } catch (error) {
      console.error('Telegram monitoring error:', error);
    }
  }, 45000); // Every 45 seconds
};

const startMultiLanguageMonitoring = async () => {
  console.log('🌍 Starting multi-language source monitoring...');
  setInterval(async () => {
    try {
      const multiLangSources = dataSourceManager.getDataSources().filter(s => s.type === 'multilang' && s.active);
      const multiLangEvents = await dataSourceManager.fetchMultiLanguageEvents(multiLangSources);
      if (multiLangEvents.length > 0) {
        broadcastEvents(multiLangEvents);
      }
    } catch (error) {
      console.error('Multi-language monitoring error:', error);
    }
  }, 75000); // Every 1.25 minutes
};

// API Routes
app.get('/api/events/recent', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const events = await dataSourceManager.fetchAllSources();
    
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEvents = events.filter(event => 
      new Date(event.timestamp) > cutoff
    );

    res.json({
      success: true,
      data: recentEvents,
      meta: {
        count: recentEvents.length,
        lastUpdated: new Date().toISOString(),
        source: 'Multi-Source Aggregator'
      }
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await dataSourceManager.fetchAllSources();
    res.json({
      success: true,
      data: events,
      pagination: {
        page: 1,
        limit: events.length,
        total: events.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

app.get('/api/sources/status', async (req, res) => {
  try {
    const sources = dataSourceManager.getDataSources();
    const status = sources.map(source => ({
      id: source.id,
      name: source.name,
      type: source.type,
      status: source.active ? 'active' : 'inactive',
      lastUpdate: source.lastUpdate,
      reliability: source.reliability,
      language: source.language,
      region: source.region
    }));

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching source status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch source status'
    });
  }
});

// RSS Events endpoint
app.get('/api/events/rss', async (req, res) => {
  try {
    const rssSources = dataSourceManager.getDataSources().filter(s => s.type === 'rss' && s.active);
    const events = await dataSourceManager.fetchRSSEvents(rssSources);
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

// Start the server and aggregation
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🚀 War Tracker API Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time events`);
  
  // Start continuous aggregation after server starts
  await startContinuousAggregation();
  
  console.log('✅ All monitoring systems active');
});

// Make sure this file exports the app or starts the server
if (require.main === module) {
  // Start server only if this file is run directly
  //server.listen(PORT, async () => {
  //  console.log(`🚀 War Tracker API Server running on port ${PORT}`);
  //  console.log(`📡 WebSocket server ready for real-time events`);
  //  
  //  // Start continuous aggregation after server starts
  //  await startContinuousAggregation();
  //  
  //  console.log('✅ All monitoring systems active');
  //});
}

export { app, io };