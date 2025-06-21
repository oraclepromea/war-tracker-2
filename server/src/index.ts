import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AppDataSource } from './config/database';
import { NewsAggregatorJob } from './jobs/newsAggregator';
import apiRoutes from './routes/index';
import { validateEnvironment, getConfig } from './config/validateEnv';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    version: '2.0.0'
  });
});

// API routes
app.use('/api', apiRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('connection-status', { 
    status: 'connected',
    database: AppDataSource.isInitialized,
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

async function startServer() {
  try {
    const config = getConfig();
    
    // Try to initialize database (optional)
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.warn('⚠️  Database connection failed, running in RSS-only mode');
      console.warn('💡 Install PostgreSQL and configure .env for full functionality');
    }
    
    // Run initial news sync if jobs are enabled
    if (config.jobs.enabled) {
      console.log('🔄 Running initial news sync...');
      setTimeout(async () => {
        try {
          await NewsAggregatorJob.fetchAndIngest();
        } catch (error) {
          console.warn('Initial news sync failed:', error);
        }
      }, 5000); // Wait 5 seconds after server start
    }
    
    // Start server
    const PORT = process.env.PORT || config.app.port || 3001;
    
    server.listen(PORT, () => {
      console.log(`🚀 War Tracker 2.0 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Frontend should be at: http://localhost:3000`);
      
      if (!AppDataSource.isInitialized) {
        console.log('📡 Running in RSS-only mode - news aggregation available');
        console.log('🔧 To enable full features, configure database in .env file');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { io };

if (require.main === module) {
  startServer();
}