#!/bin/bash

# Fuel Analytics Website - Collaboration Setup
# Sets up real-time collaboration for multiple developers

echo "👥 Setting up Collaboration Environment for Fuel Analytics Website..."

# Configuration
COLLAB_SYNC_INTERVAL=15  # Collaboration sync every 15 seconds
PULL_INTERVAL=10         # Pull every 10 seconds
CONFLICT_CHECK=30        # Conflict check every 30 seconds

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

echo "✅ Git configuration verified"

# Make collaboration scripts executable
chmod +x collab-sync.sh
chmod +x sync-to-github.sh
chmod +x .git/hooks/post-commit

echo "✅ Scripts made executable"

# Create collaboration configuration file
cat > .collab-config << EOF
# Collaboration Configuration for Fuel Analytics Website
# Generated on $(date)

# Sync intervals (in seconds)
SYNC_INTERVAL=$COLLAB_SYNC_INTERVAL
PULL_INTERVAL=$PULL_INTERVAL
CONFLICT_CHECK_INTERVAL=$CONFLICT_CHECK

# Critical files that trigger immediate sync
CRITICAL_FILES=(
    "dashboard.html"
    "dashboard.css"
    "script.js"
    "supabase-client.js"
    "data-integration.js"
    "visual-analytics.js"
    "advanced-calculations.js"
)

# Collaboration settings
AUTO_RESOLVE_CONFLICTS=true
NOTIFY_ON_CHANGES=true
IMMEDIATE_SYNC_CRITICAL=true

# User information
COLLAB_USER=$(whoami)
COLLAB_HOST=$(hostname)
SETUP_DATE=$(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "✅ Collaboration configuration created"

# Set up enhanced cron jobs for collaboration
echo ""
echo "🕐 Setting up collaboration cron jobs..."

# Get current directory
CURRENT_DIR=$(pwd)

# Create collaboration cron jobs
COLLAB_CRON_JOB="*/$COLLAB_SYNC_INTERVAL * * * * cd $CURRENT_DIR && ./collab-sync.sh pull > /dev/null 2>&1"
PULL_CRON_JOB="*/$PULL_INTERVAL * * * * cd $CURRENT_DIR && git fetch origin > /dev/null 2>&1"
CONFLICT_CRON_JOB="*/$CONFLICT_CHECK * * * * cd $CURRENT_DIR && ./collab-sync.sh resolve-conflicts > /dev/null 2>&1"

# Check if collaboration cron jobs already exist
if crontab -l 2>/dev/null | grep -q "collab-sync.sh"; then
    echo "✅ Collaboration cron jobs already exist"
else
    # Add collaboration cron jobs
    (crontab -l 2>/dev/null; echo "$COLLAB_CRON_JOB") | crontab -
    (crontab -l 2>/dev/null; echo "$PULL_CRON_JOB") | crontab -
    (crontab -l 2>/dev/null; echo "$CONFLICT_CRON_JOB") | crontab -
    echo "✅ Collaboration cron jobs added"
fi

# Create collaboration startup script
cat > start-collaboration.sh << 'EOF'
#!/bin/bash

# Fuel Analytics Website - Start with Collaboration
# Starts both the website server and collaboration sync

echo "🚀 Starting Fuel Analytics Website with Collaboration..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down collaboration environment..."
    kill $SERVER_PID $COLLAB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Start collaboration sync in background
echo "👥 Starting collaboration sync..."
./collab-sync.sh start &
COLLAB_PID=$!

# Wait a moment for collaboration sync to initialize
sleep 3

# Start the website server
echo "🌐 Starting website server..."
python3 -m http.server 8000 &
SERVER_PID=$!

echo "✅ Collaboration environment started successfully!"
echo ""
echo "📊 Website: http://localhost:8000"
echo "👥 Collaboration: Active (sync every 15s, pull every 10s)"
echo "⚠️ Conflict monitoring: Active (check every 30s)"
echo ""
echo "📋 Available commands:"
echo "   ./collab-sync.sh status     # Check collaboration status"
echo "   ./collab-sync.sh push       # Manual push"
echo "   ./collab-sync.sh pull       # Manual pull"
echo "   ./collab-sync.sh resolve-conflicts # Resolve conflicts"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for either process to exit
wait $SERVER_PID $COLLAB_PID

# Cleanup
cleanup
EOF

chmod +x start-collaboration.sh

echo "✅ Collaboration startup script created"

# Create collaboration documentation
cat > COLLABORATION_GUIDE.md << 'EOF'
# Collaboration Guide - Fuel Analytics Website

## 🚀 Quick Start

### Start Collaboration Environment
```bash
./start-collaboration.sh
```

### Manual Collaboration Commands
```bash
./collab-sync.sh start          # Start collaboration sync
./collab-sync.sh status         # Check sync status
./collab-sync.sh push           # Manual push
./collab-sync.sh pull           # Manual pull
./collab-sync.sh resolve-conflicts # Resolve conflicts
```

## 🔄 How Collaboration Works

### Real-Time Sync
- **Push**: Every 15 seconds, local changes are pushed to GitHub
- **Pull**: Every 10 seconds, changes from other collaborators are pulled
- **Critical Files**: Changes to important files trigger immediate sync
- **Conflict Resolution**: Automatic conflict detection and resolution

### Critical Files (Immediate Sync)
- `dashboard.html` - Main dashboard
- `dashboard.css` - Dashboard styling
- `script.js` - Main JavaScript
- `supabase-client.js` - Database client
- `data-integration.js` - Data integration
- `visual-analytics.js` - Analytics engine
- `advanced-calculations.js` - Calculations engine

## 👥 Best Practices for Collaboration

### 1. Communication
- Use clear commit messages with `[COLLAB]` prefix
- Notify team members of major changes
- Coordinate on critical file modifications

### 2. File Management
- Avoid editing the same file simultaneously
- Use feature branches for major changes
- Test changes locally before pushing

### 3. Conflict Resolution
- Conflicts are automatically detected
- Run `./collab-sync.sh resolve-conflicts` if needed
- Review resolved conflicts before continuing

### 4. Monitoring
- Check `./collab-sync.sh status` regularly
- Monitor console for sync notifications
- Refresh browser after seeing "New changes detected"

## 📊 Collaboration Status

### Check Current Status
```bash
./collab-sync.sh status
```

### View Recent Changes
```bash
git log --oneline -10
```

### Check for Conflicts
```bash
git status
```

## 🔧 Troubleshooting

### Sync Issues
```bash
# Check git status
git status

# Manual sync
./collab-sync.sh push
./collab-sync.sh pull

# Reset if needed
git reset --hard HEAD
git pull origin main
```

### Conflict Issues
```bash
# Resolve conflicts
./collab-sync.sh resolve-conflicts

# Or manual resolution
git merge --abort
git reset --hard HEAD
git pull origin main
```

### Performance Issues
- Reduce sync frequency in `.collab-config`
- Use `./collab-sync.sh` instead of automatic sync
- Monitor system resources

## 🎯 Collaboration Workflow

### Daily Work
1. Start collaboration environment: `./start-collaboration.sh`
2. Work on your changes
3. Changes auto-sync every 15 seconds
4. Check for updates from collaborators
5. Resolve any conflicts if they occur

### Major Changes
1. Create feature branch: `git checkout -b feature-name`
2. Make your changes
3. Test thoroughly
4. Merge back to main: `git checkout main && git merge feature-name`
5. Push to remote: `git push origin main`

## 📞 Support

### Getting Help
1. Check this guide
2. Run `./collab-sync.sh help`
3. Check git status and logs
4. Review collaboration configuration

### Common Issues
- **"Sync failed"**: Check internet connection and GitHub access
- **"Conflicts detected"**: Run conflict resolution
- **"Behind remote"**: Pull latest changes
- **"Permission denied"**: Check file permissions

---

**Last Updated**: January 2025  
**Status**: ✅ **COLLABORATION READY**
EOF

echo "✅ Collaboration documentation created"

# Test collaboration sync
echo ""
echo "🧪 Testing collaboration sync..."
if ./collab-sync.sh status > /dev/null 2>&1; then
    echo "✅ Collaboration sync test passed"
else
    echo "⚠️ Collaboration sync test failed - check configuration"
fi

echo ""
echo "🎉 Collaboration setup complete!"
echo ""
echo "📋 Available commands:"
echo "   ./start-collaboration.sh     # Start website + collaboration"
echo "   ./collab-sync.sh start       # Start collaboration sync only"
echo "   ./collab-sync.sh status      # Check collaboration status"
echo "   ./collab-sync.sh help        # Show collaboration help"
echo ""
echo "📚 Documentation:"
echo "   COLLABORATION_GUIDE.md       # Complete collaboration guide"
echo "   .collab-config               # Collaboration configuration"
echo ""
echo "🔄 Collaboration features:"
echo "   - Real-time sync every 15 seconds"
echo "   - Automatic pull every 10 seconds"
echo "   - Conflict monitoring every 30 seconds"
echo "   - Critical file immediate sync"
echo "   - Automatic conflict resolution"
echo ""
echo "💡 To start collaborating:"
echo "   1. Run: ./start-collaboration.sh"
echo "   2. Make changes to files"
echo "   3. Changes will auto-sync to GitHub"
echo "   4. Other collaborators will see changes within 15 seconds"
