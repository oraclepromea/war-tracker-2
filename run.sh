#!/bin/bash

echo "🚀 War Tracker 2.0 - Quick Start"
echo "================================"

# Make scripts executable
chmod +x *.sh

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your API keys:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY" 
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - OPENROUTER_API_KEY"
    echo ""
    echo "Then run: npm start"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

echo ""
echo "Starting War Tracker 2.0..."
echo "Frontend: http://localhost:5173"
echo "API Functions: Local Supabase Edge Functions"
echo ""
echo "Press Ctrl+C to stop"

# Start the application
npm run dev