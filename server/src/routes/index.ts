import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// Root route for Railway
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'War Tracker 2.0 API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// News endpoint
router.get('/api/news', (req, res) => {
  // Return cached news data
  res.json({
    success: true,
    data: [], // Your news data here
    timestamp: new Date().toISOString()
  });
});

// Events endpoint
router.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: [], // Your events data here
    timestamp: new Date().toISOString()
  });
});

// Live endpoint
router.get('/api/live', (req, res) => {
  res.json({
    success: true,
    data: [], // Your live data here
    timestamp: new Date().toISOString()
  });
});

export default router;