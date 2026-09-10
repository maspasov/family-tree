import { expect, type Browser, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/** The big generated fixture — see e2e/gen-tree.mjs. */
export const TEST_TREE = JSON.parse(
  readFileSync(new URL('./test-tree.json', import.meta.url), 'utf8'),
) as Array<Record<string, unknown>>

const STATE = 'e2e/.auth/state.json'

/**
 * A signed-in page for the `beforeAll` / `afterAll` hooks (which run outside the
 * `page` fixture, so they don't inherit `use.locale`). `bg-BG` makes the app
 * boot Bulgarian, matching the selectors.
 */
export function newBgPage(browser: Browser): Promise<Page> {
  return browser.newPage({ storageState: STATE, locale: 'bg-BG' })
}

/** Admin-only: create an empty tree and land on it. */
export async function createTree(page: Page, slug: string, name = 'E2E тест') {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ново дърво' }).click()
  await page.getByLabel('Име на дървото').fill(name)
  await page.getByLabel('Адрес (в URL)').fill(slug)
  await page.getByRole('button', { name: 'Създай' }).click()
  await page.waitForURL((u) => u.hash.includes(`/t/${slug}`), { timeout: 20_000 })
  await expect(page.getByText('Дървото е празно')).toBeVisible({ timeout: 15_000 })
}

/** Seed the current (empty) tree through the app's own JSON import. */
export async function importJson(page: Page, rows: unknown) {
  await page.getByRole('button', { name: 'Импорт (JSON)' }).first().click()
  const dialog = page.getByRole('dialog')
  const textarea = dialog.locator('textarea:not([aria-hidden="true"])').first()
  // React-controlled <textarea>: set via the native setter + one input event,
  // instead of a per-character fill that times out on a large payload.
  await textarea.evaluate((el, val) => {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, JSON.stringify(rows))
  await dialog.getByRole('button', { name: 'Импортирай' }).click()
  const done = dialog.getByText(/Готово\. Записани \d+ записа/)
  await expect(done).toBeVisible({ timeout: 120_000 })
  const written = Number((await done.textContent())?.match(/Записани (\d+)/)?.[1] ?? 0)
  if (written === 0) throw new Error('importJson wrote 0 records')
  await dialog.getByRole('button', { name: 'Отказ' }).click()
}

/** Admin-only: delete a tree from its own toolbar and return to the picker. */
export async function deleteTree(page: Page, slug: string) {
  await page.goto(`/#/t/${slug}`)
  await page.getByRole('button', { name: 'Изтрий дървото' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill(slug)
  await dialog.getByRole('button', { name: 'Изтрий завинаги' }).click()
  // the cascade (delete every person, then the tree doc) can take a while
  await page.waitForURL((u) => u.hash === '#/' || u.hash === '', { timeout: 60_000 })
}

/** Number of person cards currently in the chart DOM. */
export const cardCount = (page: Page) => page.locator('.ft-card:not(.ft-card--synthetic)').count()

/**
 * From an OPEN person panel, marry them to the first matching person of another
 * tree. The person <Autocomplete> auto-opens on render, so we type into it to
 * populate/filter rather than clicking (which would toggle it shut).
 */
export async function linkToOtherTree(page: Page, otherTreeRe: RegExp, personTypeahead = 'Г') {
  const panel = page.locator('.MuiDrawer-paper')
  await panel.getByRole('button', { name: 'Свържи с друго дърво' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Изберете другото дърво').click()
  await page.getByRole('option', { name: otherTreeRe }).click()
  const personField = dialog.getByLabel('Изберете човек от това дърво')
  await personField.waitFor({ state: 'visible', timeout: 15_000 })
  await personField.fill(personTypeahead)
  await page.getByRole('option').first().click()
  await dialog.getByRole('button', { name: 'Свържи', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15_000 })
}
