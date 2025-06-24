import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint - MUST BE FIRST
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    port: process.env.PORT || 8080,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'War Tracker 2.0 API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API routes
app.get('/api/news', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    data: [],
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

export default app;