#!/bin/bash

echo "Testing RSS Fetcher function without authentication..."
curl -X POST https://prmjtsiyeovmkujtbjwi.supabase.co/functions/v1/rssFetcher \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
