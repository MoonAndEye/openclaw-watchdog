import http from 'node:http';
import { HEALTH_CHECK_URL } from './constants';

export function checkGatewayHealth(timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_CHECK_URL, { timeout: timeoutMs }, (res) => {
      // Any 2xx response means the gateway is alive
      const ok =
        res.statusCode !== undefined &&
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
