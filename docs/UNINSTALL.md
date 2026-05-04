# Uninstall Guide

## Safe Uninstall

```bash
npx @preetham1590/agent-memory-ai uninstall
```

This removes Agent-Memory from all detected IDEs and cleans up the data directory.

## Uninstall Options

### Keep Your Data

```bash
npx @preetham1590/agent-memory-ai uninstall --keep-data
```

Removes IDE configuration but preserves `~/.agent-memory/` data.

### Uninstall from Specific IDE

```bash
npx @preetham1590/agent-memory-ai uninstall --ide claude
npx @preetham1590/agent-memory-ai uninstall --ide cursor
```

### Restore Original Configuration

```bash
npx @preetham1590/agent-memory-ai uninstall --restore
```

Restores config files from backups created during installation. Backups are stored at `~/.agent-memory/backups/`.

### Remove from All IDEs

```bash
npx @preetham1590/agent-memory-ai uninstall --all
```

Removes Agent-Memory entries from ALL supported IDEs, even those not currently detected.

## What Gets Removed

- MCP server entries from IDE config files
- IDE rules files containing Agent-Memory references
- Optionally: `~/.agent-memory/` directory (database, config, logs, backups)

## What Does NOT Get Removed

- Your memories (if using `--keep-data`)
- Backups (preserved for restore)
- npm global package (run `npm uninstall -g @preetham1590/agent-memory-ai` to remove)

## Post-Uninstall Verification

```bash
npx @preetham1590/agent-memory-ai doctor
```

This confirms no broken Agent-Memory references remain.