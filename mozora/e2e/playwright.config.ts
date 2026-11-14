// Playwright (brief section 14). Two ways to run:
//   - locally / in CI: no PLAYWRIGHT_BASE_URL, so this file starts the host API (3001), the Mozora API
//     (3002) and the Vite dev server (5173) itself, with the flag taken from MOZORA_ENABLED
//   - against a Vercel preview: set PLAYWRIGHT_BASE_URL (and VERCEL_AUTOMATION_BYPASS_SECRET when the
//     preview is protected); no servers are started
//
// Run the suite twice in CI, once per flag value: the specs read MOZORA_ENABLED to know what to expect.
import { defineConfig, devices } from '@playwright/test';

const external = process.env.PLAYWRIGHT_BASE_URL;
const flag = process.env.MOZORA_ENABLED === '1' ? '1' : '0';
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const serverEnv = {
  MOZORA_ENABLED: flag,
  VITE_MOZORA_ENABLED: flag,
  // Local runs never talk to a real database: the host falls back to its dev JSON files and Mozora
  // fails closed. Signed-in flows against the dev database arrive with the seed script in M1.
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  MOZORA_DATABASE_URL: '',
  AUTH_SECRET: 'e2e-only-secret-'.padEnd(48, 'x'),
};

export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]] : 'list',
  use: {
    baseURL: external || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } : {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: external
    ? undefined
    : [
        { command: 'node server/index.js', cwd: '../..', port: 3001, env: { ...serverEnv, PORT: '3001' }, reuseExistingServer: false },
        { command: 'npx tsx server/mozora/dev-server.ts', cwd: '../..', port: 3002, env: serverEnv, reuseExistingServer: false },
        { command: 'npx vite --port 5173 --strictPort', cwd: '../..', port: 5173, env: serverEnv, reuseExistingServer: false },
      ],
});
