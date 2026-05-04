import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { MemoryDatabase } from '../database/index.js';
import { SearchOptions, ObservationType } from '../types/index.js';

export class MCPServer {
  private server: Server;
  private db: MemoryDatabase;

  constructor(db: MemoryDatabase) {
    this.db = db;
    this.server = new Server(
      { name: 'agent-memory', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
              dateStart: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              dateEnd: { type: 'string', description: 'End date (YYYY-MM-DD)' },
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
              depth: { type: 'number', default: 5, description: 'Items before and after anchor' }
            }
          }
        },
        {
          name: 'memory_get_observations',
          description: 'Fetch full observation details by IDs. ALWAYS batch multiple IDs. ~500-1000 tokens per observation',
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
              filesModified: { type: 'array', items: { type: 'string' } },
              gitCommit: { type: 'string' },
              gitBranch: { type: 'string' }
            },
            required: ['type', 'title', 'content']
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
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'memory_search':
            return await this.handleSearch(args as any);
          case 'memory_timeline':
            return await this.handleTimeline(args as any);
          case 'memory_get_observations':
            return await this.handleGetObservations(args as any);
          case 'memory_store':
            return await this.handleStore(args as any);
          case 'memory_analytics':
            return await this.handleAnalytics(args as any);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, error.message);
      }
    });
  }

  private async handleSearch(args: {
    query: string;
    type?: ObservationType;
    projectId?: string;
    tags?: string[];
    dateStart?: string;
    dateEnd?: string;
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
${obs.filesRead.length > 0 ? `Files Read: ${obs.filesRead.join(', ')}\n` : ''}${obs.filesModified.length > 0 ? `Files Modified: ${obs.filesModified.join(', ')}\n` : ''}${obs.gitCommit ? `Git: ${obs.gitCommit} (${obs.gitBranch})\n` : ''}`;
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
    gitCommit?: string;
    gitBranch?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const id = this.db.storeObservation({
      type: args.type,
      title: args.title,
      content: args.content,
      tags: args.tags || [],
      metadata: {},
      filesRead: args.filesRead || [],
      filesModified: args.filesModified || [],
      gitCommit: args.gitCommit,
      gitBranch: args.gitBranch
    });

    return {
      content: [{ type: 'text', text: `Stored observation #${id}: ${args.title}` }]
    };
  }

  private async handleAnalytics(args: {
    period?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const stats = this.db.getStats();

    const output = `Memory Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Observations: ${stats.totalObservations}
Total Sessions: ${stats.totalSessions}
Total Projects: ${stats.totalProjects}

Observation Types:
${Object.entries(stats.typeBreakdown).map(([type, count]) => `  ${this.getTypeIcon(type as ObservationType)} ${type}: ${count}`).join('\n')}`;

    return {
      content: [{ type: 'text', text: output }]
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
