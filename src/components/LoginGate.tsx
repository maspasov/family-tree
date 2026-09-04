import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { bg, motto, t } from '../lib/i18n'

/**
 * Gates the whole app behind Google sign-in AND the Firestore `config/app.editors`
 * allow-list — nothing (not even a read-only view) renders for anyone else.
 * Firestore rules enforce the same check server-side; this is just the UI half.
 */
export function LoginGate({ children }: { children: ReactNode }) {
  const { loading, user, isEditor, error, signIn, signOutUser } = useAuth()

  if (loading) {
    return (
      <div className="ft-fullmsg">
        <p>{t('loading')}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="ft-gate">
        <div className="ft-gate__card">
          <h1>{t('appTitle')}</h1>
          <p className="ft-gate__sub">{t('appSubtitle')}</p>
          <p className="ft-gate__body">{t('gateBody')}</p>
          <button type="button" className="ft-btn ft-btn--primary ft-gate__btn" onClick={signIn}>
            {t('signIn')}
          </button>
          {error && <p className="ft-err">{error}</p>}
          <p className="ft-gate__motto">{motto}</p>
        </div>
      </div>
    )
  }

  if (!isEditor) {
    return (
      <div className="ft-gate">
        <div className="ft-gate__card">
          <h1>{t('restrictedTitle')}</h1>
          <p className="ft-gate__body">{bg.restrictedBody(user.email ?? '')}</p>
          <button
            type="button"
            className="ft-btn ft-gate__btn"
            onClick={signOutUser}
          >
            {t('tryAnotherAccount')}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
