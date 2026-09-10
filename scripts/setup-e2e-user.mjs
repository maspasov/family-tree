/**
 * One-time: provision the e2e "mock" login user in the real Firebase project.
 *
 *   node scripts/setup-e2e-user.mjs --key "C:\path\serviceAccountKey.json" \
 *        --email e2e-bot@example.com --password "<strong-password>"
 *
 * It will:
 *   1. create the user (or reset its password if it already exists),
 *   2. force emailVerified = true  (Firestore rules gate on `email_verified`),
 *   3. add the address to `config/app.admins` so the suite can create/delete trees.
 *
 * Also enable Email/Password sign-in once:
 *   Firebase console → Authentication → Sign-in method → Email/Password → Enable.
 *
 * Put the same --email / --password into e2e/.env.e2e (gitignored) — see e2e/README.md.
 */
import { getAuth } from 'firebase-admin/auth'
import { arg, initDb } from './_firebase.mjs'

const EMAIL = (arg('email') || '').trim().toLowerCase()
const PASSWORD = arg('password') || ''

if (!EMAIL || !PASSWORD) {
  console.error('Usage: --key <serviceAccount.json> --email <addr> --password <pw>')
  process.exit(1)
}

const db = initDb()
const auth = getAuth()

async function main() {
  let uid
  try {
    const existing = await auth.getUserByEmail(EMAIL)
    uid = existing.uid
    await auth.updateUser(uid, { password: PASSWORD, emailVerified: true, disabled: false })
    console.log(`updated existing user ${EMAIL} (${uid}) — password reset, emailVerified=true`)
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e
    const created = await auth.createUser({ email: EMAIL, password: PASSWORD, emailVerified: true })
    uid = created.uid
    console.log(`created user ${EMAIL} (${uid})`)
  }

  const ref = db.doc('config/app')
  const snap = await ref.get()
  const admins = Array.isArray(snap.data()?.admins) ? snap.data().admins : []
  if (admins.includes(EMAIL)) {
    console.log(`${EMAIL} is already in config/app.admins`)
  } else {
    await ref.set({ admins: [...admins, EMAIL] }, { merge: true })
    console.log(`added ${EMAIL} to config/app.admins`)
  }
  console.log('\ndone. Enable Email/Password sign-in in the Firebase console if you have not.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
