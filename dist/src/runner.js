"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWatchdog = runWatchdog;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const constants_1 = require("./constants");
const health_1 = require("./health");
const logger_1 = require("./logger");
const execFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
function loadOpenclawPath() {
    try {
        const raw = node_fs_1.default.readFileSync(constants_1.CONFIG_FILE_PATH, 'utf8');
        const config = JSON.parse(raw);
        if (config.openclawPath) {
            return config.openclawPath;
        }
    }
    catch {
        // config missing or invalid
    }
    throw new Error(`Cannot read openclaw path from ${constants_1.CONFIG_FILE_PATH}. Run "openclaw-watchdog install" first.`);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
function acquirePidLock() {
    (0, logger_1.ensureLogDirectory)();
    try {
        const content = node_fs_1.default.readFileSync(constants_1.PID_FILE_PATH, 'utf8').trim();
        const existingPid = parseInt(content, 10);
        if (!Number.isNaN(existingPid) && isProcessRunning(existingPid)) {
            return false; // another watchdog is already running
        }
    }
    catch {
        // PID file doesn't exist or unreadable — safe to proceed
    }
    node_fs_1.default.writeFileSync(constants_1.PID_FILE_PATH, String(process.pid), { mode: 0o644 });
    return true;
}
function releasePidLock() {
    try {
        const content = node_fs_1.default.readFileSync(constants_1.PID_FILE_PATH, 'utf8').trim();
        if (parseInt(content, 10) === process.pid) {
            node_fs_1.default.rmSync(constants_1.PID_FILE_PATH, { force: true });
        }
    }
    catch {
        // Best effort cleanup
    }
}
function recordRestart(restartTimestamps, now) {
    const updated = restartTimestamps.filter((time) => now - time <= constants_1.RESTART_WINDOW_MS);
    updated.push(now);
    return updated;
}
async function verifyRestart() {
    for (let i = 0; i < constants_1.RESTART_VERIFY_RETRIES; i++) {
        await sleep(constants_1.RESTART_VERIFY_DELAY_MS);
        const healthy = await (0, health_1.checkGatewayHealth)();
        if (healthy) {
            return true;
        }
        (0, logger_1.logWarn)(`Restart verification attempt ${i + 1}/${constants_1.RESTART_VERIFY_RETRIES} failed, retrying...`);
    }
    return false;
}
async function runWatchdog() {
    if (!acquirePidLock()) {
        (0, logger_1.logWarn)('Another watchdog instance is already running. Exiting.');
        return;
    }
    const openclawPath = loadOpenclawPath();
    const nodeBinDir = node_path_1.default.dirname(process.execPath);
    const execEnv = {
        ...process.env,
        PATH: `${nodeBinDir}:${process.env.PATH ?? '/usr/bin:/bin'}`,
    };
    (0, logger_1.logInfo)(`Using openclaw at: ${openclawPath}`);
    process.on('exit', releasePidLock);
    process.on('SIGINT', () => {
        releasePidLock();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        releasePidLock();
        process.exit(0);
    });
    let restartTimestamps = [];
    let cooldownUntil = 0;
    const runCheck = async () => {
        const now = Date.now();
        if (now < cooldownUntil) {
            (0, logger_1.logWarn)(`Cooldown active until ${new Date(cooldownUntil).toISOString()}, skipping restart attempts.`);
            return;
        }
        const healthy = await (0, health_1.checkGatewayHealth)();
        if (healthy) {
            (0, logger_1.logInfo)(`Health check succeeded: ${constants_1.HEALTH_CHECK_URL}`);
            return;
        }
        restartTimestamps = restartTimestamps.filter((time) => now - time <= constants_1.RESTART_WINDOW_MS);
        if (restartTimestamps.length >= constants_1.RESTART_LIMIT) {
            cooldownUntil = now + constants_1.COOLDOWN_MS;
            (0, logger_1.logWarn)(`Restart limit exceeded (${constants_1.RESTART_LIMIT} within ${Math.floor(constants_1.RESTART_WINDOW_MS / 60000)} minutes). Pausing restarts for ${Math.floor(constants_1.COOLDOWN_MS / 60000)} minutes.`);
            return;
        }
        (0, logger_1.logWarn)('Health check failed. Attempting restart with "openclaw gateway install --force".');
        try {
            const { stdout, stderr } = await execFile(openclawPath, ['gateway', 'install', '--force'], { env: execEnv });
            if (stdout.trim()) {
                (0, logger_1.logInfo)(`Restart command output: ${stdout.trim()}`);
            }
            if (stderr.trim()) {
                (0, logger_1.logWarn)(`Restart command stderr: ${stderr.trim()}`);
            }
            restartTimestamps = recordRestart(restartTimestamps, now);
            const verified = await verifyRestart();
            if (verified) {
                (0, logger_1.logInfo)('Gateway restarted and verified healthy.');
            }
            else {
                (0, logger_1.logError)('Gateway restart command succeeded but health check still failing.');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            (0, logger_1.logError)(`Restart command failed: ${message}`);
            restartTimestamps = recordRestart(restartTimestamps, now);
        }
    };
    (0, logger_1.logInfo)('OpenClaw watchdog runner started.');
    await runCheck();
    setInterval(() => {
        runCheck().catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            (0, logger_1.logError)(`Unexpected runner error: ${message}`);
        });
    }, constants_1.CHECK_INTERVAL_MS);
}
if (require.main === module) {
    runWatchdog().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        (0, logger_1.logError)(`Fatal runner error: ${message}`);
        process.exitCode = 1;
    });
}
//# sourceMappingURL=runner.js.map