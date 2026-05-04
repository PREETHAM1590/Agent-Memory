#!/usr/bin/env node

import { Command } from 'commander';
import { IDEInstaller } from './installer/index.js';
import { WorkerService } from './worker/index.js';
import { MemoryDatabase } from './database/index.js';
import { MCPServer } from './mcp/server.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import open from 'open';

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
  .description('Universal AI IDE Memory System')
  .version('1.0.0');

program
  .command('install')
  .description('Install Agent-Memory for an IDE')
  .option('-i, --ide <ide>', 'IDE to install for (cursor, windsurf, kilo, aider, continue, cline, claude, gemini)')
  .action(async (options) => {
    const installer = new IDEInstaller();
    const ide = options.ide || installer.detectIDE();

    if (!ide) {
      console.log('Could not detect IDE. Please specify with --ide');
      console.log('Supported IDEs:');
      installer.listSupportedIDEs().forEach(i => console.log(`  - ${i.id}: ${i.name}`));
      return;
    }

    await installer.install(ide);
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

    worker.start();
    console.log(`Worker started on port ${config.port}`);
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
  .description('Open the web viewer')
  .action(async () => {
    const config = getConfig();
    const url = `http://localhost:${config.port}`;
    console.log(`Opening ${url}`);
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
      console.log('No results found');
      return;
    }

    console.log(`Found ${results.length} observations:\n`);
    for (const obs of results) {
      const icons: Record<string, string> = {
        bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡'
      };
      const icon = icons[obs.type] || '⚪';
      console.log(`${icon} #${obs.id} | ${obs.title}`);
      console.log(`   ${obs.content.slice(0, 100)}...`);
      console.log(`   Tags: ${obs.tags.join(', ')}`);
      console.log('');
    }
  });

program
  .command('stats')
  .description('Show memory statistics')
  .action(async () => {
    const config = getConfig();
    const db = new MemoryDatabase(config.database);
    const stats = db.getStats();

    console.log('\nMemory Statistics');
    console.log('================\n');
    console.log(`Total Observations: ${stats.totalObservations}`);
    console.log(`Total Sessions: ${stats.totalSessions}`);
    console.log(`Total Projects: ${stats.totalProjects}`);
    console.log('\nObservation Types:');

    const icons: Record<string, string> = {
      bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡', pattern: '🟠', note: '📝'
    };

    for (const [type, count] of Object.entries(stats.typeBreakdown)) {
      const icon = icons[type] || '⚪';
      console.log(`  ${icon} ${type}: ${count}`);
    }
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
        output = observations.map(o => `${o.id},${o.type},"${o.title}","${o.content.slice(0, 100)}"`).join('\n');
        break;
      case 'markdown':
        output = observations.map(o => `## #${o.id} - ${o.title}\n\n${o.content}\n`).join('\n---\n');
        break;
      default:
        output = JSON.stringify(observations, null, 2);
    }

    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, output);
      console.log(`Exported to ${options.output}`);
    } else {
      console.log(output);
    }
  });

program
  .command('list-ides')
  .description('List supported IDEs')
  .action(() => {
    const installer = new IDEInstaller();
    console.log('Supported IDEs:\n');
    installer.listSupportedIDEs().forEach(i => {
      console.log(`  ${i.id.padEnd(12)} ${i.name}`);
    });
  });

program.parse();
