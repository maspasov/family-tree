/**
 * Domain model for a single person in the family tree.
 *
 * The chart library (`d3-org-chart`) is a strict single-parent hierarchy, so
 * `parentId` points at ONE lineage parent (by convention the father, matching
 * the hand-drawn „Брусарите“ chart which is patrilineal). A spouse is recorded
 * as free text on `spouse` and rendered inside the same node card.
 */
export type Gender = 'm' | 'f' | 'unknown'

export interface Person {
  /** Firestore document id. */
  id: string
  /** Given name(s), Cyrillic. Required. */
  name: string
  /** Family name, Cyrillic. Optional (many rows on the source chart omit it). */
  surname?: string
  /** Lineage parent's id, or null for the single root of the tree. */
  parentId: string | null
  /** Spouse, free text e.g. „Елена (по баща Петрова)“. */
  spouse?: string
  gender: Gender
  /** Year of birth as written, kept as string to allow „~1860“, „1901?“ etc. */
  birthYear?: string
  deathYear?: string
  /** Village / town, e.g. „с. Враняк, Врачанско“. */
  birthPlace?: string
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
  surname: '',
  parentId: null,
  spouse: '',
  gender: 'unknown',
  birthYear: '',
  deathYear: '',
  birthPlace: '',
  note: '',
  childOrder: undefined,
  verified: true,
}

export function fullName(p: Pick<Person, 'name' | 'surname'>): string {
  return [p.name, p.surname].filter(Boolean).join(' ').trim()
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
