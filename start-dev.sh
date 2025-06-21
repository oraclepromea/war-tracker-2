#!/bin/bash

echo "🚀 Starting War Tracker 2.0 Development Environment..."

# Check if MongoDB is running
check_mongo() {
    if command -v mongod >/dev/null 2>&1; then
        if pgrep -x "mongod" > /dev/null; then
            echo "✅ MongoDB is running"
            return 0
        else
            echo "⚠️  MongoDB is installed but not running"
            echo "💡 Try starting MongoDB with: brew services start mongodb-community"
            echo "📱 The app will run in demo mode without database"
            return 1
        fi
    else
        echo "⚠️  MongoDB not found"
        echo "💡 Install MongoDB with: brew install mongodb-community"
        echo "📱 The app will run in demo mode without database"
        return 1
    fi
}

# Check if dependencies are installed
if [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies first..."
    ./install-deps.sh
fi

echo ""
echo "🔍 Checking system dependencies..."
check_mongo

echo ""
echo "🔥 Starting development servers..."
echo "📱 React client will start on http://localhost:5173"
echo "🖥️  Express server will start on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Use trap to handle cleanup
trap 'echo ""; echo "🛑 Stopping servers..."; kill 0' EXIT

# Start server in background
cd server && npm run dev &
SERVER_PID=$!

# Give server time to start
sleep 3

# Go back to root and start client
cd ../client && npm run dev &
CLIENT_PID=$!

# Wait for both processes
wait