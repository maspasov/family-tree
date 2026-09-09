/**
 * Shared bootstrap for the admin scripts in this folder.
 *
 * Credentials come from a service-account key JSON (Firebase console ->
 * Project settings -> Service accounts -> "Generate new private key"), passed
 * as `--key <path>` or via $FIREBASE_KEY / $GOOGLE_APPLICATION_CREDENTIALS.
 * Keep that file OUTSIDE the repo — it's a secret.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/** Read `--name value` from argv (returns `fallback` if absent). */
export function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

/** True if the bare `--name` flag is present. */
export function flag(name) {
  return process.argv.includes(`--${name}`)
}

/** Loads the service account and returns a ready Firestore handle. */
export function initDb() {
  const keyPath =
    arg('key') || process.env.FIREBASE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!keyPath) {
    console.error(
      'No service-account key. Pass --key "C:\\path\\to\\serviceAccountKey.json"\n' +
        '(Firebase console -> Project settings -> Service accounts -> Generate new private key).',
    )
    process.exit(1)
  }
  let serviceAccount
  try {
    serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf8'))
  } catch (e) {
    console.error(`Can't read key file "${keyPath}": ${e.message}`)
    process.exit(1)
  }
  const projectId = arg('project') || serviceAccount.project_id
  if (!projectId) {
    console.error('Key file has no "project_id" — pass --project <your-project-id>.')
    process.exit(1)
  }
  initializeApp({ credential: cert(serviceAccount), projectId })
  console.log(`Project: ${projectId}\n`)
  return getFirestore()
}
