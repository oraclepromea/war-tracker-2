import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { NewsItem } from '../models/NewsItem';
import { Between, FindManyOptions } from 'typeorm';

export class NewsController {
  static async getNews(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        source,
        severity,
        since,
        sortBy = 'publishedAt',
        order = 'desc'
      } = req.query;

      const newsRepo = AppDataSource.getRepository(NewsItem);
      
      const options: FindManyOptions<NewsItem> = {
        take: Math.min(Number(limit), 100),
        skip: (Number(page) - 1) * Number(limit),
        order: { [sortBy as string]: order === 'desc' ? 'DESC' : 'ASC' }
      };

      const where: any = {};
      
      if (source) {
        where.source = source;
      }
      
      if (severity) {
        where.severity = severity;
      }
      
      if (since) {
        const sinceDate = new Date(since as string);
        where.publishedAt = Between(sinceDate, new Date());
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
    } catch (error) {
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

  static async getLatestNews(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      const newsRepo = AppDataSource.getRepository(NewsItem);
      
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
    } catch (error) {
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