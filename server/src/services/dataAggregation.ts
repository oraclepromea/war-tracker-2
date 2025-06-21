import axios from 'axios';
import cron from 'node-cron';
import Parser from 'rss-parser';
import { Event } from '../models/Event';
import { openRouterService } from './openRouter';
import { broadcastUpdate } from '../websocket/websocket';
import { logger } from '../utils/logger';

interface RSSFeed {
  url: string;
  name: string;
  reliability: number;
}

const RSS_FEEDS: RSSFeed[] = [
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters', reliability: 0.9 },
  { url: 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml', name: 'BBC Middle East', reliability: 0.9 },
  { url: 'https://rss.cnn.com/rss/edition.rss', name: 'CNN', reliability: 0.8 },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', reliability: 0.7 }
];

class DataAggregationService {
  private parser: Parser;
  private isRunning = false;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'War-Tracker/2.0 RSS Reader'
      }
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Data aggregation service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting data aggregation service');

    // Run initial data collection
    await this.collectAndAnalyzeData();

    // Schedule periodic data collection every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.collectAndAnalyzeData();
      } catch (error) {
        logger.error('Scheduled data collection failed:', error);
      }
    });

    // Schedule statistics updates every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.broadcastStatistics();
      } catch (error) {
        logger.error('Statistics broadcast failed:', error);
      }
    });

    logger.info('Data aggregation service started successfully');
  }

  private async collectAndAnalyzeData(): Promise<void> {
    logger.info('Starting data collection cycle');

    for (const feed of RSS_FEEDS) {
      try {
        await this.processFeed(feed);
        // Add delay between feeds to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to process feed ${feed.name}:`, error);
      }
    }

    logger.info('Data collection cycle completed');
  }

  private async processFeed(feed: RSSFeed): Promise<void> {
    try {
      logger.debug(`Processing RSS feed: ${feed.name}`);
      
      const rssData = await this.parser.parseURL(feed.url);
      
      if (!rssData.items || rssData.items.length === 0) {
        logger.warn(`No items found in feed: ${feed.name}`);
        return;
      }

      // Process recent items (last 24 hours)
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentItems = rssData.items.filter(item => {
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        return pubDate > cutoffTime;
      });

      logger.debug(`Found ${recentItems.length} recent items in ${feed.name}`);

      for (const item of recentItems.slice(0, 10)) { // Limit to 10 items per feed
        await this.analyzeAndStoreItem(item, feed);
      }

    } catch (error) {
      logger.error(`Error processing feed ${feed.name}:`, error);
    }
  }

  private async analyzeAndStoreItem(item: any, feed: RSSFeed): Promise<void> {
    try {
      const content = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.trim();
      
      if (!content) return;

      // Check if we already have this event
      const existingEvent = await Event.findOne({
        $or: [
          { url: item.link },
          { title: item.title }
        ]
      });

      if (existingEvent) {
        return; // Skip if already exists
      }

      // Analyze with AI
      const analysis = await openRouterService.analyzeNewsArticle(content);
      
      if (!analysis) {
        return; // Not a conflict-related article
      }

      // Verify credibility
      const credibilityScore = await openRouterService.verifyEventCredibility(
        [feed.name],
        content
      );

      // Create new event
      const newEvent = new Event({
        title: item.title || 'Untitled Event',
        description: item.contentSnippet || content.substring(0, 500),
        eventType: analysis.eventType || 'general',
        severity: analysis.severity || 'low',
        location: analysis.location || {
          country: 'Unknown',
          city: 'Unknown',
          coordinates: []
        },
        casualties: analysis.casualties || 0,
        source: feed.name,
        url: item.link,
        credibilityScore: Math.max(credibilityScore, feed.reliability),
        verified: credibilityScore > 0.7,
        timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
        aiAnalyzed: true,
        rawContent: content,
        tags: this.extractTags(content)
      });

      await newEvent.save();
      
      logger.info(`New event stored: ${newEvent.title}`);

      // Broadcast new event via WebSocket
      broadcastUpdate({
        type: 'new_event',
        event: newEvent,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error analyzing and storing item:', error);
    }
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const keywords = [
      'airstrike', 'missile', 'rocket', 'bombing', 'attack', 'invasion',
      'casualties', 'civilian', 'military', 'hamas', 'idf', 'hezbollah',
      'gaza', 'israel', 'palestine', 'lebanon', 'iran', 'hostage'
    ];

    const lowerContent = content.toLowerCase();
    keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private async broadcastStatistics(): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        totalEvents,
        todayEvents,
        activeCasualties,
        avgSeverity
      ] = await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ timestamp: { $gte: today } }),
        Event.aggregate([
          { $match: { timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
          { $group: { _id: null, total: { $sum: '$casualties' } } }
        ]),
        Event.aggregate([
          { $match: { timestamp: { $gte: today } } },
          {
            $group: {
              _id: null,
              avgSeverity: {
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
          }
        ])
      ]);

      const stats = {
        totalEvents,
        todayEvents,
        activeCasualties: activeCasualties[0]?.total || 0,
        avgSeverity: avgSeverity[0]?.avgSeverity || 1,
        lastUpdated: now.toISOString()
      };

      broadcastUpdate({
        type: 'statistics_update',
        stats,
        timestamp: now.toISOString()
      });

      logger.info('Statistics broadcast completed');

    } catch (error) {
      logger.error('Error broadcasting statistics:', error);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Data aggregation service stopped');
  }
}

const dataAggregationService = new DataAggregationService();

export const startDataAggregation = async (): Promise<void> => {
  try {
    logger.info('Starting data aggregation services...');
    
    // Mock data aggregation service for demo
    setInterval(() => {
      logger.debug('Data aggregation heartbeat');
    }, 30000); // Every 30 seconds
    
    logger.info('Data aggregation services started successfully');
  } catch (error) {
    logger.error('Failed to start data aggregation services:', error);
    throw error;
  }
};

export async function stopDataAggregation(): Promise<void> {
  await dataAggregationService.stop();
}