import { homedir } from 'os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class SessionInitializer {
  private configDir: string;

  constructor() {
    this.configDir = join(homedir(), '.agent-memory');
  }

  async initialize(options: {
    projectPath?: string;
    projectName?: string;
    ideType?: string;
  } = {}): Promise<SessionContext> {
    this.ensureDirectories();

    const context = await this.gatherContext(options);

    await this.syncToAllIDEs(context);

    return context;
  }

  private ensureDirectories(): void {
    const dirs = [
      this.configDir,
      join(this.configDir, 'brain'),
      join(this.configDir, 'brain', 'sessions'),
      join(this.configDir, 'brain', 'workflows'),
      join(this.configDir, 'brain', 'context'),
      join(this.configDir, 'data'),
      join(this.configDir, 'templates')
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async gatherContext(options: {
    projectPath?: string;
    projectName?: string;
    ideType?: string;
  }): Promise<SessionContext> {
    const today = new Date().toISOString().split('T')[0];
    const startTime = new Date();

    const identity = this.loadFromFile('brain/IDENTITY.md', this.getDefaultIdentity());
    const memory = this.loadFromFile('brain/MEMORY.md', this.getDefaultMemory());
    const technicalState = this.loadFromFile('brain/TECHNICAL_STATE.md', this.getDefaultTechnical());
    const userProfile = this.loadFromFile('brain/USER_PROFILE.md', this.getDefaultUserProfile());
    const knownIssues = this.loadFromFile('brain/KNOWN_ISSUES.md', '# Known Issues\n\n');
    const projectContext = options.projectPath 
      ? this.analyzeProject(options.projectPath) 
      : null;

    const recentSessions = this.getRecentSessions(5);
    const todaysSession = this.loadFromFile(`brain/sessions/${today}.md`, '');

    const context: SessionContext = {
      initialized: true,
      timestamp: startTime.toISOString(),
      ide: options.ideType || this.detectCurrentIDE(),
      project: projectContext,
      identity: identity,
      memory: memory,
      technicalState: technicalState,
      userProfile: userProfile,
      knownIssues: knownIssues,
      recentSessions: recentSessions,
      todaysSession: todaysSession,
      quickContext: this.generateQuickContext({
        identity, memory, technicalState, projectContext, recentSessions
      })
    };

    this.saveCurrentContext(context);

    return context;
  }

  private analyzeProject(projectPath: string): ProjectAnalysis {
    const packageJsonPath = join(projectPath, 'package.json');
    let projectInfo: any = {};

    if (existsSync(packageJsonPath)) {
      try {
        projectInfo = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      } catch {}
    }

    return {
      path: projectPath,
      name: projectInfo.name || 'Unknown Project',
      description: projectInfo.description || '',
      technologies: this.detectTechnologies(projectPath),
      dependencies: Object.keys(projectInfo.dependencies || {}),
      scripts: Object.keys(projectInfo.scripts || {})
    };
  }

  private detectTechnologies(projectPath: string): string[] {
    const tech: string[] = [];
    const files: Record<string, string> = {
      'tsconfig.json': 'TypeScript',
      'package.json': 'Node.js',
      'go.mod': 'Go',
      'Cargo.toml': 'Rust',
      'requirements.txt': 'Python',
      'Gemfile': 'Ruby',
      'pom.xml': 'Java/Maven',
      'build.gradle': 'Java/Gradle',
      'composer.json': 'PHP',
      '.git': 'Git',
      'Dockerfile': 'Docker',
      'docker-compose.yml': 'Docker Compose'
    };

    for (const [file, technology] of Object.entries(files)) {
      if (existsSync(join(projectPath, file))) {
        tech.push(technology);
      }
    }

    return tech;
  }

  private getRecentSessions(count: number): string[] {
    const sessionsDir = join(this.configDir, 'brain', 'sessions');
    if (!existsSync(sessionsDir)) return [];

    const files = require('fs').readdirSync(sessionsDir)
      .filter((f: string) => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, count);

    return files.map((f: string) => join(sessionsDir, f));
  }

  private generateQuickContext(data: any): string {
    const lines: string[] = [
      '# 🧠 Agent-Memory Session Context',
      '',
      `**Initialized**: ${new Date().toISOString()}`,
      `**IDE**: ${this.detectCurrentIDE()}`,
      ''
    ];

    if (data.projectContext) {
      lines.push('## 📁 Active Project');
      lines.push(`- **Name**: ${data.projectContext.name}`);
      lines.push(`- **Path**: ${data.projectContext.path}`);
      lines.push(`- **Tech Stack**: ${data.projectContext.technologies.join(', ')}`);
      lines.push('');
    }

    lines.push('## 📋 Quick Status');
    lines.push('- Memory database: Active');
    lines.push('- Session logging: Enabled');
    lines.push('- Cross-IDE sync: Ready');
    lines.push('');

    lines.push('## 🎯 Capabilities');
    lines.push('- Full session history available');
    lines.push('- Pattern learning enabled');
    lines.push('- Decision tracking active');
    lines.push('');

    return lines.join('\n');
  }

  private async syncToAllIDEs(context: SessionContext): Promise<void> {
    const ideConfigs = [
      { name: 'cursor', dir: '.cursor', file: 'AGENT_CONTEXT.md' },
      { name: 'windsurf', dir: '.windsurf', file: 'AGENT_CONTEXT.md' },
      { name: 'claude', dir: '.claude', file: 'AGENT_CONTEXT.md' },
      { name: 'kilo', dir: '.kilo', file: 'AGENT_CONTEXT.md' },
      { name: 'gemini', dir: '.gemini', file: 'AGENT_CONTEXT.md' },
      { name: 'aider', dir: '.aider', file: 'CONTEXT.md' },
      { name: 'continue', dir: '.continue', file: 'AGENT_CONTEXT.md' }
    ];

    const contextContent = this.formatContextForIDE(context);

    for (const ide of ideConfigs) {
      const ideDir = join(homedir(), ide.dir);
      if (existsSync(ideDir)) {
        const contextFile = join(ideDir, ide.file);
        writeFileSync(contextFile, contextContent);
      }
    }
  }

  private formatContextForIDE(context: SessionContext): string {
    return `# Agent-Memory Context

> Auto-generated at ${context.timestamp}

## Current Session

- **IDE**: ${context.ide}
- **Project**: ${context.project?.name || 'None'}

## Quick Context

${context.quickContext}

## Full Memory

${context.memory}

## Technical State

${context.technicalState}

## Known Issues

${context.knownIssues}

---

This context is automatically synced across all your AI IDEs by Agent-Memory.
`;
  }

  private saveCurrentContext(context: SessionContext): void {
    const contextFile = join(this.configDir, 'brain', 'CURRENT_CONTEXT.json');
    writeFileSync(contextFile, JSON.stringify(context, null, 2));
  }

  private loadFromFile(relativePath: string, defaultValue: string): string {
    const fullPath = join(this.configDir, relativePath);
    if (existsSync(fullPath)) {
      return readFileSync(fullPath, 'utf-8');
    }
    writeFileSync(fullPath, defaultValue);
    return defaultValue;
  }

  private detectCurrentIDE(): string {
    if (process.env.CURSOR_TRACE_ID) return 'cursor';
    if (process.env.WINDSURF_SESSION) return 'windsurf';
    if (process.env.CLAUDE_CODE) return 'claude';
    if (existsSync(join(homedir(), '.kilo'))) return 'kilo';
    if (process.env.GEMINI_CLI) return 'gemini';
    if (existsSync(join(homedir(), '.aider'))) return 'aider';
    if (existsSync(join(homedir(), '.continue'))) return 'continue';
    return 'unknown';
  }

  private getDefaultIdentity(): string {
    return `# Agent-Memory Identity

## Who Am I
I am Agent-Memory, your persistent AI assistant with cross-session memory.

## Mission
To maintain context and continuity across all your coding sessions,
regardless of which IDE or project you're working on.

## Core Capabilities
- ✅ Remember everything from past sessions
- ✅ Track decisions and their outcomes
- ✅ Learn patterns from your workflow
- ✅ Sync context across all IDEs
- ✅ Organize knowledge systematically

## Operating Rules
1. Always initialize context at session start
2. Log important decisions and discoveries
3. Update state when project changes
4. Keep all IDEs synchronized
5. Maintain session logs by date
`;
  }

  private getDefaultMemory(): string {
    return `# Agent-Memory Memory

## Active Context

### Current Project
None

### Recent Decisions
None yet

### Patterns Learned
None yet

## Session History

Sessions are logged daily in \`brain/sessions/YYYY-MM-DD.md\`
`;
  }

  private getDefaultTechnical(): string {
    return `# Technical State

## Environment
- Platform: ${process.platform}
- Node Version: ${process.version}
- Architecture: ${process.arch}

## Services

| Service | Status | Port |
|---------|--------|------|
| Agent-Memory Worker | Ready | 37800 |

## Docker

\`\`\`bash
# Check Docker status
docker ps -a
\`\`\`

## Databases

| Database | Type | Location |
|----------|------|----------|
| memory.db | SQLite | ~/.agent-memory/data/ |

_Last Updated: ${new Date().toISOString()}_
`;
  }

  private getDefaultUserProfile(): string {
    return `# User Profile

## Preferences
_Collected automatically from usage patterns_

### Code Style
- Detected automatically

### Common Commands
- Learned from usage

### Preferred Tools
- Detected from project dependencies

---
_Created: ${new Date().toISOString()}_
`;
  }
}

export interface SessionContext {
  initialized: boolean;
  timestamp: string;
  ide: string;
  project: ProjectAnalysis | null;
  identity: string;
  memory: string;
  technicalState: string;
  userProfile: string;
  knownIssues: string;
  recentSessions: string[];
  todaysSession: string;
  quickContext: string;
}

export interface ProjectAnalysis {
  path: string;
  name: string;
  description: string;
  technologies: string[];
  dependencies: string[];
  scripts: string[];
}
