#!/bin/bash

# Fuel Analytics Website - Auto-Sync Setup
# This script sets up automatic syncing to GitHub

echo "🚀 Setting up Auto-Sync for Fuel Analytics Website..."

# Check if we're in the right directory
if [ ! -f "dashboard.html" ]; then
    echo "❌ Please run this script from the fuel-analytics-website directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Please run: git init"
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/Moagi-TH/Fuel-Flux-Analytics.git"
    exit 1
fi

echo "✅ Git configuration looks good"

# Make scripts executable
chmod +x sync-to-github.sh
chmod +x .git/hooks/post-commit

echo "✅ Scripts made executable"

# Create a simple file watcher using inotifywait (Linux) or fswatch (macOS)
if command -v fswatch > /dev/null 2>&1; then
    echo "📱 macOS detected - setting up fswatch watcher..."
    
    # Create fswatch script
    cat > watch-and-sync.sh << 'EOF'
#!/bin/bash
# Watch for file changes and sync to GitHub

echo "👀 Watching for file changes..."

fswatch -o . | while read f; do
    echo "📝 File change detected, syncing to GitHub..."
    ./sync-to-github.sh
done
EOF
    
    chmod +x watch-and-sync.sh
    echo "✅ fswatch watcher created: ./watch-and-sync.sh"
    
elif command -v inotifywait > /dev/null 2>&1; then
    echo "🐧 Linux detected - setting up inotifywait watcher..."
    
    # Create inotifywait script
    cat > watch-and-sync.sh << 'EOF'
#!/bin/bash
# Watch for file changes and sync to GitHub

echo "👀 Watching for file changes..."

inotifywait -m -r -e modify,create,delete,move . | while read path action file; do
    echo "📝 File change detected ($action): $file"
    sleep 2  # Wait for file to be fully written
    ./sync-to-github.sh
done
EOF
    
    chmod +x watch-and-sync.sh
    echo "✅ inotifywait watcher created: ./watch-and-sync.sh"
    
else
    echo "⚠️ No file watcher available. You can manually sync using:"
    echo "   ./sync-to-github.sh"
fi

# Set up cron job for periodic sync (every 5 minutes)
echo ""
echo "🕐 Setting up cron job for periodic sync (every 5 minutes)..."

# Get current directory
CURRENT_DIR=$(pwd)

# Create cron job entry
CRON_JOB="*/5 * * * * cd $CURRENT_DIR && ./sync-to-github.sh > /dev/null 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "sync-to-github.sh"; then
    echo "✅ Cron job already exists"
else
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added"
fi

echo ""
echo "🎉 Auto-Sync setup complete!"
echo ""
echo "📋 Available commands:"
echo "   ./sync-to-github.sh          # Manual sync once"
echo "   ./watch-and-sync.sh          # Watch for changes (if available)"
echo "   crontab -l                   # View cron jobs"
echo "   crontab -r                   # Remove all cron jobs"
echo ""
echo "🔄 Changes will be automatically synced to GitHub:"
echo "   - Every 5 minutes via cron job"
echo "   - After every manual commit (via git hook)"
echo "   - When using watch-and-sync.sh (if available)"
echo ""
echo "💡 To test: Make a change to any file and wait 5 minutes,"
echo "   or run: ./sync-to-github.sh"
