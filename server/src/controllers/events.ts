import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { Between, FindManyOptions } from 'typeorm';

export class EventsController {
  static async getEvents(req: Request, res: Response) {
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
      
      const options: FindManyOptions<Event> = {
        take: Math.min(Number(limit), 100), // Max 100 items
        skip: (Number(page) - 1) * Number(limit),
        order: { [sortBy as string]: order === 'desc' ? 'DESC' : 'ASC' }
      };

      // Build where conditions
      const where: any = {};
      
      if (country) {
        where.country = country;
      }
      
      if (severity) {
        where.severity = severity;
      }
      
      if (start && end) {
        where.date = Between(new Date(start as string), new Date(end as string));
      } else if (start) {
        where.date = Between(new Date(start as string), new Date());
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
        },
        meta: {
          lastUpdated: new Date().toISOString(),
          source: 'events_api'
        }
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENTS_FETCH_ERROR',
          message: 'Failed to fetch events'
        }
      });
    }
  }

  static async getEventById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventRepo = AppDataSource.getRepository(Event);
      
      const event = await eventRepo.findOne({ where: { id } });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: 'Event not found'
          }
        });
      }

      res.json({
        success: true,
        data: event,
        meta: {
          lastUpdated: event.updatedAt.toISOString(),
          source: event.source
        }
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENT_FETCH_ERROR',
          message: 'Failed to fetch event'
        }
      });
    }
  }

  static async getRecentEvents(req: Request, res: Response) {
    try {
      const { hours = 24 } = req.query;
      const eventRepo = AppDataSource.getRepository(Event);
      
      const since = new Date();
      since.setHours(since.getHours() - Number(hours));
      
      const events = await eventRepo.find({
        where: {
          date: Between(since, new Date())
        },
        order: { date: 'DESC' },
        take: 50
      });

      res.json({
        success: true,
        data: events,
        meta: {
          lastUpdated: new Date().toISOString(),
          timeRange: `${hours} hours`,
          count: events.length
        }
      });
    } catch (error) {
      console.error('Error fetching recent events:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RECENT_EVENTS_ERROR',
          message: 'Failed to fetch recent events'
        }
      });
    }
  }
}