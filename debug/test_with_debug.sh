# Deploy and test with debug logging

echo "1. Deploy the updated function with debug logging:"
supabase functions deploy analyze-war-intel

echo ""
echo "2. Reset article for testing:"
echo "UPDATE rss_articles SET is_processed = false WHERE id = '626ab425-89c7-477c-8800-092aed9be454';"

echo ""
echo "3. Test with debug output (check Supabase logs for API key info):"
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM" \
-d '{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'

echo ""
echo "4. Check Supabase Dashboard > Edge Functions > analyze-war-intel > Logs"
echo "   Look for messages about the OpenRouter API key and response"