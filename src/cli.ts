import { Command } from 'commander';
import { installWatchdog } from './install';
import { printLogs } from './logs';
import { printStatus } from './status';
import { uninstallWatchdog } from './uninstall';

function ensureMacOS(): void {
  if (process.platform !== 'darwin') {
    throw new Error('openclaw-watchdog is macOS-only and requires launchd.');
  }
}

async function run(): Promise<void> {
  const program = new Command();

  program
    .name('openclaw-watchdog')
    .description('macOS launchd watchdog for OpenClaw Gateway')
    .version('1.0.0');

  program
    .command('install')
    .description('Install and load the launchd watchdog agent')
    .action(async () => {
      ensureMacOS();
      await installWatchdog();
      console.log('OpenClaw watchdog installed and loaded.');
    });

  program
    .command('uninstall')
    .description('Unload and remove the launchd watchdog agent')
    .action(async () => {
      ensureMacOS();
      await uninstallWatchdog();
      console.log('OpenClaw watchdog uninstalled.');
    });

  program
    .command('status')
    .description('Show watchdog and gateway status')
    .action(async () => {
      ensureMacOS();
      await printStatus();
    });

  program
    .command('logs')
    .description('Print the last 50 watchdog log lines')
    .action(async () => {
      ensureMacOS();
      await printLogs();
    });

  await program.parseAsync(process.argv);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
