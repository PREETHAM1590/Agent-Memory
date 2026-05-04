export interface Observation {
  id: number;
  type: ObservationType;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  projectId?: string;
  sessionId?: string;
  gitCommit?: string;
  gitBranch?: string;
  gitRemote?: string;
  filesRead: string[];
  filesModified: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ObservationType = 
  | 'bugfix'
  | 'feature'
  | 'decision'
  | 'discovery'
  | 'change'
  | 'pattern'
  | 'question'
  | 'note';

export interface Session {
  id: string;
  projectId?: string;
  ideType: IDEType;
  startedAt: Date;
  endedAt?: Date;
  summary?: string;
  observationCount: number;
}

export type IDEType = 
  | 'cursor'
  | 'windsurf'
  | 'kilo'
  | 'aider'
  | 'continue'
  | 'cline'
  | 'claude'
  | 'gemini'
  | 'opencode'
  | 'antigravity'
  | 'zed'
  | 'trae'
  | 'vscode_copilot';

export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchOptions {
  query: string;
  type?: ObservationType;
  projectId?: string;
  sessionId?: string;
  tags?: string[];
  dateStart?: Date;
  dateEnd?: Date;
  limit?: number;
  offset?: number;
  useVectorSearch?: boolean;
}

export interface SearchResult {
  observations: Observation[];
  total: number;
  hasMore: boolean;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface CloudSyncConfig {
  enabled: boolean;
  provider: 'none' | 'supabase' | 'firebase' | 'custom';
  endpoint?: string;
  apiKey?: string;
  syncInterval?: number;
}

export interface SummarizationConfig {
  enabled: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  maxLength: number;
  provider: 'openai' | 'anthropic' | 'local';
}

export interface AnalyticsConfig {
  enabled: boolean;
  retentionDays: number;
}

export interface Config {
  port: number;
  database: string;
  authToken?: string;
  cloudSync: CloudSyncConfig;
  summarization: SummarizationConfig;
  analytics: AnalyticsConfig;
  learning: {
    enabled: boolean;
    patternExtraction: boolean;
  };
  team: {
    enabled: boolean;
  };
  plugins: string[];
  safeMode?: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
}

export type WebhookEvent = 
  | 'observation.created'
  | 'observation.updated'
  | 'session.started'
  | 'session.ended'
  | 'pattern.detected'
  | 'conflict.found';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ObservedPattern {
  id: string;
  type: 'code' | 'decision' | 'workflow';
  pattern: string;
  confidence: number;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: string[];
}

export interface Conflict {
  id: string;
  type: 'contradiction' | 'deprecated' | 'superseded';
  observationIds: number[];
  description: string;
  resolution?: string;
  detectedAt: Date;
  resolvedAt?: Date;
}
