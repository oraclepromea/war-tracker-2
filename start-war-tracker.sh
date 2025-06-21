#!/bin/bash

echo "🚀 Starting War Tracker 2.0..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down War Tracker..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start server
echo "🔧 Starting server on port 3001..."
cd server
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Start client
echo "🎨 Starting client on port 3000..."
cd ../client
npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ War Tracker 2.0 is running!"
echo "📊 Frontend: http://localhost:3000"
echo "🔗 API: http://localhost:3001/api/health"
echo "⚙️  Settings: http://localhost:3000 (Settings tab)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
