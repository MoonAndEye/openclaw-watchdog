import { exec as execWithCallback } from 'node:child_process';
import net from 'node:net';
import { promisify } from 'node:util';
import {
  CHECK_INTERVAL_MS,
  COOLDOWN_MS,
  PORT,
  RESTART_LIMIT,
  RESTART_WINDOW_MS
} from './constants';
import { logError, logInfo, logWarn } from './logger';

const exec = promisify(execWithCallback);

async function isGatewayResponsive(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (value: boolean): void => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(value);
      }
    };

    socket.setTimeout(5000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, '127.0.0.1');
  });
}

function recordRestart(restartTimestamps: number[], now: number): number[] {
  const updated = restartTimestamps.filter((time) => now - time <= RESTART_WINDOW_MS);
  updated.push(now);
  return updated;
}

export async function runWatchdog(): Promise<void> {
  let restartTimestamps: number[] = [];
  let cooldownUntil = 0;

  const runCheck = async (): Promise<void> => {
    const now = Date.now();

    if (now < cooldownUntil) {
      logWarn(`Cooldown active until ${new Date(cooldownUntil).toISOString()}, skipping restart attempts.`);
      return;
    }

    const healthy = await isGatewayResponsive(PORT);
    if (healthy) {
      logInfo(`Health check succeeded on localhost:${PORT}.`);
      return;
    }

    restartTimestamps = restartTimestamps.filter((time) => now - time <= RESTART_WINDOW_MS);
    if (restartTimestamps.length >= RESTART_LIMIT) {
      cooldownUntil = now + COOLDOWN_MS;
      logWarn(
        `Restart limit exceeded (${RESTART_LIMIT} within ${Math.floor(
          RESTART_WINDOW_MS / 60000
        )} minutes). Pausing restarts for ${Math.floor(COOLDOWN_MS / 60000)} minutes.`
      );
      return;
    }

    logWarn('Health check failed. Attempting restart with "openclaw gateway start".');

    try {
      const { stdout, stderr } = await exec('openclaw gateway start');
      if (stdout.trim()) {
        logInfo(`Restart command output: ${stdout.trim()}`);
      }
      if (stderr.trim()) {
        logWarn(`Restart command stderr: ${stderr.trim()}`);
      }
      restartTimestamps = recordRestart(restartTimestamps, now);
      logInfo('Restart command completed.');
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
