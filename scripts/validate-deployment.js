const { createClient } = require('@supabase/supabase-js');
const { checkSchemas } = require('./check-schemas');

async function validateDeployment() {
  console.log('🚀 Validating deployment...\n');
  
  try {
    // 1. Check schemas
    await checkSchemas();
    
    // 2. Test RSS insertion
    console.log('\n🧪 Testing RSS article insertion...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const testArticle = {
      title: 'Test Article - ' + Date.now(),
      content: 'Test content for deployment validation',
      url: 'https://test.example.com/' + Date.now(),
      source: 'Test Source',
      published_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      is_processed: false,
      is_war_related: false
    };
    
    const { data, error } = await supabase
      .from('rss_articles')
      .insert(testArticle)
      .select();
      
    if (error) {
      console.error('❌ Test insertion failed:', error.message);
      return false;
    }
    
    console.log('✅ Test insertion successful');
    
    // Clean up test data
    await supabase
      .from('rss_articles')
      .delete()
      .eq('id', data[0].id);
      
    console.log('✅ Test cleanup completed');
    
    console.log('\n🎉 Deployment validation successful!');
    return true;
    
  } catch (error) {
    console.error('💥 Deployment validation failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  validateDeployment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { validateDeployment };
