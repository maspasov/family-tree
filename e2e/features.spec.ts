import { test, expect } from '@playwright/test'
import { TEST_TREE, createTree, importJson, deleteTree, newBgPage, cardCount, linkToOtherTree } from './helpers'

/**
 * Full feature sweep. A throwaway `e2e-<id>` tree is seeded from
 * e2e/test-tree.json (~180 people, 6 generations); a second tiny `e2e-b-<id>`
 * tree exists only so cross-tree marriage linking can be exercised. Both trees
 * are deleted in afterAll once every test has run.
 *
 * Not `serial` — with `workers: 1` the tests still run sequentially, but one
 * failure no longer skips the rest (each test re-navigates in beforeEach and
 * cleans up what it creates).
 */

const ID = Date.now().toString(36)
const SLUG = `e2e-${ID}`
const SLUG_B = `e2e-b-${ID}`
const TREE_URL = `/#/t/${SLUG}`

const TREE_B = [
  { id: 'b-root', name: 'Стоян', surname: 'Гергов', parentId: null, gender: 'm', birthYear: '1930' },
  { id: 'b-kid', name: 'Мария', surname: 'Гергова', parentId: 'b-root', gender: 'f', birthYear: '1958' },
]

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000) // 2 tree creates + 2 imports over the network
  const page = await newBgPage(browser)
  await createTree(page, SLUG)
  await importJson(page, TEST_TREE)
  await createTree(page, SLUG_B, 'E2E партньорско дърво')
  await importJson(page, TREE_B)
  await page.close()
})

test.afterAll(async ({ browser }) => {
  test.setTimeout(180_000) // deleting the big tree is a per-person cascade
  const page = await newBgPage(browser)
  for (const s of [SLUG, SLUG_B]) {
    await deleteTree(page, s).catch((e) => console.warn(`cleanup ${s} failed:`, e))
  }
  await page.close()
})

test.beforeEach(async ({ page }) => {
  await page.goto(TREE_URL)
  await expect(page.locator('.ft-card').first()).toBeVisible({ timeout: 20_000 })
})

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

test('search selects a person and opens their panel', async ({ page }) => {
  const box = page.getByPlaceholder('Търсене на човек…')
  await box.click()
  await box.fill('Иван')
  await page.getByRole('option').first().click()

  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel).toBeVisible()
  const selectedName = (await panel.locator('.MuiTypography-h5').first().innerText()).trim()
  expect(selectedName.length).toBeGreaterThan(0)

  // if the selected person has a chart card of their own (a merged wife/husband
  // renders inside a partner's card), the search should have scrolled it in view
  const card = page.locator('.ft-card__name', { hasText: selectedName }).first()
  if (await card.count()) await expect(card).toBeInViewport()
})

test('person panel exposes edit / add-child / link / delete', async ({ page }) => {
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel.getByRole('button', { name: 'Редакция' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Добави дете' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Свържи с друго дърво' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Изтрий' })).toBeVisible()
})

test('add-person wizard starts with no relative selected', async ({ page }) => {
  await page.getByRole('button', { name: 'Добави човек' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Как е свързан новият човек с дървото?')).toBeVisible()

  const anchor = dialog.getByLabel('Изберете роднина, който вече е в дървото')
  await expect(anchor).toHaveValue('')
  await expect(dialog.getByRole('button', { name: 'Напред' })).toBeDisabled()

  await anchor.click()
  await page.getByRole('option').first().click()
  await expect(dialog.getByRole('button', { name: 'Напред' })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Отказ' }).click()
})

test('edit a person and persist a note across reload', async ({ page }) => {
  const marker = `e2e note ${Date.now()}`
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')
  await panel.getByRole('button', { name: 'Редакция' }).click()
  const note = panel.getByLabel('Бележка')
  await note.scrollIntoViewIfNeeded()
  await note.fill(marker)
  await panel.getByRole('button', { name: 'Запис', exact: true }).click()
  await expect(panel.getByText(marker)).toBeVisible()

  await page.reload()
  await page.locator('.ft-card__name').first().click()
  await expect(page.locator('.MuiDrawer-paper').getByText(marker)).toBeVisible()
})

test('add a child then delete it', async ({ page }) => {
  const name = `Тест Дете ${Date.now().toString().slice(-5)}`
  await page.getByRole('button', { name: 'Добави човек' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Изберете роднина, който вече е в дървото').click()
  await page.getByRole('option').first().click()
  await dialog.getByRole('button', { name: 'Напред' }).click()
  // step 2 — "Име" is the first (and required, so its label carries a "*")
  // text field; match by position rather than the fuzzy label
  await dialog.getByRole('textbox').first().fill(name)
  await dialog.getByRole('button', { name: 'Напред' }).click()
  await dialog.getByRole('button', { name: 'Напред' }).click()
  await dialog.getByRole('button', { name: 'Запис', exact: true }).click()

  // wizard closes and the panel opens on the new person
  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible({ timeout: 15_000 })

  // and their card is in the chart (expand-all in case the parent was collapsed)
  await page.getByRole('button', { name: 'Разгъни всички' }).click()
  await expect(page.locator('.ft-card__name', { hasText: name })).toBeVisible({ timeout: 15_000 })

  // delete from the still-open panel
  await panel.getByRole('button', { name: 'Изтрий' }).click()
  await page.getByRole('button', { name: 'Да, изтрий' }).click()
  await expect(page.locator('.ft-card__name', { hasText: name })).toHaveCount(0, { timeout: 15_000 })
})

test('link a partner in another tree, then unlink', async ({ page }) => {
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')

  await linkToOtherTree(page, /партньорско/)

  // toolbar gains the linked-trees chip; panel shows the cross-tree fact
  await expect(page.getByRole('button', { name: /Свързани дървета|1/ }).first()).toBeVisible({ timeout: 15_000 })
  await page.locator('.ft-card__name').first().click()
  await expect(panel.getByText('Съпруг/а в друго дърво')).toBeVisible()

  page.once('dialog', (d) => d.accept()) // window.confirm in removePartnerLink
  await panel.getByRole('button', { name: 'Премахни връзката' }).click()
  await expect(panel.getByText('Съпруг/а в друго дърво')).toHaveCount(0, { timeout: 15_000 })
})

test('combined view renders both linked trees', async ({ page }) => {
  // (re)establish a link so the combined view has something to merge
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')
  if (await panel.getByRole('button', { name: 'Свържи с друго дърво' }).isVisible()) {
    await linkToOtherTree(page, /партньорско/)
  }

  await page.goto(`/#/t/${SLUG}/all`)
  await expect(page.locator('.ft-card').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.ft-card__tree', { hasText: /партньорско/ }).first()).toBeVisible()
})

test('roles dialog adds and removes a viewer', async ({ page }) => {
  const viewer = `viewer-${Date.now().toString(36)}@example.com`
  await page.locator('header button[aria-label="Роли"], header button:has(svg[data-testid="ManageAccountsIcon"])').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Роли и достъп')).toBeVisible()
  await dialog.getByPlaceholder('имейл@example.com').fill(viewer)
  await dialog.getByRole('button', { name: 'Добави', exact: true }).click()
  await expect(dialog.getByText(viewer)).toBeVisible()

  await dialog.locator(`text=${viewer}`).locator('xpath=following-sibling::button').first().click()
  await expect(dialog.getByText(viewer)).toHaveCount(0)
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

test('admin access panel grants and revokes a viewer on a tree', async ({ page }) => {
  const viewer = `panel-${Date.now().toString(36)}@example.com`
  await page.goto('/#/admin')
  await expect(page.getByRole('heading', { name: 'Достъп до дърветата' })).toBeVisible()

  const card = page.locator('.MuiPaper-root', { hasText: `/${SLUG}` }).first()
  await card.getByPlaceholder('имейл@example.com').fill(viewer)
  await card.getByRole('button', { name: 'Добави', exact: true }).click()
  const chip = card.locator('.MuiChip-root', { hasText: viewer })
  await expect(chip).toBeVisible()

  // MUI Chip's onDelete renders an SVG icon, not a <button>
  await chip.locator('.MuiChip-deleteIcon').click()
  await expect(chip).toHaveCount(0)
})
