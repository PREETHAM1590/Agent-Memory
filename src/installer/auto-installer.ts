import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { IDEType } from '../types/index.js';

interface IDEInstallConfig {
  name: string;
  configDir: string;
  configFiles: string[];
  rulesFile: string;
  detectPaths: string[];
  binaryNames: string[];
}

const IDE_CONFIGS: Record<IDEType, IDEInstallConfig> = {
  cursor: {
    name: 'Cursor',
    configDir: '.cursor',
    configFiles: ['mcp.json'],
    rulesFile: '.cursorrules',
    detectPaths: [
      '/Applications/Cursor.app',
      'C:\\Program Files\\Cursor',
      'C:\\Users\\%USER%\\AppData\\Local\\Programs\\cursor',
      '/usr/bin/cursor',
      '/snap/bin/cursor'
    ],
    binaryNames: ['cursor', 'Cursor']
  },
  windsurf: {
    name: 'Windsurf',
    configDir: '.windsurf',
    configFiles: ['mcp.json'],
    rulesFile: '.windsurfrules',
    detectPaths: [
      '/Applications/Windsurf.app',
      'C:\\Program Files\\Windsurf',
      'C:\\Users\\%USER%\\AppData\\Local\\Programs\\Windsurf',
      '/usr/bin/windsurf'
    ],
    binaryNames: ['windsurf', 'Windsurf']
  },
  kilo: {
    name: 'Kilo Code',
    configDir: '.kilo',
    configFiles: ['mcp.json'],
    rulesFile: '.kilo/rules',
    detectPaths: [
      '/usr/local/bin/kilo',
      'C:\\Program Files\\Kilo',
      '/usr/bin/kilo'
    ],
    binaryNames: ['kilo', 'kilo-code']
  },
  aider: {
    name: 'Aider',
    configDir: '.aider',
    configFiles: ['conf.yml'],
    rulesFile: 'AIDER_RULES.md',
    detectPaths: [],
    binaryNames: ['aider']
  },
  continue: {
    name: 'Continue.dev',
    configDir: '.continue',
    configFiles: ['config.json'],
    rulesFile: '.continue/rules',
    detectPaths: [
      '/Applications/Continue.app',
      'C:\\Users\\%USER%\\.continue'
    ],
    binaryNames: ['continue']
  },
  cline: {
    name: 'Cline',
    configDir: '.cline',
    configFiles: ['mcp.json'],
    rulesFile: '.clinerules',
    detectPaths: [],
    binaryNames: ['cline']
  },
  claude: {
    name: 'Claude Code',
    configDir: '.claude',
    configFiles: ['settings.json', 'mcp.json'],
    rulesFile: 'CLAUDE.md',
    detectPaths: [
      '/usr/local/bin/claude',
      'C:\\Users\\%USER%\\.claude'
    ],
    binaryNames: ['claude', 'claude-code']
  },
  gemini: {
    name: 'Gemini CLI',
    configDir: '.gemini',
    configFiles: ['settings.json'],
    rulesFile: 'GEMINI.md',
    detectPaths: [
      '/usr/local/bin/gemini',
      'C:\\Users\\%USER%\\.gemini'
    ],
    binaryNames: ['gemini', 'gemini-cli']
  },
  opencode: {
    name: 'OpenCode',
    configDir: '.opencode',
    configFiles: ['mcp.json'],
    rulesFile: 'OPENCODE.md',
    detectPaths: [
      '/usr/local/bin/opencode'
    ],
    binaryNames: ['opencode']
  }
};

export class AutoInstaller {
  private homeDir: string;
  private platform: string;
  private agentMemoryDir: string;

  constructor() {
    this.homeDir = homedir();
    this.platform = platform();
    this.agentMemoryDir = join(this.homeDir, '.agent-memory');
  }

  detectAllIDEs(): { ide: IDEType; name: string; installed: boolean; path?: string }[] {
    const results: { ide: IDEType; name: string; installed: boolean; path?: string }[] = [];

    for (const [ide, config] of Object.entries(IDE_CONFIGS)) {
      const detection = this.detectIDE(ide as IDEType, config);
      results.push({
        ide: ide as IDEType,
        name: config.name,
        installed: detection.installed,
        path: detection.path
      });
    }

    return results;
  }

  private detectIDE(ide: IDEType, config: IDEInstallConfig): { installed: boolean; path?: string } {
    if (this.platform === 'win32') {
      return this.detectWindows(config);
    } else if (this.platform === 'darwin') {
      return this.detectMacOS(config);
    } else {
      return this.detectLinux(config);
    }
  }

  private detectWindows(config: IDEInstallConfig): { installed: boolean; path?: string } {
    const possiblePaths = [
      `C:\\Program Files\\${config.name}`,
      `C:\\Program Files (x86)\\${config.name}`,
      join(this.homeDir, 'AppData', 'Local', 'Programs', config.name.toLowerCase()),
      join(this.homeDir, 'AppData', 'Roaming', config.name.toLowerCase())
    ];

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        return { installed: true, path: p };
      }
    }

    for (const binary of config.binaryNames) {
      try {
        const result = execSync(`where ${binary}`, { encoding: 'utf-8' }).trim();
        if (result) {
          return { installed: true, path: result.split('\n')[0] };
        }
      } catch {}
    }

    if (config.configDir && existsSync(join(this.homeDir, config.configDir))) {
      return { installed: true };
    }

    return { installed: false };
  }

  private detectMacOS(config: IDEInstallConfig): { installed: boolean; path?: string } {
    const appPath = `/Applications/${config.name}.app`;
    if (existsSync(appPath)) {
      return { installed: true, path: appPath };
    }

    const homeAppPath = join(this.homeDir, 'Applications', `${config.name}.app`);
    if (existsSync(homeAppPath)) {
      return { installed: true, path: homeAppPath };
    }

    for (const binary of config.binaryNames) {
      try {
        const result = execSync(`which ${binary}`, { encoding: 'utf-8' }).trim();
        if (result) {
          return { installed: true, path: result };
        }
      } catch {}
    }

    if (config.configDir && existsSync(join(this.homeDir, config.configDir))) {
      return { installed: true };
    }

    return { installed: false };
  }

  private detectLinux(config: IDEInstallConfig): { installed: boolean; path?: string } {
    for (const binary of config.binaryNames) {
      try {
        const result = execSync(`which ${binary}`, { encoding: 'utf-8' }).trim();
        if (result) {
          return { installed: true, path: result };
        }
      } catch {}
    }

    for (const detectPath of config.detectPaths) {
      if (existsSync(detectPath)) {
        return { installed: true, path: detectPath };
      }
    }

    if (config.configDir && existsSync(join(this.homeDir, config.configDir))) {
      return { installed: true };
    }

    return { installed: false };
  }

  async installAll(detectedOnly: boolean = true): Promise<{ ide: IDEType; success: boolean; error?: string }[]> {
    const detected = this.detectAllIDEs();
    const results: { ide: IDEType; success: boolean; error?: string }[] = [];

    this.ensureAgentMemoryDir();

    const toInstall = detectedOnly 
      ? detected.filter(d => d.installed)
      : detected;

    if (toInstall.length === 0) {
      console.log('No IDEs detected. Use --force to install for all supported IDEs.');
      return [];
    }

    console.log(`\n🚀 Installing Agent-Memory for ${toInstall.length} IDE(s)...\n`);

    for (const { ide, name, installed } of toInstall) {
      console.log(`  📦 ${name}...`);
      try {
        await this.installForIDE(ide);
        console.log(`     ✅ Installed`);
        results.push({ ide, success: true });
      } catch (error: any) {
        console.log(`     ❌ Failed: ${error.message}`);
        results.push({ ide, success: false, error: error.message });
      }
    }

    console.log(`\n✨ Installation complete! ${results.filter(r => r.success).length}/${results.length} succeeded.\n`);
    console.log('Next steps:');
    console.log('  1. Restart your IDE(s)');
    console.log('  2. Run: npx agent-memory start');
    console.log('  3. Open: http://localhost:37800\n');

    return results;
  }

  private ensureAgentMemoryDir(): void {
    if (!existsSync(this.agentMemoryDir)) {
      mkdirSync(this.agentMemoryDir, { recursive: true });
    }

    const subdirs = ['data', 'logs', 'plugins', 'templates', 'hooks', 'dist'];
    for (const dir of subdirs) {
      const path = join(this.agentMemoryDir, dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }

    const configPath = join(this.agentMemoryDir, 'config.json');
    if (!existsSync(configPath)) {
      writeFileSync(configPath, JSON.stringify({
        port: 37800,
        database: join(this.agentMemoryDir, 'data', 'memory.db'),
        cloudSync: { enabled: false, provider: 'none' },
        summarization: { enabled: true, compressionLevel: 'medium' },
        learning: { enabled: true, patternExtraction: true },
        plugins: []
      }, null, 2));
    }
  }

  private async installForIDE(ide: IDEType): Promise<void> {
    const config = IDE_CONFIGS[ide];
    if (!config) {
      throw new Error(`Unknown IDE: ${ide}`);
    }

    const ideDir = join(this.homeDir, config.configDir);
    if (!existsSync(ideDir)) {
      mkdirSync(ideDir, { recursive: true });
    }

    await this.installMCPConfig(ide, config, ideDir);
    await this.installRules(ide, config);
    this.installHooks(ide);
  }

  private async installMCPConfig(ide: IDEType, config: IDEInstallConfig, ideDir: string): Promise<void> {
    const mcpConfig = {
      mcpServers: {
        'agent-memory': {
          command: 'npx',
          args: ['-y', 'agent-memory', 'mcp'],
          env: {
            AGENT_MEMORY_DB: join(this.agentMemoryDir, 'data', 'memory.db')
          }
        }
      }
    };

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);
      let existing: any = {};

      if (existsSync(configPath)) {
        try {
          existing = JSON.parse(readFileSync(configPath, 'utf-8'));
        } catch {
          existing = {};
        }
      }

      if (configFile === 'mcp.json' || configFile === 'settings.json') {
        if (!existing.mcpServers) {
          existing.mcpServers = {};
        }
        existing.mcpServers['agent-memory'] = mcpConfig.mcpServers['agent-memory'];
      }

      writeFileSync(configPath, JSON.stringify(existing, null, 2));
    }
  }

  private async installRules(ide: IDEType, config: IDEInstallConfig): Promise<void> {
    const rules = this.generateRulesContent(ide);
    const rulesPath = join(process.cwd(), config.rulesFile);
    writeFileSync(rulesPath, rules);
  }

  private generateRulesContent(ide: IDEType): string {
    return `# Agent-Memory Integration

This project uses Agent-Memory for persistent context across sessions.

## Quick Commands

- Start worker: \`npx agent-memory start\`
- Search memory: \`npx agent-memory search "query"\`
- View dashboard: \`npx agent-memory web\`

## MCP Tools

| Tool | Description |
|------|-------------|
| memory_search | Search memory with filters |
| memory_timeline | Get chronological context |
| memory_get_observations | Fetch full details |
| memory_store | Store new observation |
| memory_analytics | Get statistics |

## Usage

Always search memory before complex tasks:

\`\`\`
memory_search(query="previous database decisions")
\`\`\`

Store important decisions:

\`\`\`
memory_store(type="decision", title="Use PostgreSQL", content="...")
\`\`\`

## Memory Types

| Type | Use For |
|------|---------|
| bugfix | Bug fixes |
| feature | New features |
| decision | Architecture decisions |
| discovery | Learnings |
| change | Code changes |
| pattern | Reusable patterns |
`;
  }

  private installHooks(ide: IDEType): void {
    const hooksDir = join(this.agentMemoryDir, 'hooks');

    const sessionStartHook = `#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.AGENT_MEMORY_DB || path.join(require('os').homedir(), '.agent-memory', 'data', 'memory.db');

try {
  const { Database } = require('better-sqlite3');
  const db = new Database(dbPath);
  
  const recent = db.prepare('SELECT id, type, title FROM observations ORDER BY created_at DESC LIMIT 5').all();
  
  if (recent.length > 0) {
    console.log('\\n📚 Recent Memory Context:\\n');
    const icons = { bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡' };
    for (const obs of recent) {
      console.log(\`\${icons[obs.type] || '⚪'} #\${obs.id}: \${obs.title}\`);
    }
    console.log('\\nUse memory_search for more context.\\n');
  }
  
  db.close();
} catch (e) {
  // Database not ready yet
}
`;

    writeFileSync(join(hooksDir, 'session-start.js'), sessionStartHook);
    writeFileSync(join(hooksDir, 'session-start'), sessionStartHook);
  }

  getPlatformInfo(): { platform: string; home: string; supported: string[] } {
    return {
      platform: this.platform,
      home: this.homeDir,
      supported: Object.keys(IDE_CONFIGS)
    };
  }

  printDetectionResults(results: { ide: IDEType; name: string; installed: boolean; path?: string }[]): void {
    console.log('\n📊 IDE Detection Results\n');
    console.log('─'.repeat(50));

    const detected = results.filter(r => r.installed);
    const notDetected = results.filter(r => !r.installed);

    if (detected.length > 0) {
      console.log('\n✅ Detected IDEs:\n');
      for (const r of detected) {
        const pathInfo = r.path ? ` - ${r.path.slice(0, 50)}` : '';
        console.log(`   ${r.name.padEnd(15)}${pathInfo}`);
      }
    }

    if (notDetected.length > 0) {
      console.log('\n⚪ Not Detected:\n');
      for (const r of notDetected) {
        console.log(`   ${r.name}`);
      }
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`\nTotal: ${detected.length} detected, ${notDetected.length} not found\n`);
  }
}
