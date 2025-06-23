#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions..."
echo "======================================"

# Check if Supabase is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged into Supabase. Run 'supabase login' first."
    exit 1
fi

# Deploy all functions
echo "📤 Deploying add-war-feeds function..."
supabase functions deploy add-war-feeds

echo "📤 Deploying analyze-war-intel function..."
supabase functions deploy analyze-war-intel

echo "📤 Deploying batch-analyze-articles function..."
supabase functions deploy batch-analyze-articles

echo "📤 Deploying debug-war-events function..."
supabase functions deploy debug-war-events

echo "📤 Deploying process-articles function..."
supabase functions deploy process-articles

echo "📤 Deploying scheduler function..."
supabase functions deploy scheduler

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Test functions with 'npm run test:api'"
echo "2. Add RSS sources by calling add-war-feeds function"
echo "3. Set up cron job for automated processing"