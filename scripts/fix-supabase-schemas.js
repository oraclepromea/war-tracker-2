const { createClient } = require('@supabase/supabase-js');

async function fixSupabaseSchemas() {
  // Use environment variables or fallback to known values
  const supabaseUrl = process.env.SUPABASE_URL || 'https://prmjtsiyeovmkujtbjwi.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU2MzIzNSwiZXhwIjoyMDY2MTM5MjM1fQ.SHUyrNsVWLTX5pbcFHLTz7obZQ62L9G7kLwOwLIWoeo';

  console.log('🔍 Checking Supabase table schemas...');
  console.log('URL:', supabaseUrl);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test table access
    const { data: articles, error: articlesError } = await supabase
      .from('rss_articles')
      .select('id')
      .limit(1);
        
    if (articlesError) {
      console.error('❌ rss_articles error:', articlesError.message);
      
      // If table doesn't exist, create it
      if (articlesError.message.includes('does not exist')) {
        console.log('🔧 Creating rss_articles table...');
        // Add table creation logic here
      }
    } else {
      console.log('✅ rss_articles table accessible');
    }
    
    // Check war_events table
    const { data: events, error: eventsError } = await supabase
      .from('war_events')
      .select('id')
      .limit(1);
        
    if (eventsError) {
      console.error('❌ war_events error:', eventsError.message);
    } else {
      console.log('✅ war_events table accessible');
    }

  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
  }
}

if (require.main === module) {
  fixSupabaseSchemas();
}
