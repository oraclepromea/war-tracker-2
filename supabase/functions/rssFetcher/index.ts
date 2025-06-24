/**
 * TASK: Migrate the local RSS fetcher script into a Supabase Edge Function with a CRON job to run every 15 minutes.
 *
 * REQUIREMENTS:
 * 1. Convert the script to a valid Supabase Edge Function using `serve` handler from `@supabase/functions`.
 * 2. The function should:
 *    - Fetch articles from a list of predefined RSS feed URLs (hardcoded or stored in an array)
 *    - Filter articles containing "war" or similar conflict-related keywords
 *    - Format each article as:
 *      {
 *        title: string;
 *        link: string;
 *        summary: string;
 *        published_at: string;
 *        source: string;
 *        image_url?: string;
 *      }
 *    - Upsert the articles into a `articles` table in Supabase
 *    - Avoid duplicates (match by `link` or `title`)
 *
 * 3. Log total articles fetched, filtered, and saved.
 * 4. Include basic error handling with try/catch and logging.
 * 5. Schedule it to run every 15 minutes via Supabase's `cron.yaml`.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Article type definition to match actual table schema
type Article = {
  title: string;
  url: string;
  description: string;
  published_at: string;
  source: string;
  image_url?: string;
  is_war_related?: boolean;
  language?: string;
}

// RSS feed sources
const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera" },
  { url: "https://www.theguardian.com/world/rss", name: "The Guardian World" },
  { url: "https://feeds.npr.org/1004/rss.xml", name: "NPR World" },
  { url: "https://rss.dw.com/xml/rss-en-world", name: "DW English" },
]

// War-related keywords for filtering
const WAR_KEYWORDS = [
  'war', 'conflict', 'military', 'attack', 'strike', 'bombing', 'battle',
  'ukraine', 'russia', 'gaza', 'israel', 'palestine', 'lebanon', 'syria',
  'missile', 'drone', 'artillery', 'troops', 'casualties', 'ceasefire',
  'invasion', 'offensive', 'defense', 'combat', 'operation', 'armed',
  'violence', 'fighting', 'soldiers', 'weapons'
]

serve(async (req) => {
  // Allow CORS for all requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 RSS Fetcher Edge Function started')
    
    // Initialize Supabase client with service role key for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let allArticles: Article[] = []
    let totalFetched = 0
    let totalFiltered = 0
    
    // Process each RSS feed
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`📡 Fetching from ${feed.name}...`)
        
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'War-Tracker-RSS-Bot/1.0'
          }
        })
        
        if (!response.ok) {
          console.log(`❌ Failed to fetch ${feed.name}: ${response.status}`)
          continue
        }
        
        const xmlText = await response.text()
        
        // Parse RSS XML manually (simplified parser)
        const items = parseRSSItems(xmlText)
        totalFetched += items.length
        
        // Filter for war-related content
        const warArticles = items.filter(item => 
          isWarRelated(item.title + ' ' + item.summary)
        )
        
        totalFiltered += warArticles.length
        
        // Format articles to match the actual table schema
        const formattedArticles: Article[] = warArticles.map(item => ({
          title: cleanText(item.title),
          url: item.link,
          description: cleanText(item.summary),
          published_at: formatDate(item.pubDate),
          source: feed.name,
          image_url: item.imageUrl || null,
          is_war_related: true,
          language: 'en'
        }))
        
        allArticles.push(...formattedArticles)
        console.log(`✅ ${feed.name}: ${warArticles.length} war-related articles`)
        
      } catch (error) {
        console.log(`❌ Error processing ${feed.name}:`, error.message)
      }
    }
    
    // Upsert articles to Supabase
    if (allArticles.length > 0) {
      const { data, error } = await supabase
        .from('articles')
        .upsert(allArticles, { 
          onConflict: 'url',
          ignoreDuplicates: false 
        })
        .select()
      
      if (error) {
        console.error('❌ Supabase upsert error:', error)
        throw error
      }
      
      console.log(`💾 Saved ${data?.length || 0} articles to database`)
    }
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        feedsProcessed: RSS_FEEDS.length,
        totalFetched,
        warRelatedFiltered: totalFiltered,
        savedToDatabase: allArticles.length
      }
    }
    
    console.log('🏁 RSS Fetcher completed:', result.stats)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
    
  } catch (error) {
    console.error('💥 RSS Fetcher error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

// Helper function to parse RSS items from XML
function parseRSSItems(xml: string) {
  const items: any[] = []
  
  // Simple regex-based XML parsing (for Edge Function compatibility)
  const itemMatches = xml.match(/<item[^>]*>(.*?)<\/item>/gs) || []
  
  for (const itemXml of itemMatches) {
    const title = extractXMLContent(itemXml, 'title')
    const link = extractXMLContent(itemXml, 'link')
    const description = extractXMLContent(itemXml, 'description')
    const pubDate = extractXMLContent(itemXml, 'pubDate')
    const imageUrl = extractXMLContent(itemXml, 'enclosure', 'url')
    
    if (title && link) {
      items.push({
        title,
        link,
        summary: description || '',
        pubDate: pubDate || new Date().toISOString(),
        imageUrl
      })
    }
  }
   
  return items
}

// Extract content from XML tags
function extractXMLContent(xml: string, tag: string, attribute?: string): string {
  if (attribute) {
    const regex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*?)["'][^>]*>`, 'i')
    const match = xml.match(regex)
    return match ? match[1] : ''
  }
  
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's')
  const match = xml.match(regex)
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : ''
}

// Check if content is war-related
function isWarRelated(text: string): boolean {
  const lowerText = text.toLowerCase()
  return WAR_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

// Clean HTML and format text
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .trim()
    .substring(0, 500)
}

// Format date to ISO string
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString()
  } catch {
    return new Date().toISOString()
  }
}
