/// <reference path="../_shared/deno.d.ts" />
/// <reference path="../../../types/deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchProcessingStats {
  totalProcessed: number;
  eventsCreated: number;
  skippedNotWar: number;
  errors: number;
  processingTimeMs: number;
}

interface ProcessingResult {
  article_id: string;
  success: boolean;
  error?: string;
  result?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("🚀 Batch processing started at", new Date().toISOString());
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json().catch(() => ({}));
    const batchSize = payload.batch_size || 5; // Process 5 articles at a time
    const maxConcurrent = payload.max_concurrent || 2; // Max 2 concurrent AI calls

    console.log(`📊 Batch config: ${batchSize} articles, ${maxConcurrent} concurrent`);

    // Fetch unprocessed articles
    const { data: articles, error: fetchError } = await supabase
      .from('rss_articles')
      .select('id, title, content, published_at')
      .eq('is_processed', false)
      .order('published_at', { ascending: false })
      .limit(batchSize);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        status: 'completed',
        message: 'No unprocessed articles found',
        stats: { totalProcessed: 0, eventsCreated: 0, skippedNotWar: 0, errors: 0, processingTimeMs: 0 }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📝 Found ${articles.length} unprocessed articles`);

    const stats: BatchProcessingStats = {
      totalProcessed: 0,
      eventsCreated: 0,
      skippedNotWar: 0,
      errors: 0,
      processingTimeMs: 0
    };

    // Process articles in batches with concurrency control
    const analyzeWarIntelUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-war-intel`;
    const authToken = req.headers.get('authorization') || '';

    // Process articles with controlled concurrency
    const processArticle = async (article: any): Promise<ProcessingResult> => {
      try {
        console.log(`🔍 Processing: "${article.title.substring(0, 50)}..."`);
        
        const response = await fetch(analyzeWarIntelUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({ article_id: article.id })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        stats.totalProcessed++;

        if (result.status === 'success' && result.event) {
          stats.eventsCreated++;
          console.log(`✅ War event created: ${result.event.event_type} in ${result.event.country}`);
        } else if (result.status === 'skipped') {
          stats.skippedNotWar++;
          console.log(`⏭️ Skipped: ${result.reason}`);
        }

        return { success: true, article_id: article.id, result };
      } catch (error) {
        stats.errors++;
        console.error(`❌ Error processing ${article.id}:`, error.message);
        return { success: false, article_id: article.id, error: error.message };
      }
    };

    // Process in chunks with concurrency limit
    const results: ProcessingResult[] = [];
    for (let i = 0; i < articles.length; i += maxConcurrent) {
      const chunk = articles.slice(i, i + maxConcurrent);
      const chunkPromises = chunk.map(processArticle);
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // Small delay between chunks to avoid overwhelming the system
      if (i + maxConcurrent < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    stats.processingTimeMs = Date.now() - startTime;

    console.log(`🎯 Batch completed in ${stats.processingTimeMs}ms`);
    console.log(`📈 Stats: ${stats.eventsCreated} events, ${stats.skippedNotWar} skipped, ${stats.errors} errors`);

    return new Response(JSON.stringify({
      status: 'completed',
      stats,
      results: results.map(r => ({
        article_id: r.article_id,
        success: r.success,
        ...(r.error && { error: r.error })
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("BATCH PROCESSING ERROR:", error);
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
      processingTimeMs: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});