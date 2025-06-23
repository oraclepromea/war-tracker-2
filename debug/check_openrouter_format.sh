# Check your actual OpenRouter API key format

echo "1. Check your OpenRouter key in backend/.env:"
cat /Users/RoRo_HQ/War\ Tracker\ 2.0/backend/.env | grep OPENROUTER

echo ""
echo "2. OpenRouter keys should start with 'sk-or-v1-'"
echo "   If yours starts differently, you may need a new key from:"
echo "   https://openrouter.ai/keys"

echo ""
echo "3. Update Supabase with correct key format:"
echo "   supabase secrets set OPENROUTER_API_KEY=your_actual_openrouter_key"

echo ""
echo "4. Verify what's currently in Supabase:"
supabase secrets list