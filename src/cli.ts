#!/usr/bin/env node

import { Command } from 'commander';
import { AutoInstaller } from './installer/auto-installer.js';
import { WorkerService } from './worker/index.js';
import { MemoryDatabase } from './database/index.js';
import { MCPServer } from './mcp/server.js';
import { SessionInitializer } from './brain/initializer.js';
import { AgentBrainSystem } from './brain/index.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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

program
  .name('agent-memory')
  .description('Universal AI IDE Memory System - Auto-detect and install for all your IDEs')
  .version('1.0.0');

program
  .command('install')
  .description('Auto-detect ALL installed IDEs and install Agent-Memory for them')
  .option('-a, --all', 'Install for ALL supported IDEs (even if not detected)', false)
  .option('-i, --ide <ide>', 'Install for specific IDE only')
  .option('-d, --detect', 'Only detect IDEs, do not install', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (options) => {
    const installer = new AutoInstaller();

    if (options.detect) {
      const detected = installer.detectAllIDEs();
      installer.printDetectionResults(detected);
      return;
    }

    if (options.ide) {
      console.log(`\n📦 Installing for ${options.ide}...\n`);
      await installer.installAll(false);
      return;
    }

    console.log('\n🔍 Detecting installed IDEs...\n');
    const detected = installer.detectAllIDEs();
    installer.printDetectionResults(detected);

    if (options.all) {
      console.log('\n📦 Installing for ALL supported IDEs...\n');
      await installer.installAll(false);
    } else {
      await installer.installAll(true);
    }
  });

program
  .command('detect')
  .description('Detect all installed IDEs on this system')
  .action(async () => {
    const installer = new AutoInstaller();
    const detected = installer.detectAllIDEs();
    installer.printDetectionResults(detected);

    console.log('\n💡 To install, run: npx agent-memory install');
    console.log('💡 To install for ALL IDEs, run: npx agent-memory install --all\n');
  });

program
  .command('start')
  .description('Start the memory worker service')
  .option('-p, --port <port>', 'Port to run on', '37800')
  .action(async (options) => {
    const config = getConfig();
    config.port = parseInt(options.port) || config.port;

    const db = new MemoryDatabase(config.database);
    const worker = new WorkerService(db, config);

    console.log(`\n🚀 Agent-Memory Worker started`);
    console.log(`   Dashboard: http://localhost:${config.port}`);
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

program.parse();
