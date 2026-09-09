/**
 * Firebase bootstrap: one app instance, shared Auth + Firestore handles.
 *
 * The web config below is read from Vite env vars (see .env.example). It is not
 * secret — every Firebase web app ships it to the browser. Real authorization
 * lives in `firestore.rules`.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** True only when the essential env vars are present. */
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.appId,
)

let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
  // Keep the user signed in across reloads (GitHub Pages is a plain static host).
  void setPersistence(authInstance, browserLocalPersistence).catch(() => {})
}

/** Non-null accessors — call only after checking `firebaseConfigured`. */
export const auth = authInstance as Auth
export const db = dbInstance as Firestore

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/**
 * Firestore paths, kept in one place.
 *
 * Everything a single family tree owns lives under `trees/{treeId}/…` — see
 * `treePaths()`. `treeId` is the tree's URL slug (unique, `[a-z0-9-]+`), so no
 * separate slug→id lookup is needed. `config/app` is the one global doc:
 * `{ admins: [email…] }` — the accounts allowed to create trees.
 */
export const paths = {
  trees: 'trees',
  configDoc: ['config', 'app'] as const,
}

/** Per-tree Firestore paths. `treeId` is the tree's slug. */
export function treePaths(treeId: string) {
  return {
    doc: ['trees', treeId] as const,
    persons: `trees/${treeId}/persons`,
    archive: `trees/${treeId}/archive`,
    personPhotos: (personId: string) => `trees/${treeId}/persons/${personId}/photos`,
  }
}
