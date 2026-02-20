#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "[openclaw-watchdog] Warning: this package is macOS-only (launchd)." >&2
fi
