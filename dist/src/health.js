"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGatewayHealth = checkGatewayHealth;
const node_http_1 = __importDefault(require("node:http"));
const constants_1 = require("./constants");
function checkGatewayHealth(timeoutMs = 5000) {
    return new Promise((resolve) => {
        const req = node_http_1.default.get(constants_1.HEALTH_CHECK_URL, { timeout: timeoutMs }, (res) => {
            // Any 2xx response means the gateway is alive
            const ok = res.statusCode !== undefined &&
                res.statusCode >= 200 &&
                res.statusCode < 300;
            res.resume(); // drain the response
            resolve(ok);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}
//# sourceMappingURL=health.js.map