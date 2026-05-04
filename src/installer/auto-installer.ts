import { execSync, execFileSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
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
    configFiles: ['kilo.json', 'mcp.json'],
    rulesFile: 'AGENTS.md',
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
    configFiles: ['.aider.conf.yml'],
    rulesFile: 'AIDER_RULES.md',
    detectPaths: [],
    binaryNames: ['aider']
  },
  continue: {
    name: 'Continue.dev',
    configDir: '.continue',
    configFiles: ['config.json'],
    rulesFile: '.continuerc.json',
    detectPaths: [
      '/Applications/Continue.app',
      'C:\\Users\\%USER%\\.continue'
    ],
    binaryNames: ['continue']
  },
  cline: {
    name: 'Cline',
    configDir: '.cline',
    configFiles: ['cline_mcp_settings.json', 'mcp.json'],
    rulesFile: '.clinerules',
    detectPaths: [],
    binaryNames: ['cline']
  },
  claude: {
    name: 'Claude Code',
    configDir: '.claude',
    configFiles: ['.mcp.json', 'settings.json'],
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
    configFiles: ['.opencode.json', 'mcp.json'],
    rulesFile: 'OPENCODE.md',
    detectPaths: [
      '/usr/local/bin/opencode',
      'C:\\Users\\%USER%\\.opencode'
    ],
    binaryNames: ['opencode']
  },
  antigravity: {
    name: 'Antigravity',
    configDir: '.antigravity',
    configFiles: ['mcp.json', 'settings.json'],
    rulesFile: 'ANTIGRAVITY.md',
    detectPaths: [
      '/Applications/Antigravity.app',
      'C:\\Program Files\\Antigravity',
      'C:\\Users\\%USER%\\AppData\\Local\\Programs\\Antigravity',
      'C:\\Users\\%USER%\\.antigravity',
      '~/.antigravity'
    ],
    binaryNames: ['antigravity', 'ag']
  },
  zed: {
    name: 'Zed',
    configDir: '.config/zed',
    configFiles: ['settings.json'],
    rulesFile: '.zed/rules.md',
    detectPaths: [
      '/Applications/Zed.app',
      '/usr/bin/zed',
      'C:\\Program Files\\Zed'
    ],
    binaryNames: ['zed', 'Zed']
  },
  trae: {
    name: 'Trae',
    configDir: '.trae',
    configFiles: ['mcp.json', 'settings.json'],
    rulesFile: 'TRAE.md',
    detectPaths: [
      '/Applications/Trae.app',
      'C:\\Users\\%USER%\\.trae'
    ],
    binaryNames: ['trae']
  },
  vscode_copilot: {
    name: 'VS Code + Copilot',
    configDir: '.vscode',
    configFiles: ['mcp.json', 'settings.json'],
    rulesFile: '.vscode/rules.md',
    detectPaths: [
      '/Applications/Visual Studio Code.app',
      'C:\\Program Files\\Microsoft VS Code',
      '/usr/bin/code'
    ],
    binaryNames: ['code', 'Code']
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
    const programDirs = [
      `C:\\Program Files\\${config.name}`,
      `C:\\Program Files (x86)\\${config.name}`,
      join(this.homeDir, 'AppData', 'Local', 'Programs', config.name.toLowerCase()),
      join(this.homeDir, 'AppData', 'Roaming', config.name.toLowerCase())
    ];

    for (const dir of programDirs) {
      if (existsSync(dir)) {
        return { installed: true, path: dir };
      }
    }

    for (const binary of config.binaryNames) {
      try {
        const result = execSync(`where ${binary}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (result && result.trim()) {
          return { installed: true, path: result.trim().split('\n')[0] };
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
        const result = execSync(`which ${binary}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (result && result.trim()) {
          return { installed: true, path: result.trim() };
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
        const result = execSync(`which ${binary}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (result && result.trim()) {
          return { installed: true, path: result.trim() };
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
      : Object.keys(IDE_CONFIGS).map(ide => ({
          ide: ide as IDEType,
          name: IDE_CONFIGS[ide as IDEType].name,
          installed: true
        }));

    if (toInstall.length === 0) {
      console.log('No IDEs detected. Use --force to install for all supported IDEs.');
      return [];
    }

    console.log(`\n🚀 Installing Agent-Memory for ${toInstall.length} IDE(s)...\n`);

    for (const { ide, name } of toInstall) {
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
    console.log('  2. Run: npx @preetham1590/agent-memory-ai start');
    console.log('  3. Open: http://localhost:37800\n');

    return results;
  }

  private ensureAgentMemoryDir(): void {
    if (!existsSync(this.agentMemoryDir)) {
      mkdirSync(this.agentMemoryDir, { recursive: true });
    }

    const subdirs = ['data', 'logs', 'plugins', 'templates', 'hooks', 'brain', 'brain/sessions'];
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
        summarization: { enabled: false, compressionLevel: 'medium' },
        learning: { enabled: true, patternExtraction: true },
        plugins: []
      }, null, 2));
    }
  }

  async installForIDE(ide: IDEType): Promise<void> {
    const config = IDE_CONFIGS[ide];
    if (!config) {
      throw new Error(`Unknown IDE: ${ide}`);
    }

    this.ensureAgentMemoryDir();

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
          args: ['-y', '@preetham1590/agent-memory-ai', 'mcp'],
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
        // Create backup before modifying
        this.backupConfigFile(configPath);

        try {
          existing = JSON.parse(readFileSync(configPath, 'utf-8'));
        } catch {
          existing = {};
        }
      }

      if (!existing.mcpServers) {
        existing.mcpServers = {};
      }
      existing.mcpServers['agent-memory'] = mcpConfig.mcpServers['agent-memory'];

      writeFileSync(configPath, JSON.stringify(existing, null, 2));
    }
  }

  private async installRules(ide: IDEType, config: IDEInstallConfig): Promise<void> {
    const rules = `# Agent-Memory Integration

This project uses Agent-Memory for persistent context across sessions.

## Quick Commands

- Start worker: \`npx @preetham1590/agent-memory-ai start\`
- Search memory: \`npx @preetham1590/agent-memory-ai search "query"\`
- View dashboard: \`npx @preetham1590/agent-memory-ai web\`

## MCP Tools

| Tool | Description |
|------|-------------|
| memory_init | Initialize session with full context |
| memory_search | Search memory with filters |
| memory_timeline | Get chronological context |
| memory_get_observations | Fetch full details |
| memory_store | Store new observation |
| memory_log | Log session activities |
| memory_context | Get brain context |
| memory_sync | Sync to all IDEs |
| memory_analytics | Get statistics |

## Usage

Always initialize at session start:

\`\`\`
memory_init(projectPath="/path/to/project")
\`\`\`

Log important activities:

\`\`\`
memory_log(type="decision", content="Use PostgreSQL for main DB")
\`\`\`

End session properly:

\`\`\`
memory_end_session(summary="Implemented X, fixed Y")
\`\`\`
`;

    const rulesPath = join(process.cwd(), config.rulesFile);
    writeFileSync(rulesPath, rules);
  }

  private installHooks(ide: IDEType): void {
    const hooksDir = join(this.agentMemoryDir, 'hooks');

    const sessionStartHook = `#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const dbPath = process.env.AGENT_MEMORY_DB || path.join(os.homedir(), '.agent-memory', 'data', 'memory.db');

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
        console.log(`   ${r.name.padEnd(18)}${pathInfo}`);
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

  backupConfigFile(filePath: string): string | null {
    if (!existsSync(filePath)) return null;
    const backupDir = join(this.agentMemoryDir, 'backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = join(backupDir, `${basename(filePath)}.agent-memory-backup-${timestamp}`);
    try {
      copyFileSync(filePath, backupPath);
      return backupPath;
    } catch {
      return null;
    }
  }

  restoreBackup(filePath: string, backupPath: string): boolean {
    if (!existsSync(backupPath)) return false;
    try {
      copyFileSync(backupPath, filePath);
      return true;
    } catch {
      return false;
    }
  }

  validateConfig(filePath: string): { valid: boolean; error?: string } {
    if (!existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }
    try {
      const content = readFileSync(filePath, 'utf-8').trim();
      if (!content) {
        return { valid: false, error: 'File is empty' };
      }
      JSON.parse(content);
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: `Invalid JSON: ${e.message}` };
    }
  }

  dryRunInstall(ide: IDEType): { wouldModify: boolean; files: string[]; backups: string[] } {
    const config = IDE_CONFIGS[ide];
    const result: { wouldModify: boolean; files: string[]; backups: string[] } = {
      wouldModify: false,
      files: [],
      backups: []
    };

    if (!config) return result;

    const ideDir = join(this.homeDir, config.configDir);

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);
      result.files.push(configPath);
    }

    result.wouldModify = result.files.length > 0;
    return result;
  }

  verifyInstall(ide: IDEType): { installed: boolean; issue?: string } {
    const config = IDE_CONFIGS[ide];
    if (!config) return { installed: false, issue: 'Unknown IDE' };

    const ideDir = join(this.homeDir, config.configDir);

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);
      if (!existsSync(configPath)) {
        return { installed: false, issue: `Missing config: ${configFile}` };
      }
      const validation = this.validateConfig(configPath);
      if (!validation.valid) {
        return { installed: false, issue: `Invalid config ${configFile}: ${validation.error}` };
      }
      try {
        const content = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (!content.mcpServers?.['agent-memory']) {
          return { installed: false, issue: `Missing agent-memory entry in ${configFile}` };
        }
      } catch {
        return { installed: false, issue: `Cannot parse ${configFile}` };
      }
    }

    return { installed: true };
  }

  doctorCheck(): {
    nodeVersion: string;
    packageVersion: string;
    database: { exists: boolean; path: string; size: number };
    worker: { running: boolean; port?: number };
    ides: { ide: IDEType; name: string; installed: boolean; issue?: string }[];
    config: { exists: boolean; valid: boolean; path: string; error?: string };
    backups: { path: string; exists: boolean }[];
    issues: string[];
  } {
    const issues: string[] = [];
    const configPath = join(this.agentMemoryDir, 'config.json');
    const dbPath = join(this.agentMemoryDir, 'data', 'memory.db');
    const backupDir = join(this.agentMemoryDir, 'backups');

    const nodeVersion = process.version;

    let packageVersion = 'unknown';
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      if (existsSync(pkgPath)) {
        packageVersion = JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
      }
    } catch {}

    const dbExists = existsSync(dbPath);
    let dbSize = 0;
    if (dbExists) {
      try { dbSize = statSync(dbPath).size; } catch {}
    }

    const configExists = existsSync(configPath);
    let configValid = false;
    let configError: string | undefined;
    if (configExists) {
      const validation = this.validateConfig(configPath);
      configValid = validation.valid;
      configError = validation.error;
      if (!configValid) issues.push(`Config file is invalid: ${configError}`);
    } else {
      issues.push('Config file not found');
    }

    let workerRunning = false;
    let workerPort: number | undefined;
    if (configExists) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        workerPort = config.port || 37800;
      } catch {}
    }
    if (!workerPort) workerPort = 37800;

    const detected = this.detectAllIDEs();
    const ides = detected.map(d => {
      if (!d.installed) return { ...d, issue: 'Not detected on system' };
      const verify = this.verifyInstall(d.ide);
      return { ide: d.ide, name: d.name, installed: verify.installed, issue: verify.issue };
    });

    for (const ide of ides) {
      if (ide.installed && ide.issue) {
        issues.push(`${ide.name}: ${ide.issue}`);
      }
    }

    let backups: { path: string; exists: boolean }[] = [];
    if (existsSync(backupDir)) {
      backups = readdirSync(backupDir)
        .filter(f => f.includes('.agent-memory-backup'))
        .map(f => ({ path: join(backupDir, f), exists: true }));
    }

    return {
      nodeVersion,
      packageVersion,
      database: { exists: dbExists, path: dbPath, size: dbSize },
      worker: { running: workerRunning, port: workerPort },
      config: { exists: configExists, valid: configValid, path: configPath, error: configError },
      ides,
      backups,
      issues
    };
  }

  repairIDE(ide: IDEType): { fixed: boolean; actions: string[] } {
    const config = IDE_CONFIGS[ide];
    const actions: string[] = [];

    if (!config) {
      return { fixed: false, actions: ['Unknown IDE'] };
    }

    const ideDir = join(this.homeDir, config.configDir);

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);
      const validation = this.validateConfig(configPath);

      if (!validation.valid || !existsSync(configPath)) {
        if (existsSync(configPath) && !validation.valid) {
          const backupDir = join(this.agentMemoryDir, 'backups');
          if (existsSync(backupDir)) {
            const backups = readdirSync(backupDir)
              .filter(f => f.startsWith(basename(configPath)));
            if (backups.length > 0) {
              const latest = backups.sort().reverse()[0];
              this.restoreBackup(configPath, join(backupDir, latest));
              actions.push(`Restored ${configFile} from backup: ${latest}`);
              continue;
            }
          }
          writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
          actions.push(`Recreated ${configFile} (no backup available)`);
        } else {
          if (!existsSync(ideDir)) mkdirSync(ideDir, { recursive: true });
          writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
          actions.push(`Created missing ${configFile}`);
        }
      }
    }

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);
      if (existsSync(configPath)) {
        try {
          const content = JSON.parse(readFileSync(configPath, 'utf-8'));
          if (!content.mcpServers) content.mcpServers = {};
          content.mcpServers['agent-memory'] = {
            command: 'npx',
            args: ['-y', '@preetham1590/agent-memory-ai', 'mcp'],
            env: {
              AGENT_MEMORY_DB: join(this.agentMemoryDir, 'data', 'memory.db')
            }
          };
          writeFileSync(configPath, JSON.stringify(content, null, 2));
          actions.push(`Added agent-memory MCP entry to ${configFile}`);
        } catch {}
      }
    }

    return { fixed: actions.length > 0, actions };
  }

  uninstallFromIDE(ide: IDEType, restoreBackup: boolean = false): { removed: boolean; restoredFrom?: string } {
    const config = IDE_CONFIGS[ide];
    if (!config) {
      throw new Error(`Unknown IDE: ${ide}`);
    }

    const ideDir = join(this.homeDir, config.configDir);
    let restoredFrom: string | undefined;

    for (const configFile of config.configFiles) {
      const configPath = join(ideDir, configFile);

      if (existsSync(configPath)) {
        // Try backup restore first
        if (restoreBackup) {
          const backupDir = join(this.agentMemoryDir, 'backups');
          if (existsSync(backupDir)) {
            const backups = readdirSync(backupDir)
              .filter(f => f.startsWith(basename(configPath)));
            if (backups.length > 0) {
              const latest = backups.sort().reverse()[0];
              if (this.restoreBackup(configPath, join(backupDir, latest))) {
                restoredFrom = latest;
                continue;
              }
            }
          }
        }

        // Remove only agent-memory entry
        try {
          const existing = JSON.parse(readFileSync(configPath, 'utf-8'));

          if (existing.mcpServers && existing.mcpServers['agent-memory']) {
            delete existing.mcpServers['agent-memory'];
            // If mcpServers is now empty, keep it valid
            writeFileSync(configPath, JSON.stringify(existing, null, 2));
          }
        } catch {}
      }
    }

    const rulesPath = join(process.cwd(), config.rulesFile);
    if (existsSync(rulesPath)) {
      try {
        const content = readFileSync(rulesPath, 'utf-8');
        if (content.includes('Agent-Memory')) {
          unlinkSync(rulesPath);
        }
      } catch {}
    }

    return { removed: true, restoredFrom };
  }
}
