#!/bin/bash

# War Tracker 2.0 Setup Script
# This script sets up the development environment

set -e

echo "🎯 War Tracker 2.0 - Setup Script"
echo "=================================="

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI found: $(supabase --version)"
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before running the app"
else
    echo "✅ .env file already exists"
fi

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Supabase and OpenRouter API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5173 to see the app"
echo ""
echo "For production deployment:"
echo "- Run 'npm run deploy:functions' to deploy Supabase functions"
echo "- Run 'npm run build' to build for production"