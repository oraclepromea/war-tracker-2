import { RSS_SOURCES, FALLBACK_RSS_SOURCES } from '../config/rssConfig';
import xml2js from 'xml2js';

export class RSSService {
  private async fetchRSSFeed(source: any): Promise<any[]> {
    try {
      console.log(`📡 Fetching RSS from ${source.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), source.timeout || 8000);
      
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'War-Tracker-RSS-Reader/2.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`❌ ${source.name}: HTTP ${response.status}`);
        return [];
      }
      
      const xmlText = await response.text();
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
        normalize: true
      });
      
      const result = await parser.parseStringPromise(xmlText);
      const items = this.extractItems(result, source.name);
      
      console.log(`✅ ${source.name}: ${items.length} articles fetched`);
      return items;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`⏱️ ${source.name}: Request timeout`);
      } else {
        console.log(`❌ Error fetching RSS from ${source.name}: ${error.message}`);
      }
      return [];
    }
  }

  private async fetchAllSources(): Promise<any[]> {
    // Use the updated RSS sources from config
    const allSources = [...RSS_SOURCES, ...FALLBACK_RSS_SOURCES];
    const results = await Promise.allSettled(
      allSources.map(source => this.fetchRSSFeed(source))
    );
    
    const allArticles: any[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });
    
    console.log(`📊 Total articles collected: ${allArticles.length}`);
    return allArticles;
  }

  private extractItems(result: any, sourceName: string): any[] {
    try {
      // Handle different RSS feed structures
      if (result.rss && result.rss.channel && result.rss.channel.item) {
        return Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : [result.rss.channel.item];
      }
      
      if (result.feed && result.feed.entry) {
        return Array.isArray(result.feed.entry) 
          ? result.feed.entry 
          : [result.feed.entry];
      }
      
      console.log(`⚠️ ${sourceName}: Unexpected RSS structure`);
      return [];
    } catch (error) {
      console.error(`❌ ${sourceName}: Error extracting items:`, error);
      return [];
    }
  }

  async getAllNews(): Promise<any[]> {
    // Implementation for getting all news
    return [];
  }
}