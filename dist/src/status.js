"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStatus = printStatus;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const node_util_1 = require("node:util");
const constants_1 = require("./constants");
const health_1 = require("./health");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
async function isAgentLoaded() {
    try {
        // LABEL is a hardcoded constant, not user input
        await exec(`launchctl list ${constants_1.LABEL}`);
        return true;
    }
    catch {
        return false;
    }
}
async function printStatus() {
    const plistExists = node_fs_1.default.existsSync(constants_1.PLIST_PATH);
    const loaded = await isAgentLoaded();
    const gatewayHealthy = await (0, health_1.checkGatewayHealth)(3000);
    console.log('OpenClaw Watchdog Status');
    console.log('========================');
    console.log(`LaunchAgent plist: ${plistExists ? 'Present' : 'Missing'}`);
    console.log(`launchctl loaded:  ${loaded ? 'Yes' : 'No'}`);
    console.log(`Gateway (${constants_1.HEALTH_CHECK_URL}): ${gatewayHealthy ? 'Responsive' : 'Not responsive'}`);
    if (plistExists && loaded) {
        console.log('\nWatchdog is installed and loaded.');
    }
    else if (plistExists) {
        console.log('\nWatchdog plist exists, but agent is not loaded. Try reinstalling.');
    }
    else {
        console.log('\nWatchdog is not installed.');
    }
}
//# sourceMappingURL=status.js.map