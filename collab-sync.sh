#!/bin/bash

# Fuel Analytics Website - Collaboration Sync
# Real-time synchronization for multiple collaborators

echo "👥 Starting Collaboration Sync for Fuel Analytics Website..."

# Configuration
SYNC_INTERVAL=15  # Sync every 15 seconds
PULL_INTERVAL=10  # Pull every 10 seconds
CONFLICT_CHECK_INTERVAL=30  # Check conflicts every 30 seconds
MAX_RETRIES=3
RETRY_DELAY=5

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

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down collaboration sync..."
    kill $SYNC_PID $PULL_PID $CONFLICT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Please initialize git first."
    exit 1
fi

# Check if remote origin is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found. Please add your GitHub repository."
    exit 1
fi

echo "✅ Git configuration verified"

# Function to check if file is critical
is_critical_file() {
    local file="$1"
    for critical in "${CRITICAL_FILES[@]}"; do
        if [[ "$file" == *"$critical"* ]]; then
            return 0
        fi
    done
    return 1
}

# Function to get git status
get_git_status() {
    git status --porcelain 2>/dev/null
}

# Function to check if we're behind remote
is_behind_remote() {
    git fetch origin > /dev/null 2>&1
    git status --porcelain -b | grep -q "\[behind"
}

# Function to check for conflicts
check_conflicts() {
    local status=$(get_git_status)
    if echo "$status" | grep -q "<<<<<<<\|=======\|>>>>>>>"; then
        echo "⚠️ Merge conflicts detected!"
        return 0
    fi
    return 1
}

# Function to resolve conflicts
resolve_conflicts() {
    echo "🔧 Attempting to resolve conflicts..."
    
    # Abort current merge if any
    git merge --abort 2>/dev/null
    
    # Reset to clean state
    git reset --hard HEAD
    
    # Pull again
    git pull origin main
    
    echo "✅ Conflicts resolved"
}

# Function to push changes
push_changes() {
    local status=$(get_git_status)
    if [ -z "$status" ]; then
        return 0
    fi
    
    local file_count=$(echo "$status" | wc -l | tr -d ' ')
    echo "📤 Pushing $file_count changes to remote..."
    
    # Add all changes
    git add .
    
    # Create commit message
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local user=$(whoami)
    local commit_msg="[COLLAB] $user: $file_count file(s) updated at $timestamp"
    
    # Add file details if not too many
    if [ "$file_count" -le 5 ]; then
        local files=$(echo "$status" | cut -c4- | tr '\n' ', ' | sed 's/, $//')
        commit_msg="$commit_msg

Files: $files"
    fi
    
    # Commit and push
    if git commit -m "$commit_msg" && git push origin main; then
        echo "✅ Changes pushed successfully"
        return 0
    else
        echo "❌ Push failed"
        return 1
    fi
}

# Function to pull changes
pull_changes() {
    if is_behind_remote; then
        echo "📥 Pulling changes from remote..."
        
        if git pull origin main; then
            echo "✅ Changes pulled successfully"
            
            # Notify about new changes
            echo "📢 New changes detected from collaborators"
            echo "💡 Consider refreshing your browser to see updates"
            
            return 0
        else
            echo "❌ Pull failed"
            return 1
        fi
    fi
    return 0
}

# Function to monitor file changes
monitor_files() {
    echo "👀 Monitoring for file changes..."
    
    # Use fswatch if available (macOS)
    if command -v fswatch > /dev/null 2>&1; then
        fswatch -o . | while read f; do
            local changed_files=$(git diff --name-only HEAD~1 2>/dev/null || git status --porcelain | cut -c4-)
            
            for file in $changed_files; do
                if is_critical_file "$file"; then
                    echo "⚡ Critical file changed: $file - triggering immediate sync"
                    push_changes
                    break
                fi
            done
        done
    else
        # Fallback: check periodically
        while true; do
            sleep 5
            local status=$(get_git_status)
            if [ -n "$status" ]; then
                echo "📝 File changes detected"
                push_changes
            fi
        done
    fi
}

# Function to periodic sync
periodic_sync() {
    echo "🔄 Starting periodic sync (every ${SYNC_INTERVAL}s)..."
    
    while true; do
        sleep $SYNC_INTERVAL
        
        # Push changes
        push_changes
        
        # Pull changes
        pull_changes
    done
}

# Function to periodic pull
periodic_pull() {
    echo "📥 Starting periodic pull (every ${PULL_INTERVAL}s)..."
    
    while true; do
        sleep $PULL_INTERVAL
        pull_changes
    done
}

# Function to conflict monitoring
conflict_monitoring() {
    echo "⚠️ Starting conflict monitoring (every ${CONFLICT_CHECK_INTERVAL}s)..."
    
    while true; do
        sleep $CONFLICT_CHECK_INTERVAL
        
        if check_conflicts; then
            echo "🔧 Resolving conflicts automatically..."
            resolve_conflicts
        fi
    done
}

# Main collaboration sync function
start_collaboration_sync() {
    echo "🚀 Starting collaboration sync..."
    
    # Start file monitoring in background
    monitor_files &
    MONITOR_PID=$!
    
    # Start periodic sync in background
    periodic_sync &
    SYNC_PID=$!
    
    # Start periodic pull in background
    periodic_pull &
    PULL_PID=$!
    
    # Start conflict monitoring in background
    conflict_monitoring &
    CONFLICT_PID=$!
    
    echo "✅ Collaboration sync active"
    echo "📊 Sync intervals: Push=${SYNC_INTERVAL}s, Pull=${PULL_INTERVAL}s, Conflict check=${CONFLICT_CHECK_INTERVAL}s"
    echo ""
    echo "Press Ctrl+C to stop"
    
    # Wait for any background process to exit
    wait $MONITOR_PID $SYNC_PID $PULL_PID $CONFLICT_PID
}

# Handle command line arguments
case "${1:-start}" in
    "start"|"watch")
        start_collaboration_sync
        ;;
    "push")
        echo "📤 Manual push..."
        push_changes
        ;;
    "pull")
        echo "📥 Manual pull..."
        pull_changes
        ;;
    "resolve-conflicts")
        echo "🔧 Resolving conflicts..."
        resolve_conflicts
        ;;
    "status")
        echo "📊 Collaboration Sync Status:"
        echo "  Git status:"
        git status --short
        echo ""
        echo "  Remote status:"
        git status --porcelain -b
        echo ""
        echo "  Last commit:"
        git log -1 --oneline
        ;;
    "help"|"--help"|"-h")
        echo "Fuel Analytics Website - Collaboration Sync"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start, watch     Start collaboration sync (default)"
        echo "  push            Manual push to remote"
        echo "  pull            Manual pull from remote"
        echo "  resolve-conflicts Resolve merge conflicts"
        echo "  status          Show sync status"
        echo "  help            Show this help"
        echo ""
        echo "Features:"
        echo "  - Real-time file monitoring"
        echo "  - Automatic conflict resolution"
        echo "  - Critical file immediate sync"
        echo "  - Periodic push/pull"
        echo "  - Collaboration notifications"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
