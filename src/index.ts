export { MemoryDatabase } from './database/index.js';
export { MCPServer } from './mcp/server.js';
export { WorkerService } from './worker/index.js';
export { AutoInstaller } from './installer/index.js';
export { Summarizer } from './summarizer/index.js';
export { PatternExtractor } from './learning/patterns.js';
export { GitIntegration } from './git/index.js';
export { CloudSync, TeamSharing } from './cloud/index.js';
export { AgentBrainSystem } from './brain/index.js';
export { SessionInitializer } from './brain/initializer.js';

export * from './types/index.js';

import { MemoryDatabase } from './database/index.js';
import { Summarizer } from './summarizer/index.js';
import { GitIntegration } from './git/index.js';
import { PatternExtractor } from './learning/patterns.js';
import { Observation, ObservationType, SearchOptions } from './types/index.js';

export class AgentMemory {
  private db: MemoryDatabase;
  private summarizer?: Summarizer;
  private git: GitIntegration;
  private patternExtractor: PatternExtractor;

  constructor(options: { database: string; aiProvider?: 'openai' | 'anthropic' }) {
    this.db = new MemoryDatabase(options.database);
    this.git = new GitIntegration();
    this.patternExtractor = new PatternExtractor(this.db);

    if (options.aiProvider) {
      this.summarizer = new Summarizer(options.aiProvider);
    }
  }

  async store(observation: {
    type: ObservationType;
    title: string;
    content: string;
    tags?: string[];
    filesRead?: string[];
    filesModified?: string[];
    projectId?: string;
    sessionId?: string;
  }): Promise<Observation> {
    const gitContext = this.git.getContext();

    let tags = observation.tags || [];
    let summary: string | undefined;

    if (this.summarizer) {
      const tempObs = { ...observation, id: 0, tags: [], metadata: {}, filesRead: [], filesModified: [], createdAt: new Date(), updatedAt: new Date() };
      const result = await this.summarizer.summarize(tempObs);
      summary = result.summary;
      tags = [...tags, ...result.suggestedTags];
    }

    const id = this.db.storeObservation({
      type: observation.type,
      title: observation.title,
      content: observation.content,
      summary,
      tags,
      metadata: {},
      projectId: observation.projectId,
      sessionId: observation.sessionId,
      gitCommit: gitContext.commit,
      gitBranch: gitContext.branch,
      gitRemote: gitContext.remote,
      filesRead: observation.filesRead || [],
      filesModified: observation.filesModified || []
    });

    return this.db.getObservation(id)!;
  }

  search(query: string, options?: Partial<SearchOptions>): Observation[] {
    return this.db.searchObservations(query, options);
  }

  get(id: number): Observation | null {
    return this.db.getObservation(id);
  }

  getMany(ids: number[]): Observation[] {
    return this.db.getObservations(ids);
  }

  timeline(observationId: number, depth?: number): Observation[] {
    return this.db.getTimeline(observationId, depth);
  }

  analyze(): { patterns: number; recentActivity: Observation[] } {
    const recentActivity = this.search('', { limit: 10 });
    const patterns = this.patternExtractor.extractPatterns(recentActivity);

    return {
      patterns: patterns.length,
      recentActivity
    };
  }

  stats(): {
    totalObservations: number;
    totalSessions: number;
    totalProjects: number;
    typeBreakdown: Record<string, number>;
  } {
    return this.db.getStats();
  }

  close(): void {
    this.db.close();
  }
}
