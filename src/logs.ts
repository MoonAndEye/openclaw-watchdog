import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { getLogFilePath } from './logger';

const exec = promisify(execWithCallback);

export async function printLogs(): Promise<void> {
  const logFile = getLogFilePath();
  if (!fs.existsSync(logFile)) {
    console.log(`No logs found at ${logFile}`);
    return;
  }

  const { stdout } = await exec(`tail -n 50 ${shellQuote(logFile)}`);
  process.stdout.write(stdout);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
