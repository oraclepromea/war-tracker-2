#!/bin/bash

echo "🔧 Diagnosing War Tracker 2.0 Client Issue..."
echo "============================================="

cd "/Users/RoRo_HQ/War Tracker 2.0"

# Check if client directory exists and has proper structure
if [ ! -d "client" ]; then
    echo "❌ Client directory not found!"
    exit 1
fi

cd client

echo "📁 Checking client directory structure..."
if [ ! -f "package.json" ]; then
    echo "❌ client/package.json missing"
else
    echo "✅ package.json found"
fi

if [ ! -f "index.html" ]; then
    echo "❌ index.html missing"
else
    echo "✅ index.html found"
fi

if [ ! -f "src/main.tsx" ]; then
    echo "❌ src/main.tsx missing"
else
    echo "✅ main.tsx found"
fi

if [ ! -f "vite.config.ts" ]; then
    echo "❌ vite.config.ts missing"
else
    echo "✅ vite.config.ts found"
fi

# Kill any existing processes on port 5173
echo ""
echo "🔧 Killing any existing processes on port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "No processes found on port 5173"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing client dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting Vite dev server..."
echo "This will show detailed output to help diagnose issues..."
echo ""

npm run dev