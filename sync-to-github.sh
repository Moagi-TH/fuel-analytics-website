#!/bin/bash

# Fuel Analytics Website - Sync to GitHub
# Simple script to commit and push changes to GitHub

echo "🔄 Syncing changes to GitHub..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Please initialize git first."
    exit 1
fi

# Check if we have changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit"
    exit 0
fi

# Get list of changed files
CHANGED_FILES=$(git status --porcelain | wc -l | tr -d ' ')
echo "📝 Found $CHANGED_FILES changed file(s)"

# Add all changes
echo "📦 Staging changes..."
git add .

# Create commit message with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-sync: $CHANGED_FILES file(s) updated at $TIMESTAMP"

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully synced to GitHub!"
    echo "📊 Commit: $COMMIT_MSG"
else
    echo "❌ Failed to push to GitHub"
    echo "💡 Try running: git push origin main"
    exit 1
fi
