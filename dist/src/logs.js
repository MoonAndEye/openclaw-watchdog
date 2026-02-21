"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printLogs = printLogs;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_util_1 = require("node:util");
const logger_1 = require("./logger");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
async function printLogs() {
    const logFile = (0, logger_1.getLogFilePath)();
    if (!node_fs_1.default.existsSync(logFile)) {
        console.log(`No logs found at ${logFile}`);
        return;
    }
    const { stdout } = await exec(`tail -n 50 ${shellQuote(logFile)}`);
    process.stdout.write(stdout);
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
//# sourceMappingURL=logs.js.map