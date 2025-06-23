#!/bin/bash

echo "🧪 War Tracker 2.0 - Quick Test Script"
echo "======================================="

# Test health endpoint
echo "Testing server health..."
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server not responding - make sure to run 'npm run dev' first"
    exit 1
fi

# Test news aggregation
echo "Testing news aggregation job..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/jobs/news)
if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ News aggregation job completed"
else
    echo "⚠️  News aggregation may have had issues"
fi

# Test events endpoint
echo "Testing events endpoint..."
curl -s http://localhost:3001/api/events/recent > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Events API responding"
else
    echo "⚠️  Events API may have issues"
fi

echo ""
echo "🎯 Test complete! Check the War Events Timeline at http://localhost:3000"