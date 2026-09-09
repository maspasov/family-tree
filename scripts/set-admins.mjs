/**
 * Manage `config/app.admins` — the accounts allowed to create trees and edit
 * any tree. (There's no in-app screen for this yet; edit it here or in the
 * Firebase console.)
 *
 *   node scripts/set-admins.mjs --key "C:\path\serviceAccountKey.json" --list
 *   node scripts/set-admins.mjs --key "C:\path\serviceAccountKey.json" --add you@gmail.com
 *   node scripts/set-admins.mjs --key "C:\path\serviceAccountKey.json" --remove old@gmail.com
 */
import { arg, flag, initDb } from './_firebase.mjs'

const ADD = arg('add')
const REMOVE = arg('remove')
const LIST = flag('list')
const db = initDb()

async function main() {
  const ref = db.doc('config/app')
  const snap = await ref.get()
  const data = snap.exists ? snap.data() : {}
  const current = Array.isArray(data.admins)
    ? data.admins
    : Array.isArray(data.editors) // pre-migration fallback
      ? data.editors
      : []

  if (LIST || (!ADD && !REMOVE)) {
    console.log('admins:', current.length ? current.join(', ') : '(none)')
    if (!Array.isArray(data.admins) && current.length) {
      console.log('(shown from legacy `editors` — no `admins` field written yet)')
    }
    return
  }

  const norm = (e) => e.trim().toLowerCase()
  let next = [...current]
  if (ADD) {
    const e = norm(ADD)
    if (next.includes(e)) return console.log(`${e} is already an admin.`)
    next.push(e)
  }
  if (REMOVE) {
    const e = norm(REMOVE)
    next = next.filter((x) => x !== e)
    if (next.length === current.length) return console.log(`${e} was not an admin.`)
    if (next.length === 0) {
      console.error('Refusing to remove the last admin — no one could create trees.')
      process.exit(1)
    }
  }

  await ref.set({ admins: next }, { merge: true })
  console.log('admins:', next.join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
