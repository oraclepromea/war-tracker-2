// Enhanced Data Sources Integration Service
import fetch from 'node-fetch';
import * as xml2js from 'xml2js';
// Use xmldom instead of jsdom for server-side XML parsing
import { DOMParser } from 'xmldom';
import { AIEventAnalyzer, EnhancedEvent } from './aiAnalyzer';
import Parser from 'rss-parser';

// Add missing WarEvent interface
export interface WarEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  date: string;
  source: string;
  type: string;
  verified: boolean;
  link: string;
  location: string | { latitude: number; longitude: number };
  severity: 'critical' | 'high' | 'medium' | 'low';
  language?: string;
}

// Extend the EnhancedEvent interface to include sourceType
interface ExtendedEnhancedEvent extends EnhancedEvent {
  sourceType?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'rss' | 'social' | 'government' | 'satellite' | 'telegram' | 'multilang';
  url: string;
  language: string;
  region: string[];
  active: boolean;
  enabled?: boolean; // For backward compatibility
  reliability: number; // 0-1 scale
  lastUpdate: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  confidence: number;
  location: { latitude: number; longitude: number } | string;
  type: 'news' | 'government' | 'social' | 'telegram' | 'multilang';
  classification?: string;
  language?: string;
  link?: string;
}

export class EnhancedDataSourceManager {
  private static instance: EnhancedDataSourceManager;
  private aiAnalyzer: AIEventAnalyzer;
  
  // MASSIVELY EXPANDED data sources including government and social media
  private dataSources: DataSource[] = [
    // ENGLISH RSS SOURCES
    {
      id: 'reuters-world',
      name: 'Reuters World News',
      type: 'rss',
      url: 'https://feeds.reuters.com/reuters/worldNews',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.95,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'bbc-world',
      name: 'BBC World News',
      type: 'rss',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.93,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'ap-news',
      name: 'Associated Press',
      type: 'rss',
      url: 'https://feeds.apnews.com/ApNews/World',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.94,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'cnn-world',
      name: 'CNN World News',
      type: 'rss',
      url: 'http://rss.cnn.com/rss/edition.rss',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.87,
      lastUpdate: new Date().toISOString()
    },

    // US GOVERNMENT SOURCES
    {
      id: 'pentagon-news',
      name: 'US Department of Defense',
      type: 'government',
      url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=20',
      language: 'en',
      region: ['global', 'us'],
      active: true,
      reliability: 0.98,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'state-dept',
      name: 'US State Department',
      type: 'government',
      url: 'https://www.state.gov/rss-feeds/',
      language: 'en',
      region: ['global', 'us'],
      active: true,
      reliability: 0.97,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'nato-news',
      name: 'NATO Official News',
      type: 'government',
      url: 'https://www.nato.int/rss/news.xml',
      language: 'en',
      region: ['europe', 'global'],
      active: true,
      reliability: 0.98,
      lastUpdate: new Date().toISOString()
    },

    // UKRAINE SOURCES
    {
      id: 'ukraine-defense-en',
      name: 'Ukraine Ministry of Defense (EN)',
      type: 'government',
      url: 'https://www.mil.gov.ua/en/news/',
      language: 'en',
      region: ['ukraine', 'eastern_europe'],
      active: true,
      reliability: 0.90,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'ukraine-defense-uk',
      name: 'Ukraine Ministry of Defense (UA)',
      type: 'government',
      url: 'https://www.mil.gov.ua/news/',
      language: 'uk',
      region: ['ukraine', 'eastern_europe'],
      active: true,
      reliability: 0.92,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'kyiv-independent',
      name: 'Kyiv Independent',
      type: 'rss',
      url: 'https://kyivindependent.com/rss/',
      language: 'en',
      region: ['ukraine', 'eastern_europe'],
      active: true,
      reliability: 0.88,
      lastUpdate: new Date().toISOString()
    },

    // ISRAEL SOURCES
    {
      id: 'idf-en',
      name: 'Israel Defense Forces (EN)',
      type: 'government',
      url: 'https://www.idf.il/en/mini-sites/wars-and-operations/',
      language: 'en',
      region: ['israel', 'middle_east'],
      active: true,
      reliability: 0.93,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'idf-he',
      name: 'Israel Defense Forces (HE)',
      type: 'government',
      url: 'https://www.idf.il/he/',
      language: 'he',
      region: ['israel', 'middle_east'],
      active: true,
      reliability: 0.94,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'times-israel',
      name: 'Times of Israel',
      type: 'rss',
      url: 'https://www.timesofisrael.com/feed/',
      language: 'en',
      region: ['israel', 'middle_east'],
      active: true,
      reliability: 0.87,
      lastUpdate: new Date().toISOString()
    },

    // ARABIC SOURCES
    {
      id: 'aljazeera-ar',
      name: 'Al Jazeera Arabic',
      type: 'rss',
      url: 'https://www.aljazeera.net/rss.xml',
      language: 'ar',
      region: ['middle_east', 'arab_world'],
      active: true,
      reliability: 0.85,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'alarabiya-ar',
      name: 'Al Arabiya',
      type: 'rss',
      url: 'https://www.alarabiya.net/rss.xml',
      language: 'ar',
      region: ['middle_east', 'arab_world'],
      active: true,
      reliability: 0.83,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'ahram-ar',
      name: 'Al Ahram',
      type: 'rss',
      url: 'http://www.ahram.org.eg/rss/ahram.xml',
      language: 'ar',
      region: ['middle_east', 'egypt'],
      active: true,
      reliability: 0.80,
      lastUpdate: new Date().toISOString()
    },

    // RUSSIAN SOURCES
    {
      id: 'rt-ru',
      name: 'RT Russian',
      type: 'rss',
      url: 'https://russian.rt.com/rss',
      language: 'ru',
      region: ['russia', 'eastern_europe'],
      active: true,
      reliability: 0.70, // Lower due to potential bias
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'interfax-ru',
      name: 'Interfax Russia',
      type: 'rss',
      url: 'https://www.interfax.ru/rss.asp',
      language: 'ru',
      region: ['russia', 'eastern_europe'],
      active: true,
      reliability: 0.78,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'tass-ru',
      name: 'TASS Russian',
      type: 'rss',
      url: 'https://tass.ru/rss/v2.xml',
      language: 'ru',
      region: ['russia', 'eastern_europe'],
      active: true,
      reliability: 0.75,
      lastUpdate: new Date().toISOString()
    },

    // SOCIAL MEDIA / OSINT SOURCES
    {
      id: 'osint-twitter',
      name: 'OSINT Twitter Aggregator',
      type: 'social',
      url: 'https://api.twitter.com/2/tweets/search/recent',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.70,
      lastUpdate: new Date().toISOString()
    },

    // TELEGRAM CHANNELS
    {
      id: 'telegram-intel',
      name: 'Intelligence Telegram Channels',
      type: 'telegram',
      url: 'telegram://resolve?domain=intelligence',
      language: 'en',
      region: ['global'],
      active: true,
      reliability: 0.65,
      lastUpdate: new Date().toISOString()
    }
  ];

  // Enhanced OSINT Twitter accounts for monitoring
  private osintAccounts = [
    '@IntelCrab', '@Osinttechnical', '@Conflicts', '@Archer83Able',
    '@UAWeapons', '@Blue_Sauron', '@GeoConfirmed', '@200_zoka',
    '@WarMonitor3', '@sentdefender', '@NotWoofers', '@Caucasuswar',
    '@Rebel44CZ', '@RALee85', '@Danspiun', '@MotolkoHelp',
    '@ChristopherJM', '@JulianRoepcke', '@michaelh992', '@Nrg8000',
    '@EliotHiggins', '@beltrew', '@CalibreObscura', '@CovertShores'
  ];

  // Expanded Telegram channels for real-time monitoring
  private telegramChannels = [
    'IntelSlava', 'rybar_en', 'warmonitor', 'conflictsz',
    'military_corner', 'defence_blog', 'ukraine_weapons',
    'intel_slava_unofficial', 'grey_zone', 'wargonzo',
    'rlz_the_furry', 'southfront', 'mod_russia',
    'ukr_leaks_eng', 'fighter_bomber', 'boris_rozhin'
  ];

  public static getInstance(): EnhancedDataSourceManager {
    if (!EnhancedDataSourceManager.instance) {
      EnhancedDataSourceManager.instance = new EnhancedDataSourceManager();
    }
    return EnhancedDataSourceManager.instance;
  }

  constructor() {
    this.aiAnalyzer = AIEventAnalyzer.getInstance();
  }

  /**
   * Fetch real events from all active sources - RSS ONLY
   */
  public async fetchAllSources(): Promise<Event[]> {
    console.log('🔍 EnhancedDataSourceManager: fetchAllSources called');
    const allEvents: Event[] = [];
    const errors: string[] = [];

    console.log('📊 EnhancedDataSourceManager: Processing', this.dataSources.length, 'sources');

    for (const source of this.dataSources) {
      console.log(`🔍 EnhancedDataSourceManager: Processing source: ${source.name}`);
      console.log(`🔍 EnhancedDataSourceManager: Source config:`, source);
      
      try {
        const events = await this.fetchFromSource(source);
        console.log(`✅ EnhancedDataSourceManager: ${source.name} returned ${events.length} events`);
        
        if (events.length > 0) {
          console.log(`📋 EnhancedDataSourceManager: Sample event from ${source.name}:`, events[0]);
        }
        
        allEvents.push(...events);
      } catch (error) {
        console.error(`❌ EnhancedDataSourceManager: Error fetching from ${source.name}:`, error);
        console.error(`❌ EnhancedDataSourceManager: Error stack for ${source.name}:`, error instanceof Error ? error.stack : 'No stack');
        errors.push(`${source.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`🏁 EnhancedDataSourceManager: Total events collected: ${allEvents.length}`);
    console.log(`🏁 EnhancedDataSourceManager: Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.warn('⚠️ EnhancedDataSourceManager: Errors:', errors);
    }

    // Sort by timestamp (newest first)
    const sortedEvents = allEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`🎯 EnhancedDataSourceManager: Returning ${sortedEvents.length} sorted events`);
    return sortedEvents.slice(0, 50); // Limit to 50 most recent
  }

  private async fetchFromSource(source: DataSource): Promise<Event[]> {
    console.log(`🔍 EnhancedDataSourceManager: fetchFromSource called for ${source.name}`);
    console.log(`🔍 EnhancedDataSourceManager: Config for ${source.name}:`, source);
    
    if (source.type === 'rss') {
      console.log(`📡 EnhancedDataSourceManager: Fetching RSS from ${source.url}`);
      return this.fetchRSSFeed(source.url, source.name, []);
    }
    
    console.warn(`⚠️ EnhancedDataSourceManager: Unknown source type: ${source.type} for ${source.name}`);
    return [];
  }

  private async fetchRSSFeed(url: string, sourceName: string, keywords: string[] = []): Promise<Event[]> {
    console.log(`📡 EnhancedDataSourceManager: fetchRSSFeed called for ${sourceName}`);
    console.log(`📡 EnhancedDataSourceManager: URL: ${url}`);
    console.log(`📡 EnhancedDataSourceManager: Keywords: ${keywords}`);
    
    try {
      const parser = new Parser({
        timeout: 10000,
        headers: {
          'User-Agent': 'War-Tracker-Bot/2.0 (+https://github.com/war-tracker)'
        }
      });

      console.log(`📡 EnhancedDataSourceManager: Parsing RSS feed for ${sourceName}...`);
      const feed = await parser.parseURL(url);
      console.log(`📡 EnhancedDataSourceManager: RSS feed parsed successfully for ${sourceName}`);
      console.log(`📡 EnhancedDataSourceManager: Feed title: ${feed.title}`);
      console.log(`📡 EnhancedDataSourceManager: Feed items count: ${feed.items?.length || 0}`);

      if (!feed.items || feed.items.length === 0) {
        console.warn(`⚠️ EnhancedDataSourceManager: No items in RSS feed for ${sourceName}`);
        return [];
      }

      const events: Event[] = [];
      
      for (const item of feed.items.slice(0, 20)) { // Limit to 20 items per feed
        console.log(`📋 EnhancedDataSourceManager: Processing item: ${item.title}`);
        
        const content = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.toLowerCase();
        
        // Filter by keywords if provided
        if (keywords.length > 0) {
          const hasKeyword = keywords.some(keyword => 
            content.includes(keyword.toLowerCase())
          );
          
          if (!hasKeyword) {
            console.log(`🔍 EnhancedDataSourceManager: Item filtered out (no keywords): ${item.title}`);
            continue;
          }
        }

        const event: Event = {
          id: `${sourceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || 'No description available',
          source: sourceName,
          timestamp: new Date(item.timestamp || item.pubDate || Date.now()),
          link: item.link || undefined,
          type: 'news',
          confidence: 0.8,
          location: 'Unknown',
        };

        console.log(`✅ EnhancedDataSourceManager: Created event: ${event.title}`);
        events.push(event);
      }

      console.log(`🎯 EnhancedDataSourceManager: ${sourceName} processed ${events.length} events`);
      return events;

    } catch (error) {
      console.error(`❌ EnhancedDataSourceManager: RSS fetch failed for ${sourceName}:`, error);
      console.error(`❌ EnhancedDataSourceManager: RSS error stack:`, error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Fetch RSS source with enhanced parsing and debugging
   */
  private async fetchRSSSource(source: DataSource): Promise<any[]> {
    try {
      console.log(`🔍 Fetching RSS from ${source.name} at ${source.url}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status} from ${source.name}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const xml = await response.text();
      console.log(`📄 Received ${xml.length} chars from ${source.name}`);
      
      // Try multiple parsing approaches
      let items: RegExpMatchArray | null = null;
      
      // RSS format
      items = xml.match(/<item[^>]*>(.*?)<\/item>/gs);
      if (!items) {
        // Atom format
        items = xml.match(/<entry[^>]*>(.*?)<\/entry>/gs);
      }
      
      if (!items || items.length === 0) {
        console.log(`⚠️ No items found in RSS from ${source.name}`);
        return [];
      }
      
      console.log(`📰 Found ${items.length} items in ${source.name}`);
      
      const events = [];

      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        
        const title = this.extractXMLContent(item, 'title');
        const description = this.extractXMLContent(item, 'description') || 
                           this.extractXMLContent(item, 'summary') ||
                           this.extractXMLContent(item, 'content');
        const pubDate = this.extractXMLContent(item, 'pubDate') ||
                       this.extractXMLContent(item, 'published') ||
                       this.extractXMLContent(item, 'updated');
        const link = this.extractXMLContent(item, 'link');
        
        console.log(`📰 REAL CONTENT - Item ${i + 1}:`);
        console.log(`   ACTUAL TITLE: "${title}"`);
        console.log(`   ACTUAL DESC: "${description?.substring(0, 100)}..."`);
        
        if (title && title.length > 5) {
          const cleanDesc = this.cleanDescription(description || title);
          
          // STOP FILTERING - Include ALL real RSS content, not just conflict-related
          const event = {
            id: `${source.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title.trim(), // USE EXACT RSS TITLE
            description: cleanDesc, // USE EXACT RSS DESCRIPTION
            timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            date: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            link: link,
            location: this.extractLocation(title + ' ' + cleanDesc),
            severity: this.determineSeverity(title + ' ' + cleanDesc),
            type: 'news_report',
            verified: source.reliability > 0.8,
            language: source.language,
            sourceType: 'rss'
          };
          
          events.push(event);
          console.log(`✅ PRESERVED REAL EVENT: "${event.title}" | "${event.description.substring(0, 50)}..."`);
        }
      }

      console.log(`✅ Processed ${events.length} REAL RSS events from ${source.name}`);
      return events;
      
    } catch (error) {
      console.error(`❌ Error fetching RSS from ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Fetch from government APIs and RSS feeds
   */
  private async fetchGovernmentSource(source: any): Promise<any[]> {
    const events: any[] = [];
    
    try {
      if (source.url.includes('rss') || source.url.includes('xml')) {
        const response = await fetch(source.url);
        const xmlText = await response.text();
        const dom = new DOMParser().parseFromString(xmlText, 'text/xml');
        
        const items = dom.getElementsByTagName('item');
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const title = item.getElementsByTagName('title')[0]?.textContent;
          const description = item.getElementsByTagName('description')[0]?.textContent;
          const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent;
          const link = item.getElementsByTagName('link')[0]?.textContent;
          
          if (title && description) {
            events.push({
              id: `gov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: title.trim(),
              description: description.trim(),
              timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              source: source.name,
              type: 'government_statement',
              verified: true,
              url: link,
              language: 'en',
              reliability: source.reliability
            });
          }
        }
      }
    } catch (error) {
      console.error(`Government source fetch error for ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    return events;
  }

  /**
   * Fetch from social media APIs (Twitter, etc.)
   */
  private async fetchSocialMediaSource(source: any): Promise<any[]> {
    const events: any[] = [];
    
    try {
      // Would integrate with Twitter API, Reddit API, etc.
      // For now, return empty array until API keys are configured
      console.log(`Social media source ${source.name} requires API configuration`);
    } catch (error) {
      console.error(`Social media source fetch error for ${source.name}:`, error);
    }
    
    return events;
  }

  /**
   * Fetch from Telegram channels via API
   */
  private async fetchTelegramSource(source: any): Promise<any[]> {
    const events: any[] = [];
    
    try {
      // Would integrate with Telegram Bot API
      // For now, return empty array until API keys are configured
      console.log(`Telegram source ${source.name} requires API configuration`);
    } catch (error) {
      console.error(`Telegram source fetch error for ${source.name}:`, error);
    }
    
    return events;
  }

  /**
   * Fetch from multi-language news sources
   */
  private async fetchMultiLanguageSource(source: any): Promise<any[]> {
    const events: any[] = [];
    
    try {
      if (source.url.includes('rss') || source.url.includes('xml')) {
        const response = await fetch(source.url);
        const xmlText = await response.text();
        const dom = new DOMParser().parseFromString(xmlText, 'text/xml');
        
        const items = dom.getElementsByTagName('item');
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const title = item.getElementsByTagName('title')[0]?.textContent;
          const description = item.getElementsByTagName('description')[0]?.textContent;
          const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent;
          const link = item.getElementsByTagName('link')[0]?.textContent;
          
          if (title && description) {
            events.push({
              id: `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: title.trim(),
              description: description.trim(),
              timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              source: source.name,
              type: 'international_report',
              verified: false,
              url: link,
              language: source.language || 'en',
              reliability: source.reliability
            });
          }
        }
      }
    } catch (error) {
      console.error(`Multi-language source fetch error for ${source.name}:`, error);
    }
    
    return events;
  }

  /**
   * Remove duplicate events using AI analysis
   */
  private removeDuplicates(events: EnhancedEvent[]): EnhancedEvent[] {
    const unique: EnhancedEvent[] = [];
    
    for (const event of events) {
      const isDuplicate = unique.some(existingEvent => {
        if (event.classification?.similarEvents.includes(existingEvent.id)) {
          return true;
        }
        
        // Check for text similarity
        const similarity = this.calculateSimilarity(
          event.title + ' ' + event.description,
          existingEvent.title + ' ' + existingEvent.description
        );
        
        return similarity > 0.8 && event.location === existingEvent.location;
      });
      
      if (!isDuplicate) {
        unique.push(event);
      }
    }
    
    return unique;
  }

  /**
   * Get source reliability score
   */
  private getSourceReliability(sourceName: string): number {
    const source = this.dataSources.find(s => s.name === sourceName);
    return source?.reliability || 0.5;
  }

  /**
   * Enhanced conflict detection with broader keywords
   */
  private isConflictRelated(text: string): boolean {
    const conflictKeywords = [
      // Direct conflict terms
      'war', 'conflict', 'military', 'attack', 'strike', 'bombing', 'battle',
      'invasion', 'offensive', 'defense', 'combat', 'operation', 'troops',
      
      // Geographic conflict zones
      'ukraine', 'russia', 'gaza', 'israel', 'palestine', 'lebanon', 'syria',
      'yemen', 'iran', 'iraq', 'afghanistan', 'sudan', 'ethiopia', 'somalia',
      'myanmar', 'taiwan', 'china', 'north korea', 'south korea',
      
      // Weapons and military equipment
      'missile', 'drone', 'artillery', 'tank', 'fighter jet', 'submarine',
      'nuclear', 'weapons', 'ammunition', 'rocket', 'bomb', 'explosive',
      
      // Military actions and outcomes
      'casualties', 'killed', 'wounded', 'injured', 'dead', 'deaths',
      'ceasefire', 'truce', 'peace talks', 'diplomatic', 'sanctions',
      'evacuation', 'refugee', 'humanitarian', 'aid', 'crisis',
      
      // Organizations and military
      'nato', 'pentagon', 'military base', 'armed forces', 'soldiers',
      'marines', 'navy', 'air force', 'special forces', 'intelligence',
      
      // Political and security terms
      'security', 'terrorism', 'extremist', 'rebel', 'insurgent',
      'government forces', 'opposition', 'militia', 'peacekeeping'
    ];
    
    const lowerText = text.toLowerCase();
    return conflictKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract content from XML with better handling
   */
  private extractXMLContent(xml: string, tag: string): string {
    // Handle CDATA sections
    const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();
    
    // Handle regular tags
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's');
    const match = xml.match(regex);
    if (match) return match[1].trim();
    
    // Handle self-closing tags with href attribute (for links)
    if (tag === 'link') {
      const hrefRegex = new RegExp(`<${tag}[^>]*href=["']([^"']*)["'][^>]*/?>`);
      const hrefMatch = xml.match(hrefRegex);
      if (hrefMatch) return hrefMatch[1];
    }
    
    return '';
  }

  /**
   * Clean HTML from descriptions
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, '')
      .substring(0, 300)
      .trim();
  }

  /**
   * Check if content is war/conflict related
   */
  private isWarRelated(text: string): boolean {
    const warKeywords = [
      'war', 'conflict', 'military', 'attack', 'strike', 'bombing', 'battle',
      'ukraine', 'russia', 'gaza', 'israel', 'palestine', 'lebanon', 'syria',
      'missile', 'drone', 'artillery', 'troops', 'casualties', 'ceasefire',
      'invasion', 'offensive', 'defense', 'combat', 'operation'
    ];
    
    const lowerText = text.toLowerCase();
    return warKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string | { latitude: number; longitude: number } {
    const locations = [
      'Gaza', 'West Bank', 'Ukraine', 'Russia', 'Israel', 'Palestine', 
      'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Donetsk', 'Kharkiv', 'Bakhmut',
      'Kyiv', 'Moscow', 'Tel Aviv', 'Damascus', 'Baghdad', 'Beirut'
    ];
    
    for (const location of locations) {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        return location;
      }
    }
    return 'Unknown';
  }

  /**
   * Determine severity from content
   */
  private determineSeverity(text: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('killed') || lowerText.includes('dead') || lowerText.includes('explosion')) {
      return 'critical';
    } else if (lowerText.includes('injured') || lowerText.includes('wounded') || lowerText.includes('attack')) {
      return 'high';
    } else if (lowerText.includes('military') || lowerText.includes('forces')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Calculate text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(' ').filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(' ').filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get all data sources configuration
   */
  public getDataSources(): DataSource[] {
    return this.dataSources;
  }

  /**
   * Update data source configuration
   */
  public updateDataSource(id: string, updates: Partial<DataSource>): boolean {
    const index = this.dataSources.findIndex(s => s.id === id);
    if (index !== -1) {
      this.dataSources[index] = { ...this.dataSources[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Add new data source
   */
  public addDataSource(source: DataSource): void {
    this.dataSources.push(source);
  }

  async fetchRSSEvents(sources: DataSource[]): Promise<WarEvent[]> {
    const events: WarEvent[] = [];
    
    for (const source of sources) {
      try {
        console.log(`📡 Fetching RSS from ${source.name}...`);
        
        // Add better error handling and timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'War-Tracker-2.0/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log(`❌ ${source.name}: HTTP ${response.status}`);
          continue;
        }
        
        const xmlText = await response.text();
        
        // Clean up malformed XML before parsing
        const cleanXml = xmlText
          .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')
          .replace(/<!\[CDATA\[.*?\]\]>/gs, (match) => match.replace(/&/g, '&amp;'));
        
        const result = await xml2js.parseStringPromise(cleanXml, {
          explicitArray: false,
          ignoreAttrs: false,
          trim: true,
          normalize: true,
          normalizeTags: true,
          explicitRoot: false
        });

        // ...existing parsing logic...
        
      } catch (error) {
        console.log(`❌ Error fetching RSS from ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
        // Continue with other sources instead of failing completely
        continue;
      }
    }
    
    return events;
  }

  async fetchGovernmentEvents(sources: DataSource[]): Promise<Event[]> {
    console.log('🏛️ DISABLED: Government source fetching (preventing mock data)');
    return []; // Return empty array instead of mock data
  }

  async fetchSocialMediaEvents(sources: DataSource[]): Promise<Event[]> {
    console.log('📱 DISABLED: Social media fetching (preventing mock data)');
    return []; // Return empty array instead of mock data
  }

  async fetchTelegramEvents(sources: DataSource[]): Promise<Event[]> {
    console.log('💬 DISABLED: Telegram fetching (preventing mock data)');
    return []; // Return empty array instead of mock data
  }

  async fetchMultiLanguageEvents(sources: DataSource[]): Promise<Event[]> {
    console.log('🌍 DISABLED: Multi-language fetching (preventing mock data)');
    return []; // Return empty array instead of mock data
  }

  async getRegionalPredictions(region: string): Promise<any[]> {
    // Simulate regional predictions based on current data sources and AI analysis
    const currentEvents = await this.fetchAllSources();
    const regionEvents = currentEvents.filter(event => 
      typeof event.location === 'string' ? 
        event.location.toLowerCase().includes(region.toLowerCase()) :
        false
    );

    return [
      {
        region,
        prediction: regionEvents.length > 10 ? 'High conflict activity' : 'Moderate conflict risk',
        confidence: Math.min(0.95, 0.5 + (regionEvents.length * 0.05)),
        factors: [
          'Recent event frequency',
          'Source reliability scores', 
          'AI sentiment analysis',
          'Historical patterns'
        ],
        eventCount: regionEvents.length,
        lastUpdated: new Date().toISOString(),
        riskLevel: regionEvents.length > 15 ? 'critical' : 
                  regionEvents.length > 10 ? 'high' : 
                  regionEvents.length > 5 ? 'medium' : 'low'
      }
    ];
  }

  private generateEventId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private categorizeEvent(title: string, description: string): string {
    // Implementation for categorizing events
    return 'general';
  }

  private calculateSeverity(title: string, description: string): number {
    // Implementation for calculating severity
    return 1;
  }
}