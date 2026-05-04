# Configuration

Config file: `~/.agent-memory/config.json`

Created automatically during install. Can be edited manually.

## Default Config

```json
{
  "port": 37800,
  "database": "~/.agent-memory/data/memory.db",
  "privacy": {
    "localOnly": true,
    "telemetry": false
  },
  "memory": {
    "maxResults": 10,
    "autoStore": true
  },
  "cloudSync": {
    "enabled": false,
    "provider": "none"
  },
  "plugins": []
}
```

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| port | number | 37800 | Worker HTTP server port |
| database | string | ~/.agent-memory/data/memory.db | SQLite database path |
| privacy.localOnly | boolean | true | Keep all data local |
| privacy.telemetry | boolean | false | Disable telemetry |
| memory.maxResults | number | 10 | Default search result limit |
| memory.autoStore | boolean | true | Auto-store session context |
| cloudSync.enabled | boolean | false | Enable cloud sync |
| cloudSync.provider | string | "none" | Sync provider |
| cloudSync.endpoint | string | - | Custom sync endpoint |
| plugins | string[] | [] | Plugin paths |

## Changing Config

Edit `~/.agent-memory/config.json` directly, then restart the worker:

```bash
npx @preetham1590/agent-memory-ai stop
npx @preetham1590/agent-memory-ai start
```

## View Active Config

```bash
npx @preetham1590/agent-memory-ai version
```