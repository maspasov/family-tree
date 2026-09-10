import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'

/**
 * E2E config. There is no Firebase emulator wiring (the Firestore emulator needs
 * Java), so the suite runs against the REAL Firebase project, signed in as a
 * dedicated email/password "bot" user — no interactive Google OAuth.
 *
 *   1. one-time:  enable Email/Password sign-in in the Firebase console, then
 *                 node scripts/setup-e2e-user.mjs --key <sa.json> --email <addr> --password <pw>
 *   2. one-time:  put VITE_E2E_EMAIL / VITE_E2E_PASSWORD in e2e/.env.e2e (gitignored)
 *   3.            yarn e2e
 *
 * Projects run in order: `auth` (bot sign-in) → `sandbox` (creates ONE shared
 * `e2e-<id>` tree, seeds it, writes e2e/.sandbox.json) → `chromium` (the
 * *.spec.ts files) → `cleanup` (deletes it). Spec files read the slug at
 * runtime via helpers.sandbox(). The cross-tree spec makes + deletes its own
 * throwaway partner tree in a beforeAll/afterAll.
 */

// load e2e/.env.e2e into process.env (no dotenv dependency)
const ENV_FILE = 'e2e/.env.e2e'
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

// Forward every VITE_* var that is actually set (Firebase config + the e2e
// login) to the dev server Playwright spawns. Only non-empty ones, so a bare
// `VITE_FIREBASE_*=''` never shadows a local .env.local.
const viteEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (e): e is [string, string] => e[0].startsWith('VITE_') && Boolean(e[1]),
  ),
)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    // `navigator.language` starts with "bg" → the app boots Bulgarian, so the
    // (Bulgarian) selectors match without clicking the БГ toggle.
    locale: 'bg-BG',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'auth', testMatch: /auth\.setup\.ts/ },
    {
      name: 'sandbox',
      testMatch: /sandbox\.setup\.ts/,
      dependencies: ['auth'],
      teardown: 'cleanup',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/state.json' },
    },
    {
      name: 'cleanup',
      testMatch: /sandbox\.teardown\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/state.json' },
    },
    {
      name: 'chromium',
      testMatch: /\.spec\.ts$/,
      dependencies: ['sandbox'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/state.json' },
    },
  ],
  webServer: {
    command: 'yarn dev --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // cold CI runner: Vite optimizeDeps on a big dep tree
    env: viteEnv,
  },
})
