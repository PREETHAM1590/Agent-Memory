import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Observation, Session } from '../types/index.js';
import { MemoryDatabase } from '../database/index.js';

export interface AgentBrain {
  identity: AgentIdentity;
  memory: AgentMemory;
  technical: TechnicalState;
  workflows: WorkflowState;
  sessions: SessionLog[];
  userProfile: UserProfile;
}

export interface AgentIdentity {
  name: string;
  version: string;
  purpose: string;
  capabilities: string[];
  rules: string[];
}

export interface AgentMemory {
  currentProject: string | null;
  recentProjects: ProjectContext[];
  activeServices: ServiceStatus[];
  pendingTasks: Task[];
  importantContext: string[];
}

export interface ProjectContext {
  name: string;
  path: string;
  lastAccessed: Date;
  summary: string;
  technologies: string[];
  recentObservations: number[];
  openIssues: string[];
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  url?: string;
  lastChecked: Date;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  notes: string[];
}

export interface TechnicalState {
  environment: 'development' | 'staging' | 'production';
  vpsStatus?: {
    host: string;
    connected: boolean;
    services: string[];
  };
  dockerContainers: ContainerStatus[];
  databases: DatabaseConnection[];
  apis: APIEndpoint[];
  knownIssues: KnownIssue[];
}

export interface ContainerStatus {
  name: string;
  image: string;
  status: 'running' | 'stopped';
  ports: number[];
}

export interface DatabaseConnection {
  name: string;
  type: string;
  host: string;
  port: number;
  status: 'connected' | 'disconnected';
}

export interface APIEndpoint {
  name: string;
  url: string;
  method: string;
  status: 'working' | 'deprecated' | 'error';
}

export interface KnownIssue {
  id: string;
  description: string;
  solution: string;
  occurredAt: Date;
  occurrences: number;
}

export interface WorkflowState {
  current: string | null;
  available: string[];
  history: WorkflowExecution[];
}

export interface WorkflowExecution {
  name: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  steps: StepResult[];
}

export interface StepResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
}

export interface SessionLog {
  date: string;
  project: string;
  summary: string;
  observations: number[];
  tasksCompleted: string[];
  tasksPending: string[];
  decisions: string[];
  filesModified: string[];
  startedAt: Date;
  endedAt?: Date;
}

export interface UserProfile {
  name: string;
  preferences: Record<string, any>;
  codeStyle: Record<string, string>;
  commonPatterns: string[];
  shortcuts: Record<string, string>;
}

export class AgentBrainSystem {
  private brainDir: string;
  private db: MemoryDatabase;
  private currentSession: SessionLog | null = null;

  constructor(db: MemoryDatabase, workspacePath?: string) {
    this.db = db;
    this.brainDir = workspacePath 
      ? join(workspacePath, '.agent-brain')
      : join(homedir(), '.agent-memory', 'brain');
    this.ensureBrainStructure();
  }

  private ensureBrainStructure(): void {
    if (!existsSync(this.brainDir)) {
      mkdirSync(this.brainDir, { recursive: true });
    }

    const subdirs = ['sessions', 'workflows', 'context'];
    for (const dir of subdirs) {
      const path = join(this.brainDir, dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }

    this.ensureCoreFiles();
  }

  private ensureCoreFiles(): void {
    const files: Record<string, string> = {
      'IDENTITY.md': this.getDefaultIdentity(),
      'MEMORY.md': this.getDefaultMemory(),
      'TECHNICAL_STATE.md': this.getDefaultTechnicalState(),
      'USER_PROFILE.md': this.getDefaultUserProfile(),
      'KNOWN_ISSUES.md': '# Known Issues\n\nDocument any recurring issues and their solutions here.\n',
      'ARBORESCENCE.md': this.generateArborescence()
    };

    for (const [filename, content] of Object.entries(files)) {
      const filepath = join(this.brainDir, filename);
      if (!existsSync(filepath)) {
        writeFileSync(filepath, content);
      }
    }
  }

  private getDefaultIdentity(): string {
    return `# Agent-Memory Identity

## Name
Agent-Memory Assistant

## Purpose
Persistent AI assistant with cross-session, cross-IDE memory capabilities.

## Capabilities
- Remember all past sessions and decisions
- Track project state across IDEs
- Maintain technical context
- Auto-organize knowledge
- Provide contextual assistance

## Rules
1. Always check MEMORY.md before starting work
2. Log important decisions to session file
3. Update ARBORESCENCE.md when project structure changes
4. Keep TECHNICAL_STATE.md synchronized with actual state
5. Document known issues immediately when discovered

## Behavior
- Proactive: Anticipate user needs based on patterns
- Consistent: Maintain same context across all IDEs
- Organized: Keep all knowledge structured and searchable
`;
  }

  private getDefaultMemory(): string {
    return `# Agent Memory

## Current Context

### Active Project
\`\`\`
No active project detected
\`\`\`

### Recent Projects
| Project | Last Accessed | Status |
|---------|---------------|--------|
| - | - | - |

### Pending Tasks
- [ ] No pending tasks

### Important Context
> This section is auto-populated from observations

---

## Session History

Sessions are logged in \`sessions/\` directory by date.
`;
  }

  private getDefaultTechnicalState(): string {
    return `# Technical State

## Environment
- Mode: development
- Platform: ${process.platform}
- Node: ${process.version}

## Services
| Service | Status | Port | Last Checked |
|---------|--------|------|--------------|
| Agent-Memory Worker | unknown | 37800 | - |

## Docker
\`\`\`bash
docker ps -a
\`\`\`

## Databases
| Name | Type | Status |
|------|------|--------|
| memory.db | SQLite | active |

## Known Issues
See KNOWN_ISSUES.md for detailed issue tracking.

---
Last Updated: ${new Date().toISOString()}
`;
  }

  private getDefaultUserProfile(): string {
    return `# User Profile

## Preferences
This file stores user-specific preferences and patterns.

### Code Style
- Language: auto-detect
- Formatter: prettier
- Linter: eslint

### Common Patterns
Patterns will be auto-detected from usage.

### Shortcuts
Custom shortcuts can be defined here.

---
Profile created: ${new Date().toISOString()}
`;
  }

  private generateArborescence(): string {
    const cwd = process.cwd();
    let structure = '# Workspace Structure\n\n```\n';
    structure += this.listDirectory(cwd, 0, 3);
    structure += '```\n\n---\nGenerated: ' + new Date().toISOString();
    return structure;
  }

  private listDirectory(dir: string, depth: number, maxDepth: number): string {
    if (depth > maxDepth) return '';
    
    let result = '';
    const indent = '  '.repeat(depth);
    
    try {
      const entries = readdirSync(dir).filter(e => 
        !e.startsWith('.') && 
        !['node_modules', 'dist', 'build', '.git'].includes(e)
      );

      for (const entry of entries.slice(0, 20)) {
        const path = join(dir, entry);
        try {
          const isDir = statSync(path).isDirectory();
          result += `${indent}${isDir ? '📁' : '📄'} ${entry}\n`;
          if (isDir && depth < maxDepth) {
            result += this.listDirectory(path, depth + 1, maxDepth);
          }
        } catch {}
      }
    } catch {}
    
    return result;
  }

  startSession(projectName?: string, ideType?: string): string {
    const today = new Date().toISOString().split('T')[0];
    const sessionFile = join(this.brainDir, 'sessions', `${today}.md`);
    
    const existingSession = existsSync(sessionFile);
    
    if (!existingSession) {
      const header = `# Session Log - ${today}

## Overview
- **Started**: ${new Date().toLocaleTimeString()}
- **Project**: ${projectName || 'Unknown'}
- **IDE**: ${ideType || 'Unknown'}
- **Status**: Active

## Context at Start
${this.generateSessionContext()}

## Activities

`;
      writeFileSync(sessionFile, header);
    } else {
      appendFileSync(sessionFile, `\n### Session Resumed: ${new Date().toLocaleTimeString()}\n\n`);
    }

    this.currentSession = {
      date: today,
      project: projectName || 'Unknown',
      summary: '',
      observations: [],
      tasksCompleted: [],
      tasksPending: [],
      decisions: [],
      filesModified: [],
      startedAt: new Date()
    };

    this.updateMemoryFile('currentSession', today);
    
    return sessionFile;
  }

  private generateSessionContext(): string {
    const recentObs = this.db.searchObservations('', { limit: 5 });
    const stats = this.db.getStats();
    
    let context = `
### Memory Statistics
- Total Observations: ${stats.totalObservations}
- Sessions: ${stats.totalSessions}

### Recent Activity
`;
    
    for (const obs of recentObs) {
      context += `- #${obs.id}: ${obs.title}\n`;
    }
    
    return context;
  }

  logActivity(activity: {
    type: 'observation' | 'decision' | 'task' | 'file_change' | 'note';
    content: string;
    details?: string;
  }): void {
    if (!this.currentSession) return;

    const today = new Date().toISOString().split('T')[0];
    const sessionFile = join(this.brainDir, 'sessions', `${today}.md`);
    
    const timestamp = new Date().toLocaleTimeString();
    let entry = `\n#### [${timestamp}] ${activity.type.toUpperCase()}\n\n`;
    entry += `${activity.content}\n`;
    if (activity.details) {
      entry += `\n\`\`\`\n${activity.details}\n\`\`\`\n`;
    }
    
    appendFileSync(sessionFile, entry);

    switch (activity.type) {
      case 'decision':
        this.currentSession.decisions.push(activity.content);
        break;
      case 'task':
        this.currentSession.tasksCompleted.push(activity.content);
        break;
      case 'file_change':
        this.currentSession.filesModified.push(activity.content);
        break;
      case 'observation':
        if (activity.details) {
          this.currentSession.observations.push(parseInt(activity.details) || 0);
        }
        break;
    }
  }

  endSession(summary: string): void {
    if (!this.currentSession) return;

    const today = this.currentSession.date;
    const sessionFile = join(this.brainDir, 'sessions', `${today}.md`);
    
    const endContent = `

---

## Session Summary

${summary}

### Statistics
- Decisions Made: ${this.currentSession.decisions.length}
- Tasks Completed: ${this.currentSession.tasksCompleted.length}
- Files Modified: ${this.currentSession.filesModified.length}

### Pending Tasks
${this.currentSession.tasksPending.map(t => `- [ ] ${t}`).join('\n') || 'None'}

---
**Session Ended**: ${new Date().toLocaleTimeString()}
`;

    appendFileSync(sessionFile, endContent);

    this.updateMemoryFile('lastSession', today);
    this.currentSession = null;
  }

  updateMemoryFile(key: string, value: any): void {
    const memoryFile = join(this.brainDir, 'MEMORY.md');
    let content = '';
    
    if (existsSync(memoryFile)) {
      content = readFileSync(memoryFile, 'utf-8');
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (key === 'currentProject') {
      content = content.replace(
        /### Active Project[\s\S]*?(?=###|$)/,
        `### Active Project\n\`${value}\`\n\nLast Updated: ${today}\n\n`
      );
    }

    writeFileSync(memoryFile, content);
  }

  updateTechnicalState(updates: Partial<TechnicalState>): void {
    const techFile = join(this.brainDir, 'TECHNICAL_STATE.md');
    let content = existsSync(techFile) 
      ? readFileSync(techFile, 'utf-8') 
      : this.getDefaultTechnicalState();

    content += `\n\n## State Update - ${new Date().toISOString()}\n`;
    content += '```json\n' + JSON.stringify(updates, null, 2) + '\n```\n';

    writeFileSync(techFile, content);
  }

  addKnownIssue(issue: KnownIssue): void {
    const issuesFile = join(this.brainDir, 'KNOWN_ISSUES.md');
    
    const entry = `
## Issue: ${issue.id}
**Description**: ${issue.description}
**Solution**: ${issue.solution}
**Occurred**: ${issue.occurredAt.toISOString()}
**Occurrences**: ${issue.occurrences}

---
`;

    appendFileSync(issuesFile, entry);
  }

  getFullContext(): string {
    const files = ['IDENTITY.md', 'MEMORY.md', 'TECHNICAL_STATE.md', 'USER_PROFILE.md', 'KNOWN_ISSUES.md'];
    
    let context = '# AGENT BRAIN CONTEXT\n\n';
    
    for (const file of files) {
      const filepath = join(this.brainDir, file);
      if (existsSync(filepath)) {
        context += `\n## ${file.replace('.md', '')}\n\n`;
        context += readFileSync(filepath, 'utf-8');
        context += '\n\n---\n';
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const sessionFile = join(this.brainDir, 'sessions', `${today}.md`);
    if (existsSync(sessionFile)) {
      context += `\n## TODAY'S SESSION\n\n`;
      context += readFileSync(sessionFile, 'utf-8');
    }

    return context;
  }

  getContextForIDE(ideType: string): string {
    const fullContext = this.getFullContext();
    const stats = this.db.getStats();
    const recentObs = this.db.searchObservations('', { limit: 10 });

    return `# Agent-Memory Context for ${ideType}

## Quick Status
- **Total Observations**: ${stats.totalObservations}
- **Total Sessions**: ${stats.totalSessions}
- **Active Since**: ${this.currentSession?.startedAt || 'Not started'}

## Recent Observations
${recentObs.map(o => `- #${o.id} [${o.type}]: ${o.title}`).join('\n')}

## Full Context
${fullContext.slice(0, 5000)}
`;
  }

  syncAcrossIDEs(): { ide: string; synced: boolean }[] {
    const ideConfigs = [
      { name: 'cursor', dir: '.cursor' },
      { name: 'windsurf', dir: '.windsurf' },
      { name: 'claude', dir: '.claude' },
      { name: 'kilo', dir: '.kilo' },
    ];

    const results: { ide: string; synced: boolean }[] = [];
    const context = this.getContextForIDE('all');

    for (const { name, dir } of ideConfigs) {
      const ideDir = join(homedir(), dir);
      if (existsSync(ideDir)) {
        const contextFile = join(ideDir, 'AGENT_CONTEXT.md');
        try {
          writeFileSync(contextFile, context);
          results.push({ ide: name, synced: true });
        } catch {
          results.push({ ide: name, synced: false });
        }
      }
    }

    return results;
  }
}
