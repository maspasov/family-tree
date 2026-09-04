import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, firebaseConfigured, googleProvider, paths } from '../lib/firebase'

interface AuthState {
  /** null until Firebase reports the first auth state. */
  user: User | null
  loading: boolean
  /** Emails allowed to edit, from Firestore `config/app.editors`. */
  editors: string[]
  /** Signed in AND email is on the editors allow-list. */
  isEditor: boolean
  /** Signed in but not on the allow-list. */
  isViewerOnly: boolean
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // When Firebase isn't configured there is nothing to wait for.
  const [loading, setLoading] = useState(firebaseConfigured)
  const [editors, setEditors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!firebaseConfigured) return
    const ref = doc(db, ...paths.configDoc)
    return onSnapshot(
      ref,
      (snap) => {
        const raw = (snap.data()?.editors ?? []) as unknown[]
        setEditors(
          raw
            .filter((e): e is string => typeof e === 'string')
            .map((e) => e.toLowerCase().trim()),
        )
      },
      // Rules allow public read of config/app; a failure here just means "no editors yet".
      () => setEditors([]),
    )
  }, [])

  const value = useMemo<AuthState>(() => {
    const email = user?.email?.toLowerCase() ?? null
    const emailVerified = user?.emailVerified ?? false
    const isEditor = Boolean(email && emailVerified && editors.includes(email))
    return {
      user,
      loading,
      editors,
      isEditor,
      isViewerOnly: Boolean(user) && !isEditor,
      error,
      async signIn() {
        setError(null)
        try {
          await signInWithPopup(auth, googleProvider)
        } catch (e) {
          const code = (e as { code?: string }).code ?? ''
          if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            return
          }
          setError((e as Error).message)
        }
      },
      async signOutUser() {
        setError(null)
        await signOut(auth)
      },
    }
  }, [user, loading, editors, error])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
