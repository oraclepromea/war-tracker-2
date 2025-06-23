const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const util = require('util');
const path = require('path');

// Load environment variables from scripts/.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Environment variable validation
function validateEnvironment() {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  
  const missing = [];
  
  for (const [name, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(name);
    } else {
      console.log(`✅ ${name}: ${value.substring(0, 20)}...`);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Setup instructions:');
    console.error('1. Copy .env.example to .env: cp .env.example .env');
    console.error('2. Get your Supabase credentials from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
    console.error('3. Add these variables to your .env file:');
    console.error('   SUPABASE_URL=https://your-project.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.error('4. Make sure .env is in your project root directory');
    
    process.exit(1);
  }
  
  console.log('✅ All environment variables configured\n');
}

// Initialize Supabase client with error handling
function initializeSupabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    process.exit(1);
  }
}

// Promisify DNS lookup for network checks
const dnsLookup = util.promisify(dns.lookup);

// Initialize RSS parser
const parser = new Parser({
  customFields: {
    item: ['description', 'content', 'content:encoded']
  }
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Verified RSS feeds
const RSS_FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

// Configuration constants
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay

// Clean HTML and generate content hash
function cleanContent(content) {
  return content ? content.replace(/<[^>]*>/g, '').trim() : '';
}

function generateContentHash(title, content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(`${title}-${content}`).digest('hex');
}

// Network connectivity check
async function checkNetworkConnectivity() {
  try {
    await dnsLookup('google.com');
    console.log('✅ Network connectivity confirmed');
    return true;
  } catch (error) {
    console.error('❌ Network connectivity failed:', error.message);
    return false;
  }
}

// Memory monitoring
function logMemoryUsage(context) {
  const usage = process.memoryUsage();
  const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  
  console.log(`📊 Memory Usage [${context}]:`);
  console.log(`   RSS: ${formatBytes(usage.rss)}`);
  console.log(`   Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`   Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`   External: ${formatBytes(usage.external)}`);
}

// Exponential backoff retry mechanism
async function retryWithBackoff(operation, maxRetries = MAX_RETRIES, baseDelay = BASE_DELAY) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        console.error(`❌ Final attempt ${attempt}/${maxRetries} failed:`, error.message);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Enhanced RSS feed fetcher with retry logic
async function fetchRSSFeed(feed) {
  const fetchOperation = async () => {
    console.log(`📡 Fetching ${feed.name}...`);
    
    const rssFeed = await parser.parseURL(feed.url);
    const articles = [];

    for (const item of rssFeed.items) {
      if (!item.title || !item.link) {
        console.warn(`⚠️ ${feed.name}: Skipping item without title or URL`);
        continue;
      }

      const cleanedContent = cleanContent(item.description || item.content || item['content:encoded'] || '');
      const contentHash = generateContentHash(item.title.trim(), cleanedContent);

      const article = {
        title: item.title.trim(),
        content: cleanedContent,
        url: item.link.trim(),
        source: feed.name,
        published_at: new Date(item.pubDate || item.isoDate || new Date()).toISOString(),
        fetched_at: new Date().toISOString(),
        content_hash: contentHash,
        is_processed: false
      };

      articles.push(article);
    }

    console.log(`✅ ${feed.name}: Parsed ${articles.length} articles`);
    return { success: true, articles, error: null };
  };

  try {
    return await retryWithBackoff(fetchOperation);
  } catch (error) {
    console.error(`❌ ${feed.name}: All retry attempts failed - ${error.message}`);
    return { success: false, articles: [], error: error.message };
  }
}

// Batch upsert with improved performance
async function batchUpsertArticles(articles, sourceName) {
  if (articles.length === 0) {
    console.log(`📄 ${sourceName}: No articles to process`);
    return { inserted: 0, updated: 0, skipped: 0, failed: 0 };
  }

  console.log(`💾 ${sourceName}: Processing ${articles.length} articles in batches of ${BATCH_SIZE}...`);
  
  let totalStats = { inserted: 0, updated: 0, skipped: 0, failed: 0 };
  
  // Process articles in batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)} (${batch.length} articles)`);
    
    logMemoryUsage(`Batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    
    try {
      // Use transaction for batch processing
      const batchStats = await processBatch(batch, sourceName);
      
      totalStats.inserted += batchStats.inserted;
      totalStats.updated += batchStats.updated;
      totalStats.skipped += batchStats.skipped;
      totalStats.failed += batchStats.failed;
      
      // Small delay between batches
      if (i + BATCH_SIZE < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Batch processing failed:`, error.message);
      totalStats.failed += batch.length;
    }
  }

  console.log(`📊 ${sourceName}: Final - ${totalStats.inserted} new, ${totalStats.updated} updated, ${totalStats.skipped} unchanged, ${totalStats.failed} failed`);
  return totalStats;
}

// Process individual batch with conflict resolution
async function processBatch(batch, sourceName) {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Get existing articles by URLs for this batch
  const urls = batch.map(article => article.url);
  const { data: existingArticles, error: fetchError } = await supabase
    .from('rss_articles')
    .select('url, content_hash, is_processed')
    .in('url', urls);

  if (fetchError) {
    console.error(`❌ Error fetching existing articles:`, fetchError.message);
    throw fetchError;
  }

  const existingMap = new Map(existingArticles?.map(article => [article.url, article]) || []);

  const articlesToInsert = [];
  const articlesToUpdate = [];

  for (const article of batch) {
    const existing = existingMap.get(article.url);
    
    if (existing) {
      if (existing.content_hash !== article.content_hash) {
        articlesToUpdate.push({ ...article, is_processed: false });
        updated++;
      } else {
        skipped++;
      }
    } else {
      articlesToInsert.push(article);
      inserted++;
    }
  }

  // Batch insert new articles
  if (articlesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('rss_articles')
      .insert(articlesToInsert);

    if (insertError) {
      console.error(`❌ Batch insert failed:`, insertError.message);
      failed += articlesToInsert.length;
      inserted = 0;
    } else {
      console.log(`✅ Batch inserted ${articlesToInsert.length} new articles`);
    }
  }

  // Batch update modified articles
  for (const article of articlesToUpdate) {
    try {
      const { error: updateError } = await supabase
        .from('rss_articles')
        .update(article)
        .eq('url', article.url);

      if (updateError) {
        console.error(`❌ Update failed for ${article.url}:`, updateError.message);
        failed++;
        updated--;
      }
    } catch (error) {
      console.error(`❌ Update error for ${article.url}:`, error.message);
      failed++;
      updated--;
    }
  }

  return { inserted, updated, skipped, failed };
}

// Enhanced main execution function
async function fetchAllFeeds() {
  console.log('🚀 Starting enhanced RSS feed aggregation...');
  console.log('=========================================================');
  
  // Check network connectivity first
  const hasNetwork = await checkNetworkConnectivity();
  if (!hasNetwork) {
    console.error('💥 No network connectivity - aborting');
    process.exit(1);
  }
  
  logMemoryUsage('Startup');
  
  const startTime = Date.now();
  let totalStats = { inserted: 0, updated: 0, skipped: 0, failed: 0, feedErrors: 0 };

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`\n🔄 Processing feed: ${feed.name}`);
      
      const result = await fetchRSSFeed(feed);
      
      if (!result.success) {
        console.error(`❌ ${feed.name}: Feed error - ${result.error}`);
        totalStats.feedErrors++;
        continue;
      }

      const stats = await batchUpsertArticles(result.articles, feed.name);
      totalStats.inserted += stats.inserted;
      totalStats.updated += stats.updated;
      totalStats.skipped += stats.skipped;
      totalStats.failed += stats.failed;

    } catch (error) {
      console.error(`❌ ${feed.name}: Fatal error - ${error.message}`);
      totalStats.feedErrors++;
    }

    // Rate limiting between feeds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      logMemoryUsage(`After ${feed.name}`);
    }
  }

  const duration = Date.now() - startTime;
  
  console.log('\n=========================================================');
  console.log('📊 ENHANCED FINAL SUMMARY:');
  console.log(`   ✅ New articles: ${totalStats.inserted}`);
  console.log(`   🔄 Updated articles: ${totalStats.updated}`);
  console.log(`   ⏭️ Unchanged articles: ${totalStats.skipped}`);
  console.log(`   ❌ Failed articles: ${totalStats.failed}`);
  console.log(`   🚫 Feed errors: ${totalStats.feedErrors}/${RSS_FEEDS.length}`);
  console.log(`   ⏱️ Completed in ${duration}ms`);
  
  logMemoryUsage('Final');
  
  console.log('=========================================================');

  if (totalStats.feedErrors === RSS_FEEDS.length) {
    console.error('💥 All feeds failed');
    process.exit(1);
  }
  
  return totalStats;
}

// Run if called directly
if (require.main === module) {
  fetchAllFeeds();
}

module.exports = { fetchAllFeeds, fetchRSSFeed, batchUpsertArticles, checkNetworkConnectivity };