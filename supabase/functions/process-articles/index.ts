/// <reference path="../_shared/deno.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Types for our database tables
interface RSSArticle {
  id: string
  title: string
  content: string
  url: string
  source: string
  published_at: string
  fetched_at: string
  is_processed?: boolean
}

interface WarEvent {
  event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic'
  country: string
  region: string
  latitude: number | null
  longitude: number | null
  casualties: number | null
  weapons_used: string[] | null
  source_country: string | null
  target_country: string | null
  confidence: number
  threat_level: 'low' | 'medium' | 'high' | 'critical'
  article_id: string
  article_title: string
  article_url: string
  processed_at: string
}

// OpenRouter AI analysis
async function analyzeArticleWithAI(article: RSSArticle): Promise<WarEvent | null> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
  
  if (!openRouterKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment')
    throw new Error('OpenRouter API key not configured')
  }

  const prompt = `Analyze this news article for war-related events. Return JSON with:
- event_type: 'airstrike' | 'humanitarian' | 'cyberattack' | 'diplomatic'
- country: string
- region: string
- latitude: number | null
- longitude: number | null
- casualties: number | null
- weapons_used: string[] | null
- source_country: string | null
- target_country: string | null
- confidence: number (0-100)
- threat_level: 'low' | 'medium' | 'high' | 'critical'

Only return JSON. Example:
{
  "event_type": "airstrike",
  "country": "Ukraine",
  "region": "Donetsk",
  "latitude": 48.023,
  "longitude": 37.802,
  "casualties": 12,
  "weapons_used": ["missiles", "drones"],
  "confidence": 85,
  "threat_level": "high"
}

Article Title: ${article.title}
Article Content: ${article.content}`

  try {
    console.log(`🤖 Analyzing article: "${article.title}"`)
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://war-tracker.app',
        'X-Title': 'War Tracker AI Analysis'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ OpenRouter API error: ${response.status} - ${errorText}`)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content?.trim()

    if (!aiResponse) {
      console.warn(`⚠️ No AI response for article: "${article.title}"`)
      return null
    }

    // Parse JSON response
    let parsedEvent: any
    try {
      // Remove any markdown code blocks if present
      const jsonString = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedEvent = JSON.parse(jsonString)
    } catch (parseError) {
      console.error(`❌ Failed to parse AI response as JSON: ${aiResponse}`)
      return null
    }

    // Validate required fields and confidence threshold
    if (!parsedEvent.event_type || !parsedEvent.country || parsedEvent.confidence < 50) {
      console.log(`⏭️ Skipping low-confidence or invalid event (confidence: ${parsedEvent.confidence})`)
      return null
    }

    // Build war event object
    const warEvent: WarEvent = {
      event_type: parsedEvent.event_type,
      country: parsedEvent.country,
      region: parsedEvent.region || '',
      latitude: parsedEvent.latitude,
      longitude: parsedEvent.longitude,
      casualties: parsedEvent.casualties,
      weapons_used: parsedEvent.weapons_used,
      source_country: parsedEvent.source_country,
      target_country: parsedEvent.target_country,
      confidence: parsedEvent.confidence,
      threat_level: parsedEvent.threat_level,
      article_id: article.id,
      article_title: article.title,
      article_url: article.url,
      processed_at: new Date().toISOString()
    }

    console.log(`✅ Generated war event: ${warEvent.event_type} in ${warEvent.country} (${warEvent.confidence}% confidence)`)
    return warEvent

  } catch (error) {
    console.error(`❌ AI analysis failed for "${article.title}":`, error)
    throw error
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Starting AI article processing...')

    // Fetch unprocessed articles
    const { data: articles, error: fetchError } = await supabase
      .from('rss_articles')
      .select('*')
      .is('is_processed', false)
      .limit(10) // Process in batches
      .order('fetched_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching articles:', fetchError)
      throw fetchError
    }

    if (!articles || articles.length === 0) {
      console.log('📄 No unprocessed articles found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No unprocessed articles found',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📰 Found ${articles.length} unprocessed articles`)

    let processedCount = 0
    let warEventsCreated = 0
    let errors = 0

    // Process each article
    for (const article of articles) {
      try {
        // Analyze with AI
        const warEvent = await analyzeArticleWithAI(article)

        if (warEvent) {
          // Insert war event
          const { error: insertError } = await supabase
            .from('war_events')
            .insert([warEvent])

          if (insertError) {
            console.error(`❌ Failed to insert war event for "${article.title}":`, insertError)
            errors++
          } else {
            console.log(`✅ Created war event for "${article.title}"`)
            warEventsCreated++
          }
        }

        // Mark article as processed
        const { error: updateError } = await supabase
          .from('rss_articles')
          .update({ is_processed: true })
          .eq('id', article.id)

        if (updateError) {
          console.error(`❌ Failed to mark article as processed: "${article.title}":`, updateError)
          errors++
        } else {
          processedCount++
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Error processing article "${article.title}":`, error)
        errors++
        
        // Still mark as processed to avoid reprocessing
        await supabase
          .from('rss_articles')
          .update({ is_processed: true })
          .eq('id', article.id)
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      war_events_created: warEventsCreated,
      errors: errors,
      total_articles: articles.length
    }

    console.log('📊 Processing complete:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Fatal error in edge function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})