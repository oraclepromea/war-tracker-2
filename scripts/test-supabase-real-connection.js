const { createClient } = require('@supabase/supabase-js');

async function testRealConnection() {
  const supabaseUrl = 'https://prmjtsiyeovmkujtbjwi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU2MzIzNSwiZXhwIjoyMDY2MTM5MjM1fQ.SHUyrNsVWLTX5pbcFHLTz7obZQ62L9G7kLwOwLIWoeo';
  
  console.log('🔍 Testing with real Supabase credentials...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' }
    });
    
    // Fix the query syntax
    const { data, error } = await supabase
      .from('rss_articles')
      .select('id', { count: 'exact' })
      .limit(1);
      
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase');
      console.log('📊 Connection test passed');
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

testRealConnection();
