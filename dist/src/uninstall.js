"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallWatchdog = uninstallWatchdog;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_util_1 = require("node:util");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
async function uninstallWatchdog() {
    if (node_fs_1.default.existsSync(constants_1.PLIST_PATH)) {
        try {
            await exec(`launchctl unload ${shellQuote(constants_1.PLIST_PATH)}`);
        }
        catch {
            // Ignore unload failures and continue cleanup.
        }
        node_fs_1.default.rmSync(constants_1.PLIST_PATH, { force: true });
        (0, logger_1.logInfo)(`Removed launchd agent at ${constants_1.PLIST_PATH}`);
    }
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
//# sourceMappingURL=uninstall.js.map