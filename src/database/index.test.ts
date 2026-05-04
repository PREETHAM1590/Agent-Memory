import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemoryDatabase } from './index.js';

let db: MemoryDatabase;

beforeAll(() => {
  db = new MemoryDatabase(':memory:');
});

afterAll(() => {
  db.close();
});

describe('MemoryDatabase CRUD', () => {
  it('stores an observation and returns an id', () => {
    const id = db.storeObservation({
      type: 'feature',
      title: 'Test Feature',
      content: 'Test content',
      tags: ['test'],
      metadata: { key: 'value' },
      filesRead: [],
      filesModified: []
    });
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('gets an observation by id', () => {
    const id = db.storeObservation({
      type: 'bugfix',
      title: 'Bug Title',
      content: 'Bug content',
      tags: [],
      metadata: {},
      filesRead: [],
      filesModified: []
    });
    const obs = db.getObservation(id);
    expect(obs).not.toBeNull();
    expect(obs!.id).toBe(id);
    expect(obs!.type).toBe('bugfix');
    expect(obs!.title).toBe('Bug Title');
    expect(obs!.content).toBe('Bug content');
    expect(obs!.tags).toEqual([]);
    expect(obs!.metadata).toEqual({});
    expect(obs!.createdAt).toBeInstanceOf(Date);
    expect(obs!.updatedAt).toBeInstanceOf(Date);
  });

  it('returns null for missing observation', () => {
    expect(db.getObservation(99999)).toBeNull();
  });

  it('gets multiple observations by ids', () => {
    const id1 = db.storeObservation({ type: 'note', title: 'A', content: 'a', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    const id2 = db.storeObservation({ type: 'note', title: 'B', content: 'b', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    const obs = db.getObservations([id1, id2]);
    expect(obs).toHaveLength(2);
    expect(obs.map(o => o.title)).toContain('A');
    expect(obs.map(o => o.title)).toContain('B');
  });

  it('searchObservations with text query uses FTS5', () => {
    db.storeObservation({ type: 'discovery', title: 'unique search term alpha', content: 'body alpha', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    const results = db.searchObservations('alpha');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.title.includes('alpha'))).toBe(true);
  });

  it('empty query returns recent observations without crash', () => {
    db.storeObservation({ type: 'change', title: 'Recent 1', content: 'c1', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    db.storeObservation({ type: 'change', title: 'Recent 2', content: 'c2', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    const results = db.searchObservations('');
    expect(results.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(results[i].createdAt.getTime());
    }
  });

  it('searchObservations filters by type', () => {
    db.storeObservation({ type: 'feature', title: 'F1', content: 'c', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    db.storeObservation({ type: 'bugfix', title: 'B1', content: 'c', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    const results = db.searchObservations('', { type: 'feature' });
    expect(results.every(r => r.type === 'feature')).toBe(true);
  });

  it('searchObservations filters by projectId', () => {
    db.storeObservation({ type: 'note', title: 'P1', content: 'c', tags: [], metadata: {}, projectId: 'proj-1', filesRead: [], filesModified: [] });
    db.storeObservation({ type: 'note', title: 'P2', content: 'c', tags: [], metadata: {}, projectId: 'proj-2', filesRead: [], filesModified: [] });
    const results = db.searchObservations('', { projectId: 'proj-1' });
    expect(results.every(r => r.projectId === 'proj-1')).toBe(true);
  });

  it('searchObservations limits and offsets results', () => {
    for (let i = 0; i < 5; i++) {
      db.storeObservation({ type: 'note', title: `Limit ${i}`, content: 'c', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    }
    const limited = db.searchObservations('', { limit: 2 });
    expect(limited.length).toBe(2);
    const offset = db.searchObservations('', { limit: 2, offset: 2 });
    expect(offset.length).toBe(2);
  });

  it('listObservations returns paginated results', () => {
    const obs = db.listObservations(1, 0);
    expect(obs.length).toBe(1);
  });

  it('deleteObservation removes observation', () => {
    const id = db.storeObservation({ type: 'note', title: 'ToDelete', content: 'c', tags: [], metadata: {}, filesRead: [], filesModified: [] });
    expect(db.getObservation(id)).not.toBeNull();
    const deleted = db.deleteObservation(id);
    expect(deleted).toBe(true);
    expect(db.getObservation(id)).toBeNull();
  });

  it('deleteObservation returns false for missing id', () => {
    expect(db.deleteObservation(99999)).toBe(false);
  });

  it('getDatabaseSize returns a number', () => {
    const size = db.getDatabaseSize();
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(0);
  });
});

describe('MemoryDatabase getTimeline', () => {
  it('returns observations around an id', () => {
    const ids: number[] = [];
    for (let i = 0; i < 10; i++) {
      ids.push(db.storeObservation({ type: 'note', title: `T${i}`, content: 'c', tags: [], metadata: {}, filesRead: [], filesModified: [] }));
    }
    const mid = ids[5];
    const timeline = db.getTimeline(mid, 2);
    expect(timeline.length).toBeGreaterThanOrEqual(1);
    expect(timeline.some(o => o.id === mid)).toBe(true);
  });

  it('returns empty array for missing observation', () => {
    expect(db.getTimeline(99999)).toEqual([]);
  });
});

describe('MemoryDatabase session management', () => {
  it('creates and gets a session', () => {
    db.createSession({ id: 'sess-1', ideType: 'cursor', startedAt: new Date(), projectId: 'proj-x' });
    const sess = db.getSession('sess-1');
    expect(sess).not.toBeNull();
    expect(sess!.id).toBe('sess-1');
    expect(sess!.ideType).toBe('cursor');
    expect(sess!.projectId).toBe('proj-x');
    expect(sess!.startedAt).toBeInstanceOf(Date);
  });

  it('returns null for missing session', () => {
    expect(db.getSession('nonexistent')).toBeNull();
  });

  it('ends a session with summary', () => {
    db.createSession({ id: 'sess-end', ideType: 'claude', startedAt: new Date() });
    db.endSession('sess-end', 'Summary here');
    const sess = db.getSession('sess-end');
    expect(sess).not.toBeNull();
    expect(sess!.endedAt).toBeInstanceOf(Date);
    expect(sess!.summary).toBe('Summary here');
  });

  it('getStats returns correct counts', () => {
    const stats = db.getStats();
    expect(typeof stats.totalObservations).toBe('number');
    expect(typeof stats.totalSessions).toBe('number');
    expect(typeof stats.totalProjects).toBe('number');
    expect(typeof stats.typeBreakdown).toBe('object');
  });
});

describe('MemoryDatabase projects', () => {
  it('creates and gets a project', () => {
    db.createProject({ id: 'p1', name: 'Project One', path: '/tmp/p1' });
    const proj = db.getProject('p1');
    expect(proj).not.toBeNull();
    expect(proj!.name).toBe('Project One');
    expect(proj!.path).toBe('/tmp/p1');
  });

  it('returns null for missing project', () => {
    expect(db.getProject('missing')).toBeNull();
  });
});

describe('MemoryDatabase patterns and conflicts', () => {
  it('stores and retrieves patterns', () => {
    const id = db.storePattern({ type: 'code', pattern: 'singleton', confidence: 0.9, occurrences: 5, examples: ['a', 'b'] });
    expect(typeof id).toBe('string');
    const patterns = db.getPatterns(10);
    expect(patterns.some(p => p.pattern === 'singleton')).toBe(true);
  });

  it('stores and resolves conflicts', () => {
    const cid = db.storeConflict({ type: 'contradiction', observationIds: [1, 2], description: 'desc' });
    expect(typeof cid).toBe('string');
    let conflicts = db.getConflicts();
    expect(conflicts.some(c => c.id === cid)).toBe(true);
    db.resolveConflict(cid, 'fixed');
    conflicts = db.getConflicts();
    expect(conflicts.some(c => c.id === cid)).toBe(false);
  });
});

describe('MemoryDatabase webhooks', () => {
  it('creates and retrieves webhooks', () => {
    db.createWebhook({ url: 'http://example.com/hook', events: ['observation.created'], secret: 'shh', active: true });
    const hooks = db.getWebhooks();
    expect(hooks.some(h => h.url === 'http://example.com/hook')).toBe(true);
  });
});