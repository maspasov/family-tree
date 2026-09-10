import { test, expect } from '@playwright/test'
import { cardCount, openTree } from './helpers'

/** Tree canvas, search, view switching, i18n, export. */
test.beforeEach(openTree)

test('renders the imported tree with the root card', async ({ page }) => {
  expect(await cardCount(page)).toBeGreaterThan(10)
  await expect(page.locator('.ft-card__name', { hasText: 'Брусарски' }).first()).toBeVisible()
  await expect(page.getByText(/Грешка:|Error:/)).toHaveCount(0)
})

test('expand all shows more cards than collapse all', async ({ page }) => {
  await page.getByRole('button', { name: 'Разгъни всички' }).click()
  await expect.poll(() => cardCount(page), { timeout: 20_000 }).toBeGreaterThan(60)
  const expanded = await cardCount(page)
  await page.getByRole('button', { name: 'Свий всички' }).click()
  await expect.poll(() => cardCount(page), { timeout: 20_000 }).toBeLessThan(expanded)
})

test('search selects a person, opens their panel and centres the chart', async ({ page }) => {
  const box = page.getByPlaceholder('Търсене на човек…')
  await box.click()
  await box.fill('Иван')
  await page.getByRole('option').first().click()

  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel).toBeVisible()
  const selectedName = (await panel.locator('.MuiTypography-h5').first().innerText()).trim()
  expect(selectedName.length).toBeGreaterThan(0)

  // a merged wife/husband renders inside a partner's card and has no card of
  // their own; when the selected person does have one, it must be scrolled in
  const card = page.locator('.ft-card__name', { hasText: selectedName }).first()
  if (await card.count()) await expect(card).toBeInViewport()
})

test('map / calendar / archive views switch', async ({ page }) => {
  await page.locator('button[aria-label="Карта"]').click()
  await expect(page.locator('.leaflet-container')).toBeVisible()
  await page.locator('button[aria-label="Календар"]').click()
  await expect(page.locator('.ft-calendar .fc')).toBeVisible()
  await page.locator('button[aria-label="Архив"]').click()
  await expect(page.getByText('Архив на рода')).toBeVisible()
  await page.locator('button[aria-label="Дърво"]').click()
  await expect(page.locator('.ft-card').first()).toBeVisible()
})

test('language toggle switches the toolbar to English', async ({ page }) => {
  await page.locator('header button:has(svg[data-testid="LanguageIcon"])').click()
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(page.getByRole('button', { name: 'Add person' })).toBeVisible()
})

test('export JSON triggers a download', async ({ page }) => {
  await page.getByRole('button', { name: 'Действия' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: 'Експорт (JSON)' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.json$/)
})
