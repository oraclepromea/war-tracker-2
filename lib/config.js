import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import NodeCache from 'node-cache';

// Environment variables validation schema
const envSchema = z.object({
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  FEED_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('5000'),
});

// Feed configuration schema with fallback URLs
const feedSchema = z.object({
  name: z.string().min(1, 'Feed name is required'),
  url: z.string().url('Invalid feed URL'),
  fallbackUrls: z.array(z.string().url()).optional().default([]),
  enabled: z.boolean().default(true),
  category: z.string().optional(),
  retryConfig: z.object({
    maxRetries: z.number().positive().default(3),
    baseDelayMs: z.number().positive().default(1000),
    maxDelayMs: z.number().positive().default(30000),
  }).optional().default({}),
});

const feedsConfigSchema = z.object({
  feeds: z.array(feedSchema),
  allowedDomains: z.array(z.string()).default([]),
  enforceHttps: z.boolean().default(true),
  dnsConfig: z.object({
    cacheTtlSeconds: z.number().positive().default(300), // 5 minutes
    enableHostsFileOverride: z.boolean().default(true),
    fallbackDnsServers: z.array(z.string()).default(['8.8.8.8', '1.1.1.1']),
  }).optional().default({}),
});

// Rate limiting configuration
const rateLimitSchema = z.object({
  requestsPerMinute: z.number().positive().default(10),
  maxConsecutiveFailures: z.number().positive().default(5),
  pauseDurationMs: z.number().positive().default(60000), // 1 minute pause
});

// DNS cache configuration
const dnsCacheSchema = z.object({
  ttlSeconds: z.number().positive().default(300),
  checkPeriodSeconds: z.number().positive().default(60),
  maxKeys: z.number().positive().default(1000),
});

// Error logging configuration
const errorLoggingSchema = z.object({
  logToSupabase: z.boolean().default(true),
  tableName: z.string().default('connection_errors'),
  batchSize: z.number().positive().default(10),
  flushIntervalMs: z.number().positive().default(30000),
});

class ConfigManager {
  constructor() {
    this.env = null;
    this.feeds = null;
    this.rateLimit = null;
    this.dnsCache = null;
    this.errorLogging = null;
    this.initialized = false;
    
    // Initialize DNS cache
    this.initializeDnsCache();
    
    // Initialize error batch for logging
    this.errorBatch = [];
    this.errorFlushTimer = null;
  }

  initializeDnsCache() {
    const defaultConfig = dnsCacheSchema.parse({});
    this.dnsCache = new NodeCache({
      stdTTL: defaultConfig.ttlSeconds,
      checkperiod: defaultConfig.checkPeriodSeconds,
      maxKeys: defaultConfig.maxKeys,
      useClones: false,
    });
  }

  // ...existing code...

  async initialize() {
    if (this.initialized) return;

    try {
      // Validate environment variables
      this.env = envSchema.parse({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        FEED_TIMEOUT_MS: process.env.FEED_TIMEOUT_MS || '5000',
      });

      // Load and validate feeds configuration
      await this.loadFeedsConfig();

      // Initialize rate limiting config
      this.rateLimit = rateLimitSchema.parse({
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM) || 10,
        maxConsecutiveFailures: parseInt(process.env.MAX_CONSECUTIVE_FAILURES) || 5,
        pauseDurationMs: parseInt(process.env.PAUSE_DURATION_MS) || 60000,
      });

      // Initialize error logging config
      this.errorLogging = errorLoggingSchema.parse({
        logToSupabase: process.env.LOG_ERRORS_TO_SUPABASE !== 'false',
        tableName: process.env.ERROR_LOG_TABLE || 'connection_errors',
        batchSize: parseInt(process.env.ERROR_BATCH_SIZE) || 10,
        flushIntervalMs: parseInt(process.env.ERROR_FLUSH_INTERVAL) || 30000,
      });

      // Start error flush timer
      this.startErrorFlushTimer();

      this.initialized = true;
    } catch (error) {
      throw new Error(`Configuration initialization failed: ${error.message}`);
    }
  }

  async loadFeedsConfig() {
    const configPath = path.resolve(process.cwd(), 'config/feeds.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const parsedConfig = JSON.parse(configData);
      
      // Apply Reuters feed replacements
      parsedConfig.feeds = this.replaceReutersFeeds(parsedConfig.feeds || []);
      
      this.feeds = feedsConfigSchema.parse(parsedConfig);
      
      // Update DNS cache configuration
      if (this.feeds.dnsConfig) {
        this.updateDnsCacheConfig(this.feeds.dnsConfig);
      }
      
      // Validate and enforce HTTPS
      this.feeds.feeds = this.feeds.feeds.map(feed => this.processFeedUrl(feed));
      
      // Validate domains if allow-list is configured
      if (this.feeds.allowedDomains.length > 0) {
        this.validateFeedDomains();
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Feeds configuration file not found at ${configPath}`);
      }
      throw new Error(`Failed to load feeds configuration: ${error.message}`);
    }
  }

  replaceReutersFeeds(feeds) {
    return feeds.map(feed => {
      if (feed.url && feed.url.includes('feeds.reuters.com')) {
        return {
          ...feed,
          url: 'https://feed.reuters.com/reuters/worldNews',
          fallbackUrls: [
            'http://feeds2.reuters.com/reuters/worldNews',
            'https://www.reuters.com/tools/rss'
          ],
          retryConfig: {
            maxRetries: 5,
            baseDelayMs: 2000,
            maxDelayMs: 60000,
          }
        };
      }
      return feed;
    });
  }

  updateDnsCacheConfig(dnsConfig) {
    const config = dnsCacheSchema.parse(dnsConfig);
    this.dnsCache.options.stdTTL = config.ttlSeconds;
    this.dnsCache.options.checkperiod = config.checkPeriodSeconds;
    this.dnsCache.options.maxKeys = config.maxKeys;
  }

  processFeedUrl(feed) {
    let processedFeed = { ...feed };
    
    // Enforce HTTPS if enabled
    if (this.feeds.enforceHttps && feed.url.startsWith('http://')) {
      processedFeed.url = feed.url.replace('http://', 'https://');
      console.warn(`Enforced HTTPS for feed: ${feed.name}`);
    }
    
    return processedFeed;
  }

  validateFeedDomains() {
    const invalidFeeds = this.feeds.feeds.filter(feed => {
      const url = new URL(feed.url);
      return !this.feeds.allowedDomains.includes(url.hostname);
    });

    if (invalidFeeds.length > 0) {
      const invalidDomains = invalidFeeds.map(f => new URL(f.url).hostname);
      throw new Error(`Feeds contain disallowed domains: ${invalidDomains.join(', ')}`);
    }
  }

  // Getters for configuration values
  getSupabaseConfig() {
    this.ensureInitialized();
    return {
      url: this.env.SUPABASE_URL,
      serviceRoleKey: this.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  getFeedsConfig() {
    this.ensureInitialized();
    return this.feeds;
  }

  getEnabledFeeds() {
    this.ensureInitialized();
    return this.feeds.feeds.filter(feed => feed.enabled);
  }

  getRateLimitConfig() {
    this.ensureInitialized();
    return this.rateLimit;
  }

  getFeedTimeout() {
    this.ensureInitialized();
    return this.env.FEED_TIMEOUT_MS;
  }

  // Helper methods
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
  }

  validateEnvironment() {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // DNS utility methods
  getDnsCache() {
    this.ensureInitialized();
    return this.dnsCache;
  }

  async resolveDomain(hostname) {
    const cacheKey = `dns:${hostname}`;
    let cachedResult = this.dnsCache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const dns = await import('dns/promises');
      const result = await dns.lookup(hostname);
      
      // Cache successful resolution
      this.dnsCache.set(cacheKey, { 
        success: true, 
        address: result.address,
        family: result.family,
        timestamp: Date.now()
      });
      
      return { success: true, address: result.address, family: result.family };
    } catch (error) {
      // Cache failure for shorter time (1 minute)
      const failureResult = { 
        success: false, 
        error: error.message,
        timestamp: Date.now()
      };
      this.dnsCache.set(cacheKey, failureResult, 60);
      
      // Log DNS failure
      await this.logConnectionError(hostname, 'DNS_RESOLUTION_FAILED', error.message);
      
      return failureResult;
    }
  }

  async getFeedWithFallback(feed) {
    // Try primary URL first
    let dnsResult = await this.resolveDomain(new URL(feed.url).hostname);
    
    if (dnsResult.success) {
      return { ...feed, activeUrl: feed.url };
    }

    // Try fallback URLs
    if (feed.fallbackUrls && feed.fallbackUrls.length > 0) {
      for (const fallbackUrl of feed.fallbackUrls) {
        const fallbackHostname = new URL(fallbackUrl).hostname;
        dnsResult = await this.resolveDomain(fallbackHostname);
        
        if (dnsResult.success) {
          console.warn(`Using fallback URL for ${feed.name}: ${fallbackUrl}`);
          return { ...feed, activeUrl: fallbackUrl };
        }
      }
    }

    // All URLs failed
    await this.logConnectionError(
      feed.name, 
      'ALL_URLS_FAILED', 
      `Primary and all fallback URLs failed for feed: ${feed.name}`
    );
    
    return { ...feed, activeUrl: null, failed: true };
  }

  // Error logging methods
  async logConnectionError(identifier, errorType, errorMessage, metadata = {}) {
    if (!this.errorLogging.logToSupabase) {
      console.error(`Connection Error [${identifier}]: ${errorType} - ${errorMessage}`);
      return;
    }

    const errorRecord = {
      identifier,
      error_type: errorType,
      error_message: errorMessage,
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
      user_agent: 'War Tracker RSS Fetcher',
    };

    this.errorBatch.push(errorRecord);

    // Flush immediately if batch is full
    if (this.errorBatch.length >= this.errorLogging.batchSize) {
      await this.flushErrorBatch();
    }
  }

  async flushErrorBatch() {
    if (this.errorBatch.length === 0) return;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseConfig = this.getSupabaseConfig();
      const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);

      const { error } = await supabase
        .from(this.errorLogging.tableName)
        .insert(this.errorBatch);

      if (error) {
        console.error('Failed to log errors to Supabase:', error);
      } else {
        console.log(`Logged ${this.errorBatch.length} connection errors to Supabase`);
      }
    } catch (error) {
      console.error('Error while flushing error batch:', error);
    }

    this.errorBatch = [];
  }

  startErrorFlushTimer() {
    if (this.errorFlushTimer) {
      clearInterval(this.errorFlushTimer);
    }

    this.errorFlushTimer = setInterval(async () => {
      await this.flushErrorBatch();
    }, this.errorLogging.flushIntervalMs);
  }

  // Enhanced rate limiter with exponential backoff
  createRateLimiter() {
    return {
      requests: [],
      consecutiveFailures: 0,
      pausedUntil: null,
      
      canMakeRequest() {
        const now = Date.now();
        
        // Check if we're in a pause period
        if (this.pausedUntil && now < this.pausedUntil) {
          return false;
        }
        
        // Clear pause if time has passed
        if (this.pausedUntil && now >= this.pausedUntil) {
          this.pausedUntil = null;
          this.consecutiveFailures = 0;
        }
        
        // Clean old requests (older than 1 minute)
        const cutoff = now - 60000;
        this.requests = this.requests.filter(time => time > cutoff);
        
        // Check rate limit
        return this.requests.length < configManager.getRateLimitConfig().requestsPerMinute;
      },
      
      recordRequest() {
        this.requests.push(Date.now());
      },
      
      recordFailure() {
        this.consecutiveFailures++;
        const config = configManager.getRateLimitConfig();
        
        if (this.consecutiveFailures >= config.maxConsecutiveFailures) {
          this.pausedUntil = Date.now() + config.pauseDurationMs;
          console.warn(`Rate limiter paused due to ${this.consecutiveFailures} consecutive failures`);
        }
      },
      
      recordSuccess() {
        this.consecutiveFailures = 0;
      },
      
      async exponentialBackoff(attempt, baseDelayMs = 1000, maxDelayMs = 30000) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        const finalDelay = delay + jitter;
        
        console.log(`Exponential backoff: attempt ${attempt + 1}, delay ${Math.round(finalDelay)}ms`);
        return new Promise(resolve => setTimeout(resolve, finalDelay));
      },
    };
  }

  // Cleanup method
  async cleanup() {
    if (this.errorFlushTimer) {
      clearInterval(this.errorFlushTimer);
    }
    await this.flushErrorBatch();
    this.dnsCache.flushAll();
  }
}

// Export singleton instance
const configManager = new ConfigManager();

export default configManager;
export { 
  ConfigManager, 
  envSchema, 
  feedsConfigSchema, 
  rateLimitSchema, 
  dnsCacheSchema,
  errorLoggingSchema 
};