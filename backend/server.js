const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const parser = new Parser();

// Initialize Supabase client with proper environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Supabase configured:', supabaseUrl);
console.log('🔑 Service key length:', supabaseKey?.length);
console.log('🔑 Service key starts with:', supabaseKey?.substring(0, 20) + '...');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public' // Explicit default schema
    }
  }
);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://war-tracker-2.netlify.app', 'https://war-tracker-20.netlify.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// War-related keywords for filtering (same as frontend)
const warKeywords = [
  'war', 'military', 'nato', 'conflict', 'attack',
  'diplomacy', 'sanctions', 'treaty', 'UN security council',
  'ukraine', 'russia', 'china', 'taiwan', 'middle east', 'defense',
  'airstrike', 'ceasefire', 'peacekeeping', 'humanitarian', 'refugee',
  'invasion', 'occupation', 'missile', 'drone', 'terrorism'
];

// Function to check if an article is war/diplomacy related
const isWarRelated = (article) => {
  const text = `${article.title} ${article.description || article.content || ''}`.toLowerCase();
  return warKeywords.some(keyword => text.includes(keyword.toLowerCase()));
};

// RSS Feed URLs (updated working ones)
const RSS_FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/cnn_world.rss' },
  { name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' }
];

// Process and insert article with war-related flagging
const processAndInsertArticle = async (article) => {
  const isRelevant = isWarRelated(article);
  
  try {
    const { data, error } = await supabase
      .from('rss_articles')  // Remove schema prefix
      .upsert({
        title: article.title,
        content: article.description || article.contentSnippet || '',
        url: article.url,
        source: article.source,
        published_at: article.publishedAt || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
        is_processed: false,
        is_war_related: isRelevant,
        categories: isRelevant ? ['war', 'diplomacy'] : []
      }, { 
        onConflict: 'url',
        ignoreDuplicates: true 
      });
    
    return { data, error, isWarRelated: isRelevant };
  } catch (err) {
    return { data: null, error: err, isWarRelated: isRelevant };
  }
};

// Store articles in Supabase (updated to use new processing function)
const storeArticlesInSupabase = async (articles) => {
  if (!articles || articles.length === 0) return { inserted: 0, errors: 0, warArticles: 0 };
  
  let inserted = 0;
  let errors = 0;
  let warArticles = 0;
  
  for (const article of articles) {
    const result = await processAndInsertArticle(article);
    
    if (result.error) {
      console.error('Error inserting article:', result.error.message);
      errors++;
    } else {
      inserted++;
      if (result.isWarRelated) {
        warArticles++;
      }
    }
  }
  
  return { inserted, errors, warArticles };
};

// Fetch RSS feeds and store in Supabase (updated to show war article stats)
const fetchAndStoreRSS = async () => {
  console.log('🔄 Starting RSS fetch cycle...');
  let totalArticles = 0;
  let totalInserted = 0;
  let totalWarArticles = 0;
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Fetching ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);
      
      const articles = feedData.items.slice(0, 10).map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content || '',
        url: item.link,
        publishedAt: item.pubDate,
        source: feed.name
      }));
      
      const { inserted, warArticles } = await storeArticlesInSupabase(articles);
      totalArticles += articles.length;
      totalInserted += inserted;
      totalWarArticles += warArticles;
      
      const warInfo = warArticles > 0 ? `, 🎯 ${warArticles} war-related` : '';
      console.log(`✅ ${feed.name}: ${articles.length} articles, ${inserted} new${warInfo}`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${feed.name}:`, error.message);
    }
  }
  
  console.log(`🎯 RSS cycle complete: ${totalInserted}/${totalArticles} new articles stored (${totalWarArticles} war-related)`);
  return { totalArticles, totalInserted, totalWarArticles };
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://war-tracker-2.netlify.app', 'https://war-tracker-20.netlify.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Test data for development
const mockEvents = [
  {
    id: '1',
    title: 'Military Operation in Gaza',
    description: 'Recent military activity reported',
    timestamp: new Date().toISOString(),
    severity: 'high'
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/events', (req, res) => {
  res.json(mockEvents);
});

app.get('/api/news', async (req, res) => {
  try {
    // Fetch from Supabase instead of local mock data
    const { data, error } = await supabase
      .from('rss_articles')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// New live feed endpoint with war/diplomacy filtering and pagination
app.get('/api/live-feed', async (req, res) => {
  try {
    const { page = 1, war_only = 'false' } = req.query;
    const pageNum = parseInt(page);
    const warOnly = war_only === 'true';
    
    console.log(`📰 Live feed request: page ${pageNum}, war_only: ${warOnly}`);
    
    let query = supabase
      .from('rss_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .order('fetched_at', { ascending: false });
    
    // Filter for war-related articles if requested
    if (warOnly) {
      query = query.eq('is_war_related', true);
    }
    
    // Add pagination
    const startRange = (pageNum - 1) * 20;
    const endRange = pageNum * 20 - 1;
    query = query.range(startRange, endRange);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    console.log(`✅ Returned ${data?.length || 0} articles for page ${pageNum}`);
    
    res.json({
      articles: data || [],
      pagination: {
        page: pageNum,
        total_articles: count,
        has_more: data && data.length === 20
      },
      filters: {
        war_only: warOnly
      }
    });
  } catch (error) {
    console.error('Error fetching live feed:', error);
    res.status(500).json({ error: error.message });
  }
});

// War-specific articles endpoint
app.get('/api/war-articles', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const pageNum = parseInt(page);
    
    const { data, error, count } = await supabase
      .from('rss_articles')
      .select('*')
      .eq('is_war_related', true)
      .order('published_at', { ascending: false })
      .range((pageNum-1)*20, pageNum*20-1);
    
    if (error) throw error;
    
    res.json({
      articles: data || [],
      pagination: {
        page: pageNum,
        total_war_articles: count,
        has_more: data && data.length === 20
      }
    });
  } catch (error) {
    console.error('Error fetching war articles:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs/news', async (req, res) => {
  try {
    console.log('📡 Manual RSS sync triggered');
    const result = await fetchAndStoreRSS();
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('RSS sync failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Supabase connection first
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('rss_articles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.error('Check your API key and project URL');
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

// Start continuous RSS fetching
let rssInterval;
const startContinuousRSSFetch = () => {
  // Initial fetch
  fetchAndStoreRSS();
  
  // Set up interval (every 10 minutes)
  rssInterval = setInterval(fetchAndStoreRSS, 10 * 60 * 1000);
  console.log('🔄 Continuous RSS fetching started (every 10 minutes)');
};

// Stop continuous fetching
const stopContinuousRSSFetch = () => {
  if (rssInterval) {
    clearInterval(rssInterval);
    console.log('⏹️ Continuous RSS fetching stopped');
  }
};

// AI Analysis Service for processing articles into war events
const analyzeArticleForWarEvents = async (article) => {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('⚠️ OpenRouter API key not found, skipping AI analysis');
    return null;
  }

  try {
    console.log(`🧠 Analyzing article: ${article.title.substring(0, 50)}...`);

    const prompt = `Analyze this news article for war/conflict events. If it contains information about military operations, airstrikes, casualties, diplomatic tensions, or other conflict-related events, extract the key details. Otherwise, respond with "NO_EVENT".

Article Title: ${article.title}
Content: ${article.content}
Source: ${article.source}

If this is a war/conflict event, respond with JSON in this exact format:
{
  "event_type": "airstrike|humanitarian|cyberattack|diplomatic",
  "country": "primary country involved",
  "region": "specific region/city if mentioned",
  "casualties": number or null,
  "weapons_used": ["array", "of", "weapons"] or null,
  "source_country": "attacking/source country" or null,
  "target_country": "target country" or null,
  "confidence": number between 0-100,
  "threat_level": "low|medium|high|critical"
}

If not a war/conflict event, respond with: NO_EVENT`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content?.trim();

    if (!result || result === 'NO_EVENT') {
      console.log(`📝 Article not war-related: ${article.title.substring(0, 30)}...`);
      return null;
    }

    // Parse JSON response
    const eventData = JSON.parse(result);
    
    // Create war event record
    const warEvent = {
      event_type: eventData.event_type,
      country: eventData.country,
      region: eventData.region,
      latitude: null, // Could be enhanced with geocoding
      longitude: null,
      casualties: eventData.casualties,
      weapons_used: eventData.weapons_used,
      source_country: eventData.source_country,
      target_country: eventData.target_country,
      confidence: eventData.confidence,
      threat_level: eventData.threat_level,
      article_id: article.id,
      article_title: article.title,
      article_url: article.url,
      processed_at: new Date().toISOString(),
      timestamp: article.published_at || new Date().toISOString()
    };

    console.log(`✅ War event extracted: ${eventData.event_type} in ${eventData.country}`);
    return warEvent;

  } catch (error) {
    console.error(`❌ AI analysis failed for article ${article.id}:`, error.message);
    return null;
  }
};

// Process unprocessed articles for war events
const processArticlesForWarEvents = async () => {
  try {
    console.log('🧠 Starting AI analysis of unprocessed articles...');

    // Get unprocessed articles
    const { data: articles, error: fetchError } = await supabase
      .from('rss_articles')
      .select('*')
      .eq('is_processed', false)
      .order('fetched_at', { ascending: false })
      .limit(5); // Process 5 at a time to avoid rate limits

    if (fetchError) {
      console.error('Error fetching unprocessed articles:', fetchError);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('📄 No unprocessed articles found');
      return;
    }

    console.log(`📄 Processing ${articles.length} articles for war events...`);

    for (const article of articles) {
      // Analyze article with AI
      const warEvent = await analyzeArticleForWarEvents(article);

      if (warEvent) {
        // Store war event in database
        const { error: insertError } = await supabase
          .from('war_events')
          .insert(warEvent);

        if (insertError) {
          console.error(`Error storing war event for article ${article.id}:`, insertError);
        } else {
          console.log(`💾 Stored war event: ${warEvent.event_type} in ${warEvent.country}`);
        }
      }

      // Mark article as processed
      const { error: updateError } = await supabase
        .from('rss_articles')
        .update({ is_processed: true })
        .eq('id', article.id);

      if (updateError) {
        console.error(`Error marking article ${article.id} as processed:`, updateError);
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🎯 AI analysis cycle completed');

  } catch (error) {
    console.error('❌ Error in AI analysis process:', error);
  }
};

// Start AI analysis service
let aiAnalysisInterval;
const startAIAnalysis = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('⚠️ AI analysis disabled: OPENROUTER_API_KEY not found');
    return;
  }

  // Initial analysis
  setTimeout(processArticlesForWarEvents, 5000); // Start after 5 seconds

  // Set up interval (every 5 minutes)
  aiAnalysisInterval = setInterval(processArticlesForWarEvents, 5 * 60 * 1000);
  console.log('🧠 AI analysis service started (every 5 minutes)');
};

const stopAIAnalysis = () => {
  if (aiAnalysisInterval) {
    clearInterval(aiAnalysisInterval);
    console.log('🧠 AI analysis service stopped');
  }
};

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 War Tracker Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📰 News endpoint: http://localhost:${PORT}/api/news`);
  
  // Test Supabase connection before starting services
  const isConnected = await testSupabaseConnection();
  
  if (isConnected) {
    console.log('🔗 Supabase connection verified - starting services...');
    
    // Start continuous RSS fetching
    console.log('📡 Initializing RSS service...');
    startContinuousRSSFetch();
    
    // Start AI analysis service
    console.log('🧠 Initializing AI analysis service...');
    startAIAnalysis();
    
    console.log('✅ All services started successfully!');
  } else {
    console.log('❌ Skipping services due to Supabase connection failure');
    console.log('Please check your Supabase credentials in .env file');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  stopContinuousRSSFetch();
  stopAIAnalysis();
  process.exit(0);
});