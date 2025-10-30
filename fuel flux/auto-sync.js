#!/usr/bin/env node

/**
 * Auto-Sync Script for Fuel Analytics Website
 * Automatically commits and pushes changes to GitHub
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');

class AutoSync {
    constructor() {
        this.projectRoot = process.cwd();
        this.gitDir = path.join(this.projectRoot, '.git');
        this.isWatching = false;
        this.pendingChanges = new Set();
        this.syncInterval = null;
        this.lastCommitTime = null;
        
        // Files to watch (relative to project root)
        this.watchPatterns = [
            '*.html',
            '*.css',
            '*.js',
            '*.md',
            '*.json',
            '*.sql',
            'utils/**/*',
            'components/**/*',
            'src/**/*'
        ];
        
        // Files to ignore
        this.ignorePatterns = [
            'node_modules/**',
            '.git/**',
            '*.log',
            '*.tmp',
            '*.swp',
            '.DS_Store',
            'Thumbs.db'
        ];
    }

    // Initialize the auto-sync system
    async init() {
        console.log('🚀 Initializing Auto-Sync for Fuel Analytics Website...');
        
        try {
            // Check if we're in a git repository
            if (!fs.existsSync(this.gitDir)) {
                throw new Error('Not a git repository. Please initialize git first.');
            }

            // Check if we have a remote origin
            const hasRemote = await this.checkRemoteOrigin();
            if (!hasRemote) {
                throw new Error('No remote origin found. Please add a GitHub remote.');
            }

            // Install chokidar if not available
            await this.ensureDependencies();

            console.log('✅ Auto-Sync initialized successfully');
            console.log('📁 Watching for changes in:', this.projectRoot);
            console.log('🔍 Watch patterns:', this.watchPatterns.join(', '));
            
            return true;
        } catch (error) {
            console.error('❌ Auto-Sync initialization failed:', error.message);
            return false;
        }
    }

    // Check if remote origin exists
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

    // Ensure required dependencies are installed
    async ensureDependencies() {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            console.log('📦 Creating package.json for dependencies...');
            const packageJson = {
                name: 'fuel-analytics-website',
                version: '1.0.0',
                description: 'Fuel Analytics Website with Auto-Sync',
                scripts: {
                    'start': 'python3 -m http.server 8000',
                    'sync': 'node auto-sync.js',
                    'watch': 'node auto-sync.js --watch'
                },
                devDependencies: {
                    'chokidar': '^3.5.3'
                }
            };
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }

        // Check if chokidar is installed
        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('📦 Installing dependencies...');
            await this.runCommand('npm install');
        }
    }

    // Start watching for file changes
    startWatching() {
        if (this.isWatching) {
            console.log('⚠️ Already watching for changes');
            return;
        }

        console.log('👀 Starting file watcher...');
        
        const watcher = chokidar.watch(this.watchPatterns, {
            ignored: this.ignorePatterns,
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
                console.log('✅ File watcher ready');
                this.isWatching = true;
            });

        // Set up periodic sync (every 30 seconds)
        this.syncInterval = setInterval(() => {
            this.processPendingChanges();
        }, 30000);

        console.log('🔄 Auto-sync active - changes will be committed every 30 seconds');
    }

    // Handle file changes
    handleFileChange(event, filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        console.log(`📝 File ${event}: ${relativePath}`);
        
        this.pendingChanges.add(relativePath);
        
        // Update last change time
        this.lastChangeTime = new Date();
    }

    // Process pending changes
    async processPendingChanges() {
        if (this.pendingChanges.size === 0) {
            return;
        }

        console.log(`🔄 Processing ${this.pendingChanges.size} pending changes...`);
        
        try {
            // Check git status
            const status = await this.getGitStatus();
            
            if (status.hasChanges) {
                // Add all changes
                await this.runCommand('git add .');
                
                // Create commit message
                const commitMessage = this.generateCommitMessage(status);
                
                // Commit changes
                await this.runCommand(`git commit -m "${commitMessage}"`);
                
                // Push to remote
                await this.runCommand('git push origin main');
                
                console.log('✅ Changes committed and pushed to GitHub');
                this.lastCommitTime = new Date();
                
                // Clear pending changes
                this.pendingChanges.clear();
            }
        } catch (error) {
            console.error('❌ Error processing changes:', error.message);
        }
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

    // Generate commit message
    generateCommitMessage(status) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const fileCount = status.files.length;
        
        let message = `Auto-sync: ${fileCount} file(s) updated at ${timestamp}`;
        
        // Add file details if not too many
        if (fileCount <= 5) {
            const files = status.files.map(f => f.slice(3)).join(', ');
            message += `\n\nFiles: ${files}`;
        }
        
        return message;
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

    // Stop watching
    stopWatching() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        this.isWatching = false;
        console.log('🛑 Auto-sync stopped');
    }

    // Manual sync
    async manualSync() {
        console.log('🔄 Manual sync triggered...');
        await this.processPendingChanges();
    }

    // Get sync status
    getStatus() {
        return {
            isWatching: this.isWatching,
            pendingChanges: this.pendingChanges.size,
            lastCommitTime: this.lastCommitTime,
            lastChangeTime: this.lastChangeTime
        };
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const autoSync = new AutoSync();
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Auto-Sync for Fuel Analytics Website

Usage:
  node auto-sync.js [options]

Options:
  --watch, -w     Start watching for changes (default)
  --sync, -s      Manual sync once
  --status        Show sync status
  --stop          Stop watching
  --help, -h      Show this help

Examples:
  node auto-sync.js --watch    # Start auto-sync
  node auto-sync.js --sync     # Manual sync
  node auto-sync.js --status   # Show status
        `);
        return;
    }

    // Initialize
    const initialized = await autoSync.init();
    if (!initialized) {
        process.exit(1);
    }

    // Handle commands
    if (args.includes('--sync') || args.includes('-s')) {
        await autoSync.manualSync();
    } else if (args.includes('--status')) {
        const status = autoSync.getStatus();
        console.log('📊 Sync Status:', status);
    } else if (args.includes('--stop')) {
        autoSync.stopWatching();
    } else {
        // Default: start watching
        autoSync.startWatching();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down auto-sync...');
            autoSync.stopWatching();
            process.exit(0);
        });
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AutoSync;
