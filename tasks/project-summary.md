# Родословно дърво „Брусарите“ — Project Summary

**Date:** 2026-09-04
**Repo:** `C:\Users\maspasov\family-tree`

## Goal

Turn the 1987 hand-drawn genealogy chart of the „Брусарите" clan (клон Тано
Раде Брусарски) into an interactive, editable family-tree website that the
family can view and maintain online — free to host, in Bulgarian, with
Google sign-in so only approved relatives can edit it.

## Decisions made

| Question | Choice |
|---|---|
| Diagram library | [`d3-org-chart`](https://github.com/bumbeishvili/org-chart) (as requested) |
| Framework | React + Vite + TypeScript |
| Backend | **Firebase** — Google Auth + Firestore (managed, free tier, no server to run) |
| Hosting | **GitHub Pages** (free `<username>.github.io` domain) |
| Access model | Public read (anyone with the link can view) · edit restricted to a whitelist of Google-account emails |
| UI language | Bulgarian only (the family data is Bulgarian either way) |

### Why Firebase + GitHub Pages together

GitHub Pages only serves static files — there's no server to run. Firebase's
Auth and Firestore SDKs run entirely in the browser, so the two fit together
without needing any backend of our own, and Firebase's free tier (no credit
card) is generous enough for a family-sized site.

### The one real constraint from the library choice

`d3-org-chart` is a **single-parent** hierarchy (like an org chart: one box,
one boss). A family tree technically needs two parents per child. Since the
original 1987 chart is itself drawn patrilineally (one person per box, spouse
noted alongside), this mapped cleanly: each person's `parentId` points at
their father, and a spouse is stored as free text and shown inside the same
card (e.g. „Иван ⚭ Елена"). If the family later wants full two-parent /
marriage-union rendering, that would need a different library.

## What was built

- **Chart** — pan/zoom, expand/collapse, search-and-jump-to-person, layout
  toggle (root at top or bottom, matching the original drawing's bottom-up
  style), export to PNG, export to JSON.
- **Auth** — Google sign-in button; signed-in users who are **not** on the
  editor whitelist see a read-only "viewer" badge and a note explaining why
  they can't edit.
- **Editing** (whitelisted accounts only) — add person, add child, edit,
  delete (blocked if the person still has children in the tree, to avoid
  silently orphaning a branch), all backed by real-time Firestore sync so
  every open tab updates live.
- **Import/Export** — paste a JSON array to bulk-load data (used to seed the
  starter dataset below), and a one-click JSON backup download.
- **Starter data** (`src/seed/seedData.ts`) — only the part of the photo that
  was reliably legible: дядо Раде и неговите 6 деца (incl. дядо Тано), и
  petте деца на дядо Тано (поколение II). The dense handwritten поколения
  III–VI on the original chart could **not** be transcribed reliably from the
  photo — rather than guess at a family's actual genealogy, those are left
  for the family to add through the app's own "Добави дете" button or by
  editing the seed file and re-importing.
- **Security rules** (`firestore.rules`) — public read; write requires a
  signed-in, email-verified Google account whose email is listed in the
  Firestore document `config/app.editors`.
- **Deployment** — a GitHub Actions workflow that builds the app and
  publishes it to GitHub Pages on every push to `main`, automatically
  computing the right base URL path from the repository name.

## Verification done

- `npm run build` and `npm run lint` both pass with zero errors/warnings.
- Rendered the chart in a real headless browser (Playwright) against the
  starter dataset to confirm: Cyrillic text and fonts render correctly,
  gender colour-coding works, expand/collapse child-count badges work, and
  no console errors are thrown. (The throwaway test script was deleted
  afterwards — it wasn't meant to stay in the repo.)
- Git repository initialized locally; working tree clean.

## Current status — what's left

Everything code-side is done. What remains needs the user's own accounts and
choices, so it wasn't done automatically:

1. **Create the Firebase project** — enable Google sign-in, create a
   Firestore database, copy the web config into `.env.local`.
2. **Publish the Firestore security rules** (`firestore.rules`) via the
   Firebase console or CLI.
3. **Bootstrap the editor whitelist** — create Firestore document
   `config/app` with an `editors` array containing the family members'
   Google emails (e.g. `martospasov@gmail.com`).
4. **Create the GitHub repository and push** — `git remote add origin …` then
   `git push`. (Claude can do the push once the repo exists — just share the
   repo URL.)
5. **Add the six Firebase config values as GitHub Actions secrets**, and set
   **Settings → Pages → Source** to "GitHub Actions".
6. **Add the live site's domain** (`<username>.github.io`) to Firebase
   Auth's "Authorized domains" list, or Google sign-in will fail on the
   published site.
7. **Load the starter data** — sign in as an editor, then use the "Импорт
   (JSON)" → "Зареди началните данни от снимката" button.

Full copy-pasteable instructions for all of the above are written out
step-by-step in the repo's own `README.md`.

## Repo structure (quick reference)

```
family-tree/
  README.md                     full setup + deployment guide
  firestore.rules               security rules (public read, whitelist write)
  .github/workflows/deploy.yml  GitHub Pages deploy workflow
  src/
    lib/firebase.ts             Firebase init (Auth + Firestore)
    lib/i18n.ts                 all Bulgarian UI text
    auth/AuthContext.tsx        Google sign-in, editor-whitelist check
    data/usePersons.ts          real-time Firestore sync + CRUD + import
    model/person.ts             Person type, validation, chart-data shaping
    components/
      FamilyChart.tsx           the d3-org-chart wrapper
      Toolbar.tsx                search, zoom, export, sign-in bar
      PersonPanel.tsx           detail panel for the selected person
      PersonForm.tsx            add/edit form
      ImportDialog.tsx          JSON import / starter-data loader
    seed/seedData.ts            the transcribed starter dataset
```

## Motto (from the original 1987 chart)

> „Опознай рода си, за да си горд! Човек без роднини е сам."
> (*Know your family, so you can be proud! A person without relatives is
> alone.*)
