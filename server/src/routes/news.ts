import express from 'express';
import { EnhancedDataSourceManager } from '../services/enhancedDataSources';

const router = express.Router();
const dataSourceManager = new EnhancedDataSourceManager();

// GET /api/news - Fetch latest news from all sources
router.get('/', async (req, res) => {
  console.log('🌐 API: /api/news endpoint called');
  console.log('🌐 API: Request query:', req.query);
  console.log('🌐 API: Request headers:', req.headers);
  
  try {
    console.log('🌐 API: Calling dataSourceManager.fetchAllSources()...');
    const startTime = Date.now();
    
    const events = await dataSourceManager.fetchAllSources();
    
    const endTime = Date.now();
    console.log(`🌐 API: fetchAllSources completed in ${endTime - startTime}ms`);
    console.log(`🌐 API: Retrieved ${events.length} events`);
    
    if (events.length > 0) {
      console.log('🌐 API: Sample event:', events[0]);
      console.log('🌐 API: Event sources:', [...new Set(events.map(e => e.source))]);
    } else {
      console.warn('🌐 API: No events returned from dataSourceManager');
    }

    console.log('🌐 API: Sending response...');
    res.json({
      success: true,
      count: events.length,
      events
    });
    console.log('🌐 API: Response sent successfully');
    
  } catch (error) {
    console.error('❌ API: Error in /api/news:', error);
    console.error('❌ API: Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ API: Error type:', typeof error);
    console.error('❌ API: Error constructor:', error?.constructor?.name);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/news/sources - Get source status
router.get('/sources', async (req, res) => {
  console.log('🌐 API: /api/news/sources endpoint called');
  
  try {
    const sources = dataSourceManager.getSources();
    console.log('🌐 API: Retrieved sources:', Object.keys(sources));
    
    res.json({
      success: true,
      sources
    });
  } catch (error) {
    console.error('❌ API: Error in /api/news/sources:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;