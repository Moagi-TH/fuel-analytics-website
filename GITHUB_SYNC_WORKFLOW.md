# GitHub Sync Workflow for Fuel Analytics Website

This document explains how to ensure all changes to the fuel analytics website are automatically reflected on GitHub.

## 🚀 Quick Start

### Option 1: Automatic File Watching (Recommended)
```bash
# Start auto-sync (watches for changes and commits every 30 seconds)
node auto-sync.js

# Or with npm script
npm run watch
```

### Option 2: Manual Sync
```bash
# Manual sync once
node auto-sync.js --sync

# Or with npm script
npm run sync
```

### Option 3: Git Hooks (Always Active)
Git hooks are already configured to auto-push after every commit.

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
# Install Node.js dependencies (if not already installed)
npm install

# Or install manually
npm install chokidar
```

### 2. Verify Git Configuration
```bash
# Check if remote origin is set
git remote -v

# Should show something like:
# origin  https://github.com/Moagi-TH/fuel-analytics-website.git (fetch)
# origin  https://github.com/Moagi-TH/fuel-analytics-website.git (push)
```

### 3. Test Auto-Sync
```bash
# Start watching for changes
node auto-sync.js

# Make a test change to any file
echo "# Test" >> test.md

# Wait 30 seconds - changes should be auto-committed and pushed
```

## 🔧 Available Commands

### Auto-Sync Script Commands
```bash
node auto-sync.js --watch    # Start watching for changes (default)
node auto-sync.js --sync     # Manual sync once
node auto-sync.js --status   # Show sync status
node auto-sync.js --stop     # Stop watching
node auto-sync.js --help     # Show help
```

### NPM Scripts
```bash
npm start                    # Start the website server
npm run watch               # Start auto-sync watching
npm run sync                # Manual sync once
```

### Git Commands (with auto-push)
```bash
git add .                    # Stage changes
git commit -m "message"      # Commit changes (auto-pushes to GitHub)
git status                   # Check status
```

## 📁 Files Being Watched

The auto-sync system watches these file types:
- `*.html` - HTML files
- `*.css` - CSS files  
- `*.js` - JavaScript files
- `*.md` - Markdown files
- `*.json` - JSON files
- `*.sql` - SQL files
- `utils/**/*` - Utility files
- `components/**/*` - Component files
- `src/**/*` - Source files

### Ignored Files
- `node_modules/**` - Node.js dependencies
- `.git/**` - Git files
- `*.log` - Log files
- `*.tmp` - Temporary files
- `.DS_Store` - macOS files
- `Thumbs.db` - Windows files

## 🔄 How It Works

### 1. File Watching
- The system uses `chokidar` to watch for file changes
- Changes are detected in real-time
- Multiple changes are batched together

### 2. Auto-Commit Process
- Every 30 seconds, pending changes are processed
- Files are automatically staged with `git add .`
- A commit message is generated with timestamp and file list
- Changes are committed to local repository

### 3. Auto-Push Process
- Git post-commit hook automatically pushes to GitHub
- Uses `git push origin main`
- Provides feedback on success/failure

### 4. Error Handling
- Failed pushes are logged
- System continues watching for new changes
- Manual sync can be used to retry failed pushes

## 📊 Monitoring Sync Status

### Check Current Status
```bash
node auto-sync.js --status
```

Output example:
```json
{
  "isWatching": true,
  "pendingChanges": 2,
  "lastCommitTime": "2025-01-27T10:30:00.000Z",
  "lastChangeTime": "2025-01-27T10:29:45.000Z"
}
```

### View Git Log
```bash
git log --oneline -10
```

### Check Remote Status
```bash
git status
git remote -v
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Not a git repository" Error
```bash
# Initialize git if not already done
git init
git remote add origin https://github.com/Moagi-TH/fuel-analytics-website.git
```

#### 2. "No remote origin found" Error
```bash
# Add remote origin
git remote add origin https://github.com/Moagi-TH/fuel-analytics-website.git
```

#### 3. Push Permission Denied
```bash
# Check your GitHub authentication
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use GitHub CLI or Personal Access Token for authentication
gh auth login
```

#### 4. Dependencies Not Found
```bash
# Install dependencies
npm install

# Or install chokidar manually
npm install chokidar
```

#### 5. Auto-Sync Not Working
```bash
# Check if process is running
ps aux | grep auto-sync

# Restart auto-sync
pkill -f auto-sync
node auto-sync.js
```

### Manual Recovery

If auto-sync fails, you can manually sync:
```bash
# Check what files have changed
git status

# Stage and commit changes
git add .
git commit -m "Manual sync: $(date)"

# Push to GitHub
git push origin main
```

## 🔒 Security Considerations

### Authentication
- Use GitHub CLI (`gh auth login`) for secure authentication
- Or use Personal Access Tokens
- Never commit sensitive data (API keys, passwords)

### File Permissions
- Ensure `.git/hooks/post-commit` is executable
- Check file permissions: `ls -la .git/hooks/`

### Backup Strategy
- All changes are automatically backed up to GitHub
- Consider additional backups for critical data
- Use `.gitignore` to exclude sensitive files

## 📈 Best Practices

### 1. Regular Monitoring
- Check sync status periodically
- Monitor GitHub repository for updates
- Review commit history regularly

### 2. Commit Messages
- Auto-sync generates descriptive commit messages
- Manual commits should be descriptive
- Include context for significant changes

### 3. File Organization
- Keep related files together
- Use consistent naming conventions
- Organize code into logical directories

### 4. Testing Changes
- Test changes locally before committing
- Use the website server (`npm start`) to preview
- Check for errors in browser console

## 🚀 Advanced Configuration

### Custom Watch Patterns
Edit `auto-sync.js` to modify watch patterns:
```javascript
this.watchPatterns = [
    '*.html',
    '*.css',
    '*.js',
    // Add your custom patterns here
];
```

### Sync Interval
Change the sync interval (default: 30 seconds):
```javascript
// In auto-sync.js, line ~150
this.syncInterval = setInterval(() => {
    this.processPendingChanges();
}, 30000); // Change this value (in milliseconds)
```

### Custom Commit Messages
Modify the `generateCommitMessage` function in `auto-sync.js` to customize commit messages.

## 📞 Support

### Getting Help
1. Check this documentation
2. Run `node auto-sync.js --help`
3. Check the console for error messages
4. Verify git configuration

### Reporting Issues
- Note the exact error message
- Include your operating system
- Provide steps to reproduce
- Check if the issue occurs with manual git commands

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

This workflow ensures that all changes to your fuel analytics website are automatically synchronized with GitHub, providing reliable backup and version control.
