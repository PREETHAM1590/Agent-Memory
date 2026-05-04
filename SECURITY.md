# Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 1.3.x   | ✅ Active         |
| < 1.3   | ❌ Not supported  |

## Reporting a Vulnerability

Report vulnerabilities via GitHub Issues: https://github.com/PREETHAM1590/Agent-Memory/issues

Do NOT open public issues for critical vulnerabilities. Email the maintainer directly or use GitHub's private vulnerability reporting if available.

## Security Features

- **Local-first**: All data stored locally by default. No cloud upload without explicit opt-in.
- **127.0.0.1 binding**: Worker binds to localhost only. Not exposed to network.
- **No arbitrary execution**: Memory content is never executed as shell commands.
- **Input validation**: All CLI and MCP inputs are validated with schemas.
- **Safe mode**: Run `agent-memory start --safe` to disable auto-store and external integrations.

## Best Practices

1. Keep the package updated: `agent-memory update`
2. Run `agent-memory doctor` to check for issues
3. Use `agent-memory install --dry-run` to preview changes before install
4. Backups are automatic. Check `~/.agent-memory/backups/`
5. Export data before major version upgrades

## Dependency Auditing

Run `npm audit` in the project directory to check for dependency vulnerabilities.