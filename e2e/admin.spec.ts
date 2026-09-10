import { test, expect } from '@playwright/test'
import { openTree, sandbox } from './helpers'

/** Per-tree access management — the toolbar Roles dialog and the #/admin screen. */
test.beforeEach(openTree)

test('roles dialog adds and removes a viewer', async ({ page }) => {
  const viewer = `viewer-${Date.now().toString(36)}@example.com`
  await page
    .locator('header button[aria-label="Роли"], header button:has(svg[data-testid="ManageAccountsIcon"])')
    .first()
    .click()
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
