import express from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';

const router = express.Router();

// GET /api/events - Fetch events with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      country,
      severity,
      start,
      end,
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    const eventRepo = AppDataSource.getRepository(Event);
    
    const options: any = {
      take: Math.min(Number(limit), 100),
      skip: (Number(page) - 1) * Number(limit),
      order: { [sortBy as string]: order === 'desc' ? 'DESC' : 'ASC' }
    };

    // Build where conditions
    const where: any = {};
    
    if (country) where.country = country;
    if (severity) where.severity = severity;
    if (start && end) {
      where.date = {
        $gte: new Date(start as string),
        $lte: new Date(end as string)
      };
    }

    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [events, total] = await eventRepo.findAndCount(options);
    
    res.json({
      success: true,
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
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