# Test Real AI Analysis with OpenRouter

# 1. Reset an article for testing
echo "Resetting article for AI analysis test..."
echo "Run this SQL in Supabase:"
echo "UPDATE rss_articles SET is_processed = false WHERE id = '626ab425-89c7-477c-8800-092aed9be454';"

# 2. Deploy the updated function (just to make sure latest version is live)
echo "Deploying latest function..."
supabase functions deploy analyze-war-intel

# 3. Test with real AI analysis
echo "Testing with real AI analysis..."
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM" \
-d '{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'

# Expected: Real AI analysis with structured war event data instead of test event