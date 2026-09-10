import { test, expect } from '@playwright/test'
import { openTree } from './helpers'

/** Person panel, the add-person wizard, editing, and add/delete. */
test.beforeEach(openTree)

test('person panel exposes edit / add-child / link / delete', async ({ page }) => {
  await page.locator('.ft-card__name').first().click()
  const panel = page.locator('.MuiDrawer-paper')
  await expect(panel.getByRole('button', { name: 'Редакция' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Добави дете' })).toBeVisible()
  // "Свържи с друго дърво" or "Премахни връзката" depending on whether another
  // spec left a cross-tree link on this person
  await expect(
    panel
      .getByRole('button', { name: 'Свържи с друго дърво' })
      .or(panel.getByRole('button', { name: 'Премахни връзката' })),
  ).toBeVisible()
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
  const personName = (await panel.locator('.MuiTypography-h5').first().innerText()).trim()

  await panel.getByRole('button', { name: 'Редакция' }).click()
  const note = panel.getByLabel('Бележка')
  await note.scrollIntoViewIfNeeded()
  await note.fill(marker)
  await panel.getByRole('button', { name: 'Запис', exact: true }).click()
  await expect(panel.getByText(marker)).toBeVisible()

  // reload, then re-select the SAME person via search (immune to how long the
  // ~180-node chart takes to re-render on a slow CI runner)
  await page.reload()
  await expect(page.locator('.ft-card').first()).toBeVisible({ timeout: 20_000 })
  const box = page.getByPlaceholder('Търсене на човек…')
  await box.click()
  await box.fill(personName)
  await page.getByRole('option').first().click()
  await expect(page.locator('.MuiDrawer-paper')).toContainText(marker, { timeout: 15_000 })
})

test('add a child then delete it', async ({ page }) => {
  const name = `Тест Дете ${Date.now().toString().slice(-5)}`
  await page.getByRole('button', { name: 'Добави човек' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Изберете роднина, който вече е в дървото').click()
  await page.getByRole('option').first().click()
  await dialog.getByRole('button', { name: 'Напред' }).click()
  // step 2 — "Име" is the first (required, so its label carries a "*") text field
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

  await panel.getByRole('button', { name: 'Изтрий' }).click()
  await page.getByRole('button', { name: 'Да, изтрий' }).click()
  await expect(page.locator('.ft-card__name', { hasText: name })).toHaveCount(0, { timeout: 15_000 })
})
