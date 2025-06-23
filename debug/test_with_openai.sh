# Test with OpenAI API instead of OpenRouter

echo "1. Deploy the updated function (now uses OpenAI):"
supabase functions deploy analyze-war-intel

echo ""
echo "2. Reset article for testing:"
echo "UPDATE rss_articles SET is_processed = false WHERE id = '626ab425-89c7-477c-8800-092aed9be454';"

echo ""
echo "3. Test with OpenAI (should work with your sk-proj- key):"
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM" \
-d '{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'

echo ""
echo "Expected: Real AI analysis with GPT-3.5-turbo analyzing the Iran-Israel article"