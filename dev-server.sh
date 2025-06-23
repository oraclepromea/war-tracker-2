#!/bin/bash

echo "🎯 War Tracker 2.0 - Development Server"
echo "========================================"

# Make the script executable
chmod +x start.sh

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Check if we have a Supabase project
if [ ! -f supabase/config.toml ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Start Supabase local development
echo "🗄️ Starting Supabase local services..."
supabase start &

# Wait a moment for Supabase to start
sleep 5

# Now start the main application
./start.sh