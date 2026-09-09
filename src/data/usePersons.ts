import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db, firebaseConfigured, treePaths } from '../lib/firebase'
import {
  descendantIds,
  type Person,
  type PersonDraft,
  type RelationType,
} from '../model/person'
import { useAuth } from '../auth/AuthContext'

function fromDoc(id: string, data: DocumentData): Person {
  return {
    id,
    name: data.name ?? '',
    patronymic: data.patronymic ?? '',
    surname: data.surname ?? '',
    nameEn: data.nameEn ?? '',
    patronymicEn: data.patronymicEn ?? '',
    surnameEn: data.surnameEn ?? '',
    parentId: data.parentId ?? null,
    motherName: data.motherName ?? '',
    fatherName: data.fatherName ?? '',
    relation:
      data.relation && typeof data.relation.type === 'string' && typeof data.relation.toId === 'string'
        ? {
            type: data.relation.type as RelationType,
            toId: data.relation.toId,
            toName: data.relation.toName ?? '',
            // Omit the key entirely rather than setting it to `undefined` —
            // Firestore rejects `undefined` anywhere in a written document,
            // including nested, and this object gets written back verbatim
            // on the next edit (`updateDoc`) if the field is ever touched.
            ...(typeof data.relation.customLabel === 'string'
              ? { customLabel: data.relation.customLabel }
              : {}),
          }
        : undefined,
    spouse: data.spouse ?? '',
    gender: data.gender ?? 'unknown',
    birthYear: data.birthYear ?? '',
    deathYear: data.deathYear ?? '',
    birthPlace: data.birthPlace ?? '',
    address: data.address ?? '',
    email: data.email ?? '',
    geo:
      data.geo && typeof data.geo.lat === 'number' && typeof data.geo.lng === 'number'
        ? { lat: data.geo.lat, lng: data.geo.lng }
        : undefined,
    birthMonthDay: data.birthMonthDay ?? '',
    note: data.note ?? '',
    childOrder: typeof data.childOrder === 'number' ? data.childOrder : undefined,
    verified: data.verified !== false,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt,
    updatedByEmail: data.updatedByEmail ?? undefined,
  }
}

/**
 * Strip empty strings / undefined so Firestore docs stay tidy.
 *
 * Note: this means a field can't be cleared back to empty by omitting it —
 * `updateDoc` never even sees a dropped key, so the old value silently
 * survives server-side. `null` is NOT stripped, so it's the way to explicitly
 * clear an optional field (see `Person.geo`'s doc comment).
 */
function cleanDraft(draft: PersonDraft): DocumentData {
  const out: DocumentData = {}
  for (const [k, v] of Object.entries(draft)) {
    if (v === undefined || v === '') continue
    out[k] = v
  }
  if (out.parentId === undefined) out.parentId = null
  return out
}

/**
 * Build an `updateDoc` payload from a full draft. Unlike `cleanDraft` (creates
 * only), a field the user emptied must be sent as an explicit `deleteField()` —
 * merely omitting the key leaves the previous value untouched server-side, so
 * an email / address / note / … could never be cleared once saved.
 */
function cleanDraftForUpdate(draft: PersonDraft): DocumentData {
  const out: DocumentData = {}
  for (const [k, v] of Object.entries(draft)) {
    if (k === 'parentId') {
      out.parentId = v ?? null
      continue
    }
    out[k] = v === undefined || v === '' ? deleteField() : v
  }
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
 * @param treeId  Which tree's people to load — `trees/{treeId}/persons`.
 * @param enabled Only subscribe once the caller knows the signed-in account may
 *   read this tree (see `TreeContext`) — Firestore rules would reject the read
 *   anyway, but there's no point even trying before that's known.
 */
export function usePersons(treeId: string, enabled: boolean): PersonsApi {
  const { user } = useAuth()
  const personsPath = treePaths(treeId).persons
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(firebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured || !enabled) return
    const col = collection(db, personsPath)
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
  }, [enabled, personsPath])

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
        const ref = await addDoc(collection(db, personsPath), {
          ...cleanDraft(draft),
          createdAt: serverTimestamp(),
          ...audit(),
        })
        return ref.id
      },

      async updatePerson(id, draft) {
        await updateDoc(doc(db, personsPath, id), {
          ...cleanDraftForUpdate(draft),
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
        await deleteDoc(doc(db, personsPath, id))
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
            const id = (rawId && String(rawId)) || doc(collection(db, personsPath)).id
            batch.set(
              doc(db, personsPath, id),
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
  }, [people, byId, loading, error, user, personsPath])

  return api
}

/** Standalone helper for a one-shot upsert used outside React (rare). */
export async function upsertPerson(treeId: string, id: string, data: DocumentData) {
  await setDoc(doc(db, treePaths(treeId).persons, id), data, { merge: true })
}
