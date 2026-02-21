import os from 'node:os';
import path from 'node:path';

export const LABEL = 'com.openclaw.watchdog';
export const HEALTH_CHECK_URL = 'http://127.0.0.1:18789/';
export const CHECK_INTERVAL_MS = 600_000;
export const RESTART_VERIFY_DELAY_MS = 5_000;
export const RESTART_VERIFY_RETRIES = 3;
export const RESTART_WINDOW_MS = 5 * 60_000;
export const RESTART_LIMIT = 5;
export const COOLDOWN_MS = 10 * 60_000;

export const LAUNCH_AGENTS_DIR = path.join(
  os.homedir(),
  'Library',
  'LaunchAgents',
);
export const PLIST_PATH = path.join(LAUNCH_AGENTS_DIR, `${LABEL}.plist`);

const LOG_DIR = path.join(os.homedir(), 'Library', 'Logs', 'openclaw-watchdog');
export const PID_FILE_PATH = path.join(LOG_DIR, 'watchdog.pid');
export const CONFIG_FILE_PATH = path.join(LOG_DIR, 'config.json');
