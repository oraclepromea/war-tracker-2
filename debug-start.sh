#!/bin/bash

echo "🔧 War Tracker 2.0 Debug Startup"
echo "================================="

# Check current directory
echo "📁 Current directory: $(pwd)"

# Check if we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found. Please run this from the War Tracker 2.0 root directory"
    exit 1
fi

# Check Node.js version
echo "🟢 Node.js version: $(node --version)"
echo "🟢 NPM version: $(npm --version)"

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
if [ -d "client/node_modules" ]; then
    echo "✅ Client dependencies installed"
else
    echo "❌ Client dependencies missing"
    echo "🔧 Installing client dependencies..."
    cd client && npm install
    cd ..
fi

if [ -d "server/node_modules" ]; then
    echo "✅ Server dependencies installed"
else
    echo "❌ Server dependencies missing"
    echo "🔧 Installing server dependencies..."
    cd server && npm install
    cd ..
fi

echo ""
echo "🚀 Starting servers with detailed logging..."
echo ""

# Start server first
echo "🖥️  Starting server on port 5000..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 5

# Start client
echo "📱 Starting client on port 5173..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "🎯 Servers should be running:"
echo "   • Server: http://localhost:5000"
echo "   • Client: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait