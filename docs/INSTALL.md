# Installation Guide

## Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)

## Quick Install

```bash
npx @preetham1590/agent-memory-ai install
```

This detects installed AI IDEs and installs Agent-Memory for each one.

## Safe Install Preview

Preview changes without modifying anything:

```bash
npx @preetham1590/agent-memory-ai install --dry-run
```

## Install for Specific IDE

```bash
npx @preetham1590/agent-memory-ai install --ide claude
npx @preetham1590/agent-memory-ai install --ide cursor
npx @preetham1590/agent-memory-ai install --ide windsurf
```

## Install for All IDEs

```bash
npx @preetham1590/agent-memory-ai install --all
```

## Skip Confirmation

```bash
npx @preetham1590/agent-memory-ai install --yes
```

## What Installation Does

1. Detects installed IDEs on your system
2. Creates config backup at `~/.agent-memory/backups/`
3. Adds MCP server config to each IDE
4. Creates IDE-specific rules files
5. Initializes the memory database

## What It Modifies

- `~/.claude/settings.json` or `~/.claude/.mcp.json` (Claude Code)
- `~/.cursor/mcp.json` (Cursor)
- `~/.windsurf/mcp.json` (Windsurf)
- Similar files for other IDEs

## Verification

After install, verify everything is set up:

```bash
npx @preetham1590/agent-memory-ai doctor
```

## Post-Install

1. Restart your IDE
2. Start the worker: `npx agent-memory start`
3. Open dashboard: `npx agent-memory web`