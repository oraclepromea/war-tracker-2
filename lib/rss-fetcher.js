import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import configManager from './config.js';
import articleValidator from './article-validator.js';

class RSSFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'War Tracker RSS Fetcher v2.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    this.rateLimiter = null;
    this.supabase = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await configManager.initialize();
      
      // Initialize Supabase client
      const supabaseConfig = configManager.getSupabaseConfig();
      this.supabase = createClient(
        supabaseConfig.url, 
        supabaseConfig.serviceRoleKey,
        {
          db: {
            schema: 'public' // Explicit default schema
          }
        }
      );
      
      // Initialize rate limiter with exponential backoff
      this.rateLimiter = configManager.createRateLimiter();
      
      this.initialized = true;
      console.log('RSS Fetcher initialized successfully');
    } catch (error) {
      throw new Error(`RSS Fetcher initialization failed: ${error.message}`);
    }
  }

  async fetchAllFeeds() {
    this.ensureInitialized();
    
    const feeds = configManager.getEnabledFeeds();
    const results = [];
    
    console.log(`Fetching ${feeds.length} enabled feeds...`);
    
    for (const feed of feeds) {
      try {
        // Get feed with DNS resolution and fallback handling
        const feedWithFallback = await configManager.getFeedWithFallback(feed);
        
        if (feedWithFallback.failed) {
          console.error(`Skipping feed ${feed.name} - all URLs failed DNS resolution`);
          results.push({
            feedName: feed.name,
            success: false,
            error: 'DNS resolution failed for all URLs',
            articles: [],
            validationSummary: null
          });
          continue;
        }
        
        // Fetch feed with retry logic
        const result = await this.fetchFeedWithRetry(feedWithFallback);
        results.push(result);
        
        // Small delay between feeds to be respectful
        await this.delay(1000);
        
      } catch (error) {
        console.error(`Unexpected error processing feed ${feed.name}:`, error);
        
        await configManager.logConnectionError(
          feed.name,
          'UNEXPECTED_ERROR',
          error.message,
          { stack: error.stack }
        );
        
        results.push({
          feedName: feed.name,
          success: false,
          error: error.message,
          articles: [],
          validationSummary: null
        });
      }
    }
    
    return results;
  }

  async fetchFeedWithRetry(feed) {
    const retryConfig = feed.retryConfig || { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000 };
    let lastError = null;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check rate limiter
        if (!this.rateLimiter.canMakeRequest()) {
          console.warn(`Rate limited - waiting before retry for ${feed.name}`);
          await this.delay(5000);
          continue;
        }
        
        // Record request attempt
        this.rateLimiter.recordRequest();
        
        // Attempt to fetch the feed
        const result = await this.fetchSingleFeed(feed);
        
        // Success - record and return
        this.rateLimiter.recordSuccess();
        return result;
        
      } catch (error) {
        lastError = error;
        this.rateLimiter.recordFailure();
        
        console.warn(`Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed for ${feed.name}: ${error.message}`);
        
        // Log error details
        await configManager.logConnectionError(
          feed.name,
          'FETCH_ATTEMPT_FAILED',
          error.message,
          {
            attempt: attempt + 1,
            maxRetries: retryConfig.maxRetries + 1,
            activeUrl: feed.activeUrl,
            errorCode: error.code,
            statusCode: error.statusCode
          }
        );
        
        // Don't retry on final attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }
        
        // Exponential backoff before retry
        await this.rateLimiter.exponentialBackoff(
          attempt,
          retryConfig.baseDelayMs,
          retryConfig.maxDelayMs
        );
      }
    }
    
    // All retries failed
    const finalError = `All ${retryConfig.maxRetries + 1} attempts failed. Last error: ${lastError?.message || 'Unknown error'}`;
    
    await configManager.logConnectionError(
      feed.name,
      'ALL_RETRIES_FAILED',
      finalError,
      {
        totalAttempts: retryConfig.maxRetries + 1,
        activeUrl: feed.activeUrl,
        lastErrorCode: lastError?.code,
        lastStatusCode: lastError?.statusCode
      }
    );
    
    return {
      feedName: feed.name,
      success: false,
      error: finalError,
      articles: [],
      validationSummary: null
    };
  }

  async fetchSingleFeed(feed) {
    const startTime = Date.now();
    const timeout = configManager.getFeedTimeout();
    const activeUrl = feed.activeUrl;
    
    try {
      console.log(`Fetching feed: ${feed.name} from ${activeUrl}`);
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        // Fetch with enhanced error handling
        const response = await fetch(activeUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'War Tracker RSS Fetcher v2.0',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'close',
          },
          timeout: timeout,
          follow: 5, // Allow up to 5 redirects
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.statusCode = response.status;
          error.code = 'HTTP_ERROR';
          throw error;
        }
        
        const feedText = await response.text();
        
        if (!feedText || feedText.trim().length === 0) {
          const error = new Error('Received empty response from feed');
          error.code = 'EMPTY_RESPONSE';
          throw error;
        }
        
        // Parse the RSS/Atom feed
        const parsedFeed = await this.parser.parseString(feedText);
        
        if (!parsedFeed || !parsedFeed.items) {
          const error = new Error('Invalid feed format - no items found');
          error.code = 'INVALID_FEED_FORMAT';
          throw error;
        }
        
        // Process and validate articles
        const processedResult = await this.processAndValidateArticles(parsedFeed.items, feed);
        
        const fetchTime = Date.now() - startTime;
        console.log(`Successfully processed ${processedResult.validArticles.length} valid articles from ${feed.name} in ${fetchTime}ms`);
        
        return {
          feedName: feed.name,
          success: true,
          articles: processedResult.validArticles,
          validationSummary: processedResult.validationSummary,
          metadata: {
            fetchTime,
            feedTitle: parsedFeed.title,
            feedDescription: parsedFeed.description,
            lastBuildDate: parsedFeed.lastBuildDate,
            totalItems: parsedFeed.items.length,
            validItems: processedResult.validArticles.length,
            activeUrl: activeUrl
          }
        };
        
      } finally {
        clearTimeout(timeoutId);
      }
      
    } catch (error) {
      const fetchTime = Date.now() - startTime;
      
      // Enhanced error classification
      if (error.name === 'AbortError') {
        error.code = 'TIMEOUT';
        error.message = `Request timed out after ${timeout}ms`;
      } else if (error.code === 'ENOTFOUND') {
        error.code = 'DNS_ERROR';
        error.message = `DNS resolution failed for ${new URL(activeUrl).hostname}`;
      } else if (error.code === 'ECONNREFUSED') {
        error.code = 'CONNECTION_REFUSED';
        error.message = `Connection refused by ${new URL(activeUrl).hostname}`;
      } else if (error.code === 'ECONNRESET') {
        error.code = 'CONNECTION_RESET';
        error.message = `Connection reset by ${new URL(activeUrl).hostname}`;
      } else if (error.code === 'ETIMEDOUT') {
        error.code = 'CONNECTION_TIMEOUT';
        error.message = `Connection timed out to ${new URL(activeUrl).hostname}`;
      }
      
      // Add metadata to error
      error.fetchTime = fetchTime;
      error.feedName = feed.name;
      error.activeUrl = activeUrl;
      
      throw error;
    }
  }

  async processAndValidateArticles(items, feed) {
    console.log(`🔍 Processing and validating ${items.length} articles from ${feed.name}...`);
    
    // Initialize article validator
    await articleValidator.initialize();
    
    // Normalize articles first
    const normalizedArticles = items
      .map(item => this.normalizeArticle(item, feed))
      .filter(article => article !== null)
      .slice(0, 50); // Limit to 50 most recent articles
    
    // Validate articles in batch
    const validationResult = await articleValidator.validateBatch(normalizedArticles, feed.name);
    
    // Store valid articles with enhanced metadata
    const validArticles = validationResult.validArticles.map(article => ({
      ...article,
      source: feed.name,
      category: feed.category || 'General',
      fetchedAt: new Date().toISOString(),
      // Remove temporary validation fields before storage
      similarArticles: undefined
    }));
    
    // Store articles in database with upsert logic
    if (validArticles.length > 0) {
      await this.upsertArticles(validArticles);
    }
    
    // Log validation results
    if (validationResult.invalidArticles.length > 0) {
      console.warn(`⚠️ ${validationResult.invalidArticles.length} articles failed validation`);
    }
    
    if (validationResult.duplicateArticles.length > 0) {
      console.info(`ℹ️ ${validationResult.duplicateArticles.length} duplicate articles skipped`);
    }
    
    return {
      validArticles,
      validationSummary: validationResult.summary
    };
  }

  async upsertArticles(articles) {
    try {
      // Use upsert to handle potential duplicates at database level
      const { data, error } = await this.supabase
        .from('articles')
        .upsert(articles, {
          onConflict: 'content_hash',
          ignoreDuplicates: false
        })
        .select('id, content_hash');
      
      if (error) {
        console.error('Failed to upsert articles:', error.message);
        throw error;
      }
      
      console.log(`📝 Successfully upserted ${data?.length || articles.length} articles to database`);
      return data;
      
    } catch (error) {
      console.error('Article upsert failed:', error.message);
      
      // Log individual articles on batch failure
      await configManager.logConnectionError(
        'BATCH_UPSERT',
        'DATABASE_UPSERT_FAILED',
        error.message,
        { articleCount: articles.length }
      );
      
      throw error;
    }
  }

  processArticles(items, feed) {
    return items
      .map(item => this.normalizeArticle(item, feed))
      .filter(article => article !== null)
      .slice(0, 50); // Limit to 50 most recent articles
  }

  normalizeArticle(item, feed) {
    try {
      // Extract and clean article data
      const title = this.cleanText(item.title);
      const link = item.link || item.guid;
      const description = this.cleanText(item.contentSnippet || item.content || item.summary || '');
      const pubDate = this.parseDate(item.pubDate || item.isoDate);
      
      // Skip articles without essential data
      if (!title || !link) {
        return null;
      }
      
      // Extract categories/tags
      const categories = this.extractCategories(item);
      
      return {
        title,
        link,
        description,
        pubDate,
        guid: item.guid || link,
        author: item.creator || item.author || null,
        tags: categories,
        // Will be set during validation
        contentHash: null,
        isValid: null,
        validationWarnings: []
      };
    } catch (error) {
      console.warn(`Failed to normalize article from ${feed.name}:`, error.message);
      return null;
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 1000); // Limit length
  }

  parseDate(dateString) {
    if (!dateString) return new Date().toISOString();
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  extractCategories(item) {
    const categories = [];
    
    if (item.categories) {
      categories.push(...item.categories);
    }
    
    if (item.category) {
      if (Array.isArray(item.category)) {
        categories.push(...item.category);
      } else {
        categories.push(item.category);
      }
    }
    
    return categories.slice(0, 5); // Limit to 5 categories
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('RSSFetcher not initialized. Call initialize() first.');
    }
  }

  // Cleanup method
  async cleanup() {
    await configManager.cleanup();
    articleValidator.cleanup();
    console.log('RSS Fetcher cleaned up');
  }
}

// Export singleton instance
const rssFetcher = new RSSFetcher();

export default rssFetcher;