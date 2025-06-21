import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint with comprehensive diagnostics
app.get('/api/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        rss_feeds: 'unknown',
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    // Test database connection (commented out until Prisma is properly configured)
    // try {
    //   await prisma.$queryRaw`SELECT 1`;
    //   healthCheck.services.database = 'connected';
    // } catch (dbError) {
    //   healthCheck.services.database = 'disconnected';
    //   healthCheck.status = 'DEGRADED';
    // }

    // Test RSS feed accessibility (basic check)
    const rssFeeds = [
      'https://feeds.reuters.com/reuters/worldNews',
      'http://feeds.bbci.co.uk/news/world/rss.xml'
    ];

    let rssHealthy = 0;
    for (const feed of rssFeeds) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(feed, {
          signal: controller.signal,
          method: 'HEAD'
        });
        
        clearTimeout(timeoutId);
        if (response.ok) rssHealthy++;
      } catch (error) {
        // RSS feed unreachable
      }
    }

    healthCheck.services.rss_feeds = `${rssHealthy}/${rssFeeds.length} accessible`;
    
    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// RSS Feed testing endpoint
app.get('/api/feeds/test', async (req, res) => {
  const feeds = [
    { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/worldNews' },
    { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/' },
    { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/' }
  ];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'War-Tracker-Bot/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const content = await response.text();
          const articleCount = (content.match(/<item>/g) || []).length;
          
          return {
            name: feed.name,
            url: feed.url,
            status: 'success',
            responseTime,
            articles: articleCount,
            lastChecked: new Date().toISOString()
          };
        } else {
          return {
            name: feed.name,
            url: feed.url,
            status: 'failed',
            responseTime,
            error: `HTTP ${response.status}`,
            lastChecked: new Date().toISOString()
          };
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
          name: feed.name,
          url: feed.url,
          status: 'error',
          responseTime,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    })
  );

  const feedResults = results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  );

  res.json({
    summary: {
      total: feeds.length,
      successful: feedResults.filter(r => r.status === 'success').length,
      failed: feedResults.filter(r => r.status !== 'success').length,
      averageResponseTime: Math.round(
        feedResults.reduce((sum, r) => sum + r.responseTime, 0) / feedResults.length
      )
    },
    feeds: feedResults
  });
});

// News aggregation job endpoint
app.post('/api/jobs/news', async (req, res) => {
  try {
    // Simulate news aggregation job
    const jobId = `job-${Date.now()}`;
    const startTime = Date.now();
    
    // Mock processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResult = {
      jobId,
      status: 'completed',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - startTime,
      processed: {
        feeds: 5,
        articles: Math.floor(Math.random() * 100) + 50,
        newItems: Math.floor(Math.random() * 20) + 5,
        duplicates: Math.floor(Math.random() * 30) + 10
      },
      errors: []
    };

    res.json(mockResult);
  } catch (error) {
    res.status(500).json({
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Events endpoint with mock data
app.get('/api/events', async (req, res) => {
  try {
    // Generate mock events for testing
    const mockEvents = Array.from({ length: 25 }, (_, i) => {
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const types = ['airstrike', 'ground_assault', 'missile_attack', 'diplomatic', 'humanitarian'];
      const locations = ['Gaza Strip', 'West Bank', 'Ukraine', 'Donetsk', 'Lebanon'];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      return {
        id: `event-${i}`,
        timestamp: timestamp.toISOString(),
        title: `Event ${i + 1}`,
        description: `Description for event ${i + 1}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        source: 'Mock Data',
        verified: Math.random() > 0.3
      };
    });

    res.json({
      events: mockEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      meta: {
        total: mockEvents.length,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// News items endpoint
app.get('/api/news', async (req, res) => {
  try {
    const mockNews = Array.from({ length: 30 }, (_, i) => ({
      id: `news-${i}`,
      title: `Breaking News Item ${i + 1}`,
      summary: `Summary for news item ${i + 1}`,
      source: ['Reuters', 'BBC', 'Al Jazeera'][Math.floor(Math.random() * 3)],
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://example.com/news/${i}`,
      category: ['conflict', 'diplomacy', 'humanitarian'][Math.floor(Math.random() * 3)]
    }));

    res.json({
      news: mockNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
      meta: {
        total: mockNews.length,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    application: {
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      version: '1.0.0'
    }
  };

  res.json(metrics);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 War Tracker API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 RSS test: http://localhost:${PORT}/api/feeds/test`);
});

export default app;