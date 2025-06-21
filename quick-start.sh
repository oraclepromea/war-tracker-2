#!/bin/bash

echo "🚀 War Tracker 2.0 - Quick Setup & Start"
echo "========================================"

# Navigate to project root
cd "/Users/RoRo_HQ/War Tracker 2.0"

# Install root dependencies (concurrently)
echo "📦 Installing root dependencies..."
npm install

# Create development environment file
echo "⚙️  Setting up development environment..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env from template"
else
    echo "ℹ️  server/.env already exists"
fi

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down War Tracker..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "🚀 Starting War Tracker 2.0..."

# Start server
echo "🔧 Starting server on port 3001..."
cd server
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start client  
echo "🎨 Starting client on port 5173..."
cd ../client
npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ War Tracker 2.0 is running!"
echo "=============================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API Health: http://localhost:3001/api/health"
echo "📊 News Sync: curl -X POST http://localhost:3001/api/jobs/news"
echo ""
echo "📋 Available Features:"
echo "   ✅ War Events Timeline"
echo "   ✅ Countries & Forces Arsenal"
echo "   ✅ 17 RSS News Sources" 
echo "   ✅ Settings & Configuration"
echo "   ✅ Debug Console"
echo "   ⚠️  Database features disabled (install PostgreSQL to enable)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait