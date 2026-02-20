import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { PLIST_PATH } from './constants';
import { logInfo } from './logger';

const exec = promisify(execWithCallback);

export async function uninstallWatchdog(): Promise<void> {
  if (fs.existsSync(PLIST_PATH)) {
    try {
      await exec(`launchctl unload ${shellQuote(PLIST_PATH)}`);
    } catch {
      // Ignore unload failures and continue cleanup.
    }

    fs.rmSync(PLIST_PATH, { force: true });
    logInfo(`Removed launchd agent at ${PLIST_PATH}`);
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
