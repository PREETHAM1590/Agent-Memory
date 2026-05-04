# Agent-Memory

> Universal AI IDE Memory System - Auto-detect and install for ALL your AI IDEs with one command

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

**Agent-Memory** is a universal memory system for ALL AI IDEs. One command auto-detects all installed IDEs on your system and installs Agent-Memory for each one.

## One-Line Install (Auto-Detect All IDEs)

```bash
npx agent-memory install
```

That's it! Agent-Memory will:
1. ✅ Detect ALL installed AI IDEs on your system
2. ✅ Install and configure for each detected IDE
3. ✅ Set up the memory database
4. ✅ Create IDE-specific rules files

## Supported IDEs (9+)

| IDE | Windows | macOS | Linux | Detection Method |
|-----|:-------:|:-----:|:-----:|------------------|
| Cursor | ✅ | ✅ | ✅ | App, config folder, binary |
| Windsurf | ✅ | ✅ | ✅ | App, config folder, binary |
| Kilo Code | ✅ | ✅ | ✅ | Config folder, binary |
| Aider | ✅ | ✅ | ✅ | Binary, config folder |
| Continue.dev | ✅ | ✅ | - | Config folder |
| Cline | ✅ | ✅ | ✅ | Config folder |
| Claude Code | ✅ | ✅ | ✅ | Binary, config folder |
| Gemini CLI | ✅ | ✅ | ✅ | Binary, config folder |
| OpenCode | - | ✅ | ✅ | Binary |

## Quick Start

```bash
# Auto-detect and install for ALL detected IDEs
npx agent-memory install

# Just detect what's installed (no changes)
npx agent-memory detect

# Install for a specific IDE
npx agent-memory install --ide cursor

# Install for ALL supported IDEs (even if not detected)
npx agent-memory install --all

# Start the memory worker
npx agent-memory start

# Open web dashboard
npx agent-memory web
```

## Platform Support

### Windows
```powershell
# Detects IDEs from:
# - C:\Program Files\*\
# - C:\Users\%USER%\AppData\Local\Programs\
# - Config folders in %USERPROFILE%
# - PATH (using 'where' command)

npx agent-memory install
```

### macOS
```bash
# Detects IDEs from:
# - /Applications/*.app
# - ~/Applications/*.app
# - Config folders in ~
# - PATH (using 'which' command)

npx agent-memory install
```

### Linux
```bash
# Detects IDEs from:
# - Config folders in ~
# - PATH (using 'which' command)
# - /usr/bin, /usr/local/bin, /snap/bin

npx agent-memory install
```

## Features

### Core Features
- **Auto-Detection** - Automatically finds all installed AI IDEs
- **Cross-Platform** - Windows, macOS, and Linux support
- **Persistent Memory** - Context survives across sessions
- **Smart Summarization** - AI-powered compression
- **Auto-Tagging** - Automatic categorization

### Advanced Features
- **Cloud Sync** - Backup & sync across devices
- **Team Sharing** - Share with permissions
- **Analytics Dashboard** - Visual insights
- **Code Patterns** - Extract reusable patterns
- **Git Integration** - Link to commits/PRs
- **REST API + Webhooks** - Full API access
- **Docker/K8s** - Self-hosted deployment
- **Export/Import** - JSON/CSV/Markdown

## Commands

| Command | Description |
|---------|-------------|
| `npx agent-memory install` | Auto-detect and install for all detected IDEs |
| `npx agent-memory detect` | List all detected IDEs (no changes) |
| `npx agent-memory start` | Start the memory worker on port 37800 |
| `npx agent-memory web` | Open the web dashboard |
| `npx agent-memory search "query"` | Search memory |
| `npx agent-memory stats` | Show memory statistics |
| `npx agent-memory export json` | Export all memories |
| `npx agent-memory list-ides` | List all supported IDEs |

## After Installation

1. **Restart your IDE(s)** to load the new MCP server
2. **Start the worker**: `npx agent-memory start`
3. **Open dashboard**: http://localhost:37800

## MCP Tools (Available in All IDEs)

| Tool | Description |
|------|-------------|
| `memory_search` | Search memory with filters |
| `memory_timeline` | Get chronological context |
| `memory_get_observations` | Fetch full details |
| `memory_store` | Store new observation |
| `memory_analytics` | Get statistics |

## Example Usage in IDE

```
# Search for past decisions
memory_search(query="database decisions")

# Store a new decision
memory_store(type="decision", title="Use PostgreSQL", content="Chose PostgreSQL for ...")

# Get recent context
memory_analytics()
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your System                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Cursor  │  │ Windsurf │  │   Kilo   │  │  Claude  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                          │                                   │
│                    ┌─────▼─────┐                            │
│                    │ MCP Server │  ← npx agent-memory mcp   │
│                    └─────┬─────┘                            │
│                          │                                   │
│       ┌──────────────────┼──────────────────┐               │
│       │                  │                  │               │
│  ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐         │
│  │ SQLite  │       │  Worker   │      │  Web    │         │
│  │   DB    │       │ :37800    │      │Dashboard│         │
│  └─────────┘       └───────────┘      └─────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Self-Hosting (Docker)

```bash
# Quick start with Docker
docker run -d -p 37800:37800 -v agent-memory-data:/data preetham1590/agent-memory

# Or with Docker Compose
git clone https://github.com/PREETHAM1590/Agent-Memory.git
cd Agent-Memory
docker-compose up -d
```

## Configuration

Config file: `~/.agent-memory/config.json`

```json
{
  "port": 37800,
  "database": "~/.agent-memory/data/memory.db",
  "cloudSync": { "enabled": false },
  "summarization": { "enabled": true, "compressionLevel": "medium" },
  "learning": { "enabled": true }
}
```

## License

MIT License - see [LICENSE](./LICENSE)

## Support

- **Issues**: [GitHub Issues](https://github.com/PREETHAM1590/Agent-Memory/issues)
- **Repository**: [github.com/PREETHAM1590/Agent-Memory](https://github.com/PREETHAM1590/Agent-Memory)

---

**Built with TypeScript** | **Cross-Platform** | **One-Command Install**
