/// <reference path="../_shared/deno.d.ts" />
/// <reference path="../../../types/deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Additional war/conflict RSS feeds
const WAR_RSS_FEEDS = [
  {
    name: 'Reuters Conflicts',
    url: 'https://feeds.reuters.com/reuters/worldNews',
    category: 'global_conflicts'
  },
  {
    name: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'international'
  },
  {
    name: 'Defense News',
    url: 'https://www.defensenews.com/arc/outboundfeeds/rss/category/global/?outputType=xml',
    category: 'military'
  },
  {
    name: 'Breaking Defense',
    url: 'https://breakingdefense.com/feed/',
    category: 'defense'
  },
  {
    name: 'Military Times',
    url: 'https://www.militarytimes.com/arc/outboundfeeds/rss/',
    category: 'military'
  },
  {
    name: 'War on the Rocks',
    url: 'https://warontherocks.com/feed/',
    category: 'analysis'
  },
  {
    name: 'Jane\'s Defence',
    url: 'https://www.janes.com/feeds/defence-news',
    category: 'intelligence'
  },
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'middle_east'
  }
];

interface FeedResult {
  name: string;
  status: 'added' | 'already_exists' | 'error';
  id?: any;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("🌐 Adding multiple RSS feeds for comprehensive war monitoring");
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: FeedResult[] = [];
    
    for (const feed of WAR_RSS_FEEDS) {
      try {
        console.log(`📡 Adding feed: ${feed.name}`);
        
        const { data, error } = await supabase
          .from('rss_sources')
          .insert({
            name: feed.name,
            url: feed.url,
            category: feed.category,
            is_active: true,
            last_fetched: null,
            fetch_interval: 1800 // 30 minutes
          })
          .select();

        if (error) {
          if (error.code === '23505') { // Duplicate
            console.log(`⚠️ Feed already exists: ${feed.name}`);
            results.push({ name: feed.name, status: 'already_exists' });
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Added: ${feed.name}`);
          results.push({ name: feed.name, status: 'added', id: data[0].id });
        }
      } catch (feedError) {
        console.error(`❌ Error adding ${feed.name}:`, feedError.message);
        results.push({ name: feed.name, status: 'error', error: feedError.message });
      }
    }

    console.log(`🎯 Completed adding ${WAR_RSS_FEEDS.length} RSS feeds`);

    return new Response(JSON.stringify({
      status: 'completed',
      feeds_processed: WAR_RSS_FEEDS.length,
      results: results,
      summary: {
        added: results.filter(r => r.status === 'added').length,
        already_exists: results.filter(r => r.status === 'already_exists').length,
        errors: results.filter(r => r.status === 'error').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("ADD FEEDS ERROR:", error);
    
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});