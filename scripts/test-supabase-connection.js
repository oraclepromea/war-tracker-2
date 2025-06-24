const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  // Use the real credentials
  const supabaseUrl = 'https://prmjtsiyeovmkujtbjwi.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU2MzIzNSwiZXhwIjoyMDY2MTM5MjM1fQ.SHUyrNsVWLTX5pbcFHLTz7obZQ62L9G7kLwOwLIWoeo';
  
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    const supabase = createClient(
      supabaseUrl, 
      supabaseKey,
      {
        db: {
          schema: 'public' // Explicit default schema
        }
      }
    );
    
    // Test basic connection
    const { data, error } = await supabase
      .from('rss_articles')
      .select('count(*)', { count: 'exact' })
      .limit(0);
      
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      // Check if table exists
      const { data: tables, error: tablesError } = await supabase.rpc('get_table_names');
      if (tablesError) {
        console.error('❌ Could not list tables:', tablesError.message);
      } else {
        console.log('📊 Available tables:', tables);
      }
    } else {
      console.log('✅ Successfully connected to Supabase');
      console.log('📊 rss_articles table accessible');
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

testConnection();
