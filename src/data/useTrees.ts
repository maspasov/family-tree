import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { db, firebaseConfigured, paths, treePaths } from '../lib/firebase'
import { treeFromDoc, type Tree } from '../model/tree'
import { useAuth } from '../auth/AuthContext'

export interface CreateTreeInput {
  slug: string
  name: string
  subtitle?: string
  motto?: string
  firstEditorEmail: string
}

export interface TreesApi {
  /** Trees the signed-in account may open (admins see all). */
  trees: Tree[]
  loading: boolean
  error: string | null
  /** True if the slug is already taken. */
  slugExists: (slug: string) => Promise<boolean>
  /** Creates `trees/{slug}` and returns its slug. */
  createTree: (input: CreateTreeInput) => Promise<string>
  /** Admin only: deletes a tree and everything under it (people, photos, archive). */
  deleteTree: (slug: string) => Promise<void>
}

async function deleteRefs(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + 400)) batch.delete(ref)
    await batch.commit()
  }
}

/**
 * `trees/{id}` docs are publicly readable (they hold only a display name and
 * two e-mail lists — same sensitivity as the old `config/app`), so the picker
 * reads the whole collection and filters client-side to the ones this account
 * can actually open.
 */
export function useTrees(): TreesApi {
  const { user, isAdmin } = useAuth()
  const [all, setAll] = useState<Tree[]>([])
  const [loading, setLoading] = useState(firebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) return
    return onSnapshot(
      collection(db, paths.trees),
      (snap) => {
        setAll(snap.docs.map((d) => treeFromDoc(d.id, d.data())))
        setLoading(false)
        setError(null)
      },
      (e) => {
        setError(e.message)
        setLoading(false)
      },
    )
  }, [])

  return useMemo<TreesApi>(() => {
    const email = user?.email?.toLowerCase() ?? null
    const visible = isAdmin
      ? all
      : all.filter(
          (tr) => email && (tr.editors.includes(email) || tr.viewers.includes(email)),
        )
    visible.sort((a, b) => (a.name ?? a.slug).localeCompare(b.name ?? b.slug, 'bg'))
    return {
      trees: visible,
      loading,
      error,
      async slugExists(slug) {
        const snap = await getDoc(doc(db, ...treePaths(slug).doc))
        return snap.exists()
      },
      async createTree(input) {
        const editor = input.firstEditorEmail.trim().toLowerCase()
        await setDoc(doc(db, ...treePaths(input.slug).doc), {
          slug: input.slug,
          name: input.name.trim(),
          ...(input.subtitle?.trim() ? { subtitle: input.subtitle.trim() } : {}),
          ...(input.motto?.trim() ? { motto: input.motto.trim() } : {}),
          editors: editor ? [editor] : [],
          viewers: [],
          createdByEmail: email,
          createdAt: serverTimestamp(),
        })
        return input.slug
      },
      async deleteTree(slug) {
        // Firestore has no cascade — walk the subcollections and delete their
        // docs, then the tree doc itself last (so a mid-way failure leaves the
        // tree still listed and the delete simply re-runnable). Fine for
        // family-sized data; a Cloud Function would be needed at large scale.
        const tp = treePaths(slug)
        const persons = await getDocs(collection(db, tp.persons))
        for (const p of persons.docs) {
          const photos = await getDocs(collection(db, tp.personPhotos(p.id)))
          await deleteRefs(photos.docs.map((d) => d.ref))
          await deleteDoc(p.ref)
        }
        const archive = await getDocs(collection(db, tp.archive))
        await deleteRefs(archive.docs.map((d) => d.ref))
        await deleteDoc(doc(db, ...tp.doc))
      },
    }
  }, [all, loading, error, user, isAdmin])
}
