const fetch = require('node-fetch');

const RAILWAY_URL = 'https://war-tracker-20-production.up.railway.app';

async function testEndpoint(path, description) {
  try {
    console.log(`🔍 Testing ${description}...`);
    const response = await fetch(`${RAILWAY_URL}${path}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description}: OK (${response.status})`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ ${description}: Failed (${response.status})`);
      const text = await response.text();
      console.log(`📄 Response:`, text.substring(0, 200));
    }
  } catch (error) {
    console.log(`💥 ${description}: Error - ${error.message}`);
  }
  console.log('---');
}

async function testRailwayDeployment() {
  console.log('🚀 Testing War Tracker 2.0 Railway Deployment\n');
  
  await testEndpoint('/api/health', 'Health Check');
  await testEndpoint('/', 'Root Endpoint');
  await testEndpoint('/api/news', 'News Endpoint');
  await testEndpoint('/api/events', 'Events Endpoint');
  await testEndpoint('/api/live', 'Live Data Endpoint');
  
  console.log('🏁 Railway deployment test complete!');
}

testRailwayDeployment();
