import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOG_DIR = path.join(os.homedir(), 'Library', 'Logs', 'openclaw-watchdog');
const LOG_FILE = path.join(LOG_DIR, 'watchdog.log');

export function getLogFilePath(): string {
  return LOG_FILE;
}

export function ensureLogDirectory(): void {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}\n`;
}

export function logInfo(message: string): void {
  writeLog('INFO', message);
}

export function logWarn(message: string): void {
  writeLog('WARN', message);
}

export function logError(message: string): void {
  writeLog('ERROR', message);
}

function writeLog(level: string, message: string): void {
  ensureLogDirectory();
  fs.appendFileSync(LOG_FILE, formatMessage(level, message), 'utf8');
}
