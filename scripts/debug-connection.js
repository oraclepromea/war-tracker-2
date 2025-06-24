require('dotenv').config({ path: '.env.local' });

async function debugConnection() {
  console.log('🔍 Debugging connection...\n');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  
  if (process.env.SUPABASE_URL) {
    console.log('URL format:', process.env.SUPABASE_URL.substring(0, 30) + '...');
  }
  
  // Test basic fetch
  console.log('\n🌐 Testing network connectivity...');
  try {
    const response = await fetch('https://httpbin.org/get');
    console.log('Network test:', response.ok ? '✅ Connected' : '❌ Failed');
  } catch (error) {
    console.log('Network test: ❌ Failed -', error.message);
  }
  
  // Test Supabase URL
  if (process.env.SUPABASE_URL) {
    console.log('\n🔗 Testing Supabase URL...');
    try {
      const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/', {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
        }
      });
      console.log('Supabase URL test:', response.ok ? '✅ Reachable' : `❌ Failed (${response.status})`);
    } catch (error) {
      console.log('Supabase URL test: ❌ Failed -', error.message);
    }
  }
}

debugConnection();
