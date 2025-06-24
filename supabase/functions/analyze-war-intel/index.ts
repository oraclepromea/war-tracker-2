/// <reference path="../_shared/deno.d.ts" />
/// <reference path="../../../types/deno.d.ts" />

// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Add CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage (in-memory for Edge Functions)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Type definitions
interface RSSArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  fetched_at: string;
  is_processed: boolean;
}

interface WarEvent {
  event_type: string;
  country: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  casualties: number | null;
  weapons_used: string[] | null;
  source_country: string | null;
  target_country: string | null;
  confidence: number;
  threat_level: string;
  article_id: string;
  article_title: string;
  article_url: string;
  article_source: string;
  processed_at: string;
}

// Validation schemas
const VALID_EVENT_TYPES = ['airstrike', 'humanitarian', 'cyberattack', 'diplomatic'];
const VALID_THREAT_LEVELS = ['low', 'medium', 'high', 'critical'];

// War-related keywords for pre-filtering
const WAR_KEYWORDS = [
  'war', 'military', 'attack', 'conflict', 'casualty',
  'bomb', 'invasion', 'weapon', 'troop', 'nuclear',
  'terrorism', 'drone', 'tank', 'soldier', 'battle',
  'combat', 'assault', 'strike', 'missile', 'defense',
  'army', 'navy', 'airforce', 'marine', 'offensive',
  'ceasefire', 'armistice', 'siege', 'occupation', 'frontline',
  'iran', 'russia', 'ukraine', 'gaza', 'israel'
];

// Input validation for articles
function validateArticle(article: RSSArticle): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!article.id || typeof article.id !== 'string') {
    errors.push('Missing or invalid article ID');
  }
  
  if (!article.title || typeof article.title !== 'string' || article.title.trim().length < 10) {
    errors.push('Title must be at least 10 characters');
  }
  
  if (!article.content || typeof article.content !== 'string' || article.content.trim().length < 50) {
    errors.push('Content must be at least 50 characters');
  }
  
  if (!article.url || typeof article.url !== 'string' || !isValidUrl(article.url)) {
    errors.push('Invalid or missing URL');
  }
  
  return { isValid: errors.length === 0, errors };
}

// War event schema validation
function validateWarEvent(event: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!event.event_type || !VALID_EVENT_TYPES.includes(event.event_type)) {
    errors.push(`Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }
  
  if (!event.country || typeof event.country !== 'string' || event.country.trim().length < 2) {
    errors.push('Country must be at least 2 characters');
  }
  
  if (event.confidence === undefined || typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 100) {
    errors.push('Confidence must be a number between 0 and 100');
  }
  
  if (!event.threat_level || !VALID_THREAT_LEVELS.includes(event.threat_level)) {
    errors.push(`Invalid threat_level. Must be one of: ${VALID_THREAT_LEVELS.join(', ')}`);
  }
  
  if (event.casualties !== null && (typeof event.casualties !== 'number' || event.casualties < 0)) {
    errors.push('Casualties must be null or a non-negative number');
  }
  
  if (event.latitude !== null && (typeof event.latitude !== 'number' || event.latitude < -90 || event.latitude > 90)) {
    errors.push('Latitude must be null or between -90 and 90');
  }
  
  if (event.longitude !== null && (typeof event.longitude !== 'number' || event.longitude < -180 || event.longitude > 180)) {
    errors.push('Longitude must be null or between -180 and 180');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Rate limiting check
function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(clientId, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime };
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: clientData.resetTime };
  }
  
  clientData.count++;
  rateLimitMap.set(clientId, clientData);
  
  return { allowed: true, remaining: RATE_LIMIT_MAX - clientData.count, resetTime: clientData.resetTime };
}

// URL validation helper
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Check if article contains war-related keywords
function containsWarKeywords(article: RSSArticle): { hasKeywords: boolean; matchedKeywords: string[] } {
  const searchText = `${article.title} ${article.content}`.toLowerCase();
  const matchedKeywords: string[] = [];
  
  for (const keyword of WAR_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }
  
  return {
    hasKeywords: matchedKeywords.length > 0,
    matchedKeywords
  };
}

// Log skipped articles to database
async function logSkippedArticle(
  supabase: any,
  article: RSSArticle,
  reason: string,
  metadata: any = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('skipped_logs')
      .insert({
        article_id: article.id,
        article_title: article.title,
        article_url: article.url,
        article_source: article.source,
        skip_reason: reason,
        metadata: metadata,
        skipped_at: new Date().toISOString()
      });
    
    if (error) {
      console.error(`❌ Failed to log skipped article: ${error.message}`);
    }
  } catch (logError) {
    console.error(`❌ Error logging skipped article: ${logError.message}`);
  }
}

// Enhanced AI analysis with OpenRouter (corrected for new key)
async function analyzeArticleWithAI(article: RSSArticle): Promise<WarEvent | null> {
  // Input validation
  const validation = validateArticle(article);
  if (!validation.isValid) {
    console.error(`❌ Article validation failed: ${validation.errors.join(', ')}`);
    throw new Error(`Invalid article: ${validation.errors.join(', ')}`);
  }

  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openRouterKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  console.log(`🔑 OpenRouter key found: ${openRouterKey.substring(0, 15)}...`);

  // Optimized prompt for war event extraction
  const prompt = `Extract JSON with: event_type, country, casualties, confidence (0-100), weapons_used[], threat_level. 

IMPORTANT: Set latitude and longitude to null unless you have specific coordinates.

Required fields:
- event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic'
- country: string (primary location)
- region: string | null (state/province)
- latitude: number | null (ONLY if specific coordinates known, otherwise null)
- longitude: number | null (ONLY if specific coordinates known, otherwise null)
- casualties: number | null (deaths/injuries)
- weapons_used: string[] | null (weapons/equipment)
- source_country: string | null (attacking country)
- target_country: string | null (defending country)
- confidence: number (0-100, how certain are you?)
- threat_level: 'low' | 'medium' | 'high' | 'critical'

If not war-related, return: {"confidence": 0}

Return ONLY the JSON object, no explanatory text.

Article: "${article.title}"
Content: "${article.content.substring(0, 1000)}"`;

  try {
    console.log(`🤖 Analyzing: "${article.title.substring(0, 50)}..."`);
    
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Use OpenRouter API with proper headers
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://war-tracker.supabase.co',
        'X-Title': 'War Tracker AI Analysis'
      },
      body: JSON.stringify({
        model: 'microsoft/wizardlm-2-8x22b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter error ${response.status}: ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      console.warn(`⚠️ Empty AI response for: "${article.title}"`);
      return null;
    }

    // Parse and validate AI response with improved JSON extraction
    let parsedEvent: any;
    try {
      // Clean the AI response to extract just the JSON
      let jsonString = aiResponse.trim();
      
      // Remove markdown code blocks
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON object between { and } - handle explanatory text
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      console.log(`🔍 Extracted JSON: ${jsonString.substring(0, 200)}...`);
      
      parsedEvent = JSON.parse(jsonString);
      console.log(`✅ Parsed event with ${parsedEvent.confidence}% confidence`);
      
    } catch (parseError) {
      console.error(`❌ JSON parse failed: ${aiResponse.substring(0, 500)}...`);
      console.error(`Parse error: ${parseError.message}`);
      return null;
    }

    // Confidence threshold check
    if (!parsedEvent.confidence || parsedEvent.confidence < 60) {
      console.log(`⏭️ Low confidence (${parsedEvent.confidence}%): "${article.title}"`);
      return null;
    }

    // Clean and validate coordinates
    if (parsedEvent.latitude !== null && parsedEvent.latitude !== undefined) {
      const lat = Number(parsedEvent.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        console.warn(`⚠️ Invalid latitude ${parsedEvent.latitude}, setting to null`);
        parsedEvent.latitude = null;
      } else {
        parsedEvent.latitude = lat;
      }
    }

    if (parsedEvent.longitude !== null && parsedEvent.longitude !== undefined) {
      const lon = Number(parsedEvent.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        console.warn(`⚠️ Invalid longitude ${parsedEvent.longitude}, setting to null`);
        parsedEvent.longitude = null;
      } else {
        parsedEvent.longitude = lon;
      }
    }

    // Validate war event schema
    const eventValidation = validateWarEvent(parsedEvent);
    if (!eventValidation.isValid) {
      console.error(`❌ War event validation failed: ${eventValidation.errors.join(', ')}`);
      return null;
    }

    // Build validated war event
    const warEvent: WarEvent = {
      event_type: parsedEvent.event_type,
      country: parsedEvent.country,
      region: parsedEvent.region || '',
      latitude: parsedEvent.latitude || null,
      longitude: parsedEvent.longitude || null,
      casualties: parsedEvent.casualties || null,
      weapons_used: Array.isArray(parsedEvent.weapons_used) ? parsedEvent.weapons_used : null,
      source_country: parsedEvent.source_country || null,
      target_country: parsedEvent.target_country || null,
      confidence: Math.min(100, Math.max(0, parsedEvent.confidence)),
      threat_level: parsedEvent.threat_level,
      article_id: article.id,
      article_title: article.title,
      article_url: article.url,
      article_source: article.source,
      processed_at: new Date().toISOString()
    };

    console.log(`✅ War event created: ${warEvent.event_type} in ${warEvent.country} (${warEvent.confidence}% confidence)`);
    return warEvent;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`⏰ AI analysis timeout for "${article.title}"`);
      throw new Error('AI analysis timeout');
    }
    console.error(`❌ AI analysis failed for "${article.title}": ${error.message}`);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("Function started at", new Date().toISOString());
  
  try {
    // Use environment variables that Supabase provides automatically
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        db: {
          schema: 'public' // Explicit default schema
        }
      }
    );

    const payload = await req.json().catch(() => null);
    if (!payload || !payload.article_id) {
      throw new Error('Missing article_id in payload');
    }

    console.log("Processing article:", payload.article_id);

    // 1. Fetch article (only existing columns)
    const { data: article, error: fetchError } = await supabase
      .from('rss_articles')  // Remove schema prefix
      .select('id, title, content, is_processed, published_at')
      .eq('id', payload.article_id)
      .single();

    if (fetchError) throw new Error(`Database fetch error: ${fetchError.message}`);
    if (!article) throw new Error(`Article ${payload.article_id} not found`);

    console.log("Fetched article:", { 
      id: article.id, 
      title: article.title?.substring(0, 50) + '...',
      published_at: article.published_at,
      is_processed: article.is_processed 
    });

    // 2. Check if already processed
    if (article.is_processed) {
      console.log("Article already processed - skipping");
      return new Response(JSON.stringify({
        status: 'skipped',
        reason: 'already_processed'
      }));
    }

    // 3. War content detection
    const warKeywords = ['war', 'military', 'attack', 'conflict', 'iran', 'russia', 'ukraine'];
    const contentText = (article.content || '').toLowerCase();
    const titleText = (article.title || '').toLowerCase();
    
    const isWarArticle = warKeywords.some(kw => 
      contentText.includes(kw) || titleText.includes(kw)
    );

    console.log("War content check result:", isWarArticle);

    if (!isWarArticle) {
      await supabase
        .from('rss_articles')
        .update({ is_processed: true })
        .eq('id', payload.article_id);
      
      return new Response(JSON.stringify({
        status: 'skipped',
        reason: 'not_war_related'
      }));
    }

    // 4. AI Analysis (replace test event with real analysis)
    const warEvent = await analyzeArticleWithAI({
      id: article.id,
      title: article.title,
      content: article.content,
      url: `https://example.com/article/${article.id}`, // Replace with actual URL if available
      source: 'RSS Feed', // Replace with actual source if available
      fetched_at: article.published_at || new Date().toISOString(),
      is_processed: article.is_processed
    });

    let insertedEvent: WarEvent | null = null;

    if (warEvent) {
      // 5. Insert real war event
      const { error: insertError } = await supabase
        .from('war_events')  // Remove schema prefix
        .insert([warEvent]);

      if (insertError) throw new Error(`Event insert failed: ${insertError.message}`);
      insertedEvent = warEvent;
      console.log(`✅ Created war event: ${warEvent.event_type} in ${warEvent.country}`);
    } else {
      console.log("⏭️ AI determined article is not war-related");
    }

    // 6. Mark article as processed
    const { error: updateError } = await supabase
      .from('rss_articles')  // Remove schema prefix
      .update({ is_processed: true })
      .eq('id', article.id);

    if (updateError) throw new Error(`Article update failed: ${updateError.message}`);

    console.log("Successfully processed article");

    return new Response(JSON.stringify({
      status: 'success',
      event: insertedEvent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("FUNCTION ERROR:", {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      status: 'error',
      error: err.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});