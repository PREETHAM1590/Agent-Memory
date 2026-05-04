# Product Requirements Document  
# Agent-Memory — Universal Memory Layer for AI Coding Tools

**Version:** 1.0  
**Target Release:** Public Beta v1.3.0  
**Product Owner:** PREETHAM1590  
**Primary Goal:** Make Agent-Memory safe, reliable, and trusted for global developers using AI coding tools.

---

## 1. Product Summary

**Agent-Memory** is a local-first memory system for AI coding tools. It allows tools like Claude Code, Cursor, Windsurf, Gemini CLI, Cline, Continue.dev, Aider, and similar AI developer tools to remember important project context across sessions.

The product should evolve from a promising MVP into a globally usable developer tool by focusing first on:

- Safe installation
- Reliable uninstall
- Accurate documentation
- Cross-platform stability
- Privacy
- Security
- Trust

---

## 2. Vision

Developers using AI coding assistants waste time repeatedly explaining the same project architecture, bugs, coding preferences, decisions, and previous work.

Agent-Memory should become the shared long-term memory layer that helps AI coding tools recall the right project context at the right time.

**Vision Statement:**

> Agent-Memory gives AI coding tools persistent, local-first project memory so developers do not have to re-explain the same context every session.

---

## 3. Problem Statement

AI coding tools are powerful but often session-based. When a new session starts, the assistant may forget:

- Project architecture
- User coding preferences
- Previous implementation decisions
- Known bugs
- Dependency choices
- Failed approaches
- Environment setup
- Important files
- Past debugging context

This causes repeated explanations, slower development, inconsistent code suggestions, and frustration.

Global users need a memory tool that is:

- Easy to install
- Safe to uninstall
- Local-first by default
- Compatible with popular AI coding tools
- Transparent about what it stores
- Reliable across Windows, macOS, and Linux
- Secure enough to trust with developer context

---

## 4. Target Users

### 4.1 Primary Users

#### Solo Developers Using AI Coding Tools

They use Claude Code, Cursor, Windsurf, Gemini CLI, or similar tools and want their assistant to remember project context.

#### Open-Source Maintainers

They want AI assistants to remember repository decisions, issue history, coding style, and contribution rules.

#### Students and Indie Builders

They work on projects across multiple sessions and need simple memory without complex setup.

---

### 4.2 Secondary Users

#### Small Developer Teams

They may want shared memory later, but this should not be the first stable launch target.

#### AI Tool Power Users

They experiment with MCP servers, local tools, and custom automation.

#### Enterprise Developers

They care heavily about privacy, auditability, security, and policy controls. Enterprise should be a later target, not the first release.

---

## 5. Product Positioning

### Current Positioning

The project currently aims to be a universal memory system for all AI IDEs.

This is ambitious, but for global users it should be softened until the product is more stable.

### Recommended Public Beta Positioning

> Agent-Memory is an experimental local-first memory layer for AI coding tools like Claude Code, Cursor, and Windsurf.

### Recommended Stable Launch Positioning

> Agent-Memory gives AI coding tools persistent project memory across sessions, with safe install, local storage, MCP support, and cross-tool recall.

---

## 6. Goals

### 6.1 Product Goals

1. Provide persistent memory for AI coding tools.
2. Support safe install and uninstall across major developer environments.
3. Keep memory local-first by default.
4. Give users full visibility and control over stored memory.
5. Support MCP-compatible tools.
6. Provide a dashboard for search, review, delete, export, and settings.
7. Build enough trust for global users to install it without fear.

---

### 6.2 Adoption Goals

1. Reach the first 100 real users.
2. Get the first 10 GitHub stars from real external users.
3. Receive useful bug reports through GitHub Issues.
4. Build a clean public demo.
5. Create trustworthy documentation and troubleshooting guides.
6. Prepare future monetization through optional cloud sync or team memory, but not before local-first product stability.

---

## 7. Non-Goals

For the first serious global release, Agent-Memory should not try to do everything.

### Not in Scope for v1.3 Public Beta

- Full team sharing
- Cloud sync by default
- Enterprise admin controls
- Kubernetes production deployment
- Advanced analytics
- Paid plans
- Complex vector database setup
- Support for every AI IDE at once
- Silent modification of config files without preview
- Automatic uploading of user memory

The first global version should be boring, safe, and reliable.

---

## 8. Current Product Reality

The current package is published as:

```text
@preetham1590/agent-memory-ai
```

The package exposes the binary name:

```text
agent-memory
```

The project currently includes or plans modules for:

- CLI
- Database
- MCP server
- Worker server
- Installer
- Summarizer
- Brain/memory logic
- Cloud sync
- Web dashboard

For global readiness, the product must clearly separate:

| Category | Meaning |
|---|---|
| Stable | Fully tested and safe for normal users |
| Beta | Works but may have rough edges |
| Experimental | Exists but not guaranteed |
| Planned | Not built yet |

---

## 9. Competitive Context

Agent memory is an active space. Similar projects already exist that focus on persistent memory for coding agents, MCP-compatible workflows, structured agent state, local memory, vector memory, and shared context.

Agent-Memory should differentiate through:

1. Simple install
2. Local-first privacy
3. Safe uninstall
4. Beginner-friendly docs
5. Multi-IDE support
6. Clear dashboard
7. No surprise cloud behavior
8. Windows-first reliability

---

## 10. User Personas

### Persona 1: Solo AI Developer

**Name:** Ravi  
**Tools:** Claude Code, Cursor  
**Problem:** Keeps re-explaining project structure every session  
**Needs:** Simple install, local memory, easy search  
**Success:** Claude/Cursor remembers project decisions and previous bugs

---

### Persona 2: Student Builder

**Name:** Aisha  
**Tools:** Cursor, Gemini CLI  
**Problem:** Does not understand complex MCP setup  
**Needs:** One-command setup, friendly error messages  
**Success:** Can install, check status, and uninstall without breaking anything

---

### Persona 3: Open Source Maintainer

**Name:** Daniel  
**Tools:** Claude Code, Aider  
**Problem:** AI assistant forgets repo conventions  
**Needs:** Store decisions, coding rules, issue context  
**Success:** Assistant recalls style and architecture automatically

---

### Persona 4: Security-Conscious Developer

**Name:** Mei  
**Tools:** Windsurf, Claude Code  
**Problem:** Does not trust unknown tools touching config files  
**Needs:** Dry-run mode, backups, local-only mode, export/delete  
**Success:** Can see exactly what Agent-Memory changes and stores

---

## 11. Core User Stories

### Installation

As a developer, I want to run one command and see which AI tools were detected, so that I understand what Agent-Memory will modify.

As a security-conscious user, I want Agent-Memory to create backups before editing config files, so that I can restore my setup.

As a beginner, I want clear errors if installation fails, so that I know what to do next.

---

### Memory Storage

As a developer, I want my AI assistant to store important decisions, so that future sessions remember them.

As a user, I want to manually store memory from the CLI, so that I can add important context myself.

As a privacy-conscious user, I want memory stored locally by default, so that my project information does not leave my machine.

---

### Memory Recall

As a developer, I want AI tools to search memory using MCP, so that they can retrieve relevant context.

As a user, I want to search memories from CLI and dashboard, so that I can verify what is stored.

As a user, I want memories ranked by relevance and recency, so that useful context appears first.

---

### Management

As a user, I want to edit, delete, and export memories, so that I stay in control.

As a user, I want a `doctor` command, so that I can diagnose broken setup.

As a user, I want uninstall to remove config entries cleanly, so that Agent-Memory does not leave broken hooks behind.

---

## 12. MVP Scope

The MVP for global users should focus on Claude Code, Cursor, and Windsurf only.

### MVP Supported Tools

| Tool | Support Level | Notes |
|---|---:|---|
| Claude Code | Stable target | First priority |
| Cursor | Stable target | First priority |
| Windsurf | Beta target | Second priority |
| Gemini CLI | Experimental | Later |
| Cline | Experimental | Later |
| Continue.dev | Experimental | Later |
| Aider | Experimental | Later |
| Kilo Code | Experimental | Later |
| OpenCode | Experimental | Later |

A tool that supports three IDEs perfectly is better than a tool that claims nine and breaks randomly.

---

## 13. Functional Requirements

## 13.1 CLI

The CLI is the main interface.

### Required Commands

```bash
agent-memory install
agent-memory install --ide claude
agent-memory install --ide cursor
agent-memory install --ide windsurf
agent-memory detect
agent-memory doctor
agent-memory repair
agent-memory start
agent-memory stop
agent-memory status
agent-memory web
agent-memory search "query"
agent-memory store
agent-memory list
agent-memory delete <id>
agent-memory export json
agent-memory export markdown
agent-memory uninstall
agent-memory uninstall --ide claude
agent-memory uninstall --keep-data
agent-memory version
```

---

### 13.1.1 `install`

Installs Agent-Memory into supported tools.

#### Requirements

- Must detect installed supported tools.
- Must show a preview before modifying files.
- Must create backups before editing config files.
- Must ask confirmation unless `--yes` is provided.
- Must support `--dry-run`.
- Must support installing only one IDE.
- Must not install into undetected tools unless `--all` is used.
- Must print exact modified file paths.

#### Example Output

```text
Detected:
✅ Claude Code
✅ Cursor
⚠️ Windsurf not found

Agent-Memory will modify:
- C:\Users\user\.claude\settings.json
- C:\Users\user\.cursor\mcp.json

Backups will be created:
- settings.json.agent-memory-backup-2026-05-04
- mcp.json.agent-memory-backup-2026-05-04

Continue? yes/no
```

---

### 13.1.2 `detect`

Detects installed supported AI tools.

#### Requirements

- Must not modify files.
- Must show detection method.
- Must show confidence level.
- Must support JSON output.

#### Example

```bash
agent-memory detect --json
```

---

### 13.1.3 `doctor`

Diagnoses setup issues.

#### Requirements

`doctor` must check:

- Node version
- Package version
- CLI binary path
- Local database path
- Worker status
- Port availability
- MCP config entries
- Broken config references
- Claude Code hook issues
- Cursor MCP config issues
- Permission errors
- Backup availability
- Version mismatch
- Common `npx` cache issues

#### Example Output

```text
Agent-Memory Doctor

✅ Node version: 22.0.0
✅ Package version: 1.3.0
✅ Database exists
✅ Claude config found
❌ Claude hook points to missing binary
✅ Cursor MCP config valid
⚠️ Worker not running

Recommended fix:
agent-memory repair --ide claude
```

---

### 13.1.4 `uninstall`

Removes Agent-Memory safely.

#### Requirements

- Must remove only Agent-Memory config entries.
- Must not delete unrelated config.
- Must offer to restore backup.
- Must support `--keep-data`.
- Must support specific IDE uninstall.
- Must verify after uninstall.
- Must print what was removed.

---

### 13.1.5 `repair`

Repairs broken configuration.

#### Requirements

- Must re-create missing config entries.
- Must remove invalid paths.
- Must update old binary names.
- Must fix version mismatch where possible.
- Must not delete user data.

---

## 13.2 Memory Database

Agent-Memory should use local SQLite as the default memory database.

### Requirements

- Store memories locally under `~/.agent-memory/`.
- Support project-specific memory.
- Support global user memory.
- Support metadata, tags, confidence, source, timestamp, and tool name.
- Support safe migrations.
- Support database backup.
- Support export/import.

### Required Memory Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| id | string | Yes | Unique memory ID |
| project_id | string | Yes | Project identifier |
| type | enum | Yes | decision, bug, preference, fact, command, file, pattern |
| title | string | Yes | Short memory title |
| content | text | Yes | Full memory body |
| tags | string[] | No | Search/filter tags |
| source_tool | string | Yes | claude, cursor, windsurf, cli |
| source_path | string | No | Related file path |
| confidence | number | Yes | 0–1 confidence score |
| created_at | datetime | Yes | Creation time |
| updated_at | datetime | Yes | Last update time |
| last_used_at | datetime | No | Recall time |
| access_count | number | Yes | Usage count |
| deleted_at | datetime | No | Soft delete |

---

## 13.3 Memory Types

### Decision

Used for architectural or implementation choices.

Example:

```text
Use SQLite for local memory storage because it requires no external service and works offline.
```

### Bug

Used for known issues and fixes.

Example:

```text
Empty SQLite FTS query fails. Use normal SELECT when query is empty.
```

### Preference

Used for user or project preferences.

Example:

```text
User prefers TypeScript strict mode and clear CLI errors.
```

### Fact

Used for stable project information.

Example:

```text
The worker runs on port 37800 by default.
```

### Command

Used for working setup commands.

Example:

```text
Use npm run build before npm publish.
```

### Pattern

Used for reusable code/design patterns.

Example:

```text
Always create backup before modifying IDE config files.
```

---

## 13.4 Memory Retrieval

Memory retrieval should return relevant context based on:

- Query text
- Tags
- Project
- Source tool
- Recency
- Frequency of use
- Confidence
- Memory type

### Requirements

- Empty query must not crash.
- Empty query should return recent memories.
- Search must support filters.
- Search must return explainable result metadata.
- Search must limit returned content size.
- Search must support CLI, dashboard, and MCP access.

---

## 13.5 MCP Server

Agent-Memory should expose MCP tools to supported AI clients.

### Required MCP Tools

| Tool | Description |
|---|---|
| `memory_search` | Search relevant memories |
| `memory_store` | Store a new memory |
| `memory_list` | List recent memories |
| `memory_get` | Get memory by ID |
| `memory_delete` | Delete memory |
| `memory_update` | Update memory |
| `memory_analytics` | Return basic stats |
| `memory_project_context` | Return relevant project context |

### Requirements

- Must work over stdio where required.
- Must not expose destructive tools without clear safeguards.
- Must validate all inputs with schemas.
- Must handle errors with structured messages.
- Must never execute arbitrary shell commands from memory input.
- Must include rate limits or request size limits.

---

## 13.6 Worker Server

The worker should provide local HTTP APIs for dashboard and optional integrations.

### Requirements

- Bind to `127.0.0.1` by default.
- Default port: `37800`.
- Support health check.
- Support search/list/store/delete APIs.
- Require local auth token for write operations.
- Disable open CORS by default.
- Show clear error if port is in use.
- Support `agent-memory status`.

### Required Endpoints

```text
GET  /health
GET  /api/memories
GET  /api/memories/:id
POST /api/memories
PATCH /api/memories/:id
DELETE /api/memories/:id
GET  /api/search?q=
GET  /api/stats
GET  /api/config
PATCH /api/config
```

---

## 13.7 Web Dashboard

The dashboard should be simple and useful, not overly complex.

### MVP Dashboard Pages

| Page | Purpose |
|---|---|
| Overview | Total memories, projects, tools, worker status |
| Search | Search and filter memories |
| Memory Detail | View/edit/delete one memory |
| Projects | View project-specific memory |
| Tools | Show connected IDEs |
| Settings | Local config, privacy, export, delete |
| Doctor | Show setup health |

### Requirements

- Must work offline.
- Must show where memory is stored.
- Must allow deleting memory.
- Must allow exporting memory.
- Must show connected IDE status.
- Must display privacy mode clearly.
- Must not require login for local-only mode.
- Must not expose dashboard to public network by default.

---

## 13.8 Config Management

Agent-Memory must manage config safely.

### Config Location

```text
~/.agent-memory/config.json
```

### Required Config Fields

```json
{
  "version": "1.3.0",
  "port": 37800,
  "host": "127.0.0.1",
  "database": "~/.agent-memory/data/memory.db",
  "privacy": {
    "localOnly": true,
    "telemetry": false
  },
  "tools": {
    "claude": { "enabled": true },
    "cursor": { "enabled": true },
    "windsurf": { "enabled": false }
  },
  "memory": {
    "maxResults": 10,
    "autoStore": true,
    "autoSummarize": false
  }
}
```

---

## 13.9 Backup and Restore

Before modifying any external config file, Agent-Memory must create a backup.

### Requirements

- Backup before every config write.
- Store backup path in install log.
- Support restore from backup.
- Keep multiple timestamped backups.
- Verify JSON validity after editing.
- Roll back automatically if write fails.

### Backup Example

```text
~/.agent-memory/backups/claude/settings-2026-05-04T18-30-00.json
```

---

## 13.10 Logging

### Requirements

- Logs should be human-readable.
- Debug logs should be optional.
- Logs should not include memory content by default.
- Logs should show install actions, errors, and repair suggestions.

### Log Location

```text
~/.agent-memory/logs/agent-memory.log
```

---

## 14. Privacy Requirements

Privacy is a core product feature.

### Requirements

- Local-first by default.
- No telemetry by default.
- No cloud sync by default.
- No memory upload without explicit opt-in.
- User can export all data.
- User can delete all data.
- User can inspect stored memory.
- User can disable auto-store.
- User can use project-only memory.
- Sensitive files should be excluded by default.

### Default Ignored Files

```text
.env
.env.*
*.pem
*.key
id_rsa
id_ed25519
node_modules
.git
dist
build
coverage
```

---

## 15. Security Requirements

Because Agent-Memory integrates with AI tools and MCP-style workflows, security must be treated seriously.

### Requirements

- No arbitrary command execution from memory content.
- Worker binds to `127.0.0.1` only.
- Dashboard write operations require local token.
- Validate all MCP inputs.
- Escape dashboard-rendered content.
- Do not store secrets by default.
- Add `SECURITY.md`.
- Add vulnerability reporting email or GitHub Security policy.
- Add dependency audit in CI.
- Add safe mode.

### Safe Mode

```bash
agent-memory start --safe
```

Safe mode disables:

- Auto-store
- Cloud sync
- External API calls
- Destructive MCP tools
- Experimental integrations

---

## 16. Platform Requirements

### Windows

Must support:

- PowerShell
- `%USERPROFILE%`
- `%APPDATA%`
- `%LOCALAPPDATA%`
- Path spaces
- Windows file locking
- `.cmd` binaries
- `where` command

### macOS

Must support:

- `~/Library/Application Support`
- `/Applications`
- `which`
- zsh shell
- permission issues

### Linux

Must support:

- XDG config paths
- `~/.config`
- `/usr/bin`
- `/usr/local/bin`
- Snap/AppImage paths where practical

---

## 17. Installer Requirements by Tool

## 17.1 Claude Code

### Requirements

- Detect Claude Code binary.
- Detect Claude config folder.
- Add MCP server config safely.
- Avoid breaking existing hooks.
- Provide repair for broken hooks.
- Provide uninstall.

### Acceptance Criteria

- Install works on Windows, macOS, Linux.
- Existing Claude config remains valid JSON.
- Uninstall removes only Agent-Memory entries.
- `doctor` detects missing binary or broken config.

---

## 17.2 Cursor

### Requirements

- Detect Cursor app/config.
- Add MCP server config.
- Preserve existing MCP servers.
- Support uninstall and restore.

### Acceptance Criteria

- Existing Cursor MCP config is preserved.
- Agent-Memory MCP appears after restart.
- Removing Agent-Memory does not remove other MCP servers.

---

## 17.3 Windsurf

### Requirements

- Detect Windsurf config.
- Add MCP server config where supported.
- Mark as beta until verified.

### Acceptance Criteria

- Install and uninstall are tested on at least Windows and macOS.
- If unsupported config format is detected, installer exits safely.

---

## 18. Reliability Requirements

### Required Behavior

- No crash on empty search.
- No crash when config file does not exist.
- No crash when JSON config is invalid.
- No crash when port is used.
- No crash when database is missing.
- No silent failures.
- Every failed command should include a fix suggestion.

### Example Error

Bad:

```text
Error: ENOENT
```

Good:

```text
Claude config file was not found.

Checked:
C:\Users\user\.claude\settings.json

Fix:
Run `agent-memory detect` to confirm Claude Code is installed.
```

---

## 19. Performance Requirements

### Search

- Search response under 300ms for 10,000 local memories.
- Search response under 1s for 100,000 local memories.

### Startup

- CLI command response under 2s for basic commands.
- Worker startup under 3s.

### Memory Size

- Support at least 100,000 memories locally.
- Support export without crashing.

---

## 20. Data Lifecycle

### Memory Creation

Sources:

- Manual CLI store
- MCP `memory_store`
- Auto-captured session summaries
- Future import

### Memory Update

- User edit
- Auto-confidence update
- Tag update
- Usage count update

### Memory Deletion

- Soft delete by default
- Hard delete option
- Delete all project memories
- Delete all data

### Memory Export

Formats:

- JSON
- Markdown
- CSV later

---

## 21. AI Summarization Requirements

Summarization should be optional.

### Requirements

- Disabled by default for public beta unless fully safe.
- If enabled, clearly show whether external APIs are used.
- User must provide their own API key.
- Never send secrets.
- Allow local-only no-LLM mode.
- Show what will be summarized.

### Summarization Modes

| Mode | Description |
|---|---|
| Off | No summarization |
| Local rules | Simple deterministic compression |
| External LLM | Optional, user-provided key |
| Future local model | Later |

---

## 22. Analytics Requirements

Analytics should be basic for MVP.

### MVP Analytics

- Total memories
- Memories by type
- Memories by project
- Most-used memories
- Recently added memories
- Connected tools
- Database size

### Not MVP

- Team analytics
- Productivity scoring
- AI quality scoring
- Cloud usage dashboard

---

## 23. Documentation Requirements

Global users need strong docs.

### Required Docs

```text
README.md
docs/INSTALL.md
docs/UNINSTALL.md
docs/TROUBLESHOOTING.md
docs/CLI.md
docs/MCP.md
docs/PRIVACY.md
docs/SECURITY.md
docs/CONFIG.md
docs/FAQ.md
CHANGELOG.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
```

### README Structure

```md
# Agent-Memory

## What it does
## Supported tools
## Install
## Safe dry run
## Start worker
## Use with Claude Code
## Use with Cursor
## Dashboard
## Privacy
## Uninstall
## Troubleshooting
## Roadmap
## Contributing
```

---

## 24. Release Plan

## Version 1.2.1 — Fix Current Bugs

### Goals

- Stabilize current package.
- Fix public-facing bugs.

### Required Fixes

- Fix hardcoded CLI version.
- Fix empty search behavior.
- Fix `install --ide`.
- Fix README version mismatch.
- Fix binary command documentation.
- Fix uninstall confusion.
- Add basic `doctor` command.
- Add changelog.

---

## Version 1.3.0 — Public Beta

### Goals

- Safe for first global users.

### Features

- Stable Claude Code support.
- Stable Cursor support.
- Beta Windsurf support.
- Safe install preview.
- Config backups.
- Safe uninstall.
- Doctor command.
- Local dashboard.
- Memory search/store/list/delete.
- Export JSON/Markdown.
- Privacy docs.
- Security docs.
- GitHub Actions CI.

---

## Version 1.4.0 — Global Beta

### Goals

- Expand adoption and trust.

### Features

- Better dashboard.
- More robust MCP tools.
- Repair command.
- Import command.
- Project-level memory.
- Improved docs site.
- Demo video/GIF.
- Issue templates.
- Dependency scanning.

---

## Version 2.0.0 — Stable Launch

### Goals

- Serious public release.

### Features

- Stable plugin architecture.
- More IDE integrations.
- Optional cloud sync beta.
- Team memory experimental.
- Better ranking/search.
- Full test coverage target.
- Migration system.
- Signed releases if possible.

---

## 25. Success Metrics

### Product Metrics

| Metric | Target |
|---|---:|
| Successful install rate | >90% |
| Successful uninstall rate | >98% |
| Doctor command resolves common issues | >80% |
| CLI crash rate | <1% |
| Search under 300ms for 10k memories | Yes |
| First 100 external users | Achieved |
| GitHub stars | 50+ after public beta |
| GitHub issues with useful feedback | 10+ |
| Repeat usage | 30% weekly active users |

---

## 26. Quality Requirements

### Testing

Required test types:

- Unit tests
- CLI tests
- Installer tests
- Uninstaller tests
- Database tests
- MCP tool tests
- Windows path tests
- macOS path tests
- Linux path tests
- Config corruption tests
- Empty query tests
- Permission error tests

### CI

GitHub Actions should run:

```text
npm install
npm run build
npm test
npm run lint
npm audit
```

Across:

```text
Windows latest
macOS latest
Ubuntu latest
Node 18
Node 20
Node 22
```

---

## 27. Acceptance Criteria for Public Beta

Agent-Memory is ready for public beta only when:

- `agent-memory install --dry-run` works.
- `agent-memory install --ide claude` installs only Claude.
- `agent-memory uninstall --ide claude` removes only Claude config.
- `agent-memory doctor` detects broken config.
- Empty search does not crash.
- Dashboard opens locally.
- User can delete memory.
- User can export memory.
- Worker binds to `127.0.0.1`.
- Config backups are created.
- README matches actual behavior.
- Windows install has been manually tested.
- macOS install has been manually tested.
- Linux install has been manually tested.
- At least Claude Code and Cursor are verified.

---

## 28. Risks

### Risk 1: Installer Breaks User Config

**Severity:** High  
**Mitigation:** Dry-run, backup, restore, JSON validation, uninstall tests

### Risk 2: User Does Not Trust Memory Storage

**Severity:** High  
**Mitigation:** Local-first, privacy docs, dashboard visibility, delete/export controls

### Risk 3: Too Many IDEs Cause Instability

**Severity:** High  
**Mitigation:** Focus on Claude Code, Cursor, Windsurf first

### Risk 4: MCP Security Issues

**Severity:** High  
**Mitigation:** Input validation, local binding, no arbitrary command execution, safe mode

### Risk 5: README Overpromises

**Severity:** Medium  
**Mitigation:** Label features as Stable, Beta, Experimental, Planned

### Risk 6: Package Naming Looks Personal

**Severity:** Medium  
**Mitigation:** Later move to neutral org package such as `@agent-memory/cli`

---

## 29. Open Questions

1. Should Agent-Memory use only SQLite, or add vector search later?
2. Should auto-store be enabled by default?
3. Should cloud sync exist before v2?
4. Should the package move from `@preetham1590/agent-memory-ai` to an org package?
5. Should the web dashboard be bundled or separate?
6. Should Claude Code be the only stable target first?
7. Should Agent-Memory support workspace-level memory separately from global memory?
8. Should memory be human-editable Markdown files instead of only SQLite?
9. Should there be a VS Code extension later?
10. Should telemetry be completely absent forever, or opt-in only?

---

## 30. Recommended Immediate Task List

### P0 — Fix Before Any Promotion

```text
1. Fix CLI version mismatch.
2. Fix empty search.
3. Fix install --ide.
4. Add doctor command.
5. Add safe uninstall.
6. Add config backups.
7. Bind worker to 127.0.0.1.
8. Update README honestly.
9. Add SECURITY.md.
10. Add CHANGELOG.md.
```

### P1 — Needed for Public Beta

```text
1. Add dashboard memory delete/edit/export.
2. Add project-level memory.
3. Add tests for Windows/macOS/Linux.
4. Add GitHub Actions.
5. Add troubleshooting docs.
6. Add install dry-run.
7. Add repair command.
8. Add privacy page.
```

### P2 — Later

```text
1. Optional cloud sync.
2. Team sharing.
3. Advanced analytics.
4. Vector search.
5. More IDE integrations.
6. Docs website.
7. GitHub org and npm org migration.
```

---

## 31. Final Product Strategy

For global users, Agent-Memory should not launch as a giant “supports everything” tool.

It should launch as:

> A safe, local-first memory layer for Claude Code and Cursor, with experimental support for more AI coding tools.

Your strongest advantage is not adding many features. Your strongest advantage can be trust.

Build trust through:

- Safe install
- Safe uninstall
- Local-first privacy
- Clear docs
- Honest feature labels
- Good error messages
- Windows support
- Real troubleshooting

That is what will make global developers take the project seriously.
