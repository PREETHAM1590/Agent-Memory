# Agent-Memory Context

> This directory contains the persistent brain of Agent-Memory

## Structure

```
.agent-brain/
├── IDENTITY.md          # Who am I, capabilities, rules
├── MEMORY.md            # Current context, recent projects, tasks
├── TECHNICAL_STATE.md   # Environment, services, databases
├── USER_PROFILE.md      # User preferences, code style
├── KNOWN_ISSUES.md      # Recurring problems and solutions
├── ARBORESCENCE.md      # Workspace structure map
├── CURRENT_CONTEXT.json # Machine-readable current state
│
└── sessions/            # Daily session logs
    ├── 2026-05-01.md
    ├── 2026-05-02.md
    └── 2026-05-04.md    # Today's session
```

## How It Works

### 1. Session Start
When you start a new session in any IDE, call:

```
memory_init(projectPath="/path/to/project")
```

This will:
- Load all past context
- Detect current IDE
- Analyze project
- Sync across all IDEs
- Resume from last session

### 2. During Session
Log important activities:

```
memory_log(type="decision", content="Use PostgreSQL for main DB")
memory_log(type="file_change", content="Modified src/database.ts")
memory_store(type="discovery", title="Found API rate limit", content="...")
```

### 3. Session End
Always end properly:

```
memory_end_session(summary="Implemented user auth, fixed 3 bugs")
```

## Auto-Sync

Context is automatically synced to all IDEs:

| IDE | Config Location |
|-----|-----------------|
| Cursor | `~/.cursor/AGENT_CONTEXT.md` |
| Windsurf | `~/.windsurf/AGENT_CONTEXT.md` |
| Claude Code | `~/.claude/AGENT_CONTEXT.md` |
| Kilo | `~/.kilo/AGENT_CONTEXT.md` |
| Gemini CLI | `~/.gemini/AGENT_CONTEXT.md` |
| Aider | `~/.aider/CONTEXT.md` |

## Brain Files

### IDENTITY.md
Defines who the agent is, its purpose, and operating rules.

### MEMORY.md
- Current active project
- Recent projects with summaries
- Pending tasks
- Important context snippets

### TECHNICAL_STATE.md
- Environment status
- Running services (Docker, databases)
- API endpoints
- Known technical issues

### USER_PROFILE.md
- User preferences
- Code style patterns
- Common shortcuts
- Frequently used tools

### KNOWN_ISSUES.md
- Recurring problems
- Solutions that worked
- Pitfalls to avoid

### ARBORESCENCE.md
- Project file structure
- Auto-updated when structure changes
- Helps navigate complex projects

## Session Logs

Each day has its own log file: `sessions/YYYY-MM-DD.md`

Format:
```markdown
# Session Log - 2026-05-04

## Overview
- **Started**: 09:30:00
- **Project**: my-awesome-app
- **IDE**: cursor

## Activities

#### [09:35:22] DECISION
Use PostgreSQL instead of MongoDB

#### [10:15:00] TASK
Implement user authentication

#### [11:00:45] FILE_CHANGE
Modified: src/auth/login.ts

## Session Summary
Completed auth implementation, fixed JWT handling.
```

## Best Practices

1. **Always initialize** - Call `memory_init` at session start
2. **Log decisions** - Use `memory_log` for important choices
3. **Store discoveries** - Use `memory_store` for learnings
4. **End properly** - Call `memory_end_session` when done
5. **Sync regularly** - Call `memory_sync` when switching IDEs
