import { defineConfig } from '@playwright/test';

// One smoke test. It uses the Chrome already installed on the machine (no browser download),
// a throwaway database, and seeded dice so a run is repeatable.
const api = {
  DATABASE_PATH: './e2e.db',
  JWT_SECRET: 'e2e-secret-not-for-real-use',
  DEMO_PASSWORD: 'demo1234',
  DICE_SEED: '7',
  PORT: '3000',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: { baseURL: 'http://localhost:5173', channel: 'chrome', trace: 'retain-on-failure' },
  webServer: [
    {
      command:
        'rm -f e2e.db e2e.db-wal e2e.db-shm && node src/scripts/seed.ts && node src/index.ts',
      cwd: './server',
      env: api,
      url: 'http://localhost:3000/api/auth/me',
      // 401 without a token is the API's way of saying "up".
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -w @dice/client',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
