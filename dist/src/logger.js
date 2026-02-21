"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogFilePath = getLogFilePath;
exports.ensureLogDirectory = ensureLogDirectory;
exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logError = logError;
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const LOG_DIR = node_path_1.default.join(node_os_1.default.homedir(), 'Library', 'Logs', 'openclaw-watchdog');
const LOG_FILE = node_path_1.default.join(LOG_DIR, 'watchdog.log');
function getLogFilePath() {
    return LOG_FILE;
}
function ensureLogDirectory() {
    node_fs_1.default.mkdirSync(LOG_DIR, { recursive: true });
}
function formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
}
function logInfo(message) {
    writeLog('INFO', message);
}
function logWarn(message) {
    writeLog('WARN', message);
}
function logError(message) {
    writeLog('ERROR', message);
}
function writeLog(level, message) {
    ensureLogDirectory();
    node_fs_1.default.appendFileSync(LOG_FILE, formatMessage(level, message), 'utf8');
}
//# sourceMappingURL=logger.js.map