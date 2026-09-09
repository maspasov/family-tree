import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, treePaths } from '../lib/firebase'
import { useAuth } from '../auth/AuthContext'

export interface ArchivePhoto {
  id: string
  dataUrl: string
  caption?: string
  createdAt?: number
  uploadedByEmail?: string
}

/** Same one-doc-per-photo Firestore shape as `usePersonPhotos`, for the archive scans. */
export function useArchivePhotos(treeId: string) {
  const { user } = useAuth()
  const archivePath = treePaths(treeId).archive
  const [photos, setPhotos] = useState<ArchivePhoto[]>([])

  useEffect(() => {
    const col = collection(db, archivePath)
    return onSnapshot(col, (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as ArchivePhoto)
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      setPhotos(rows)
    })
  }, [archivePath])

  return useMemo(
    () => ({
      photos,
      async addPhoto(dataUrl: string, caption: string) {
        await addDoc(collection(db, archivePath), {
          dataUrl,
          ...(caption ? { caption } : {}),
          createdAt: serverTimestamp(),
          uploadedByEmail: user?.email ?? null,
        })
      },
      async updateCaption(photoId: string, caption: string) {
        await updateDoc(doc(db, archivePath, photoId), { caption })
      },
      async deletePhoto(photoId: string) {
        await deleteDoc(doc(db, archivePath, photoId))
      },
    }),
    [photos, archivePath, user],
  )
}
