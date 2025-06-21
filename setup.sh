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

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit the .env file with your API keys:"
echo "   - OPENROUTER_API_KEY (required for AI analysis)"
echo "   - NEWS_API_KEY (optional, for additional news sources)"
echo ""
echo "2. Choose your setup method:"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   🐳 Docker (Recommended):"
    echo "   npm run docker:run"
    echo ""
fi

echo "   💻 Local Development:"
echo "   npm run dev"
echo ""
echo "   🚀 Production:"
echo "   npm start"
echo ""
echo "3. Access the application:"
echo "   http://localhost:5000 (Production)"
echo "   http://localhost:3000 (Development client)"
echo "   http://localhost:5000 (Development server)"
echo ""
echo "4. Default login credentials:"
echo "   Username: admin"
echo "   Password: password"
echo ""
echo "🛡️  Remember to change default credentials in production!"
echo ""
echo "📚 For more information, see README.md"