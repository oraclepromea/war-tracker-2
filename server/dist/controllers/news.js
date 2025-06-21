"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const database_1 = require("../config/database");
const NewsItem_1 = require("../models/NewsItem");
const typeorm_1 = require("typeorm");
class NewsController {
    static async getNews(req, res) {
        try {
            const { page = 1, limit = 20, source, severity, since, sortBy = 'publishedAt', order = 'desc' } = req.query;
            const newsRepo = database_1.AppDataSource.getRepository(NewsItem_1.NewsItem);
            const options = {
                take: Math.min(Number(limit), 100),
                skip: (Number(page) - 1) * Number(limit),
                order: { [sortBy]: order === 'desc' ? 'DESC' : 'ASC' }
            };
            const where = {};
            if (source) {
                where.source = source;
            }
            if (severity) {
                where.severity = severity;
            }
            if (since) {
                const sinceDate = new Date(since);
                where.publishedAt = (0, typeorm_1.Between)(sinceDate, new Date());
            }
            if (Object.keys(where).length > 0) {
                options.where = where;
            }
            const [news, total] = await newsRepo.findAndCount(options);
            res.json({
                success: true,
                data: news,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                },
                meta: {
                    lastUpdated: new Date().toISOString(),
                    source: 'news_api'
                }
            });
        }
        catch (error) {
            console.error('Error fetching news:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'NEWS_FETCH_ERROR',
                    message: 'Failed to fetch news'
                }
            });
        }
    }
    static async getLatestNews(req, res) {
        try {
            const { limit = 10 } = req.query;
            const newsRepo = database_1.AppDataSource.getRepository(NewsItem_1.NewsItem);
            const news = await newsRepo.find({
                order: { publishedAt: 'DESC' },
                take: Math.min(Number(limit), 50)
            });
            res.json({
                success: true,
                data: news,
                meta: {
                    lastUpdated: new Date().toISOString(),
                    count: news.length
                }
            });
        }
        catch (error) {
            console.error('Error fetching latest news:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'LATEST_NEWS_ERROR',
                    message: 'Failed to fetch latest news'
                }
            });
        }
    }
}
exports.NewsController = NewsController;
//# sourceMappingURL=news.js.map