import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'

export interface PersonPhoto {
  id: string
  dataUrl: string
  createdAt?: number
  uploadedByEmail?: string
}

/** Caller should key its component on `personId` so switching people remounts with fresh state. */
export function usePersonPhotos(personId: string) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<PersonPhoto[]>([])

  useEffect(() => {
    const col = collection(db, 'persons', personId, 'photos')
    return onSnapshot(col, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as PersonPhoto)
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      setPhotos(rows)
    })
  }, [personId])

  return useMemo(
    () => ({
      photos,
      async addPhoto(dataUrl: string) {
        await addDoc(collection(db, 'persons', personId, 'photos'), {
          dataUrl,
          createdAt: serverTimestamp(),
          uploadedByEmail: user?.email ?? null,
        })
      },
      async deletePhoto(photoId: string) {
        await deleteDoc(doc(db, 'persons', personId, 'photos', photoId))
      },
    }),
    [photos, personId, user],
  )
}
