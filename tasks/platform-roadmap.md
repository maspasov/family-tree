# From family tree to family platform — feasibility & roadmap memo

**Status:** planning only — nothing in this memo is built yet.
**Scope:** an assessment of five requested expansions to „Родословно дърво" —
addresses & maps, a shared calendar, and integrations with social and
government systems — with a build order for the ones worth building.

## At a glance

| Proposal | Verdict | Effort | Why |
|---|---|---|---|
| Addresses + map view | **Build it** | S–M | Just data plus a mapping library — no platform gatekeeping involved. |
| Calendar: birthdays, events, goals | **Build it** | M | Entirely first-party data already in Firestore. Highest value for the effort of anything here. |
| Facebook / Instagram / LinkedIn links | **Build it — as links** | S | A profile-URL field is what these platforms actually permit for a family app in 2026. |
| Deep social integration (auto-pull posts/photos) | **Don't** | L | Personal-account API access is closed on Meta; LinkedIn hasn't approved a data-access partner since 2018. |
| National insurance / government lookup | **Don't build this** | — | No public API exists. The only way in is a relative's own government login — a security problem, not a feature. |

## 01. Addresses & a map view — recommended

Every `Person` already carries a free-text `birthPlace` (e.g. „с. Враняк,
Врачанско"). This phase adds a *current address* and, optionally, geocoded
coordinates, then a new „Карта" tab next to the tree that plots a pin per
person who has one.

- Extend `Person` with `address` (free text) and `geo: {lat, lng}`.
- A geocode-on-save step turns a typed address into coordinates.
- A map view, clustering pins where several relatives share a town.
- Clicking a pin opens the same `PersonPanel` already used from the tree.

**Two ways to build the map, one recommendation:**

- **OpenStreetMap + Leaflet** — free, no API key, no billing account,
  consistent with everything else in this project (Firebase Spark, GitHub
  Pages — nothing here has ever needed a credit card). Styling is more DIY
  and there's no Street View.
- **Google Maps Platform** — nicer default styling and Street View, but as of
  March 2025 Google retired the old $200/month credit that made light use
  free by default. It now gives 10,000 free geocoding calls a month — far
  more than a family tree needs — but claiming even that free tier requires
  attaching a real billing account to the Google Cloud project.

**Recommendation:** start with Leaflet + OpenStreetMap to keep the "no card
required" property this project has had from day one; keep Google Maps as a
documented drop-in swap if the look matters more later.

## 02. Calendar — birthdays, events, goals — recommended, start here

This is the part of "not just a tree, a platform" that's actually free to
build well: nothing here depends on an outside company's API or review
process.

- New Firestore collection `events`: `type` (`birthday` · `anniversary` ·
  `event` · `goal`), `title`, `date`, `recurring`, `note`, optional
  `personId` link back into the tree.
- Birthdays need one small schema change first: today `birthYear` is just a
  year (`"1901"`, `"~1860"`) — add an optional `birthMonthDay` so a birthday
  can actually recur automatically instead of being retyped by hand each
  year.
- A month-grid calendar view, plus an "upcoming" list on first load — same
  Bulgarian-only UI, same access-gate as the tree itself.
- Goals as a lighter-weight version of the same collection: owner, target
  date, status, notes — a shared family to-do rather than a second app.

**Keeping reminders free:** emailing "3 birthdays this week" would normally
mean Cloud Functions, which needs Firebase's paid Blaze plan (still cheap at
this scale, but a card on file). A scheduled GitHub Action reusing the free
Actions minutes already running the Pages deploy can read Firestore over its
REST API and send a weekly digest through a free-tier email API (e.g. Resend
or Brevo) instead — no Firebase plan change needed.

## 03. Facebook, Instagram, LinkedIn — and "all other" networks

**Recommended, in a smaller shape than asked.** I checked what each platform
actually allows a third-party app to do with a person's account in 2026,
since this determines the whole feature, not just its polish.

**What I found:**

- **Meta (Facebook / Instagram):** personal profiles have no API access at
  all any more. The Instagram Basic Display API — the one that used to let a
  personal account share basic profile data — was retired in December 2024.
  Everything now goes through the Instagram Graph API, which requires the
  account to be a Business or Creator account linked to a Facebook Page, plus
  a Meta app review (2–4 weeks) before it can serve real users.
- **LinkedIn:** the most restrictive of the three. The free, self-serve tier
  only ever returns the *signed-in* user's own name, headline, and email —
  never another member's data — and LinkedIn is on record as not having
  approved a new third-party data-access partner since 2018.

In plain terms: there's no version of "pull relatives' photos or posts into
the tree" that's realistically buildable for a personal family project. What
*is* fully available today, with no review process and no dependency that can
be revoked later:

- Extend `Person` with `socialLinks: { facebook?, instagram?, linkedin?, other?: [{label, url}] }` — the same pattern already used for the free-text `spouse` field.
- Small platform icons on each person's card and detail panel, linking out to the profile in a new tab.
- An editor fills these in the same way they fill in a birth year — no sign-in, no token, nothing that expires.

**Optional stretch — probably not worth it:** each logged-in family member
*could* "Connect Facebook / LinkedIn" via their own OAuth sign-in to
auto-fill their own link. It's technically possible, but it means running a
Meta app review and a LinkedIn app registration for a feature that saves
someone typing one URL once. Recommend skipping unless a specific reason
comes up later.

## 04. National insurance / government systems — not recommended

I looked specifically for a public API into Bulgaria's National Social
Security Institute (НОИ) — the closest thing to what "check life insurance"
would mean here.

**What I found:** НОИ's e-services portal (Единен портал за електронни
услуги, ЕПЕУ) is a *personal* self-service portal. It's reached only through
the individual's own НОИ PIN, NAP PIN, or qualified electronic signature
(КЕП) — there is no public, general-purpose API that a third-party app can
query on someone else's behalf, and no indication one exists for any
Bulgarian institution's social-security or insurance records.

The only two ways to technically get at this data would be either collecting
each relative's actual government login credentials inside this app, or
automating their personal portal session on their behalf. Both are a real
security and legal problem — insurance and social-security records are
sensitive personal data under GDPR — not a missing feature. Recommend not
building this.

**What gets most of the underlying value, safely:** a private "important
info" section per person — insurer name, policy number, a contact, an expiry
date — typed in by that person or a trusted relative, the same way `note`
works today. Unlike the rest of the tree, this section should be visible only
to that one person plus the tree owner, not the whole editor list, since it's
meaningfully more sensitive than a birth year.

## 05. Data model additions

Everything above that's recommended, in one place, on top of the existing
`Person` and `config/app` shapes.

**`persons/{id}` — new fields**

| Field | Notes |
|---|---|
| `address` | Current address, free text — same convention as the existing `birthPlace`. |
| `geo` | `{lat, lng}`, geocoded from `address` for the map view. |
| `birthMonthDay` | Optional `MM-DD`, additive to the existing `birthYear` string — unlocks recurring birthday events. |
| `socialLinks` | `{ facebook?, instagram?, linkedin?, other?: [{label, url}] }` — all optional profile URLs. |
| `privateInfo` | Insurance / important-document notes — restricted to that person + the owner, not the general editor list. |

**`events/{id}` — new collection**

| Field | Notes |
|---|---|
| `type` | `birthday · anniversary · event · goal` |
| `title, date, recurring` | Shown on the calendar and the "upcoming" widget. |
| `personId` | Optional link back to a person, for auto-derived entries like birthdays. |

**`firestore.rules`**

| Rule | Notes |
|---|---|
| `events/*` | Same `isEditor()` gate as `persons/*` already uses. |
| `persons/{id}.privateInfo` | A per-field rule: only that person's own account or an owner role, not the general editor list. |

## 06. Suggested build order

Cheapest, safest, most-used first; anything touching an outside company's
review process comes last, if at all.

1. **Calendar** — birthdays, events, goals — no new dependency
2. **Social profile links** — icons, no API — no review process
3. **Addresses + map** (Leaflet/OSM) — still no billing
4. **Private info** section (insurance notes, self-reported) — needs a visibility rule
5. **Government-system lookup** — not building

## Sources checked while writing this memo

- [nssi.bg — Единен портал за електронни услуги (ЕПЕУ), authentication model](https://nssi.bg/administrativno-obslujvane/epeu/)
- [developers.google.com — Google Maps Platform billing changes, March 2025](https://developers.google.com/maps/billing-and-pricing/faq)
- [sociavault.com — Instagram Basic Display API retirement, Dec 2024](https://sociavault.com/blog/instagram-api-deprecated-alternative-2026)
- [socialcrawl.dev — LinkedIn API partner-approval history](https://www.socialcrawl.dev/blog/linkedin-data-api-2026)
- [linkedin.com — API Terms of Use, self-serve OAuth scopes](https://www.linkedin.com/legal/l/api-terms-of-use)

> „Опознай рода си, за да си горд! Човек без роднини е сам."
