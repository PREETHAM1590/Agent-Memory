# CLI Reference

## Installation

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai install` | Detect and install for all detected IDEs |
| `npx @preetham1590/agent-memory-ai install --ide <ide>` | Install for specific IDE only |
| `npx @preetham1590/agent-memory-ai install --all` | Install for all supported IDEs |
| `npx @preetham1590/agent-memory-ai install --dry-run` | Preview changes without modifying files |
| `npx @preetham1590/agent-memory-ai install --yes` | Skip confirmation prompt |
| `npx @preetham1590/agent-memory-ai detect` | List detected IDEs (no changes) |
| `npx @preetham1590/agent-memory-ai detect --json` | List detected IDEs as JSON |
| `npx @preetham1590/agent-memory-ai list-ides` | List all supported IDE types |

## Memory Operations

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai store <type> <title> [content]` | Store a new memory |
| `npx @preetham1590/agent-memory-ai store <type> <title> [content] --tags <tags>` | Store with comma-separated tags |
| `npx @preetham1590/agent-memory-ai search <query>` | Search memory |
| `npx @preetham1590/agent-memory-ai search <query> --type <type>` | Search filtered by type |
| `npx @preetham1590/agent-memory-ai search <query> --limit <n>` | Search with result limit |
| `npx @preetham1590/agent-memory-ai list` | List recent memories |
| `npx @preetham1590/agent-memory-ai list --limit <n>` | List with custom limit |
| `npx @preetham1590/agent-memory-ai list --offset <n>` | List with pagination offset |
| `npx @preetham1590/agent-memory-ai delete <id>` | Delete a memory by ID |
| `npx @preetham1590/agent-memory-ai delete <id> --yes` | Delete without confirmation |
| `npx @preetham1590/agent-memory-ai export [format]` | Export memories (json, csv, markdown) |
| `npx @preetham1590/agent-memory-ai export json --output <file>` | Export to file |
| `npx @preetham1590/agent-memory-ai stats` | Show memory statistics |

## System Management

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai start` | Start worker on port 37800 |
| `npx @preetham1590/agent-memory-ai start --port <port>` | Start worker on custom port |
| `npx @preetham1590/agent-memory-ai stop` | Stop running worker |
| `npx @preetham1590/agent-memory-ai status` | Show worker and database status |
| `npx @preetham1590/agent-memory-ai web` | Open web dashboard in browser |
| `npx @preetham1590/agent-memory-ai mcp` | Start MCP server (for IDE integration) |
| `npx @preetham1590/agent-memory-ai update` | Update to latest version |
| `npx @preetham1590/agent-memory-ai version` | Show version and system information |

## Diagnostics

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai doctor` | Diagnose setup issues |
| `npx @preetham1590/agent-memory-ai doctor --json` | Doctor output as JSON |
| `npx @preetham1590/agent-memory-ai repair` | Repair broken configuration |
| `npx @preetham1590/agent-memory-ai repair --ide <ide>` | Repair specific IDE only |

## Uninstall

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai uninstall` | Remove from all detected IDEs |
| `npx @preetham1590/agent-memory-ai uninstall --ide <ide>` | Remove from specific IDE |
| `npx @preetham1590/agent-memory-ai uninstall --keep-data` | Remove config, keep database |
| `npx @preetham1590/agent-memory-ai uninstall --restore` | Restore original config from backup |
| `npx @preetham1590/agent-memory-ai uninstall --all` | Remove from all IDEs |

## Session Commands

| Command | Description |
|---------|-------------|
| `npx @preetham1590/agent-memory-ai init` | Initialize session context |
| `npx @preetham1590/agent-memory-ai init --project <path>` | Initialize with project path |
| `npx @preetham1590/agent-memory-ai context` | Show agent brain context |
| `npx @preetham1590/agent-memory-ai log <type> <content>` | Log activity to current session |
| `npx @preetham1590/agent-memory-ai sync` | Sync context to all IDEs