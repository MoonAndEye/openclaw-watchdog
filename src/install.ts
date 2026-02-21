import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { generateLaunchdPlist } from '../templates/launchd';
import { LABEL, LAUNCH_AGENTS_DIR, PLIST_PATH } from './constants';
import { ensureLogDirectory, getLogFilePath, logInfo } from './logger';

const exec = promisify(execWithCallback);

function getRunnerPath(): string {
  return path.resolve(__dirname, 'runner.js');
}

function getNodePath(): string {
  return process.execPath;
}

export async function installWatchdog(): Promise<void> {
  fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
  ensureLogDirectory();

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
    await exec(`launchctl unload ${shellQuote(PLIST_PATH)}`);
  } catch {
    // Ignore unload failures; service may not be loaded yet.
  }

  await exec(`launchctl load ${shellQuote(PLIST_PATH)}`);
  logInfo(`Installed launchd agent at ${PLIST_PATH}`);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
