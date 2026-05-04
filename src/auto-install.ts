import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

const CONFIG_DIR = join(homedir(), '.agent-memory');
const DATA_DIR = join(CONFIG_DIR, 'data');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

async function main() {
  console.log('\n🚀 Agent-Memory - Universal AI IDE Memory System\n');
  console.log('━'.repeat(50));

  ensureConfig();

  const platformName = platform();
  console.log(`\n📋 Platform: ${platformName}`);

  const ides = detectIDEs();

  if (ides.detected.length === 0) {
    console.log('\n⚠️  No IDEs detected on this system.');
    console.log('\nSupported IDEs:');
    ides.supported.forEach(ide => console.log(`   ${ide}`));
    console.log('\n💡 You can still use Agent-Memory by running:');
    console.log('   npx agent-memory start\n');
    return;
  }

  console.log('\n✅ Detected IDEs:\n');
  ides.detected.forEach(ide => console.log(`   ✔ ${ide.name} ${ide.path ? `(${ide.path})` : ''}`));

  console.log('\n📦 Installing Agent-Memory...\n');

  for (const ide of ides.detected) {
    console.log(`   Installing for ${ide.name}...`);
    installForIDE(ide.id);
    console.log(`   ✅ ${ide.name} configured`);
  }

  console.log('\n' + '━'.repeat(50));
  console.log('\n✨ Installation Complete!\n');
  console.log('Next steps:');
  console.log('  1. Restart your IDE(s)');
  console.log('  2. Start the worker:  npx agent-memory start');
  console.log('  3. Open dashboard:    http://localhost:37800');
  console.log('  4. Search memory:     npx agent-memory search "query"');
  console.log('\n');
}

function ensureConfig() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify({
      port: 37800,
      database: join(DATA_DIR, 'memory.db'),
      cloudSync: { enabled: false, provider: 'none' },
      summarization: { enabled: true, compressionLevel: 'medium' },
      learning: { enabled: true, patternExtraction: true },
      plugins: []
    }, null, 2));
  }
}

function detectIDEs() {
  const home = homedir();
  const plat = platform();
  const detected: { id: string; name: string; path?: string }[] = [];
  const supported: string[] = [];

  const ideConfigs = [
    { id: 'cursor', name: 'Cursor', dirs: ['.cursor'], apps: ['Cursor'] },
    { id: 'windsurf', name: 'Windsurf', dirs: ['.windsurf'], apps: ['Windsurf'] },
    { id: 'kilo', name: 'Kilo Code', dirs: ['.kilo'], apps: [] },
    { id: 'aider', name: 'Aider', dirs: ['.aider'], apps: [], binary: 'aider' },
    { id: 'continue', name: 'Continue.dev', dirs: ['.continue'], apps: ['Continue'] },
    { id: 'cline', name: 'Cline', dirs: ['.cline'], apps: [] },
    { id: 'claude', name: 'Claude Code', dirs: ['.claude'], apps: [], binary: 'claude' },
    { id: 'gemini', name: 'Gemini CLI', dirs: ['.gemini'], apps: [], binary: 'gemini' },
    { id: 'opencode', name: 'OpenCode', dirs: ['.opencode'], apps: [], binary: 'opencode' }
  ];

  for (const ide of ideConfigs) {
    supported.push(ide.name);
    let found = false;

    for (const dir of ide.dirs) {
      if (existsSync(join(home, dir))) {
        detected.push({ id: ide.id, name: ide.name });
        found = true;
        break;
      }
    }

    if (!found && ide.binary) {
      try {
        const result = plat === 'win32'
          ? execSync(`where ${ide.binary} 2>nul`, { encoding: 'utf-8' }).trim()
          : execSync(`which ${ide.binary} 2>/dev/null`, { encoding: 'utf-8' }).trim();
        if (result) {
          detected.push({ id: ide.id, name: ide.name, path: result.split('\n')[0] });
          found = true;
        }
      } catch {}
    }

    if (!found && plat === 'darwin') {
      for (const app of ide.apps) {
        if (existsSync(`/Applications/${app}.app`)) {
          detected.push({ id: ide.id, name: ide.name, path: `/Applications/${app}.app` });
          found = true;
          break;
        }
      }
    }

    if (!found && plat === 'win32') {
      const programFiles = [
        `C:\\Program Files\\${ide.name}`,
        `C:\\Program Files (x86)\\${ide.name}`,
        join(home, 'AppData', 'Local', 'Programs', ide.name?.toLowerCase() || ide.id)
      ];
      for (const pf of programFiles) {
        if (existsSync(pf)) {
          detected.push({ id: ide.id, name: ide.name, path: pf });
          found = true;
          break;
        }
      }
    }
  }

  return { detected, supported };
}

function installForIDE(ideId: string) {
  const home = homedir();
  const ideConfigs: Record<string, { dir: string; configFile: string }> = {
    cursor: { dir: '.cursor', configFile: 'mcp.json' },
    windsurf: { dir: '.windsurf', configFile: 'mcp.json' },
    kilo: { dir: '.kilo', configFile: 'mcp.json' },
    aider: { dir: '.aider', configFile: 'conf.yml' },
    continue: { dir: '.continue', configFile: 'config.json' },
    cline: { dir: '.cline', configFile: 'mcp.json' },
    claude: { dir: '.claude', configFile: 'mcp.json' },
    gemini: { dir: '.gemini', configFile: 'settings.json' },
    opencode: { dir: '.opencode', configFile: 'mcp.json' }
  };

  const config = ideConfigs[ideId];
  if (!config) return;

  const ideDir = join(home, config.dir);
  if (!existsSync(ideDir)) {
    mkdirSync(ideDir, { recursive: true });
  }

  const mcpConfig = {
    mcpServers: {
      'agent-memory': {
        command: 'npx',
        args: ['-y', 'agent-memory', 'mcp'],
        env: {
          AGENT_MEMORY_DB: join(DATA_DIR, 'memory.db')
        }
      }
    }
  };

  const configPath = join(ideDir, config.configFile);
  let existing: any = {};

  if (existsSync(configPath)) {
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

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
