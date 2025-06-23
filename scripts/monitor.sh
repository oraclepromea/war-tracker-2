#!/bin/bash

# War Tracker Automation Monitor
# This script continuously monitors and processes new articles

SUPABASE_URL="https://prmjtsiyeovmkujtbjwi.supabase.co"
AUTH_TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NjMyMzUsImV4cCI6MjA2NjEzOTIzNX0.lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM"

echo "🚀 War Tracker Automation Monitor Started"
echo "⏰ $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to run scheduler and show results
run_scheduler() {
    echo "🔍 Checking for unprocessed articles..."
    
    response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/scheduler" \
        -H "Content-Type: application/json" \
        -H "Authorization: $AUTH_TOKEN")
    
    status=$(echo "$response" | jq -r '.status // "unknown"')
    
    case $status in
        "idle")
            echo "✅ No articles to process - system idle"
            ;;
        "completed")
            articles_found=$(echo "$response" | jq -r '.articles_found // 0')
            events_created=$(echo "$response" | jq -r '.batch_result.stats.eventsCreated // 0')
            processing_time=$(echo "$response" | jq -r '.batch_result.stats.processingTimeMs // 0')
            
            echo "🎯 Processed $articles_found articles"
            echo "⚔️  Created $events_created war events"
            echo "⏱️  Processing time: ${processing_time}ms"
            ;;
        "error")
            error_msg=$(echo "$response" | jq -r '.error // "Unknown error"')
            echo "❌ Error: $error_msg"
            ;;
        *)
            echo "⚠️  Unknown status: $status"
            echo "Response: $response"
            ;;
    esac
}

# Main monitoring loop
if [ "$1" = "--continuous" ]; then
    echo "🔄 Running in continuous mode (Ctrl+C to stop)"
    echo ""
    
    while true; do
        echo "🕒 $(date +"%H:%M:%S") - Running scheduler..."
        run_scheduler
        echo ""
        echo "💤 Sleeping for 5 minutes..."
        sleep 300  # Wait 5 minutes
    done
else
    echo "📊 Running single check..."
    run_scheduler
    echo ""
    echo "💡 Tip: Run with --continuous for automatic monitoring"
    echo "   ./monitor.sh --continuous"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Monitor finished at $(date)"