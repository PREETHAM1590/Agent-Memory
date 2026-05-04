# FAQ

## Installation

### Install does nothing. No IDEs detected.

Try `npx @preetham1590/agent-memory-ai install --all` to install for all supported IDEs regardless of detection.

### Can I install for only one IDE?

Yes: `npx @preetham1590/agent-memory-ai install --ide claude`

### What files does install modify?

IDE config files — usually `mcp.json` or `settings.json` in the IDE's config directory. Backups are created automatically before edits.

## Usage

### Worker won't start

Check port availability: `npx @preetham1590/agent-memory-ai status` or try a different port: `npx @preetham1590/agent-memory-ai start --port 37801`

### Dashboard won't open

Make sure the worker is running (`npx @preetham1590/agent-memory-ai start`), then run `npx @preetham1590/agent-memory-ai web` or open http://127.0.0.1:37800.

### IDE doesn't see MCP server

1. Restart your IDE completely
2. Run `npx @preetham1590/agent-memory-ai doctor` to check config
3. Run `npx @preetham1590/agent-memory-ai repair` to fix issues

## Data

### Where is my data stored?

`~/.agent-memory/data/memory.db` — a local SQLite database.

### How do I export my data?

`npx @preetham1590/agent-memory-ai export json --output memories.json`

### How do I delete data?

Single memory: `npx @preetham1590/agent-memory-ai delete <id>`  
All data: Uninstall with `npx @preetham1590/agent-memory-ai uninstall`

### Is my data sent to the cloud?

No. Cloud sync is opt-in and disabled by default. Data stays local.

## Multiple IDEs

### Does it work across different IDEs?

Yes. Agent-Memory uses the same database regardless of which IDE you use. Context is shared.

### Can I use Agent-Memory with multiple projects?

Yes. Each observation has a `projectId` field. Search supports project filtering.

## Troubleshooting

### Permission denied errors

On Linux/macOS: `sudo npx @preetham1590/agent-memory-ai install` if needed.

### npx cache issues

```bash
rm -rf ~/.npm/_npx
```

### Config file has invalid JSON

Run `npx @preetham1590/agent-memory-ai repair --ide <ide>` to restore from backup.

## Updating

### How do I update?

`npx @preetham1590/agent-memory-ai update`

### Will update delete my data?

No. Update only replaces the package. Your data in `~/.agent-memory/` is preserved.

## Docker

### Can I run Agent-Memory in Docker?

Yes. See Dockerfile and docker-compose.yml in the repository. Worker runs on port 37800.

## Contributing

### How do I report a bug?

Open an issue at https://github.com/PREETHAM1590/Agent-Memory/issues

### Can I contribute code?

Yes. The repo is open source under MIT license. Pull requests welcome.

## Security

### How do I report a security issue?

See SECURITY.md for reporting policy. Do not open public issues for critical vulnerabilities.