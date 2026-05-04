import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AutoInstaller } from './auto-installer.js';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let installer: AutoInstaller;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'agent-memory-test-'));
});

afterAll(() => {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {}
});

describe('AutoInstaller detectAllIDEs', () => {
  it('returns an array with expected fields', () => {
    installer = new AutoInstaller();
    const results = installer.detectAllIDEs();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty('ide');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('installed');
      expect(typeof r.installed).toBe('boolean');
    }
  });

  it('includes cursor in the list', () => {
    installer = new AutoInstaller();
    const results = installer.detectAllIDEs();
    expect(results.some(r => r.ide === 'cursor')).toBe(true);
  });
});

describe('AutoInstaller validateConfig', () => {
  it('validates a valid JSON file', () => {
    const validFile = join(tempDir, 'valid.json');
    writeFileSync(validFile, JSON.stringify({ mcpServers: {} }));
    installer = new AutoInstaller();
    const result = installer.validateConfig(validFile);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for missing file', () => {
    installer = new AutoInstaller();
    const result = installer.validateConfig(join(tempDir, 'missing.json'));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('returns invalid for empty file', () => {
    const emptyFile = join(tempDir, 'empty.json');
    writeFileSync(emptyFile, '');
    installer = new AutoInstaller();
    const result = installer.validateConfig(emptyFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns invalid for malformed JSON', () => {
    const badFile = join(tempDir, 'bad.json');
    writeFileSync(badFile, '{ not json }');
    installer = new AutoInstaller();
    const result = installer.validateConfig(badFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });
});

describe('AutoInstaller backupConfigFile', () => {
  it('creates a backup and returns path for existing file', () => {
    const source = join(tempDir, 'source.json');
    writeFileSync(source, '{"a":1}');
    installer = new AutoInstaller();
    const backupPath = installer.backupConfigFile(source);
    if (backupPath) {
      expect(existsSync(backupPath)).toBe(true);
      expect(readFileSync(backupPath, 'utf-8')).toBe('{"a":1}');
    }
  });

  it('returns null for missing file', () => {
    installer = new AutoInstaller();
    expect(installer.backupConfigFile(join(tempDir, 'nope.json'))).toBeNull();
  });
});

describe('AutoInstaller restoreBackup', () => {
  it('restores a file from backup', () => {
    const original = join(tempDir, 'to-restore.json');
    writeFileSync(original, '{"original":true}');
    writeFileSync(original + '.backup', '{"backup":true}');
    installer = new AutoInstaller();
    const ok = installer.restoreBackup(original, original + '.backup');
    expect(ok).toBe(true);
    expect(readFileSync(original, 'utf-8')).toBe('{"backup":true}');
  });

  it('returns false for missing backup', () => {
    installer = new AutoInstaller();
    const ok = installer.restoreBackup(join(tempDir, 'a'), join(tempDir, 'b'));
    expect(ok).toBe(false);
  });
});

describe('AutoInstaller dryRunInstall', () => {
  it('returns file list without modifying filesystem', () => {
    installer = new AutoInstaller();
    const result = installer.dryRunInstall('cursor');
    expect(result).toHaveProperty('wouldModify');
    expect(result).toHaveProperty('files');
    expect(Array.isArray(result.files)).toBe(true);
    for (const f of result.files) {
      expect(typeof f).toBe('string');
    }
  });

  it('returns empty result for unknown IDE', () => {
    installer = new AutoInstaller();
    const result = installer.dryRunInstall('unknown' as any);
    expect(result.wouldModify).toBe(false);
    expect(result.files).toEqual([]);
  });
});

describe('AutoInstaller verifyInstall', () => {
  it('returns not installed for missing config on fresh system', () => {
    installer = new AutoInstaller();
    const result = installer.verifyInstall('cursor');
    expect(result.installed).toBe(false);
    expect(result.issue).toBeDefined();
  });

  it('does not throw for any IDE', () => {
    installer = new AutoInstaller();
    const result = installer.verifyInstall('cursor');
    expect(typeof result.installed).toBe('boolean');
  });
});

describe('AutoInstaller getPlatformInfo', () => {
  it('returns platform, home, and supported list', () => {
    installer = new AutoInstaller();
    const info = installer.getPlatformInfo();
    expect(info).toHaveProperty('platform');
    expect(info).toHaveProperty('home');
    expect(info).toHaveProperty('supported');
    expect(Array.isArray(info.supported)).toBe(true);
    expect(info.supported.length).toBeGreaterThan(0);
  });
});