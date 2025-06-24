import express from 'express';
import cors from 'cors';
import { EnhancedDataSourceManager } from './services/enhancedDataSources';

const app = express();

// Initialize the data source manager
const dataSourceManager = EnhancedDataSourceManager.getInstance();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://war-tracker-20-production.up.railway.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
export { dataSourceManager };