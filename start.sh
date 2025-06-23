#!/bin/bash

# War Tracker 2.0 Startup Script
echo "🚀 Starting War Tracker 2.0..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "client" ]; then
    echo "❌ Please run this script from the War Tracker 2.0 root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Kill existing processes on ports 8000 and 5173
echo "🧹 Cleaning up existing processes..."
if check_port 8000; then
    echo "Killing process on port 8000..."
    kill -9 $(lsof -ti:8000) 2>/dev/null
fi

if check_port 5173; then
    echo "Killing process on port 5173..."
    kill -9 $(lsof -ti:5173) 2>/dev/null
fi

# Start backend
echo "📡 Starting backend server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Start frontend
echo "🎨 Starting frontend client..."
cd client
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    npm install rss-parser @types/rss-parser
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ War Tracker 2.0 is starting up!"
echo "📡 Backend: http://localhost:8000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down War Tracker 2.0..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait

echo "🎯 Starting War Tracker 2.0 - Backend & Frontend"
echo "================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and run again."
    exit 1
fi

# Load environment variables
source .env

echo "✅ Environment loaded"
echo "📍 Supabase URL: ${VITE_SUPABASE_URL}"
echo "🤖 OpenRouter API: ${OPENROUTER_API_KEY:+Configured}"

# Check if client dependencies are installed
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Check if root dependencies are installed  
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting services..."
echo "Frontend: http://localhost:5173"
echo "Supabase Functions: http://localhost:54321"
echo ""

# Start both frontend and Supabase functions concurrently
npx concurrently \
  --names "CLIENT,FUNCTIONS" \
  --prefix-colors "cyan,yellow" \
  "cd client && npm run dev" \
  "npx supabase functions serve"