import app, { dataSourceManager } from './app';

// Railway provides PORT dynamically, fallback to 8080 for local dev
const PORT = process.env.PORT || 8080;

// Enhanced server startup with port conflict handling
function startServer(port: number, retryCount = 0) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 War Tracker API Server running on port ${port}`);
    console.log(`📡 WebSocket server ready for real-time events`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`);
      
      // Only retry in local development, not on Railway
      if (!process.env.RAILWAY_ENVIRONMENT && retryCount < 3) {
        console.log(`🔄 Trying port ${port + 1}...`);
        return startServer(port + 1, retryCount + 1);
      } else {
        console.error('💥 Cannot start server - port conflict');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  // Graceful shutdown for Railway
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  return server;
}

// Start the server
startServer(Number(PORT));