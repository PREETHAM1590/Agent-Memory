# MCP Server

Agent-Memory exposes an MCP (Model Context Protocol) server over stdio. This allows AI coding tools to search, store, and manage memory directly from within the IDE.

## Configuration

MCP server is configured per IDE during installation. Each IDE's config file gets an `agent-memory` entry added:

```json
{
  "mcpServers": {
    "agent-memory": {
      "command": "npx",
      "args": ["-y", "@preetham1590/agent-memory-ai", "mcp"],
      "env": {
        "AGENT_MEMORY_DB": "~/.agent-memory/data/memory.db"
      }
    }
  }
}
```

## MCP Tools

### memory_search

Search observations with full-text search.

- **query** (string, required): Search query
- **type** (string, optional): Filter by observation type
- **limit** (number, optional, default: 10): Max results

### memory_store

Store a new observation.

- **type** (string, required): Observation type (bugfix, feature, decision, discovery, change, pattern, question, note)
- **title** (string, required): Short title
- **content** (string, optional): Full body
- **tags** (string[], optional): Search tags

### memory_get_observations

Fetch full details by IDs.

- **ids** (number[], required): Observation IDs

### memory_timeline

Get chronological context around an observation.

- **observationId** (number, required): Center observation
- **depth** (number, optional, default: 5): Context window size

### memory_init

Initialize session with full context.

- **projectPath** (string, optional): Project root path
- **projectName** (string, optional): Project display name

### memory_log

Log an activity to the current session.

- **type** (string, required): Activity type
- **content** (string, required): Activity description

### memory_context

Get full brain context (identity, memory, technical state, user profile, known issues, today's session).

### memory_sync

Sync context to all installed IDEs.

### memory_analytics

Get memory statistics (total observations, sessions, projects, type breakdown).

### memory_end_session

End the current session with a summary.

- **summary** (string, required): Session summary

## Manual Start

```bash
npx @preetham1590/agent-memory-ai mcp
```

## Architecture

```
AI IDE (Cursor, Claude Code, etc.)
        │
        │ MCP protocol over stdio
        ▼
  Agent-Memory MCP Server
        │
        ▼
  SQLite Database (FTS5 search)
```