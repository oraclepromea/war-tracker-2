#!/bin/bash

# War Tracker 2.0 Setup Script
# This script sets up the development environment

set -e

echo "🎯 War Tracker 2.0 Setup Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not found. Docker setup will be skipped."
    DOCKER_AVAILABLE=false
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Build the applications
echo "🔨 Building applications..."
npm run build

# Test database connection (if PostgreSQL is available)
echo ""
echo "🗄️  Testing database connection..."

if command -v psql &> /dev/null; then
    # Try to connect to default database
    if psql -h localhost -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL connection successful"
        
        # Try to create war tracker database
        echo "Creating war_tracker_db database..."
        psql -h localhost -U postgres -c "CREATE DATABASE war_tracker_db;" 2>/dev/null
        psql -h localhost -U postgres -c "CREATE USER war_tracker WITH PASSWORD 'your_password';" 2>/dev/null
        psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE war_tracker_db TO war_tracker;" 2>/dev/null
        
        echo "✅ Database setup complete"
    else
        echo "⚠️  PostgreSQL connection failed. Server may not be running."
        echo "   Start with: brew services start postgresql"
    fi
else
    echo "⚠️  PostgreSQL not available. Server will run in demo mode."
fi

# Test Redis connection
echo ""
echo "🔄 Testing Redis connection..."

if command -v redis-cli &> /dev/null; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis connection successful"
    else
        echo "⚠️  Redis connection failed. Server may not be running."
        echo "   Start with: brew services start redis"
    fi
else
    echo "⚠️  Redis not available. Job queues will be disabled."
fi

# Build and test server
echo ""
echo "🏗️  Building and testing server..."

cd server
npm run build 2>/dev/null || echo "⚠️  Server build failed (TypeScript compilation)"

# Test server startup (quick test)
echo "Testing server startup..."
timeout 10s npm run dev >/dev/null 2>&1 &
SERVER_PID=$!

sleep 5

# Test API endpoints
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Server API responding"
    kill $SERVER_PID 2>/dev/null
else
    echo "⚠️  Server API not responding"
    kill $SERVER_PID 2>/dev/null
fi

cd ..

# Summary and next steps
echo ""
echo "📋 Setup Summary:"
echo "=================="

echo "✅ Dependencies installed"
echo "✅ Project structure created"

if command -v psql &> /dev/null && psql -h localhost -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database ready"
else
    echo "⚠️  Database needs setup"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. Configure your .env file with API keys:"
echo "   - Get NewsAPI key from: https://newsapi.org"
echo "   - Update database credentials if needed"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Or start components individually:"
echo "   # Terminal 1 (Server):"
echo "   cd server && npm run dev"
echo ""
echo "   # Terminal 2 (Client):"
echo "   cd client && npm run dev"
echo ""
echo "4. Test the data pipeline:"
echo "   curl -X POST http://localhost:3001/api/jobs/news"
echo ""
echo "5. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001/api"
echo ""

echo "🎯 Quick Test Commands:"
echo "======================="
echo "# Test news aggregation:"
echo "curl -X POST http://localhost:3001/api/jobs/news"
echo ""
echo "# Check events:"
echo "curl http://localhost:3001/api/events/recent"
echo ""
echo "# Check news:"
echo "curl http://localhost:3001/api/news/latest"
echo ""

echo "📚 Documentation:"
echo "=================="
echo "Setup Guide: docs/DATA_PIPELINE_SETUP_GUIDE.md"
echo "API Endpoints: http://localhost:3001/api/health"
echo ""
echo "🎉 Setup complete! Happy tracking! 🎉"