"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PID_FILE_PATH = exports.PLIST_PATH = exports.LAUNCH_AGENTS_DIR = exports.COOLDOWN_MS = exports.RESTART_LIMIT = exports.RESTART_WINDOW_MS = exports.RESTART_VERIFY_RETRIES = exports.RESTART_VERIFY_DELAY_MS = exports.CHECK_INTERVAL_MS = exports.HEALTH_CHECK_URL = exports.LABEL = void 0;
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
exports.LABEL = 'com.openclaw.watchdog';
exports.HEALTH_CHECK_URL = 'http://127.0.0.1:18789/';
exports.CHECK_INTERVAL_MS = 600_000;
exports.RESTART_VERIFY_DELAY_MS = 5_000;
exports.RESTART_VERIFY_RETRIES = 3;
exports.RESTART_WINDOW_MS = 5 * 60_000;
exports.RESTART_LIMIT = 5;
exports.COOLDOWN_MS = 10 * 60_000;
exports.LAUNCH_AGENTS_DIR = node_path_1.default.join(node_os_1.default.homedir(), 'Library', 'LaunchAgents');
exports.PLIST_PATH = node_path_1.default.join(exports.LAUNCH_AGENTS_DIR, `${exports.LABEL}.plist`);
const LOG_DIR = node_path_1.default.join(node_os_1.default.homedir(), 'Library', 'Logs', 'openclaw-watchdog');
exports.PID_FILE_PATH = node_path_1.default.join(LOG_DIR, 'watchdog.pid');
//# sourceMappingURL=constants.js.map