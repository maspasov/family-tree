import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db, firebaseConfigured, paths } from '../lib/firebase'
import {
  descendantIds,
  type Person,
  type PersonDraft,
} from '../model/person'
import { useAuth } from '../auth/AuthContext'

function fromDoc(id: string, data: DocumentData): Person {
  return {
    id,
    name: data.name ?? '',
    surname: data.surname ?? '',
    parentId: data.parentId ?? null,
    spouse: data.spouse ?? '',
    gender: data.gender ?? 'unknown',
    birthYear: data.birthYear ?? '',
    deathYear: data.deathYear ?? '',
    birthPlace: data.birthPlace ?? '',
    note: data.note ?? '',
    childOrder: typeof data.childOrder === 'number' ? data.childOrder : undefined,
    verified: data.verified !== false,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt,
    updatedByEmail: data.updatedByEmail ?? undefined,
  }
}

/** Strip empty strings / undefined so Firestore docs stay tidy. */
function cleanDraft(draft: PersonDraft): DocumentData {
  const out: DocumentData = {}
  for (const [k, v] of Object.entries(draft)) {
    if (v === undefined || v === '') continue
    out[k] = v
  }
  if (out.parentId === undefined) out.parentId = null
  return out
}

export interface PersonsApi {
  people: Person[]
  byId: Map<string, Person>
  loading: boolean
  error: string | null
  /** Returns the new id. */
  addPerson: (draft: PersonDraft) => Promise<string>
  updatePerson: (id: string, draft: PersonDraft) => Promise<void>
  deletePerson: (id: string) => Promise<void>
  /** Upsert many at once (used by Import). Returns count written. */
  importPeople: (rows: Array<Partial<Person>>) => Promise<number>
}

/**
 * @param enabled Only subscribe once the caller knows the signed-in account is
 *   allowed in (see `LoginGate`) — Firestore rules would reject the read
 *   anyway, but there's no point even trying before that's known.
 */
export function usePersons(enabled: boolean): PersonsApi {
  const { user } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(firebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured || !enabled) return
    const col = collection(db, paths.persons)
    return onSnapshot(
      col,
      (snap) => {
        setPeople(snap.docs.map((d) => fromDoc(d.id, d.data())))
        setLoading(false)
        setError(null)
      },
      (e) => {
        setError(e.message)
        setLoading(false)
      },
    )
  }, [enabled])

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const api = useMemo<PersonsApi>(() => {
    const email = user?.email ?? null
    const audit = () => ({
      updatedAt: serverTimestamp(),
      updatedByEmail: email,
    })

    return {
      people,
      byId,
      loading,
      error,

      async addPerson(draft) {
        const ref = await addDoc(collection(db, paths.persons), {
          ...cleanDraft(draft),
          createdAt: serverTimestamp(),
          ...audit(),
        })
        return ref.id
      },

      async updatePerson(id, draft) {
        await updateDoc(doc(db, paths.persons, id), {
          ...cleanDraft(draft),
          ...audit(),
        })
      },

      async deletePerson(id) {
        const kids = descendantIds(people, id)
        if (kids.size > 0) {
          throw new Error(
            `Човекът има ${kids.size} потомък/ци — първо ги преместете или изтрийте.`,
          )
        }
        await deleteDoc(doc(db, paths.persons, id))
      },

      async importPeople(rows) {
        // Firestore batches cap at 500 writes.
        let written = 0
        for (let i = 0; i < rows.length; i += 400) {
          const batch = writeBatch(db)
          for (const row of rows.slice(i, i + 400)) {
            // `id`, `createdAt`, `updatedAt`, `updatedByEmail` are dropped via
            // the rest pattern; the rest is the person's editable fields.
            const { id: rawId, createdAt, updatedAt, updatedByEmail, ...rest } = row
            const id = (rawId && String(rawId)) || doc(collection(db, paths.persons)).id
            batch.set(
              doc(db, paths.persons, id),
              {
                name: '',
                parentId: null,
                gender: 'unknown',
                verified: true,
                ...rest,
                createdAt: serverTimestamp(),
                ...audit(),
              },
              { merge: true },
            )
            written++
          }
          await batch.commit()
        }
        return written
      },
    }
  }, [people, byId, loading, error, user])

  return api
}

/** Standalone helper for a one-shot upsert used outside React (rare). */
export async function upsertPerson(id: string, data: DocumentData) {
  await setDoc(doc(db, paths.persons, id), data, { merge: true })
}
