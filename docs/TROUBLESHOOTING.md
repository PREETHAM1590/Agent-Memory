# Troubleshooting Guide

## Quick Diagnosis

Run the doctor command to check your setup:

```bash
npx @preetham1590/agent-memory-ai doctor
```

## Common Issues

### "Install command does nothing"

Try `npx @preetham1590/agent-memory-ai install --all` to install for all supported IDEs regardless of detection.

### "Worker won't start"

**Port in use:**
```bash
# Check what's using the port
npx @preetham1590/agent-memory-ai stop
# Or specify a different port
npx @preetham1590/agent-memory-ai start --port 37801
```

**Database path missing:**
Run `agent-memory install` first to create the database directory structure.

### "IDE does not detect MCP server"

1. Restart your IDE completely
2. Run `agent-memory doctor` to check config
3. Run `agent-memory repair --ide <ide>` to fix config

### "Config file has invalid JSON"

Run repair to fix it:

```bash
npx @preetham1590/agent-memory-ai repair --ide claude
```

This restores from backup or recreates the config file.

### "Version mismatch"

Ensure you are using the latest version:

```bash
npx @preetham1590/agent-memory-ai update
npx @preetham1590/agent-memory-ai version
```

### "npx cache issues"

```bash
# Clear npx cache
npx clear-npx-cache
# Or
rm -rf ~/.npm/_npx
```

### "Permission denied"

On Linux/macOS, you might need:

```bash
sudo npx @preetham1590/agent-memory-ai install
```

## Doctor Command Checks

| Check | What It Verifies |
|-------|-----------------|
| Node version | >= 18.0.0 |
| Package version | Installed version |
| Database file | Exists and readable |
| Config file | Valid JSON |
| Worker status | Running and port accessible |
| IDE config | MCP entries valid |
| Backups | Available for restore |

## Getting Help

Open an issue: https://github.com/PREETHAM1590/Agent-Memory/issues