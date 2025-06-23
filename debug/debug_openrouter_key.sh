# Debug OpenRouter API Key Issues

echo "1. Check OpenRouter key format in your backend .env:"
grep OPENROUTER_API_KEY /Users/RoRo_HQ/War\ Tracker\ 2.0/backend/.env

echo ""
echo "2. Verify key is set in Supabase:"
supabase secrets list

echo ""
echo "3. Test key format (should start with 'sk-or-'):"
echo "OpenRouter keys typically start with 'sk-or-v1-' followed by a long string"

echo ""
echo "4. If key is wrong format, update it:"
echo "supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-actual-key"

echo ""
echo "5. Deploy updated function:"
echo "supabase functions deploy analyze-war-intel"