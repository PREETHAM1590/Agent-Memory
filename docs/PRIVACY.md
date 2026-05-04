# Privacy

Agent-Memory is built local-first. Your data stays on your machine unless you explicitly opt into cloud features.

## Local-First by Default

All memory, config, and logs are stored on your local machine. No data is sent to external servers during normal operation.

## Data Location

```
~/.agent-memory/
  ├── config.json          - Tool configuration
  ├── data/memory.db       - SQLite database (observations, sessions, projects)
  ├── logs/                - Activity logs
  ├── backups/             - Config backups before edits
  └── brain/               - Session context, identity, technical state files
```

## What Is Stored

- **Observations**: Decisions, bugs, preferences, facts, commands, patterns you explicitly store
- **Sessions**: When you start/end sessions, start/end times and summaries
- **Config**: Tool settings (port, database path, feature toggles)
- **Logs**: Install, uninstall, and error activity
- **Backups**: IDE config files before Agent-Memory modifies them

## Telemetry

No telemetry is collected or transmitted. No usage data, crash reports, or analytics are sent anywhere.

## Cloud Sync

Cloud sync is **opt-in** and **disabled by default**. If you enable it, you control the destination endpoint. No data leaves your machine unless you configure and enable cloud sync yourself.

## What Is NOT Stored

Agent-Memory ignores these files by default:

- `.env`, `.env.*`
- `*.pem`, `*.key`
- `id_rsa`, `id_ed25519`
- `node_modules/`
- `.git/`
- `dist/`, `build/`
- `coverage/`

Secrets, credentials, and private keys are not stored by default.

## Export Your Data

```bash
# Export all memories as JSON
npx @preetham1590/agent-memory-ai export json

# Export as Markdown
npx @preetham1590/agent-memory-ai export markdown

# Export to a file
npx @preetham1590/agent-memory-ai export json --output memories.json
```

## Delete Your Data

```bash
# Delete a single memory
npx @preetham1590/agent-memory-ai delete <id>

# Uninstall and remove all data
npx @preetham1590/agent-memory-ai uninstall

# Uninstall but keep your data
npx @preetham1590/agent-memory-ai uninstall --keep-data
```

## Inspect Stored Data

```bash
# View stored memories
npx @preetham1590/agent-memory-ai list

# Search memory
npx @preetham1590/agent-memory-ai search "query"

# View statistics
npx @preetham1590/agent-memory-ai stats

# Open web dashboard
npx @preetham1590/agent-memory-ai web
```

## Questions

Open an issue: https://github.com/PREETHAM1590/Agent-Memory/issues