import { test, expect } from '@playwright/test'
import { ROOT_NAME, fixtureName, openTree, sandbox } from './helpers'

/** The non-chart views + routing: deep links, the combined view, layout, exports. */
test.beforeEach(openTree)

test('deep link #/t/<slug>/p/<id> opens straight to that person', async ({ page }) => {
  const name = fixtureName('p001')
  // hash-only nav doesn't remount the app — reload so it mounts with the
  // person id in the route (how a shared cross-tree partner link arrives).
  await page.goto(`/#/t/${sandbox().slug}/p/p001`)
  await page.reload()

  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel).toBeVisible({ timeout: 20_000 })
  await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible()
  // and the chart is centred on that person's card
  await expect(page.locator('.ft-card__name', { hasText: name }).first()).toBeVisible()
})

test('combined view (#/t/<slug>/all) lists the whole tree', async ({ page }) => {
  await page.goto(`/#/t/${sandbox().slug}/all`)
  const cards = page.locator('.ft-card:not(.ft-card--synthetic)')
  await expect(cards.first()).toBeVisible({ timeout: 20_000 })
  // the fixture has ~180 people; after wives/husbands merge into their
  // spouse's card there are still well over 50 nodes
  expect(await cards.count()).toBeGreaterThan(50)
  await expect(page.locator('.ft-card__name', { hasText: ROOT_NAME }).first()).toBeVisible()
})

test('layout toggle flips the chart orientation', async ({ page }) => {
  const down = page.getByRole('button', { name: '⬇ надолу' })
  const up = page.getByRole('button', { name: '⬆ нагоре' })

  await expect(down).toBeVisible()
  await down.click()
  await expect(up).toBeVisible() // button label follows the layout
  // chart survives the re-layout
  await expect(page.locator('.ft-card__name', { hasText: ROOT_NAME }).first()).toBeVisible()

  await up.click()
  await expect(down).toBeVisible()
})

test('export PNG downloads an image of the chart', async ({ page }) => {
  await page.getByRole('button', { name: 'Действия' }).click()
  // full 180-node render → SVG → canvas → PNG can take a moment
  const download = page.waitForEvent('download', { timeout: 45_000 })
  await page.getByRole('menuitem', { name: 'Изтегли като PNG' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.png$/i)
})

test('export ICS downloads a birthdays calendar', async ({ page }) => {
  await page.getByRole('button', { name: 'Действия' }).click()
  const download = page.waitForEvent('download', { timeout: 20_000 })
  await page.getByRole('menuitem', { name: 'Изтегли календар (.ics)' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.ics$/i)
})
