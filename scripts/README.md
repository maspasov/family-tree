# Admin scripts

Maintenance tasks that run against the live Firestore with the **Admin SDK**
(they bypass `firestore.rules`). Not part of the web build.

## Setup

```
npm i -D firebase-admin
```

Get a service-account key: Firebase console → ⚙ **Project settings** →
**Service accounts** → **Generate new private key**. Save the JSON **outside the
repo** (it's a secret; `.gitignore` also blocks common key filenames).

Pass it as `--key "<path>"` (or set `$FIREBASE_KEY` /
`$GOOGLE_APPLICATION_CREDENTIALS`). Add `--project <id>` only if the key file
lacks `project_id`.

## `set-admins.mjs`

Manages `config/app.admins` — the accounts allowed to create trees and edit any
tree. There's no in-app screen for this; use this script or the console.

```bash
KEY='C:\Users\maspasov\brusarite-key.json'
node scripts/set-admins.mjs --key "$KEY" --list
node scripts/set-admins.mjs --key "$KEY" --add    someone@gmail.com
node scripts/set-admins.mjs --key "$KEY" --remove old@gmail.com
```

Refuses to remove the last admin.

---

*The one-off `migrate-to-trees.mjs` / `cleanup-legacy.mjs` scripts that moved
the single tree into `trees/brusarite/…` were removed after the cutover. See
`tasks/multi-tree-roadmap.md` for what they did.*
