import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { MemoryDatabase } from '../database/index.js';
import { SessionInitializer } from '../brain/initializer.js';
import { AgentBrainSystem } from '../brain/index.js';
import { ObservationType } from '../types/index.js';
import { homedir } from 'os';
import { join } from 'path';

export class MCPServer {
  private server: Server;
  private db: MemoryDatabase;
  private brain: AgentBrainSystem;
  private initializer: SessionInitializer;
  private sessionStarted: boolean = false;
  private rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(db: MemoryDatabase) {
    this.db = db;
    const brainDir = join(homedir(), '.agent-memory', 'brain');
    this.brain = new AgentBrainSystem(db, brainDir);
    this.initializer = new SessionInitializer();
    this.server = new Server(
      { name: 'agent-memory', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
    this.startCleanupInterval();
  }

  private checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(sessionId);
    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(sessionId, { count: 1, resetAt: now + 60000 });
      return true;
    }
    if (entry.count >= 30) {
      return false;
    }
    entry.count++;
    return true;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitMap.entries()) {
        if (now > entry.resetAt) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 60000);
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'memory_init',
          description: 'Initialize session context. Call this at the START of EVERY session to get full context including identity, memory, technical state, and recent activities. This ensures continuity across all IDEs.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: { type: 'string', description: 'Current project path' },
              projectName: { type: 'string', description: 'Current project name' }
            }
          }
        },
        {
          name: 'memory_search',
          description: 'Search memory index with filters. Returns compact results with IDs (~50-100 tokens/result)',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: { type: 'string', enum: ['bugfix', 'feature', 'decision', 'discovery', 'change', 'pattern', 'question', 'note'] },
              projectId: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              limit: { type: 'number', default: 20 }
            },
            required: ['query']
          }
        },
        {
          name: 'memory_timeline',
          description: 'Get chronological context around a specific observation',
          inputSchema: {
            type: 'object',
            properties: {
              observationId: { type: 'number' },
              query: { type: 'string', description: 'Query to find anchor if ID not provided' },
              depth: { type: 'number', default: 5 }
            }
          }
        },
        {
          name: 'memory_get_observations',
          description: 'Fetch full observation details by IDs. ALWAYS batch multiple IDs.',
          inputSchema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'number' }, description: 'Observation IDs to fetch' }
            },
            required: ['ids']
          }
        },
        {
          name: 'memory_store',
          description: 'Store a new observation in memory',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['bugfix', 'feature', 'decision', 'discovery', 'change', 'pattern', 'question', 'note'] },
              title: { type: 'string' },
              content: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              filesRead: { type: 'array', items: { type: 'string' } },
              filesModified: { type: 'array', items: { type: 'string' } }
            },
            required: ['type', 'title', 'content']
          }
        },
        {
          name: 'memory_log',
          description: 'Log an activity to the current session (decision, task, file change, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['observation', 'decision', 'task', 'file_change', 'note'] },
              content: { type: 'string', description: 'Activity description' },
              details: { type: 'string', description: 'Additional details' }
            },
            required: ['type', 'content']
          }
        },
        {
          name: 'memory_context',
          description: 'Get the full agent brain context (identity, memory, technical state, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              section: { type: 'string', enum: ['all', 'identity', 'memory', 'technical', 'issues', 'recent'], default: 'all' }
            }
          }
        },
        {
          name: 'memory_sync',
          description: 'Sync context to all installed IDEs for cross-IDE continuity',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'memory_analytics',
          description: 'Get memory analytics and statistics',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['1h', '24h', '7d', '30d', 'all'], default: '7d' }
            }
          }
        },
        {
          name: 'memory_end_session',
          description: 'End the current session and generate summary. Call this when session is complete.',
          inputSchema: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Session summary' }
            },
            required: ['summary']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const sessionId = (request.params as any).sessionId || 'default';

      if (!this.checkRateLimit(sessionId)) {
        return {
          content: [{ type: 'text', text: 'Rate limit exceeded. Max 30 requests per minute.' }]
        };
      }

      try {
        switch (name) {
          case 'memory_init':
            return await this.handleInit(args as any);
          case 'memory_search':
            return await this.handleSearch(args as any);
          case 'memory_timeline':
            return await this.handleTimeline(args as any);
          case 'memory_get_observations':
            return await this.handleGetObservations(args as any);
          case 'memory_store':
            return await this.handleStore(args as any);
          case 'memory_log':
            return await this.handleLog(args as any);
          case 'memory_context':
            return await this.handleContext(args as any);
          case 'memory_sync':
            return await this.handleSync();
          case 'memory_analytics':
            return await this.handleAnalytics();
          case 'memory_end_session':
            return await this.handleEndSession(args as any);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  private async handleInit(args: {
    projectPath?: string;
    projectName?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const context = await this.initializer.initialize({
      projectPath: args.projectPath,
      projectName: args.projectName
    });

    this.brain.startSession(args.projectName);
    this.sessionStarted = true;

    const output = `🧠 AGENT-MEMORY INITIALIZED

═══════════════════════════════════════════════════════════

## Session Information
- **IDE**: ${context.ide}
- **Project**: ${context.project?.name || 'None'}
- **Initialized**: ${context.timestamp}

## Quick Context
${context.quickContext}

## Recent Sessions
${context.recentSessions.length > 0 
  ? context.recentSessions.map(s => `- ${s}`).join('\n')
  : 'No recent sessions'}

## Technical State
- Platform: ${process.platform}
- Node: ${process.version}

═══════════════════════════════════════════════════════════

💡 Available Commands:
- memory_search: Search past observations
- memory_store: Save new observations  
- memory_log: Log session activities
- memory_context: Get full brain context
- memory_sync: Sync to all IDEs
- memory_end_session: End and summarize session

Ready for your instructions!`;

    return {
      content: [{ type: 'text', text: output }]
    };
  }

  private async handleSearch(args: {
    query: string;
    type?: ObservationType;
    projectId?: string;
    tags?: string[];
    limit?: number;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const observations = this.db.searchObservations(args.query, {
      type: args.type,
      projectId: args.projectId,
      tags: args.tags,
      limit: args.limit || 20
    });

    const lines = observations.map(obs => {
      const icon = this.getTypeIcon(obs.type);
      const time = obs.createdAt.toISOString().split('T')[0];
      return `#${obs.id} | ${icon} ${obs.type} | ${time} | ${obs.title}`;
    });

    return {
      content: [{
        type: 'text',
        text: lines.length > 0
          ? `Found ${observations.length} observations:\n${lines.join('\n')}`
          : 'No observations found matching query.'
      }]
    };
  }

  private async handleTimeline(args: {
    observationId?: number;
    query?: string;
    depth?: number;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    let targetId = args.observationId;

    if (!targetId && args.query) {
      const results = this.db.searchObservations(args.query, { limit: 1 });
      if (results.length > 0) {
        targetId = results[0].id;
      }
    }

    if (!targetId) {
      return {
        content: [{ type: 'text', text: 'No observation found for timeline.' }]
      };
    }

    const observations = this.db.getTimeline(targetId, args.depth || 5);

    const lines = observations.map(obs => {
      const icon = this.getTypeIcon(obs.type);
      const time = obs.createdAt.toISOString().split('T')[0];
      const marker = obs.id === targetId ? '>>>' : '   ';
      return `${marker} #${obs.id} | ${icon} ${obs.type} | ${time} | ${obs.title}`;
    });

    return {
      content: [{ type: 'text', text: `Timeline:\n${lines.join('\n')}` }]
    };
  }

  private async handleGetObservations(args: {
    ids: number[];
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const observations = this.db.getObservations(args.ids);

    const output = observations.map(obs => {
      return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#${obs.id} | ${this.getTypeIcon(obs.type)} ${obs.type.toUpperCase()}
Title: ${obs.title}
Date: ${obs.createdAt.toISOString()}
Tags: ${obs.tags.join(', ') || 'none'}
${obs.summary ? `Summary: ${obs.summary}\n` : ''}Content:
${obs.content}
${obs.filesRead.length > 0 ? `Files Read: ${obs.filesRead.join(', ')}\n` : ''}${obs.filesModified.length > 0 ? `Files Modified: ${obs.filesModified.join(', ')}\n` : ''}`;
    });

    return {
      content: [{ type: 'text', text: output.join('\n') }]
    };
  }

  private async handleStore(args: {
    type: ObservationType;
    title: string;
    content: string;
    tags?: string[];
    filesRead?: string[];
    filesModified?: string[];
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const id = this.db.storeObservation({
      type: args.type,
      title: args.title,
      content: args.content,
      tags: args.tags || [],
      metadata: {},
      filesRead: args.filesRead || [],
      filesModified: args.filesModified || []
    });

    this.brain.logActivity({
      type: 'observation',
      content: args.title,
      details: String(id)
    });

    return {
      content: [{ type: 'text', text: `✅ Stored observation #${id}: ${args.title}` }]
    };
  }

  private async handleLog(args: {
    type: 'observation' | 'decision' | 'task' | 'file_change' | 'note';
    content: string;
    details?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    this.brain.logActivity(args);

    return {
      content: [{ type: 'text', text: `📝 Logged ${args.type}: ${args.content}` }]
    };
  }

  private async handleContext(args: {
    section?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const section = args.section || 'all';
    const fullContext = this.brain.getFullContext();

    if (section === 'all') {
      return {
        content: [{ type: 'text', text: fullContext.slice(0, 8000) }]
      };
    }

    const sections: Record<string, string> = {
      identity: '## IDENTITY',
      memory: '## MEMORY',
      technical: '## TECHNICAL STATE',
      issues: '## KNOWN ISSUES',
      recent: '## RECENT'
    };

    const marker = sections[section];
    if (marker && fullContext.includes(marker)) {
      const start = fullContext.indexOf(marker);
      const end = Object.values(sections)
        .filter(s => s !== marker && fullContext.indexOf(s) > start)
        .map(s => fullContext.indexOf(s))
        .sort((a, b) => a - b)[0] || fullContext.length;

      return {
        content: [{ type: 'text', text: fullContext.slice(start, end) }]
      };
    }

    return {
      content: [{ type: 'text', text: fullContext.slice(0, 5000) }]
    };
  }

  private async handleSync(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const results = this.brain.syncAcrossIDEs();

    const output = `🔄 Synced to IDEs:\n\n` + 
      results.map(r => `${r.synced ? '✅' : '❌'} ${r.ide}`).join('\n');

    return {
      content: [{ type: 'text', text: output }]
    };
  }

  private async handleAnalytics(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const stats = this.db.getStats();

    const output = `📊 Memory Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Observations: ${stats.totalObservations}
Total Sessions: ${stats.totalSessions}
Total Projects: ${stats.totalProjects}

Observation Types:
${Object.entries(stats.typeBreakdown).map(([type, count]) => 
  `  ${this.getTypeIcon(type as ObservationType)} ${type}: ${count}`
).join('\n')}`;

    return {
      content: [{ type: 'text', text: output }]
    };
  }

  private async handleEndSession(args: {
    summary: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    this.brain.endSession(args.summary);
    this.sessionStarted = false;

    return {
      content: [{ type: 'text', text: `✅ Session ended and logged.\n\nSummary: ${args.summary}` }]
    };
  }

  private getTypeIcon(type: ObservationType): string {
    const icons: Record<ObservationType, string> = {
      bugfix: '🔴',
      feature: '🟢',
      decision: '🟣',
      discovery: '🔵',
      change: '🟡',
      pattern: '🟠',
      question: '❓',
      note: '📝'
    };
    return icons[type] || '⚪';
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
