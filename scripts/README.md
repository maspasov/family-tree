# Admin scripts

One-off / occasional maintenance tasks that run against the live Firestore with
the **Admin SDK** (they bypass `firestore.rules`). Not part of the web build.

## Setup (one time)

```
npm i -D firebase-admin
```

Get a service-account key: Firebase console → ⚙ **Project settings** →
**Service accounts** → **Generate new private key**. Save the JSON **outside the
repo** (it's a secret; `.gitignore` also blocks common key filenames).

Every script takes `--key "<path to that JSON>"` (or set `$FIREBASE_KEY` /
`$GOOGLE_APPLICATION_CREDENTIALS`). Add `--project <id>` only if the key file
somehow lacks `project_id`.

## Scripts

| Script | What it does |
|---|---|
| `migrate-to-trees.mjs` | Copies the legacy top-level `persons/*`, `persons/*/photos/*` and `archive/*` under `trees/<slug>/…`, creates the `trees/<slug>` metadata doc from `config/app`'s editor/viewer lists, and seeds `config/app.admins`. Additive and re-runnable. |
| `cleanup-legacy.mjs` | After verifying the app on the new layout: checks every legacy doc has a migrated counterpart, then (with `--confirm`) deletes the legacy top-level `persons/` and `archive/`. Dry-run without `--confirm`. |
| `set-admins.mjs` | List / `--add` / `--remove` entries in `config/app.admins`. Refuses to remove the last admin. |

## The multi-tree cutover, in order

```bash
KEY='C:\Users\maspasov\brusarite-key.json'

# 1. deploy the new rules (keeps the LEGACY block for now)
firebase deploy --only firestore:rules

# 2. migrate the existing tree
node scripts/migrate-to-trees.mjs --key "$KEY" --slug brusarite \
  --name 'Родословно дърво „Брусарите"' \
  --subtitle 'клон Тано Раде Брусарски' \
  --motto 'Опознай рода си, за да си горд! Човек без роднини е сам.'

# 3. deploy the app, open #/t/brusarite, check edit / roles / photos / archive,
#    then check #/ lists it and (as an admin) that "new tree" works.

# 4. once happy, drop the legacy data …
node scripts/cleanup-legacy.mjs --key "$KEY" --slug brusarite          # dry run
node scripts/cleanup-legacy.mjs --key "$KEY" --slug brusarite --confirm

#    … then delete the "LEGACY top-level collections" block from
#    firestore.rules and redeploy.
```
