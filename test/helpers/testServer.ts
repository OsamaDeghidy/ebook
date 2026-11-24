import http from 'http';
import fs from 'fs';
import path from 'path';

// Force VERCEL='1' before importing server so it does not auto-listen on port 3000
process.env.VERCEL = '1';

// Provide deterministic mock GCS credentials in clean CI test runners (Cloud Build / GitHub Actions)
if (!process.env.GCS_ACCESS_KEY) {
  process.env.GCS_ACCESS_KEY = 'test_mock_access_key';
}
if (!process.env.GCS_SECRET_KEY) {
  process.env.GCS_SECRET_KEY = 'test_mock_secret_key_1234567890abcdef';
}
if (!process.env.GCS_BUCKET_NAME) {
  process.env.GCS_BUCKET_NAME = 'ebookstoreg';
}

// Unref any background intervals so tests can exit cleanly without hanging on timers
const originalSetInterval = globalThis.setInterval;
(globalThis as any).setInterval = function (callback: any, ms?: number, ...args: any[]) {
  const timer = originalSetInterval(callback, ms, ...args);
  if (timer && typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
};

// Ensure PERSISTENT_UPLOADS_DIR exists locally for tests
const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface TestServerInstance {
  server: http.Server;
  port: number;
  baseUrl: string;
  close: () => Promise<void>;
}

let activeInstance: TestServerInstance | null = null;

export async function getTestServer(): Promise<TestServerInstance> {
  if (activeInstance) {
    return activeInstance;
  }

  // Import app from server.ts
  const serverModule = await import('../../server.ts');
  const app = serverModule.default || serverModule.app;

  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        return reject(new Error('Failed to obtain server address'));
      }
      const port = addr.port;
      const baseUrl = `http://127.0.0.1:${port}`;
      activeInstance = {
        server,
        port,
        baseUrl,
        close: () => {
          return new Promise((res) => {
            if (activeInstance) {
              activeInstance.server.close(() => {
                activeInstance = null;
                res();
              });
            } else {
              res();
            }
          });
        },
      };
      resolve(activeInstance);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}
