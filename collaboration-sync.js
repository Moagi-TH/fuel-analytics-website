#!/usr/bin/env node

/**
 * Collaboration Sync for Fuel Analytics Website
 * Ensures real-time synchronization between collaborators
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');

class CollaborationSync {
    constructor() {
        this.projectRoot = process.cwd();
        this.gitDir = path.join(this.projectRoot, '.git');
        this.isWatching = false;
        this.lastPullTime = null;
        this.lastPushTime = null;
        this.conflictFiles = new Set();
        this.syncInterval = null;
        this.pullInterval = null;
        
        // Sync intervals (in milliseconds)
        this.config = {
            pushInterval: 30000,    // Push every 30 seconds
            pullInterval: 15000,    // Pull every 15 seconds
            conflictCheckInterval: 60000, // Check conflicts every minute
            maxRetries: 3,
            retryDelay: 5000
        };
        
        // Files that trigger immediate sync
        this.criticalFiles = [
            'dashboard.html',
            'dashboard.css',
            'script.js',
            'supabase-client.js',
            'data-integration.js',
            'visual-analytics.js',
            'advanced-calculations.js'
        ];
    }

    // Initialize collaboration sync
    async init() {
        console.log('🚀 Initializing Collaboration Sync...');
        
        try {
            // Check git repository
            if (!fs.existsSync(this.gitDir)) {
                throw new Error('Not a git repository');
            }

            // Check remote origin
            const hasRemote = await this.checkRemoteOrigin();
            if (!hasRemote) {
                throw new Error('No remote origin found');
            }

            // Ensure dependencies
            await this.ensureDependencies();

            // Initial pull to sync with remote
            await this.pullFromRemote();

            console.log('✅ Collaboration sync initialized');
            return true;
        } catch (error) {
            console.error('❌ Collaboration sync initialization failed:', error.message);
            return false;
        }
    }

    // Check remote origin
    async checkRemoteOrigin() {
        return new Promise((resolve) => {
            exec('git remote get-url origin', (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve(false);
                } else {
                    console.log('🌐 Remote origin:', stdout.trim());
                    resolve(true);
                }
            });
        });
    }

    // Ensure dependencies
    async ensureDependencies() {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            const packageJson = {
                name: 'fuel-analytics-website',
                version: '1.0.0',
                description: 'Fuel Analytics Website with Collaboration Sync',
                scripts: {
                    'start': 'python3 -m http.server 8000',
                    'collab-sync': 'node collaboration-sync.js',
                    'collab-watch': 'node collaboration-sync.js --watch'
                },
                devDependencies: {
                    'chokidar': '^3.5.3'
                }
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }

        if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
            console.log('📦 Installing dependencies...');
            await this.runCommand('npm install');
        }
    }

    // Start collaboration sync
    startCollaborationSync() {
        if (this.isWatching) {
            console.log('⚠️ Collaboration sync already running');
            return;
        }

        console.log('👥 Starting collaboration sync...');
        
        // Start file watcher
        this.startFileWatcher();
        
        // Start periodic sync
        this.startPeriodicSync();
        
        // Start conflict monitoring
        this.startConflictMonitoring();
        
        this.isWatching = true;
        console.log('✅ Collaboration sync active');
    }

    // Start file watcher
    startFileWatcher() {
        const watcher = chokidar.watch([
            '*.html', '*.css', '*.js', '*.md', '*.json', '*.sql',
            'utils/**/*', 'components/**/*', 'src/**/*'
        ], {
            ignored: [
                'node_modules/**', '.git/**', '*.log', '*.tmp',
                '.DS_Store', 'Thumbs.db'
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });

        watcher
            .on('add', (filePath) => this.handleFileChange('added', filePath))
            .on('change', (filePath) => this.handleFileChange('modified', filePath))
            .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
            .on('error', (error) => console.error('❌ Watcher error:', error))
            .on('ready', () => {
                console.log('✅ File watcher ready for collaboration');
            });
    }

    // Handle file changes
    handleFileChange(event, filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const isCritical = this.criticalFiles.some(critical => 
            relativePath.includes(critical)
        );
        
        console.log(`📝 File ${event}: ${relativePath}${isCritical ? ' (CRITICAL)' : ''}`);
        
        // For critical files, trigger immediate sync
        if (isCritical) {
            this.triggerImmediateSync();
        }
    }

    // Start periodic sync
    startPeriodicSync() {
        // Push changes periodically
        this.syncInterval = setInterval(async () => {
            await this.pushToRemote();
        }, this.config.pushInterval);

        // Pull changes periodically
        this.pullInterval = setInterval(async () => {
            await this.pullFromRemote();
        }, this.config.pullInterval);

        console.log(`🔄 Periodic sync: Push every ${this.config.pushInterval/1000}s, Pull every ${this.config.pullInterval/1000}s`);
    }

    // Start conflict monitoring
    startConflictMonitoring() {
        setInterval(async () => {
            await this.checkForConflicts();
        }, this.config.conflictCheckInterval);
    }

    // Trigger immediate sync
    async triggerImmediateSync() {
        console.log('⚡ Triggering immediate sync for critical file change...');
        
        try {
            await this.pushToRemote();
            await this.pullFromRemote();
        } catch (error) {
            console.error('❌ Immediate sync failed:', error.message);
        }
    }

    // Push changes to remote
    async pushToRemote(retryCount = 0) {
        try {
            // Check if there are changes to push
            const status = await this.getGitStatus();
            if (!status.hasChanges) {
                return;
            }

            console.log(`📤 Pushing ${status.files.length} changes to remote...`);
            
            // Add all changes
            await this.runCommand('git add .');
            
            // Create commit message
            const commitMessage = this.generateCollaborationCommitMessage(status);
            
            // Commit changes
            await this.runCommand(`git commit -m "${commitMessage}"`);
            
            // Push to remote
            await this.runCommand('git push origin main');
            
            this.lastPushTime = new Date();
            console.log('✅ Changes pushed to remote successfully');
            
        } catch (error) {
            console.error('❌ Push failed:', error.message);
            
            if (retryCount < this.config.maxRetries) {
                console.log(`🔄 Retrying push (${retryCount + 1}/${this.config.maxRetries})...`);
                setTimeout(() => {
                    this.pushToRemote(retryCount + 1);
                }, this.config.retryDelay);
            }
        }
    }

    // Pull changes from remote
    async pullFromRemote(retryCount = 0) {
        try {
            console.log('📥 Pulling changes from remote...');
            
            // Fetch latest changes
            await this.runCommand('git fetch origin');
            
            // Check if we're behind
            const isBehind = await this.checkIfBehind();
            
            if (isBehind) {
                // Pull changes
                await this.runCommand('git pull origin main');
                this.lastPullTime = new Date();
                console.log('✅ Changes pulled from remote successfully');
                
                // Notify about new changes
                this.notifyNewChanges();
            }
            
        } catch (error) {
            console.error('❌ Pull failed:', error.message);
            
            if (retryCount < this.config.maxRetries) {
                console.log(`🔄 Retrying pull (${retryCount + 1}/${this.config.maxRetries})...`);
                setTimeout(() => {
                    this.pullFromRemote(retryCount + 1);
                }, this.config.retryDelay);
            }
        }
    }

    // Check if local is behind remote
    async checkIfBehind() {
        return new Promise((resolve) => {
            exec('git status --porcelain -b', (error, stdout) => {
                if (error) {
                    resolve(false);
                } else {
                    const lines = stdout.split('\n');
                    const branchLine = lines.find(line => line.startsWith('##'));
                    resolve(branchLine && branchLine.includes('[behind'));
                }
            });
        });
    }

    // Check for merge conflicts
    async checkForConflicts() {
        try {
            const status = await this.getGitStatus();
            const conflictFiles = status.files.filter(file => 
                file.includes('<<<<<<<') || 
                file.includes('=======') || 
                file.includes('>>>>>>>')
            );
            
            if (conflictFiles.length > 0) {
                console.warn('⚠️ Merge conflicts detected:', conflictFiles);
                this.conflictFiles = new Set(conflictFiles);
                this.notifyConflicts(conflictFiles);
            } else {
                this.conflictFiles.clear();
            }
        } catch (error) {
            console.error('❌ Conflict check failed:', error.message);
        }
    }

    // Resolve conflicts automatically
    async resolveConflicts() {
        if (this.conflictFiles.size === 0) {
            return;
        }

        console.log('🔧 Attempting to resolve conflicts...');
        
        try {
            // Abort current merge if any
            await this.runCommand('git merge --abort');
            
            // Reset to clean state
            await this.runCommand('git reset --hard HEAD');
            
            // Pull again
            await this.pullFromRemote();
            
            console.log('✅ Conflicts resolved');
            this.conflictFiles.clear();
            
        } catch (error) {
            console.error('❌ Conflict resolution failed:', error.message);
        }
    }

    // Generate collaboration commit message
    generateCollaborationCommitMessage(status) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const fileCount = status.files.length;
        const user = process.env.USER || process.env.USERNAME || 'collaborator';
        
        let message = `[COLLAB] ${user}: ${fileCount} file(s) updated at ${timestamp}`;
        
        if (fileCount <= 5) {
            const files = status.files.map(f => f.slice(3)).join(', ');
            message += `\n\nFiles: ${files}`;
        }
        
        return message;
    }

    // Get git status
    async getGitStatus() {
        return new Promise((resolve) => {
            exec('git status --porcelain', (error, stdout) => {
                if (error) {
                    resolve({ hasChanges: false, files: [] });
                } else {
                    const files = stdout.trim().split('\n').filter(line => line.length > 0);
                    resolve({ hasChanges: files.length > 0, files });
                }
            });
        });
    }

    // Run git command
    async runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${command}\n${stderr}`));
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    // Notify about new changes
    notifyNewChanges() {
        console.log('📢 New changes detected from collaborators');
        console.log('💡 Consider refreshing your browser to see updates');
        
        // Could integrate with browser notifications here
        if (typeof window !== 'undefined' && window.Notification) {
            new Notification('Fuel Analytics', {
                body: 'New changes from collaborators detected',
                icon: '/icon-192x192.png'
            });
        }
    }

    // Notify about conflicts
    notifyConflicts(conflictFiles) {
        console.log('⚠️ Merge conflicts detected in:', conflictFiles);
        console.log('💡 Run: node collaboration-sync.js --resolve-conflicts');
    }

    // Stop collaboration sync
    stopCollaborationSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.pullInterval) {
            clearInterval(this.pullInterval);
            this.pullInterval = null;
        }
        
        this.isWatching = false;
        console.log('🛑 Collaboration sync stopped');
    }

    // Get sync status
    getStatus() {
        return {
            isWatching: this.isWatching,
            lastPushTime: this.lastPushTime,
            lastPullTime: this.lastPullTime,
            conflictFiles: Array.from(this.conflictFiles),
            config: this.config
        };
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const collabSync = new CollaborationSync();
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Collaboration Sync for Fuel Analytics Website

Usage:
  node collaboration-sync.js [options]

Options:
  --watch, -w              Start collaboration sync (default)
  --resolve-conflicts       Resolve merge conflicts
  --status                  Show sync status
  --stop                    Stop collaboration sync
  --help, -h               Show this help

Examples:
  node collaboration-sync.js --watch           # Start collaboration sync
  node collaboration-sync.js --resolve-conflicts # Resolve conflicts
  node collaboration-sync.js --status          # Show status
        `);
        return;
    }

    // Initialize
    const initialized = await collabSync.init();
    if (!initialized) {
        process.exit(1);
    }

    // Handle commands
    if (args.includes('--resolve-conflicts')) {
        await collabSync.resolveConflicts();
    } else if (args.includes('--status')) {
        const status = collabSync.getStatus();
        console.log('📊 Collaboration Sync Status:', status);
    } else if (args.includes('--stop')) {
        collabSync.stopCollaborationSync();
    } else {
        // Default: start collaboration sync
        collabSync.startCollaborationSync();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down collaboration sync...');
            collabSync.stopCollaborationSync();
            process.exit(0);
        });
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CollaborationSync;
