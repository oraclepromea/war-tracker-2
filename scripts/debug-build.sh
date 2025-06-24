#!/bin/bash
echo "🔍 Debugging build issues..."

echo "📦 Checking server dependencies..."
cd server
npm list --depth=0

echo "🔨 Testing server TypeScript compilation..."
npx tsc --noEmit --listFiles

echo "📊 Checking for TypeScript errors..."
npx tsc --noEmit 2>&1 | head -20

cd ../client
echo "📦 Checking client dependencies..."
npm list --depth=0

echo "🔨 Testing client build..."
npm run build 2>&1 | head -20

cd ..
