# Check what the AI actually analyzed

echo "🔍 Check the Supabase Edge Function logs to see:"
echo "1. Go to: https://supabase.com/dashboard/project/prmjtsiyeovmkujtbjwi"
echo "2. Navigate to: Edge Functions > analyze-war-intel > Logs"
echo "3. Look for recent entries showing:"
echo "   - 🔑 OpenRouter key found: sk-or-v1-8dc..."
echo "   - 🤖 Analyzing: 'Watch: The US has joined the Iran-Israel war...'"
echo "   - ⏭️ Low confidence (XX%): 'article title'"
echo "   - OR ✅ War event: event_type in country (XX%)"
echo ""
echo "🧪 Let's test with a more explicitly war-related article:"
echo "First, check if you have other articles with stronger war keywords:"

echo ""
echo "🔍 Run this SQL in Supabase to find war articles:"
echo "SELECT id, title, content FROM rss_articles WHERE is_processed = false AND (title ILIKE '%war%' OR title ILIKE '%attack%' OR title ILIKE '%military%' OR title ILIKE '%strike%') LIMIT 5;"