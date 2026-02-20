import { Command } from 'commander';
import { installWatchdog } from './install';
import { printLogs } from './logs';
import { printStatus } from './status';
import { uninstallWatchdog } from './uninstall';

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
      await installWatchdog();
      console.log('OpenClaw watchdog installed and loaded.');
    });

  program
    .command('uninstall')
    .description('Unload and remove the launchd watchdog agent')
    .action(async () => {
      await uninstallWatchdog();
      console.log('OpenClaw watchdog uninstalled.');
    });

  program
    .command('status')
    .description('Show watchdog and gateway status')
    .action(async () => {
      await printStatus();
    });

  program
    .command('logs')
    .description('Print the last 50 watchdog log lines')
    .action(async () => {
      await printLogs();
    });

  await program.parseAsync(process.argv);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
