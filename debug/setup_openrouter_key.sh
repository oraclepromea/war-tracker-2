# Instructions to copy OpenRouter key to Supabase

# 1. Get your OpenRouter key from backend/.env
echo "Your OpenRouter key from backend/.env:"
grep OPENROUTER_API_KEY /Users/RoRo_HQ/War\ Tracker\ 2.0/backend/.env

# 2. Set it in Supabase (replace YOUR_KEY with the actual key)
echo "Run this command to set the key in Supabase:"
echo "supabase secrets set OPENROUTER_API_KEY=YOUR_KEY_FROM_BACKEND_ENV"

# 3. Deploy the updated function
echo "Then deploy the updated function:"
echo "supabase functions deploy analyze-war-intel"

# 4. Test with real AI analysis
echo "Test with a reset article:"
echo "UPDATE rss_articles SET is_processed = false WHERE id = '626ab425-89c7-477c-8800-092aed9be454';"