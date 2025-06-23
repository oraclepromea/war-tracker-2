const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize RSS parser
const parser = new Parser();

// Optimized constants for memory efficiency
const BATCH_SIZE = 10; // Reduced from 50 for better memory management
const MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB RSS threshold
const MEMORY_CRITICAL_THRESHOLD = 150 * 1024 * 1024; // 150MB critical threshold
const DNS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // 1 second
const GC_INTERVAL_BATCHES = 5; // Run GC every 5 batches

// Initialize DNS cache with 5-minute TTL
const dnsCache = new NodeCache({ stdTTL: 300 });

/**
 * Memory management class for monitoring and optimization
 */
class MemoryManager {
    constructor() {
        this.batchCount = 0;
        this.performanceMetrics = [];
        this.lastGcTime = Date.now();
        this.pauseCount = 0;
    }

    /**
     * Gets current memory usage statistics
     * @returns {Object} Memory usage stats
     */
    getMemoryStats() {
        const usage = process.memoryUsage();
        return {
            rss: usage.rss,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            timestamp: Date.now(),
            rssMB: Math.round(usage.rss / 1024 / 1024),
            heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024)
        };
    }

    /**
     * Logs memory usage with detailed breakdown
     * @param {string} context - Context description
     * @returns {Object} Memory stats
     */
    logMemoryUsage(context = '') {
        const stats = this.getMemoryStats();
        const contextStr = context ? ` [${context}]` : '';
        
        console.log(`📊 Memory${contextStr}: RSS ${stats.rssMB}MB | Heap ${stats.heapUsedMB}/${stats.heapTotalMB}MB`);
        
        if (stats.rss > MEMORY_CRITICAL_THRESHOLD) {
            console.error(`🚨 CRITICAL: Memory usage ${stats.rssMB}MB exceeds critical threshold!`);
        } else if (stats.rss > MEMORY_THRESHOLD) {
            console.warn(`⚠️ WARNING: Memory usage ${stats.rssMB}MB exceeds threshold`);
        }
        
        return stats;
    }

    /**
     * Checks if memory usage requires pausing
     * @returns {boolean} True if should pause
     */
    shouldPauseForMemory() {
        const stats = this.getMemoryStats();
        return stats.rss > MEMORY_THRESHOLD;
    }

    /**
     * Forces garbage collection if available
     */
    forceGarbageCollection() {
        if (global.gc && typeof global.gc === 'function') {
            const beforeStats = this.getMemoryStats();
            global.gc();
            const afterStats = this.getMemoryStats();
            const freedMB = Math.round((beforeStats.heapUsed - afterStats.heapUsed) / 1024 / 1024);
            console.log(`🗑️ Garbage collection: freed ${freedMB}MB heap memory`);
            this.lastGcTime = Date.now();
            return true;
        } else {
            console.warn('⚠️ Garbage collection not available. Run with --expose-gc flag');
            return false;
        }
    }

    /**
     * Handles memory pressure by pausing and cleaning up
     * @param {string} source - Source feed name
     */
    async handleMemoryPressure(source) {
        this.pauseCount++;
        console.warn(`⏸️ Pausing processing for ${source} due to high memory usage (pause #${this.pauseCount})`);
        
        // Force garbage collection
        this.forceGarbageCollection();
        
        // Progressive pause duration based on severity
        const stats = this.getMemoryStats();
        let pauseDuration = 2000; // Base 2 seconds
        
        if (stats.rss > MEMORY_CRITICAL_THRESHOLD) {
            pauseDuration = 10000; // 10 seconds for critical
        } else if (stats.rss > MEMORY_THRESHOLD * 1.5) {
            pauseDuration = 5000; // 5 seconds for high
        }
        
        console.log(`⏱️ Pausing for ${pauseDuration / 1000}s to allow memory cleanup...`);
        await this.sleep(pauseDuration);
        
        // Log memory after pause
        this.logMemoryUsage('After Memory Cleanup');
    }

    /**
     * Records performance metrics for a batch
     * @param {Object} metrics - Batch metrics
     */
    recordBatchMetrics(metrics) {
        this.performanceMetrics.push({
            ...metrics,
            timestamp: new Date().toISOString(),
            batchNumber: this.batchCount
        });
        
        // Keep only last 100 metrics to prevent memory growth
        if (this.performanceMetrics.length > 100) {
            this.performanceMetrics = this.performanceMetrics.slice(-100);
        }
    }

    /**
     * Writes performance metrics to Supabase
     */
    async flushMetricsToDatabase() {
        if (this.performanceMetrics.length === 0) return;
        
        try {
            const { error } = await supabase
                .from('performance_metrics')
                .insert(this.performanceMetrics);
            
            if (error) {
                console.error('Failed to write performance metrics:', error);
            } else {
                console.log(`📈 Wrote ${this.performanceMetrics.length} performance metrics to database`);
                this.performanceMetrics = []; // Clear after successful write
            }
        } catch (dbError) {
            console.error('Database metrics write failed:', dbError.message);
        }
    }

    /**
     * Increments batch counter and handles GC intervals
     */
    incrementBatch() {
        this.batchCount++;
        
        // Run GC every N batches
        if (this.batchCount % GC_INTERVAL_BATCHES === 0) {
            console.log(`🔄 Batch ${this.batchCount}: Running scheduled garbage collection`);
            this.forceGarbageCollection();
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets summary statistics
     */
    getSummary() {
        return {
            totalBatches: this.batchCount,
            pauseCount: this.pauseCount,
            metricsRecorded: this.performanceMetrics.length,
            lastGcTime: this.lastGcTime,
            currentMemory: this.getMemoryStats()
        };
    }
}

// Initialize memory manager
const memoryManager = new MemoryManager();

/**
 * URL validation regex
 * @type {RegExp}
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
function isValidUrl(url) {
    return typeof url === 'string' && URL_REGEX.test(url);
}

/**
 * Logs memory usage
 */
function logMemoryUsage() {
    const usage = process.memoryUsage();
    const memoryMB = Math.round(usage.heapUsed / 1024 / 1024);
    console.log(`Memory usage: ${memoryMB}MB (RSS: ${Math.round(usage.rss / 1024 / 1024)}MB)`);
    
    if (usage.heapUsed > MEMORY_THRESHOLD) {
        console.warn(`⚠️ High memory usage detected: ${memoryMB}MB`);
        return true;
    }
    return false;
}

/**
 * Resolves DNS with caching and fallback
 * @param {string} hostname - Hostname to resolve
 * @returns {Promise<string[]>} - Array of IP addresses
 */
async function resolveDnsWithCache(hostname) {
    const cacheKey = hostname;
    const cached = dnsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
        return cached.ips;
    }
    
    try {
        const ips = await dns.promises.resolve4(hostname);
        dnsCache.set(cacheKey, { ips, timestamp: Date.now() });
        return ips;
    } catch (error) {
        // Fallback to resolve6 if resolve4 fails
        try {
            const ips = await dns.promises.resolve6(hostname);
            dnsCache.set(cacheKey, { ips, timestamp: Date.now() });
            return ips;
        } catch (fallbackError) {
            throw new Error(`DNS resolution failed for ${hostname}: ${error.message}`);
        }
    }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs error to database
 * @param {string} errorMessage - Error message
 * @param {string} feedSource - RSS feed source
 * @param {string} stackTrace - Optional stack trace
 * @returns {Promise<void>}
 */
async function logErrorToDatabase(errorMessage, feedSource, stackTrace = null) {
    try {
        const { error } = await supabase
            .from('error_logs')
            .insert({
                error_message: errorMessage,
                feed_source: feedSource,
                stack_trace: stackTrace,
                timestamp: new Date().toISOString()
            });
        
        if (error) {
            console.error('Failed to log error to database:', error);
        }
    } catch (dbError) {
        console.error('Database logging failed:', dbError.message);
    }
}

/**
 * Fetches RSS feed with DNS resilience and retry logic
 * @param {string} url - RSS feed URL
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Parsed RSS feed
 */
async function fetchRssWithResilience(url, attempt = 1) {
    try {
        // Validate URL first
        if (!isValidUrl(url)) {
            throw new Error(`Invalid URL format: ${url}`);
        }
        
        // Pre-resolve DNS for resilience
        const urlObj = new URL(url);
        await resolveDnsWithCache(urlObj.hostname);
        
        const feed = await parser.parseURL(url);
        return feed;
        
    } catch (error) {
        const isLastAttempt = attempt >= MAX_RETRY_ATTEMPTS;
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        
        console.error(`Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed for ${url}:`, error.message);
        
        if (!isLastAttempt) {
            console.log(`Retrying in ${delay}ms...`);
            await sleep(delay);
            return fetchRssWithResilience(url, attempt + 1);
        } else {
            await logErrorToDatabase(error.message, url, error.stack);
            throw error;
        }
    }
}

/**
 * Processes articles in optimized streaming batches
 * @param {Array} articles - Array of articles to process
 * @param {string} source - RSS feed source
 * @returns {Promise<void>}
 */
async function processArticlesBatch(articles, source) {
    const startTime = Date.now();
    const initialMemory = memoryManager.logMemoryUsage(`Starting ${source}`);
    
    // Pre-filter articles to avoid processing invalid ones
    const validArticles = [];
    let skippedCount = 0;
    
    console.log(`🔍 Pre-filtering ${articles.length} articles from ${source}...`);
    
    for (const item of articles) {
        // Clear item references immediately after validation
        const isValid = validateArticle(item, source);
        
        if (isValid) {
            // Create minimal article object to reduce memory footprint
            validArticles.push({
                title: item.title,
                link: item.link,
                contentSnippet: item.contentSnippet || '',
                pubDate: item.pubDate,
                guid: item.guid || item.link
            });
        } else {
            skippedCount++;
        }
        
        // Clear original item reference
        item.content = null;
        item.contentSnippet = null;
    }
    
    // Clear original articles array reference
    articles.length = 0;
    articles = null;
    
    console.log(`✅ Pre-filtering complete: ${validArticles.length} valid, ${skippedCount} skipped`);
    
    if (validArticles.length === 0) {
        console.log(`ℹ️ No valid articles to process for ${source}`);
        return;
    }
    
    // Process in small streaming batches
    const totalBatches = Math.ceil(validArticles.length / BATCH_SIZE);
    let processedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < validArticles.length; i += BATCH_SIZE) {
        const batchStartTime = Date.now();
        const beforeBatchMemory = memoryManager.getMemoryStats();
        
        // Check memory before processing batch
        if (memoryManager.shouldPauseForMemory()) {
            await memoryManager.handleMemoryPressure(source);
        }
        
        const batch = validArticles.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} articles) from ${source}`);
        
        try {
            // Process batch with error handling for individual articles
            const batchResults = await processBatchWithErrorHandling(batch, source, batchNumber);
            processedCount += batchResults.processed;
            errorCount += batchResults.errors;
            
            // Record batch performance metrics
            const batchEndTime = Date.now();
            const afterBatchMemory = memoryManager.getMemoryStats();
            
            const batchMetrics = {
                source,
                batch_number: batchNumber,
                articles_processed: batchResults.processed,
                articles_failed: batchResults.errors,
                processing_time_ms: batchEndTime - batchStartTime,
                memory_before_mb: Math.round(beforeBatchMemory.rss / 1024 / 1024),
                memory_after_mb: Math.round(afterBatchMemory.rss / 1024 / 1024),
                memory_delta_mb: Math.round((afterBatchMemory.rss - beforeBatchMemory.rss) / 1024 / 1024),
                heap_used_mb: Math.round(afterBatchMemory.heapUsed / 1024 / 1024)
            };
            
            memoryManager.recordBatchMetrics(batchMetrics);
            memoryManager.incrementBatch();
            
            console.log(`✅ Batch ${batchNumber} complete: ${batchResults.processed} processed, ${batchResults.errors} errors, ${batchMetrics.processing_time_ms}ms`);
            
        } catch (batchError) {
            errorCount += batch.length;
            console.error(`❌ Batch ${batchNumber} failed completely:`, batchError.message);
            await logErrorToDatabase(
                `Batch processing failed: ${batchError.message}`,
                source,
                batchError.stack
            );
        }
        
        // Clear batch reference
        batch.length = 0;
        
        // Close database connections periodically to prevent connection pooling issues
        if (batchNumber % 10 === 0) {
            console.log(`🔄 Batch ${batchNumber}: Refreshing database connections`);
            await refreshDatabaseConnections();
        }
        
        // Small delay between batches for memory cleanup
        if (i + BATCH_SIZE < validArticles.length) {
            await memoryManager.sleep(250); // 250ms between batches
        }
        
        // Memory logging after each batch
        memoryManager.logMemoryUsage(`After Batch ${batchNumber}`);
    }
    
    // Clear validArticles array
    validArticles.length = 0;
    
    // Final memory cleanup and reporting
    const finalMemory = memoryManager.logMemoryUsage(`Completed ${source}`);
    const totalTime = Date.now() - startTime;
    const memoryDelta = Math.round((finalMemory.rss - initialMemory.rss) / 1024 / 1024);
    
    console.log(`🏁 ${source} processing complete:`);
    console.log(`   📊 Processed: ${processedCount} articles`);
    console.log(`   ❌ Errors: ${errorCount} articles`);
    console.log(`   ⏱️ Total time: ${totalTime}ms`);
    console.log(`   💾 Memory delta: ${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB`);
    
    // Flush metrics to database
    await memoryManager.flushMetricsToDatabase();
}

/**
 * Validates article with enhanced checks
 * @param {Object} item - Article item
 * @param {string} source - Source name
 * @returns {boolean} Is valid
 */
function validateArticle(item, source) {
    if (!item.title || !item.link) {
        return false;
    }
    
    if (!isValidUrl(item.link)) {
        return false;
    }
    
    // Additional validation checks
    if (item.title.length > 500) {
        console.warn(`Title too long from ${source}: ${item.title.substring(0, 50)}...`);
        return false;
    }
    
    return true;
}

/**
 * Processes batch with individual article error handling
 * @param {Array} batch - Batch of articles
 * @param {string} source - Source name
 * @param {number} batchNumber - Batch number
 * @returns {Promise<Object>} Processing results
 */
async function processBatchWithErrorHandling(batch, source, batchNumber) {
    let processed = 0;
    let errors = 0;
    
    for (let i = 0; i < batch.length; i++) {
        const article = batch[i];
        
        try {
            // Process individual article (placeholder for actual processing logic)
            await processIndividualArticle(article, source);
            processed++;
            
            // Clear article reference immediately after processing
            batch[i] = null;
            
        } catch (articleError) {
            errors++;
            console.warn(`Article processing failed in batch ${batchNumber}:`, articleError.message);
            await logErrorToDatabase(
                `Article processing failed: ${articleError.message}`,
                source
            );
        }
    }
    
    return { processed, errors };
}

/**
 * Placeholder for individual article processing
 * @param {Object} article - Article to process
 * @param {string} source - Source name
 */
async function processIndividualArticle(article, source) {
    // Simulate processing with minimal memory footprint
    const processedArticle = {
        title: article.title,
        link: article.link,
        source: source,
        processed_at: new Date().toISOString()
    };
    
    // Here you would insert into database or perform other processing
    // For now, just simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Clear references
    processedArticle.title = null;
    processedArticle.link = null;
}

/**
 * Refreshes database connections to prevent pooling issues
 */
async function refreshDatabaseConnections() {
    try {
        // Create a fresh connection test
        const { data, error } = await supabase
            .from('articles')
            .select('id')
            .limit(1);
        
        if (error) {
            console.warn('Database connection test failed:', error.message);
        }
    } catch (connError) {
        console.warn('Database connection refresh failed:', connError.message);
    }
}

/**
 * Main RSS fetching function with memory optimization
 * @param {Array} feedUrls - Array of RSS feed URLs
 * @returns {Promise<Object>} Processing summary
 */
async function fetchAllRssFeeds(feedUrls) {
    console.log('🚀 Starting optimized RSS fetching process...');
    console.log('💡 For optimal memory performance, run with: node --max-old-space-size=512 --expose-gc rss-fetcher.js');
    
    const startTime = Date.now();
    const summary = {
        totalFeeds: feedUrls.length,
        successfulFeeds: 0,
        failedFeeds: 0,
        totalArticles: 0,
        processingErrors: 0,
        memoryStats: memoryManager.logMemoryUsage('Process Start')
    };
    
    for (let i = 0; i < feedUrls.length; i++) {
        const feedUrl = feedUrls[i];
        const feedStartTime = Date.now();
        
        try {
            console.log(`\n📡 Processing feed ${i + 1}/${feedUrls.length}: ${feedUrl}`);
            
            // Check memory before processing each feed
            if (memoryManager.shouldPauseForMemory()) {
                await memoryManager.handleMemoryPressure(feedUrl);
            }
            
            const feed = await fetchRssWithResilience(feedUrl);
            
            if (feed && feed.items && feed.items.length > 0) {
                console.log(`📰 Found ${feed.items.length} articles in feed`);
                
                // Process articles in streaming batches
                await processArticlesBatch(feed.items, feedUrl);
                
                summary.successfulFeeds++;
                summary.totalArticles += feed.items.length;
                
                // Clear feed references
                feed.items = null;
            } else {
                console.warn(`⚠️ No articles found in feed: ${feedUrl}`);
                summary.failedFeeds++;
            }
            
        } catch (error) {
            console.error(`❌ Failed to process feed ${feedUrl}:`, error.message);
            summary.failedFeeds++;
            await logErrorToDatabase(`Feed processing failed: ${error.message}`, feedUrl, error.stack);
        }
        
        const feedTime = Date.now() - feedStartTime;
        console.log(`⏱️ Feed ${i + 1} completed in ${feedTime}ms`);
        
        // Small delay between feeds
        if (i < feedUrls.length - 1) {
            await sleep(500);
        }
    }
    
    // Final summary
    const totalTime = Date.now() - startTime;
    const finalMemoryStats = memoryManager.logMemoryUsage('Process Complete');
    const memoryManagerSummary = memoryManager.getSummary();
    
    summary.totalProcessingTime = totalTime;
    summary.finalMemoryStats = finalMemoryStats;
    summary.memoryManagerSummary = memoryManagerSummary;
    
    console.log('\n🏁 RSS Fetching Process Complete!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successful feeds: ${summary.successfulFeeds}/${summary.totalFeeds}`);
    console.log(`   ❌ Failed feeds: ${summary.failedFeeds}/${summary.totalFeeds}`);
    console.log(`   📰 Total articles processed: ${summary.totalArticles}`);
    console.log(`   ⏱️ Total time: ${summary.totalProcessingTime}ms`);
    console.log(`   🔄 Total batches: ${memoryManagerSummary.totalBatches}`);
    console.log(`   ⏸️ Memory pauses: ${memoryManagerSummary.pauseCount}`);
    console.log(`   💾 Final memory: ${finalMemoryStats.rssMB}MB RSS`);
    
    // Final cleanup
    await memoryManager.flushMetricsToDatabase();
    
    return summary;
}

// Add cleanup for DNS cache with memory considerations
function cleanupDnsCache() {
    const beforeSize = dnsCache.keys().length;
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [hostname, data] of dnsCache.entries()) {
        if (now - data.timestamp > DNS_CACHE_TTL) {
            dnsCache.delete(hostname);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 DNS cache cleanup: removed ${cleanedCount}/${beforeSize} expired entries`);
    }
}

// Enhanced memory monitoring with more frequent checks
setInterval(() => {
    memoryManager.logMemoryUsage('Periodic Check');
    cleanupDnsCache();
}, 30000); // Every 30 seconds

// Add process event handlers for cleanup
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, performing cleanup...');
    await memoryManager.flushMetricsToDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, performing cleanup...');
    await memoryManager.flushMetricsToDatabase();
    process.exit(0);
});

// Export memory manager for external monitoring
module.exports = {
    memoryManager,
    processArticlesBatch,
    fetchAllRssFeeds,
    fetchRssWithResilience,
    validateArticle,
    logMemoryUsage,
    resolveDnsWithCache,
    logErrorToDatabase
};