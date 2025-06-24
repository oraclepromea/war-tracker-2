import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration for production and development
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://war-tracker-frontend.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Required Routes (Railway health checks need these!)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/jobs/news', (req, res) => {
  res.json({
    success: true,
    message: 'News sync job triggered',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/live', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'War Tracker 2.0 API is running',
    endpoints: ['/health', '/api/health', '/api/events', '/api/news', '/api/live']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/health', '/api/health', '/api/events', '/api/news', '/api/live']
  });
});

export default app;