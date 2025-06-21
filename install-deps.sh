#!/bin/bash

echo "🔧 Installing Missing Dependencies"
echo "================================="

# Install client dependencies
echo "Installing React Query for client..."
cd "/Users/RoRo_HQ/War Tracker 2.0/client"
npm install @tanstack/react-query

# Install server dependencies
echo "Installing TypeORM and PostgreSQL for server..."
cd "/Users/RoRo_HQ/War Tracker 2.0/server"
npm install typeorm pg @types/pg reflect-metadata

echo "✅ All dependencies installed!"
echo ""
echo "🚀 Ready to start development:"
echo "cd '/Users/RoRo_HQ/War Tracker 2.0'"
echo "npm run dev"