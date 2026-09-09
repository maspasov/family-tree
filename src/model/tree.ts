import type { DocumentData } from 'firebase/firestore'

/**
 * A single family tree's metadata document at `trees/{id}`. `id` is the URL
 * slug. `editors` / `viewers` are this tree's own access lists (they used to
 * be the global `config/app.editors` / `.viewers` back when the app hosted
 * exactly one tree). `name` / `subtitle` / `motto` override the i18n defaults
 * for this tree's chrome when set.
 */
export interface Tree {
  id: string
  slug: string
  name?: string
  subtitle?: string
  motto?: string
  editors: string[]
  viewers: string[]
  createdByEmail?: string
  createdAt?: number
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** "Клан Тано Раде" → "klan-tano-rade" (best-effort; Cyrillic is transliterated). */
const CYR_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[а-я]/g, (c) => CYR_MAP[c] ?? '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function treeFromDoc(id: string, data: DocumentData): Tree {
  const list = (raw: unknown): string[] =>
    Array.isArray(raw) ? raw.filter((e): e is string => typeof e === 'string') : []
  return {
    id,
    slug: typeof data.slug === 'string' ? data.slug : id,
    name: data.name || undefined,
    subtitle: data.subtitle || undefined,
    motto: data.motto || undefined,
    editors: list(data.editors),
    viewers: list(data.viewers),
    createdByEmail: data.createdByEmail ?? undefined,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
  }
}
