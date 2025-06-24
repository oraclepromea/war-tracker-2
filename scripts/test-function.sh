#!/bin/bash

# Your actual anon key
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM"

echo "Testing RSS Fetcher function..."
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/rssFetcher \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
