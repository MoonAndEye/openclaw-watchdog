import os from 'node:os';
import path from 'node:path';

export const LABEL = 'com.openclaw.watchdog';
export const PORT = 8787;
export const CHECK_INTERVAL_MS = 600_000;
export const RESTART_WINDOW_MS = 5 * 60_000;
export const RESTART_LIMIT = 5;
export const COOLDOWN_MS = 10 * 60_000;

export const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');
export const PLIST_PATH = path.join(LAUNCH_AGENTS_DIR, `${LABEL}.plist`);
