import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import { promisify } from 'node:util';
import { LABEL, PLIST_PATH, PORT } from './constants';

const exec = promisify(execWithCallback);

async function isAgentLoaded(): Promise<boolean> {
  try {
    await exec(`launchctl list ${LABEL}`);
    return true;
  } catch {
    return false;
  }
}

async function isPortOpen(port: number): Promise<boolean> {
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

    socket.setTimeout(3000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, '127.0.0.1');
  });
}

export async function printStatus(): Promise<void> {
  const plistExists = fs.existsSync(PLIST_PATH);
  const loaded = await isAgentLoaded();
  const portOpen = await isPortOpen(PORT);

  console.log('OpenClaw Watchdog Status');
  console.log('========================');
  console.log(`LaunchAgent plist: ${plistExists ? 'Present' : 'Missing'}`);
  console.log(`launchctl loaded:  ${loaded ? 'Yes' : 'No'}`);
  console.log(`Gateway (localhost:${PORT}): ${portOpen ? 'Responsive' : 'Not responsive'}`);

  if (plistExists && loaded) {
    console.log('\nWatchdog is installed and loaded.');
  } else if (plistExists) {
    console.log('\nWatchdog plist exists, but agent is not loaded. Try reinstalling.');
  } else {
    console.log('\nWatchdog is not installed.');
  }
}
