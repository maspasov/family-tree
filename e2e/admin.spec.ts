import { test, expect } from '@playwright/test'
import { openTree, sandbox } from './helpers'

/** Per-tree access management — the toolbar Roles dialog and the #/admin screen. */
test.beforeEach(openTree)

const BOT_EMAIL = (process.env.VITE_E2E_EMAIL ?? '').toLowerCase()

function openRolesDialog(page: import('@playwright/test').Page) {
  return page
    .locator('header button[aria-label="Роли"], header button:has(svg[data-testid="ManageAccountsIcon"])')
    .first()
    .click()
}

test('roles dialog adds and removes a viewer', async ({ page }) => {
  const viewer = `viewer-${Date.now().toString(36)}@example.com`
  await openRolesDialog(page)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Роли и достъп')).toBeVisible()
  await dialog.getByPlaceholder('имейл@example.com').fill(viewer)
  await dialog.getByRole('button', { name: 'Добави', exact: true }).click()
  await expect(dialog.getByText(viewer)).toBeVisible()

  await dialog.locator(`text=${viewer}`).locator('xpath=following-sibling::button').first().click()
  await expect(dialog.getByText(viewer)).toHaveCount(0)
})

test('admin access panel grants and revokes a viewer on a tree', async ({ page }) => {
  const viewer = `panel-${Date.now().toString(36)}@example.com`
  await page.goto('/#/admin')
  await expect(page.getByRole('heading', { name: 'Достъп до дърветата' })).toBeVisible()

  const card = page.locator('.MuiPaper-root', { hasText: `/${sandbox().slug}` }).first()
  await card.getByPlaceholder('имейл@example.com').fill(viewer)
  await card.getByRole('button', { name: 'Добави', exact: true }).click()
  const chip = card.locator('.MuiChip-root', { hasText: viewer })
  await expect(chip).toBeVisible()

  // MUI Chip's onDelete renders an SVG icon, not a <button>
  await chip.locator('.MuiChip-deleteIcon').click()
  await expect(chip).toHaveCount(0)
})

test('roles dialog refuses to remove the last editor', async ({ page }) => {
  test.skip(!BOT_EMAIL, 'needs VITE_E2E_EMAIL')
  await openRolesDialog(page)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Роли и достъп')).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Редактори' })).toBeVisible()

  // the sandbox tree has exactly one editor and no viewers here, so the lone
  // "Премахни" button is that editor's — and the guard must refuse it
  const remove = dialog.getByRole('button', { name: 'Премахни' })
  await expect(remove).toHaveCount(1)
  await remove.click()

  await expect(dialog.getByRole('alert')).toContainText('редактор') // guard message
  await expect(remove).toHaveCount(1) // editor still listed
})
