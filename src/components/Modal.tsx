import { useEffect, type ReactNode } from 'react'
import { t } from '../lib/i18n'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Optional footer (buttons). */
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, footer, wide }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="ft-modal__backdrop" onClick={onClose}>
      <div
        className={`ft-modal ${wide ? 'ft-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ft-modal__head">
          <h2>{title}</h2>
          <button
            type="button"
            className="ft-iconbtn"
            aria-label={t('close')}
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        <div className="ft-modal__body">{children}</div>
        {footer ? <footer className="ft-modal__foot">{footer}</footer> : null}
      </div>
    </div>
  )
}
