# openclaw-watchdog

A production-ready, **macOS-only** Node.js CLI that installs a `launchd` watchdog for OpenClaw Gateway.

The watchdog periodically checks `http://127.0.0.1:18789/` and runs `openclaw gateway install --force` when the service is not responsive.

## Requirements

- macOS (uses `~/Library/LaunchAgents`)
- Node.js >= 18
- OpenClaw CLI available on `PATH`

## Installation

```bash
npm install -g openclaw-watchdog
```

## CLI Commands

### `openclaw-watchdog install`

Register and start the watchdog as a macOS LaunchAgent. Only needs to run once — the watchdog will auto-start on every login after this.

```bash
openclaw-watchdog install              # default: check every 10 minutes
openclaw-watchdog install --interval 5 # check every 5 minutes
```

**Options:**

| Flag | Description |
|------|-------------|
| `--interval <minutes>` | Health check interval in minutes (default: 10) |

**What it does:**

- Resolves the absolute path to `openclaw` and saves it to config (so the runner works under launchd where `PATH` is minimal)
- Creates `~/Library/LaunchAgents/com.openclaw.watchdog.plist`
- Configures `launchd` with `RunAtLoad = true` and `KeepAlive = true`
- Loads the agent immediately

### `openclaw-watchdog uninstall`

Stop the watchdog and remove the LaunchAgent from the system.

### `openclaw-watchdog status`

Show the current state of the watchdog and gateway.

```
OpenClaw Watchdog Status
========================
LaunchAgent plist: Present
launchctl loaded:  Yes
Gateway (http://127.0.0.1:18789/): Responsive

Watchdog is installed and loaded.
```

### `openclaw-watchdog logs`

Print the last 50 lines of the watchdog log (`~/Library/Logs/openclaw-watchdog/watchdog.log`).

## Runner behavior

- Health check method: HTTP GET `http://127.0.0.1:18789/` (expects 2xx)
- On failure: executes `openclaw gateway install --force`
- Post-restart verification: retries health check up to 3 times (5s intervals) to confirm gateway started
- Single-process protection: uses a PID file lock to ensure only one watchdog instance runs
- Crash-loop protection: if restart attempts exceed 5 within 5 minutes, pauses for 10 minutes

## Security considerations

- Runs as the current user (not root).
- Uses absolute paths for the `openclaw` binary and LaunchAgent `ProgramArguments`.
- No privileged operations; writes only to user home directories.
- Runner executes a fixed command (`openclaw gateway install --force`) and logs outcomes.

## Development

```bash
npm install
npm run build
npm run lint
node dist/src/cli.js status
```

## License

MIT
