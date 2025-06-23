#!/bin/bash

echo "🎯 War Tracker 2.0 - Clean Startup"
echo "=================================="

# Kill any existing processes on common ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true  
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:54321 | xargs kill -9 2>/dev/null || true

cd "/Users/RoRo_HQ/War Tracker 2.0"

# Check which backend to use
BACKEND_DIR=""
if [ -d "server" ] && [ -f "server/package.json" ]; then
    BACKEND_DIR="server"
    BACKEND_PORT="3001"
elif [ -d "backend" ] && [ -f "backend/package.json" ]; then
    BACKEND_DIR="backend"
    BACKEND_PORT="3001"
else
    echo "❌ No backend directory found"
    exit 1
fi

echo "✅ Using backend: $BACKEND_DIR"

# Install dependencies if needed
echo "📦 Checking dependencies..."

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd "$BACKEND_DIR" && npm install && cd ..
fi

# Create backend .env if needed
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "📝 Creating backend .env..."
    cat > "$BACKEND_DIR/.env" << EOF
NODE_ENV=development
PORT=$BACKEND_PORT
OPENROUTER_API_KEY=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
MONGODB_URI=mongodb://localhost:27017/war-tracker-dev
EOF
fi

echo ""
echo "🚀 Starting War Tracker 2.0..."
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:5173"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend..."
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Test backend
echo "🧪 Testing backend..."
curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null && echo "✅ Backend is running" || echo "⚠️ Backend may still be starting"

# Start frontend
echo "🎨 Starting frontend..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ War Tracker 2.0 is running!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend Health: http://localhost:$BACKEND_PORT/api/health"
echo "📊 Test News Sync: curl -X POST http://localhost:$BACKEND_PORT/api/jobs/news"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait