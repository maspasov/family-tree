import { useMemo, useRef, useState } from 'react'
import { t } from '../lib/i18n'
import { fullName, lifespan, type Person } from '../model/person'
import { useAuth } from '../auth/AuthContext'
import type { ChartLayout } from './FamilyChart'

interface Props {
  people: Person[]
  layout: ChartLayout
  onLayoutChange: (l: ChartLayout) => void
  onFocusPerson: (id: string) => void
  onFit: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onExportPng: () => void
  onExportJson: () => void
  onImport: () => void
  onAddRoot: () => void
}

export function Toolbar(props: Props) {
  const { user, isEditor, isViewerOnly, signIn, signOutUser } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<number | undefined>(undefined)

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('bg')
    if (!q) return []
    return props.people
      .filter((p) => fullName(p).toLocaleLowerCase('bg').includes(q))
      .slice(0, 8)
  }, [query, props.people])

  function pick(p: Person) {
    setQuery('')
    setOpen(false)
    props.onFocusPerson(p.id)
  }

  return (
    <header className="ft-toolbar">
      <div className="ft-toolbar__brand">
        <strong>{t('appTitle')}</strong>
        <span className="ft-toolbar__sub">{t('appSubtitle')}</span>
      </div>

      <div className="ft-toolbar__search">
        <input
          value={query}
          placeholder={t('search')}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 150)
          }}
        />
        {open && results.length > 0 && (
          <ul
            className="ft-toolbar__results"
            onMouseDown={() => window.clearTimeout(blurTimer.current)}
          >
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => pick(p)}>
                  {fullName(p)}
                  {lifespan(p) && <span className="ft-muted"> · {lifespan(p)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ft-toolbar__actions">
        <div className="ft-btngroup">
          <button type="button" className="ft-iconbtn" title={t('zoomOut')} onClick={props.onZoomOut}>
            −
          </button>
          <button type="button" className="ft-iconbtn" title={t('zoomIn')} onClick={props.onZoomIn}>
            +
          </button>
          <button type="button" className="ft-iconbtn" title={t('fit')} onClick={props.onFit}>
            ⤢
          </button>
        </div>
        <button type="button" className="ft-btn" onClick={props.onExpandAll}>
          {t('expandAll')}
        </button>
        <button type="button" className="ft-btn" onClick={props.onCollapseAll}>
          {t('collapseAll')}
        </button>
        <button
          type="button"
          className="ft-btn"
          onClick={() => props.onLayoutChange(props.layout === 'top' ? 'bottom' : 'top')}
          title="⇅"
        >
          {props.layout === 'top' ? '⬇ надолу' : '⬆ нагоре'}
        </button>
        <button type="button" className="ft-btn" onClick={props.onExportPng}>
          {t('exportPng')}
        </button>
        <button type="button" className="ft-btn" onClick={props.onExportJson}>
          {t('exportJson')}
        </button>

        {isEditor && (
          <>
            <button type="button" className="ft-btn" onClick={props.onImport}>
              {t('importJson')}
            </button>
            <button type="button" className="ft-btn ft-btn--primary" onClick={props.onAddRoot}>
              {props.people.length === 0 ? t('addRoot') : '+ ' + t('addChild')}
            </button>
          </>
        )}

        <div className="ft-toolbar__auth">
          {user ? (
            <>
              {user.photoURL && (
                <img className="ft-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              )}
              <span className="ft-toolbar__who">
                {user.displayName || user.email}
                <span className={`ft-badge ${isEditor ? 'ft-badge--ok' : ''}`}>
                  {isEditor ? t('editorBadge') : t('viewerBadge')}
                </span>
              </span>
              <button type="button" className="ft-btn" onClick={signOutUser}>
                {t('signOut')}
              </button>
            </>
          ) : (
            <button type="button" className="ft-btn ft-btn--primary" onClick={signIn}>
              {t('signIn')}
            </button>
          )}
        </div>
        {isViewerOnly && <p className="ft-toolbar__note">{t('notEditorHint')}</p>}
      </div>
    </header>
  )
}
