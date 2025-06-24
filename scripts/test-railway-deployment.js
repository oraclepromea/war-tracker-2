const https = require('https');

const RAILWAY_URL = 'https://war-tracker-20-production.up.railway.app';

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${description}...`);
    
    const options = {
      hostname: 'war-tracker-20-production.up.railway.app',
      port: 443,
      path: path,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: OK (${res.statusCode})`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`📊 Response:`, JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(`📄 Response:`, data.substring(0, 200));
          }
        } else {
          console.log(`❌ ${description}: Failed (${res.statusCode})`);
          console.log(`📄 Response:`, data.substring(0, 200));
        }
        console.log('---');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`💥 ${description}: Error - ${error.message}`);
      console.log('---');
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      console.log('---');
      resolve();
    });

    req.end();
  });
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
