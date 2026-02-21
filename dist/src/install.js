"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installWatchdog = installWatchdog;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const launchd_1 = require("../templates/launchd");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
function getRunnerPath() {
    return node_path_1.default.resolve(__dirname, 'runner.js');
}
function getNodePath() {
    return process.execPath;
}
async function installWatchdog() {
    node_fs_1.default.mkdirSync(constants_1.LAUNCH_AGENTS_DIR, { recursive: true });
    (0, logger_1.ensureLogDirectory)();
    const logFile = (0, logger_1.getLogFilePath)();
    const runnerPath = getRunnerPath();
    const plistContents = (0, launchd_1.generateLaunchdPlist)({
        label: constants_1.LABEL,
        nodePath: getNodePath(),
        runnerPath,
        workingDirectory: node_path_1.default.dirname(runnerPath),
        stdoutPath: logFile,
        stderrPath: logFile
    });
    node_fs_1.default.writeFileSync(constants_1.PLIST_PATH, plistContents, { mode: 0o644 });
    try {
        await exec(`launchctl unload ${shellQuote(constants_1.PLIST_PATH)}`);
    }
    catch {
        // Ignore unload failures; service may not be loaded yet.
    }
    await exec(`launchctl load ${shellQuote(constants_1.PLIST_PATH)}`);
    (0, logger_1.logInfo)(`Installed launchd agent at ${constants_1.PLIST_PATH}`);
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
//# sourceMappingURL=install.js.map