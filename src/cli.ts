#!/usr/bin/env node

import { Command } from 'commander';
import { AutoInstaller } from './installer/auto-installer.js';
import { WorkerService } from './worker/index.js';
import { MemoryDatabase } from './database/index.js';
import { MCPServer } from './mcp/server.js';
import { SessionInitializer } from './brain/initializer.js';
import { AgentBrainSystem } from './brain/index.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { execSync, exec } from 'child_process';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

const CONFIG_PATH = join(homedir(), '.agent-memory', 'config.json');
const DB_PATH = join(homedir(), '.agent-memory', 'data', 'memory.db');

function getConfig() {
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  }
  return {
    port: 37800,
    database: DB_PATH,
    cloudSync: { enabled: false },
    summarization: { enabled: true, compressionLevel: 'medium' },
    learning: { enabled: true }
  };
}

function askConfirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${prompt} (yes/no): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VERSION_COMMANDS = ['version', '--version', '-v'];

program
  .name('agent-memory')
  .description('Universal AI IDE Memory System - Auto-detect and install for all your IDEs')
  .version(packageJson.version);

program
  .command('install')
  .description('Install Agent-Memory into supported AI IDEs')
  .option('-a, --all', 'Install for ALL supported IDEs (even if not detected)', false)
  .option('-i, --ide <ide>', 'Install for specific IDE only')
  .option('-d, --dry-run', 'Show what would be changed without making changes', false)
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (options) => {
    const installer = new AutoInstaller();

    if (options.ide) {
      if (options.dryRun) {
        console.log(`\n🔍 Dry-run: checking what would change for ${options.ide}...\n`);
        const result = installer.dryRunInstall(options.ide as any);
        if (result.wouldModify) {
          console.log('  Would modify:');
          for (const f of result.files) {
            console.log(`    - ${f}`);
          }
          console.log('\n  No files were changed (dry-run mode)\n');
        } else {
          console.log('  No files would be modified\n');
        }
        return;
      }

      console.log(`\n📦 Installing for ${options.ide} only...\n`);
      await installer.installForIDE(options.ide as any);
      console.log(`\n✅ Installed for ${options.ide}\n`);
      return;
    }

    console.log('\n🔍 Detecting installed IDEs...\n');
    const detected = installer.detectAllIDEs();
    installer.printDetectionResults(detected);

    const toInstall = options.all
      ? detected
      : detected.filter(d => d.installed);

    if (toInstall.length === 0) {
      console.log('\n⚠️  No IDEs detected. Use --all to install for all supported IDEs.\n');
      return;
    }

    if (options.dryRun) {
      console.log('\n🔍 Dry-run: showing preview of changes:\n');
      for (const { ide, name } of toInstall) {
        const result = installer.dryRunInstall(ide);
        if (result.wouldModify) {
          console.log(`  📦 ${name}:`);
          for (const f of result.files) {
            console.log(`    - ${f}`);
          }
        }
      }
      console.log('\n  No files were changed (dry-run mode)\n');
      return;
    }

    // Show preview of backup paths
    console.log('\n📋 Install Preview:\n');
    for (const { ide, name } of toInstall) {
      const result = installer.dryRunInstall(ide);
      if (result.files.length > 0) {
        console.log(`  ${name} will modify:`);
        for (const f of result.files) {
          console.log(`    - ${f}`);
        }
      }
    }

    console.log('\n  Backups will be created before modifying any config file');
    console.log('  Backups stored at: ~/.agent-memory/backups/\n');

    // Confirm unless --yes
    if (!options.yes) {
      const confirmed = await askConfirm('Continue with installation?');
      if (!confirmed) {
        console.log('\n  Installation cancelled.\n');
        return;
      }
    }

    if (options.all) {
      await installer.installAll(false);
    } else {
      await installer.installAll(true);
    }
  });

program
  .command('detect')
  .description('Detect all installed IDEs on this system')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    const installer = new AutoInstaller();
    const detected = installer.detectAllIDEs();

    if (options.json) {
      console.log(JSON.stringify(detected, null, 2));
      return;
    }

    installer.printDetectionResults(detected);

    console.log('\n💡 To install, run: npx agent-memory install');
    console.log('💡 To install for ALL IDEs, run: npx agent-memory install --all\n');
  });

program
  .command('doctor')
  .description('Diagnose setup issues')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    const installer = new AutoInstaller();
    const result = installer.doctorCheck();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('\n🔍 Agent-Memory Doctor\n');

    // Node version
    console.log(`  Node version: ${result.nodeVersion}`);

    // Package version
    console.log(`  Package version: ${result.packageVersion}`);

    // Database
    if (result.database.exists) {
      console.log(`  Database: ${formatBytes(result.database.size)}`);
    } else {
      console.log('  Database: NOT FOUND');
      console.log('    Checked: ' + result.database.path);
    }

    // Config
    if (result.config.exists && result.config.valid) {
      console.log('  Config: valid');
    } else if (result.config.exists && !result.config.valid) {
      console.log(`  Config: INVALID`);
      console.log(`    ${result.config.error}`);
    } else {
      console.log('  Config: NOT FOUND');
    }

    // Worker
    if (result.worker.running) {
      console.log(`  Worker: running (port ${result.worker.port})`);
    } else {
      console.log('  Worker: not running');
      console.log('    Run: npx agent-memory start');
    }

    // IDEs
    console.log('\n  IDEs:');
    for (const ide of result.ides) {
      if (ide.installed && !ide.issue) {
        console.log(`    ✅ ${ide.name}`);
      } else if (ide.installed && ide.issue) {
        console.log(`    ⚠️  ${ide.name}: ${ide.issue}`);
      } else {
        console.log(`    - ${ide.name}: ${ide.issue || 'not detected'}`);
      }
    }

    // Backups
    if (result.backups.length > 0) {
      console.log(`\n  Backups: ${result.backups.length} available`);
    } else {
      console.log('\n  Backups: none');
    }

    // Issues
    if (result.issues.length > 0) {
      console.log('\n  ⚠️  Issues Found:\n');
      for (const issue of result.issues) {
        console.log(`    - ${issue}`);
      }
      console.log('\n  Run: npx agent-memory repair to fix common issues\n');
    } else {
      console.log('\n  ✅ No issues found\n');
    }
  });

program
  .command('repair')
  .description('Repair broken configuration')
  .option('-i, --ide <ide>', 'Repair specific IDE only')
  .action(async (options) => {
    const installer = new AutoInstaller();
    const detected = installer.detectAllIDEs();

    const toRepair = options.ide
      ? detected.filter(d => d.ide === options.ide)
      : detected.filter(d => d.installed);

    if (toRepair.length === 0) {
      console.log('\n⚠️  No IDEs to repair\n');
      return;
    }

    console.log('\n🔧 Repairing configuration...\n');

    for (const { ide, name } of toRepair) {
      console.log(`  ${name}...`);
      const result = installer.repairIDE(ide);
      if (result.fixed) {
        for (const action of result.actions) {
          console.log(`    ✅ ${action}`);
        }
      } else {
        console.log('    ✅ No issues found');
      }
    }

    console.log('\n✅ Repair complete\n');
  });

program
  .command('start')
  .description('Start the memory worker service')
  .option('-p, --port <port>', 'Port to run on', '37800')
  .option('--safe', 'Run in safe mode (disable auto-store)', false)
  .action(async (options) => {
    const config = getConfig();
    config.port = parseInt(options.port) || config.port;

    if (options.safe) {
      config.safeMode = true;
      console.log('\n  Running in safe mode — auto-store disabled');
    }

    const db = new MemoryDatabase(config.database);
    const worker = new WorkerService(db, config);

    console.log(`\n🚀 Agent-Memory Worker started`);
    console.log(`   Dashboard: http://127.0.0.1:${config.port}`);
    console.log(`   Database: ${config.database}\n`);

    worker.start();
  });

program
  .command('mcp')
  .description('Start the MCP server (for IDE integration)')
  .action(async () => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const server = new MCPServer(db);
    await server.start();
  });

program
  .command('web')
  .description('Open the web viewer in browser')
  .action(async () => {
    const config = getConfig();
    const url = `http://localhost:${config.port}`;
    console.log(`\n🌐 Opening ${url}\n`);
    
    const { default: open } = await import('open');
    await open(url);
  });

program
  .command('status')
  .description('Show current status of worker and database')
  .action(async () => {
    const config = getConfig();
    const dbPath = config.database || DB_PATH;
    const dbExists = existsSync(dbPath);

    console.log('\n📊 Agent-Memory Status\n');
    console.log(`  Worker port: ${config.port || 37800}`);
    console.log(`  Database: ${dbExists ? 'OK' : 'NOT FOUND'}`);
    console.log(`  Config: ${existsSync(CONFIG_PATH) ? 'OK' : 'NOT FOUND'}`);
    console.log(`  Version: ${packageJson.version}\n`);
  });

program
  .command('stop')
  .description('Stop the memory worker service')
  .action(async () => {
    const config = getConfig();
    const port = config.port || 37800;
    console.log(`\n🛑 Stopping worker on port ${port}...\n`);

    try {
      if (process.platform === 'win32') {
        execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
        execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`, { stdio: 'pipe' });
      } else {
        const pid = execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        if (pid) {
          execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
        }
      }
      console.log('  ✅ Worker stopped\n');
    } catch {
      console.log('  ⚠️  No running worker found on that port\n');
    }
  });

program
  .command('list')
  .description('List all memories')
  .option('-l, --limit <limit>', 'Limit results', '20')
  .option('-o, --offset <offset>', 'Offset for pagination', '0')
  .action(async (options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const observations = db.listObservations(parseInt(options.limit), parseInt(options.offset));

    if (observations.length === 0) {
      console.log('\n⚠️  No memories found\n');
      return;
    }

    console.log(`\n📚 ${observations.length} memories:\n`);
    const icons: Record<string, string> = {
      bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡', pattern: '🟠', question: '❓', note: '📝'
    };
    for (const obs of observations) {
      const icon = icons[obs.type] || '⚪';
      console.log(`  ${icon} #${obs.id} | ${obs.title}`);
      console.log(`     ${obs.type.padEnd(10)} ${obs.createdAt.toISOString().slice(0, 10)}`);
      console.log('');
    }
  });

program
  .command('delete <id>')
  .description('Delete a memory by ID')
  .option('-y, --yes', 'Skip confirmation', false)
  .action(async (id, options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);

    const obs = db.getObservation(parseInt(id));
    if (!obs) {
      console.log(`\n⚠️  Memory #${id} not found\n`);
      return;
    }

    if (!options.yes) {
      console.log(`\n⚠️  About to delete memory #${id}: "${obs.title}"\n`);
      const confirmed = await askConfirm('Are you sure?');
      if (!confirmed) {
        console.log('  Deletion cancelled.\n');
        return;
      }
    }

    const deleted = db.deleteObservation(parseInt(id));
    if (deleted) {
      console.log(`\n✅ Deleted memory #${id}\n`);
    } else {
      console.log(`\n⚠️  Failed to delete memory #${id}\n`);
    }
  });

program
  .command('search <query>')
  .description('Search memory')
  .option('-t, --type <type>', 'Filter by type')
  .option('-l, --limit <limit>', 'Limit results', '10')
  .action(async (query, options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);

    const results = db.searchObservations(query, {
      type: options.type,
      limit: parseInt(options.limit)
    });

    if (results.length === 0) {
      console.log('\n⚠️  No results found\n');
      return;
    }

    console.log(`\n📚 Found ${results.length} observations:\n`);
    for (const obs of results) {
      const icons: Record<string, string> = {
        bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡'
      };
      const icon = icons[obs.type] || '⚪';
      console.log(`  ${icon} #${obs.id} | ${obs.title}`);
      console.log(`     ${obs.content.slice(0, 80)}...`);
      console.log('');
    }
  });

program
  .command('store <type> <title> [content]')
  .description('Store a new observation')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (type, title, content, options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);

    const id = db.storeObservation({
      type: type as any,
      title,
      content: content || '',
      tags: options.tags?.split(',') || [],
      metadata: {},
      filesRead: [],
      filesModified: []
    });

    console.log(`\n✅ Stored observation #${id}: ${title}\n`);
  });

program
  .command('stats')
  .description('Show memory statistics')
  .action(async () => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const stats = db.getStats();

    console.log('\n📊 Memory Statistics\n');
    console.log('─'.repeat(30));
    console.log(`  Observations: ${stats.totalObservations}`);
    console.log(`  Sessions:     ${stats.totalSessions}`);
    console.log(`  Projects:     ${stats.totalProjects}`);
    console.log('─'.repeat(30));
    console.log('\n📈 Observation Types:\n');

    const icons: Record<string, string> = {
      bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡', pattern: '🟠', note: '📝'
    };

    for (const [type, count] of Object.entries(stats.typeBreakdown)) {
      const icon = icons[type] || '⚪';
      console.log(`  ${icon} ${type.padEnd(12)} ${count}`);
    }
    console.log('');
  });

program
  .command('export [format]')
  .description('Export memory (json, csv, markdown)')
  .option('-o, --output <file>', 'Output file')
  .action(async (format = 'json', options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const observations = db.searchObservations('', { limit: 10000 });

    let output: string;

    switch (format) {
      case 'csv':
        output = 'id,type,title,content,tags,date\n' + 
          observations.map(o => 
            `${o.id},${o.type},"${o.title.replace(/"/g, '""')}","${o.content.slice(0, 100).replace(/"/g, '""')}","${o.tags.join(';')}",${o.createdAt.toISOString()}`
          ).join('\n');
        break;
      case 'markdown':
        output = '# Agent-Memory Export\n\n' + 
          observations.map(o => `## #${o.id} - ${o.title}\n\n**Type:** ${o.type}\n**Date:** ${o.createdAt.toISOString()}\n\n${o.content}\n`).join('\n---\n');
        break;
      default:
        output = JSON.stringify(observations, null, 2);
    }

    if (options.output) {
      writeFileSync(options.output, output);
      console.log(`\n✅ Exported ${observations.length} observations to ${options.output}\n`);
    } else {
      console.log(output);
    }
  });

program
  .command('list-ides')
  .description('List all supported IDEs')
  .action(() => {
    const installer = new AutoInstaller();
    const platform = installer.getPlatformInfo();

    console.log(`\n📋 Supported IDEs (${platform.platform})\n`);
    console.log('─'.repeat(50));

    const ides = [
      { id: 'cursor', name: 'Cursor', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'windsurf', name: 'Windsurf', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'kilo', name: 'Kilo Code', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'aider', name: 'Aider', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'continue', name: 'Continue.dev', platforms: ['win32', 'darwin'] },
      { id: 'cline', name: 'Cline', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'claude', name: 'Claude Code', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'gemini', name: 'Gemini CLI', platforms: ['win32', 'darwin', 'linux'] },
      { id: 'opencode', name: 'OpenCode', platforms: ['darwin', 'linux'] }
    ];

    for (const ide of ides) {
      const supported = ide.platforms.includes(platform.platform as any);
      const check = supported ? '✅' : '⚠️';
      console.log(`  ${check}  ${ide.id.padEnd(12)} ${ide.name}`);
    }

    console.log('─'.repeat(50));
    console.log('\n💡 Run "npx agent-memory detect" to see which IDEs are installed\n');
  });

program
  .command('init')
  .description('Initialize session context - Call this at the start of every session')
  .option('-p, --project <path>', 'Project path')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    const initializer = new SessionInitializer();
    
    console.log('\n🧠 Initializing Agent-Memory Session...\n');
    
    const context = await initializer.initialize({
      projectPath: options.project,
      projectName: options.name
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📅 Session Initialized');
    console.log(`   IDE: ${context.ide}`);
    console.log(`   Time: ${context.timestamp}`);
    if (context.project) {
      console.log(`\n📁 Project: ${context.project.name}`);
      console.log(`   Path: ${context.project.path}`);
      console.log(`   Tech: ${context.project.technologies.join(', ')}`);
    }
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n💡 Your agent now has full context of:');
    console.log('   • All past sessions and decisions');
    console.log('   • Technical state and known issues');
    console.log('   • Project structure and dependencies');
    console.log('   • Your preferences and patterns');
    console.log('\n   Synced to all installed IDEs for seamless switching.\n');
  });

program
  .command('context')
  .description('Show current agent brain context')
  .option('-s, --section <section>', 'Section to show (all, identity, memory, technical)')
  .action(async (options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const brainDir = join(homedir(), '.agent-memory', 'brain');
    const brain = new AgentBrainSystem(db, brainDir);

    const section = options.section || 'all';
    const context = brain.getFullContext();

    console.log('\n' + context.slice(0, 5000) + '\n');
  });

program
  .command('log <type> <content>')
  .description('Log an activity to the current session')
  .option('-d, --details <details>', 'Additional details')
  .action(async (type, content, options) => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const brainDir = join(homedir(), '.agent-memory', 'brain');
    const brain = new AgentBrainSystem(db, brainDir);

    brain.logActivity({
      type: type as any,
      content,
      details: options.details
    });

    console.log(`\n📝 Logged ${type}: ${content}\n`);
  });

program
  .command('sync')
  .description('Sync context to all installed IDEs')
  .action(async () => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const brainDir = join(homedir(), '.agent-memory', 'brain');
    const brain = new AgentBrainSystem(db, brainDir);

    console.log('\n🔄 Syncing context to all IDEs...\n');
    
    const results = brain.syncAcrossIDEs();
    
    for (const r of results) {
      console.log(`  ${r.synced ? '✅' : '❌'} ${r.ide}`);
    }
    
    console.log('\n');
  });

program
  .command('update')
  .description('Update Agent-Memory to the latest version')
  .option('-v, --version <version>', 'Specific version to update to')
  .action(async (options) => {
    console.log('\n🔄 Updating Agent-Memory...\n');
    
    try {
      const pkgName = '@preetham1590/agent-memory-ai';
      
      if (options.version) {
        console.log(`  Installing version ${options.version}...`);
        execSync(`npm install -g ${pkgName}@${options.version}`, { stdio: 'inherit' });
      } else {
        console.log('  Checking for latest version...');
        execSync(`npm install -g ${pkgName}@latest`, { stdio: 'inherit' });
      }
      
      console.log('\n✅ Agent-Memory updated successfully!\n');
      console.log('  Run "npx @preetham1590/agent-memory-ai --version" to verify\n');
    } catch (error: any) {
      console.log(`\n❌ Update failed: ${error.message}\n`);
      console.log('  Try running with admin/sudo privileges\n');
    }
  });

program
  .command('uninstall')
  .description('Remove Agent-Memory from all IDEs and clean up')
  .option('-k, --keep-data', 'Keep memory database and config', false)
  .option('-i, --ide <ide>', 'Uninstall from specific IDE only')
  .option('-a, --all', 'Remove from ALL supported IDEs (not just detected)', false)
  .option('-r, --restore', 'Restore original config from backup', false)
  .option('-y, --yes', 'Skip confirmation', false)
  .action(async (options) => {
    const installer = new AutoInstaller();
    const agentMemoryDir = join(homedir(), '.agent-memory');

    const detected = installer.detectAllIDEs();
    const toRemove = options.all
      ? detected
      : options.ide
        ? detected.filter(d => d.ide === options.ide)
        : detected.filter(d => d.installed);

    if (toRemove.length === 0) {
      console.log('\n⚠️  No IDEs to uninstall from.\n');
      return;
    }

    console.log('\n🗑️  Uninstalling Agent-Memory\n');

    for (const { ide, name } of toRemove) {
      console.log(`  ${name}...`);
      try {
        const result = installer.uninstallFromIDE(ide, options.restore);
        if (result.restoredFrom) {
          console.log(`     ✅ Backup restored: ${result.restoredFrom}`);
        } else {
          console.log(`     ✅ Agent-Memory entries removed`);
        }

        // Verify after uninstall
        const verify = installer.verifyInstall(ide);
        if (!verify.installed) {
          console.log(`     ✅ Verified: agent-memory removed`);
        } else {
          console.log(`     ⚠️  ${verify.issue}`);
        }
      } catch (error: any) {
        console.log(`     ⚠️  ${error.message}`);
      }
    }

    if (!options.keepData) {
      console.log('\n  🧹 Cleaning up data directory...');
      try {
        const fs = await import('fs');
        fs.rmSync(agentMemoryDir, { recursive: true, force: true });
        console.log('     ✅ Data directory removed');
      } catch (error: any) {
        console.log(`     ⚠️  Could not remove data: ${error.message}`);
      }
    } else {
      console.log('\n  📁 Data preserved at: ' + agentMemoryDir);
    }

    console.log('\n✅ Uninstall complete\n');
  });

program
  .command('version')
  .description('Show version information')
  .action(() => {
    const config = getConfig();
    console.log(`\nAgent-Memory v${packageJson.version}\n`);
    console.log(`  Database: ${config.database}`);
    console.log(`  Worker port: ${config.port || 37800}`);
    console.log(`  Node: ${process.version}`);
    console.log(`  Platform: ${process.platform}\n`);
  });

program.parse();
