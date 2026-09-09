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
  /** True once signed in with a verified e-mail — enough to reach the tree picker. */
  signedIn: boolean
  /** Emails allowed to create/administer trees, from Firestore `config/app.admins`. */
  admins: string[]
  /** Signed in AND on the admins allow-list — may create trees and edit any tree. */
  isAdmin: boolean
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // When Firebase isn't configured there is nothing to wait for.
  const [loading, setLoading] = useState(firebaseConfigured)
  const [admins, setAdmins] = useState<string[]>([])
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
        const data = snap.data()
        setAdmins(
          ((data?.admins ?? []) as unknown[])
            .filter((e): e is string => typeof e === 'string')
            .map((e) => e.toLowerCase().trim()),
        )
      },
      // Rules allow public read of config/app; a failure here just means "no admins yet".
      () => setAdmins([]),
    )
  }, [])

  const value = useMemo<AuthState>(() => {
    const email = user?.email?.toLowerCase() ?? null
    const emailVerified = user?.emailVerified ?? false
    const signedIn = Boolean(email && emailVerified)
    return {
      user,
      loading,
      signedIn,
      admins,
      isAdmin: Boolean(signedIn && email && admins.includes(email)),
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
  }, [user, loading, admins, error])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
