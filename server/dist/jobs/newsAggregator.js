"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAggregatorJob = void 0;
const axios_1 = __importDefault(require("axios"));
const rss_parser_1 = __importDefault(require("rss-parser"));
const database_1 = require("../config/database");
const NewsItem_1 = require("../models/NewsItem");
const Event_1 = require("../models/Event");
const validateEnv_1 = require("../config/validateEnv");
// Expanded RSS sources for comprehensive conflict coverage
const RSS_SOURCES = [
    // Major International News
    {
        name: 'Reuters World News',
        url: 'https://feeds.reuters.com/reuters/worldNews',
        category: 'international',
        reliability: 98,
        conflictFocus: true
    },
    {
        name: 'BBC World News',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        category: 'international',
        reliability: 96,
        conflictFocus: true
    },
    {
        name: 'Al Jazeera English',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: 'middle_east',
        reliability: 88,
        conflictFocus: true
    },
    // Regional Conflict-Focused Sources
    {
        name: 'Times of Israel',
        url: 'https://www.timesofisrael.com/feed/',
        category: 'middle_east',
        reliability: 85,
        conflictFocus: true
    },
    {
        name: 'Haaretz English',
        url: 'https://www.haaretz.com/cmlink/1.628752',
        category: 'middle_east',
        reliability: 87,
        conflictFocus: true
    },
    {
        name: 'Jerusalem Post',
        url: 'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
        category: 'middle_east',
        reliability: 82,
        conflictFocus: true
    },
    // Eastern Europe & Ukraine
    {
        name: 'Kyiv Independent',
        url: 'https://kyivindependent.com/rss/',
        category: 'eastern_europe',
        reliability: 89,
        conflictFocus: true
    },
    {
        name: 'Radio Free Europe',
        url: 'https://www.rferl.org/api/epiqq',
        category: 'eastern_europe',
        reliability: 91,
        conflictFocus: true
    },
    // Asia-Pacific Conflicts
    {
        name: 'South China Morning Post',
        url: 'https://www.scmp.com/rss/91/feed',
        category: 'asia_pacific',
        reliability: 84,
        conflictFocus: false
    },
    {
        name: 'Nikkei Asia',
        url: 'https://asia.nikkei.com/rss/feed/nar',
        category: 'asia_pacific',
        reliability: 86,
        conflictFocus: false
    },
    // African Conflicts
    {
        name: 'AllAfrica News',
        url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf',
        category: 'africa',
        reliability: 79,
        conflictFocus: true
    },
    // Defense & Military News
    {
        name: 'Defense News',
        url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml',
        category: 'military',
        reliability: 88,
        conflictFocus: true
    },
    {
        name: 'Military Times',
        url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/',
        category: 'military',
        reliability: 85,
        conflictFocus: true
    },
    // Conflict Analysis & Think Tanks
    {
        name: 'Council on Foreign Relations',
        url: 'https://www.cfr.org/feeds/blog.xml',
        category: 'analysis',
        reliability: 93,
        conflictFocus: true
    },
    {
        name: 'War on the Rocks',
        url: 'https://warontherocks.com/feed/',
        category: 'analysis',
        reliability: 90,
        conflictFocus: true
    },
    // Additional International Sources
    {
        name: 'Associated Press World',
        url: 'https://feeds.apnews.com/rss/apf-topnews',
        category: 'international',
        reliability: 95,
        conflictFocus: true
    },
    {
        name: 'France 24 English',
        url: 'https://www.france24.com/en/rss',
        category: 'international',
        reliability: 87,
        conflictFocus: true
    },
    {
        name: 'Deutsche Welle English',
        url: 'https://rss.dw.com/xml/rss-en-all',
        category: 'international',
        reliability: 89,
        conflictFocus: true
    }
];
// Conflict-related keywords for better filtering
const CONFLICT_KEYWORDS = [
    'war', 'conflict', 'battle', 'fighting', 'military', 'attack', 'strike',
    'bombing', 'missile', 'rocket', 'airStrike', 'casualties', 'killed',
    'wounded', 'invasion', 'occupation', 'siege', 'ceasefire', 'truce',
    'offensive', 'defense', 'terrorism', 'insurgency', 'rebellion',
    'coup', 'revolution', 'uprising', 'protest', 'violence', 'armed',
    'weapons', 'ammunition', 'explosive', 'drone', 'artillery',
    'Gaza', 'Israel', 'Palestine', 'Ukraine', 'Russia', 'Syria',
    'Afghanistan', 'Iraq', 'Yemen', 'Sudan', 'Somalia', 'Myanmar',
    'Taiwan', 'China', 'Iran', 'North Korea'
];
class NewsAggregatorJob {
    static async fetchAndIngest() {
        console.log('🔄 Starting news aggregation...');
        if (!database_1.AppDataSource.isInitialized) {
            console.warn('⚠️ Database not initialized, skipping news aggregation');
            return { news: 0, events: 0 };
        }
        const newsRepo = database_1.AppDataSource.getRepository(NewsItem_1.NewsItem);
        const eventRepo = database_1.AppDataSource.getRepository(Event_1.Event);
        let newsCreated = 0;
        let eventsCreated = 0;
        const config = (0, validateEnv_1.getConfig)();
        for (const source of this.sources) {
            try {
                let articles = [];
                if (source.type === 'api' && config.apis.newsapi.key) {
                    articles = await this.fetchFromAPI(source, config.apis.newsapi.key);
                }
                else if (source.type === 'rss') {
                    articles = await this.fetchFromRSS(source);
                }
                for (const article of articles) {
                    if (!this.isWarRelated(article))
                        continue;
                    const sourceId = `${source.id}-${this.generateArticleId(article)}`;
                    // Check if news item already exists
                    const existingNews = await newsRepo.findOne({
                        where: { source: source.name, sourceId }
                    });
                    if (existingNews)
                        continue;
                    // Create NewsItem
                    const newsItem = newsRepo.create({
                        source: source.name,
                        sourceId,
                        title: article.title || '',
                        url: article.url || article.link || '',
                        publishedAt: new Date(article.publishedAt || article.pubDate || Date.now()),
                        summary: article.description || article.content || '',
                        imageUrl: article.urlToImage || article.thumbnail,
                        reliability: source.reliability,
                        tags: this.extractTags(article),
                        severity: this.calculateNewsSeverity(article)
                    });
                    await newsRepo.save(newsItem);
                    newsCreated++;
                    // If high-severity news, create Event
                    if (this.isHighSeverityNews(article)) {
                        const eventSourceId = `news-${sourceId}`;
                        const existingEvent = await eventRepo.findOne({
                            where: { source: 'news', sourceId: eventSourceId }
                        });
                        if (!existingEvent) {
                            const location = this.extractLocation(article);
                            const event = eventRepo.create({
                                source: 'news',
                                sourceId: eventSourceId,
                                date: new Date(article.publishedAt || article.pubDate || Date.now()),
                                country: location?.country || 'Unknown',
                                latitude: location?.coordinates?.[0],
                                longitude: location?.coordinates?.[1],
                                description: article.title || '',
                                urls: [article.url || article.link || ''],
                                severity: this.calculateNewsSeverity(article),
                                tags: this.extractTags(article)
                            });
                            await eventRepo.save(event);
                            eventsCreated++;
                        }
                    }
                }
            }
            catch (error) {
                console.error(`❌ Error processing ${source.name}:`, error);
            }
        }
        console.log(`✅ News aggregation complete: ${newsCreated} news items, ${eventsCreated} events`);
        return { news: newsCreated, events: eventsCreated };
    }
    static async fetchFromAPI(source, apiKey) {
        const params = {
            q: 'Israel OR Palestine OR Gaza OR Iran OR Syria OR Lebanon OR war OR conflict OR attack',
            sortBy: 'publishedAt',
            language: 'en',
            pageSize: 50,
            apiKey
        };
        const response = await axios_1.default.get(source.url, { params });
        return response.data.articles || [];
    }
    static async fetchFromRSS(source) {
        try {
            const feed = await this.parser.parseURL(source.url);
            return feed.items || [];
        }
        catch (error) {
            console.warn(`Failed to fetch RSS from ${source.name}:`, error);
            return [];
        }
    }
    static isWarRelated(article) {
        const text = `${article.title || ''} ${article.description || article.content || ''}`.toLowerCase();
        const keywords = [
            'war', 'conflict', 'attack', 'missile', 'bombing', 'airstrike',
            'israel', 'palestine', 'gaza', 'iran', 'syria', 'lebanon',
            'military', 'casualties', 'killed', 'wounded'
        ];
        return keywords.some(keyword => text.includes(keyword));
    }
    static isHighSeverityNews(article) {
        const text = `${article.title || ''} ${article.description || article.content || ''}`.toLowerCase();
        const highSeverityKeywords = [
            'bombing', 'attack', 'killed', 'casualties', 'airstrike', 'missile'
        ];
        return highSeverityKeywords.some(keyword => text.includes(keyword));
    }
    static generateArticleId(article) {
        const title = article.title || '';
        const date = article.publishedAt || article.pubDate || '';
        return Buffer.from(`${title}-${date}`).toString('base64').slice(0, 16);
    }
    static extractTags(article) {
        const text = `${article.title || ''} ${article.description || article.content || ''}`.toLowerCase();
        const tags = [];
        const tagMap = {
            'airstrike': ['airstrike', 'air strike', 'bombing'],
            'missile': ['missile', 'rocket'],
            'civilian': ['civilian', 'humanitarian'],
            'military': ['military', 'soldiers', 'troops'],
            'casualties': ['killed', 'dead', 'casualties', 'wounded']
        };
        Object.entries(tagMap).forEach(([tag, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        });
        return tags;
    }
    static extractLocation(article) {
        const text = `${article.title || ''} ${article.description || article.content || ''}`.toLowerCase();
        const locationMap = {
            'israel': { country: 'Israel', coordinates: [31.5, 34.75] },
            'palestine': { country: 'Palestine', coordinates: [31.9, 35.2] },
            'gaza': { country: 'Palestine', coordinates: [31.5, 34.45] },
            'iran': { country: 'Iran', coordinates: [32.0, 53.0] },
            'syria': { country: 'Syria', coordinates: [35.0, 38.0] },
            'lebanon': { country: 'Lebanon', coordinates: [33.85, 35.85] }
        };
        for (const [keyword, location] of Object.entries(locationMap)) {
            if (text.includes(keyword)) {
                return location;
            }
        }
        return null;
    }
    static calculateNewsSeverity(article) {
        const text = `${article.title || ''} ${article.description || article.content || ''}`.toLowerCase();
        if (text.includes('nuclear') || text.includes('massacre'))
            return 'critical';
        if (text.includes('bombing') || text.includes('killed'))
            return 'high';
        if (text.includes('attack') || text.includes('missile'))
            return 'medium';
        return 'low';
    }
    // Enhanced RSS fetching with better error handling and filtering
    static async fetchRSSFeed(source) {
        try {
            const parser = new rss_parser_1.default({
                timeout: 10000,
                headers: {
                    'User-Agent': 'War-Tracker-2.0-News-Aggregator'
                }
            });
            const feed = await parser.parseURL(source.url);
            return feed.items
                .filter((item) => {
                // Filter for conflict-related content if this source focuses on conflicts
                if (source.conflictFocus) {
                    const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
                    return CONFLICT_KEYWORDS.some(keyword => content.includes(keyword));
                }
                return true;
            })
                .slice(0, 20) // Limit per source
                .map((item) => ({
                title: item.title,
                description: item.contentSnippet || item.content,
                url: item.link,
                publishedAt: item.pubDate || item.isoDate,
                source: source.name,
                category: source.category,
                reliability: source.reliability,
                tags: this.extractTags(item.title + ' ' + (item.contentSnippet || '')),
                severity: this.calculateNewsSeverity(item.title + ' ' + (item.contentSnippet || ''))
            }));
        }
        catch (error) {
            console.warn(`Failed to fetch RSS from ${source.name}:`, error.message);
            return [];
        }
    }
    // Enhanced aggregation method
    static async enhancedFetchAndIngest() {
        try {
            console.log('🔄 Starting enhanced news aggregation...');
            if (!database_1.AppDataSource.isInitialized) {
                console.warn('⚠️ Database not initialized, running RSS-only aggregation');
                // Return RSS data without database storage
                const allPromises = RSS_SOURCES.map(source => this.fetchRSSFeed(source).catch(error => {
                    console.warn(`Source ${source.name} failed:`, error.message);
                    return [];
                }));
                const results = await Promise.all(allPromises);
                const allArticles = results.flat();
                return {
                    totalFetched: allArticles.length,
                    saved: 0,
                    duplicates: 0,
                    sources: RSS_SOURCES.map(s => ({
                        name: s.name,
                        category: s.category,
                        reliability: s.reliability
                    }))
                };
            }
            // Fetch from all RSS sources in parallel
            const allPromises = RSS_SOURCES.map(source => this.fetchRSSFeed(source).catch(error => {
                console.warn(`Source ${source.name} failed:`, error.message);
                return [];
            }));
            const results = await Promise.all(allPromises);
            const allArticles = results.flat();
            console.log(`📰 Fetched ${allArticles.length} articles from ${RSS_SOURCES.length} sources`);
            // Process and store articles
            let savedCount = 0;
            let duplicateCount = 0;
            const newsRepo = database_1.AppDataSource.getRepository(NewsItem_1.NewsItem);
            const eventRepo = database_1.AppDataSource.getRepository(Event_1.Event);
            for (const article of allArticles) {
                try {
                    // Check for duplicates
                    const existing = await newsRepo.findOne({
                        where: { url: article.url }
                    });
                    if (existing) {
                        duplicateCount++;
                        continue;
                    }
                    // Create and save news item
                    const newsItem = newsRepo.create({
                        source: article.source,
                        sourceId: this.generateArticleId(article),
                        title: article.title || '',
                        url: article.url || '',
                        publishedAt: new Date(article.publishedAt || Date.now()),
                        summary: article.description || '',
                        reliability: article.reliability || 80,
                        tags: article.tags || [],
                        severity: article.severity || 'low'
                    });
                    await newsRepo.save(newsItem);
                    savedCount++;
                    // Create event if high severity
                    if (article.severity === 'critical' || article.severity === 'high') {
                        const location = this.extractLocation(article);
                        const event = eventRepo.create({
                            source: 'news',
                            sourceId: `news-${newsItem.sourceId}`,
                            date: new Date(article.publishedAt || Date.now()),
                            country: location?.country || 'Unknown',
                            latitude: location?.coordinates?.[0],
                            longitude: location?.coordinates?.[1],
                            description: article.title || '',
                            urls: [article.url || ''],
                            severity: article.severity,
                            tags: article.tags || []
                        });
                        await eventRepo.save(event);
                    }
                }
                catch (error) {
                    console.warn('Failed to process article:', error.message);
                }
            }
            return {
                totalFetched: allArticles.length,
                saved: savedCount,
                duplicates: duplicateCount,
                sources: RSS_SOURCES.map(s => ({
                    name: s.name,
                    category: s.category,
                    reliability: s.reliability
                }))
            };
        }
        catch (error) {
            console.error('News aggregation failed:', error);
            throw error;
        }
    }
}
exports.NewsAggregatorJob = NewsAggregatorJob;
NewsAggregatorJob.parser = new rss_parser_1.default();
NewsAggregatorJob.sources = [
    {
        id: 'newsapi',
        name: 'NewsAPI',
        type: 'api',
        url: 'https://newsapi.org/v2/everything',
        reliability: 8
    },
    {
        id: 'reuters',
        name: 'Reuters',
        type: 'rss',
        url: 'https://feeds.reuters.com/reuters/worldNews',
        reliability: 9
    },
    {
        id: 'bbc',
        name: 'BBC',
        type: 'rss',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        reliability: 9
    },
    {
        id: 'aljazeera',
        name: 'Al Jazeera',
        type: 'rss',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        reliability: 8
    }
];
//# sourceMappingURL=newsAggregator.js.map