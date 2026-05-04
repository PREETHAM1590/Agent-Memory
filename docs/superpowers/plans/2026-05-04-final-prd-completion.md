# Final PRD Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Close all remaining PRD items — safe mode, MCP rate limits, worker config endpoint, CONTRIBUTING.md, CODE_OF_CONDUCT.md

**Architecture:** 3 parallel worktree agents + inline docs. Each task is self-contained.

**Tech Stack:** TypeScript, better-sqlite3, Commander.js, MCP SDK

---

### Task 1: Safe Mode — Wire WorkerService to disable destructive ops

**Files:**
- Modify: `src/worker/index.ts`
- Modify: `src/cli.ts` (already has --safe flag, verify passes config)
- Test: `src/worker/index.test.ts`

- [ ] Add safe mode checks in WorkerService.setupRoutes(): skip POST/PATCH/DELETE routes when config.safeMode is true
- [ ] Add safe mode checks in MCP server: skip memory_store, memory_delete, memory_end_session when safe
- [ ] Build + test

### Task 2: MCP Rate Limits

**Files:**
- Modify: `src/mcp/server.ts`

- [ ] Add request tracking map with IP/session key, max 30 requests/min per session
- [ ] Add rate limit check before each tool handler runs
- [ ] Build + test

### Task 3: Worker /api/config Endpoint

**Files:**
- Modify: `src/worker/index.ts`
- Test: `src/worker/index.test.ts`

- [ ] Add GET /api/config route returning sanitized config (no secrets)
- [ ] Add PATCH /api/config route (only writable fields)
- [ ] Build + test

### Task 4: CONTRIBUTING.md + CODE_OF_CONDUCT.md

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`

- [ ] CONTRIBUTING.md: How to report bugs, submit PRs, dev setup (npm install, build, test), code style
- [ ] CODE_OF_CONDUCT.md: Standard Contributor Covenant v2.1

### Verification

```bash
npm run build
npx vitest run
# Verify: safe mode disables POST/PATCH routes
# Verify: rate limit blocks after 30 requests
# Verify: /api/config returns config JSON
```