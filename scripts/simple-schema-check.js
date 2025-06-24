const { createClient } = require('@supabase/supabase-js');

async function simpleCheck() {
  // Get credentials from Railway environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Credentials check:');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Key:', supabaseKey ? '✅' : '❌');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Missing credentials. Set them with:');
    console.log('railway variables set SUPABASE_URL=your-url');
    console.log('railway variables set SUPABASE_SERVICE_ROLE_KEY=your-key');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simple table existence check
    const { data, error } = await supabase
      .from('rss_articles')
      .select('count(*)', { count: 'exact' })
      .limit(0);
      
    if (error) {
      console.log('❌ Table access failed:', error.message);
      
      // Check if it's a schema issue
      if (error.message.includes('net')) {
        console.log('🔧 Schema issue detected - tables may be in wrong schema');
      }
    } else {
      console.log('✅ Successfully connected to rss_articles table');
    }
    
  } catch (error) {
    console.log('💥 Connection failed:', error.message);
  }
}

simpleCheck();
