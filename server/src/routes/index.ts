import { Router } from 'express';
import { EventsController } from '../controllers/events';
import { NewsController } from '../controllers/news';
import { NewsAggregatorJob } from '../jobs/newsAggregator';

const router = Router();

// Events routes
router.get('/events', EventsController.getEvents);
router.get('/events/recent', EventsController.getRecentEvents);
router.get('/events/:id', EventsController.getEventById);

// News routes  
router.get('/news', NewsController.getNews);
router.get('/news/latest', NewsController.getLatestNews);

// Job routes (for development/testing)
router.post('/jobs/news', async (req, res) => {
  try {
    const result = await NewsAggregatorJob.fetchAndIngest();
    res.json({
      success: true,
      message: 'News aggregation completed',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'NEWS_AGGREGATION_ERROR',
        message: error.message || 'Failed to run news aggregation'
      }
    });
  }
});

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

export default router;