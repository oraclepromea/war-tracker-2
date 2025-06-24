const fetch = require('node-fetch');

async function testLocal() {
  console.log('🧪 Testing local server...');
  
  try {
    const response = await fetch('http://localhost:8080/api/health');
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Local test failed:', error.message);
  }
}

testLocal();
