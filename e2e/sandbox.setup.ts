import { test as setup } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { TEST_TREE, SANDBOX_FILE, createTree, importJson } from './helpers'

/**
 * Creates the single throwaway tree the spec files share (~180-person
 * `e2e-<id>`), seeded via the app's JSON import, and records its slug in
 * e2e/.sandbox.json. Removed again by sandbox.teardown.ts.
 *
 * (The cross-tree spec creates its own tiny partner tree in a beforeAll and
 * deletes it in afterAll — linking needs a second tree, but it never lives in
 * this shared setup.)
 */
setup('provision sandbox tree', async ({ page }) => {
  setup.setTimeout(200_000)
  const slug = `e2e-${Date.now().toString(36)}`
  await createTree(page, slug)
  await importJson(page, TEST_TREE)
  writeFileSync(SANDBOX_FILE, JSON.stringify({ slug }))
})
