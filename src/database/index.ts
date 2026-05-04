import Database from 'better-sqlite3';
import {Observation, Session, Project, Team, Webhook, ObservedPattern, Conflict, ObservationType, IDEType} from '../types';

export class MemoryDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        project_id TEXT,
        session_id TEXT,
        git_commit TEXT,
        git_branch TEXT,
        git_remote TEXT,
        files_read TEXT DEFAULT '[]',
        files_modified TEXT DEFAULT '[]',
        embedding BLOB,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
      CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project_id);
      CREATE INDEX IF NOT EXISTS idx_observations_session ON observations(session_id);
      CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        ide_type TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        summary TEXT,
        observation_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        description TEXT,
        template_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        members TEXT DEFAULT '[]',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT,
        active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS patterns (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        confidence REAL DEFAULT 0.5,
        occurrences INTEGER DEFAULT 1,
        first_seen INTEGER DEFAULT (strftime('%s', 'now')),
        last_seen INTEGER DEFAULT (strftime('%s', 'now')),
        examples TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS conflicts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        observation_ids TEXT NOT NULL,
        description TEXT NOT NULL,
        resolution TEXT,
        detected_at INTEGER DEFAULT (strftime('%s', 'now')),
        resolved_at INTEGER
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
        title,
        content,
        summary,
        tags,
        content_rowid='id',
        tokenize='porter unicode61'
      );

      CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
        INSERT INTO observations_fts(rowid, title, content, summary, tags)
        VALUES (new.id, new.title, new.content, new.summary, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, content, summary, tags)
        VALUES('delete', old.id, old.title, old.content, old.summary, old.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_au AFTER UPDATE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, content, summary, tags)
        VALUES('delete', old.id, old.title, old.content, old.summary, old.tags);
        INSERT INTO observations_fts(rowid, title, content, summary, tags)
        VALUES (new.id, new.title, new.content, new.summary, new.tags);
      END;
    `);
  }

  storeObservation(obs: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO observations (
        type, title, content, summary, tags, metadata,
        project_id, session_id, git_commit, git_branch, git_remote,
        files_read, files_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      obs.type,
      obs.title,
      obs.content,
      obs.summary || null,
      JSON.stringify(obs.tags),
      JSON.stringify(obs.metadata),
      obs.projectId || null,
      obs.sessionId || null,
      obs.gitCommit || null,
      obs.gitBranch || null,
      obs.gitRemote || null,
      JSON.stringify(obs.filesRead),
      JSON.stringify(obs.filesModified)
    );

    return result.lastInsertRowid as number;
  }

  getObservation(id: number): Observation | null {
    const stmt = this.db.prepare('SELECT * FROM observations WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToObservation(row) : null;
  }

  getObservations(ids: number[]): Observation[] {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`SELECT * FROM observations WHERE id IN (${placeholders})`);
    const rows = stmt.all(...ids) as any[];
    return rows.map(row => this.rowToObservation(row));
  }

  searchObservations(query: string, options: {
    type?: ObservationType;
    projectId?: string;
    sessionId?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Observation[] {
    let sql = `
      SELECT o.* FROM observations o
      JOIN observations_fts fts ON o.id = fts.rowid
      WHERE observations_fts MATCH ?
    `;
    const params: any[] = [query];

    if (options.type) {
      sql += ' AND o.type = ?';
      params.push(options.type);
    }
    if (options.projectId) {
      sql += ' AND o.project_id = ?';
      params.push(options.projectId);
    }
    if (options.sessionId) {
      sql += ' AND o.session_id = ?';
      params.push(options.sessionId);
    }

    sql += ' ORDER BY o.created_at DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToObservation(row));
  }

  getTimeline(observationId: number, depth: number = 5): Observation[] {
    const center = this.getObservation(observationId);
    if (!center) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM observations
      WHERE id BETWEEN ? AND ?
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(observationId - depth, observationId + depth) as any[];
    return rows.map(row => this.rowToObservation(row));
  }

  createSession(session: Omit<Session, 'observationCount'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (id, project_id, ide_type, started_at, ended_at, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.projectId || null,
      session.ideType,
      Math.floor(session.startedAt.getTime() / 1000),
      session.endedAt ? Math.floor(session.endedAt.getTime() / 1000) : null,
      session.summary || null
    );
  }

  endSession(id: string, summary?: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET ended_at = strftime('%s', 'now'), summary = ?, observation_count = (
        SELECT COUNT(*) FROM observations WHERE session_id = ?
      )
      WHERE id = ?
    `);
    stmt.run(summary || null, id, id);
  }

  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      ideType: row.ide_type as IDEType,
      startedAt: new Date(row.started_at * 1000),
      endedAt: row.ended_at ? new Date(row.ended_at * 1000) : undefined,
      summary: row.summary,
      observationCount: row.observation_count
    };
  }

  createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, path, description, template_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(project.id, project.name, project.path, project.description || null, project.templateId || null);
  }

  getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      templateId: row.template_id,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }

  storePattern(pattern: Omit<ObservedPattern, 'id' | 'firstSeen' | 'lastSeen'>): string {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO patterns (id, type, pattern, confidence, occurrences, examples)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, pattern.type, pattern.pattern, pattern.confidence, pattern.occurrences, JSON.stringify(pattern.examples));
    return id;
  }

  getPatterns(limit: number = 20): ObservedPattern[] {
    const stmt = this.db.prepare('SELECT * FROM patterns ORDER BY confidence DESC, occurrences DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      pattern: row.pattern,
      confidence: row.confidence,
      occurrences: row.occurrences,
      firstSeen: new Date(row.first_seen * 1000),
      lastSeen: new Date(row.last_seen * 1000),
      examples: JSON.parse(row.examples)
    }));
  }

  storeConflict(conflict: Omit<Conflict, 'id' | 'detectedAt'>): string {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO conflicts (id, type, observation_ids, description, resolution)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, conflict.type, JSON.stringify(conflict.observationIds), conflict.description, conflict.resolution || null);
    return id;
  }

  getConflicts(): Conflict[] {
    const stmt = this.db.prepare('SELECT * FROM conflicts WHERE resolved_at IS NULL');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      observationIds: JSON.parse(row.observation_ids),
      description: row.description,
      resolution: row.resolution,
      detectedAt: new Date(row.detected_at * 1000),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at * 1000) : undefined
    }));
  }

  resolveConflict(id: string, resolution: string): void {
    const stmt = this.db.prepare(`
      UPDATE conflicts SET resolution = ?, resolved_at = strftime('%s', 'now') WHERE id = ?
    `);
    stmt.run(resolution, id);
  }

  createWebhook(webhook: Omit<Webhook, 'id'>): string {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO webhooks (id, url, events, secret, active)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, webhook.url, JSON.stringify(webhook.events), webhook.secret || null, webhook.active ? 1 : 0);
    return id;
  }

  getWebhooks(): Webhook[] {
    const stmt = this.db.prepare('SELECT * FROM webhooks WHERE active = 1');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      url: row.url,
      events: JSON.parse(row.events),
      secret: row.secret,
      active: row.active === 1
    }));
  }

  getStats(): { totalObservations: number; totalSessions: number; totalProjects: number; typeBreakdown: Record<string, number> } {
    const totalObservations = (this.db.prepare('SELECT COUNT(*) as count FROM observations').get() as any).count;
    const totalSessions = (this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as any).count;
    const totalProjects = (this.db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;

    const typeRows = this.db.prepare('SELECT type, COUNT(*) as count FROM observations GROUP BY type').all() as any[];
    const typeBreakdown: Record<string, number> = {};
    for (const row of typeRows) {
      typeBreakdown[row.type] = row.count;
    }

    return { totalObservations, totalSessions, totalProjects, typeBreakdown };
  }

  close(): void {
    this.db.close();
  }

  private rowToObservation(row: any): Observation {
    return {
      id: row.id,
      type: row.type as ObservationType,
      title: row.title,
      content: row.content,
      summary: row.summary || undefined,
      tags: JSON.parse(row.tags),
      metadata: JSON.parse(row.metadata),
      projectId: row.project_id || undefined,
      sessionId: row.session_id || undefined,
      gitCommit: row.git_commit || undefined,
      gitBranch: row.git_branch || undefined,
      gitRemote: row.git_remote || undefined,
      filesRead: JSON.parse(row.files_read),
      filesModified: JSON.parse(row.files_modified),
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}
