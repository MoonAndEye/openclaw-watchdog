"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const install_1 = require("./install");
const logs_1 = require("./logs");
const status_1 = require("./status");
const uninstall_1 = require("./uninstall");
function ensureMacOS() {
    if (process.platform !== 'darwin') {
        throw new Error('openclaw-watchdog is macOS-only and requires launchd.');
    }
}
async function run() {
    const program = new commander_1.Command();
    program
        .name('openclaw-watchdog')
        .description('macOS launchd watchdog for OpenClaw Gateway')
        .version('1.0.0');
    program
        .command('install')
        .description('Install and load the launchd watchdog agent')
        .action(async () => {
        ensureMacOS();
        await (0, install_1.installWatchdog)();
        console.log('OpenClaw watchdog installed and loaded.');
    });
    program
        .command('uninstall')
        .description('Unload and remove the launchd watchdog agent')
        .action(async () => {
        ensureMacOS();
        await (0, uninstall_1.uninstallWatchdog)();
        console.log('OpenClaw watchdog uninstalled.');
    });
    program
        .command('status')
        .description('Show watchdog and gateway status')
        .action(async () => {
        ensureMacOS();
        await (0, status_1.printStatus)();
    });
    program
        .command('logs')
        .description('Print the last 50 watchdog log lines')
        .action(async () => {
        ensureMacOS();
        await (0, logs_1.printLogs)();
    });
    await program.parseAsync(process.argv);
}
run().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
});
//# sourceMappingURL=cli.js.map