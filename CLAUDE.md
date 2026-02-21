# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

macOS-only Node.js CLI that installs a `launchd` watchdog for OpenClaw Gateway. It monitors the gateway via TCP health checks and automatically restarts it on failure, with crash-loop protection.

Platform guard is enforced at runtime — every CLI command calls `ensureMacOS()` first.

## Build & Run

```bash
npm install          # also triggers build via "prepare" script
npm run build        # TypeScript → dist/ (tsc -p tsconfig.json)
npm run clean        # rm -rf dist
node dist/src/cli.js # run CLI directly
```

There is **no test suite** and **no linter** configured.

## Architecture

Thin CLI shell (`commander`) delegating to focused single-responsibility modules:

- **`src/cli.ts`** — Entry point. Defines four subcommands: `install`, `uninstall`, `status`, `logs`. Catches errors at top level and sets `process.exitCode = 1` (never calls `process.exit()`).
- **`src/runner.ts`** — Long-running watchdog process invoked by launchd (not by the user). Uses `net.Socket` TCP health checks with in-memory crash-loop protection (rolling window of restart timestamps). Has `require.main === module` guard.
- **`src/constants.ts`** — Single source of truth for all tunable values (port, intervals, paths, labels).
- **`src/install.ts`** — Writes `.plist`, runs `launchctl load`. Embeds absolute paths to node and runner.js.
- **`src/logger.ts`** — Append-only file logger to `~/Library/Logs/openclaw-watchdog/watchdog.log`.
- **`templates/launchd.ts`** — Pure function generating Apple Property List XML with XML escaping.

## Key Conventions

- **CommonJS** — `"type": "commonjs"` in package.json, `module: "CommonJS"` in tsconfig. No ESM.
- **Strict TypeScript** — `strict: true`; all functions have explicit return types.
- **Minimal dependencies** — Only `commander` as a runtime dependency; everything else uses Node.js built-ins (`node:fs`, `node:os`, `node:path`, `node:net`, `node:child_process`, `node:util`).
- **Async pattern** — `promisify(exec)` from `node:util` for shell commands. All command handlers are `async`.
- **`shellQuote`** — Currently duplicated in `install.ts`, `uninstall.ts`, and `logs.ts` (not shared).

## Runtime File Locations (macOS)

| Item | Path |
|------|------|
| LaunchAgent plist | `~/Library/LaunchAgents/com.openclaw.watchdog.plist` |
| Log file | `~/Library/Logs/openclaw-watchdog/watchdog.log` |

## Distribution

- **npm:** `npm install -g openclaw-watchdog`
- **Homebrew:** Formula at `Formula/openclaw-watchdog.rb` (sha256 is a placeholder — must be updated per release)
