#!/bin/bash

echo "🎯 War Tracker 2.0 - Simple Start"
echo "================================"

cd "/Users/RoRo_HQ/War Tracker 2.0"

# Clean up ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Install backend dependencies
echo "📦 Setting up backend..."
cd backend
npm install
cd ..

# Install client dependencies  
echo "📦 Setting up client..."
cd client
npm install
cd ..

echo ""
echo "🚀 Starting servers..."

# Start backend from root directory
(cd backend && npm run dev) &
BACKEND_PID=$!
echo "🔧 Backend started on port 3001"

# Wait and start client from root directory
sleep 3
(cd client && npm run dev) &
FRONTEND_PID=$!
echo "🎨 Client started on port 5173"

echo ""
echo "✅ War Tracker 2.0 is running!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait