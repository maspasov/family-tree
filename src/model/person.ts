/**
 * Domain model for a single person in the family tree.
 *
 * The chart library (`d3-org-chart`) is a strict single-parent hierarchy, so
 * `parentId` points at ONE lineage parent (by convention the father, matching
 * the hand-drawn „Брусарите“ chart which is patrilineal). A spouse is recorded
 * as free text on `spouse` and rendered inside the same node card.
 */
import { getLocale } from '../lib/i18n'

export type Gender = 'm' | 'f' | 'unknown'

/**
 * Only `'child'` and `'father'` actually reshape the tree (see `Person.relation`
 * below) — every other value is a descriptive label shown on the person's
 * panel, never touching `parentId`. Deliberately not attempting to place
 * "aunt"/"cousin"/etc. structurally: this tree is a strict single-parent
 * hierarchy (that's why `d3-org-chart` was chosen), and those relations don't
 * have a clean single-edge representation the way child/father do.
 */
export type RelationType =
  | 'child'
  | 'father'
  | 'mother'
  | 'wife'
  | 'husband'
  | 'grandfather'
  | 'grandmother'
  | 'aunt'
  | 'uncle'
  | 'cousin'
  | 'other'

export interface Person {
  /** Firestore document id. */
  id: string
  /** Given name(s), Cyrillic. Required. */
  name: string
  /** Patronymic (bащино име), Cyrillic. Optional — many rows on the source chart omit it. */
  patronymic?: string
  /** Family name, Cyrillic. Optional (many rows on the source chart omit it). */
  surname?: string
  /**
   * Latin-script counterparts, optional. When set and the active UI locale
   * isn't `bg`, `fullName()` prefers these over the Cyrillic fields above —
   * lets a person's name display correctly for EN/DE readers instead of
   * always showing the Cyrillic transcription regardless of UI language.
   */
  nameEn?: string
  patronymicEn?: string
  surnameEn?: string
  /** Lineage parent's id, or null for the single root of the tree. */
  parentId: string | null
  /**
   * Mother/father's name as free text — informational only, independent of
   * `parentId` (the structural bloodline link used for the tree hierarchy,
   * by convention the father). Lets either parent be recorded even when they
   * aren't themselves a node in this tree.
   */
  motherName?: string
  fatherName?: string
  /**
   * Optional descriptive family relation, shown on the panel as e.g. „Леля на
   * Мартин Спасов“. `toName` is denormalized so the label still reads
   * correctly even if `toId`'s person is later renamed or deleted. `null`
   * (not `undefined`) explicitly clears it — same convention as `geo`.
   * Only `type: 'child'` (sets this person's own `parentId`) and `'father'`
   * (reassigns the *anchor's* `parentId` to this person, handled in
   * `App.tsx`'s submit flow) affect tree structure; every other type is
   * label-only.
   */
  relation?: { type: RelationType; toId: string; toName: string; customLabel?: string } | null
  /** Spouse, free text e.g. „Елена (по баща Петрова)“. */
  spouse?: string
  gender: Gender
  /** Year of birth as written, kept as string to allow „~1860“, „1901?“ etc. */
  birthYear?: string
  deathYear?: string
  /** Village / town, e.g. „с. Враняк, Врачанско“. */
  birthPlace?: string
  /** Current address, free text — geocoded into `geo` for the map view. */
  address?: string
  /** Optional contact email — lets the app notify this person when they're added to the tree. */
  email?: string
  /**
   * Geocoded from `address`. `undefined` = never geocoded; `null` = explicitly
   * cleared by the user. Use `null` (not `undefined`) to clear an existing pin —
   * `cleanDraft` in `usePersons.ts` drops `undefined`/`''` keys entirely (so the
   * old value would silently survive in Firestore), but writes `null` through.
   */
  geo?: { lat: number; lng: number } | null
  /** `MM-DD`, e.g. `05-17`. Optional/additive to `birthYear` — unlocks a recurring calendar-view/.ics birthday event. */
  birthMonthDay?: string
  /** Any free-form note (occupation, nickname „дедо Тано“, source remarks). */
  note?: string
  /** Order among siblings; lower shows first. Defaults to a large number. */
  childOrder?: number
  /** false = reading from the photo is uncertain and needs a human to confirm. */
  verified?: boolean

  // --- audit ---
  createdAt?: number
  updatedAt?: number
  updatedByEmail?: string
}

/** Fields the edit form is allowed to write. */
export type PersonDraft = Omit<
  Person,
  'id' | 'createdAt' | 'updatedAt' | 'updatedByEmail'
>

export const EMPTY_DRAFT: PersonDraft = {
  name: '',
  patronymic: '',
  surname: '',
  nameEn: '',
  patronymicEn: '',
  surnameEn: '',
  parentId: null,
  motherName: '',
  fatherName: '',
  relation: undefined,
  spouse: '',
  gender: 'unknown',
  birthYear: '',
  deathYear: '',
  birthPlace: '',
  address: '',
  email: '',
  geo: undefined,
  birthMonthDay: '',
  note: '',
  childOrder: undefined,
  verified: true,
}

/** Drop the fields the form doesn't own (id + audit), keep the editable rest. */
export function stripAudit(p: Person): PersonDraft {
  const { id, createdAt, updatedAt, updatedByEmail, ...draft } = p
  return draft
}

export function fullName(
  p: Pick<Person, 'name' | 'patronymic' | 'surname' | 'nameEn' | 'patronymicEn' | 'surnameEn'>,
): string {
  if (getLocale() !== 'bg' && (p.nameEn || p.surnameEn)) {
    return [p.nameEn || p.name, p.patronymicEn, p.surnameEn || p.surname]
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  return [p.name, p.patronymic, p.surname].filter(Boolean).join(' ').trim()
}

/** „1860 – 1920“, „р. 1901“, „† 1970“, or "" when nothing is known. */
export function lifespan(p: Pick<Person, 'birthYear' | 'deathYear'>): string {
  const b = (p.birthYear ?? '').trim()
  const d = (p.deathYear ?? '').trim()
  if (b && d) return `${b} – ${d}`
  if (b) return `р. ${b}`
  if (d) return `† ${d}`
  return ''
}

export interface ValidationResult {
  ok: boolean
  errors: Partial<Record<keyof PersonDraft, string>>
}

/** Basic client-side validation. Firestore rules are the real guard. */
export function validateDraft(
  draft: PersonDraft,
  opts: { requireParent: boolean },
): ValidationResult {
  const errors: ValidationResult['errors'] = {}
  if (!draft.name.trim()) errors.name = 'Името е задължително.'
  if (opts.requireParent && !draft.parentId) {
    errors.parentId = 'Изберете към кого се добавя този човек.'
  }
  for (const key of ['birthYear', 'deathYear'] as const) {
    const v = (draft[key] ?? '').trim()
    if (v && !/^[~?]?\d{3,4}\??$/.test(v)) {
      errors[key] = 'Използвайте година, напр. 1901, ~1860 или 1901?.'
    }
  }
  const bmd = (draft.birthMonthDay ?? '').trim()
  if (bmd) {
    const m = /^(\d{2})-(\d{2})$/.exec(bmd)
    const month = m ? Number(m[1]) : NaN
    const day = m ? Number(m[2]) : NaN
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (!m || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
      errors.birthMonthDay = 'Използвайте формат ММ-ДД, напр. 05-17.'
    }
  }
  const email = (draft.email ?? '').trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Невалиден имейл адрес.'
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/**
 * d3-org-chart needs EXACTLY ONE node with an empty parent. If the data is
 * inconsistent (missing parent, cycle, several roots) we splice in a synthetic
 * root so the chart still renders instead of throwing.
 */
export const SYNTHETIC_ROOT_ID = '__root__'

export interface ChartDatum {
  id: string
  parentId: string | null
  person: Person | null // null only for the synthetic root
  _synthetic?: boolean
  /** Direct child count, stamped by the chart component for the node badge. */
  _childCount?: number
}

export function toChartData(people: Person[]): ChartDatum[] {
  const byId = new Map(people.map((p) => [p.id, p]))
  const roots = people.filter((p) => !p.parentId || !byId.has(p.parentId))

  const sorted = [...people].sort(
    (a, b) =>
      (a.childOrder ?? 1e9) - (b.childOrder ?? 1e9) ||
      fullName(a).localeCompare(fullName(b), 'bg'),
  )

  if (roots.length === 1) {
    return sorted.map((p) => ({
      id: p.id,
      parentId: p.parentId && byId.has(p.parentId) ? p.parentId : null,
      person: p,
    }))
  }

  // 0 roots (cycle) or 2+ roots: attach everything rootless under a synthetic node.
  const rootIds = new Set(roots.map((r) => r.id))
  return [
    { id: SYNTHETIC_ROOT_ID, parentId: null, person: null, _synthetic: true },
    ...sorted.map((p) => ({
      id: p.id,
      parentId:
        p.parentId && byId.has(p.parentId) && !rootIds.has(p.id)
          ? p.parentId
          : SYNTHETIC_ROOT_ID,
      person: p,
    })),
  ]
}

export function childrenOf(people: Person[], parentId: string | null): Person[] {
  return people
    .filter((p) => p.parentId === parentId)
    .sort(
      (a, b) =>
        (a.childOrder ?? 1e9) - (b.childOrder ?? 1e9) ||
        fullName(a).localeCompare(fullName(b), 'bg'),
    )
}

export function descendantIds(people: Person[], rootId: string): Set<string> {
  const out = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const current = stack.pop() as string
    for (const p of people) {
      if (p.parentId === current && !out.has(p.id)) {
        out.add(p.id)
        stack.push(p.id)
      }
    }
  }
  return out
}
