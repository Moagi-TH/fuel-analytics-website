#!/bin/bash

# Fuel Analytics Website - Start with Auto-Sync
# This script starts both the website server and auto-sync

echo "🚀 Starting Fuel Analytics Website with Auto-Sync..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    kill $SERVER_PID $SYNC_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start auto-sync in background
echo "🔄 Starting auto-sync..."
node auto-sync.js &
SYNC_PID=$!

# Wait a moment for auto-sync to initialize
sleep 2

# Start the website server
echo "🌐 Starting website server..."
python3 -m http.server 8000 &
SERVER_PID=$!

echo "✅ Both services started successfully!"
echo ""
echo "📊 Website: http://localhost:8000"
echo "🔄 Auto-sync: Active (checking every 30 seconds)"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for either process to exit
wait $SERVER_PID $SYNC_PID

# Cleanup
cleanup
