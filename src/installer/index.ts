import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { IDEType } from '../types/index.js';

const IDE_CONFIGS: Record<IDEType, IDEConfig> = {
  cursor: {
    name: 'Cursor',
    configDir: '.cursor',
    configFiles: ['mcp.json', 'rules'],
    rulesDir: '.cursorrules'
  },
  windsurf: {
    name: 'Windsurf',
    configDir: '.windsurf',
    configFiles: ['mcp.json', 'rules'],
    rulesDir: '.windsurfrules'
  },
  kilo: {
    name: 'Kilo Code',
    configDir: '.kilo',
    configFiles: ['mcp.json'],
    rulesDir: '.kilo/rules'
  },
  aider: {
    name: 'Aider',
    configDir: '.aider',
    configFiles: ['conf.yml'],
    rulesDir: 'AIDER_RULES.md'
  },
  continue: {
    name: 'Continue.dev',
    configDir: '.continue',
    configFiles: ['config.json'],
    rulesDir: '.continue/rules'
  },
  cline: {
    name: 'Cline',
    configDir: '.cline',
    configFiles: ['mcp.json'],
    rulesDir: '.clinerules'
  },
  claude: {
    name: 'Claude Code',
    configDir: '.claude',
    configFiles: ['settings.json', 'mcp.json'],
    rulesDir: 'CLAUDE.md'
  },
  gemini: {
    name: 'Gemini CLI',
    configDir: '.gemini',
    configFiles: ['settings.json'],
    rulesDir: 'GEMINI.md'
  },
  opencode: {
    name: 'OpenCode',
    configDir: '.opencode',
    configFiles: ['mcp.json'],
    rulesDir: 'OPENCODE.md'
  }
};

interface IDEConfig {
  name: string;
  configDir: string;
  configFiles: string[];
  rulesDir: string;
}

export class IDEInstaller {
  private agentMemoryDir: string;
  private homeDir: string;

  constructor() {
    this.homeDir = homedir();
    this.agentMemoryDir = join(this.homeDir, '.agent-memory');
  }

  async install(ide: IDEType): Promise<void> {
    const config = IDE_CONFIGS[ide];
    if (!config) {
      throw new Error(`Unknown IDE: ${ide}`);
    }

    console.log(`Installing Agent-Memory for ${config.name}...`);

    this.ensureAgentMemoryDir();
    await this.installMCPConfig(ide, config);
    await this.installRules(ide, config);
    this.installHooks(ide);

    console.log(`✅ Agent-Memory installed for ${config.name}`);
  }

  private ensureAgentMemoryDir(): void {
    if (!existsSync(this.agentMemoryDir)) {
      mkdirSync(this.agentMemoryDir, { recursive: true });
    }

    const subdirs = ['data', 'logs', 'plugins', 'templates'];
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

  private async installMCPConfig(ide: IDEType, config: IDEConfig): Promise<void> {
    const mcpConfig = {
      mcpServers: {
        'agent-memory': {
          command: 'node',
          args: [join(this.agentMemoryDir, 'dist', 'mcp', 'server.js')],
          env: {
            AGENT_MEMORY_DB: join(this.agentMemoryDir, 'data', 'memory.db')
          }
        }
      }
    };

    const ideDir = join(this.homeDir, config.configDir);
    if (!existsSync(ideDir)) {
      mkdirSync(ideDir, { recursive: true });
    }

    const mcpPath = join(ideDir, 'mcp.json');
    let existing: any = {};

    if (existsSync(mcpPath)) {
      try {
        existing = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      } catch {
        existing = {};
      }
    }

    if (!existing.mcpServers) {
      existing.mcpServers = {};
    }
    existing.mcpServers['agent-memory'] = mcpConfig.mcpServers['agent-memory'];

    writeFileSync(mcpPath, JSON.stringify(existing, null, 2));
    console.log(`  ✓ MCP config written to ${mcpPath}`);
  }

  private async installRules(ide: IDEType, config: IDEConfig): Promise<void> {
    const rules = `# Agent-Memory Integration

This project uses Agent-Memory for persistent context across sessions.

## Available MCP Tools

- \`memory_search\` - Search memory index
- \`memory_timeline\` - Get chronological context
- \`memory_get_observations\` - Fetch full observation details
- \`memory_store\` - Store new observation
- \`memory_analytics\` - Get usage statistics

## Usage

Always search memory before starting complex tasks:

\`\`\`
memory_search(query="previous decisions about database")
\`\`\`

Store important decisions and patterns:

\`\`\`
memory_store(type="decision", title="Use PostgreSQL", content="...")
\`\`\`

## Memory Types

| Type | Icon | Use For |
|------|------|---------|
| bugfix | 🔴 | Bug fixes |
| feature | 🟢 | New features |
| decision | 🟣 | Architecture decisions |
| discovery | 🔵 | Findings and learnings |
| change | 🟡 | Code changes |
`;

    const rulesPath = join(process.cwd(), config.rulesDir);
    writeFileSync(rulesPath, rules);
    console.log(`  ✓ Rules written to ${rulesPath}`);
  }

  private installHooks(ide: IDEType): void {
    const hooksDir = join(this.agentMemoryDir, 'hooks');
    if (!existsSync(hooksDir)) {
      mkdirSync(hooksDir, { recursive: true });
    }

    const sessionStartHook = `#!/usr/bin/env node
import { MemoryDatabase } from '../database/index.js';

const db = new MemoryDatabase(process.env.AGENT_MEMORY_DB || '~/.agent-memory/data/memory.db');

// Get recent context for session
const recent = db.searchObservations('', { limit: 5 });

if (recent.length > 0) {
  console.log('\\n📚 Recent Memory Context:\\n');
  for (const obs of recent) {
    const icon = { bugfix: '🔴', feature: '🟢', decision: '🟣', discovery: '🔵', change: '🟡' }[obs.type] || '⚪';
    console.log(\`\${icon} #\${obs.id}: \${obs.title}\`);
  }
  console.log('\\nUse memory_search for more context.\\n');
}
`;

    writeFileSync(join(hooksDir, 'session-start.js'), sessionStartHook);
    console.log(`  ✓ Hooks installed`);
  }

  detectIDE(): IDEType | null {
    const cwd = process.cwd();

    if (existsSync(join(cwd, '.cursor'))) return 'cursor';
    if (existsSync(join(cwd, '.windsurf'))) return 'windsurf';
    if (existsSync(join(cwd, '.kilo'))) return 'kilo';
    if (existsSync(join(cwd, '.aider'))) return 'aider';
    if (existsSync(join(cwd, '.continue'))) return 'continue';
    if (existsSync(join(cwd, '.cline'))) return 'cline';
    if (existsSync(join(cwd, '.claude'))) return 'claude';
    if (existsSync(join(cwd, '.gemini'))) return 'gemini';
    if (existsSync(join(cwd, '.opencode'))) return 'opencode';

    return null;
  }

  listSupportedIDEs(): { id: IDEType; name: string }[] {
    return Object.entries(IDE_CONFIGS).map(([id, config]) => ({
      id: id as IDEType,
      name: config.name
    }));
  }
}
