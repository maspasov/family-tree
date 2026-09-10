import { test, expect } from '@playwright/test'
import { TREE_B, createTree, importJson, deleteTree, linkToOtherTree, newBgPage, openTree, sandbox } from './helpers'

/**
 * Cross-tree marriage links + the combined view. Linking needs a *second*
 * tree, so this spec creates a tiny `e2e-p-<id>` partner tree just for its own
 * run and deletes it right after — it never touches the shared sandbox setup.
 */
const PARTNER_SLUG = `e2e-p-${Date.now().toString(36)}`
const PARTNER_RE = /партньорско/

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000)
  const page = await newBgPage(browser)
  await createTree(page, PARTNER_SLUG, 'E2E партньорско дърво')
  await importJson(page, TREE_B)
  await page.close()
})

test.afterAll(async ({ browser }) => {
  test.setTimeout(120_000)
  const page = await newBgPage(browser)
  await deleteTree(page, PARTNER_SLUG).catch((e) => console.warn(`partner cleanup:`, (e as Error).message))
  await page.close()
})

test.beforeEach(openTree)

test('link a partner in another tree, then unlink', async ({ page }) => {
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')

  await linkToOtherTree(page, PARTNER_RE)

  // toolbar gains the linked-trees chip; panel shows the cross-tree fact
  await expect(
    page.getByRole('button', { name: /Свързани дървета|1/ }).first(),
  ).toBeVisible({ timeout: 15_000 })
  await page.locator('.ft-card__name').first().click()
  await expect(panel.getByText('Съпруг/а в друго дърво')).toBeVisible()

  page.once('dialog', (d) => d.accept()) // window.confirm in removePartnerLink
  await panel.getByRole('button', { name: 'Премахни връзката' }).click()
  await expect(panel.getByText('Съпруг/а в друго дърво')).toHaveCount(0, { timeout: 15_000 })
})

test('combined view renders both linked trees', async ({ page }) => {
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')
  if (await panel.getByRole('button', { name: 'Свържи с друго дърво' }).isVisible()) {
    await linkToOtherTree(page, PARTNER_RE)
  }

  await page.goto(`/#/t/${sandbox().slug}/all`)
  await expect(page.locator('.ft-card').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.ft-card__tree', { hasText: PARTNER_RE }).first()).toBeVisible()

  // clean up the link so later spec files see an unlinked tree
  await page.goto(`/#/t/${sandbox().slug}`)
  await page.locator('.ft-card__name').first().click()
  const unlink = panel.getByRole('button', { name: 'Премахни връзката' })
  if (await unlink.isVisible()) {
    page.once('dialog', (d) => d.accept())
    await unlink.click()
    await expect(panel.getByText('Съпруг/а в друго дърво')).toHaveCount(0, { timeout: 15_000 })
  }
})
