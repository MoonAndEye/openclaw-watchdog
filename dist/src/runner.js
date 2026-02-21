"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWatchdog = runWatchdog;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const constants_1 = require("./constants");
const health_1 = require("./health");
const logger_1 = require("./logger");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
        (0, logger_1.logWarn)('Health check failed. Attempting restart with "openclaw gateway start".');
        try {
            // Hardcoded command — not user input, safe to use exec
            const { stdout, stderr } = await exec('openclaw gateway start');
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