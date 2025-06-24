const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://prmjtsiyeovmkujtbjwi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRSSFunction() {
  console.log('🧪 Testing RSS Fetcher Edge Function...')
  
  try {
    // Invoke the edge function
    const { data, error } = await supabase.functions.invoke('rssFetcher')
    
    if (error) {
      console.error('❌ Function error:', error)
      return
    }
    
    console.log('✅ Function response:', data)
    
    // Check if articles were saved
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (articlesError) {
      console.error('❌ Articles fetch error:', articlesError)
      return
    }
    
    console.log(`📰 Latest ${articles.length} articles:`)
    articles.forEach(article => {
      console.log(`  - ${article.title} (${article.source})`)
    })
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testRSSFunction()
