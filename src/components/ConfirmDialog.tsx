import { Modal } from './Modal'
import { t } from '../lib/i18n'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  /** When set, the action is blocked and only a close button shows. */
  blockedMessage?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  busy,
  blockedMessage,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        blockedMessage ? (
          <button type="button" className="ft-btn" onClick={onCancel}>
            {t('close')}
          </button>
        ) : (
          <>
            <button type="button" className="ft-btn" onClick={onCancel} disabled={busy}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className={`ft-btn ${danger ? 'ft-btn--danger' : 'ft-btn--primary'}`}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? t('saving') : confirmLabel ?? t('confirmYes')}
            </button>
          </>
        )
      }
    >
      <p>{blockedMessage ?? message}</p>
    </Modal>
  )
}
