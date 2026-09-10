/**
 * Delete every tree whose slug starts with `e2e-` (and everything under it).
 * Safety net for the CI e2e job: the suite deletes its own trees in afterAll,
 * but a cancelled/crashed run can leave one behind.
 *
 *   node scripts/cleanup-e2e-trees.mjs --key "C:\path\serviceAccountKey.json"
 *   # or set GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_KEY
 *
 * No key resolvable → prints a note and exits 0 (so `if: always()` steps pass).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const PREFIX = 'e2e-'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : undefined
}

const keyPath =
  arg('key') || process.env.FIREBASE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!keyPath) {
  console.log('cleanup-e2e-trees: no service-account key — skipping.')
  process.exit(0)
}

const serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf8'))
initializeApp({
  credential: cert(serviceAccount),
  projectId: arg('project') || serviceAccount.project_id,
})
const db = getFirestore()

const snap = await db.collection('trees').get()
let n = 0
for (const d of snap.docs) {
  if (!d.id.startsWith(PREFIX)) continue
  await db.recursiveDelete(d.ref) // doc + persons/archive/photos subcollections
  console.log('deleted tree', d.id)
  n++
}
console.log(`cleanup-e2e-trees: removed ${n} tree(s)`)
