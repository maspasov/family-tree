import { test, expect } from '@playwright/test'
import {
  ROOT_NAME,
  addPersonViaWizard,
  deleteOpenPerson,
  openPersonByName,
  openTree,
} from './helpers'

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

test('edit a person: the note is saved', async ({ page }) => {
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

  // close the panel, re-open the same person from search — the note comes back
  // from the live Firestore subscription, i.e. the write actually persisted
  await panel.getByRole('button', { name: 'Затвори' }).click()
  await expect(panel).toBeHidden()
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

test('add a spouse via the wizard — merges into the anchor card', async ({ page }) => {
  const spouse = `Тест Съпруга ${Date.now().toString().slice(-5)}`
  await addPersonViaWizard(page, { anchorName: ROOT_NAME, rel: 'spouse', name: spouse, gender: 'Жена' })

  // a wife merges into her partner's card as a ⚭ line (no card of her own)
  const anchorCard = page
    .locator('.ft-card')
    .filter({ has: page.locator('.ft-card__name', { hasText: ROOT_NAME }) })
  await expect(anchorCard.locator('.ft-card__spouse')).toContainText(spouse, { timeout: 15_000 })

  // clean up
  await openPersonByName(page, spouse)
  await deleteOpenPerson(page)
  await expect(anchorCard.locator('.ft-card__spouse', { hasText: spouse })).toHaveCount(0, {
    timeout: 15_000,
  })
})

test('add a parent via the wizard — reparents the anchor', async ({ page }) => {
  const sfx = Date.now().toString().slice(-5)
  const child = `Тест Внук ${sfx}`
  const parent = `Тест Прародител ${sfx}`

  await addPersonViaWizard(page, { anchorName: ROOT_NAME, rel: 'child', name: child })
  await addPersonViaWizard(page, { anchorName: child, rel: 'parent', name: parent })

  // `child` now hangs under the newly added `parent`
  await openPersonByName(page, child)
  await expect(page.locator('.MuiDrawer-paper').getByText(parent)).toBeVisible({ timeout: 15_000 })

  await deleteOpenPerson(page) // child first (no descendants)
  await openPersonByName(page, parent)
  await deleteOpenPerson(page)
})

test('edit a person — surname, birth year and gender all persist', async ({ page }) => {
  const name = `Тест Редакция ${Date.now().toString().slice(-5)}`
  await addPersonViaWizard(page, { anchorName: ROOT_NAME, rel: 'child', name })

  const panel = page.locator('.MuiDrawer-paper')
  await panel.getByRole('button', { name: 'Редакция' }).click()
  await panel.getByLabel('Фамилия', { exact: true }).fill('Тестова-Проверка')
  await panel.getByLabel('Година на раждане').fill('1950')
  await panel.getByLabel('Пол', { exact: true }).click()
  await page.getByRole('option', { name: 'Жена' }).click()
  await panel.getByRole('button', { name: 'Запис', exact: true }).click()

  await expect(panel).toContainText('Тестова-Проверка')
  await expect(panel).toContainText('р. 1950')
  await expect(page.locator('.ft-card--f', { hasText: name })).toBeVisible({ timeout: 15_000 })

  await deleteOpenPerson(page)
})

test('move a person to a different parent', async ({ page }) => {
  const sfx = Date.now().toString().slice(-5)
  const p1 = `Тест Родител ${sfx}`
  const p2 = `Тест Дете ${sfx}`
  await addPersonViaWizard(page, { anchorName: ROOT_NAME, rel: 'child', name: p1 })
  await addPersonViaWizard(page, { anchorName: ROOT_NAME, rel: 'child', name: p2 })

  // p2 is a child of the root; move it under p1 via the edit form
  const panel = page.locator('.MuiDrawer-paper') // open on p2 after the wizard
  await panel.getByRole('button', { name: 'Редакция' }).click()
  const relTo = panel.getByLabel('Спрямо кого')
  await relTo.click()
  await relTo.fill(p1)
  await page.getByRole('option', { name: p1 }).click()
  await panel.getByRole('button', { name: 'Запис', exact: true }).click()

  // the "Роднина (родител)" fact now links to p1
  await expect(panel.getByRole('button', { name: p1, exact: true })).toBeVisible({ timeout: 15_000 })

  await deleteOpenPerson(page) // p2
  await openPersonByName(page, p1)
  await deleteOpenPerson(page)
})
