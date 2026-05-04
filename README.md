# Agent-Memory

> Experimental local-first memory layer for AI coding tools like Claude Code, Cursor, and Windsurf.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.2.1-green.svg)

Agent-Memory gives AI coding tools persistent project memory across sessions — so you don't have to re-explain the same context every time.

**Status:** Public Beta. Features labeled [Stable], [Beta], or [Experimental].

## Feature Maturity

| Label | Meaning |
|-------|---------|
| **Stable** | Tested, safe for normal use |
| **Beta** | Works but may have rough edges |
| **Experimental** | Exists but not guaranteed |
| **Planned** | On roadmap, not built yet |

## One-Line Install

```bash
npx @preetham1590/agent-memory-ai install
```

Detects installed IDEs and installs Agent-Memory for each one.

## Safe Install Preview

```bash
# Preview changes without modifying files
npx @preetham1590/agent-memory-ai install --dry-run
```

## Supported IDEs

| IDE | Support Level | Windows | macOS | Linux |
|-----|---------------|:-------:|:-----:|:-----:|
| Claude Code | **Stable** | ✅ | ✅ | ✅ |
| Cursor | **Stable** | ✅ | ✅ | ✅ |
| Windsurf | **Beta** | ✅ | ✅ | ✅ |
| Kilo Code | **Beta** | ✅ | ✅ | ✅ |
| Gemini CLI | **Experimental** | ✅ | ✅ | ✅ |
| Cline | **Experimental** | ✅ | ✅ | ✅ |
| Continue.dev | **Experimental** | ✅ | ✅ | - |
| Aider | **Experimental** | ✅ | ✅ | ✅ |
| OpenCode | **Experimental** | - | ✅ | ✅ |

## Quick Start

```bash
# Safe install preview (no changes)
npx @preetham1590/agent-memory-ai install --dry-run

# Install for detected IDEs
npx @preetham1590/agent-memory-ai install

# Install for specific IDE
npx @preetham1590/agent-memory-ai install --ide cursor

# Start the memory worker
npx @preetham1590/agent-memory-ai start

# Check setup health
npx @preetham1590/agent-memory-ai doctor

# Open web dashboard
npx @preetham1590/agent-memory-ai web

# Store a memory
npx @preetham1590/agent-memory-ai store decision "Use SQLite" "Local storage for memory"

# Search memories
npx @preetham1590/agent-memory-ai search "database"

# List all memories
npx @preetham1590/agent-memory-ai list

# Export all memories
npx @preetham1590/agent-memory-ai export json

# Uninstall safely
npx @preetham1590/agent-memory-ai uninstall
```

## Commands

| Command | Description | Maturity |
|---------|-------------|----------|
| `install` | Install for detected IDEs (supports `--dry-run`, `--yes`) | Stable |
| `detect` | List detected IDEs (supports `--json`) | Stable |
| `doctor` | Diagnose setup issues | Stable |
| `repair` | Fix broken configuration | Stable |
| `start` | Start the memory worker on port 37800 | Stable |
| `stop` | Stop the running worker | Stable |
| `mcp` | Start MCP server for IDE integration | Stable |
| `web` | Open web dashboard | Stable |
| `search <query>` | Search memory | Stable |
| `store <type> <title>` | Store a new memory | Stable |
| `list` | List all memories | Stable |
| `delete <id>` | Delete a memory | Stable |
| `stats` | Show memory statistics | Stable |
| `export [format]` | Export memories (json, csv, markdown) | Stable |
| `version` | Show version information | Stable |
| `uninstall` | Remove from IDEs (supports `--restore`, `--keep-data`) | Stable |
| `init` | Initialize session context | Beta |
| `sync` | Sync context to all IDEs | Beta |
| `update` | Update to latest version | Beta |

## Platform Support

### Windows
```powershell
npx @preetham1590/agent-memory-ai install
```
Detects from: `C:\Program Files`, `%USERPROFILE%\AppData`, `PATH`.

### macOS
```bash
npx @preetham1590/agent-memory-ai install
```
Detects from: `/Applications`, `~/Applications`, `PATH`.

### Linux
```bash
npx @preetham1590/agent-memory-ai install
```
Detects from: `~/.config`, `PATH`, `/usr/bin`, `/usr/local/bin`, `/snap/bin`.

## Features

### Stable
- CLI commands (install, detect, doctor, repair, start, stop, search, store, list, delete, export)
- MCP server for IDE integration
- SQLite memory database with FTS5 search
- Web dashboard (local)
- Config backups before modifications
- Safe uninstall with backup restore
- Cross-platform detection (Windows, macOS, Linux)

### Beta
- Session initialization and tracking
- Multi-IDE context sync
- Auto-update

### Experimental
- Cloud sync
- Team sharing
- AI summarization
- Pattern extraction
- Docker deployment
- Vector search (planned)
- More IDE integrations

### Planned
- Full test suite
- GitHub Actions CI
- Install/repair for all platforms
- Signed releases

## Privacy

- **Local-first by default.** All memory stays on your machine.
- **No telemetry.** No data is sent anywhere unless you configure cloud sync.
- **No cloud upload.** Cloud sync is opt-in and disabled by default.
- **Full control.** Export, delete, and inspect all stored memories.
- **Backups created automatically** before any config modification.

See [PRIVACY.md](docs/PRIVACY.md) for details.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Your System                        │
├──────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Cursor  │  │ Windsurf │  │  Claude  │   ...       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                   │
│       └─────────────┴─────────────┘                   │
│                          │                             │
│                    ┌─────▼─────┐                      │
│                    │ MCP Server │                      │
│                    └─────┬─────┘                      │
│                          │                             │
│       ┌──────────────────┼──────────────────┐         │
│       │                  │                  │         │
│  ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐   │
│  │ SQLite  │       │  Worker   │      │  Web    │   │
│  │   DB    │       │ :37800    │      │Dashboard│   │
│  └─────────┘       └───────────┘      └─────────┘   │
└──────────────────────────────────────────────────────┘
```

## Configuration

Config file: `~/.agent-memory/config.json`

```json
{
  "port": 37800,
  "database": "~/.agent-memory/data/memory.db",
  "privacy": {
    "localOnly": true,
    "telemetry": false
  },
  "memory": {
    "maxResults": 10,
    "autoStore": true
  }
}
```

## License

MIT License — see [LICENSE](./LICENSE)

## Support

- **Issues**: [GitHub Issues](https://github.com/PREETHAM1590/Agent-Memory/issues)
- **Security**: See [SECURITY.md](./SECURITY.md)

---

**Built with TypeScript** | **Local-First** | **Privacy-Focused**
