# Agent-Memory

> Universal AI IDE Memory System - Persistent memory across all your coding sessions

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

**Agent-Memory** is a universal memory system for ALL AI IDEs that automatically captures everything your AI assistant does during coding sessions, compresses it with AI, and makes it available in future sessions.

## Supported IDEs

| IDE | Status | Installation |
|-----|--------|--------------|
| Cursor | ✅ Supported | `npx agent-memory install --ide cursor` |
| Windsurf | ✅ Supported | `npx agent-memory install --ide windsurf` |
| Kilo Code | ✅ Supported | `npx agent-memory install --ide kilo` |
| Aider | ✅ Supported | `npx agent-memory install --ide aider` |
| Continue.dev | ✅ Supported | `npx agent-memory install --ide continue` |
| Cline | ✅ Supported | `npx agent-memory install --ide cline` |
| Claude Code | ✅ Supported | `npx agent-memory install --ide claude` |
| Gemini CLI | ✅ Supported | `npx agent-memory install --ide gemini` |

## Features

### Core Features
- **Persistent Memory** - Context survives across sessions and IDE restarts
- **Universal IDE Support** - Works with ALL major AI coding assistants
- **One-Click Install** - Single command setup for any supported IDE
- **Smart Summarization** - AI-powered auto-summarization with multiple compression levels
- **Auto-Tagging** - AI-powered automatic categorization of observations
- **Learning Mode** - Extract patterns from successful sessions automatically

### Advanced Features
- **Cloud Sync** - Optional cloud backup & sync across devices
- **Team Sharing** - Share memory across team members with permissions
- **Memory Analytics Dashboard** - Visual insights: top topics, patterns, productivity metrics
- **Code Pattern Library** - Extract and store reusable code patterns automatically
- **Decision Tree Visualization** - Visual graph of past decisions and their outcomes
- **Git Integration** - Link memories to commits, branches, PRs automatically
- **Project Templates** - Create project memory templates for quick setup
- **REST API + Webhooks** - Full API for integrations
- **Self-Hosted** - Docker/Kubernetes deployment guides
- **Memory Export/Import** - Export to JSON/CSV/Markdown
- **Voice Notes** - Voice-to-text memory capture via web interface
- **Knowledge Graph View** - Visual relationship map of concepts
- **Conflict Resolution** - Detect and resolve contradictory past decisions
- **Plugin Ecosystem** - Extend with community plugins

## Quick Start

```bash
# Install for your IDE (auto-detect)
npx agent-memory install

# Or specify IDE
npx agent-memory install --ide cursor

# Start the memory worker
npx agent-memory start

# Open web viewer
npx agent-memory web
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent-Memory System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Cursor  │  │ Windsurf │  │   Kilo   │  │  Aider   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                          │                                   │
│                    ┌─────▼─────┐                            │
│                    │ MCP Server │                            │
│                    └─────┬─────┘                            │
│                          │                                   │
│       ┌──────────────────┼──────────────────┐               │
│       │                  │                  │               │
│  ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐         │
│  │ SQLite  │       │  Vector   │      │  Cloud  │         │
│  │   DB    │       │   Search  │      │  Sync   │         │
│  └─────────┘       └───────────┘      └─────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Documentation

- [Installation Guide](./docs/installation.md)
- [Configuration](./docs/configuration.md)
- [API Reference](./docs/api.md)
- [IDE Integration](./docs/ide-integration.md)
- [Cloud Sync Setup](./docs/cloud-sync.md)
- [Team Sharing](./docs/team-sharing.md)
- [Plugin Development](./docs/plugins.md)

## Configuration

Settings are stored in `~/.agent-memory/config.json`:

```json
{
  "port": 37800,
  "database": "~/.agent-memory/memory.db",
  "cloudSync": {
    "enabled": false,
    "provider": "none"
  },
  "summarization": {
    "enabled": true,
    "compressionLevel": "medium"
  },
  "learning": {
    "enabled": true,
    "patternExtraction": true
  }
}
```

## MCP Tools

Agent-Memory provides 5 MCP tools for IDE integration:

1. **`memory_search`** - Search memory index with filters
2. **`memory_timeline`** - Get chronological context
3. **`memory_get`** - Fetch full observation details
4. **`memory_store`** - Store new observation
5. **`memory_analytics`** - Get usage analytics

## Web Viewer

Access the web viewer at `http://localhost:37800`:

- Real-time memory stream
- Analytics dashboard
- Knowledge graph visualization
- Decision tree view
- Team sharing management
- Settings configuration

## Self-Hosting

```bash
# Docker
docker run -d -p 37800:37800 -v agent-memory-data:/data preetham1590/agent-memory

# Docker Compose
docker-compose up -d

# Kubernetes
kubectl apply -f deploy/kubernetes/
```

## API Usage

```javascript
import { AgentMemory } from 'agent-memory';

const memory = new AgentMemory({
  database: './memory.db'
});

// Store observation
await memory.store({
  type: 'decision',
  title: 'Use PostgreSQL for main database',
  content: '...',
  tags: ['database', 'architecture']
});

// Search memory
const results = await memory.search('database decision', {
  type: 'decision',
  limit: 10
});
```

## Plugin Ecosystem

Create plugins to extend Agent-Memory:

```javascript
// my-plugin.js
export default {
  name: 'my-plugin',
  version: '1.0.0',
  hooks: {
    'observation:store': async (observation) => {
      // Modify observation before storage
      return observation;
    },
    'observation:search': async (query, results) => {
      // Modify search results
      return results;
    }
  }
};
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/PREETHAM1590/Agent-Memory/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PREETHAM1590/Agent-Memory/discussions)
- **Documentation**: [docs.agent-memory.io](https://docs.agent-memory.io)

---

**Built with TypeScript** | **Powered by MCP** | **Made for AI-Assisted Development**
