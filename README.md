# openclaw-watchdog

A production-ready, **macOS-only** Node.js CLI that installs a `launchd` watchdog for OpenClaw Gateway.

The watchdog checks `http://127.0.0.1:18789/` every 10 minutes and runs `openclaw gateway start` when the service is not responsive.

## Requirements

- macOS (uses `~/Library/LaunchAgents`)
- Node.js >= 18
- OpenClaw CLI available on `PATH`

## Installation

### npm (recommended)

```bash
npm install -g openclaw-watchdog
```

### Homebrew

This repository includes a formula template at `Formula/openclaw-watchdog.rb`.

1. Update the formula `sha256` with the npm tarball checksum for your release.
2. Install from your tap:

```bash
brew tap <your-org>/<your-tap>
brew install openclaw-watchdog
```

## CLI Usage

```bash
openclaw-watchdog install
openclaw-watchdog uninstall
openclaw-watchdog status
openclaw-watchdog logs
```

## What `install` does

- Creates `~/Library/LaunchAgents/com.openclaw.watchdog.plist`
- Configures `launchd` with:
  - `RunAtLoad = true` (starts at login)
  - `KeepAlive = true` (keeps runner alive)
- Loads the agent using `launchctl load`
- Writes logs to:
  - `~/Library/Logs/openclaw-watchdog/watchdog.log`

## Runner behavior

- Health check interval: `600s` (configurable constant in `src/constants.ts`)
- Health check method: HTTP GET `http://127.0.0.1:18789/` (expects 2xx)
- On failure: executes `openclaw gateway start`
- Post-restart verification: retries health check up to 3 times (5s intervals) to confirm gateway started
- Crash-loop protection:
  - If restart attempts exceed 5 within 5 minutes,
  - restart attempts are paused for 10 minutes,
  - warning is written to the log.

## Why launchd (and not cron / PM2)

- `launchd` is native macOS process supervision.
- User-level LaunchAgents require no sudo and integrate with login sessions.
- `cron` is schedule-focused and does not provide robust process supervision.
- `PM2` is a generic Node process manager; this project intentionally minimizes dependencies and aligns with native macOS service management.

## Security considerations

- Runs as the current user (not root).
- Uses absolute paths in LaunchAgent `ProgramArguments`.
- No privileged operations; writes only to user home directories.
- Runner executes a fixed command (`openclaw gateway start`) and logs outcomes.

## Bash scripts included

- `scripts/check-macos.sh`: postinstall check that warns when installed on non-macOS.

## Development

```bash
npm install
npm run build
node dist/src/cli.js status
```

## License

MIT
