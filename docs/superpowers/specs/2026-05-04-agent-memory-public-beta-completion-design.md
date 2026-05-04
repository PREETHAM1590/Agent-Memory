# Agent-Memory Public Beta Completion Design

> **Goal:** Complete remaining P1 PRD requirements for v1.3.0 Public Beta — tests, CI, privacy docs, minor fixes.

**Architecture:** Parallel agent dispatch. Tests (biggest surface) + CI (single file) + Docs (markdown) + Minor fixes (targeted patches) run concurrently in isolated worktrees.

**Tech Stack:** TypeScript, vitest, GitHub Actions YAML, better-sqlite3, Commander.js

---

## Work Package 1 — Tests

**Location:** Create `src/**/*.test.ts` alongside source files (vitest convention)

**Test files, one per module:**

| File | Tests | Priority |
|------|-------|----------|
| `src/database/index.test.ts` | CRUD, FTS5 search, empty query, getDatabaseSize, listObservations, deleteObservation | Critical |
| `src/cli.test.ts` | Command parsing, option flags, version output, help output | High |
| `src/installer/auto-installer.test.ts` | detectAllIDEs, backupConfigFile, restoreBackup, validateConfig, dryRunInstall, verifyInstall, doctorCheck, repairIDE | High |
| `src/types/index.test.ts` | Type correctness, enum values | Medium |
| `src/mcp/server.test.ts` | Tool registration, input schemas | Medium |
| `src/worker/index.test.ts` | Route mounting, auth middleware, CORS | Medium |

**Vitest config:** Already in package.json, no additional config needed. Tests use `mock-fs` or temp directories to avoid touching real filesystem.

## Work Package 2 — GitHub Actions CI

**File:** `.github/workflows/ci.yml`

**Matrix:** windows-latest, macos-latest, ubuntu-latest × node 18, 20, 22

**Steps:** npm ci → npm run build → npm test → npm run lint

**Skip audit** for now (known issues with some deps). Can add later.

## Work Package 3 — Docs

**Files:** `docs/PRIVACY.md` (P1.8, required), `docs/CLI.md`, `docs/MCP.md`, `docs/CONFIG.md`, `docs/FAQ.md` (nice-to-haves)

**PRIVACY.md content required:**
- Local-first pledge
- No telemetry by default
- Data location (~/.agent-memory/)
- Export/delete instructions
- Config file contents
- Opt-in cloud sync policy

## Work Package 4 — Minor Fixes

| Fix | File | Description |
|-----|------|-------------|
| Summarization default off | `src/installer/auto-installer.ts` | Change config template `summarization.enabled` to `false` |
| Worker session/projects stubs | `src/worker/index.ts` | Return useful error messages not empty arrays |
| PATCH endpoint | `src/worker/index.ts` + `src/database/index.ts` | Add `updateObservation(id, data)` method and route |
| Safe mode | `src/cli.ts` | Add `start --safe` flag (disables auto-store) |

---

## Execution Plan

1. Write design doc (this file)
2. Create task list for 4 work packages
3. Dispatch 4 subagents in parallel using `superpowers:subagent-driven-development`
4. Each agent works in isolated worktree
5. After all complete, review diff, verify build
6. Commit with conventional commit messages

## Verification

- `npm run build` compiles clean
- `npm test` passes (vitest discovers .test.ts files)
- CI YAML is valid GitHub Actions syntax
- `docs/PRIVACY.md` exists and has content
- Worker PATCH route responds at `PATCH /api/memories/:id`
- Default config has summarization disabled