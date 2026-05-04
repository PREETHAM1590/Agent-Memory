# Changelog

## [1.3.0] - 2026-05-04

### Added
- `doctor` command: diagnose setup issues (node version, config, database, worker, IDE config)
- `repair` command: fix broken IDE configuration
- `list` command: list all stored memories
- `delete <id>` command: delete a memory
- `stop` command: stop the worker service
- `version` command: show version and system info
- `install --dry-run`: preview changes without modifying files
- `install --yes`: skip confirmation prompt
- `detect --json`: output detection results as JSON
- `uninstall --restore`: restore original config from backup
- Config backups before every IDE config modification
- Post-install and post-uninstall verification
- SECURITY.md, INSTALL.md, UNINSTALL.md, TROUBLESHOOTING.md documentation

### Changed
- Worker binds to 127.0.0.1 (was localhost)
- README: honest feature maturity labels (Stable/Beta/Experimental/Planned)
- Install shows preview of files to modify and backup paths

### Fixed
- Empty search no longer crashes
- `install --ide` works for specific IDE targeting
- CLI version matches package.json version

## [1.2.1] - 2026-04-XX

### Fixed
- Version mismatch between CLI and package.json
- Various installer stability improvements

## [1.1.0] - 2026-04-XX

### Added
- Update and uninstall commands
- 13 AI IDE support with accurate configurations

## [1.0.0] - 2026-04-XX

### Added
- Initial release
- Auto-detection of AI IDEs
- MCP server integration
- SQLite memory database
- Web dashboard