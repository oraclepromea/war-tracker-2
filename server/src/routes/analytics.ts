import express, { Request, Response } from 'express';
import { Event } from '../models/Event';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/analytics/dashboard - Dashboard analytics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      todayEvents,
      yesterdayEvents,
      weekEvents,
      monthEvents,
      totalCasualties,
      todayCasualties,
      activeEvents,
      severityStats,
      hourlyTrend
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ timestamp: { $gte: today } }),
      Event.countDocuments({ timestamp: { $gte: yesterday, $lt: today } }),
      Event.countDocuments({ timestamp: { $gte: weekAgo } }),
      Event.countDocuments({ timestamp: { $gte: monthAgo } }),
      Event.aggregate([{ $group: { _id: null, total: { $sum: '$casualties' } } }]),
      Event.aggregate([
        { $match: { timestamp: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$casualties' } } }
      ]),
      Event.countDocuments({ 
        timestamp: { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
        severity: { $in: ['high', 'critical'] }
      }),
      Event.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 }, casualties: { $sum: '$casualties' } } },
        { $sort: { count: -1 } }
      ]),
      Event.aggregate([
        { $match: { timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            count: { $sum: 1 },
            casualties: { $sum: '$casualties' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    const todayGrowth = yesterdayEvents > 0 ? 
      ((todayEvents - yesterdayEvents) / yesterdayEvents * 100) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents,
          todayEvents,
          weekEvents,
          monthEvents,
          totalCasualties: totalCasualties[0]?.total || 0,
          todayCasualties: todayCasualties[0]?.total || 0,
          activeEvents,
          todayGrowth: Math.round(todayGrowth * 100) / 100
        },
        severityBreakdown: severityStats,
        hourlyActivity: hourlyTrend,
        warDuration: Math.floor((now.getTime() - new Date('2023-10-07').getTime()) / (1000 * 60 * 60 * 24)),
        lastUpdated: now.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/heatmap - Geographic heatmap data
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate: Date;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const countryStats = await Event.aggregate([
      { $match: { 
        timestamp: { $gte: startDate },
        'location.coordinates': { $exists: true, $ne: [] }
      }},
      {
        $group: {
          _id: {
            lat: { $arrayElemAt: ['$location.coordinates', 1] },
            lng: { $arrayElemAt: ['$location.coordinates', 0] },
            city: '$location.city',
            country: '$location.country'
          },
          count: { $sum: 1 },
          casualties: { $sum: '$casualties' },
          severity: { $push: '$severity' },
          events: {
            $push: {
              id: '$_id',
              title: '$title',
              eventType: '$eventType',
              timestamp: '$timestamp'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const heatmapData = countryStats.map((item: any) => ({
      coordinates: [item._id.lat, item._id.lng],
      location: `${item._id.city}, ${item._id.country}`,
      intensity: item.count,
      casualties: item.casualties,
      events: item.events,
      dominantSeverity: item.severity.reduce((a: any, b: any) => 
        item.severity.filter((v: any) => v === a).length >= item.severity.filter((v: any) => v === b).length ? a : b
      )
    }));

    res.json({
      success: true,
      data: heatmapData
    });

  } catch (error) {
    logger.error('Error fetching heatmap data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch heatmap data' });
  }
});

// GET /api/analytics/trends - Trend analysis
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { metric = 'events', period = '30d' } = req.query;
    
    let startDate: Date;
    let groupBy: any;
    
    switch (period) {
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
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          week: { $week: '$timestamp' }
        };
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
    }

    const aggregateValue = metric === 'casualties' ? { $sum: '$casualties' } : { $sum: 1 };

    const dailyTrends = await Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          casualties: { $sum: '$casualties' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    const avgSeverityResult = await Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          averageSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'low'] }, then: 1 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 }
                ],
                default: 1
              }
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    const casualtyTrends = dailyTrends.reduce((sum: number, item: any) => sum + item.casualties, 0);
    const eventTrends = dailyTrends.reduce((sum: number, item: any) => sum + item.count, 0);
    const avgSeverity = avgSeverityResult.reduce((sum: number, item: any) => sum + item.averageSeverity, 0);

    res.json({
      success: true,
      data: {
        metric,
        period,
        trend: dailyTrends,
        summary: {
          total: dailyTrends.reduce((sum: number, item: any) => sum + item.value, 0),
          average: dailyTrends.length > 0 ? 
            dailyTrends.reduce((sum: number, item: any) => sum + item.value, 0) / dailyTrends.length : 0,
          peak: Math.max(...dailyTrends.map(item => item.value)),
          avgSeverity: dailyTrends.length > 0 ?
            dailyTrends.reduce((sum: number, item: any) => sum + item.avgSeverity, 0) / dailyTrends.length : 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching trend data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trend data' });
  }
});

export default router;