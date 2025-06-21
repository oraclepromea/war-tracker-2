import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { startDataAggregation } from './services/dataAggregation';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import eventsRoutes from './routes/events';
import analyticsRoutes from './routes/analytics';
import countriesRoutes from './routes/countries';
import aiRoutes from './routes/ai';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      websocket: 'active',
      dataAggregation: 'running'
    }
  });
});

// API Routes
app.use('/api/events', eventsRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// WebSocket setup function
const setupWebSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

// Initialize WebSocket
setupWebSocket(io);

// Initialize services (make database connection optional)
async function startServer() {
  try {
    // Try to connect to database but don't fail if it's not available
    try {
      await connectDatabase();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.log('⚠️  Database connection failed - running in offline mode');
    }

    // Start data aggregation services (make this optional too)
    try {
      await startDataAggregation();
      console.log('✅ Data aggregation services started');
    } catch (error) {
      console.log('⚠️  Data aggregation services not available');
    }

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 War Tracker API server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

startServer();