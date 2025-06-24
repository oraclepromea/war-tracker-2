import app from './app';

const PORT = parseInt(process.env.PORT || '8080', 10);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 War Tracker API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully');
  server.close(() => process.exit(0));
});