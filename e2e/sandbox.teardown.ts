import { test as teardown } from '@playwright/test'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { SANDBOX_FILE, deleteTree } from './helpers'

/** Deletes the tree created by sandbox.setup.ts. Runs even if specs failed. */
teardown('remove sandbox tree', async ({ page }) => {
  teardown.setTimeout(200_000)
  if (!existsSync(SANDBOX_FILE)) return
  const { slug } = JSON.parse(readFileSync(SANDBOX_FILE, 'utf8')) as { slug: string }
  await deleteTree(page, slug).catch((e) => console.warn(`teardown ${slug}:`, (e as Error).message))
  rmSync(SANDBOX_FILE, { force: true })
})
