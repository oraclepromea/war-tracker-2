# Get your actual Supabase API keys
# Run these commands to find the correct keys:

# Option 1: Check your Supabase project settings
echo "Go to your Supabase Dashboard:"
echo "1. Visit https://supabase.com/dashboard"
echo "2. Select your project: prmjtsiyeovmkujtbjwi"
echo "3. Go to Settings > API"
echo "4. Copy the 'anon public' key (not service_role)"
echo ""

# Option 2: Check local Supabase config (if you have CLI)
supabase status 2>/dev/null || echo "Supabase CLI not found - use Dashboard method above"
echo ""

# Option 3: Test with service_role key (should work for Edge Functions)
echo "Try this curl command with the service role key:"
echo 'curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \'
echo '-H "Content-Type: application/json" \'
echo '-H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY_HERE" \'
echo '-d '"'"'{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'"'"''
echo ""

# Option 4: Test directly in Supabase Dashboard
echo "Alternative: Test directly in Supabase Dashboard:"
echo "1. Go to Edge Functions > analyze-war-intel"
echo "2. Click 'Invoke Function'"
echo "3. Use this payload: {\"article_id\": \"626ab425-89c7-477c-8800-092aed9be454\"}"