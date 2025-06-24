import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Enhanced server startup with port conflict handling
function startServer(port: number, retryCount = 0) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
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

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
  });

  return server;
}

startServer(PORT);