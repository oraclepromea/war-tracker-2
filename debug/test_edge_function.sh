# Test the Edge Function with proper authorization

# Method 1: Using anon key (recommended for testing)
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.m5ZuiPl-GXf-LJRLrfHqcVNyDNr4JqKQFxkqGRn8W1I" \
-d '{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'

# Method 2: Using service role key (if anon doesn't work)
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/analyze-war-intel \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU2MzIzNSwiZXhwIjoyMDY2MTM5MjM1fQ.Lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM" \
-d '{"article_id": "626ab425-89c7-477c-8800-092aed9be454"}'

# Alternative: Test from Supabase Dashboard
# Go to: Project Settings > API > anon/public key
# Copy the key and use it in the Authorization header