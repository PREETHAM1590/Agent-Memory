# Contributing to Agent-Memory

## Getting Started

```bash
git clone https://github.com/PREETHAM1590/Agent-Memory.git
cd Agent-Memory
npm install
npm run build
```

## Development

### Commands

```bash
npm run build      # Compile TypeScript
npm test           # Run tests
npm run lint       # Lint source
```

### Project Structure

```
src/
  cli.ts             # CLI commands (commander.js)
  database/          # SQLite with FTS5 search
  installer/         # Multi-IDE detection and installation
  mcp/               # MCP stdio server
  worker/            # HTTP worker with REST API
  brain/             # Session management and context
  types/             # TypeScript interfaces
docs/                # Documentation
```

## Reporting Bugs

Open an issue at https://github.com/PREETHAM1590/Agent-Memory/issues

Include:
- Your OS and Node version
- Relevant output from `agent-memory doctor`
- Steps to reproduce

## Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `npm run build` and `npm test` to verify
5. Commit with conventional commit messages (feat:, fix:, docs:, test:, chore:)
6. Push and open a PR against `main`

## Code Style

- TypeScript strict mode
- Follow existing patterns in the codebase
- Write tests for new functionality
- Keep files focused — one responsibility per file

## License

By contributing, you agree that your contributions will be licensed under the MIT License.