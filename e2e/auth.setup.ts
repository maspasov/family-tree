import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

/**
 * No interactive login: the dev server is started with VITE_E2E_EMAIL /
 * VITE_E2E_PASSWORD (see playwright.config.ts + e2e/.env.e2e), so AuthContext
 * signs the bot user in on load. This step just waits for that and snapshots the
 * session to e2e/.auth/state.json for the spec project to reuse.
 */
const STATE = 'e2e/.auth/state.json'

setup('authenticate', async ({ page }) => {
  setup.setTimeout(60_000)

  if (!process.env.VITE_E2E_EMAIL || !process.env.VITE_E2E_PASSWORD) {
    throw new Error(
      'VITE_E2E_EMAIL / VITE_E2E_PASSWORD are not set. Create e2e/.env.e2e ' +
        '(see e2e/README.md) and run scripts/setup-e2e-user.mjs once.',
    )
  }

  await page.goto('/')
  await expect(
    page
      .getByRole('button', { name: /Ново дърво|New tree/ })
      .or(page.getByText(/Родословни дървета|Family trees/))
      .first(),
  ).toBeVisible({ timeout: 40_000 })

  mkdirSync('e2e/.auth', { recursive: true })
  await page.context().storageState({ path: STATE })
})
