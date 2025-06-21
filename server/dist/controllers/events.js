"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const database_1 = require("../config/database");
const Event_1 = require("../models/Event");
const typeorm_1 = require("typeorm");
class EventsController {
    static async getEvents(req, res) {
        try {
            const { page = 1, limit = 20, country, severity, start, end, sortBy = 'date', order = 'desc' } = req.query;
            const eventRepo = database_1.AppDataSource.getRepository(Event_1.Event);
            const options = {
                take: Math.min(Number(limit), 100), // Max 100 items
                skip: (Number(page) - 1) * Number(limit),
                order: { [sortBy]: order === 'desc' ? 'DESC' : 'ASC' }
            };
            // Build where conditions
            const where = {};
            if (country) {
                where.country = country;
            }
            if (severity) {
                where.severity = severity;
            }
            if (start && end) {
                where.date = (0, typeorm_1.Between)(new Date(start), new Date(end));
            }
            else if (start) {
                where.date = (0, typeorm_1.Between)(new Date(start), new Date());
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
        }
        catch (error) {
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
    static async getEventById(req, res) {
        try {
            const { id } = req.params;
            const eventRepo = database_1.AppDataSource.getRepository(Event_1.Event);
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
        }
        catch (error) {
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
    static async getRecentEvents(req, res) {
        try {
            const { hours = 24 } = req.query;
            const eventRepo = database_1.AppDataSource.getRepository(Event_1.Event);
            const since = new Date();
            since.setHours(since.getHours() - Number(hours));
            const events = await eventRepo.find({
                where: {
                    date: (0, typeorm_1.Between)(since, new Date())
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
        }
        catch (error) {
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
exports.EventsController = EventsController;
//# sourceMappingURL=events.js.map