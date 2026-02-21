import { exec as execWithCallback } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { HEALTH_CHECK_URL, LABEL, PLIST_PATH } from './constants';
import { checkGatewayHealth } from './health';

const exec = promisify(execWithCallback);

async function isAgentLoaded(): Promise<boolean> {
  try {
    // LABEL is a hardcoded constant, not user input
    await exec(`launchctl list ${LABEL}`);
    return true;
  } catch {
    return false;
  }
}

export async function printStatus(): Promise<void> {
  const plistExists = fs.existsSync(PLIST_PATH);
  const loaded = await isAgentLoaded();
  const gatewayHealthy = await checkGatewayHealth(3000);

  console.log('OpenClaw Watchdog Status');
  console.log('========================');
  console.log(`LaunchAgent plist: ${plistExists ? 'Present' : 'Missing'}`);
  console.log(`launchctl loaded:  ${loaded ? 'Yes' : 'No'}`);
  console.log(
    `Gateway (${HEALTH_CHECK_URL}): ${gatewayHealthy ? 'Responsive' : 'Not responsive'}`,
  );

  if (plistExists && loaded) {
    console.log('\nWatchdog is installed and loaded.');
  } else if (plistExists) {
    console.log(
      '\nWatchdog plist exists, but agent is not loaded. Try reinstalling.',
    );
  } else {
    console.log('\nWatchdog is not installed.');
  }
}
