#!/bin/bash

echo "🧪 Testing War Tracker 2.0 API..."
echo "================================="

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found. Run setup first."
    exit 1
fi

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Required environment variables not set. Check your .env file."
    exit 1
fi

echo "🔍 Testing Supabase connection..."

# Test database connection
echo "Testing RSS articles table..."
curl -s "$VITE_SUPABASE_URL/rest/v1/rss_articles?limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | jq '.' || echo "❌ Database connection failed"

echo ""
echo "🎯 Testing Edge Functions..."

# Test add-war-feeds function
echo "Adding RSS sources..."
curl -s -X POST "$VITE_SUPABASE_URL/functions/v1/add-war-feeds" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.'

echo ""
echo "Testing scheduler function..."
curl -s -X POST "$VITE_SUPABASE_URL/functions/v1/scheduler" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.'

echo ""
echo "✅ API tests complete!"
echo ""
echo "If you see JSON responses above, your API is working correctly."
echo "Check the War Tracker dashboard at http://localhost:5173"