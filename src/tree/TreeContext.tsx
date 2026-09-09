import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db, treePaths } from '../lib/firebase'
import { treeFromDoc, type Tree } from '../model/tree'
import { useAuth } from '../auth/AuthContext'

interface TreeState {
  /** The tree's slug === its Firestore doc id. */
  treeId: string
  tree: Tree | null
  loading: boolean
  /** The `trees/{treeId}` document does not exist. */
  notFound: boolean
  /** This tree's editor list (admins are implicit editors of every tree). */
  editors: string[]
  viewers: string[]
  isEditor: boolean
  isViewer: boolean
  /** Allowed to see this tree at all. */
  canView: boolean
  /** Can see it but not edit it. */
  isViewerOnly: boolean
  /** Replace this tree's editor/viewer lists (used by the roles dialog). */
  setRoles: (editors: string[], viewers: string[]) => Promise<void>
}

const TreeCtx = createContext<TreeState | null>(null)

export function TreeProvider({ treeId, children }: { treeId: string; children: ReactNode }) {
  const { user, isAdmin } = useAuth()
  const [tree, setTree] = useState<Tree | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // `<TreeProvider>` is keyed on treeId in App, so this effect only runs on
    // a fresh mount — state is already at its initial (loading) value here.
    const ref = doc(db, ...treePaths(treeId).doc)
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setTree(treeFromDoc(snap.id, snap.data()))
          setNotFound(false)
        } else {
          setTree(null)
          setNotFound(true)
        }
        setLoading(false)
      },
      () => {
        setTree(null)
        setNotFound(true)
        setLoading(false)
      },
    )
  }, [treeId])

  const value = useMemo<TreeState>(() => {
    const email = user?.email?.toLowerCase() ?? null
    const editors = tree?.editors ?? []
    const viewers = tree?.viewers ?? []
    const isEditor = isAdmin || Boolean(email && editors.includes(email))
    const isViewer = isEditor || Boolean(email && viewers.includes(email))
    return {
      treeId,
      tree,
      loading,
      notFound,
      editors,
      viewers,
      isEditor,
      isViewer,
      canView: isViewer,
      isViewerOnly: isViewer && !isEditor,
      async setRoles(nextEditors, nextViewers) {
        await updateDoc(doc(db, ...treePaths(treeId).doc), {
          editors: nextEditors,
          viewers: nextViewers,
        })
      },
    }
  }, [treeId, tree, loading, notFound, user, isAdmin])

  return <TreeCtx.Provider value={value}>{children}</TreeCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTree(): TreeState {
  const ctx = useContext(TreeCtx)
  if (!ctx) throw new Error('useTree must be used inside <TreeProvider>')
  return ctx
}
