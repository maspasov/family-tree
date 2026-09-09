/**
 * Step 4 of the multi-tree cutover: delete the legacy top-level `persons/*`
 * (and each person's `photos/*`) and `archive/*` collections, once their
 * contents have been migrated under `trees/<slug>/…`.
 *
 * Safe by default: with no `--confirm` it only checks that every legacy
 * document has a counterpart under the tree and reports what it *would*
 * delete. Nothing is removed until you pass `--confirm`.
 *
 *   node scripts/cleanup-legacy.mjs --key "C:\path\serviceAccountKey.json" --slug brusarite
 *   node scripts/cleanup-legacy.mjs --key "C:\path\serviceAccountKey.json" --slug brusarite --confirm
 *
 * After this succeeds, delete the `LEGACY top-level collections` block from
 * firestore.rules and redeploy the rules.
 */
import { arg, flag, initDb } from './_firebase.mjs'

const SLUG = arg('slug', 'brusarite')
const CONFIRM = flag('confirm')
const db = initDb()

async function ids(path) {
  const snap = await db.collection(path).get()
  return snap.docs.map((d) => d.id)
}

/** Every id in `legacy` must also exist in `migrated`, or we refuse to delete. */
function assertMigrated(label, legacy, migrated) {
  const have = new Set(migrated)
  const missing = legacy.filter((id) => !have.has(id))
  if (missing.length) {
    console.error(
      `\nABORT: ${missing.length} ${label} doc(s) not found under the tree — ` +
        `migration looks incomplete. Re-run migrate-to-trees.mjs first.\n` +
        `  missing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`,
    )
    process.exit(1)
  }
  console.log(`  ${label}: ${legacy.length} legacy / ${migrated.length} migrated — OK`)
}

async function main() {
  const legacyPersons = await ids('persons')
  const treePersons = await ids(`trees/${SLUG}/persons`)
  assertMigrated('persons', legacyPersons, treePersons)

  let legacyPhotoTotal = 0
  for (const pid of legacyPersons) {
    const lp = await ids(`persons/${pid}/photos`)
    if (lp.length === 0) continue
    const tp = await ids(`trees/${SLUG}/persons/${pid}/photos`)
    assertMigrated(`persons/${pid}/photos`, lp, tp)
    legacyPhotoTotal += lp.length
  }

  const legacyArchive = await ids('archive')
  const treeArchive = await ids(`trees/${SLUG}/archive`)
  assertMigrated('archive', legacyArchive, treeArchive)

  console.log(
    `\nWould delete: ${legacyPersons.length} persons, ${legacyPhotoTotal} person photos, ` +
      `${legacyArchive.length} archive photos (top-level).`,
  )

  if (!CONFIRM) {
    console.log('\nDry run — pass --confirm to actually delete.')
    return
  }

  console.log('\nDeleting …')
  await db.recursiveDelete(db.collection('persons'))
  await db.recursiveDelete(db.collection('archive'))
  console.log('Done. Now remove the LEGACY block from firestore.rules and redeploy.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
