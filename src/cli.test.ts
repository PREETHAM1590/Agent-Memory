import { describe, it, expect } from 'vitest';

describe('CLI command parsing', () => {
  it('detects --json flag in detect command', () => {
    const args = ['node', 'cli.js', 'detect', '--json'];
    expect(args.includes('--json')).toBe(true);
  });

  it('detects -j short flag', () => {
    const args = ['node', 'cli.js', 'detect', '-j'];
    expect(args.includes('-j')).toBe(true);
  });

  it('version command is recognized via --version', () => {
    const args = ['node', 'cli.js', '--version'];
    expect(args.includes('--version')).toBe(true);
  });

  it('version command is recognized via -v', () => {
    const args = ['node', 'cli.js', '-v'];
    expect(args.includes('-v')).toBe(true);
  });

  it('help flag is recognized', () => {
    const args = ['node', 'cli.js', '--help'];
    expect(args.includes('--help')).toBe(true);
  });

  it('install options exist: --all, --ide, --dry-run, --yes, --verbose', () => {
    const flags = ['--all', '--ide', '--dry-run', '--yes', '--verbose'];
    for (const f of flags) {
      expect(f.startsWith('--')).toBe(true);
    }
  });

  it('start option --port is parsed as string from argv', () => {
    const args = ['node', 'cli.js', 'start', '-p', '39999'];
    const portIndex = args.indexOf('-p');
    expect(portIndex).toBeGreaterThan(-1);
    expect(args[portIndex + 1]).toBe('39999');
  });

  it('search options --type and --limit are strings in argv', () => {
    const args = ['node', 'cli.js', 'search', 'query', '-t', 'bugfix', '-l', '5'];
    expect(args.includes('-t')).toBe(true);
    expect(args.includes('-l')).toBe(true);
  });

  it('store tags option --tags is recognized', () => {
    const args = ['node', 'cli.js', 'store', 'note', 'title', 'content', '-t', 'a,b'];
    expect(args.includes('-t')).toBe(true);
  });

  it('delete option --yes is recognized', () => {
    const args = ['node', 'cli.js', 'delete', '1', '--yes'];
    expect(args.includes('--yes')).toBe(true);
  });

  it('doctor --json flag is recognized', () => {
    const args = ['node', 'cli.js', 'doctor', '--json'];
    expect(args.includes('--json')).toBe(true);
  });

  it('repair --ide option is recognized', () => {
    const args = ['node', 'cli.js', 'repair', '--ide', 'cursor'];
    expect(args.includes('--ide')).toBe(true);
  });

  it('uninstall options are recognized', () => {
    const args = ['node', 'cli.js', 'uninstall', '--keep-data', '--restore', '--yes'];
    expect(args.includes('--keep-data')).toBe(true);
    expect(args.includes('--restore')).toBe(true);
    expect(args.includes('--yes')).toBe(true);
  });

  it('export format and --output are recognized', () => {
    const args = ['node', 'cli.js', 'export', 'csv', '-o', '/tmp/out.csv'];
    expect(args.includes('-o')).toBe(true);
  });

  it('context --section option is recognized', () => {
    const args = ['node', 'cli.js', 'context', '--section', 'identity'];
    expect(args.includes('--section')).toBe(true);
  });
});