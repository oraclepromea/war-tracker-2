import express from 'express';

const router = express.Router();

// GET /api/events - Fetch events
router.get('/', async (req, res) => {
  try {
    console.log('📡 API: Events requested');
    
    const events = [];
    
    res.json({
      success: true,
      events: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

export default router;