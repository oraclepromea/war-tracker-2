import express, { Request, Response } from 'express';
import { Event } from '../models/Event';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/events - Get all events with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity,
      country,
      verified,
      startDate,
      endDate,
      search
    } = req.query;

    const filter: any = {};

    // Apply filters
    if (severity) filter.severity = severity;
    if (country) filter['location.country'] = new RegExp(country as string, 'i');
    if (verified !== undefined) filter.verified = verified === 'true';
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { eventType: new RegExp(search as string, 'i') }
      ];
    }

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('relatedEvents', 'title eventType timestamp');

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('relatedEvents', 'title eventType timestamp severity');

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });

  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

// GET /api/events/analytics/summary - Get analytics summary
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      todayEvents,
      weekEvents,
      totalCasualties,
      severityStats,
      countryStats
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ timestamp: { $gte: today } }),
      Event.countDocuments({ timestamp: { $gte: weekAgo } }),
      Event.aggregate([{ $group: { _id: null, total: { $sum: '$casualties' } } }]),
      Event.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $group: { _id: '$location.country', count: { $sum: 1 }, casualties: { $sum: '$casualties' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        todayEvents,
        weekEvents,
        totalCasualties: totalCasualties[0]?.total || 0,
        severityBreakdown: severityStats,
        topCountries: countryStats
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// GET /api/events/timeline/:period - Get timeline data
router.get('/timeline/:period', async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.params; // '24h', '7d', '30d'
    
    let startDate: Date;
    let groupBy: any;

    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid period' });
        return;
    }

    const timeline = await Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          casualties: { $sum: '$casualties' },
          events: {
            $push: {
              id: '$_id',
              title: '$title',
              severity: '$severity',
              eventType: '$eventType'
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    res.json({ success: true, data: timeline });

  } catch (error) {
    logger.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

export default router;