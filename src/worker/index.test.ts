import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WorkerService } from './index.js';
import { MemoryDatabase } from '../database/index.js';

let db: MemoryDatabase;
let worker: WorkerService;
let workerPort: number;

beforeAll(async () => {
  db = new MemoryDatabase(':memory:');
  worker = new WorkerService(db, {
    port: 0,
    database: ':memory:',
    authToken: undefined,
    cloudSync: { enabled: false, provider: 'none' },
    summarization: { enabled: false, compressionLevel: 'medium', maxLength: 500, provider: 'local' },
    analytics: { enabled: true, retentionDays: 30 },
    learning: { enabled: true, patternExtraction: true },
    team: { enabled: false },
    plugins: []
  });
  await new Promise<void>((resolve) => {
    worker.start();
    // Wait for server to be listening and get assigned port
    const check = setInterval(() => {
      const addr = (worker as any).server.address();
      if (addr && addr.port) {
        workerPort = addr.port;
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
});

afterAll(() => {
  worker.stop();
  db.close();
});

describe('WorkerService', () => {
  it('starts without throwing', () => {
    expect(worker).toBeDefined();
  });

  it('health endpoint returns ok', async () => {
    const res = await fetch(`http://127.0.0.1:${workerPort}/api/health`);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.status).toBe('ok');
    expect(json).toHaveProperty('timestamp');
  });

  it('CORS allows localhost origin', async () => {
    const res = await fetch(`http://127.0.0.1:${workerPort}/api/health`, {
      headers: { Origin: 'http://localhost:3000' }
    });
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });

  it('observations endpoint returns array', async () => {
    const res = await fetch(`http://127.0.0.1:${workerPort}/api/observations`);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });

  it('stats endpoint returns object with counts', async () => {
    const res = await fetch(`http://127.0.0.1:${workerPort}/api/stats`);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json).toHaveProperty('totalObservations');
    expect(json).toHaveProperty('totalSessions');
    expect(json).toHaveProperty('totalProjects');
  });
});