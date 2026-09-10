# E2E tests

Playwright feature sweep that seeds a throwaway tree from `test-tree.json`
(~180 people, 6 generations, spouses, birthdays), asserts the main features,
then deletes the tree.

There is **no Firebase emulator** (the Firestore emulator needs Java), so the
suite runs against the **real** Firebase project, signed in as a dedicated
**email/password bot user** — no interactive Google OAuth, no `storageState` to
babysit. It is a local verification tool; it does **not** run in the deploy
workflow (Google/Firebase auth can't run in CI as-is).

## One-time setup

1. **Enable Email/Password sign-in**
   Firebase console → Authentication → Sign-in method → Email/Password → Enable.

2. **Create + provision the bot user** (needs the service-account key used by the
   other `scripts/`):

   ```
   node scripts/setup-e2e-user.mjs --key "C:\path\serviceAccountKey.json" \
       --email e2e-bot@yourdomain.com --password "<strong-password>"
   ```

   This creates the user, forces `emailVerified = true` (rules require it), and
   adds it to `config/app.admins` so the suite can create/delete trees.

3. **Point the dev server at it** — create `e2e/.env.e2e` (gitignored):

   ```
   VITE_E2E_EMAIL=e2e-bot@yourdomain.com
   VITE_E2E_PASSWORD=<strong-password>
   ```

   `AuthContext` auto-signs-in with these when they're set. They are **never**
   set for the GitHub Pages build — keep it that way.

## Run

```
yarn e2e          # headless
yarn e2e:ui       # Playwright UI mode
yarn e2e --headed
```

`webServer` in `playwright.config.ts` starts `yarn dev` for you (or reuses a
running one). The `setup` project signs in and snapshots the session to
`e2e/.auth/state.json`; every spec reuses it.

## Regenerate the fixture

```
yarn e2e:gen      # node e2e/gen-tree.mjs > e2e/test-tree.json
GENS=7 yarn e2e:gen   # deeper / larger
```

## Files

| file | purpose |
|---|---|
| `auth.setup.ts` | waits for the bot sign-in, saves `state.json` |
| `helpers.ts` | `createTree` / `importJson` / `deleteTree` / `forceBg` |
| `features.spec.ts` | the feature assertions |
| `gen-tree.mjs` | deterministic fixture generator |
| `test-tree.json` | committed fixture (import-JSON shape) |
