#!/bin/bash

echo "Installing War Tracker 2.0 Dependencies..."

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd ../server
npm install

echo "All dependencies installed successfully!"
echo ""
echo "To start the development servers:"
echo "1. Client: cd client && npm run dev"
echo "2. Server: cd server && npm run dev"