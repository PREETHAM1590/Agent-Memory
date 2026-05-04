import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPServer } from './server.js';
import { MemoryDatabase } from '../database/index.js';

let db: MemoryDatabase;
let server: MCPServer;

beforeAll(() => {
  db = new MemoryDatabase(':memory:');
  server = new MCPServer(db);
});

afterAll(() => {
  db.close();
});

describe('MCPServer initialization', () => {
  it('initializes without error', () => {
    expect(server).toBeDefined();
  });

  it('has a start method', () => {
    expect(typeof server.start).toBe('function');
  });
});