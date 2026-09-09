/**
 * One-off migration: single-tree layout  ->  trees/{slug}/…
 *
 * Copies the legacy top-level `persons/*` (+ each person's `photos/*`) and
 * `archive/*` under `trees/<slug>/…`, creates the `trees/<slug>` metadata doc
 * from the current `config/app` editor/viewer lists, and seeds
 * `config/app.admins` (from those same editors — adjust later with
 * set-admins.mjs). It does NOT delete the legacy collections — verify the app
 * against the new layout, then run `cleanup-legacy.mjs`.
 *
 *   npm i -D firebase-admin   # one time
 *
 *   node scripts/migrate-to-trees.mjs --key "C:\path\serviceAccountKey.json" \
 *     --slug brusarite \
 *     --name 'Родословно дърво „Брусарите"' \
 *     --subtitle 'клон Тано Раде Брусарски' \
 *     --motto 'Опознай рода си, за да си горд! Човек без роднини е сам.'
 *
 * `--name` / `--subtitle` / `--motto` are optional — leave them out and the app
 * falls back to its built-in i18n strings; you can also fill them in later on
 * the `trees/<slug>` doc in the Firebase console.
 *
 * Re-runnable: every write is an idempotent set() by document id.
 */
import { FieldValue } from 'firebase-admin/firestore'
import { arg, initDb } from './_firebase.mjs'

const SLUG = arg('slug', 'brusarite')
const NAME = arg('name', '')
const SUBTITLE = arg('subtitle', '')
const MOTTO = arg('motto', '')

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(SLUG)) {
  console.error(`Invalid --slug "${SLUG}" (allowed: a-z, 0-9, hyphen).`)
  process.exit(1)
}

const db = initDb()

/** Copy every doc of `srcPath` into `dstPath`, keeping ids. Returns the ids. */
async function copyCollection(srcPath, dstPath) {
  const snap = await db.collection(srcPath).get()
  const ids = []
  let batch = db.batch()
  let n = 0
  for (const d of snap.docs) {
    batch.set(db.doc(`${dstPath}/${d.id}`), d.data(), { merge: true })
    ids.push(d.id)
    if (++n % 400 === 0) {
      await batch.commit()
      batch = db.batch()
    }
  }
  if (n % 400 !== 0) await batch.commit()
  return ids
}

async function main() {
  const configSnap = await db.doc('config/app').get()
  const config = configSnap.exists ? configSnap.data() : {}
  const editors = Array.isArray(config.editors) ? config.editors : []
  const viewers = Array.isArray(config.viewers) ? config.viewers : []

  if (editors.length === 0) {
    console.warn('config/app has no `editors` — the new tree will have an empty editor list.')
  }

  console.log(`Creating trees/${SLUG} …`)
  await db.doc(`trees/${SLUG}`).set(
    {
      slug: SLUG,
      ...(NAME ? { name: NAME } : {}),
      ...(SUBTITLE ? { subtitle: SUBTITLE } : {}),
      ...(MOTTO ? { motto: MOTTO } : {}),
      editors,
      viewers,
      createdByEmail: editors[0] ?? null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log('Copying persons/* …')
  const personIds = await copyCollection('persons', `trees/${SLUG}/persons`)
  console.log(`  ${personIds.length} people`)

  let photoCount = 0
  for (const pid of personIds) {
    const ids = await copyCollection(
      `persons/${pid}/photos`,
      `trees/${SLUG}/persons/${pid}/photos`,
    )
    photoCount += ids.length
  }
  console.log(`  ${photoCount} person photos`)

  console.log('Copying archive/* …')
  const archiveIds = await copyCollection('archive', `trees/${SLUG}/archive`)
  console.log(`  ${archiveIds.length} archive photos`)

  console.log('Seeding config/app.admins …')
  await db.doc('config/app').set(
    { admins: editors.length ? editors : viewers },
    { merge: true },
  )

  console.log(`\nDone. Verify the app at #/t/${SLUG}, then:`)
  console.log(`  node scripts/cleanup-legacy.mjs --key <key> --slug ${SLUG} --confirm`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
