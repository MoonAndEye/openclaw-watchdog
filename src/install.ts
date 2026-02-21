import { execFileSync, exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { generateLaunchdPlist } from '../templates/launchd';
import {
  CONFIG_FILE_PATH,
  LABEL,
  LAUNCH_AGENTS_DIR,
  PLIST_PATH,
} from './constants';
import { ensureLogDirectory, getLogFilePath, logInfo } from './logger';

const exec = promisify(execWithCallback);

function getRunnerPath(): string {
  return path.resolve(__dirname, 'runner.js');
}

function getNodePath(): string {
  return process.execPath;
}

function resolveOpenclawPath(): string {
  try {
    return execFileSync('which', ['openclaw'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(
      'Could not find "openclaw" on PATH. Make sure OpenClaw is installed.',
    );
  }
}

export interface InstallOptions {
  intervalMinutes?: number;
}

export async function installWatchdog(
  options: InstallOptions = {},
): Promise<void> {
  const openclawPath = resolveOpenclawPath();
  const intervalMs = options.intervalMinutes
    ? options.intervalMinutes * 60_000
    : undefined;

  fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
  ensureLogDirectory();

  // Save config for the runner to use under launchd
  const config: Record<string, unknown> = { openclawPath };
  if (intervalMs !== undefined) {
    config.checkIntervalMs = intervalMs;
  }
  fs.writeFileSync(CONFIG_FILE_PATH, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o644,
  });

  const logFile = getLogFilePath();
  const runnerPath = getRunnerPath();
  const plistContents = generateLaunchdPlist({
    label: LABEL,
    nodePath: getNodePath(),
    runnerPath,
    workingDirectory: path.dirname(runnerPath),
    stdoutPath: logFile,
    stderrPath: logFile,
  });

  fs.writeFileSync(PLIST_PATH, plistContents, { mode: 0o644 });

  try {
    // Hardcoded path constant, not user input
    await exec(`launchctl unload ${shellQuote(PLIST_PATH)}`);
  } catch {
    // Ignore unload failures; service may not be loaded yet.
  }

  await exec(`launchctl load ${shellQuote(PLIST_PATH)}`);
  logInfo(`Installed launchd agent at ${PLIST_PATH}`);
  logInfo(`Resolved openclaw path: ${openclawPath}`);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
