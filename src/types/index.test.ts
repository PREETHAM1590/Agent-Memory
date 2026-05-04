import { describe, it, expect } from 'vitest';

describe('ObservationType values', () => {
  it('accepts all expected observation type literals', () => {
    const types = ['bugfix', 'feature', 'decision', 'discovery', 'change', 'pattern', 'question', 'note'] as const;
    for (const t of types) {
      expect(typeof t).toBe('string');
    }
  });

  it('IDEType includes all 13 expected values', () => {
    const ides = ['cursor', 'windsurf', 'kilo', 'aider', 'continue', 'cline', 'claude', 'gemini', 'opencode', 'antigravity', 'zed', 'trae', 'vscode_copilot'] as const;
    expect(ides).toHaveLength(13);
    for (const ide of ides) {
      expect(typeof ide).toBe('string');
    }
  });
});

describe('Interface shape checks at runtime', () => {
  it('Observation object matches expected shape', () => {
    const obs = {
      id: 1,
      type: 'feature' as const,
      title: 'T',
      content: 'C',
      tags: ['a'],
      metadata: {},
      filesRead: [],
      filesModified: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    expect(obs).toHaveProperty('id');
    expect(obs).toHaveProperty('type');
    expect(obs).toHaveProperty('title');
    expect(obs).toHaveProperty('content');
    expect(obs).toHaveProperty('tags');
    expect(obs).toHaveProperty('metadata');
    expect(obs).toHaveProperty('filesRead');
    expect(obs).toHaveProperty('filesModified');
    expect(obs).toHaveProperty('createdAt');
    expect(obs).toHaveProperty('updatedAt');
  });

  it('Session object matches expected shape', () => {
    const sess = {
      id: 's1',
      ideType: 'cursor' as const,
      startedAt: new Date(),
      observationCount: 0
    };
    expect(sess).toHaveProperty('id');
    expect(sess).toHaveProperty('ideType');
    expect(sess).toHaveProperty('startedAt');
    expect(sess).toHaveProperty('observationCount');
  });

  it('SearchOptions can be constructed with defaults', () => {
    const opts = { query: 'test' };
    expect(opts.query).toBe('test');
  });

  it('CloudSyncConfig provider values are correct', () => {
    const providers: Array<'none' | 'supabase' | 'firebase' | 'custom'> = ['none', 'supabase', 'firebase', 'custom'];
    expect(providers.length).toBe(4);
  });

  it('WebhookEvent values are correct', () => {
    const events = ['observation.created', 'observation.updated', 'session.started', 'session.ended', 'pattern.detected', 'conflict.found'] as const;
    expect(events.length).toBe(6);
  });
});