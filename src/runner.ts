import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
import {
  CHECK_INTERVAL_MS,
  COOLDOWN_MS,
  HEALTH_CHECK_URL,
  PID_FILE_PATH,
  RESTART_LIMIT,
  RESTART_VERIFY_DELAY_MS,
  RESTART_VERIFY_RETRIES,
  RESTART_WINDOW_MS,
} from './constants';
import { checkGatewayHealth } from './health';
import { ensureLogDirectory, logError, logInfo, logWarn } from './logger';

const exec = promisify(execWithCallback);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquirePidLock(): boolean {
  ensureLogDirectory();

  try {
    const content = fs.readFileSync(PID_FILE_PATH, 'utf8').trim();
    const existingPid = parseInt(content, 10);
    if (!Number.isNaN(existingPid) && isProcessRunning(existingPid)) {
      return false; // another watchdog is already running
    }
  } catch {
    // PID file doesn't exist or unreadable — safe to proceed
  }

  fs.writeFileSync(PID_FILE_PATH, String(process.pid), { mode: 0o644 });
  return true;
}

function releasePidLock(): void {
  try {
    const content = fs.readFileSync(PID_FILE_PATH, 'utf8').trim();
    if (parseInt(content, 10) === process.pid) {
      fs.rmSync(PID_FILE_PATH, { force: true });
    }
  } catch {
    // Best effort cleanup
  }
}

function recordRestart(restartTimestamps: number[], now: number): number[] {
  const updated = restartTimestamps.filter(
    (time) => now - time <= RESTART_WINDOW_MS,
  );
  updated.push(now);
  return updated;
}

async function verifyRestart(): Promise<boolean> {
  for (let i = 0; i < RESTART_VERIFY_RETRIES; i++) {
    await sleep(RESTART_VERIFY_DELAY_MS);
    const healthy = await checkGatewayHealth();
    if (healthy) {
      return true;
    }
    logWarn(
      `Restart verification attempt ${i + 1}/${RESTART_VERIFY_RETRIES} failed, retrying...`,
    );
  }
  return false;
}

export async function runWatchdog(): Promise<void> {
  if (!acquirePidLock()) {
    logWarn('Another watchdog instance is already running. Exiting.');
    return;
  }

  process.on('exit', releasePidLock);
  process.on('SIGINT', () => {
    releasePidLock();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    releasePidLock();
    process.exit(0);
  });

  let restartTimestamps: number[] = [];
  let cooldownUntil = 0;

  const runCheck = async (): Promise<void> => {
    const now = Date.now();

    if (now < cooldownUntil) {
      logWarn(
        `Cooldown active until ${new Date(cooldownUntil).toISOString()}, skipping restart attempts.`,
      );
      return;
    }

    const healthy = await checkGatewayHealth();
    if (healthy) {
      logInfo(`Health check succeeded: ${HEALTH_CHECK_URL}`);
      return;
    }

    restartTimestamps = restartTimestamps.filter(
      (time) => now - time <= RESTART_WINDOW_MS,
    );
    if (restartTimestamps.length >= RESTART_LIMIT) {
      cooldownUntil = now + COOLDOWN_MS;
      logWarn(
        `Restart limit exceeded (${RESTART_LIMIT} within ${Math.floor(
          RESTART_WINDOW_MS / 60000,
        )} minutes). Pausing restarts for ${Math.floor(COOLDOWN_MS / 60000)} minutes.`,
      );
      return;
    }

    logWarn(
      'Health check failed. Attempting restart with "openclaw gateway start".',
    );

    try {
      // Hardcoded command — not user input, safe to use exec
      const { stdout, stderr } = await exec('openclaw gateway start');
      if (stdout.trim()) {
        logInfo(`Restart command output: ${stdout.trim()}`);
      }
      if (stderr.trim()) {
        logWarn(`Restart command stderr: ${stderr.trim()}`);
      }
      restartTimestamps = recordRestart(restartTimestamps, now);

      const verified = await verifyRestart();
      if (verified) {
        logInfo('Gateway restarted and verified healthy.');
      } else {
        logError(
          'Gateway restart command succeeded but health check still failing.',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(`Restart command failed: ${message}`);
      restartTimestamps = recordRestart(restartTimestamps, now);
    }
  };

  logInfo('OpenClaw watchdog runner started.');
  await runCheck();
  setInterval(() => {
    runCheck().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      logError(`Unexpected runner error: ${message}`);
    });
  }, CHECK_INTERVAL_MS);
}

if (require.main === module) {
  runWatchdog().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logError(`Fatal runner error: ${message}`);
    process.exitCode = 1;
  });
}
