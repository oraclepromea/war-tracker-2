import express, { Request, Response } from 'express';
import { Country } from '../models/Country';
import { Event } from '../models/Event';
import { logger } from '../utils/logger';

const router = express.Router();

const countries = [
  {
    id: 'israel',
    name: 'Israel',
    flag: '🇮🇱',
    region: 'Middle East',
    population: 9550000,
    militaryBudget: 24300000000, // USD
    forces: {
      active: 173000,
      reserves: 465000,
      airForce: 34000,
      navy: 9500,
      groundForces: 133000
    }
  },
  {
    id: 'palestine',
    name: 'Palestine',
    flag: '🇵🇸',
    region: 'Middle East',
    population: 5220000,
    militaryBudget: 0,
    forces: {
      active: 0,
      reserves: 0,
      airForce: 0,
      navy: 0,
      groundForces: 0
    }
  },
  {
    id: 'lebanon',
    name: 'Lebanon',
    flag: '🇱🇧',
    region: 'Middle East',
    population: 6825000,
    militaryBudget: 2400000000,
    forces: {
      active: 85000,
      reserves: 20000,
      airForce: 1000,
      navy: 1200,
      groundForces: 82800
    }
  },
  {
    id: 'iran',
    name: 'Iran',
    flag: '🇮🇷',
    region: 'Middle East',
    population: 85000000,
    militaryBudget: 25000000000,
    forces: {
      active: 610000,
      reserves: 350000,
      airForce: 52000,
      navy: 18000,
      groundForces: 540000
    }
  }
];

// GET /api/countries - Get all countries data
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get casualty and event data for each country
    const countriesWithStats = await Promise.all(
      countries.map(async (country) => {
        const events = await Event.find({ 'location.country': country.name });
        const casualties = events.reduce((sum: number, event: any) => sum + event.casualties, 0);
        const recentEvents = await Event.find({
          $or: [
            { country1: country },
            { country2: country }
          ]
        }).sort({ timestamp: -1 }).limit(10);

        events.forEach((event: any) => {
          console.log(event.timestamp);
        });

        return {
          ...country,
          stats: {
            totalEvents: events.length,
            totalCasualties: casualties,
            recentEvents,
            lastEventDate: events.length > 0 ? 
              Math.max(...events.map((e: any) => e.timestamp.getTime())) : null,
            threatLevel: casualties > 1000 ? 'critical' : 
                        casualties > 500 ? 'high' : 
                        casualties > 100 ? 'medium' : 'low'
          }
        };
      })
    );

    res.json({
      success: true,
      data: countriesWithStats
    });

  } catch (error) {
    logger.error('Error fetching countries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch countries data' });
  }
});

// GET /api/countries/:id - Get specific country data
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const country = countries.find(c => c.id === req.params.id);
    
    if (!country) {
      res.status(404).json({ success: false, error: 'Country not found' });
      return;
    }

    // Get detailed stats for this country
    const events = await Event.find({ 'location.country': country.name })
      .sort({ timestamp: -1 });
    
    const casualties = events.reduce((sum: number, event: any) => sum + event.casualties, 0);
    
    const severityBreakdown = await Event.aggregate([
      { $match: { 'location.country': country.name } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const monthlyTrend = await Event.aggregate([
      { 
        $match: { 
          'location.country': country.name,
          timestamp: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          },
          count: { $sum: 1 },
          casualties: { $sum: '$casualties' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        ...country,
        stats: {
          totalEvents: events.length,
          totalCasualties: casualties,
          recentEvents: events.slice(0, 10),
          severityBreakdown,
          monthlyTrend,
          threatLevel: casualties > 1000 ? 'critical' : 
                      casualties > 500 ? 'high' : 
                      casualties > 100 ? 'medium' : 'low'
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching country:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch country data' });
  }
});

// GET /api/countries/:id/events - Get events for specific country
router.get('/:id/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const country = countries.find(c => c.id === req.params.id);
    
    if (!country) {
      res.status(404).json({ success: false, error: 'Country not found' });
      return;
    }

    const { page = 1, limit = 20, severity, startDate, endDate } = req.query;
    const filter: any = { 'location.country': country.name };

    if (severity) filter.severity = severity;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

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
    logger.error('Error fetching country events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch country events' });
  }
});

// GET /api/countries/:id/timeline - Get events timeline for a specific country
router.get('/:id/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = req.params.id;
    
    if (!countryId) {
      res.status(400).json({ success: false, error: 'Country ID is required' });
      return;
    }

    const { limit = '50', offset = '0' } = req.query;

    const events = await Event.find({
      'location.country': countryId
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit as string))
    .skip(parseInt(offset as string));

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    logger.error('Error fetching country timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

export default router;