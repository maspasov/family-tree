# Multiple trees — one platform, many families — design & roadmap memo

**Status:** client + rules implemented (steps 1, 3, 4, 5). Not yet done: run the
data migration (step 2) and drop the legacy collections/rules (step 6). See
**Implemented so far** and **What's left** at the bottom.

**Scope:** the app hosted exactly one family tree („Брусарите"). This memo
describes letting a platform admin create and run **many independent trees**,
one per family, from the same deployment — the Firestore layout, the security
rules, the role model, and the client changes — plus a migration path for the
tree that already exists.

**Deviations from the original plan, as built:**
- `treeId` **is** the slug (the `trees/{slug}` doc id) — no opaque id, no
  slug→id lookup. Renaming a slug is therefore unsupported (would mean moving
  the doc + all subcollections); pick it once.
- Hash router is hand-rolled (`src/lib/hashRoute.ts`, ~50 lines) rather than
  pulling in react-router — same call as the hand-rolled i18n layer.
- Viewers now actually load the tree (`usePersons` was previously gated on
  `isEditor`, so read-only accounts saw an empty tree — a latent bug); the new
  gate is `canView`.

## At a glance

| Question | Answer |
|---|---|
| One Firebase project or one per family? | **One project**, trees separated by a `trees/{treeId}/…` path prefix. Keeps the "no billing, one deploy" property; a project-per-family would multiply setup, secrets and hosting with no real isolation win at family scale. |
| Where do editor/viewer lists live? | Move from the global `config/app` to a per-tree `trees/{treeId}` document. `config/app` keeps only a new `admins` list — the people allowed to create trees. |
| How does a visitor land on a tree? | A route: `#/t/<slug>` (hash routing — no server rewrite needed on GitHub Pages). `#/` shows a picker of the trees you can see. |
| Effort | **M–L.** Rules rewrite is small; the client refactor to make every data path tree-scoped is the bulk of it. |
| Backwards compatible? | No — Firestore paths change. Needs a one-off migration of the „Брусарите" data. Done once, by an admin, with a short script. |

## 01. What assumes "one tree" today

Every one of these is a place the single-tree assumption is currently baked in:

| File | Assumption |
|---|---|
| `src/lib/firebase.ts` | `paths.persons = 'persons'` — one top-level collection. `paths.configDoc = ['config','app']` — one config/roles doc. |
| `firestore.rules` | Rules are written against `/persons/{id}`, `/persons/{id}/photos/{id}`, `/archive/{id}`, `/config/app`. `editors()` / `viewers()` `get()` straight from `config/app`. |
| `src/auth/AuthContext.tsx` | `editors` / `viewers` are **app-wide** arrays from `config/app`; `isEditor` / `isViewer` are global, not per-tree. |
| `src/data/usePersons.ts` | Subscribes to the single `paths.persons` collection; CRUD writes there. |
| `src/data/usePersonPhotos.ts` | `collection(db, 'persons', personId, 'photos')` — hardcoded root. |
| `src/data/useArchivePhotos.ts` | `collection(db, 'archive')` — one global scanned-archive collection. |
| `src/components/RolesDialog.tsx` | Reads/writes `config/app` `editors` / `viewers`. |
| `src/App.tsx` | Renders one chart from `usePersons()`; there is no "current tree" concept and no router. |
| `src/seed/seedData.ts` | A single hardcoded starter dataset. |
| `src/lib/i18n/*` | One `appTitle` / `appSubtitle` / `motto` for the whole app. |

## 02. Target Firestore layout

Nest everything a tree owns under a `trees/{treeId}` parent. `treeId` is an
opaque id; a human-readable `slug` lives in the tree document and is what
appears in the URL.

```
config/app
  { admins: ["martospasov@gmail.com", …] }          # who may create trees

trees/{treeId}
  {
    slug: "brusarite",                               # unique, used in the URL
    name: "Родословно дърво „Брусарите"",
    subtitle: "клон Тано Раде Брусарски",
    motto: "Опознай рода си, за да си горд…",
    createdBy: "martospasov@gmail.com",
    createdAt: <ts>,
    editors: ["…"],                                  # per-tree, was config/app.editors
    viewers: ["…"]                                   # per-tree, was config/app.viewers
  }

trees/{treeId}/persons/{personId}                    # was  persons/{personId}
trees/{treeId}/persons/{personId}/photos/{photoId}   # was  persons/{personId}/photos/*
trees/{treeId}/archive/{photoId}                     # was  archive/*
trees/{treeId}/events/{eventId}                       # when the calendar roadmap lands
```

`trees/{treeId}` is **publicly readable** — same call the client and the
security rules already make against `config/app` today, and it holds the same
class of data (a display name plus two lists of e-mails). Everything under it
stays behind the per-tree read gate.

A `slug → treeId` lookup is a one-shot `where('slug','==',…)` query on `trees`,
cached after first resolve.

## 03. Security rules

The shape is the same as today, just parameterised by `treeId` and with an
`admins` tier on top.

```
function admins() {
  return get(/databases/$(db)/documents/config/app).data.get('admins', []);
}
function isAdmin() {
  return request.auth != null
    && request.auth.token.email_verified == true
    && request.auth.token.email.lower() in admins();
}
function tree(treeId) {
  return get(/databases/$(db)/documents/trees/$(treeId)).data;
}
function isTreeEditor(treeId) {
  return isAdmin()
    || (request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email.lower() in tree(treeId).get('editors', []));
}
function isTreeViewer(treeId) {
  return isTreeEditor(treeId)
    || request.auth.token.email.lower() in tree(treeId).get('viewers', []);
}

match /trees/{treeId} {
  allow read: if true;                                // display name + role lists, like config/app today
  allow create: if isAdmin()
    && request.resource.data.slug is string
    && request.resource.data.editors is list
    && request.resource.data.editors.size() > 0;      // creator seeds themselves as first editor
  allow update: if isAdmin()
    || (isTreeEditor(treeId)
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['editors','viewers','name','subtitle','motto']));
  allow delete: if isAdmin();

  match /persons/{personId} {
    allow read:   if isTreeViewer(treeId);
    allow create, update: if isTreeEditor(treeId)
      && request.resource.data.name is string
      && request.resource.data.name.size() > 0
      && request.resource.data.name.size() < 120;
    allow delete: if isTreeEditor(treeId);

    match /photos/{photoId} { /* isTreeViewer read, isTreeEditor write — as today */ }
  }
  match /archive/{photoId} { /* isTreeViewer read, isTreeEditor write — as today */ }
}
```

Rule reads (`get()` on `config/app` and `trees/{treeId}`) are billed and
count against the [rules `get()` limit](https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents)
(10 per single-doc request, 20 per query) — the nesting above stays well
inside that.

## 04. Role model

Three tiers instead of two:

| Tier | Stored in | Can |
|---|---|---|
| **Platform admin** | `config/app.admins` | Create / delete trees; edit any tree; manage any tree's editor/viewer lists. Set from the Firebase console only. |
| **Tree editor** | `trees/{treeId}.editors` | Everything inside that one tree (add/edit/delete people, photos, archive, manage that tree's lists). |
| **Tree viewer** | `trees/{treeId}.viewers` | Read that one tree. |

`AuthContext` stops owning `editors` / `viewers`. It keeps `user` + a new
`isAdmin`. Per-tree role resolution moves into a `TreeContext` (below) that
knows which tree is open.

## 05. Client changes

**a. Tree-scoped paths.** `src/lib/firebase.ts`:

```ts
export const paths = {
  configDoc: ['config', 'app'] as const,   // now { admins: [...] }
  trees: 'trees',
}
export function treePaths(treeId: string) {
  return {
    treeDoc: ['trees', treeId] as const,
    persons: `trees/${treeId}/persons`,
    archive: `trees/${treeId}/archive`,
    personPhotos: (personId: string) => `trees/${treeId}/persons/${personId}/photos`,
  }
}
```

**b. `TreeContext`** (`src/tree/TreeContext.tsx`) — resolves `treeId` from the
route slug, subscribes to `trees/{treeId}`, and exposes
`{ treeId, tree, isTreeEditor, isTreeViewer, isTreeViewerOnly }`. Replaces the
per-tree half of `useAuth()` at every call site.

**c. Data hooks take the tree.** `usePersons`, `usePersonPhotos`,
`useArchivePhotos` either read `treeId` from `TreeContext` or accept it as an
argument. `usePersons(enabled)` becomes `usePersons(treeId, enabled)`; the
`'persons'` / `'archive'` string literals in the photo hooks come from
`treePaths(treeId)`.

**d. Routing.** Add `HashRouter` (hash, not history — GitHub Pages serves no
SPA fallback without a `404.html` hack):

| Route | Screen |
|---|---|
| `#/` | Tree picker — the trees this account can see; admins also get **+ New tree**. If the account can see exactly one, redirect straight into it. |
| `#/t/:slug` | The current `<App>` — chart / map / calendar / archive for that tree. |
| `#/t/:slug/manage` | The management page, scoped to this tree. |

**e. Create-tree flow (admin).** A dialog: name, slug (validated unique
against `trees`), optional subtitle/motto, first editor e-mail (defaults to the
admin's own). Writes the `trees/{treeId}` doc; the tree starts empty, and the
existing "Импорт (JSON)" / "Добави" flow fills it — no per-tree seed file.

**f. Tree switcher.** A dropdown in `Toolbar.tsx` (visible when the account can
see more than one tree) to jump between them; "Управление на дървета" entry for
admins.

**g. Generalise `RolesDialog`.** Same UI, but writes
`trees/{treeId}.editors/viewers` instead of `config/app`. A separate
admin-only screen manages `config/app.admins`.

**h. Per-tree branding.** `appTitle` / `appSubtitle` / `motto` move from the
i18n bundle to fields on the tree document, with the current i18n strings as
the fallback when a tree leaves them blank.

## 06. Migrating „Брусарите"

One-off, run by an admin — data volume is dozens of documents, so a short
script (Node + Firebase Admin SDK, or an in-app "migrate" button gated to
admins) is enough:

1. Create `trees/brusarite` — `slug: "brusarite"`, name/subtitle/motto copied
   from the current i18n strings, `editors` / `viewers` copied verbatim from
   `config/app`.
2. Copy every `persons/{id}` → `trees/brusarite/persons/{id}` (same ids).
3. For each, copy `persons/{id}/photos/*` → `trees/brusarite/persons/{id}/photos/*`.
4. Copy `archive/*` → `trees/brusarite/archive/*`.
5. Rewrite `config/app` to `{ admins: [...] }` (seed with the current editor
   list, or a subset).
6. Deploy the new rules; verify reads/writes against `trees/brusarite`; then
   delete the old top-level `persons` / `archive`.

Keep the old collections until step 6 passes — the rollback is "redeploy the
old rules".

## 07. Suggested build order

1. **Firestore layout + rules** for `trees/{treeId}/…` and `config/app.admins`
   (old rules stay live in parallel).
2. **Migrate** „Брусарите" into `trees/brusarite` with the script above.
3. **`TreeContext` + `treePaths` + hook refactor** — every data path becomes
   tree-scoped. Hardcode `slug = "brusarite"` at this step, no routing yet.
4. **HashRouter + `#/t/:slug` + tree picker** landing page.
5. **Admin: create-tree dialog + per-tree `RolesDialog`**; separate
   `config/app.admins` screen.
6. **Polish** — tree switcher in the toolbar, per-tree title/subtitle/motto,
   drop the old top-level collections.

Steps 1–3 are the real work and are shippable on their own (single tree, new
layout). 4–6 turn it into a multi-tree product.

## 08. Out of scope (deferred)

- **Cross-tree links** — a marriage joining two families' trees. Needs a
  person to be referenceable from another tree; big rules/data change, and the
  `d3-org-chart` single-parent hierarchy doesn't render unions anyway (see
  `project-summary.md`). Revisit only with a different chart library.
- **Public tree directory** — listing/searching trees you're *not* a member
  of. This memo keeps `trees/{treeId}` publicly readable for slug resolution
  but assumes you only ever navigate to a tree you were invited to.
- **Per-tree quotas / billing** — not relevant on the Spark free tier at
  family scale.

## 09. Implemented so far

New files:

| File | Role |
|---|---|
| `src/lib/hashRoute.ts` | `useHashRoute()` / `navigate()` — hash router. |
| `src/model/tree.ts` | `Tree` type, `treeFromDoc`, `slugify`, `SLUG_RE`. |
| `src/tree/TreeContext.tsx` | `<TreeProvider treeId>` + `useTree()` — per-tree doc + `isEditor`/`isViewer`/`canView`/`setRoles`. |
| `src/data/useTrees.ts` | list visible trees, `createTree`, `slugExists`. |
| `src/components/TreePicker.tsx` | the `#/` landing page. |
| `src/components/CreateTreeDialog.tsx` | admin "new tree" form. |
| `scripts/migrate-to-trees.mjs` | the data migration (needs `npm i -D firebase-admin`). |

Changed: `firebase.ts` (`treePaths()`), `AuthContext` (`admins`/`isAdmin`, drop
per-tree fields), `usePersons`/`usePersonPhotos`/`useArchivePhotos` (take
`treeId`), `App.tsx` (router shell + `TreeApp`, per-tree branding),
`Toolbar`/`Archive`/`RolesDialog`/`PersonPanel`/`LoginGate` (use `useTree`),
`firestore.rules` (full rewrite; legacy block kept), i18n (bg/en/de keys).

`tsc`, `oxlint`, `vite build` all pass. Not yet exercised against a live
Firestore.

## 10. Cutover — done

1. ~~Deploy the rules~~ — **done**.
2. ~~Run the migration~~ — **done** (`trees/brusarite`: 5 people, 1 photo, 3
   archive pages; `config/app.admins` seeded).
3. ~~Verify the app at `#/t/brusarite`~~ — **done**.
4. ~~Delete the legacy data~~ — **done**: legacy top-level `persons/` +
   `archive/` removed, `config/app.editors` / `.viewers` stripped
   (`config/app` is now just `{ admins }`).
5. `firestore.rules` and `AuthContext` no longer have the legacy fallback —
   **redeploy the rules and the app**. That's the only step left.

The one-off `migrate-to-trees.mjs` / `cleanup-legacy.mjs` scripts were deleted
after the cutover; `scripts/set-admins.mjs` stays as the way to manage
`config/app.admins`.

## 11. Admin: delete a tree — built

`useTrees().deleteTree(slug)` walks the tree's `persons/*` (+ `photos/*`) and
`archive/*`, batch-deletes them, then removes the `trees/{slug}` doc last
(re-runnable if it fails partway). In the UI, the `#/` picker shows a trash
icon per tree for admins → `DeleteTreeDialog` (type the slug to arm the
button). Rules already had `allow delete: if isAdmin()` on `trees/{treeId}`,
and admins pass `isTreeEditor` so they can delete the nested docs too. Fine for
family-sized data; a Cloud Function would be needed at large scale.

## 12. Deferred polish (not built)

- Tree switcher dropdown in the toolbar (there's a back-arrow to `#/` for now).
- A dedicated admin screen for `config/app.admins` — use `scripts/set-admins.mjs`
  (`--list` / `--add` / `--remove`) or the console.
- Per-tree seed data / `About` text (seed loader still loads the Брусарите set).

> „Опознай рода си, за да си горд! Човек без роднини е сам."
