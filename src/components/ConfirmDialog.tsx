import { Button, Typography } from '@mui/material'
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
          <Button onClick={onCancel}>{t('close')}</Button>
        ) : (
          <>
            <Button onClick={onCancel} disabled={busy}>
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              color={danger ? 'error' : 'primary'}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? t('saving') : confirmLabel ?? t('confirmYes')}
            </Button>
          </>
        )
      }
    >
      <Typography>{blockedMessage ?? message}</Typography>
    </Modal>
  )
}
