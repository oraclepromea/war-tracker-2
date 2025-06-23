# Update Supabase with new OpenRouter key

echo "1. Set your new OpenRouter key in Supabase:"
supabase secrets set OPENROUTER_API_KEY=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

echo ""
echo "2. Verify it's set correctly:"
supabase secrets list

echo ""
echo "3. Deploy the function (will use OpenRouter again):"
supabase functions deploy analyze-war-intel

echo ""
echo "4. Test with the new OpenRouter key:"
echo "curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \\"
echo "-H \"Content-Type: application/json\" \\"
echo "-H \"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM\" \\"
echo "-d '{\"article_id\": \"626ab425-89c7-477c-8800-092aed9be454\"}'"