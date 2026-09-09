import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, treePaths } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'

export interface PersonPhoto {
  id: string
  dataUrl: string
  createdAt?: number
  uploadedByEmail?: string
}

/** Caller should key its component on `personId` so switching people remounts with fresh state. */
export function usePersonPhotos(treeId: string, personId: string) {
  const { user } = useAuth()
  const photosPath = treePaths(treeId).personPhotos(personId)
  const [photos, setPhotos] = useState<PersonPhoto[]>([])

  useEffect(() => {
    const col = collection(db, photosPath)
    return onSnapshot(col, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as PersonPhoto)
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      setPhotos(rows)
    })
  }, [photosPath])

  return useMemo(
    () => ({
      photos,
      async addPhoto(dataUrl: string) {
        await addDoc(collection(db, photosPath), {
          dataUrl,
          createdAt: serverTimestamp(),
          uploadedByEmail: user?.email ?? null,
        })
      },
      async deletePhoto(photoId: string) {
        await deleteDoc(doc(db, photosPath, photoId))
      },
    }),
    [photos, photosPath, user],
  )
}
